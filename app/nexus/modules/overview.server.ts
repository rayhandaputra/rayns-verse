import { APIProviderV2 } from "../core/api-provider-v2";

// ============================================
// TYPES
// ============================================

export interface OverviewStats {
  total_order_pending: number;
  total_order_process: number;
  total_order_done: number;
  total_order_done_this_month: number;
  total_revenue: number;
  total_revenue_this_month: number;
  total_revenue_this_year: number;
  total_paid: number;
  total_unpaid: number;
  avg_order_value: number;
}

export interface KknInstitutionItem {
  institution_id: string;
  institution_name: string;
  freq: number;
  total_sales: number;
}

// ============================================
// HELPER: Get last 6 months
// ============================================
function getLastSixMonths() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  }).reverse();
}

// ============================================
// API MODULE (Fully migrated to APIProviderV2)
// ============================================

export const OverviewAPI = {
  // ============================================================
  // ✅ SUMMARY — Dashboard overview stats
  // ============================================================
  summary: async ({ session, req }: any) => {
    try {
      // 1. Fetch all orders (no pagination) for aggregate stats
      const allOrders = await APIProviderV2(session)
        .Table("orders")
        .Select({
          columns: ["id", "status", "payment_status", "total_amount", "dp_amount", "grand_total", "order_date", "is_kkn", "is_sponsor", "institution_id", "institution_name", "kkn_period", "kkn_year", "created_on"],
          where: { deleted_on: "null" },
          size: 9999,
        })
        .Result();

      const orders = allOrders?.items || [];

      // 2. Compute stats from orders array
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      let total_order_amount = 0;
      let total_paid = 0;
      let total_dp = 0;
      let total_piutang = 0;
      let total_pending = 0;
      let total_confirmed = 0;
      let total_done = 0;
      let total_sponsor = 0;
      const institutionSet = new Set<string>();
      const sponsorSet = new Set<string>();

      for (const o of orders) {
        const amt = Number(o.total_amount) || 0;
        const dpAmt = Number(o.dp_amount) || 0;

        total_order_amount += amt;

        if (o.payment_status === "paid") total_paid += amt;
        if (o.payment_status === "down_payment") total_dp += dpAmt;
        if (["down_payment", "none", "unpaid"].includes(o.payment_status)) {
          total_piutang += amt - dpAmt;
        }

        if (o.status === "pending") total_pending++;
        if (o.status === "confirmed") total_confirmed++;
        if (o.status === "done") total_done++;

        if (+o.is_sponsor === 1) sponsorSet.add(o.institution_id);
        else institutionSet.add(o.institution_id);
      }

      // 3. Fetch total product sales
      const itemsRes = await APIProviderV2(session)
        .Table("order_items")
        .Select({
          columns: ["id", "qty"],
          where: { deleted_on: "null" },
          size: 9999,
        })
        .Result();

      const total_product_sales = (itemsRes?.items || []).reduce(
        (sum: number, item: any) => sum + (Number(item.qty) || 0), 0
      );

      // 4. Monthly report (last 6 months)
      const months = getLastSixMonths();
      const reportSixMonths: Record<string, number> = {};

      for (const m of months) {
        let omzet = 0;
        let lunas = 0;
        for (const o of orders) {
          const orderDate = new Date(o.order_date || o.created_on);
          if (orderDate.getMonth() + 1 === m.month && orderDate.getFullYear() === m.year) {
            omzet += Number(o.total_amount) || 0;
            if (o.payment_status === "paid") lunas += Number(o.total_amount) || 0;
          }
        }
        reportSixMonths[`omzet_${m.year}_${m.month}`] = omzet;
        reportSixMonths[`lunas_${m.year}_${m.month}`] = lunas;
      }

      // 5. Top institutions (group by institution_id + kkn_period)
      const instMap = new Map<string, { display_name: string; freq: number; total_sales: number }>();
      for (const o of orders) {
        const key = `${o.institution_id}_${o.kkn_period || ""}_${o.kkn_year || ""}`;
        const existing = instMap.get(key);
        const displayName = +o.is_kkn === 1 && o.kkn_period
          ? `${o.institution_name} ${o.kkn_year} - PERIODE ${o.kkn_period}`
          : o.institution_name;

        if (existing) {
          existing.freq++;
          existing.total_sales += Number(o.total_amount) || 0;
        } else {
          instMap.set(key, { display_name: displayName, freq: 1, total_sales: Number(o.total_amount) || 0 });
        }
      }

      const institutionRanks = Array.from(instMap.values())
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 10)
        .map((r) => ({ institution_name: r.display_name, freq: r.freq, total_sales: r.total_sales }));

      // 6. Highest order
      const paidOrders = orders.filter((o: any) => o.payment_status === "paid");
      const highestOrder = paidOrders.length > 0
        ? paidOrders.reduce((max: any, o: any) => (Number(o.total_amount) > Number(max.total_amount) ? o : max))
        : null;

      const avg_order_value = orders.length > 0 ? total_order_amount / orders.length : 0;

      return {
        total_order_amount,
        total_paid,
        total_dp,
        total_piutang: Math.max(0, total_piutang),
        total_pending,
        total_confirmed,
        total_done,
        total_product_sales,
        total_institution: institutionSet.size,
        total_sponsor: sponsorSet.size,
        avg_order_value: Math.round(avg_order_value),
        highest_order: highestOrder ? JSON.stringify({ id: highestOrder.id, institution_name: highestOrder.institution_name, total_amount: highestOrder.total_amount }) : null,
        institution_ranks: JSON.stringify(institutionRanks),
        report_six_months: reportSixMonths,
      };
    } catch (err) {
      console.error("❌ ERROR OverviewAPI.summary:", err);
      return {
        total_order_amount: 0, total_paid: 0, total_dp: 0, total_piutang: 0,
        total_pending: 0, total_confirmed: 0, total_done: 0, total_product_sales: 0,
        total_institution: 0, total_sponsor: 0, avg_order_value: 0,
        highest_order: null, institution_ranks: "[]", report_six_months: {},
      };
    }
  },

  // ============================================================
  // ✅ GET — Alias for summary
  // ============================================================
  get: async ({ session, req }: any) => {
    return OverviewAPI.summary({ session, req });
  },

  // ============================================================
  // ✅ GET KKN INSTITUTIONS
  // ============================================================
  getKknInstitutions: async ({ session, req }: any): Promise<KknInstitutionItem[]> => {
    try {
      const res = await APIProviderV2(session)
        .Table("orders")
        .Select({
          columns: ["institution_id", "institution_name", "kkn_period", "kkn_year", "is_kkn", "total_amount"],
          where: { deleted_on: "null", is_kkn: "1" },
          size: 9999,
        })
        .Result();

      const orders = res?.items || [];
      const instMap = new Map<string, { institution_id: string; institution_name: string; freq: number; total_sales: number }>();

      for (const o of orders) {
        const key = `${o.institution_id}_${o.kkn_period || ""}`;
        const displayName = o.kkn_period
          ? `${o.institution_name} ${o.kkn_year} - PERIODE ${o.kkn_period}`
          : o.institution_name;

        const existing = instMap.get(key);
        if (existing) {
          existing.freq++;
          existing.total_sales += Number(o.total_amount) || 0;
        } else {
          instMap.set(key, {
            institution_id: o.institution_id,
            institution_name: displayName,
            freq: 1,
            total_sales: Number(o.total_amount) || 0,
          });
        }
      }

      return Array.from(instMap.values())
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 50);
    } catch (err: any) {
      console.error("❌ ERROR OverviewAPI.getKknInstitutions:", err);
      return [];
    }
  },
};

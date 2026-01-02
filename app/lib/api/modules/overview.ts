import { APIProvider } from "../client";

// ============================================
// TYPES & INTERFACES
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

export interface MonthlyReport {
  month: number;
  year: number;
  month_name: string;
  total_orders: number;
  total_revenue: number;
  total_paid: number;
  total_unpaid: number;
}

export interface StatusBreakdown {
  status: string;
  status_label: string;
  count: number;
  percentage: number;
}

export interface PaymentBreakdown {
  payment_status: string;
  payment_label: string;
  count: number;
  total_amount: number;
  percentage: number;
}

export interface TopInstitution {
  institution_name: string;
  institution_abbr: string | null;
  order_count: number;
  total_revenue: number;
  avg_order_value: number;
}

export interface RecentOrder {
  id: number;
  order_number: string;
  institution_name: string;
  institution_abbr: string | null;
  status: string;
  payment_status: string;
  grand_total: number;
  created_on: string;
  deadline: string | null;
}

export interface OverviewResponse {
  stats: OverviewStats;
  monthly_report: MonthlyReport[];
  status_breakdown: StatusBreakdown[];
  payment_breakdown: PaymentBreakdown[];
  top_institutions: TopInstitution[];
  recent_orders: RecentOrder[];
}

// ============================================
// API MODULE
// ============================================

export const OverviewAPI = {
  // ============================================================
  // ✅ GET COMPREHENSIVE OVERVIEW
  // ============================================================
  get: async ({ req }: any): Promise<OverviewResponse> => {
    const { start_date, end_date, status, payment_status, institution_id } =
      req.query || {};

    try {
      // Build where clause for filtering
      const where: any = { deleted_on: "null" };
      if (status) where.status = status;
      if (payment_status) where.payment_status = payment_status;
      if (institution_id) where.institution_id = institution_id;

      // Date range filter
      if (start_date && end_date) {
        where.created_on = { between: [start_date, end_date] };
      } else if (start_date) {
        where.created_on = { gte: start_date };
      } else if (end_date) {
        where.created_on = { lte: end_date };
      }

      // ============================================
      // 1. MAIN STATS
      // ============================================
      const statsResult = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "orders",
        action: "select",
        body: {
          columns: [
            // Pending orders
            `(SELECT COUNT(id) FROM orders WHERE status = 'ordered' AND deleted_on IS NULL) AS total_order_pending`,

            // Processing orders
            `(SELECT COUNT(id) FROM orders WHERE status = 'confirmed' AND deleted_on IS NULL) AS total_order_process`,

            // Done orders (all time)
            `(SELECT COUNT(id) FROM orders WHERE status = 'done' AND deleted_on IS NULL) AS total_order_done`,

            // Done orders this month
            `(SELECT COUNT(id) FROM orders WHERE status = 'done' AND deleted_on IS NULL AND YEAR(created_on) = YEAR(CURRENT_DATE()) AND MONTH(created_on) = MONTH(CURRENT_DATE())) AS total_order_done_this_month`,

            // Total revenue (all time)
            `(SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE status = 'done' AND deleted_on IS NULL) AS total_revenue`,

            // Total revenue this month
            `(SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE status = 'done' AND deleted_on IS NULL AND YEAR(created_on) = YEAR(CURRENT_DATE()) AND MONTH(created_on) = MONTH(CURRENT_DATE())) AS total_revenue_this_month`,

            // Total revenue this year
            `(SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE status = 'done' AND deleted_on IS NULL AND YEAR(created_on) = YEAR(CURRENT_DATE())) AS total_revenue_this_year`,

            // Total paid (sum of all payments received)
            `(SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE payment_status IN ('paid', 'partial') AND deleted_on IS NULL) AS total_paid`,

            // Total unpaid (outstanding)
            `(SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE payment_status = 'unpaid' AND deleted_on IS NULL) AS total_unpaid`,

            // Average order value
            `(SELECT COALESCE(AVG(grand_total), 0) FROM orders WHERE deleted_on IS NULL) AS avg_order_value`,
          ],
          where: { id: { gte: 0 } }, // Dummy where to make query work
          size: 1,
        },
      });

      const stats: OverviewStats = statsResult.items?.[0] || {
        total_order_pending: 0,
        total_order_process: 0,
        total_order_done: 0,
        total_order_done_this_month: 0,
        total_revenue: 0,
        total_revenue_this_month: 0,
        total_revenue_this_year: 0,
        total_paid: 0,
        total_unpaid: 0,
        avg_order_value: 0,
      };

      // ============================================
      // 2. MONTHLY REPORT (Last 12 months)
      // ============================================
      const monthlyResult = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "orders",
        action: "select",
        body: {
          columns: [
            "MONTH(created_on) AS month",
            "YEAR(created_on) AS year",
            "COUNT(id) AS total_orders",
            "COALESCE(SUM(grand_total), 0) AS total_revenue",
            "COALESCE(SUM(CASE WHEN payment_status IN ('paid', 'partial') THEN grand_total ELSE 0 END), 0) AS total_paid",
            "COALESCE(SUM(CASE WHEN payment_status = 'unpaid' THEN grand_total ELSE 0 END), 0) AS total_unpaid",
          ],
          where: {
            deleted_on: "null",
            created_on: {
              gte: `DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)`,
            },
          },
          groupBy: "YEAR(created_on), MONTH(created_on)",
          order_by: { created_on: "desc" },
          size: 12,
        },
      });

      const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];

      const monthly_report: MonthlyReport[] = (monthlyResult.items || []).map(
        (item: any) => ({
          month: Number(item.month),
          year: Number(item.year),
          month_name: monthNames[Number(item.month) - 1],
          total_orders: Number(item.total_orders),
          total_revenue: Number(item.total_revenue),
          total_paid: Number(item.total_paid),
          total_unpaid: Number(item.total_unpaid),
        })
      );

      // ============================================
      // 3. STATUS BREAKDOWN
      // ============================================
      const statusResult = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "orders",
        action: "select",
        body: {
          columns: [
            "status",
            "COUNT(id) AS count",
            "(COUNT(id) * 100.0 / (SELECT COUNT(*) FROM orders WHERE deleted_on IS NULL)) AS percentage",
          ],
          where: { deleted_on: "null" },
          groupBy: "status",
          order_by: { count: "desc" },
        },
      });

      const statusLabels: Record<string, string> = {
        ordered: "Pesanan Masuk",
        confirmed: "Sedang Dikerjakan",
        done: "Selesai",
        cancelled: "Dibatalkan",
      };

      const status_breakdown: StatusBreakdown[] = (
        statusResult.items || []
      ).map((item: any) => ({
        status: item.status,
        status_label: statusLabels[item.status] || item.status,
        count: Number(item.count),
        percentage: Number(item.percentage) || 0,
      }));

      // ============================================
      // 4. PAYMENT BREAKDOWN
      // ============================================
      const paymentResult = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "orders",
        action: "select",
        body: {
          columns: [
            "payment_status",
            "COUNT(id) AS count",
            "COALESCE(SUM(grand_total), 0) AS total_amount",
            "(COUNT(id) * 100.0 / (SELECT COUNT(*) FROM orders WHERE deleted_on IS NULL)) AS percentage",
          ],
          where: { deleted_on: "null" },
          groupBy: "payment_status",
          order_by: { count: "desc" },
        },
      });

      const paymentLabels: Record<string, string> = {
        unpaid: "Belum Dibayar",
        partial: "DP / Sebagian",
        paid: "Lunas",
      };

      const payment_breakdown: PaymentBreakdown[] = (
        paymentResult.items || []
      ).map((item: any) => ({
        payment_status: item.payment_status,
        payment_label:
          paymentLabels[item.payment_status] || item.payment_status,
        count: Number(item.count),
        total_amount: Number(item.total_amount),
        percentage: Number(item.percentage) || 0,
      }));

      // ============================================
      // 5. TOP INSTITUTIONS (by order count)
      // ============================================
      const topInstResult = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "orders",
        action: "select",
        body: {
          columns: [
            "institution_name",
            "institution_abbr",
            "COUNT(id) AS order_count",
            "COALESCE(SUM(grand_total), 0) AS total_revenue",
            "COALESCE(AVG(grand_total), 0) AS avg_order_value",
          ],
          where: { deleted_on: "null" },
          groupBy: "institution_name, institution_abbr",
          order_by: { order_count: "desc" },
          size: 10,
        },
      });

      const top_institutions: TopInstitution[] = (
        topInstResult.items || []
      ).map((item: any) => ({
        institution_name: item.institution_name,
        institution_abbr: item.institution_abbr,
        order_count: Number(item.order_count),
        total_revenue: Number(item.total_revenue),
        avg_order_value: Number(item.avg_order_value),
      }));

      // ============================================
      // 6. RECENT ORDERS (Last 10)
      // ============================================
      const recentResult = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "orders",
        action: "select",
        body: {
          columns: [
            "id",
            "order_number",
            "institution_name",
            "institution_abbr",
            "status",
            "payment_status",
            "grand_total",
            "created_on",
            "deadline",
          ],
          where: { deleted_on: "null" },
          order_by: { created_on: "desc" },
          size: 10,
        },
      });

      const recent_orders: RecentOrder[] = (recentResult.items || []).map(
        (item: any) => ({
          id: Number(item.id),
          order_number: item.order_number,
          institution_name: item.institution_name,
          institution_abbr: item.institution_abbr,
          status: item.status,
          payment_status: item.payment_status,
          grand_total: Number(item.grand_total),
          created_on: item.created_on,
          deadline: item.deadline,
        })
      );

      // ============================================
      // RETURN COMPREHENSIVE OVERVIEW
      // ============================================
      return {
        stats,
        monthly_report,
        status_breakdown,
        payment_breakdown,
        top_institutions,
        recent_orders,
      };
    } catch (err: any) {
      console.error("❌ ERROR OverviewAPI.get:", err);

      // Return empty data structure on error
      return {
        stats: {
          total_order_pending: 0,
          total_order_process: 0,
          total_order_done: 0,
          total_order_done_this_month: 0,
          total_revenue: 0,
          total_revenue_this_month: 0,
          total_revenue_this_year: 0,
          total_paid: 0,
          total_unpaid: 0,
          avg_order_value: 0,
        },
        monthly_report: [],
        status_breakdown: [],
        payment_breakdown: [],
        top_institutions: [],
        recent_orders: [],
      };
    }
  },
  summary: async ({ req }: any) => {
    try {
      const order = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "orders",
        action: "select",
        body: {
          columns: [
            `(SELECT SUM(total_amount) FROM orders WHERE deleted_on IS NULL) AS total_order_amount`,
            `(SELECT SUM(total_amount) FROM orders WHERE payment_status = 'paid' AND deleted_on IS NULL) AS total_paid`,
            `(SELECT SUM(dp_amount) FROM orders WHERE payment_status = 'down_payment' AND deleted_on IS NULL) AS total_dp`,
            `(SELECT SUM(total_amount - dp_amount) FROM orders WHERE payment_status IN ('down_payment', 'none') AND deleted_on IS NULL) AS total_piutang`,
            `(SELECT COUNT(id) FROM orders WHERE status = 'pending' AND deleted_on IS NULL) AS total_pending`,
            `(SELECT COUNT(id) FROM orders WHERE status = 'confirmed' AND deleted_on IS NULL) AS total_confirmed`,
            `(SELECT COUNT(id) FROM orders WHERE status = 'done' AND deleted_on IS NULL) AS total_done`,
            `(SELECT SUM(qty) FROM order_items WHERE deleted_on IS NULL) AS total_product_sales`,
            `(SELECT COUNT(DISTINCT institution_id) FROM orders WHERE is_sponsor = 0 AND deleted_on IS NULL) AS total_institution`,
            `(SELECT COUNT(DISTINCT institution_id) FROM orders WHERE is_sponsor = 1 AND deleted_on IS NULL) AS total_sponsor`,
            `(SELECT JSON_OBJECT(
                'id', id, 
                'institution_name', institution_name, 
                'total_amount', total_amount
            ) FROM orders 
              WHERE payment_status = 'paid' AND deleted_on IS NULL 
              ORDER BY total_amount DESC LIMIT 1) AS highest_order`,
            `(SELECT COALESCE(SUM(grand_total), 0) / COUNT(id) FROM orders WHERE deleted_on IS NULL) AS avg_order_value`,
            // `(
            //   SELECT JSON_ARRAYAGG(
            //     JSON_OBJECT(
            //       'institution_name', top_ten.institution_name,
            //       'freq', top_ten.freq,
            //       'total_sales', top_ten.total_sales
            //     )
            //   )
            //   FROM (
            //     SELECT
            //       institution_id,
            //       institution_name,
            //       COUNT(id) AS freq,
            //       SUM(total_amount) AS total_sales
            //     FROM orders
            //     WHERE deleted_on IS NULL
            //     GROUP BY institution_id, kkn_period, kkn_year
            //     ORDER BY total_sales DESC
            //     LIMIT 10
            //   ) AS top_ten
            // ) AS institution_ranks`,
            `(
              SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                  'institution_name', top_ten.display_name,
                  'freq', top_ten.freq,
                  'total_sales', top_ten.total_sales
                )
              )
              FROM (
                SELECT 
                  institution_id, 
                  -- Logika penambahan teks periode
                  CASE 
                    WHEN is_kkn = 1 AND kkn_period IS NOT NULL AND kkn_period != '' AND kkn_period != '0'
                    THEN CONCAT(institution_name, ' ', kkn_year, ' - PERIODE ', kkn_period)
                    ELSE institution_name 
                  END AS display_name,
                  COUNT(id) AS freq,
                  SUM(total_amount) AS total_sales
                FROM orders
                WHERE deleted_on IS NULL
                GROUP BY institution_id, kkn_period, kkn_year
                ORDER BY total_sales DESC
                LIMIT 10
              ) AS top_ten
            ) AS institution_ranks`,
          ],
          where: { deleted_on: "null" },
          size: 1,
        },
      });

      const getLastSixMonths = () => {
        return Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          return {
            month: d.getMonth() + 1,
            year: d.getFullYear(),
            label: d.toLocaleString("id-ID", { month: "long" }),
          };
        }).reverse();
      };

      const months = getLastSixMonths();

      // Buat 2 kolom per bulan: Total Omzet & Total Paid
      const monthlySubqueries = months.flatMap((m) => {
        const monthLabel = +m.month;
        return [
          // Kolom 1: Total Semua (Tanpa filter payment_status)
          `SUM(IF(MONTH(order_date) = ${m.month} AND YEAR(order_date) = ${m.year}, total_amount, 0)) AS total_${monthLabel}`,

          // Kolom 2: Total Paid Sahaja
          `SUM(IF(MONTH(order_date) = ${m.month} AND YEAR(order_date) = ${m.year} AND payment_status = 'paid', total_amount, 0)) AS paid_${monthLabel}`,
        ];
      });

      const quartarlySixMonths = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "orders",
        action: "select",
        body: {
          columns: [...monthlySubqueries],
          where: { deleted_on: "null" },
          size: 1,
        },
      });

      const dataGrafik = quartarlySixMonths.items[0];

      return {
        ...order.items?.[0],
        report_six_months: dataGrafik,
      };
    } catch (err) {
      console.error("❌ ERROR OverviewAPI.summary:", err);
    }
  },
  getStats: async ({ req }: any): Promise<OverviewStats> => {
    try {
      const result = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "orders",
        action: "select",
        body: {
          columns: [
            `(SELECT COUNT(id) FROM orders WHERE status = 'ordered' AND deleted_on IS NULL) AS total_order_pending`,
            `(SELECT COUNT(id) FROM orders WHERE status = 'confirmed' AND deleted_on IS NULL) AS total_order_process`,
            `(SELECT COUNT(id) FROM orders WHERE status = 'done' AND deleted_on IS NULL) AS total_order_done`,
            `(SELECT COUNT(id) FROM orders WHERE status = 'done' AND deleted_on IS NULL AND YEAR(created_on) = YEAR(CURRENT_DATE()) AND MONTH(created_on) = MONTH(CURRENT_DATE())) AS total_order_done_this_month`,
            `(SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE status = 'done' AND deleted_on IS NULL) AS total_revenue`,
            `(SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE status = 'done' AND deleted_on IS NULL AND YEAR(created_on) = YEAR(CURRENT_DATE()) AND MONTH(created_on) = MONTH(CURRENT_DATE())) AS total_revenue_this_month`,
            `(SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE status = 'done' AND deleted_on IS NULL AND YEAR(created_on) = YEAR(CURRENT_DATE())) AS total_revenue_this_year`,
            `(SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE payment_status IN ('paid', 'partial') AND deleted_on IS NULL) AS total_paid`,
            `(SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE payment_status = 'unpaid' AND deleted_on IS NULL) AS total_unpaid`,
            `(SELECT COALESCE(AVG(grand_total), 0) FROM orders WHERE deleted_on IS NULL) AS avg_order_value`,
          ],
          where: { id: { gte: 0 } },
          size: 1,
        },
      });

      return (
        result.items?.[0] || {
          total_order_pending: 0,
          total_order_process: 0,
          total_order_done: 0,
          total_order_done_this_month: 0,
          total_revenue: 0,
          total_revenue_this_month: 0,
          total_revenue_this_year: 0,
          total_paid: 0,
          total_unpaid: 0,
          avg_order_value: 0,
        }
      );
    } catch (err: any) {
      console.error("❌ ERROR OverviewAPI.getStats:", err);
      return {
        total_order_pending: 0,
        total_order_process: 0,
        total_order_done: 0,
        total_order_done_this_month: 0,
        total_revenue: 0,
        total_revenue_this_month: 0,
        total_revenue_this_year: 0,
        total_paid: 0,
        total_unpaid: 0,
        avg_order_value: 0,
      };
    }
  },
};

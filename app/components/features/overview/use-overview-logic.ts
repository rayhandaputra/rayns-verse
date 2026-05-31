
import { useMemo } from "react";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import type { Order, StockState, PriceList } from "~/types";
import {
    mlPerPaket,
    ROLL_CM,
    CM_PER_LANYARD,
    A4_PER_PAKET,
    TAPE_CM_PER_ROLL,
    LANYARD_PER_ROLL,
    RIVET_PER_PAKET,
    PLASTIC_SMALL_CAP,
    PLASTIC_MED_CAP,
    PLASTIC_BIG_CAP,
    INK_SET_ML,
} from "~/constants";

export function useOverviewLogic() {
    const { data: overviewData, loading: loadingOverview } = useFetcherData({
        endpoint: "/api/nexus",
        params: {
            module: "OVERVIEW",
            action: "summary",
        },
    });

    const { data: ordersData, loading: loadingOrders } = useFetcherData({
        endpoint: "/api/nexus",
        params: {
            module: "ORDERS",
            action: "get",
            pagination: "true",
            page: 0,
            size: 5,
        },
    });

    const { data: stockData } = useFetcherData({
        endpoint: "/api/nexus",
        params: {
            module: "COMMODITY_STOCK",
            action: "get",
            size: 100,
            pagination: "false",
        },
    });

    const { data: supplierCommodityData } = useFetcherData({
        endpoint: "/api/nexus",
        params: {
            module: "SUPPLIER_COMMODITY",
            action: "get",
            size: 1000,
            pagination: "false",
        },
    });

    const overview = overviewData?.data || {};
    const orders: Order[] = ordersData?.data?.items || [];

    const stock = useMemo(() => {
        const result: StockState = {};
        if (stockData?.data?.items) {
            stockData.data.items.forEach((item: any) => {
                result[item.code] = Number(item.stock || 0);
            });
        }
        return result;
    }, [stockData]);

    const prices = useMemo(() => {
        const result: PriceList = {};
        if (supplierCommodityData?.data?.items && stockData?.data?.items) {
            stockData.data.items.forEach((commodity: any) => {
                const supplierPrices = supplierCommodityData.data.items.filter(
                    (sc: any) => sc.commodity_id === commodity.id
                );

                if (supplierPrices.length > 0) {
                    const avgPrice =
                        supplierPrices.reduce(
                            (sum: number, sc: any) => sum + Number(sc.price || 0),
                            0
                        ) / supplierPrices.length;
                    result[commodity.code] = avgPrice;
                }
            });
        }
        return result;
    }, [supplierCommodityData, stockData]);

    const metrics = useMemo(() => {
        const s = stock || {};
        const p = prices || {};

        // Capacity (Paket)
        const cap_tinta =
            (s.tinta_ml || 0) > 0 ? Math.floor((s.tinta_ml || 0) / mlPerPaket()) : 0;
        const cap_roll = Math.floor(
            (s.roll_100m || 0) * Math.floor(ROLL_CM / CM_PER_LANYARD)
        );
        const cap_a4 = Math.floor((s.a4_sheets || 0) * (1 / A4_PER_PAKET));
        const cap_tape = Math.floor(
            (s.tape_roll || 0) * Math.floor(TAPE_CM_PER_ROLL / 38.75)
        );
        const cap_lan = Math.floor(
            (s.lanyard_roll || 0) * LANYARD_PER_ROLL + (s.lanyard_pcs || 0)
        );
        const cap_pvc = s.pvc_pcs || 0;
        const cap_case = s.case_pcs || 0;
        const cap_kait = s.kait_pcs || 0;
        const cap_stop = s.stopper_pcs || 0;
        const cap_rivet = Math.floor((s.rivet_pcs || 0) / RIVET_PER_PAKET);
        const cap_plast =
            (s.plastic_small_pcs || 0) * PLASTIC_SMALL_CAP +
            (s.plastic_med_pcs || 0) * PLASTIC_MED_CAP +
            (s.plastic_big_pcs || 0) * PLASTIC_BIG_CAP;

        const allCaps = [
            cap_tinta,
            cap_roll,
            cap_a4,
            cap_tape,
            cap_lan,
            cap_pvc,
            cap_case,
            cap_kait,
            cap_stop,
            cap_rivet,
            cap_plast,
        ];
        const maxPackage = allCaps.length > 0 ? Math.min(...allCaps) : 0;

        // Cost Per Package (CPP) - with fallback to 0
        const c_tinta = ((p.ink_set || 0) / INK_SET_ML) * mlPerPaket() || 0;
        const c_roll = (p.roll_100m || 0) / (ROLL_CM / CM_PER_LANYARD) || 0;
        const c_a4 = ((p.a4_pack || 0) * A4_PER_PAKET) / 100 || 0;
        const c_tape = (p.tape_roll || 0) / (TAPE_CM_PER_ROLL / 38.75) || 0;
        const c_lanyard = (p.lanyard_roll || 0) / LANYARD_PER_ROLL || 0;
        const c_pvc = (p.pvc_pack || 0) / 250 || 0;
        const c_case = p.case_unit || 0;
        const c_kait = p.kait_unit || 0;
        const c_stop = (p.stopper_pack || 0) / 120 || 0;
        const c_rivet = (p.rivet_pack || 0) / 500 || 0;

        const num =
            (s.plastic_small_pcs || 0) * (p.plastic_small_unit || 0) +
            (s.plastic_med_pcs || 0) * (p.plastic_med_unit || 0) +
            (s.plastic_big_pcs || 0) * (p.plastic_big_unit || 0);
        const den =
            (s.plastic_small_pcs || 0) * PLASTIC_SMALL_CAP +
            (s.plastic_med_pcs || 0) * PLASTIC_MED_CAP +
            (s.plastic_big_pcs || 0) * PLASTIC_BIG_CAP;
        const c_plast =
            den > 0
                ? num / den
                : Math.min(
                    (p.plastic_small_unit || 0) / PLASTIC_SMALL_CAP || 0,
                    (p.plastic_med_unit || 0) / PLASTIC_MED_CAP || 0
                );

        const cpp =
            c_tinta +
            c_roll +
            c_a4 +
            c_tape +
            c_lanyard +
            c_pvc +
            c_case +
            c_kait +
            c_stop +
            c_rivet +
            (c_plast || 0);

        return {
            maxPackage: (isNaN(maxPackage) || maxPackage === Infinity || maxPackage === -Infinity) ? 0 : maxPackage,
            cpp: (isNaN(cpp) || cpp === Infinity || cpp === -Infinity) ? 0 : cpp
        };
    }, [stock, prices]);

    const monthlyData = useMemo(() => {
        const report = (overview?.report_six_months || {}) as Record<string, number>;
        const now = new Date();
        const result = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            // Support both old format (total_M, paid_M) and new format (omzet_Y_M, lunas_Y_M)
            const totalKey = `omzet_${y}_${m}`;
            const paidKey = `lunas_${y}_${m}`;
            const totalLegacy = `total_${m}`;
            const paidLegacy = `paid_${m}`;
            result.push({
                name: d.toLocaleDateString("id-ID", { month: "long" }),
                total: Number(report[totalKey] || report[totalLegacy] || 0),
                paid: Number(report[paidKey] || report[paidLegacy] || 0),
            });
        }
        return result;
    }, [overview]);

    return {
        loading: loadingOverview || loadingOrders,
        overview,
        orders,
        stock,
        prices,
        metrics,
        monthlyData,
    };
}

import { useMemo } from "react";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/lib/nexus-client";

export const useStockLogic = () => {
  // 1. Fetch Master Data (Settings, Components, Commodities)
  const { data: settingsRes } = useFetcherData({
    endpoint: nexus().module("SETTINGS").action("get").build(),
  });

  const { data: componentsRes, reload: reloadStock } = useFetcherData({
    endpoint: nexus()
      .module("COMPONENTS")
      .action("get")
      .params({ pagination: "false" })
      .build(),
  });

  const { data: commoditiesRes } = useFetcherData({
    endpoint: nexus()
      .module("COMMODITIES")
      .action("get")
      .params({ size: 100 })
      .build(),
  });

  // 2. Transform Settings ke Map agar mudah diakses
  const config = useMemo(() => {
    const map: Record<string, any> = {};
    settingsRes?.data?.items?.forEach((s: any) => {
      map[s.key] = s.value;
    });
    return map;
  }, [settingsRes]);

  // 3. Kalkulasi Kapasitas Dinamis berdasarkan Database
  const metrics = useMemo(() => {
    const components = componentsRes?.data?.items || [];

    const allCaps = components.map((c: any) => ({
      name: c.name,
      stock: Number(c.stock_qty),
      unit: c.unit,
      // Rumus sekarang dinamis: Stok / Requirement dari DB
      val: Math.floor(Number(c.stock_qty) / Number(c.requirement_per_pkt || 1)),
    }));

    const maxPackage =
      allCaps.length > 0 ? Math.min(...allCaps.map((c: any) => c.val)) : 0;

    return { allCaps, maxPackage };
  }, [componentsRes]);

  return {
    config,
    metrics,
    materials: commoditiesRes?.data?.items || [],
    reloadStock,
  };
};

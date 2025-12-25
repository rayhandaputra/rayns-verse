import { safeParseArray } from "~/lib/utils";
import { APIProvider } from "../client";

export const CommoditiesAPI = {
  get: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      id,
    } = req.query || {};

    let where: any = {};
    if (id) where.id = id;
    where.deleted_on = "null";

    const searchConfig = search
      ? {
          logic: "or",
          fields: ["code", "name"],
          keyword: search,
        }
      : undefined;

    try {
      const result = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "commodities",
        action: "select",
        body: {
          // Mengambil detail komoditas beserta info komponen asalnya
          columns: [
            "id",
            "uid",
            "component_id",
            "code",
            "name",
            "unit",
            "conversion_factor",
            "base_price",
          ],
          where,
          search: searchConfig,
          page: Number(page),
          size: Number(size),
          pagination: pagination === "true",
          orderBy: ["created_on", "desc"],
          // Jika API backend Anda mendukung join otomatis:
          // with: ["components"]
        },
      });

      return {
        total_items: result.total_items || 0,
        items: safeParseArray(result.items),
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ ERROR CommoditiesAPI.get:", err);
      return { total_items: 0, items: [], error: err.message };
    }
  },
};

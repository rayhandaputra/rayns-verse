import { safeParseArray } from "~/lib/utils";
import { APIProvider } from "../client";

export const ComponentsAPI = {
  get: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      id,
      sort = "",
    } = req.query || {};

    let where: any = {};
    if (id) where.id = id;
    where.deleted_on = "null"; // Mengikuti standar soft delete Anda

    const searchConfig = search
      ? {
          logic: "or",
          fields: ["code", "name"],
          keyword: search,
        }
      : undefined;

    let sort_by = "created_on";
    let sort_type = "desc";
    if (sort) {
      const [column, type] = sort.split(":");
      sort_by = column;
      sort_type = type;
    }

    try {
      const result = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "components",
        action: "select",
        body: {
          columns: [
            "id",
            "code",
            "name",
            "unit",
            "stock_qty",
            "requirement_per_pkt",
            "created_on",
          ],
          where,
          search: searchConfig,
          page: Number(page),
          size: Number(size),
          pagination: pagination === "true",
          orderBy: [sort_by, sort_type],
        },
      });

      return {
        total_items: result.total_items || 0,
        items: safeParseArray(result.items),
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ ERROR ComponentsAPI.get:", err);
      return { total_items: 0, items: [], error: err.message };
    }
  },
};

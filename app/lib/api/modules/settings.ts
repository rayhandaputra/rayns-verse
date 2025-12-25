import { safeParseArray, safeParseObject } from "~/lib/utils";
import { APIProvider } from "../client";
import moment from "moment";

export const SettingsAPI = {
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
    where.deleted_on = "null";

    // ✅ SEARCH MULTI FIELD (format OR)
    const searchConfig = search
      ? {
          logic: "or",
          fields: ["key", "value", "description"],
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
        table: "settings",
        action: "select",
        body: {
          columns: [
            "id",
            "`key`",
            "`value`",
            "description",
            "created_on",
            "modified_on",
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
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ ERROR SettingsAPI.get:", err);

      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message,
      };
    }
  },
};

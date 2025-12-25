import { safeParseArray, safeParseObject } from "~/lib/utils";
import { APIProvider } from "../client";
import moment from "moment";

export const RestockAPI = {
  create: async ({ req }: any) => {
    const { items = [] } = req.body || {};

    try {
      await APIProvider({
        endpoint: "bulk-insert",
        method: "POST",
        table: "supplier_commodities",
        action: "bulk-insert",
        body: {
          rows: items,
          updateOnDuplicate: true,
        },
      });

      return {
        success: true,
        message: "Restock berhasil dibuat",
      };
    } catch (err: any) {
      console.error("❌ ERROR RestockAPI.create:", err);
      return { success: false, message: err.message };
    }
  },
};

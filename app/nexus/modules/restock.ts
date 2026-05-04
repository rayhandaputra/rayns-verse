import { safeParseArray, safeParseObject } from "~/utils/utils";
import { APIProvider } from "..";
import moment from "moment";

export const RestockAPI = {
  create: async ({ session, req }: any) => {
    const { items = [] } = req.body || {};

    try {
      await APIProvider(session)
        .Endpoint("POST", "bulk-insert", "supplier_commodities")
        .Data({
          rows: items,
          updateOnDuplicate: true,
        })
        .Result();

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

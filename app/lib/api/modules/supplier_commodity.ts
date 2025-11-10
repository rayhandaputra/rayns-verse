import { APIProvider } from "../client";

export const SupplierCommodityAPI = {
  get: async ({ req }: any) => {
    const { page = 0, size = 10, supplier_id, search } = req.query || {};

    try {
      const result = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "supplier_commodities",
        action: "select",
        body: {
          columns: [
            "id",
            "supplier_id",
            "commodity_id",
            "commodity_name",
            "qty",
            "price"
          ],
          where: {
            ...(supplier_id ? { supplier_id } : {}),
            deleted_on: "null"
          },
          page: Number(page),
          size: Number(size),
          search: search || null
        }
      });

      return {
        total_items: result.total_items || result.items?.length || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1
      };
    } catch (err: any) {
      console.error(err);
      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message
      };
    }
  },

  bulkCreate: async ({ req }: any) => {
    const { commodities } = req.body || {};

    if (!commodities || !Array.isArray(commodities)) {
      return { success: false, message: "Komponen wajib diisi dalam bentuk array" };
    }

    try {
      const result = await APIProvider({
        endpoint: "bulk_insert",
        method: "POST",
        table: "supplier_commodities",
        action: "bulk_insert",
        body: {
          updateOnDuplicate: true,
          rows: commodities
        }
      });

      return {
        success: true,
        message: "Stok supplier berhasil diperbarui",
        inserted: result.inserted_rows,
        update_on_duplicate: result.update_on_duplicate
      };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  }
};

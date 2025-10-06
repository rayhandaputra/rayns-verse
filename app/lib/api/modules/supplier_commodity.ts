import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const SupplierCommodityAPI = {
    get: async ({ req }: any) => {
      const { page = 0, size = 10, supplier_id, search } = req.query || {};

      try {
        const result = await callApi({
          table: "supplier_commodities",
          action: "select", // pakai endpoint custom di PHP
          columns: [
            "id",
            "supplier_id",
            "commodity_id",
            "commodity_name",
            "qty",
            "price",
          ],
          where: {
            ...(supplier_id && { supplier_id: supplier_id }),
            deleted_on: "null",
          },
          page: +page || 0,
          size: +size || 10,
          search: search || null,
        });

        return {
          total_items: result.total_items || result.items?.length || 0,
          items: result.items || [],
          current_page: Number(page),
          total_pages: result.total_pages || 1,
        };
      } catch (err: any) {
        console.error(err);
        return {
          total_items: 0,
          items: [],
          current_page: Number(page),
          total_pages: 0,
          error: err.message,
        };
      }
    },
    bulkCreate: async ({ req }: any) => {
      const { commodities } = req.body || {};

      if (!commodities) {
        return { success: false, message: "Komponen wajib diisi" };
      }

      try {
        const result = await callApi({
          action: "bulk_insert",
          table: "supplier_commodities",
          updateOnDuplicate: true,
          rows: commodities,
        });

        return {
          success: true,
          message: "Stok Toko berhasil diperbaharui",
          user: { id: result.insert_id, ...commodities },
        };
      } catch (err: any) {
        console.log(err);
        return { success: false, message: err.message };
      }
    },
  }
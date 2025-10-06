import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const CommodityStockAPI = {
    // === GET STOCK LIST ===
    get: async ({ req }: any) => {
      const { page = 0, size = 10, search } = req.query || {};

      try {
        const result = await callApi({
          table: "commodities",
          action: "get_stock", // pakai endpoint custom di PHP
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

    // === RESTOCK ITEM ===
    restock: async ({ req }: any) => {
      const { supplier_id, commodity_id, qty } = req.body || {};

      if (!supplier_id || !commodity_id || !qty) {
        return {
          success: false,
          message: "supplier_id, commodity_id, dan qty wajib diisi",
        };
      }

      try {
        const result = await callApi({
          action: "restock",
          supplier_id,
          commodity_id,
          qty,
        });

        return {
          success: true,
          message: "Restock berhasil",
          restock_id: result.restock_id,
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },

    // === CONSUME STOCK (Produksi) ===
    consume: async ({ req }: any) => {
      const { commodity_id, qty } = req.body || {};

      if (!commodity_id || !qty) {
        return {
          success: false,
          message: "commodity_id dan qty wajib diisi",
        };
      }

      try {
        const result = await callApi({
          action: "consume",
          commodity_id,
          qty,
        });

        return {
          success: true,
          message: "Stok berhasil dikurangi",
          consumed_id: result.consumed_id,
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },

    // === GET LOGS ===
    logs: async ({ req }: any) => {
      const { commodity_id, supplier_id } = req.query || {};

      try {
        const result = await callApi({
          action: "get_logs",
          commodity_id,
          supplier_id,
        });

        return {
          success: true,
          items: result.items || [],
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },

    // === CREATE ITEM (Commodity) ===
    createCommodity: async ({ req }: any) => {
      const { code, name, unit } = req.body || {};

      if (!code || !name || !unit) {
        return {
          success: false,
          message: "code, name, dan unit wajib diisi",
        };
      }

      const newCommodity = {
        code,
        name,
        unit,
        created_on: new Date().toISOString(),
      };

      try {
        const result = await callApi({
          action: "insert",
          table: "commodities",
          data: newCommodity,
        });

        return {
          success: true,
          message: "Commodity berhasil dibuat",
          commodity: { id: result.insert_id, ...newCommodity },
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },

    // === UPDATE ITEM (Commodity) ===
    updateCommodity: async ({ req }: any) => {
      const { id, code, name, unit } = req.body || {};

      if (!id) {
        return { success: false, message: "id wajib diisi" };
      }

      const updateData: any = {};
      if (code) updateData.code = code;
      if (name) updateData.name = name;
      if (unit) updateData.unit = unit;
      updateData.modified_on = new Date().toISOString();

      try {
        await callApi({
          action: "update",
          table: "commodities",
          data: updateData,
          where: { id },
        });

        return { success: true, message: "Commodity berhasil diupdate" };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
  }
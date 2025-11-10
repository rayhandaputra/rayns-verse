import { APIProvider } from "../client";

export const CommodityAPI = {
  // ✅ GET / LIST
  get: async ({ req }: any) => {
    const { pagination = "true", page = 0, size = 10, search } = req.query || {};

    try {
      const result = await APIProvider({
        endpoint: "select",
        action: "select",
        table: "commodities",
        method: "POST",
        body: {
          columns: ["id", "code", "name", "unit", "base_price"],
          where: { deleted_on: "null" },
          search,
          pagination: pagination === "true",
          page: Number(page),
          size: Number(size),
        },
      });

      return {
        total_items: result.total_items || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("CommodityAPI.get error:", err);
      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message,
      };
    }
  },

  // ✅ CREATE
  create: async ({ req }: any) => {
    const { code, name, unit = "pcs", base_price = 0 } = req.body || {};

    if (!code || !name) {
      return { success: false, message: "Kode dan Nama wajib diisi" };
    }

    const newRow = {
      code,
      name,
      unit,
      base_price,
    };

    try {
      const result = await APIProvider({
        endpoint: "insert",
        action: "insert",
        table: "commodities",
        body: {
          data: newRow,
        },
      });

      return {
        success: true,
        message: "Komponen berhasil dibuat",
        data: { id: result.insert_id, ...newRow },
      };
    } catch (err: any) {
      console.error("CommodityAPI.create error:", err);
      return { success: false, message: err.message };
    }
  },

  // ✅ UPDATE
  update: async ({ req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) return { success: false, message: "ID wajib diisi" };

    const updatedData: Record<string, any> = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    try {
      const result = await APIProvider({
        endpoint: "update",
        action: "update",
        table: "commodities",
        body: {
          data: updatedData,
          where: { id },
        },
      });

      return {
        success: true,
        message: "Komponen berhasil diperbarui",
        affected: result.affected_rows,
      };
    } catch (err: any) {
      console.error("CommodityAPI.update error:", err);
      return { success: false, message: err.message };
    }
  },
};

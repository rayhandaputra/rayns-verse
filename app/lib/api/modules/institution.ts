import { APIProvider } from "../client";


export const InstitutionAPI = {
  // ✅ SELECT / LIST
  get: async ({ req }: any) => {
    const { pagination = "true", page = 0, size = 10, search } = req.query || {};

    try {
      const result = await APIProvider({
        endpoint: "select",
        table: "institutions",
        action: "select",
        method: "POST",
        body: {
          columns: ["id", "name", "abbr"],
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
      console.error("InstitutionAPI.get error:", err);
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
    const { name } = req.body || {};
    if (!name) return { success: false, message: "Nama wajib diisi" };

    const newRow = { name };

    try {
      const result = await APIProvider({
        endpoint: "insert",
        action: "insert",
        table: "institutions",
        body: {
          data: newRow,
        },
      });

      return {
        success: true,
        message: "Institusi berhasil ditambahkan",
        data: { id: result.insert_id, ...newRow },
      };
    } catch (err: any) {
      console.error("InstitutionAPI.create error:", err);
      return { success: false, message: err.message };
    }
  },

  // ✅ UPDATE
  update: async ({ req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) return { success: false, message: "ID wajib diisi" };

    const updatedData = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    try {
      const result = await APIProvider({
        endpoint: "update",
        action: "update",
        table: "institutions",
        body: {
          data: updatedData,
          where: { id },
        },
      });

      return {
        success: true,
        message: "Institusi berhasil diperbarui",
        affected: result.affected_rows,
      };
    } catch (err: any) {
      console.error("InstitutionAPI.update error:", err);
      return { success: false, message: err.message };
    }
  },
};

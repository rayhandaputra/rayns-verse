import { APIProvider } from "..";

export const ProductCategoryAPI = {
  // === GET / LIST ===
  get: async ({ session, req }: any) => {
    const {
      page = 0,
      size = 10,
      search
    } = req.query || {};

    try {
      return await APIProvider(session)
        .Endpoint("POST", "select", "product_categories")
        .Data({
          columns: ["id", "name", "description", "default_drive_folders"],
          where: { deleted_on: "null" },
          search: search || null,
          page: Number(page),
          size: Number(size)
        })
        .Result();
    } catch (err: any) {
      console.error("ProductCategoryAPI.get ERROR:", err);
      return { success: false, message: err.message };
    }
  },

  // === CREATE ===
  create: async ({ session, req }: any) => {
    const { name, description, default_drive_folders } = req.body || {};

    if (!name) {
      return { success: false, message: "Nama kategori wajib diisi" };
    }

    const newCategory = {
      name,
      description: description || null,
      default_drive_folders: default_drive_folders ? JSON.stringify(default_drive_folders) : null
    };

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "insert", "product_categories")
        .Data({ data: newCategory })
        .Result();

      return {
        success: true,
        message: "Kategori produk berhasil dibuat",
        category: { id: result.insert_id, ...newCategory }
      };
    } catch (err: any) {
      console.error("ProductCategoryAPI.create ERROR:", err);
      return { success: false, message: err.message };
    }
  },

  // === UPDATE ===
  update: async ({ session, req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID wajib diisi" };
    }

    const updatedData = {
      ...fields,
      ...fields?.default_drive_folders && { default_drive_folders: JSON.stringify(fields?.default_drive_folders) },
      modified_on: new Date().toISOString()
    };

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "update", "product_categories")
        .Data({
          data: updatedData,
          where: { id }
        })
        .Result();

      return {
        success: true,
        message: "Kategori produk berhasil diperbarui",
        affected: result.affected_rows
      };
    } catch (err: any) {
      console.error("ProductCategoryAPI.update ERROR:", err);
      return { success: false, message: err.message };
    }
  }
};

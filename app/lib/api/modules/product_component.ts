import { APIProvider } from "../client";

export const ProductComponentAPI = {
  // === GET / LIST ===
  get: async ({ req }: any) => {
    const {
      page = 0,
      size = 10,
      search,
      type = "",
      id = "",
      product_id = "",
    } = req.query || {};
    console.log({
      deleted_on: "null",
      ...(type && { type }),
      ...(id && { id }),
      ...(product_id && { product_id }),
    });

    try {
      return APIProvider({
        endpoint: "select",
        method: "POST",
        table: "product_components",
        action: "select",
        body: {
          columns: [
            "id",
            "product_id",
            "commodity_id",
            "commodity_name",
            "qty",
            "unit_price",
            "subtotal",
          ],
          where: {
            deleted_on: "null",
            ...(type && { type }),
            ...(id && { id }),
            ...(product_id && { product_id }),
          },
          search: search || null,
          page: Number(page),
          size: Number(size),
        },
      });
    } catch (err: any) {
      console.error("ProductComponentAPI.get ERROR:", err);
      return { success: false, message: err.message };
    }
  },

  // === BULK CREATE (Insert + Update on Duplicate) ===
  bulkCreate: async ({ req }: any) => {
    const { components, product_id } = req.body || {};

    if (!Array.isArray(components) || components.length === 0) {
      return { success: false, message: "List komponen wajib diisi" };
    }

    if (!product_id) {
      return { success: false, message: "product_id wajib diisi" };
    }

    try {
      return await APIProvider({
        endpoint: "bulk_insert",
        method: "POST",
        table: "product_components",
        action: "bulk_insert",
        body: {
          updateOnDuplicate: true,
          rows: components.map((item: any) => ({
            ...item,
            product_id,
          })),
        },
      });
    } catch (err: any) {
      console.error("ProductComponentAPI.bulkCreate ERROR:", err);
      return { success: false, message: err.message };
    }
  },

  // === UPDATE ===
  update: async ({ req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID wajib diisi" };
    }

    const updatedData = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    try {
      return await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "product_components",
        action: "update",
        body: {
          data: updatedData,
          where: { id },
        },
      });
    } catch (err: any) {
      console.error("ProductComponentAPI.update ERROR:", err);
      return { success: false, message: err.message };
    }
  },

  // === DELETE (Soft Delete) ===
  delete: async ({ req }: any) => {
    const { id } = req.body || {};

    if (!id) {
      return { success: false, message: "ID wajib diisi" };
    }

    try {
      return await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "product_components",
        action: "update",
        body: {
          data: {
            deleted: 1,
            modified_on: new Date().toISOString(),
          },
          where: { id },
        },
      });
    } catch (err: any) {
      console.error("ProductComponentAPI.delete ERROR:", err);
      return { success: false, message: err.message };
    }
  },
};

import { APIProvider } from "..";

export const ProductComponentAPI = {
  // === GET / LIST ===
  get: async ({ session, req }: any) => {
    const {
      page = 0,
      size = 10,
      search,
      type = "",
      id = "",
      product_id = "",
    } = req.query || {};

    try {
      return await APIProvider(session)
        .Endpoint("POST", "select", "product_components")
        .Data({
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
        })
        .Result();
    } catch (err: any) {
      console.error("ProductComponentAPI.get ERROR:", err);
      return { success: false, message: err.message };
    }
  },

  // === BULK CREATE (Insert + Update on Duplicate) ===
  bulkCreate: async ({ session, req }: any) => {
    const { components, product_id } = req.body || {};

    if (!Array.isArray(components) || components.length === 0) {
      return { success: false, message: "List komponen wajib diisi" };
    }

    if (!product_id) {
      return { success: false, message: "product_id wajib diisi" };
    }

    try {
      return await APIProvider(session)
        .Endpoint("POST", "bulk_insert", "product_components")
        .Data({
          updateOnDuplicate: true,
          rows: components.map((item: any) => ({
            ...item,
            product_id,
          })),
        })
        .Result();
    } catch (err: any) {
      console.error("ProductComponentAPI.bulkCreate ERROR:", err);
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
      modified_on: new Date().toISOString(),
    };

    try {
      return await APIProvider(session)
        .Endpoint("POST", "update", "product_components")
        .Data({
          data: updatedData,
          where: { id },
        })
        .Result();
    } catch (err: any) {
      console.error("ProductComponentAPI.update ERROR:", err);
      return { success: false, message: err.message };
    }
  },

  // === DELETE (Soft Delete) ===
  delete: async ({ session, req }: any) => {
    const { id } = req.body || {};

    if (!id) {
      return { success: false, message: "ID wajib diisi" };
    }

    try {
      return await APIProvider(session)
        .Endpoint("POST", "update", "product_components")
        .Data({
          data: {
            deleted: 1,
            modified_on: new Date().toISOString(),
          },
          where: { id },
        })
        .Result();
    } catch (err: any) {
      console.error("ProductComponentAPI.delete ERROR:", err);
      return { success: false, message: err.message };
    }
  },
};

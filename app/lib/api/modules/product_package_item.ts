import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const ProductPackageItemsAPI = {
  // === GET / LIST ===
  get: async ({
    session,
    req,
  }: {
    session?: any;
    req: { query?: any; body?: any; header?: any };
  }) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      package_id,
      product_id,
    } = req.query || {};

    try {
      const res = await fetch(CONFIG.apiBaseUrl.server_api_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer REPLACE_WITH_STRONG_KEY`,
        },
        body: JSON.stringify({
          action: "select",
          table: "product_package_items",
          columns: [
            "id",
            "package_id",
            "package_name",
            "product_id",
            "product_name",
            "qty",
            "unit_price",
            "subtotal",
            "note",
            "seq",
            "created_on",
            "modified_on",
          ],
          where: {
            deleted_on: "null",
            ...(package_id ? { package_id } : {}),
            ...(product_id ? { product_id } : {}),
          },
          search,
          page,
          size,
        }),
      });

      const result = await res.json();
      return result;
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },

  // === CREATE ===
  create: async ({ req }: any) => {
    const {
      code,
      name,
      description,
      // package_id,
      // package_name,
      // product_id,
      // product_name,
      // qty = 1,
      // unit_price = 0,
      // note,
      // seq = 0,
      products,
    } = req.body || {};

    if (!code || !name) {
      return {
        success: false,
        message: "Kode dan Nama Paket wajib diisi",
      };
    }

    const newItem = {
      // app_id: "id.siesta.app.campusqu.unisma",
      // package_id,
      // package_name,
      // product_id,
      // product_name,
      // qty,
      // unit_price,
      // note,
      // seq,
      code,
      name,
      description,
      type: "package",
    };

    try {
      const result = await callApi({
        action: "insert",
        table: "products",
        data: newItem,
      });

      if (products && products?.length > 0) {
        await callApi({
          action: "bulk_insert",
          table: "product_package_items",
          updateOnDuplicate: true,
          rows: products.map((v: any) => ({
            ...v,
            package_id: result.insert_id,
            package_name: name,
          })),
        });
      }

      return {
        success: true,
        message: "Paket Produk berhasil dibuat",
        data: { id: result.insert_id, ...newItem },
      };
    } catch (err: any) {
      console.error(err);
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
      const result = await callApi({
        action: "update",
        table: "product_package_items",
        data: updatedData,
        where: { id },
      });

      return {
        success: true,
        message: "Item paket berhasil diperbarui",
        affected: result.affected_rows,
      };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },

  // === DELETE (SOFT DELETE) ===
  delete: async ({ req }: any) => {
    const { id } = req.body || {};
    if (!id) return { success: false, message: "ID wajib diisi" };

    try {
      const result = await callApi({
        action: "update",
        table: "product_package_items",
        data: { deleted: 1, modified_on: new Date().toISOString() },
        where: { id },
      });

      return {
        success: true,
        message: "Item paket berhasil dihapus",
        affected: result.affected_rows,
      };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },
};

import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const ProductAPI = {
  get: async ({
    session,
    req,
  }: {
    session: any;
    req: { query?: any; body?: any; header?: any };
  }) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      type = "",
      id = "",
      email,
    } = req.query || {};
    const res = await fetch(CONFIG.apiBaseUrl.server_api_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer REPLACE_WITH_STRONG_KEY",
      },
      body: JSON.stringify({
        action: "select",
        table: "products",
        columns: [
          "id",
          "code",
          "name",
          "type",
          "description",
          "discount_value",
          "tax_fee",
          "other_fee",
        ],
        where: { deleted_on: "null", ...(type && { type }), ...(id && { id }) },
        search,
        page,
        size,
      }),
    });
    const result = await res.json();
    return result;
  },
  create: async ({ req }: any) => {
    const {
      code,
      name,
      type,
      description,
      discount_value = 0,
      tax_fee = 0,
      other_fee = 0,
      subtotal = 0,
      total_price = 0,
      items = [],
    } = req.body || {};

    if (!name || !code) {
      return { success: false, message: "Nama dan Kode wajib diisi" };
    }

    const newProduct = {
      code,
      name,
      type,
      description,
      subtotal,
      total_price,
      discount_value,
      tax_fee,
      other_fee,
    };

    try {
      const result = await callApi({
        action: "insert",
        table: "products",
        data: newProduct,
      });

      if (items && items?.length > 0) {
        await callApi({
          action: "bulk_insert",
          table: "product_components",
          updateOnDuplicate: true,
          rows: items.map((item: any) => ({
            ...item,
            product_id: result.insert_id,
          })),
        });
      }

      return {
        success: true,
        message: "Produk berhasil ditambahkan",
        user: { id: result.insert_id, ...newProduct },
      };
    } catch (err: any) {
      console.log(err);
      return { success: false, message: err.message };
    }
  },
  update: async ({ req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID wajib diisi" };
    }

    const updatedData: Record<string, any> = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    try {
      const result = await callApi({
        action: "update",
        table: "products",
        data: updatedData,
        where: { id },
      });

      return {
        success: true,
        message: "Produk berhasil diperbarui",
        affected: result.affected_rows,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
};

import { generateProductCode } from "~/lib/utils";
import { APIProvider } from "../client";

export const ProductAPI = {
  get: async ({ req }: any) => {
    const { page = 0, size = 10, search, type = "", id = "" } = req.query || {};

    return APIProvider({
      endpoint: "select",
      method: "POST",
      table: "products",
      action: "select",
      body: {
        columns: [
          "id",
          "code",
          "name",
          "image",
          "type",
          "description",
          "subtotal",
          "discount_value",
          "tax_fee",
          "other_fee",
          "total_price",
          `(SELECT COUNT(id) FROM product_components WHERE product_id = products.id) AS total_components`,
        ],
        where: {
          deleted_on: "null",
          ...(type ? { type } : {}),
          ...(id ? { id } : {}),
        },
        search,
        page: Number(page),
        size: Number(size),
      },
    });
  },

  create: async ({ req }: any) => {
    const {
      id,
      name,
      image,
      type,
      description,
      discount_value = 0,
      tax_fee = 0,
      other_fee = 0,
      subtotal = 0,
      total_price = 0,
      items = [],
    } = req.body || {};

    if (!name) {
      return { success: false, message: "Nama dan Kode wajib diisi" };
    }

    const newProduct = {
      code: generateProductCode(),
      name,
      image,
      type,
      description,
      subtotal,
      total_price,
      discount_value,
      tax_fee,
      other_fee,
    };

    try {
      let result;

      // INSERT BARU
      if (!id) {
        result = await APIProvider({
          endpoint: "insert",
          method: "POST",
          table: "products",
          action: "insert",
          body: { data: newProduct },
        });

        // result.insert_id dipakai
      }

      // UPDATE PRODUK
      else {
        result = await APIProvider({
          endpoint: "update",
          method: "POST",
          table: "products",
          action: "update",
          body: {
            data: newProduct,
            where: { id },
          },
        });

        result.insert_id = id; // agar konsisten dipakai di bawah
      }

      // INSERT / UPDATE COMPONENT ITEMS
      if (Array.isArray(items) && items.length > 0) {
        await APIProvider({
          endpoint: "bulk-insert",
          method: "POST",
          table: "product_components",
          action: "bulk_insert",
          body: {
            updateOnDuplicate: true,
            rows: items.map((item: any) => ({
              ...item,
              product_id: result.insert_id,
              id: null,
            })),
          },
        });
      }

      return {
        success: true,
        message: "Produk berhasil disimpan",
        product: { id: result.insert_id, ...newProduct },
      };
    } catch (err: any) {
      console.error(err);
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
      const result = await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "products",
        action: "update",
        body: {
          data: updatedData,
          where: { id },
        },
      });

      return {
        success: true,
        message: "Produk berhasil diperbarui",
        affected: result.affected_rows,
      };
    } catch (err: any) {
      console.log(err);
      return { success: false, message: err.message };
    }
  },
};

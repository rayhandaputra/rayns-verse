import { APIProvider } from "../client";

export const ProductPackageItemsAPI = {
  // === GET LIST ===
  get: async ({ req }: any) => {
    const {
      page = 0,
      size = 10,
      search,
      package_id,
      product_id
    } = req.query || {};

    try {
      return APIProvider({
        endpoint: "select",
        method: "POST",
        table: "product_package_items",
        action: "select",
        body: {
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
            "modified_on"
          ],
          where: {
            deleted_on: "null",
            ...(package_id ? { package_id } : {}),
            ...(product_id ? { product_id } : {})
          },
          search: search || null,
          page: Number(page),
          size: Number(size)
        }
      });
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },

  // === CREATE PACKAGE + ITEMS ===
  create: async ({ req }: any) => {
    const {
      code,
      name,
      description,
      products // list of items in package
    } = req.body || {};

    if (!code || !name) {
      return {
        success: false,
        message: "Kode dan Nama Paket wajib diisi"
      };
    }

    const newPackage = {
      code,
      name,
      description,
      type: "package"
    };

    try {
      // 1. INSERT NEW PACKAGE INTO products table
      const result = await APIProvider({
        endpoint: "insert",
        method: "POST",
        table: "products",
        action: "insert",
        body: { data: newPackage }
      });

      const packageId = result.insert_id;

      // 2. INSERT PACKAGE ITEMS (bulk)
      if (Array.isArray(products) && products.length > 0) {
        await APIProvider({
          endpoint: "bulk_insert",
          method: "POST",
          table: "product_package_items",
          action: "bulk_insert",
          body: {
            updateOnDuplicate: true,
            rows: products.map((v: any) => ({
              ...v,
              package_id: packageId,
              package_name: name
            }))
          }
        });
      }

      return {
        success: true,
        message: "Paket Produk berhasil dibuat",
        data: { id: packageId, ...newPackage }
      };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },

  // === UPDATE PACKAGE ITEM ===
  update: async ({ req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID wajib diisi" };
    }

    const updatedData = {
      ...fields,
      modified_on: new Date().toISOString()
    };

    try {
      const result = await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "product_package_items",
        action: "update",
        body: {
          data: updatedData,
          where: { id }
        }
      });

      return {
        success: true,
        message: "Item paket berhasil diperbarui",
        affected: result.affected_rows
      };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },

  // === SOFT DELETE ===
  delete: async ({ req }: any) => {
    const { id } = req.body || {};

    if (!id) {
      return { success: false, message: "ID wajib diisi" };
    }

    try {
      const result = await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "product_package_items",
        action: "update",
        body: {
          data: {
            deleted: 1,
            modified_on: new Date().toISOString()
          },
          where: { id }
        }
      });

      return {
        success: true,
        message: "Item paket berhasil dihapus",
        affected: result.affected_rows
      };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  }
};

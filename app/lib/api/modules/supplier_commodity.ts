import { safeParseArray } from "~/lib/utils";
import { APIProvider } from "../client";

export const SupplierCommodityAPI = {
  get: async ({ req }: any) => {
    const {
      page = 0,
      size = 10,
      supplier_id,
      level = "1",
      search,
    } = req.query || {};

    try {
      const result = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "supplier_commodities",
        action: "select",
        body: {
          columns: [
            "id",
            "supplier_id",
            "commodity_id",
            "commodity_name",
            "category",
            "qty",
            "price",
            "unit",
            "unit_price",
            "is_package",
            "is_affected_side",
            "capacity_per_unit",
            "current_stock",
          ],
          where: {
            ...(supplier_id ? { supplier_id } : {}),
            ...(level ? { level } : {}),
            deleted_on: "null",
          },
          page: Number(page),
          size: Number(size),
          search: search || null,
          include: [
            {
              table: "supplier_commodities",
              alias: "sub_components",
              foreign_key: "parent_id",
              reference_key: "id",
              where: {
                deleted_on: "null",
                level: "2",
              },
              columns: [
                "id",
                "commodity_id",
                "commodity_name",
                "qty",
                "price",
                "unit",
                "unit_price",
                "is_package",
                "is_affected_side",
                "capacity_per_unit",
                "current_stock",
              ],
            },
          ],
        },
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

  create: async ({ req }: any) => {
    const { sub_components, ...body } = req.body || {};

    try {
      const result = await APIProvider({
        endpoint: "insert",
        method: "POST",
        table: "supplier_commodities",
        action: "insert",
        body: {
          data: body,
        },
      });

      if (sub_components?.length > 0) {
        const resBulk = await APIProvider({
          endpoint: "bulk-insert",
          method: "POST",
          table: "supplier_commodities",
          action: "bulk-insert",
          body: {
            updateOnDuplicate: true,
            rows: sub_components?.map((val: any) => ({
              ...body,
              ...val,
              level: 2,
              parent_id: result.insert_id,
            })),
          },
        });
      }

      return {
        success: true,
        message: "Stok supplier berhasil diperbarui",
      };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },
  update: async ({ req }: any) => {
    const { sub_components, deleted, ...body } = req.body || {};

    try {
      const result = await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "supplier_commodities",
        action: "update",
        body: {
          data: {
            ...body,
            ...(deleted === 1 && {
              deleted_on: new Date().toISOString(),
            }),
          },
          where: { id: body.id },
        },
      });

      if (safeParseArray(sub_components)?.length > 0) {
        await APIProvider({
          endpoint: "bulk-insert",
          method: "POST",
          table: "supplier_commodities",
          action: "bulk-insert",
          body: {
            updateOnDuplicate: true,
            with_id: 1,
            rows: safeParseArray(sub_components)?.map((val: any) => ({
              ...val,
              commodity_id: 0,
              commodity_name: val.commodity_name,
              level: 2,
              parent_id: body.id,
            })),
          },
        });
      }

      return {
        success: true,
        message: "Stok supplier berhasil diperbarui",
      };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },

  bulkCreate: async ({ req }: any) => {
    const { commodities } = req.body || {};

    if (!commodities || !Array.isArray(commodities)) {
      return {
        success: false,
        message: "Komponen wajib diisi dalam bentuk array",
      };
    }

    try {
      const result = await APIProvider({
        endpoint: "bulk_insert",
        method: "POST",
        table: "supplier_commodities",
        action: "bulk_insert",
        body: {
          updateOnDuplicate: true,
          rows: commodities,
        },
      });

      return {
        success: true,
        message: "Stok supplier berhasil diperbarui",
        inserted: result.inserted_rows,
        update_on_duplicate: result.update_on_duplicate,
      };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },

  // ✅ UPDATE PRICE
  updatePrice: async ({ req }: any) => {
    const { supplier_id, commodity_id, price } = req.body || {};

    if (!supplier_id || !commodity_id || price === undefined) {
      return {
        success: false,
        message: "supplier_id, commodity_id, dan price wajib diisi",
      };
    }

    try {
      // Check if record exists
      const existingRes = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "supplier_commodities",
        action: "select",
        body: {
          columns: ["id"],
          where: { supplier_id, commodity_id, deleted_on: "null" },
          size: 1,
        },
      });

      if (existingRes.items && existingRes.items.length > 0) {
        // Update existing
        await APIProvider({
          endpoint: "update",
          method: "POST",
          table: "supplier_commodities",
          action: "update",
          body: {
            data: { price, modified_on: new Date().toISOString() },
            where: { id: existingRes.items[0].id },
          },
        });
      } else {
        // Insert new
        await APIProvider({
          endpoint: "insert",
          method: "POST",
          table: "supplier_commodities",
          action: "insert",
          body: {
            data: {
              supplier_id,
              commodity_id,
              price,
              qty: 0,
              created_on: new Date().toISOString(),
            },
          },
        });
      }

      return {
        success: true,
        message: "Harga berhasil diperbarui",
      };
    } catch (err: any) {
      console.error("Error updatePrice:", err);
      return { success: false, message: err.message };
    }
  },
};

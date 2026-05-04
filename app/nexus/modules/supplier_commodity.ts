import { safeParseArray } from "~/utils/utils";
import { APIProvider } from "..";

export const SupplierCommodityAPI = {
  get: async ({ session, req }: any) => {
    const {
      page = 0,
      size = 10,
      supplier_id,
      level = "1",
      search,
    } = req.query || {};

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "select", "supplier_commodities")
        .Data({
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
        })
        .Result();

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

  create: async ({ session, req }: any) => {
    const { sub_components, ...body } = req.body || {};

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "insert", "supplier_commodities")
        .Data({
          data: body,
        })
        .Result();

      if (sub_components?.length > 0) {
        await APIProvider(session)
          .Endpoint("POST", "bulk-insert", "supplier_commodities")
          .Data({
            updateOnDuplicate: true,
            rows: sub_components?.map((val: any) => ({
              ...body,
              ...val,
              level: 2,
              parent_id: result.insert_id,
            })),
          })
          .Result();
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
  update: async ({ session, req }: any) => {
    const { sub_components, deleted, ...body } = req.body || {};

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "update", "supplier_commodities")
        .Data({
          data: {
            ...body,
            ...(deleted === 1 && {
              deleted_on: new Date().toISOString(),
            }),
          },
          where: { id: body.id },
        })
        .Result();

      if (safeParseArray(sub_components)?.length > 0) {
        await APIProvider(session)
          .Endpoint("POST", "bulk-insert", "supplier_commodities")
          .Data({
            updateOnDuplicate: true,
            with_id: 1,
            rows: safeParseArray(sub_components)?.map((val: any) => ({
              ...val,
              commodity_id: 0,
              commodity_name: val.commodity_name,
              level: 2,
              parent_id: body.id,
            })),
          })
          .Result();
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

  bulkCreate: async ({ session, req }: any) => {
    const { commodities } = req.body || {};

    if (!commodities || !Array.isArray(commodities)) {
      return {
        success: false,
        message: "Komponen wajib diisi dalam bentuk array",
      };
    }

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "bulk_insert", "supplier_commodities")
        .Data({
          updateOnDuplicate: true,
          rows: commodities,
        })
        .Result();

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
  updatePrice: async ({ session, req }: any) => {
    const { supplier_id, commodity_id, price } = req.body || {};

    if (!supplier_id || !commodity_id || price === undefined) {
      return {
        success: false,
        message: "supplier_id, commodity_id, dan price wajib diisi",
      };
    }

    try {
      // Check if record exists
      const existingRes = await APIProvider(session)
        .Endpoint("POST", "select", "supplier_commodities")
        .Data({
          columns: ["id"],
          where: { supplier_id, commodity_id, deleted_on: "null" },
          size: 1,
        })
        .Result();

      if (existingRes.items && existingRes.items.length > 0) {
        // Update existing
        await APIProvider(session)
          .Endpoint("POST", "update", "supplier_commodities")
          .Data({
            data: { price, modified_on: new Date().toISOString() },
            where: { id: existingRes.items[0].id },
          })
          .Result();
      } else {
        // Insert new
        await APIProvider(session)
          .Endpoint("POST", "insert", "supplier_commodities")
          .Data({
            data: {
              supplier_id,
              commodity_id,
              price,
              qty: 0,
              created_on: new Date().toISOString(),
            },
          })
          .Result();
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

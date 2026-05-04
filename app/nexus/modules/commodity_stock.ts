import { APIProvider } from "..";

export const CommodityStockAPI = {
  // ✅ GET STOCK LIST
  get: async ({ session, req }: any) => {
    const { page = 0, size = 10, search } = req.query || {};

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "select", "commodities")
        .Data({
          columns: [
            "id",
            "code",
            "name",
            "unit",
            "base_price",
            "created_on",
            "(SELECT SUM(qty) FROM supplier_commodities WHERE commodity_id = commodities.id AND deleted_on IS NULL) AS stock",
          ],
          where: { deleted_on: "null" },
          page: Number(page),
          size: Number(size),
          search: search || null,
          include: [
            {
              table: "supplier_commodities",
              alias: "supplier_commodities",
              foreign_key: "commodity_id",
              reference_key: "id",
              columns: [
                "supplier_id",
                "supplier_name",
                "commodity_id",
                "commodity_name",
                "qty",
                "price",
              ],
            },
          ],
        })
        .Result();

      return {
        total_items: result.total_items || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("CommodityStockAPI.get error:", err);
      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message,
      };
    }
  },

  // ✅ RESTOCK
  restock: async ({ session, req }: any) => {
    const { supplier_id, commodity_id, qty } = req.body || {};

    if (!supplier_id || !commodity_id || !qty) {
      return {
        success: false,
        message: "supplier_id, commodity_id, dan qty wajib diisi",
      };
    }

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "stock/restock")
        .Data({ supplier_id, commodity_id, qty })
        .Result();

      return {
        success: true,
        message: "Restock berhasil",
        restock_id: result.restock_id,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // ✅ KURANGI STOK (consume)
  consume: async ({ session, req }: any) => {
    const { commodity_id, qty } = req.body || {};

    if (!commodity_id || !qty) {
      return {
        success: false,
        message: "commodity_id dan qty wajib diisi",
      };
    }

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "stock/consume")
        .Data({ commodity_id, qty })
        .Result();

      return {
        success: true,
        message: "Stok berhasil dikurangi",
        consumed_id: result.consumed_id,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // ✅ GET LOGS
  logs: async ({ session, req }: any) => {
    const { commodity_id, supplier_id } = req.query || {};

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "stock/get_logs")
        .Data({
          commodity_id,
          supplier_id,
        })
        .Result();

      return {
        success: true,
        items: result.items || [],
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // ✅ CREATE NEW COMMODITY
  createCommodity: async ({ session, req }: any) => {
    const { code, name, unit } = req.body || {};

    if (!code || !name || !unit) {
      return {
        success: false,
        message: "code, name, dan unit wajib diisi",
      };
    }

    const newCommodity = {
      code,
      name,
      unit,
      created_on: new Date().toISOString(),
    };

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "insert", "commodities")
        .Data({ data: newCommodity })
        .Result();

      return {
        success: true,
        message: "Commodity berhasil dibuat",
        commodity: { id: result.insert_id, ...newCommodity },
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // ✅ UPDATE COMMODITY
  updateCommodity: async ({ session, req }: any) => {
    const { id, code, name, unit } = req.body || {};

    if (!id) {
      return { success: false, message: "id wajib diisi" };
    }

    const updateData: any = {
      modified_on: new Date().toISOString(),
    };

    if (code) updateData.code = code;
    if (name) updateData.name = name;
    if (unit) updateData.unit = unit;

    try {
      await APIProvider(session)
        .Endpoint("POST", "update", "commodities")
        .Data({
          data: updateData,
          where: { id },
        })
        .Result();

      return { success: true, message: "Commodity berhasil diupdate" };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
};

import { APIProvider } from "..";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ProductPriceRule {
  id: number;
  uid: string;
  product_id: number;
  min_qty: number;
  price: number;
  created_on: string;
  modified_on: string | null;
  deleted_on: string | null;
}

export interface CreatePriceRulePayload {
  product_id: number;
  min_qty: number;
  price: number;
}

export interface UpdatePriceRulePayload {
  id: number;
  min_qty?: number;
  price?: number;
}

export interface GetPriceRulesQuery {
  product_id?: number;
  min_qty?: number;
  pagination?: string;
  page?: number;
  size?: number;
  search?: string;
}

// ============================================
// API MODULE
// ============================================

export const ProductPriceRulesAPI = {
  // ============================================================
  // ✅ GET / LIST PRICE RULES
  // ============================================================
  get: async ({ session, req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      product_id,
      min_qty,
      id,
    } = req.query || {};

    const where: any = { deleted_on: "null" };

    if (product_id) where.product_id = product_id;
    if (min_qty) where.min_qty = min_qty;
    if (id) where.id = id;

    const searchConfig = search
      ? {
          logic: "or",
          fields: ["uid", "min_qty", "price"],
          keyword: search,
        }
      : undefined;

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "select", "product_price_rules")
        .Data({
          columns: [
            "id",
            "uid",
            "product_id",
            "min_qty",
            "price",
            "created_on",
            "modified_on",
          ],
          where,
          search: searchConfig,
          pagination: pagination === "true",
          page: Number(page),
          size: Number(size),
          order_by: { min_qty: "asc" }, // Order by quantity ascending
        })
        .Result();

      return {
        total_items: result.total_items || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ ERROR ProductPriceRulesAPI.get:", err);
      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message,
      };
    }
  },

  // ============================================================
  // ✅ GET PRICE FOR QUANTITY (Smart pricing)
  // ============================================================
  getPriceForQuantity: async ({ session, req }: any) => {
    const { product_id, qty } = req.query || {};

    if (!product_id || !qty) {
      return {
        success: false,
        message: "product_id dan qty wajib diisi",
      };
    }

    try {
      // Get all price rules for this product, ordered by min_qty descending
      const result = await APIProvider(session)
        .Endpoint("POST", "select", "product_price_rules")
        .Data({
          columns: ["id", "min_qty", "price"],
          where: {
            product_id,
            deleted_on: "null",
            min_qty: { lte: Number(qty) }, // Only rules where min_qty <= requested qty
          },
          order_by: { min_qty: "desc" }, // Get highest min_qty that qualifies
          size: 1,
        })
        .Result();

      if (result.items && result.items.length > 0) {
        const rule = result.items[0];
        return {
          success: true,
          price: Number(rule.price),
          min_qty: Number(rule.min_qty),
          rule_id: rule.id,
        };
      }

      // No rule found, return base price from product
      return {
        success: false,
        message: "Tidak ada aturan harga yang cocok untuk quantity ini",
      };
    } catch (err: any) {
      console.error("❌ ERROR getPriceForQuantity:", err);
      return { success: false, message: err.message };
    }
  },

  // ============================================================
  // ✅ CREATE PRICE RULE
  // ============================================================
  create: async ({ session, req }: any) => {
    const { product_id, min_qty, price } = req.body || {};

    if (!product_id || !min_qty || price === undefined) {
      return {
        success: false,
        message: "product_id, min_qty, dan price wajib diisi",
      };
    }

    const newRule = {
      uid: crypto.randomUUID(),
      product_id: Number(product_id),
      min_qty: Number(min_qty),
      price: Number(price),
      created_on: new Date().toISOString(),
    };

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "insert", "product_price_rules")
        .Data({
          data: newRule,
        })
        .Result();

      return {
        success: true,
        message: "Aturan harga berhasil dibuat",
        rule: { id: result.insert_id, ...newRule },
      };
    } catch (err: any) {
      console.error("❌ ERROR ProductPriceRulesAPI.create:", err);

      // Handle unique constraint violation
      if (err.message?.includes("uq_product_min_qty")) {
        return {
          success: false,
          message: "Aturan harga untuk quantity ini sudah ada",
        };
      }

      return { success: false, message: err.message };
    }
  },

  // ============================================================
  // ✅ BULK CREATE PRICE RULES
  // ============================================================
  bulkCreate: async ({ session, req }: any) => {
    const { product_id, rules } = req.body || {};

    if (!product_id || !rules || !Array.isArray(rules) || rules.length === 0) {
      return {
        success: false,
        message: "product_id dan rules wajib diisi",
      };
    }

    try {
      const rows = rules.map((rule: any) => ({
        uid: crypto.randomUUID(),
        product_id: Number(product_id),
        min_qty: Number(rule.min_qty),
        price: Number(rule.price),
        created_on: new Date().toISOString(),
      }));

      const result = await APIProvider(session)
        .Endpoint("POST", "bulk-insert", "product_price_rules")
        .Data({
          rows,
          updateOnDuplicate: true, // Update price if min_qty exists
        })
        .Result();

      return {
        success: true,
        message: `Berhasil menyimpan ${rules.length} aturan harga`,
        inserted: result.inserted_rows,
      };
    } catch (err: any) {
      console.error("❌ ERROR bulkCreate:", err);
      return { success: false, message: err.message };
    }
  },

  // ============================================================
  // ✅ UPDATE PRICE RULE
  // ============================================================
  update: async ({ session, req }: any) => {
    const { id, min_qty, price } = req.body || {};

    if (!id) {
      return {
        success: false,
        message: "ID wajib diisi for update",
      };
    }

    const updateData: any = {
      modified_on: new Date().toISOString(),
    };

    if (min_qty !== undefined) updateData.min_qty = Number(min_qty);
    if (price !== undefined) updateData.price = Number(price);

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "update", "product_price_rules")
        .Data({
          data: updateData,
          where: { id },
        })
        .Result();

      return {
        success: true,
        message: "Aturan harga berhasil diperbarui",
        affected: result.affected_rows,
      };
    } catch (err: any) {
      console.error("❌ ERROR ProductPriceRulesAPI.update:", err);
      return { success: false, message: err.message };
    }
  },

  // ============================================================
  // ✅ DELETE PRICE RULE (Soft Delete)
  // ============================================================
  delete: async ({ session, req }: any) => {
    const { id } = req.body || {};

    if (!id) {
      return {
        success: false,
        message: "ID wajib diisi",
      };
    }

    try {
      await APIProvider(session)
        .Endpoint("POST", "update", "product_price_rules")
        .Data({
          data: {
            deleted_on: new Date().toISOString(),
          },
          where: { id },
        })
        .Result();

      return {
        success: true,
        message: "Aturan harga berhasil dihapus",
      };
    } catch (err: any) {
      console.error("❌ ERROR ProductPriceRulesAPI.delete:", err);
      return { success: false, message: err.message };
    }
  },

  // ============================================================
  // ✅ DELETE ALL RULES FOR PRODUCT
  // ============================================================
  deleteByProduct: async ({ session, req }: any) => {
    const { product_id } = req.body || {};

    if (!product_id) {
      return {
        success: false,
        message: "product_id wajib diisi",
      };
    }

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "update", "product_price_rules")
        .Data({
          data: {
            deleted_on: new Date().toISOString(),
          },
          where: { product_id, deleted_on: "null" },
        })
        .Result();

      return {
        success: true,
        message: "Semua aturan harga produk berhasil dihapus",
        affected: result.affected_rows,
      };
    } catch (err: any) {
      console.error("❌ ERROR deleteByProduct:", err);
      return { success: false, message: err.message };
    }
  },

  // ============================================================
  // ✅ GET TIERED PRICING FOR PRODUCT
  // ============================================================
  getTieredPricing: async ({ session, req }: any) => {
    const { product_id } = req.query || {};

    if (!product_id) {
      return {
        success: false,
        message: "product_id wajib diisi",
      };
    }

    try {
      const result = await APIProvider(session)
        .Endpoint("POST", "select", "product_price_rules")
        .Data({
          columns: ["id", "min_qty", "price"],
          where: { product_id, deleted_on: "null" },
          order_by: { min_qty: "asc" },
          size: 100,
        })
        .Result();

      return {
        success: true,
        tiers: result.items || [],
      };
    } catch (err: any) {
      console.error("❌ ERROR getTieredPricing:", err);
      return { success: false, message: err.message };
    }
  },
};

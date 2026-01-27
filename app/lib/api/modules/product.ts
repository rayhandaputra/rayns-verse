import { generateProductCode } from "~/lib/utils";
import { APIProvider } from "../client";

export const ProductAPI = {
  get: async ({ req }: any) => {
    const {
      page = 0,
      size = 10,
      search,
      type = "",
      id = "",
      include_prices = false,
      show_in_dashboard = "",
      searchUniqueName = "",
    } = req.query || {};

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
          "show_in_dashboard",
          "description",
          "subtotal",
          "hpp_price",
          "discount_value",
          "tax_fee",
          "other_fee",
          "total_price",

          `(SELECT COUNT(id)
            FROM product_components
            WHERE product_id = products.id
              AND deleted_on IS NULL
          ) AS total_components`,

          `(SELECT SUM(qty)
            FROM order_items
            WHERE product_id = products.id
              AND deleted_on IS NULL
          ) AS total_sold_items`,

          `(SELECT SUM(oi.qty * oi.variant_final_price)
            FROM order_items oi
            WHERE oi.product_id = products.id
              AND oi.deleted_on IS NULL
          ) AS revenue`,

          `(SELECT SUM(oi.qty * products.hpp_price)
            FROM order_items oi
            WHERE oi.product_id = products.id
              AND oi.deleted_on IS NULL
          ) AS hpp_income`,

          `(SELECT
            SUM(oi.qty * oi.variant_final_price)
            - SUM(oi.qty * products.hpp_price)
            FROM order_items oi
            WHERE oi.product_id = products.id
              AND oi.deleted_on IS NULL
          ) AS net_income`,
        ],
        where: {
          deleted_on: "null",
          ...(type ? { type } : {}),
          ...(id ? { id } : {}),
          ...(show_in_dashboard ? { show_in_dashboard } : {}),
          ...(searchUniqueName ? { name: "like:" + searchUniqueName } : {}),
        },
        search,
        ...search && { searchBy: "name" },
        page: Number(page),
        size: Number(size),
        // ...(include_prices && {
        //   include: 1,
        //   include_table: "product_price_rules",
        //   include_foreign_key: "product_id",
        //   include_reference_key: "id",
        //   include_columns: ["min_qty", "price"],
        // }),
        include: [
          {
            table: "product_price_rules",
            alias: "product_price_rules",
            foreign_key: "product_id",
            reference_key: "id",
            where: { deleted_on: "null" },
            columns: ["id", "min_qty", "price"],
          },
          {
            table: "product_variants",
            alias: "product_variants",
            foreign_key: "product_id",
            where: { deleted_on: "null" },
            reference_key: "id",
            columns: ["id", "variant_name", "base_price"],
          },
        ],
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
      price_rules = [], // ✅ NEW: Optional price rules
      variants = [], // ✅ NEW: Optional price rules
    } = req.body || {};

    if (!name) {
      return { success: false, message: "Nama wajib diisi" };
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

      const product_id = result.insert_id;

      // INSERT / UPDATE COMPONENT ITEMS
      if (Array.isArray(items) && items.length > 0) {
        await APIProvider({
          endpoint: "bulk-insert",
          method: "POST",
          table: "product_components",
          action: "bulk-insert",
          body: {
            updateOnDuplicate: true,
            rows: items.map((item: any) => ({
              ...item,
              product_id,
              id: null,
            })),
          },
        });
      }

      // ✅ INSERT / UPDATE PRICE RULES (if provided)
      if (Array.isArray(price_rules) && price_rules.length > 0) {
        const priceRuleRows = price_rules.map((rule: any) => ({
          uid: crypto.randomUUID(),
          product_id,
          min_qty: Number(rule.min_qty),
          price: Number(rule.price),
          created_on: new Date().toISOString(),
        }));

        await APIProvider({
          endpoint: "bulk-insert",
          method: "POST",
          table: "product_price_rules",
          action: "bulk-insert",
          body: {
            updateOnDuplicate: true,
            rows: priceRuleRows,
          },
        });
      }

      // ✅ INSERT / UPDATE VARIANTS (if provided)
      if (Array.isArray(variants) && variants.length > 0) {
        const variantRows = variants.map((variant: any) => ({
          uid: crypto.randomUUID(),
          product_id,
          variant_name: variant.variant_name,
          base_price: Number(variant.base_price),
          created_on: new Date().toISOString(),
        }));

        await APIProvider({
          endpoint: "bulk-insert",
          method: "POST",
          table: "product_variants",
          action: "bulk-insert",
          body: {
            updateOnDuplicate: true,
            rows: variantRows,
          },
        });
      }

      return {
        success: true,
        message: "Produk berhasil disimpan",
        product: { id: product_id, ...newProduct },
      };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message };
    }
  },

  update: async ({ req }: any) => {
    const { id, price_rules, variants, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID wajib diisi" };
    }

    // Remove price_rules from fields to avoid trying to update it in products table
    const { wholesale_prices, ...cleanFields } = fields;

    const updatedData: Record<string, any> = {
      ...cleanFields,
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

      // ✅ UPDATE PRICE RULES (if provided)
      if (Array.isArray(price_rules)) {
        // First, soft delete existing price rules for this product
        const delPrice = await APIProvider({
          endpoint: "update",
          method: "POST",
          table: "product_price_rules",
          action: "update",
          body: {
            data: { deleted_on: new Date().toISOString() },
            where: { product_id: id, deleted_on: "null" },
          },
        });

        // Then insert new price rules (if any)
        if (price_rules.length > 0) {
          const priceRuleRows = price_rules.map((rule: any) => ({
            uid: crypto.randomUUID(),
            product_id: id,
            min_qty:
              +(rule.min_qty || rule.minQty) > 0
                ? Number(rule.min_qty || rule.minQty)
                : 0,
            price:
              +(rule.price || rule.Price) > 0
                ? Number(rule.price || rule.Price)
                : 0,
            created_on: new Date().toISOString(),
            deleted_on: null,
          }));

          const resPriceRule = await APIProvider({
            endpoint: "bulk-insert",
            method: "POST",
            table: "product_price_rules",
            action: "bulk-insert",
            body: {
              updateOnDuplicate: true,
              rows: priceRuleRows,
            },
          });
        }
      }

      if (Array.isArray(variants)) {
        // First, soft delete existing price rules for this product
        await APIProvider({
          endpoint: "update",
          method: "POST",
          table: "product_variants",
          action: "update",
          body: {
            data: { deleted_on: new Date().toISOString() },
            where: { product_id: id, deleted_on: "null" },
          },
        });

        // Then insert new price rules (if any)
        if (variants.length > 0) {
          const variantRows = variants.map((rule: any) => ({
            id: rule.id,
            uid: crypto.randomUUID(),
            product_id: id,
            variant_name: rule.variant_name,
            base_price: Number(rule.base_price),
            created_on: new Date().toISOString(),
            deleted_on: null,
          }));

          const resVariant = await APIProvider({
            endpoint: "bulk-insert",
            method: "POST",
            table: "product_variants",
            action: "bulk-insert",
            body: {
              updateOnDuplicate: true,
              rows: variantRows,
            },
          });
        }
      }

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

  // ============================================================
  // ✅ BULK INSERT PRODUCTS
  // ============================================================
  bulkInsert: async ({ req }: any) => {
    const { products = [] } = req.body || {};

    if (!Array.isArray(products) || products.length === 0) {
      return {
        success: false,
        message: "Array products wajib diisi",
      };
    }

    try {
      const insertedProducts = [];

      // Process each product sequentially to handle price_rules
      for (const productData of products) {
        const {
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
          price_rules = [],
        } = productData;

        if (!name) continue; // Skip invalid products

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
          created_on: new Date().toISOString(),
        };

        // Insert product
        const productResult = await APIProvider({
          endpoint: "insert",
          method: "POST",
          table: "products",
          action: "insert",
          body: { data: newProduct },
        });

        const product_id = productResult.insert_id;

        // Insert components if provided
        if (Array.isArray(items) && items.length > 0) {
          await APIProvider({
            endpoint: "bulk-insert",
            method: "POST",
            table: "product_components",
            action: "bulk-insert",
            body: {
              updateOnDuplicate: true,
              rows: items.map((item: any) => ({
                ...item,
                product_id,
                id: null,
              })),
            },
          });
        }

        // Insert price rules if provided
        if (Array.isArray(price_rules) && price_rules.length > 0) {
          const priceRuleRows = price_rules.map((rule: any) => ({
            uid: crypto.randomUUID(),
            product_id,
            min_qty: Number(rule.min_qty),
            price: Number(rule.price),
            created_on: new Date().toISOString(),
          }));

          await APIProvider({
            endpoint: "bulk-insert",
            method: "POST",
            table: "product_price_rules",
            action: "bulk-insert",
            body: {
              updateOnDuplicate: true,
              rows: priceRuleRows,
            },
          });
        }

        insertedProducts.push({
          id: product_id,
          ...newProduct,
        });
      }

      return {
        success: true,
        message: `Berhasil menyimpan ${insertedProducts.length} produk`,
        products: insertedProducts,
      };
    } catch (err: any) {
      console.error("❌ ERROR ProductAPI.bulkInsert:", err);
      return { success: false, message: err.message };
    }
  },
};

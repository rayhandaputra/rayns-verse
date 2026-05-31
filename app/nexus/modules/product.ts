import { generateProductCode } from "~/utils/utils";
import { APIProviderV2 } from "../core/api-provider-v2";

export const ProductAPI = {
  get: async ({ session, req }: any) => {
    const {
      page = 0,
      size = 10,
      search,
      type = "",
      id = "",
      show_in_dashboard = "",
      searchUniqueName = "",
    } = req.query || {};

    return APIProviderV2(session)
      .Table("products")
      .Select({
        columns: [
          "id",
          "code",
          "name",
          "image",
          "type",
          "category_id",
          "category_name",
          "show_in_dashboard",
          "description",
          "subtotal",
          "hpp_price",
          "discount_value",
          "tax_fee",
          "other_fee",
          "total_price",
        ],
        where: {
          deleted_on: "null",
          ...(type ? { type } : {}),
          ...(id ? { id } : {}),
          ...(show_in_dashboard ? { show_in_dashboard } : {}),
          ...(searchUniqueName ? { name: "like:" + searchUniqueName } : {}),
        },
        ...(search ? { search, searchBy: "name" } : {}),
        page: Number(page),
        size: Number(size),
        orderBy: ["created_on", "DESC"],
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
            reference_key: "id",
            where: { deleted_on: "null" },
            columns: ["id", "variant_name", "base_price", "is_default"],
          },
        ],
      })
      .Result();
  },

  create: async ({ session, req }: any) => {
    const {
      id,
      name,
      image,
      type = "single",
      category_id,
      category_name,
      description,
      discount_value = 0,
      tax_fee = 0,
      other_fee = 0,
      subtotal = 0,
      total_price = 0,
      items = [],
      price_rules = [],
      variants = [],
    } = req.body || {};

    if (!name) {
      return { success: false, message: "Nama wajib diisi" };
    }

    // Ensure type is valid enum value
    const validTypes = ["single", "package", "material"];
    const safeType = validTypes.includes(type) ? type : "single";

    const newProduct: Record<string, any> = {
      code: generateProductCode(),
      name,
      image: image || null,
      type: safeType,
      category_id: category_id || null,
      category_name: category_name || null,
      description: description || null,
      subtotal: Number(subtotal),
      total_price: Number(total_price),
      discount_value: Number(discount_value),
      tax_fee: Number(tax_fee),
      other_fee: Number(other_fee),
    };

    try {
      let result;

      if (!id) {
        result = await APIProviderV2(session)
          .Table("products")
          .Insert(newProduct)
          .Result();
      } else {
        result = await APIProviderV2(session)
          .Table("products")
          .Update({ data: newProduct, where: { id } })
          .Result();
        result.insert_id = id;
      }

      const product_id = result.insert_id;

      // INSERT / UPDATE COMPONENT ITEMS
      if (Array.isArray(items) && items.length > 0) {
        await APIProviderV2(session)
          .Table("product_components")
          .BulkInsert({
            updateOnDuplicate: true,
            rows: items.map((item: any) => ({
              ...item,
              product_id,
              id: null,
            })),
          })
          .Result();
      }

      // INSERT / UPDATE PRICE RULES
      if (Array.isArray(price_rules) && price_rules.length > 0) {
        await APIProviderV2(session)
          .Table("product_price_rules")
          .BulkInsert({
            updateOnDuplicate: true,
            rows: price_rules.map((rule: any) => ({
              uid: crypto.randomUUID(),
              product_id,
              min_qty: Number(rule.min_qty) || 0,
              price: Number(rule.price) || 0,
              created_on: new Date().toISOString(),
            })),
          })
          .Result();
      }

      // INSERT / UPDATE VARIANTS
      if (Array.isArray(variants) && variants.length > 0) {
        await APIProviderV2(session)
          .Table("product_variants")
          .BulkInsert({
            updateOnDuplicate: true,
            rows: variants.map((variant: any) => ({
              uid: crypto.randomUUID(),
              product_id,
              variant_name: variant.variant_name,
              base_price: Number(variant.base_price) || 0,
              is_default: variant.is_default ? 1 : 0,
              created_on: new Date().toISOString(),
            })),
          })
          .Result();
      }

      return {
        success: true,
        message: "Produk berhasil disimpan",
        product: { id: product_id, ...newProduct },
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  update: async ({ session, req }: any) => {
    const { id, price_rules, variants, wholesale_prices, ...fields } = req.body || {};

    if (!id) {
      return { success: false, message: "ID wajib diisi" };
    }

    // Ensure type is valid if provided
    if (fields.type) {
      const validTypes = ["single", "package", "material"];
      if (!validTypes.includes(fields.type)) {
        fields.type = "single";
      }
    }

    const updatedData: Record<string, any> = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    try {
      const result = await APIProviderV2(session)
        .Table("products")
        .Update({ data: updatedData, where: { id } })
        .Result();

      // UPDATE PRICE RULES
      if (Array.isArray(price_rules)) {
        // Soft delete existing
        await APIProviderV2(session)
          .Table("product_price_rules")
          .Update({
            data: { deleted_on: new Date().toISOString() },
            where: { product_id: id },
          })
          .Result();

        // Insert new ones
        if (price_rules.length > 0) {
          await APIProviderV2(session)
            .Table("product_price_rules")
            .BulkInsert({
              updateOnDuplicate: true,
              rows: price_rules.map((rule: any) => ({
                uid: crypto.randomUUID(),
                product_id: id,
                min_qty: Number(rule.min_qty || rule.minQty) || 0,
                price: Number(rule.price || rule.Price) || 0,
                created_on: new Date().toISOString(),
                deleted_on: null,
              })),
            })
            .Result();
        }
      }

      // UPDATE VARIANTS
      if (Array.isArray(variants)) {
        // Soft delete existing
        await APIProviderV2(session)
          .Table("product_variants")
          .Update({
            data: { deleted_on: new Date().toISOString() },
            where: { product_id: id },
          })
          .Result();

        // Insert new ones
        if (variants.length > 0) {
          await APIProviderV2(session)
            .Table("product_variants")
            .BulkInsert({
              updateOnDuplicate: true,
              rows: variants.map((v: any) => ({
                id: v.id || null,
                uid: crypto.randomUUID(),
                product_id: id,
                variant_name: v.variant_name,
                base_price: Number(v.base_price) || 0,
                is_default: v.is_default ? 1 : 0,
                created_on: new Date().toISOString(),
                deleted_on: null,
              })),
            })
            .Result();
        }
      }

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

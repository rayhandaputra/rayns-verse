import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const OrderItemAPI = {
  get: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      id,
      order_number,
      product_type,
    } = req.query || {};

    const where: any = {
      deleted_on: "null",
    };

    // Filter by order_number
    if (order_number) where.order_number = order_number;
    if (id) where.id = id;

    // Optional filter
    if (product_type) where.product_type = product_type;

    try {
      const result = await callApi({
        action: "select",
        table: "order_items",
        columns: [
          "id",
          "order_number",
          "product_id",
          "product_name",
          "product_type",
          "qty",
          "unit_price",
          "discount_type",
          "discount_value",
          "tax_percent",
          "subtotal",
          "discount_total",
          "tax_value",
          "total_after_tax",
        ],
        where,
        search: search
          ? {
              logic: "or",
              fields: ["product_name", "product_type", "order_number"],
              keyword: search,
            }
          : undefined,
        pagination: pagination === "true",
        page: +page || 0,
        size: +size || 10,
        order_by: { id: "asc" },
      });

      return {
        total_items: result.total_items || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ Error fetching order items:", err);
      return {
        total_items: 0,
        items: [],
        current_page: Number(page),
        total_pages: 0,
        error: err.message,
      };
    }
  },
};

import { APIProvider } from "../client";


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

    // === WHERE CLAUSE ===
    const where: any = { deleted_on: "null" };

    if (order_number) where.order_number = order_number;
    if (id) where.id = id;
    if (product_type) where.product_type = product_type;

    // === SEARCH CONFIG ===
    const searchConfig = search
      ? {
          logic: "or",
          fields: ["product_name", "product_type", "order_number"],
          keyword: search,
        }
      : undefined;

    try {
      const result = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "order_items",
        action: "select",
        body: {
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
          search: searchConfig,
          pagination: pagination === "true",
          page: Number(page),
          size: Number(size),
          order_by: { id: "asc" },
        },
      });

      return {
        total_items: result.total_items || 0,
        items: result.items || [],
        current_page: Number(page),
        total_pages: result.total_pages || 1,
      };
    } catch (err: any) {
      console.error("❌ Error OrderItemAPI.get:", err);
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

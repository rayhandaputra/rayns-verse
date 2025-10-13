import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const ProductComponentAPI = {
  get: async ({
    session,
    req,
  }: {
    session: any;
    req: { query?: any; body?: any; header?: any };
  }) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      type = "",
      id = "",
      product_id = "",
      email,
    } = req.query || {};
    const res = await fetch(CONFIG.apiBaseUrl.server_api_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer REPLACE_WITH_STRONG_KEY",
      },
      body: JSON.stringify({
        action: "select",
        table: "product_components",
        columns: [
          "id",
          "product_id",
          "commodity_id",
          "commodity_name",
          "qty",
          "unit_price",
          "subtotal",
        ],
        where: {
          deleted_on: "null",
          ...(type && { type }),
          ...(id && { id }),
          ...(product_id && { product_id }),
        },
        search,
        page,
        size,
      }),
    });
    const result = await res.json();
    return result;
  },
};

import { APIProvider } from "../client";

export const OverviewAPI = {
  get: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      id,
      institution_id,
      institution_domain,
      status,
      payment_status,
      order_type,
      start_date,
      end_date,
    } = req.query || {};

    const where: any = {};

    if (id) where.id = id;
    if (institution_id) where.institution_id = institution_id;
    if (institution_domain) where.institution_domain = institution_domain;
    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (order_type) where.order_type = order_type;

    // ✅ FILTER TANGGAL
    if (start_date && end_date) {
      where.created_on = { between: [start_date, end_date] };
    } else if (start_date) {
      where.created_on = { gte: start_date };
    } else if (end_date) {
      where.created_on = { lte: end_date };
    }

    // ✅ SEARCH MULTI FIELD (format OR)
    const searchConfig = search
      ? {
          logic: "or",
          fields: [
            "order_number",
            "institution_name",
            "institution_abbr",
            "institution_domain",
          ],
          keyword: search,
        }
      : undefined;

    try {
      const result = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "orders",
        action: "select",
        body: {
          columns: [
            `(SELECT COUNT(id) FROM orders WHERE status = "ordered" AND deleted_on IS NULL) AS total_order_pending`,
            `(SELECT COUNT(id) FROM orders WHERE status = "confirmed" AND deleted_on IS NULL) AS total_order_process`,
            `(SELECT COUNT(id) FROM orders WHERE status = "done" AND deleted_on IS NULL AND YEAR(created_on) = YEAR(CURRENT_DATE()) AND MONTH(created_on) = MONTH(CURRENT_DATE())) AS total_order_done`,
            `(SELECT SUM(grand_total) FROM orders WHERE status = "done" AND deleted_on IS NULL) AS total_revenue`,
          ],
          where,
          search: searchConfig,
          page: Number(page),
          size: 1,
          pagination: pagination === "true",
          order_by: { created_on: "desc" },
        },
      });

      const monthly_report = await APIProvider({
        endpoint: "select",
        method: "POST",
        table: "orders",
        action: "select",
        body: {
          columns: [
            `(SELECT MONTH(created_on) FROM orders WHERE status = "ordered" AND deleted_on IS NULL) AS month`,
            `(SELECT COUNT(id) FROM orders WHERE status = "ordered" AND deleted_on IS NULL) AS total_sales`,
          ],
          where,
          groupBy: "MONTH(created_on)",
          search: searchConfig,
          page: Number(page),
          size: 1,
          pagination: pagination === "true",
          order_by: { created_on: "desc" },
        },
      });

      return {
        ...result?.items?.[0],
        monthly_report: monthly_report?.items,
      };
    } catch (err: any) {
      console.error("❌ ERROR OrderAPI.get:", err);

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

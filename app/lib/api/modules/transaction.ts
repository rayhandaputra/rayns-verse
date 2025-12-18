import { APIProvider } from "../client";

export const TransactionAPI = {
  // ================================
  // ✅ GET / LIST TRANSACTIONS
  // ================================
  get: async ({ req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      id,
      type,
      category,
      year,
      month,
      bank_id,
      start_date,
      end_date,
      sort_by = "date",
      sort_order = "desc",
    } = req.query || {};

    const where: any = {};

    if (id) where.id = id;
    if (type) where.type = type;
    if (category) where.category = category;
    if (bank_id) where.bank_id = bank_id;

    // ✅ FILTER BY YEAR
    if (year) {
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;
      where.date = { between: [startOfYear, endOfYear] };
    }

    // ✅ FILTER BY MONTH (requires year)
    if (year && month) {
      const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
      where.date = { between: [startOfMonth, endOfMonth] };
    }

    // ✅ FILTER BY DATE RANGE
    if (start_date && end_date) {
      where.date = { between: [start_date, end_date] };
    } else if (start_date) {
      where.date = { gte: start_date };
    } else if (end_date) {
      where.date = { lte: end_date };
    }

    // ✅ SEARCH IN DESCRIPTION
    const searchConfig = search
      ? {
          logic: "or",
          fields: ["description", "category"],
          search,
        }
      : undefined;

    // ✅ SORTING
    const orderBy =
      sort_by === "amount"
        ? [{ amount: sort_order }]
        : [{ date: sort_order }, { created_at: sort_order }];

    // await APIProvider({
    //   table: "transaction",
    //   endpoint: "select",
    //   body: {
    //     where,
    //     search: searchConfig,
    //     orderBy,
    //     pagination: pagination === "true",
    //     page: Number(page),
    //     size: Number(size),
    //   }
    // });
    return []
  },

  // ================================
  // ✅ CREATE TRANSACTION
  // ================================
  create: async ({ req }: any) => {
    const { body } = req;

    if (!body.type || !body.category || !body.amount) {
      throw new Error("Missing required fields: type, category, amount");
    }

    const data = {
      date: body.date || new Date().toISOString().split("T")[0],
      type: body.type,
      category: body.category,
      amount: Number(body.amount),
      description: body.description || "",
      bank_id: body.bank_id || null,
      proof_image: body.proof_image || null,
      is_auto: body.is_auto || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return await APIProvider.insert({
      table: "transaction",
      data,
    });
  },

  // ================================
  // ✅ UPDATE TRANSACTION
  // ================================
  update: async ({ req }: any) => {
    const { body, query } = req;
    const { id } = query;

    if (!id) {
      throw new Error("Transaction ID is required");
    }

    const data = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    // Remove fields that shouldn't be updated
    delete data.id;
    delete data.created_at;

    return await APIProvider.update({
      table: "transaction",
      data,
      where: { id },
    });
  },

  // ================================
  // ✅ DELETE TRANSACTION
  // ================================
  delete: async ({ req }: any) => {
    const { query } = req;
    const { id } = query;

    if (!id) {
      throw new Error("Transaction ID is required");
    }

    return await APIProvider.delete({
      table: "transaction",
      where: { id },
    });
  },

  // ================================
  // ✅ GET FINANCIAL SUMMARY
  // ================================
  summary: async ({ req }: any) => {
    const { year, month } = req.query || {};

    const where: any = {};

    if (year) {
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;
      where.date = { between: [startOfYear, endOfYear] };
    }

    if (year && month) {
      const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
      where.date = { between: [startOfMonth, endOfMonth] };
    }

    // const transactions = await APIProvider({
    //   table: "transaction",
    //   endpoint: "select",
    //   body: {
    //     where,
    //     pagination: false,
    //   },
    // });

    // const data = Array.isArray(transactions) ? transactions : [];
    const data = [];

    const summary = {
      total_income: data
        .filter((t: any) => t.type === "Income")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0),
      total_expense: data
        .filter((t: any) => t.type === "Expense")
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0),
      net_income: 0,
      transaction_count: data.length,
      categories: {} as Record<string, { income: number; expense: number }>,
    };

    summary.net_income = summary.total_income - summary.total_expense;

    // Group by category
    data.forEach((t: any) => {
      if (!summary.categories[t.category]) {
        summary.categories[t.category] = { income: 0, expense: 0 };
      }
      if (t.type === "Income") {
        summary.categories[t.category].income += Number(t.amount);
      } else {
        summary.categories[t.category].expense += Number(t.amount);
      }
    });

    return summary;
  },
};

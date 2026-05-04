import { APIProvider } from "..";

export const BankAccountAPI = {
  // ================================
  // ✅ GET / LIST BANK ACCOUNTS
  // ================================
  get: async ({ session, req }: any) => {
    const {
      pagination = "true",
      page = 0,
      size = 10,
      search,
      id,
      bank_name,
      holder_name,
    } = req.query || {};

    const where: any = {};

    if (id) where.id = id;
    if (bank_name) where.bank_name = bank_name;
    if (holder_name) where.holder_name = holder_name;

    const data: any = {
      where,
      order_by: [{ column: "bank_name", order: "asc" }, { column: "holder_name", order: "asc" }],
    };

    if (search) {
      data.search = search;
    }

    if (pagination === "true") {
      data.page = Number(page);
      data.size = Number(size);
    }

    return APIProvider(session)
      .Endpoint("POST", "select", "bank_account")
      .Data(data)
      .Result();
  },

  // ================================
  // ✅ CREATE BANK ACCOUNT
  // ================================
  create: async ({ session, req }: any) => {
    const { body } = req;

    if (!body.bank_name || !body.account_number || !body.holder_name) {
      throw new Error(
        "Missing required fields: bank_name, account_number, holder_name"
      );
    }

    const data = {
      bank_name: body.bank_name,
      account_number: body.account_number,
      holder_name: body.holder_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return APIProvider(session)
      .Endpoint("POST", "insert", "bank_account")
      .Data({ data })
      .Result();
  },

  // ================================
  // ✅ UPDATE BANK ACCOUNT
  // ================================
  update: async ({ session, req }: any) => {
    const { body, query } = req;
    const { id } = query || body; // Fallback to body

    if (!id) {
      throw new Error("Bank Account ID is required");
    }

    const data = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    // Remove fields that shouldn't be updated
    delete data.id;
    delete data.created_at;

    return APIProvider(session)
      .Endpoint("POST", "update", "bank_account")
      .Data({
        data,
        where: { id },
      })
      .Result();
  },

  // ================================
  // ✅ DELETE BANK ACCOUNT
  // ================================
  delete: async ({ session, req }: any) => {
    const { query, body } = req;
    const { id } = query || body;

    if (!id) {
      throw new Error("Bank Account ID is required");
    }

    return APIProvider(session)
      .Endpoint("POST", "delete", "bank_account")
      .Data({
        where: { id },
      })
      .Result();
  },

  // ================================
  // ✅ GET BANK BALANCES
  // ================================
  balances: async ({ session, req }: any) => {
    // Get all bank accounts
    const result = await APIProvider(session)
      .Endpoint("POST", "select", "bank_account")
      .Data({
        columns: ["id", "bank_name", "account_number", "holder_name"],
      })
      .Result();

    const bankData = Array.isArray(result?.items) ? result.items : [];
    const txData = [];

    // Initialize balances
    const balances: Record<string, number> = {};

    // Initialize all banks with 0 balance
    bankData.forEach((b: any) => {
      const key = `${b.bank_name} - ${b.holder_name}`;
      balances[key] = 0;
    });

    // Add cash/tunai
    balances["Tunai"] = 0;

    return {
      banks: bankData,
      balances,
      total_balance: Object.values(balances).reduce(
        (sum: number, val: number) => sum + val,
        0
      ),
    };
  },
};

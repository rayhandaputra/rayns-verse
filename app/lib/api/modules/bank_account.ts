import { APIProvider } from "../client";

export const BankAccountAPI = {
  // ================================
  // ✅ GET / LIST BANK ACCOUNTS
  // ================================
  get: async ({ req }: any) => {
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

    const body: any = {
      where,
      order_by: [{ column: "bank_name", order: "asc" }, { column: "holder_name", order: "asc" }],
    };

    if (search) {
      body.search = search;
    }

    if (pagination === "true") {
      body.page = Number(page);
      body.size = Number(size);
    }

    const result = await APIProvider({
      endpoint: "select",
      method: "POST",
      table: "bank_account",
      body,
    });
    
    return result;
  },

  // ================================
  // ✅ CREATE BANK ACCOUNT
  // ================================
  create: async ({ req }: any) => {
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

    return await APIProvider.insert({
      table: "bank_account",
      data,
    });
  },

  // ================================
  // ✅ UPDATE BANK ACCOUNT
  // ================================
  update: async ({ req }: any) => {
    const { body, query } = req;
    const { id } = query;

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

    return await APIProvider.update({
      table: "bank_account",
      data,
      where: { id },
    });
  },

  // ================================
  // ✅ DELETE BANK ACCOUNT
  // ================================
  delete: async ({ req }: any) => {
    const { query } = req;
    const { id } = query;

    if (!id) {
      throw new Error("Bank Account ID is required");
    }

    return await APIProvider.delete({
      table: "bank_account",
      where: { id },
    });
  },

  // ================================
  // ✅ GET BANK BALANCES
  // ================================
  balances: async ({ req }: any) => {
    // Get all bank accounts
    const banks = await APIProvider({
      endpoint: "select",
      table: "bank_account",
      action: "select",
      body: {
        columns: ["id", "bank_name", "account_number", "holder_name"],
      },
      // pagination: false,
    });

    // // Get all transactions
    // const transactions = await APIProvider({
    //   endpoint: "select",
    //   table: "transaction",
    //   action: "select",
    //   body: {
    //     columns: ["id", "bank_id", "amount", "type"],
    //   },
    //   // pagination: false,
    // });

    const bankData = Array.isArray(banks) ? banks : [];
    // const txData = Array.isArray(transactions) ? transactions : [];
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

    // Calculate balances from transactions
    txData.forEach((t: any) => {
      if (t.bank_id) {
        if (balances[t.bank_id] === undefined) {
          balances[t.bank_id] = 0;
        }

        const amount = Number(t.amount);
        if (t.type === "Income") {
          balances[t.bank_id] += amount;
        } else {
          balances[t.bank_id] -= amount;
        }
      }
    });

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

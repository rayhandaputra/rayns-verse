import { APIProvider } from "../client";

export const AccountMutationAPI = {
  get: async ({ req }: any) => {
    const {
      page = 0,
      size = 10,
      search,
      group_type = "",
      id = "",
    } = req.query || {};

    return APIProvider({
      endpoint: "select",
      method: "POST",
      table: "account_ledger_mutations",
      action: "select",
      body: {
        columns: [
          "id",
          "account_code",
          "account_name",
          "debit",
          "credit",
          "created_on",
          `(SELECT group_type FROM accounts WHERE code = account_code) as group_type`,
        ],
        where: {
          deleted_on: "null",
          ...(group_type ? { group_type } : {}),
          ...(id ? { id } : {}),
        },
        search,
        page: Number(page),
        size: Number(size),
      },
    });
  },
};

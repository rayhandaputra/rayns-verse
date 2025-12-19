import { APIProvider } from "../client";

export const AccountAPI = {
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
      table: "accounts",
      action: "select",
      body: {
        columns: [
          "id",
          "uid",
          "code",
          "name",
          "group_code",
          "group_type",
          "group_name",
          `(
                SELECT
                    CASE
                    WHEN accounts.group_type IN ('asset', 'expense')
                        THEN COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)
                    ELSE
                        COALESCE(SUM(credit), 0) - COALESCE(SUM(debit), 0)
                    END
                FROM account_ledger_mutations
                WHERE account_code = accounts.code
           ) AS balance`,
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

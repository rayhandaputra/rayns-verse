import { APIProvider } from "../client";

export const AccountAPI = {
  get: async ({ req }: any) => {
    const {
      page = 0,
      size = 10,
      search,
      group_type = "",
      is_bank = "",
      year = "",
      id = "",
      sort = "",
    } = req.query || {};

    // console.log([sortBy, sortDirection]);
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
          "is_bank",
          "ref_account_number",
          "ref_account_holder",
          `(
                SELECT
                    CASE
                    WHEN accounts.group_type IN ('asset', 'expense')
                        THEN COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)
                    ELSE
                        COALESCE(SUM(credit), 0) - COALESCE(SUM(debit), 0)
                    END
                FROM account_ledger_mutations
                WHERE account_code = accounts.code AND deleted_on IS NULL AND YEAR(created_on) = '${year}'
           ) AS balance`,
        ],
        where: {
          deleted_on: "null",
          // ...(year ? { "year:created_on": parseInt(year) } : {}),
          ...(group_type ? { group_type } : {}),
          ...(is_bank ? { is_bank } : {}),
          ...(id ? { id } : {}),
        },
        orderBy: ["created_on", "desc"],
        search,
        page: Number(page),
        size: Number(size),
      },
    });
  },
  create_update: async ({ req }: any) => {
    const { id, ...fields } = req.body || {};
    if (!id) {
      const createdOrder = {
        ...fields,
        created_on: new Date().toISOString(),
      };

      try {
        const result = await APIProvider({
          endpoint: "insert",
          method: "POST",
          table: "accounts",
          action: "insert",
          body: {
            data: createdOrder,
          },
        });
        console.log("CREATE RESULT => ", result);

        return {
          success: true,
          message: "Akun berhasil dibuat",
          affected: result.affected_rows,
        };
      } catch (err: any) {
        console.error("❌ ERROR AccountAPI.create_update:", err);
        return { success: false, message: err.message };
      }
    } else {
      const updatedOrder = {
        ...fields,
        ...(fields?.payment_proof && {
          payment_status: "paid",
        }),
        modified_on: new Date().toISOString(),
        ...(fields.deleted === 1
          ? { deleted_on: new Date().toISOString() }
          : {}),
      };

      try {
        const result = await APIProvider({
          endpoint: "update",
          method: "POST",
          table: "accounts",
          action: "update",
          body: {
            data: updatedOrder,
            where: { id },
          },
        });

        return {
          success: true,
          message: "Akun berhasil diperbarui",
          affected: result.affected_rows,
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    }
  },
};

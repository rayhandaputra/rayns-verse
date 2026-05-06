import type { LoaderFunction, ActionFunction } from "react-router";
import { requireAuth } from "~/utils/session.server";
import { API } from "~/nexus";
import { APIProvider } from "~/nexus/client";
import { FinanceDashboard } from "~/components/features/finance/FinanceDashboard";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAuth(request);
  return Response.json({ initialized: true });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    switch (intent) {
      case "delete_transaction": {
        const id = formData.get("id") as string;
        const journal_code = formData.get("journal_code") as string;
        const payload = { deleted_on: new Date().toISOString() };

        if (!journal_code) {
          const res = await API.TRANSACTION.update({
            session: { user, token },
            req: { body: { id, ...payload } },
          });
          return Response.json({
            success: res.success,
            message: res.success ? "Transaksi berhasil dihapus" : "Gagal menghapus transaksi",
          });
        }

        const res = await APIProvider({
          endpoint: "update",
          method: "POST",
          table: "account_ledger_mutations",
          action: "update",
          body: { data: payload, where: { journal_code } },
        });

        return Response.json({
          success: res.affected_rows > 0,
          message: res.affected_rows > 0 ? "Transaksi berhasil dihapus" : "Gagal menghapus transaksi",
        });
      }

      case "update_hpp_product": {
        const id = formData.get("id") as string;
        const hpp_price = formData.get("hpp_price") as string;
        const res = await API.PRODUCT.update({
          session: { user, token },
          req: { body: { id, hpp_price } },
        });
        return Response.json({
          success: res.success,
          message: res.success ? "HPP berhasil diperbarui" : "Gagal memperbarui HPP",
        });
      }

      case "delete_account": {
        const id = formData.get("id") as string;
        const res = await API.ACCOUNT.create_update({
          session: { user, token },
          req: { body: { id, deleted_on: new Date().toISOString() } },
        });
        return Response.json({
          success: res.success,
          message: res.success ? "Akun dihapus" : "Gagal menghapus akun",
        });
      }

      case "save_account_bank": {
        const id = formData.get("id") as string;
        const code = formData.get("code") as string;
        const name = formData.get("name") as string;
        const ref_account_number = formData.get("ref_account_number") as string;
        const ref_account_holder = formData.get("ref_account_holder") as string;

        const payload = {
          ...(+id > 0 ? { id } : {
            code,
            is_bank: 1,
            group_code: 1,
            group_type: "asset",
            group_name: "Aset Lancar",
          }),
          name,
          ref_account_number,
          ref_account_holder,
        };

        const res = await API.ACCOUNT.create_update({
          session: { user, token },
          req: { body: payload },
        });
        return Response.json({
          success: res.success,
          message: res.success ? "Akun diperbarui" : "Gagal memperbarui akun",
        });
      }

      case "create_transaction": {
        const type = formData.get("type") as string;
        const category = formData.get("category") as string;
        const amount = Number(formData.get("amount"));
        const date = formData.get("date") as string;
        const description = formData.get("description") as string;
        const bank_id = formData.get("bank_id") as string;
        const proof_image = formData.get("proof_image") as string;

        if (!type || !category || !amount) {
          return Response.json({ success: false, message: "Missing required fields" });
        }

        let accountBank = null;
        if (bank_id && bank_id !== "cash") {
          const bankRes = await API.ACCOUNT.get({
            session: { user, token },
            req: { query: { id: bank_id } },
          });
          accountBank = bankRes?.items?.[0];
        }

        await APIProvider({
          endpoint: "bulk-insert",
          method: "POST",
          table: "account_ledger_mutations",
          action: "bulk-insert",
          body: {
            rows: [
              {
                account_code: type === "Income" ? "4-101" : "5-101",
                account_name: type === "Income" ? "Pendapatan Usaha" : "Beban Operasional",
                credit: type === "Income" ? amount : 0,
                debit: type === "Expense" ? amount : 0,
                category,
                notes: description,
                created_on: date || new Date().toISOString(),
                receipt_url: proof_image,
              },
              {
                account_code: !accountBank ? "1-101" : accountBank.code,
                account_name: !accountBank ? "Kas Utama (Cash on Hand)" : accountBank.name,
                credit: type === "Expense" ? amount : 0,
                debit: type === "Income" ? amount : 0,
                category,
                notes: description,
                created_on: date || new Date().toISOString(),
                receipt_url: proof_image,
              },
            ],
            updateOnDuplicate: true,
          },
        });

        return Response.json({ success: true, message: "Transaction created successfully" });
      }

      case "create_bank": {
        const bank_name = formData.get("bank_name") as string;
        const account_number = formData.get("account_number") as string;
        const holder_name = formData.get("holder_name") as string;

        if (!bank_name || !account_number || !holder_name) {
          return Response.json({ success: false, message: "All bank fields are required" });
        }

        await APIProvider({
          endpoint: "insert",
          method: "POST",
          table: "bank_accounts",
          body: { bank_name, account_number, holder_name },
        });

        return Response.json({ success: true, message: "Bank account created successfully" });
      }

      default:
        return Response.json({ success: false, message: "Unknown intent" });
    }
  } catch (error: any) {
    console.error("Finance action error:", error);
    return Response.json({ success: false, message: error.message || "An error occurred" });
  }
};

export default function FinanceRoute() {
  return <FinanceDashboard />;
}

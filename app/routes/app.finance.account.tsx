import type { ActionFunction } from "react-router";
import { requireAuth } from "~/utils/session.server";
import { API } from "~/nexus";
import AccountCoaPage from "~/components/features/finance/AccountCoaPage";
import { AppBreadcrumb } from "~/components/core/AppBreadcrumb";
import { TitleHeader } from "~/components/core/TitleHeader";

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "save_account_bank") {
    const { id, code, name, ref_account_number, ref_account_holder } =
      Object.fromEntries(formData.entries());

    const payload = {
      ...(id
        ? { id }
        : {
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
      message: res.success ? "Rekening bank berhasil disimpan" : "Gagal menyimpan rekening bank",
    });
  }

  if (actionType === "delete_account") {
    const id = formData.get("id") as string;
    const res = await API.ACCOUNT.update({
      session: { user, token },
      req: {
        body: { id, deleted_on: new Date().toISOString() } as any
      },
    });

    return Response.json({
      success: res.success,
      message: res.success ? "Akun berhasil dihapus" : "Gagal menghapus akun",
    });
  }

  return Response.json({ success: false, message: "Aksi tidak dikenal" });
};

export default function AccountPageRoute() {
  return (
    <div className="space-y-6">
      <TitleHeader
        title="Daftar Akun (COA)"
        description="Kelola bagan akun keuangan dan rekening bank perusahaan."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Dashboard", href: "/app" },
              { label: "Finance", href: "/app/finance" },
              { label: "COA", active: true },
            ]}
          />
        }
      />
      <AccountCoaPage />
    </div>
  );
}

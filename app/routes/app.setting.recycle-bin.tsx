import type { ActionFunction } from "react-router";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import RecycleBinFeature from "~/components/features/settings/RecycleBinFeature";

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const actionType = formData.get("intent");
  const id = formData.get("id") as string;

  if (actionType === "restore") {
    const res = await API.ORDERS.update({
      session: { user, token },
      req: { body: { id, deleted_on: null } },
    });
    return Response.json({
      success: res.success,
      message: res.success
        ? "Pesanan di kembalikan"
        : "Gagal mengembalikan pesanan",
    });
  }

  return Response.json({ success: false });
};

export default function RecycleBinPage() {
  return <RecycleBinFeature />;
}

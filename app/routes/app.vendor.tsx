import type { ActionFunction, LoaderFunction } from "react-router";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import { VendorFeature } from "~/components/features/vendor/VendorFeature";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAuth(request);
  return Response.json({ initialized: true });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = (await requireAuth(request)) as any;
  const formData = await request.formData();
  const actionType = formData.get("action");
  const id = formData.get("id") as string;

  try {
    if (actionType === "update_status") {
      const status = formData.get("status") as string;
      const res = await API.ORDERS.update({
        session: { user, token },
        req: { body: { id, status } },
      });
      return Response.json({
        success: res.success,
        message: res.success ? "Status pengerjaan diperbarui" : "Gagal memperbarui status",
      });
    }
    return Response.json({ success: false, message: "Action tidak dikenali" });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message || "Terjadi kesalahan" }, { status: 500 });
  }
};

export default function VendorRoute() {
  return <VendorFeature />;
}

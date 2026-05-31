import type { ActionFunction, LoaderFunction } from "react-router";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import OrderListFeature from "~/components/features/order/OrderListFeature";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAuth(request);
  return Response.json({ initialized: true });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const actionType = formData.get("action");
  const id = formData.get("id") as string;

  try {
    if (actionType === "delete") {
      const { order }: any = Object.fromEntries(formData.entries());
      const res = await API.ORDERS.update({
        session: { user, token },
        req: { body: { id, order, deleted_on: new Date().toISOString() } },
      });
      return Response.json({
        success: res.success,
        message: res.success ? "Pesanan dihapus" : "Gagal menghapus",
      });
    }

    if (actionType === "update_status") {
      const status = formData.get("status") as string;
      const res = await API.ORDERS.update({
        session: { user, token },
        req: { body: { id, status } },
      });
      return Response.json({
        success: res.success,
        message: res.success ? "Status diperbarui" : "Gagal memperbarui status",
      });
    }

    if (actionType === "update_status_printed") {
      const status = formData.get("status") as string;
      const res = await API.ORDERS.update({
        session: { user, token },
        req: { body: { id, status_printed: status } },
      });
      return Response.json({
        success: res.success,
        message: res.success ? "Status cetak diperbarui" : "Gagal memperbarui status cetak",
      });
    }

    if (actionType === "update_review") {
      const rating = Number(formData.get("rating"));
      const review = formData.get("review") as string;
      const res = await API.ORDERS.update({
        session: { user, token },
        req: { body: { id, rating, review } },
      });
      return Response.json({
        success: res.success,
        message: res.success ? "Ulasan diperbarui" : "Gagal memperbarui ulasan",
      });
    }

    if (actionType === "update_payment_proof") {
      const {
        payment_proof,
        payment_method,
        payment_detail,
        dp_payment_proof,
        dp_payment_method,
        order,
        dp_payment_detail,
      } = Object.fromEntries(formData.entries());

      const res = await API.ORDERS.update({
        session: { user, token },
        req: {
          body: {
            id,
            order,
            payment_proof,
            payment_method,
            payment_detail,
            dp_payment_proof,
            dp_payment_method,
            dp_payment_detail,
          },
        },
      });
      return Response.json({
        success: res.success,
        message: res.success ? "Bukti pembayaran diperbarui" : "Gagal memperbarui bukti pembayaran",
      });
    }

    if (actionType === "delete_payment_proof") {
      const field = formData.get("field") as string;
      const res = await API.ORDERS.update({
        session: { user, token },
        req: {
          body: {
            id,
            [field]: "",
            ...(field === "payment_proof" ? { payment_status: "down_payment", payment_journal_code: "" } : {}),
            ...(field === "dp_payment_proof" ? { dp_payment_journal_code: "" } : {}),
          },
        },
      });
      return Response.json({
        success: res.success,
        message: res.success ? "Bukti pembayaran dihapus" : "Gagal menghapus bukti pembayaran",
      });
    }

    return Response.json({ success: false, message: "Action tidak dikenali" });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message || "Terjadi kesalahan" }, { status: 500 });
  }
};

export default function OrderList() {
  return <OrderListFeature />;
}

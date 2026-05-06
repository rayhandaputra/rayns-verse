
import { type ActionFunction } from "react-router";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import OrderManageFeature from "~/components/features/order-manage/OrderManageFeature";

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = (await requireAuth(request)) as any;

  const formData = await request.formData();
  const rawData = Object.fromEntries(formData.entries()) as Record<string, any>;
  let { state, items } = rawData;

  try {
    state = state ? JSON.parse(state) : {};
    items = items ? JSON.parse(items) : {};

    await API.ORDERS.create({
      session: { user, token },
      req: {
        body: {
          ...state,
          items,
        },
      },
    });

    return Response.json({
      flash: {
        success: true,
        message: "Pesanan berhasil dibuat",
      },
    });
  } catch (error) {
    console.log(error);
    return Response.json({
      success: false,
      error_message: "Terjadi kesalahan saat menyimpan pesanan",
    });
  }
};

export default function CreatePesanan() {
  return <OrderManageFeature />;
}

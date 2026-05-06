
import { type LoaderFunction, type ActionFunction } from "react-router";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import { safeParseArray, safeParseObject } from "~/utils/utils";
import OrderHistoryFeature from "~/components/features/order-history/OrderHistoryFeature";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAuth(request);
  return Response.json({ initialized: true });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = (await requireAuth(request)) as any;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update_portfolio") {
    try {
      const data = Object.fromEntries(formData);
      const { id, review, rating, is_portfolio, images } = data as any;

      const response = await API.ORDERS.update({
        session: { user, token },
        req: {
          body: {
            id,
            ...(is_portfolio
              ? { is_portfolio }
              : {
                review,
                rating,
                images: safeParseArray(images),
              }),
          },
        },
      });

      return Response.json({
        success: response.success,
        message: response.message || "Berhasil update portfolio",
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        message: error.message || "Gagal update portfolio",
      });
    }
  }

  if (intent === "create_archive") {
    try {
      const rawData = formData.get("data") as string;
      const payload: any = safeParseObject(rawData);

      const finalPayload = {
        institution_id: payload.instansi_id,
        institution_name: payload.instansi,
        institution_domain: payload.accessCode,
        pic_name: payload.pemesanName,
        pic_phone: payload.pemesanPhone,
        status: "done",
        payment_status: "paid",
        images: payload.portfolioImages,
        discount_type: payload?.discount?.type || null,
        discount_value: payload?.discount?.value || 0,
        items: payload.items,
        is_archive: 1,
        total_amount: payload.totalAmount,
        is_sponsor: !payload?.isSponsor ? 0 : 1,
        order_date: payload.tanggalPemesanan,
        created_by: user,
      };

      const response = await API.ORDERS.create({
        session: { user, token },
        req: { body: finalPayload },
      });

      return Response.json({
        success: response.success,
        message: response.message || "Arsip berhasil disimpan",
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        message: error.message || "Gagal menyimpan arsip",
      });
    }
  }

  return Response.json({ success: false, message: "Invalid intent" });
};

export default function OrderHistoryPage() {
  return <OrderHistoryFeature />;
}

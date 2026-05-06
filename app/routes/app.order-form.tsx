
import { type LoaderFunction, type ActionFunction } from "react-router";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import { safeParseObject } from "~/utils/utils";
import OrderFormFeature from "~/components/features/order/OrderFormFeature";
import moment from "moment";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAuth(request);
  return Response.json({ initialized: true });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = (await requireAuth(request)) as any;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create_order") {
    try {
      const rawData = formData.get("data") as string;
      const payload: any = safeParseObject(rawData);

      const finalPayload = {
        institution_id: payload.instansi_id,
        institution_name: payload.instansi,
        institution_domain: payload.accessCode,
        pic_name: payload.pemesanName,
        pic_phone: payload.pemesanPhone,
        deadline: payload.deadline,
        payment_status:
          payload.statusPembayaran?.toLowerCase() === "lunas"
            ? "paid"
            : payload.statusPembayaran?.toLowerCase() === "dp"
              ? "down_payment"
              : "none",
        ...(payload?.dpAmount > 0 ? { dp_amount: payload?.dpAmount } : {}),
        total_amount: payload.totalAmount,
        is_sponsor: !payload?.isSponsor ? 0 : 1,
        is_kkn: !payload?.isKKN ? 0 : 1,
        ...(+payload?.isKKN && {
          kkn_source: "kkn_itera",
          kkn_type: payload?.kknDetails?.tipe ?? "PPM",
          kkn_detail: {
            period: payload?.kknDetails?.periode ?? 1,
            year: payload?.kknDetails?.tahun ?? moment().year(),
            value: payload?.kknDetails?.nilai ?? 0,
            total_group: payload?.kknDetails?.jumlahKelompok ?? 0,
          },
        }),
        discount_type: payload?.discount?.type || null,
        discount_value: payload?.discount?.value || 0,
        status: "pending",
        images: payload.portfolioImages,
        items: payload.items,
        created_by: {
          id: user?.id,
          fullname: user?.fullname,
        },
        is_personal: payload?.instansiMode === "perorangan" ? 1 : 0,
        kkn_period: payload?.kknDetails?.periode ?? 1,
        kkn_year: payload?.kknDetails?.tahun ?? moment().year(),
      };

      const response = await API.ORDERS.create({
        session: { user, token },
        req: { body: finalPayload },
      });

      return Response.json({
        success: response.success,
        message: response.success ? "Pesanan berhasil disimpan" : (response.message || "Gagal menyimpan pesanan"),
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        message: error.message || "Terjadi kesalahan saat menyimpan pesanan",
      });
    }
  }

  return Response.json({ success: false, message: "Invalid intent" });
};

export default function OrderFormPage() {
  return <OrderFormFeature />;
}

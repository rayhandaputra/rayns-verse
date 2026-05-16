import moment from "moment";
import { type ActionFunction } from "react-router";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import { safeParseObject } from "~/utils/utils";
import OrderEditFeature from "~/components/features/order/OrderEditFeature";

export const action: ActionFunction = async ({ request, params }) => {
    const { user, token }: any = await requireAuth(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "update_order") {
        try {
            const rawData = formData.get("data") as string;
            const payload: any = safeParseObject(rawData);

            const finalPayload = {
                id: params.id,
                order_number: payload.order_number,
                institution_id: payload.institution_id,
                institution_name: payload.institution_name,
                institution_domain: payload.institution_domain,
                pic_name: payload.pic_name,
                pic_phone: payload.pic_phone,
                deadline: payload.deadline,
                payment_status: payload.payment_status,
                ...(payload?.dp_amount > 0 && { dp_amount: payload?.dp_amount }),
                total_amount: payload.total_amount,
                is_sponsor: payload?.is_sponsor ? 1 : 0,
                is_kkn: payload?.is_kkn ? 1 : 0,
                ...(+payload?.is_kkn && {
                    kkn_source: "kkn_itera",
                    kkn_type: payload?.kkn_type || "PPM",
                    kkn_period: +payload?.kkn_period || 1,
                    kkn_year: +payload?.kkn_year || moment().year(),
                    kkn_detail: payload?.kkn_detail,
                }),
                discount_type: payload?.discount_type || null,
                discount_value: payload?.discount_value || 0,
                status: payload.status || "pending",
                images: payload.portfolioImages,
                items: payload.items,
                is_personal: payload?.is_personal ? 1 : 0,
            };

            const response = await API.ORDERS.update({
                session: { user, token },
                req: {
                    body: finalPayload,
                },
            });

            if (response.success) {
                return Response.json({
                    success: true,
                    message: "Pesanan berhasil diperbarui",
                });
            } else {
                return Response.json({
                    success: false,
                    message: response.message || "Gagal memperbarui pesanan",
                });
            }
        } catch (error: any) {
            console.error("Error updating order:", error);
            return Response.json({
                success: false,
                message: error.message || "Terjadi kesalahan saat memperbarui pesanan",
            });
        }
    }

    return Response.json({ success: false, message: "Invalid intent" });
};

export default function OrderEdit() {
    return <OrderEditFeature />;
}

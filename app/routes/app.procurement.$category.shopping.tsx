import { type ActionFunction } from "react-router";
import { requireAuth } from "~/utils/session.server";
import { API } from "~/nexus";
import ProcurementShoppingFeature from "~/components/features/procurement/ProcurementShoppingFeature";

export const action: ActionFunction = async ({ request }) => {
    const { user, token }: any = await requireAuth(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    const rawData = Object.fromEntries(formData);

    try {
        if (intent === "shopping") {
            const payload: any = {
                ...rawData,
                items: rawData.items ? JSON.parse(rawData.items as string) : [],
                supplier_id: Number(rawData.supplier_id),
                total_amount: Number(rawData.total_amount),
                shipping_cost: Number(rawData.shipping_cost),
                admin_cost: Number(rawData.admin_cost),
                discount_value: Number(rawData.discount),
                grand_total: Number(rawData.grand_total),
                kaos_payment_proof_paid: Number(rawData.proof),
                is_auto: rawData.is_auto === "true",
            };

            const res = await API.STOCK_LOG.create({
                session: { user, token },
                req: { body: payload },
            });

            return Response.json({
                success: res.success,
                message: res.success ? "Transaksi Berhasil Disimpan" : "Gagal menyimpan transaksi",
            });
        }
        return Response.json({ success: false, message: "Unknown intent" });
    } catch (error: any) {
        console.error("Action Error:", error);
        return Response.json({ success: false, message: error.message || "Server Error" });
    }
};

export default function ShoppingPage() {
    return <ProcurementShoppingFeature />;
}

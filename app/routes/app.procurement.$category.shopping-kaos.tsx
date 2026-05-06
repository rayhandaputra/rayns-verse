
import type { ActionFunction } from 'react-router';
import { API } from '~/nexus';
import { requireAuth } from "~/utils/session.server";
import ProcurementFeature from '~/components/features/procurement/ProcurementFeature';

export const action: ActionFunction = async ({ request }) => {
    const { user, token }: any = await requireAuth(request);
    const formData = await request.formData();
    const intent = formData.get('intent');

    if (intent === 'create_procurement') {
        try {
            const items = JSON.parse(formData.get('items') as string || "[]");
            const payload = {
                order_trx_code: formData.get('order_trx_code'),
                supplier_id: Number(formData.get('supplier_id')),
                total_item_qty: Number(formData.get('total_item_qty')),
                total_item_price: Number(formData.get('total_item_price')),
                discount_value: Number(formData.get('discount_value') || 0),
                admin_cost: Number(formData.get('admin_cost') || 0),
                shipping_cost: Number(formData.get('shipping_cost') || 0),

                sablon_supplier_id: formData.get('sablon_supplier_id') ? Number(formData.get('sablon_supplier_id')) : null,
                sablon_kebutuhan_per_meter: Number(formData.get('sablon_kebutuhan_per_meter') || 0),
                sablon_cost: Number(formData.get('sablon_cost') || 0),
                sablon_discount_value: Number(formData.get('sablon_discount_value') || 0),
                sablon_admin_cost: Number(formData.get('sablon_admin_cost') || 0),
                sablon_shipping_cost: Number(formData.get('sablon_shipping_cost') || 0),

                final_amount: Number(formData.get('final_amount')),
                laba_bersih: Number(formData.get('laba_bersih')),
                description: formData.get('description'),
                items: items
            };

            await API.STOCK_LOG.create({ session: { user, token }, req: { body: payload } });
            return Response.json({ success: true, message: "Pengadaan & Laba berhasil dicatat" });
        } catch (error: any) {
            return Response.json({ success: false, message: error.message });
        }
    }

    if (intent === 'update_sablon') {
        try {
            const id = formData.get('id');
            const payload = {
                id,
                sablon_supplier_id: Number(formData.get('sablon_supplier_id')),
                sablon_kebutuhan_per_meter: Number(formData.get('sablon_kebutuhan_per_meter')),
                sablon_cost: Number(formData.get('sablon_cost')),
                sablon_discount_value: Number(formData.get('sablon_discount_value') || 0),
                sablon_admin_cost: Number(formData.get('sablon_admin_cost') || 0),
                sablon_shipping_cost: Number(formData.get('sablon_shipping_cost') || 0),
                final_amount: Number(formData.get('final_amount')),
                laba_bersih: Number(formData.get('laba_bersih')),
                description: formData.get('description')
            };
            await API.STOCK_LOG.update({ session: { user, token }, req: { body: payload } });
            return Response.json({ success: true, message: "Belanja sablon berhasil ditambahkan" });
        } catch (error: any) {
            return Response.json({ success: false, message: error.message });
        }
    }

    if (intent === "update_payment_proof") {
        const id = formData.get("id");
        const payload: any = { id };

        const targetField = formData.get("target_field") as string;
        const fileUrl = formData.get("file_url");

        if (targetField && fileUrl) {
            payload[targetField] = fileUrl;
        } else {
            if (formData.has("kaos_payment_proof_dp")) payload.kaos_payment_proof_dp = formData.get("kaos_payment_proof_dp");
            if (formData.has("kaos_payment_proof_paid")) payload.kaos_payment_proof_paid = formData.get("kaos_payment_proof_paid");
            if (formData.has("sablon_payment_proof_dp")) payload.sablon_payment_proof_dp = formData.get("sablon_payment_proof_dp");
            if (formData.has("sablon_payment_proof_paid")) payload.sablon_payment_proof_paid = formData.get("sablon_payment_proof_paid");
        }

        const res = await API.STOCK_LOG.update({ session: { user, token }, req: { body: payload } });
        return Response.json({ success: res.success, message: res.success ? "Bukti pembayaran diperbarui" : "Gagal memperbarui bukti pembayaran" });
    }

    return Response.json({ success: false });
};

export default function KaosProcurementPage() {
    return <ProcurementFeature />;
}

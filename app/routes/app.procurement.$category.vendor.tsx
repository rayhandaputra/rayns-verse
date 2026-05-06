import type { ActionFunction } from "react-router";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import ProcurementVendorFeature from "~/components/features/procurement/ProcurementVendorFeature";

export const action: ActionFunction = async ({ request }) => {
    const { user, token }: any = await requireAuth(request);
    const formData = await request.formData();
    const intent = formData.get("intent");
    const dataRaw = formData.get("data") as string;
    const id = formData.get("id") as string;

    const data = dataRaw ? JSON.parse(dataRaw) : {};

    try {
        if (intent === "create" || intent === "update") {
            const payload = {
                name: data.name,
                location: data.location,
                type: data.type?.toLowerCase(), 
                category: "cotton_combed_premium",
                phone: data.phone || null,
                external_link: data.external_link || null,
                cotton_combed_category: data.cotton_combed_category,
                price_s_xl: data.price_s_xl || 0,
                price_2xl: data.price_2xl || 0,
                price_3xl: data.price_3xl || 0,
                price_4xl: data.price_4xl || 0,
                price_5xl: data.price_5xl || 0,
                price_long_sleeve: data.price_long_sleeve || 0,
                price_per_meter: data.price_per_meter || 0,
            };

            const apiCall = intent === "create" ? API.SUPPLIER.create : API.SUPPLIER.update;
            const res = await apiCall({
                session: { user, token },
                req: { body: intent === "update" ? { ...payload, id } : payload },
            });

            return Response.json({ success: res.success, message: res.message || "Berhasil menyimpan vendor" });
        }

        if (intent === "delete") {
            const res = await API.SUPPLIER.update({
                session: { user, token },
                req: { body: { id, deleted: 1 } },
            });
            return Response.json({ success: res.success, message: "Vendor berhasil dihapus" });
        }
    } catch (error: any) {
        return Response.json({ success: false, message: error.message || "Terjadi kesalahan server" });
    }
    return Response.json({ success: false, message: "Invalid Intent" });
};

export default function KaosVendorsPage() {
    return <ProcurementVendorFeature />;
}

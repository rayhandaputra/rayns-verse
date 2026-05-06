import type { ActionFunction } from "react-router";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import ProcurementSupplierFeature from "~/components/features/procurement/ProcurementSupplierFeature";

export const action: ActionFunction = async ({ request }) => {
    const { user, token }: any = await requireAuth(request);
    const formData = await request.formData();
    const intent = formData.get("intent");
    const dataRaw = formData.get("data") as string;
    const id = formData.get("id") as string;
    const data = dataRaw ? JSON.parse(dataRaw) : {};

    try {
        if (intent === "create_supplier" || intent === "update_supplier") {
            const payload = { ...data };
            const apiCall = intent === "create_supplier"
                ? API.SUPPLIER.create
                : API.SUPPLIER.update;

            const reqBody = intent === "update_supplier" ? { ...payload, id } : payload;

            const res = await apiCall({
                session: { user, token },
                req: { body: reqBody },
            });
            return Response.json({ success: res.success, message: res.message });
        }

        if (intent === "delete_supplier") {
            const res = await API.SUPPLIER.update({
                session: { user, token },
                req: { body: { id, deleted: 1 } },
            });
            return Response.json({ success: res.success, message: "Terhapus" });
        }
    } catch (error: any) {
        return Response.json({ success: false, message: error.message });
    }
    return Response.json({ success: false });
};

export default function SupplierPage() {
    return <ProcurementSupplierFeature />;
}

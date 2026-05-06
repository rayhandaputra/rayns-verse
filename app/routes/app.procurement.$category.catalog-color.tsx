import { type ActionFunction } from 'react-router';
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import ProcurementCatalogColorFeature from "~/components/features/procurement/ProcurementCatalogColorFeature";

export const action: ActionFunction = async ({ request }) => {
    const { user, token }: any = await requireAuth(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    try {
        if (intent === "create") {
            const name = formData.get("name") as string;
            const image_url = formData.get("image_url") as string;

            const res = await API.SHIRT_COLOR.create({
                session: { user, token },
                req: { body: { name, image_url } },
            });

            return Response.json({ success: res.success, message: res.message || "Warna berhasil ditambahkan" });
        }

        if (intent === "delete") {
            const id = formData.get("id") as string;
            const res = await API.SHIRT_COLOR.update({
                session: { user, token },
                req: { body: { id, deleted: 1 } },
            });
            return Response.json({ success: res.success, message: "Warna berhasil dihapus" });
        }
    } catch (error: any) {
        return Response.json({ success: false, message: error.message || "Terjadi kesalahan server" });
    }
    return Response.json({ success: false, message: "Invalid Intent" });
};

export default function KaosColorsPage() {
    return <ProcurementCatalogColorFeature />;
}

import type { ActionFunction } from "react-router";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import { safeParseArray } from "~/utils/utils";
import ProcurementComponentFeature from "~/components/features/procurement/ProcurementComponentFeature";

export const action: ActionFunction = async ({ request }) => {
    const { user, token }: any = await requireAuth(request);
    const formData = await request.formData();
    const { id, intent, data: rawData, sub_components: rawSubComponents }: any = Object.fromEntries(formData.entries());

    const data = rawData ? JSON.parse(rawData) : {};
    const sub_components = rawSubComponents ? JSON.parse(rawSubComponents) : [];

    try {
        if (intent === "update_material") {
            const payload = {
                id,
                commodity_name: data?.commodity_name,
                is_affected_side: data?.is_affected_side,
                is_package: data?.is_package,
                supplier_id: data?.supplier_id,
                unit: data?.unit,
                unit_price: data?.unit_price,
                capacity_per_unit: data?.capacity_per_unit,
            };
            const res = await API.SUPPLIER_COMMODITY.update({
                session: { user, token },
                req: {
                    body: {
                        ...payload,
                        sub_components: safeParseArray(sub_components)?.map((v: any) => ({
                            id: v.id.startsWith("sub-") ? null : v.id,
                            commodity_id: v.commodity_id || 0,
                            commodity_name: v.commodity_name,
                            capacity_per_unit: v.capacity_per_unit,
                        })),
                    },
                },
            });
            return Response.json({ success: res.success, message: res.message || "Berhasil update" });
        }

        if (intent === "create_material") {
            const payload = {
                commodity_id: 0,
                commodity_name: data?.commodity_name,
                is_affected_side: data?.is_affected_side,
                is_package: data?.is_package,
                supplier_id: data?.supplier_id,
                unit: data?.unit,
                unit_price: data?.unit_price,
                capacity_per_unit: data?.capacity_per_unit,
                category: data?.category
            };

            const res = await API.SUPPLIER_COMMODITY.create({
                session: { user, token },
                req: {
                    body: {
                        ...payload,
                        sub_components: sub_components?.map((v: any) => ({
                            commodity_id: 0,
                            commodity_name: v.commodity_name,
                            capacity_per_unit: v.capacity_per_unit
                        })),
                    },
                },
            });
            return Response.json({ success: res.success, message: res.message || "Berhasil tambah" });
        }

        if (intent === "delete_material") {
            const res = await API.SUPPLIER_COMMODITY.update({
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

export default function ComponentsPage() {
    return <ProcurementComponentFeature />;
}

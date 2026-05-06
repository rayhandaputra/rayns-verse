import { type ActionFunction, type LoaderFunction } from "react-router";
import { requireAuth } from "~/utils/session.server";
import { API } from "~/nexus";
import { AssetInventoryDashboard } from "~/components/features/asset/AssetInventoryDashboard";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAuth(request);
  return Response.json({ initialized: true });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    const id = formData.get("id") as string;
    const body = {
      asset_name: formData.get("name") as string,
      category: formData.get("category") as string,
      purchase_date: formData.get("purchaseDate") as string,
      total_value: Number(formData.get("value")),
      status: formData.get("status") as any,
      location: formData.get("location") as string,
      total_unit: Number(formData.get("unit")) || 1,
    };

    if (intent === "delete") {
      const res = await API.INVENTORY_ASSET.delete({ session: { user, token }, req: { body: { id } } });
      return Response.json({ success: res.success, message: res.message });
    }

    if (intent === "create") {
      const res = await API.INVENTORY_ASSET.create({ session: { user, token }, req: { body } });
      return Response.json({ success: res.success, message: res.message });
    }

    if (intent === "update") {
      const res = await API.INVENTORY_ASSET.update({ session: { user, token }, req: { body: { id, ...body } } });
      return Response.json({ success: res.success, message: res.message });
    }
  } catch (error: any) {
    return Response.json({ success: false, message: error.message });
  }

  return Response.json({ success: false, message: "Invalid intent" });
};

export default function FinanceInventoryPage() {
  return <AssetInventoryDashboard />;
}

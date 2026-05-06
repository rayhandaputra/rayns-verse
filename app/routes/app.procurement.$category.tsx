import type { LoaderFunction } from "react-router";
import ProcurementLayoutFeature from "~/components/features/procurement/ProcurementLayoutFeature";

export const loader: LoaderFunction = async ({ params }) => {
  return Response.json({ category: params.category });
};

export default function InventoryCategoryLayout() {
  return <ProcurementLayoutFeature />;
}

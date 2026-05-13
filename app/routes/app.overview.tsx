
import { type LoaderFunctionArgs } from "react-router";
import { requireRole } from "~/utils/session.server";
import OverviewFeature from "~/components/features/overview/OverviewFeature";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireRole(request, ["admin", "ceo", "developer", "staff"]);
  return Response.json({ initialized: true });
}

export default function DashboardOverview() {
  return <OverviewFeature />;
}


import { type LoaderFunctionArgs } from "react-router";
import { requireAuth } from "~/utils/session.server";
import OverviewFeature from "~/components/features/overview/OverviewFeature";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  return Response.json({ initialized: true });
}

export default function DashboardOverview() {
  return <OverviewFeature />;
}

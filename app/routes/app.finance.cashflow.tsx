import type { LoaderFunction } from "react-router";
import { requireAuth } from "~/utils/session.server";
import { CashflowDashboard } from "~/components/features/finance/CashflowDashboard";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAuth(request);
  return Response.json({ success: true });
};

export default function CashflowRoute() {
  return <CashflowDashboard />;
}

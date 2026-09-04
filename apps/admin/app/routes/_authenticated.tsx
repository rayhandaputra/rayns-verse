import { Outlet, useLoaderData, useNavigation } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { AppShell } from "~/components/shared/layouts/AppShell";
import { PageSkeleton } from "~/components/shared/widgets/PageSkeleton";
import { requireAuth } from "~/lib/session.server";
import type { SessionData } from "~/lib/session.server";
import { ACCESS_ENTRIES } from "~/constants/access";

export interface AccessSidebarItem {
  id: number | string;
  key?: string | null;
  label: string;
  category: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireAuth(request);
  const backendBase = (
    process.env.BACKEND_API_URL ||
    process.env.API_URL ||
    "https://kinauid-backend.vercel.app"
  ).replace(/\/+$/, "");

  let accessItems: AccessSidebarItem[] = ACCESS_ENTRIES.map((entry, idx) => ({
    id: entry.id || idx + 1,
    key: entry.id,
    label: entry.label,
    category: entry.category,
  }));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${backendBase}/access`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.data) && json.data.length > 0) {
        accessItems = json.data.map((item: any) => ({
          id: item.id,
          key: item.key || item.id,
          label: item.label,
          category: item.category || "Umum",
        }));
      }
    }
  } catch {
    // Fallback data siap dipakai
  }

  return { user: session, accessItems };
}

export default function AuthenticatedLayout() {
  const { user, accessItems } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";

  return (
    <AppShell accessItems={accessItems}>
      {isNavigating ? <PageSkeleton /> : <Outlet context={{ user, accessItems }} />}
    </AppShell>
  );
}

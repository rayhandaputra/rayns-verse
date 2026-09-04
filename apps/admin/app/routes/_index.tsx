import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getSessionData } from "~/lib/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSessionData(request);
  if (session) return redirect("/beranda");
  return redirect("/auth/login");
}

export default function IndexRoute() {
  return null;
}

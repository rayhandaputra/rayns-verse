// Route ini handle POST /auth/logout — revoke token + destroy session dan redirect ke login.
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { destroySession, getSessionData } from "~/lib/session.server";
import { apiFetch } from "~/lib/api";

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSessionData(request);

  if (session?.access_token && session?.refresh_token) {
    apiFetch("/auth/logout", {
      method: "POST",
      token: session.access_token,
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    }).catch(() => {});
  }

  return destroySession(request);
}

export async function loader({ request }: LoaderFunctionArgs) {
  return destroySession(request);
}

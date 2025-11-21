import type { ActionFunction } from "react-router";
import { logout } from "~/lib/session.server";

export const action: ActionFunction = async ({ request }) => {
  // Use the logout function from session.server which handles
  // session destruction and redirects to login
  return logout(request);
};

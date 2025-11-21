// routes/_auth.login.tsx
import { redirect, type ActionFunctionArgs } from "react-router";
import { API } from "~/lib/api";
import { verifyLogin } from "~/lib/auth.server";
import { createUserSession } from "~/lib/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = form.get("email");

  if (!email || typeof email !== "string") {
    return { error: "Email harus diisi" };
  }

  // Verify login credentials
  const auth = await verifyLogin(email);
  if (!auth) {
    return { error: "Email atau password salah" };
  }

  // Create user session and redirect
  return createUserSession(auth.token, "/app/overview");
}

// routes/_auth.login.tsx
import { redirect, type ActionFunctionArgs } from "react-router";
import { API } from "~/lib/api";
import { verifyLogin } from "~/lib/auth.server";
import { createUserSession } from "~/lib/session.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const form = await request.formData();
    const email = form.get("email");

    if (!email || typeof email !== "string") {
      return { error: "Email harus diisi" };
    }

    // Verify login credentials
    const auth = await verifyLogin(email);
    if (!auth) {
      return { error: "Email tidak terdaftar" };
    }

    // Create user session and redirect
    return createUserSession(auth.token, "/app/overview");
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Terjadi kesalahan saat login. Silakan coba lagi." };
  }
}

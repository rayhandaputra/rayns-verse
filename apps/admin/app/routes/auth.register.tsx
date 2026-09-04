import { Form, Link, useNavigation } from "react-router";
import type { MetaFunction, ActionFunctionArgs } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { setFlashMessage, flashRedirect } from "~/lib/flash.server";
import { BRAND_NAME } from "~/constants/brand";
import { apiFetch, ApiError } from "~/lib/api";
import { createUserSession } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: `Register — ${BRAND_NAME}` }];

interface AuthResponseData {
  user: { id: string; name: string; email: string; role: string; is_active: boolean; avatar_url: string | null };
  access_token: string;
  refresh_token: string;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    const cookie = await setFlashMessage(request, { type: "error", message: "Semua field wajib diisi." });
    return flashRedirect("/auth/register", cookie);
  }

  try {
    const res = await apiFetch<AuthResponseData>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    if (res.status === "error" || !res.data) {
      const cookie = await setFlashMessage(request, { type: "error", message: res.error_message ?? "Registrasi gagal." });
      return flashRedirect("/auth/register", cookie);
    }
    const { user, access_token, refresh_token } = res.data;
    return createUserSession(
      {
        access_token,
        refresh_token,
        user_id: user.id,
        user_email: user.email,
        user_name: user.name,
        user_role: user.role,
      },
      "/beranda"
    );
  } catch (err) {
    const message = err instanceof ApiError && err.statusCode === 409
      ? "Email sudah terdaftar."
      : "Tidak dapat terhubung ke server.";
    const cookie = await setFlashMessage(request, { type: "error", title: "Registrasi gagal", message });
    return flashRedirect("/auth/register", cookie);
  }
}

export default function RegisterPage() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[var(--background)] text-[var(--foreground)]">
      <div className="w-full max-w-sm">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-xs font-mono text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-10 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          BACK TO LOGIN
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <img
              src="/logo-kinau.png"
              alt={BRAND_NAME}
              className="w-7 h-7 rounded-xs object-cover border border-[var(--border)]"
            />
            <span className="font-mono font-bold tracking-tight uppercase text-base">{BRAND_NAME}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1.5">CREATE ACCOUNT</h1>
          <p className="text-xs font-mono text-[var(--muted-foreground)]">
            Create your admin account to get started.
          </p>
        </div>

        <Form method="post" className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              Name
            </label>
            <input
              name="name"
              required
              className={cn(
                "w-full px-3 py-2.5 text-sm font-mono",
                "bg-[var(--card)] border border-[var(--border)]",
                "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
                "focus:border-[var(--foreground)] outline-none transition-colors"
              )}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className={cn(
                "w-full px-3 py-2.5 text-sm font-mono",
                "bg-[var(--card)] border border-[var(--border)]",
                "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
                "focus:border-[var(--foreground)] outline-none transition-colors"
              )}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className={cn(
                "w-full px-3 py-2.5 text-sm font-mono",
                "bg-[var(--card)] border border-[var(--border)]",
                "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
                "focus:border-[var(--foreground)] outline-none transition-colors"
              )}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-2.5 mt-2 text-sm font-mono font-bold",
              "bg-[var(--foreground)] text-[var(--background)]",
              "hover:opacity-90 transition-opacity",
              "disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            )}
          >
            {isSubmitting ? (<><Loader2 size={14} className="animate-spin" /> CREATING...</>) : "CREATE ACCOUNT"}
          </button>
        </Form>
      </div>
    </div>
  );
}

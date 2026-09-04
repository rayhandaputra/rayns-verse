import { useState } from "react";
import { Form, Link, useFetcher, useNavigation } from "react-router";
import type { MetaFunction, ActionFunctionArgs } from "react-router";
import { ArrowLeft, Lock, Mail, Loader2, Chrome } from "lucide-react";
import { cn } from "~/lib/utils";
import { setFlashMessage, flashRedirect } from "~/lib/flash.server";
import { BRAND_NAME, BRAND_TAGLINE } from "~/constants/brand";
import { apiFetch, ApiError } from "~/lib/api";
import { createUserSession } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: `Login — ${BRAND_NAME}` }];

interface AuthResponseData {
  user: { id: string; name: string; email: string; role: string; is_active: boolean; avatar_url: string | null };
  access_token: string;
  refresh_token: string;
}

async function handleGoogle(request: Request, idToken: string) {
  try {
    const res = await apiFetch<AuthResponseData>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });

    if (res.status === "error" || !res.data) {
      const cookie = await setFlashMessage(request, {
        type: "error",
        title: "Login Google gagal",
        message: res.error_message ?? "Terjadi kesalahan.",
      });
      return flashRedirect("/auth/login", cookie);
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
    const message = err instanceof ApiError && err.statusCode === 401
      ? "ID token Google tidak valid."
      : "Tidak dapat terhubung ke server. Coba lagi.";

    const cookie = await setFlashMessage(request, {
      type: "error",
      title: "Login Google gagal",
      message,
    });
    return flashRedirect("/auth/login", cookie);
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "google") {
    const idToken = formData.get("idToken") as string;
    if (!idToken) {
      const cookie = await setFlashMessage(request, { type: "error", message: "ID token Google tidak ditemukan." });
      return flashRedirect("/auth/login", cookie);
    }
    return handleGoogle(request, idToken);
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    const cookie = await setFlashMessage(request, { type: "error", message: "Email dan password wajib diisi." });
    return flashRedirect("/auth/login", cookie);
  }

  try {
    const res = await apiFetch<AuthResponseData>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.status === "error" || !res.data) {
      const cookie = await setFlashMessage(request, { type: "error", title: "Login gagal", message: res.error_message ?? "Terjadi kesalahan." });
      return flashRedirect("/auth/login", cookie);
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
    const message = err instanceof ApiError && err.statusCode === 401
      ? "Email atau password salah."
      : "Tidak dapat terhubung ke server. Coba lagi.";

    const cookie = await setFlashMessage(request, { type: "error", title: "Login gagal", message });
    return flashRedirect("/auth/login", cookie);
  }
}

export default function LoginPage() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleFetcher = useFetcher();
  const isGoogleSubmitting = googleFetcher.state === "submitting";

  const handleGoogleClick = async () => {
    if (googleLoading || isGoogleSubmitting) return;
    setGoogleLoading(true);
    try {
      // Firebase popup → dapatkan Google ID token → submit via fetcher
      // dengan idToken yang benar (bukan klik button hidden yang kosong).
      const { signInWithGoogle } = await import("~/lib/firebase");
      const idToken = await signInWithGoogle();
      const form = new FormData();
      form.set("intent", "google");
      form.set("idToken", idToken);
      googleFetcher.submit(form, { method: "post", action: "/auth/login" });
    } catch (err) {
      console.error("Firebase Google login error:", err);
      alert("Gagal masuk dengan Google. Pastikan popup tidak diblokir dan Google Sign-in aktif di Firebase Console.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-[var(--background)] text-[var(--foreground)]">
      {/* Left — brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 border-r border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-3">
          <img
            src="/logo-kinau.png"
            alt={BRAND_NAME}
            className="w-8 h-8 rounded-xs object-cover border border-[var(--border)]"
          />
          <span className="font-mono font-bold tracking-tight uppercase text-lg">{BRAND_NAME}</span>
        </div>

        <div className="space-y-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
            {BRAND_TAGLINE}
          </p>
          <h2 className="text-4xl font-bold tracking-tight leading-tight">
            Urus backstage.<br />
            Semua dalam<br />
            <span className="text-[var(--profit)]">satu panel</span>.
          </h2>
          <div className="flex items-center gap-6 font-mono text-xs text-[var(--muted-foreground)]">
            <div>
              <p className="text-[var(--foreground)] font-bold">DOMAIN</p>
              <p className="text-[var(--profit)]">TERKELOLA</p>
            </div>
            <div>
              <p className="text-[var(--foreground)] font-bold">DOKUMEN</p>
              <p className="text-[var(--foreground)]">TERTIB</p>
            </div>
          </div>
        </div>

        <p className="font-mono text-[10px] text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} {BRAND_NAME} — {BRAND_TAGLINE}
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-10 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            BACK TO HOME
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-4 lg:hidden">
              <img
                src="/logo-kinau.png"
                alt={BRAND_NAME}
                className="w-7 h-7 rounded-xs object-cover border border-[var(--border)]"
              />
              <span className="font-mono font-bold tracking-tight uppercase text-base">{BRAND_NAME}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1.5">LOGIN</h1>
            <p className="text-xs font-mono text-[var(--muted-foreground)]">
              Enter your credentials to access the admin panel.
            </p>
          </div>

          <Form method="post" className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={cn(
                    "w-full pl-9 pr-3 py-2.5 text-sm font-mono",
                    "bg-[var(--card)] border border-[var(--border)]",
                    "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
                    "focus:border-[var(--foreground)] outline-none transition-colors"
                  )}
                />
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    "w-full pl-9 pr-9 py-2.5 text-sm font-mono",
                    "bg-[var(--card)] border border-[var(--border)]",
                    "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
                    "focus:border-[var(--foreground)] outline-none transition-colors"
                  )}
                />
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  <Lock size={14} />
                </button>
              </div>
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
              {isSubmitting ? (<><Loader2 size={14} className="animate-spin" /> ACCESSING...</>) : "ACCESS DASHBOARD"}
            </button>
          </Form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted-foreground)]">
              OR
            </span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Google login */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={googleLoading || isGoogleSubmitting}
            className={cn(
              "w-full flex items-center justify-center gap-2.5 py-2.5 text-sm font-mono font-bold",
              "border border-[var(--border-strong)]",
              "text-[var(--foreground)]",
              "hover:border-[var(--foreground)] transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "cursor-pointer"
            )}
          >
            {googleLoading || isGoogleSubmitting ? (
              <Loader2 size={16} className="animate-spin text-[var(--progress)]" />
            ) : (
              <Chrome size={16} />
            )}
            {googleLoading || isGoogleSubmitting ? "CONNECTING..." : "CONTINUE WITH GOOGLE"}
          </button>

          <p className="mt-8 text-center text-xs font-mono text-[var(--muted-foreground)]">
            Don't have an account?{" "}
            <Link to="/auth/register" className="text-[var(--foreground)] hover:underline">
              REGISTER
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

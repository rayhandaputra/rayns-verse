import { useState, useEffect } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { Toaster } from "sonner";
import { ErrorBoundary as UIErrorBoundary } from "~/components/shared/components/ErrorBoundary";
import { GlobalLoader } from "~/components/shared/widgets/GlobalLoader";
import { NavigationProgress } from "~/components/shared/widgets/NavigationProgress";
import { FlashObserver } from "~/components/shared/widgets/FlashObserver";
import { useUIStore } from "~/components/shared/store/ui";
import { getFlashMessage } from "~/lib/flash.server";
import type { FlashMessage } from "~/lib/flash.server";
import "./index.css";

export const links: LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "any" },
  { rel: "icon", href: "/logo-kinau.png", type: "image/png" },
  { rel: "apple-touch-icon", href: "/logo-kinau.png" },
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const { flash, headers } = await getFlashMessage(request);
  return Response.json({ flash }, { headers });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme } = useUIStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsHydrated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Register service worker (PWA) — hanya di browser, setelah hydration.
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          /* SW gagal register (mis. http localhost preview) — abaikan */
        });
      });
    }
  }, []);

  return (
    <html lang="id" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#050505" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="KINAU" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased font-sans bg-[var(--background)] text-[var(--foreground)]">
        <div
          className={
            !isHydrated
              ? "opacity-0"
              : "opacity-100 transition-opacity duration-500"
          }
        >
          {children}
        </div>
        <NavigationProgress />
        <GlobalLoader />
        <Toaster position="top-right" expand={false} richColors />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { flash } = useLoaderData<typeof loader>();

  return (
    <>
      <FlashObserver flash={flash as FlashMessage | null} />
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  return (
    <UIErrorBoundary
      error={error}
      brandName="KINAU"
      homePath="/"
      backLabel="Kembali ke Beranda"
      illustration="/illustration/cipmang1-no-bg.png"
      illustration404="/illustration/cipmang3-no-bg.png"
    />
  );
}

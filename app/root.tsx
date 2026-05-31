import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useNavigation,
  useFetcher,
  type LinksFunction,
  type LoaderFunctionArgs,
} from "react-router";

import { LoaderProvider } from "~/hooks/use-loading";
import { ModalProvider } from "~/provider/modal-provider";
import { Toaster } from "sonner";

import type { Route } from "./+types/root";
import "./app.css";
import "./tailwind.css";
import RootLayout from "./components/shared/layout/manage";
import { getOptionalUser } from "./utils/session.server";
import { useRouteError } from "react-router";
import { useEffect, useState } from "react";
import { sendTelegramLog } from "./utils/telegram-log";
import { AlertCircle, Home, RefreshCw, WifiOff } from "lucide-react";
// import stylesheet from "./tailwind.css";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get optional user (for public pages)
    const authData = await getOptionalUser(request);
    return {
      user: authData?.user || null,
    };
  } catch (error) {
    console.error("Error in root loader:", error);
    // Return default data even if there's an error
    return {
      user: null,
    };
  }
}

export function meta() {
  return [
    { title: "Kinau | ID Card Specialist" },
    { name: "description", content: "" },
    { name: "referrer", content: "no-referrer" },
  ];
}

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap",
  },
  {
    rel: "icon",
    href: "/head-icon-kinau.png",
    type: "image/png",
  },
];

// export const RootLayoutPageNames = ["/", "/app"];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased bg-gray-50 min-h-screen font-sans">
        {children}
        <Toaster
          closeButton
          richColors
          position="top-right"
          toastOptions={{
            classNames: {
              success: "!bg-green-600 !text-white !border-0",
              warning: "!bg-orange-500 !text-white !border-0",
              error: "!bg-red-700 !text-white !border-0",
              closeButton: "!bg-gray-200 !text-black !border-gray-200",
            },
          }}
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const loaderData = useLoaderData() as { user?: any };
  const user = loaderData?.user || null;
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  return (
    <LoaderProvider>
      <ModalProvider>
        <RootLayout session={user}>
          {isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <div className="animate-spin w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full" />
            </div>
          )}
          <Outlet context={{ user }} />
        </RootLayout>
      </ModalProvider>
    </LoaderProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const fetcher = useFetcher<{
    success: boolean;
    ddl?: string;
    error?: string;
    bridgeResponse?: any;
  }>();

  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const statusCode = isRouteErrorResponse(error) ? error.status : 500;
  const errorMessage = isRouteErrorResponse(error)
    ? error.data?.message || error.statusText || "Terjadi kesalahan"
    : error instanceof Error
      ? error.message
      : "Terjadi kesalahan yang tidak diketahui";

  // Pattern matching: detect DB structural errors
  const dbErrorPatterns = [
    "SQLSTATE",
    "Unknown column",
    "Table doesn't exist",
    "table doesn't exist",
    "Base table or view not found",
    "Column not found",
    "Undefined column",
    "no such table",
    "no such column",
  ];

  const isDbStructuralError = dbErrorPatterns.some((pattern) =>
    errorMessage.includes(pattern)
  );

  const isSubmitting = fetcher.state === "submitting";
  const healingResult = fetcher.data;

  function handleFixError() {
    fetcher.submit(
      { errorMessage },
      {
        method: "POST",
        action: "/api/fix-error",
        encType: "application/json",
      }
    );
  }

  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <title>{is404 ? "Halaman Tidak Ditemukan" : "Terjadi Kesalahan"} — KINAU ID</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f9ff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
          .container { max-width: 420px; width: 100%; text-align: center; }
          .icon-wrap { width: 80px; height: 80px; border-radius: 24px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; }
          .icon-404 { background: #fef3c7; }
          .icon-500 { background: #fee2e2; }
          .icon-wrap svg { width: 36px; height: 36px; }
          .status { font-size: 4rem; font-weight: 900; color: #1e293b; letter-spacing: -2px; line-height: 1; margin-bottom: 0.5rem; }
          .title { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; }
          .desc { font-size: 0.875rem; color: #64748b; line-height: 1.6; margin-bottom: 2rem; }
          .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
          .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 12px; font-size: 0.875rem; font-weight: 700; text-decoration: none; transition: all 0.2s; cursor: pointer; border: none; }
          .btn-primary { background: #1e434c; color: white; }
          .btn-primary:hover { background: #35606b; }
          .btn-secondary { background: white; color: #475569; border: 1px solid #e2e8f0; }
          .btn-secondary:hover { background: #f8fafc; }
          .detail { margin-top: 2rem; padding: 1rem; background: white; border-radius: 12px; border: 1px solid #e2e8f0; text-align: left; font-size: 0.75rem; color: #94a3b8; max-height: 120px; overflow: auto; word-break: break-all; }
          .detail code { font-family: monospace; }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
          .animate-pulse { animation: pulse 1.5s ease-in-out infinite; }
        `}} />
      </head>
      <body>
        <div className="container">
          <div className={`icon-wrap ${is404 ? "icon-404" : "icon-500"}`}>
            {is404 ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            )}
          </div>

          <div className="status">{statusCode}</div>

          <h1 className="title">
            {is404 ? "Halaman Tidak Ditemukan" : "Terjadi Kesalahan"}
          </h1>

          <p className="desc">
            {is404
              ? "Halaman yang kamu cari tidak ada atau sudah dipindahkan. Periksa kembali URL-nya."
              : "Maaf, terjadi gangguan pada sistem. Tim kami sudah diberitahu. Silakan coba lagi dalam beberapa saat."}
          </p>

          <div className="actions">
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              ↻ Coba Lagi
            </button>
            <a href="/" className="btn btn-secondary">
              ← Kembali ke Beranda
            </a>
          </div>

          {import.meta.env.DEV && errorMessage && (
            <div className="detail">
              <code>{errorMessage}</code>
            </div>
          )}
        </div>

        {/* ─── Self-Healing Bottom Bar ─────────────────────────────────────── */}
        {isDbStructuralError && (
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              background: "#0f172a",
              borderTop: "1px solid #1e293b",
              padding: "1rem 1.5rem",
              animation: "fadeInUp 0.3s ease-out forwards",
            }}
          >
            <div
              style={{
                maxWidth: "720px",
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              {/* Left: Error context */}
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#ef4444",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#f87171",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Database Schema Error Detected
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#94a3b8",
                    lineHeight: 1.4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "400px",
                  }}
                >
                  {errorMessage.slice(0, 120)}
                  {errorMessage.length > 120 ? "…" : ""}
                </p>
              </div>

              {/* Right: Action + Status */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                {/* Status pills */}
                {healingResult && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.375rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      background: healingResult.success ? "#064e3b" : "#7f1d1d",
                      color: healingResult.success ? "#6ee7b7" : "#fca5a5",
                    }}
                  >
                    {healingResult.success ? "✓ Fixed" : "✗ Failed"}
                    {healingResult.ddl && (
                      <span
                        style={{
                          marginLeft: "0.25rem",
                          opacity: 0.7,
                          maxWidth: "120px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        — {healingResult.ddl.slice(0, 40)}
                      </span>
                    )}
                  </span>
                )}

                {healingResult?.error && !healingResult.success && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "#fca5a5",
                      maxWidth: "150px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {healingResult.error}
                  </span>
                )}

                {/* CTA Button */}
                <button
                  onClick={handleFixError}
                  disabled={isSubmitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.625rem 1.25rem",
                    borderRadius: "10px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    background: isSubmitting ? "#334155" : "#2563eb",
                    color: "#ffffff",
                    transition: "all 0.2s ease",
                    opacity: isSubmitting ? 0.7 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>⏳</span>
                      Fixing...
                    </>
                  ) : healingResult?.success ? (
                    <>↻ Reload Page</>
                  ) : (
                    <>⚡ Fix This Problem</>
                  )}
                </button>

                {/* If fixed, show reload action */}
                {healingResult?.success && (
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      padding: "0.625rem 1rem",
                      borderRadius: "10px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      border: "1px solid #334155",
                      cursor: "pointer",
                      background: "transparent",
                      color: "#94a3b8",
                      transition: "all 0.2s ease",
                    }}
                  >
                    ↻ Reload
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <Scripts />
      </body>
    </html>
  );
}

// export function ErrorBoundary() {
//   const error = useRouteError();

//   useEffect(() => {
//     if (error) {
//       sendTelegramLog("ROOT_SYSTEM_ERROR", {
//         error,
//       });
//     }
//   }, [error]);

//   if (isRouteErrorResponse(error)) {
//     return (
//       <div className="error-container">
//         <h1>
//           {error.status} {error.statusText}
//         </h1>
//         <p>{error.data}</p>
//       </div>
//     );
//   } else if (error instanceof Error) {
//     return (
//       <div className="error-container">
//         <h1>Error Terjadi</h1>
//         <p>{error.message}</p>
//         <pre>{error.stack}</pre>
//       </div>
//     );
//   } else {
//     return <h1>Unknown Error</h1>;
//   }
// }
// ======================================
// export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
//   let message = "Oops!";
//   let details = "An unexpected error occurred.";
//   let stack: string | undefined;

//   if (isRouteErrorResponse(error)) {
//     message = error.status === 404 ? "404" : "Error";
//     details =
//       error.status === 404
//         ? "The requested page could not be found."
//         : error.statusText || details;
//   } else if (import.meta.env.DEV && error && error instanceof Error) {
//     details = error.message;
//     stack = error.stack;
//   }

//   return (
//     <main className="pt-16 p-4 container mx-auto">
//       <h1>{message}</h1>
//       <p>{details}</p>
//       {stack && (
//         <pre className="w-full p-4 overflow-x-auto">
//           <code>{stack}</code>
//         </pre>
//       )}
//     </main>
//   );
// }

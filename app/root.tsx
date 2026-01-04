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
  type LoaderFunctionArgs,
} from "react-router";

import { LoaderProvider } from "~/hooks/use-loading";
import { ModalProvider } from "~/provider/modal-provider";
import { Toaster } from "sonner";

import type { Route } from "./+types/root";
import "./app.css";
import "./tailwind.css";
import RootLayout from "./components/layout/manage";
import { getOptionalUser } from "./lib/session.server";
import { useRouteError } from "react-router";
import { useEffect, useState } from "react";
import { sendTelegramLog } from "./lib/telegram-log";
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

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Your Custom Specialist" },
    { name: "description", content: "" },
  ];
}

export const links = (): any[] => [
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
    rel: "icon",
    href: "/head-icon-kinau.png",
    type: "image/png",
  },
];

// export const RootLayoutPageNames = ["/", "/app"];

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useLoaderData() as { user?: any } | undefined;
  const user = loaderData?.user || null;
  const location = useLocation();

  const navigation = useNavigation();

  const isLoading = navigation.state !== "idle";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased bg-gray-50 min-h-screen">
        <LoaderProvider>
          <ModalProvider>
            {/* Loader Global */}
            {isLoading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                <div className="animate-spin w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full" />
              </div>
            )}

            {/* <RootLayout session={user}> */}
            <div>{children}</div>
            {/* </RootLayout> */}
          </ModalProvider>
        </LoaderProvider>

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
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Cek status koneksi saat komponen dimuat
    setIsOnline(navigator.onLine);

    // Kirim log hanya jika ada internet (jika offline, log tidak akan terkirim)
    if (error && navigator.onLine) {
      sendTelegramLog("ROOT_SYSTEM_ERROR", {
        message: error instanceof Error ? error.message : "Route Error",
        status: isRouteErrorResponse(error) ? error.status : "500",
        url: window.location.href,
      });
    }
  }, [error]);

  const handleReload = () => window.location.reload();

  // 1. Tampilan UI Khusus Offline (Tidak ada Internet)
  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="text-orange-600 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Koneksi Terputus
          </h1>
          <p className="text-gray-600 mb-8">
            Sepertinya perangkat Anda tidak terhubung ke internet. Periksa
            koneksi Wi-Fi atau data seluler Anda.
          </p>
          <button
            onClick={handleReload}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all active:scale-95"
          >
            <RefreshCw size={18} />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // 2. Tampilan UI Error Response (404, 401, dll)
  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="text-6xl font-black text-gray-200 mb-4">
            {error.status}
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {error.status === 404 ? "Halaman Tidak Ditemukan" : "Akses Ditolak"}
          </h1>
          <p className="text-gray-600 mb-8">
            {error.data || "Maaf, terjadi kesalahan saat memuat halaman ini."}
          </p>
          <a
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-gray-200"
          >
            <Home size={18} />
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  // 3. Tampilan UI Fatal Error (Crash/Logic Error)
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-red-100">
        <div className="bg-red-600 p-6 text-white flex items-center gap-4">
          <AlertCircle size={32} />
          <div>
            <h1 className="text-xl font-bold">Terjadi Kesalahan Sistem</h1>
            <p className="opacity-90 text-sm font-mono">
              ID Error: {Math.random().toString(36).substring(7).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-gray-50 rounded-lg p-4 mb-6 overflow-auto max-h-48 border border-gray-200">
            <p className="text-red-700 font-bold mb-2">
              {error instanceof Error ? error.message : "Unknown Error"}
            </p>
            {error instanceof Error && (
              <pre className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">
                {error.stack}
              </pre>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReload}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all"
            >
              <RefreshCw size={18} />
              Muat Ulang
            </button>
            <a
              href="/"
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Hubungi Support
            </a>
          </div>
        </div>
      </div>
    </div>
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

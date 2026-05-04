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

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Kinau | ID Card Specialist" },
    { name: "description", content: "" },
    { name: "referrer", content: "no-referrer" },
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
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="referrer" content="no-referrer" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased bg-gray-50 min-h-screen">
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
  console.error("ErrorBoundary caught:", error);

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">Terjadi Kesalahan</h1>
      <pre className="mt-4 p-4 bg-gray-100 rounded text-left overflow-auto max-h-96">
        {error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
      </pre>
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Muat Ulang
      </button>
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

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigation,
} from "react-router";

import { LoaderProvider } from "~/hooks/use-loading";
import { ModalProvider } from "~/provider/modal-provider";
import { Toaster } from "sonner";

import type { Route } from "./+types/root";
import "./app.css";
import "./tailwind.css";
import RootLayout from "./components/layout/manage";
// import stylesheet from "./tailwind.css";

export function meta({}: Route.MetaArgs) {
  return [{ title: "KINAU ID" }, { name: "description", content: "" }];
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
    href: "/kinau-logo.png",
    type: "image/png",
  },
];

// export const RootLayoutPageNames = ["/", "/app"];

export function Layout({ children }: { children: React.ReactNode }) {
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
            
            <RootLayout session={null}>
              <div>{children}</div>
            </RootLayout>
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

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

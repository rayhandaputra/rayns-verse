import { useEffect, useRef, useState } from "react";
import {
  Outlet,
  useLoaderData,
  useLocation,
  type LoaderFunction,
} from "react-router";
import { toast } from "sonner";
// NOTE: Uncomment import ini jika requireAuth diaktifkan di loader
// import { requireAuth } from "~/lib/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  // Require authentication for app routes
  // const { user } = await requireAuth(request);
  
  return {
    // user,
    message: "OK"
  };
};

export default function AppLayout() {
  const location = useLocation();
  const [flash, setFlash] = useState<any>(null);

  useEffect(() => {
    if (location.state?.flash) {
      setFlash(location.state.flash);

      // reset supaya gak muncul lagi saat navigate balik
      window.history.replaceState({}, document.title);

      setTimeout(() => {
        setFlash(null);
      }, 3000);
    }
  }, [location.state]);

  useEffect(() => {
    if (flash) {
      if (flash.success) {
        toast.success(flash.message);
      } else {
        toast.error(flash.message);
      }
    }
  }, [flash]);

  const [client, setClient] = useState<boolean>(false);
  useEffect(() => {
    setClient(true);
  }, []);
  if (!client) return null;

  return (
    <div>
      <Outlet />
    </div>
  );
}

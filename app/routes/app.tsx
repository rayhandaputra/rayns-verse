import { useEffect, useRef, useState } from "react";
import {
  Outlet,
  useLoaderData,
  useLocation,
  type LoaderFunction,
} from "react-router";
import { toast } from "sonner";
import { commitSession, getSession } from "~/lib/session";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  // const flash = session.get("flash");
  // session.unset("flash");
  return {
    // flash,
    headers: {
      "Set-Cookie": await commitSession(session),
    },
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

  return (
    <div>
      <Outlet />
    </div>
  );
}

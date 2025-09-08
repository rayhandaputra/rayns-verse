import { useEffect, useRef } from "react";
import { Outlet, useLoaderData, type LoaderFunction } from "react-router";
import { toast } from "sonner";
import { commitSession, getSession } from "~/lib/session";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const flash = session.get("flash");
  session.unset("flash");
  return {
    flash,
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  };
};

export default function AppLayout() {
  const { flash } = useLoaderData();
  const shown = useRef(false);

  useEffect(() => {
    if (flash && !shown.current) {
      shown.current = true;
      if (flash.type === "success") {
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

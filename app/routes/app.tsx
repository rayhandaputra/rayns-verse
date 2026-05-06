import { type LoaderFunction, useLoaderData } from "react-router";
import { requireAuth } from "~/utils/session.server";
import AppLayoutFeature from "~/components/core/AppLayoutFeature";

export const loader: LoaderFunction = async ({ request }) => {
  const { user } = await requireAuth(request);

  return {
    user: {
      ...user,
      name: user?.fullname || "",
    },
    message: "OK",
  };
};

export default function AppLayout() {
  const { user } = useLoaderData() as { user: any };
  return <AppLayoutFeature user={user} />;
}

// app/routes/app.drive.tsx
import { type LoaderFunction } from "react-router";
import { requireAuth } from "~/utils/session.server";
import DriveLayoutFeature from "~/components/features/drive/DriveLayoutFeature";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAuth(request);
  return Response.json({});
};

export default function DriveLayout() {
  return <DriveLayoutFeature />;
}

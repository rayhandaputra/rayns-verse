// app/routes/app.drive.customer.tsx
import { useLoaderData, type LoaderFunction, type ActionFunction } from "react-router";
import { API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import DriveCustomerFeature from "~/components/features/drive/DriveCustomerFeature";

export const action: ActionFunction = async ({ request }) => {
  const authData = await requireAuth(request);
  // @ts-expect-error - legacy auth property from session server
  const { user, token } = authData;
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id") as string;

  try {
    if (intent === "delete_folder") {
      const result = await API.ORDER_UPLOAD.delete_folder({ session: { user, token }, req: { body: { id } } });
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      return Response.json({ success: true, message: "Berhasil menghapus folder" });
    }
    else if (intent === "delete_file") {
      const result = await API.ORDER_UPLOAD.delete_file({ session: { user, token }, req: { body: { id } } });
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      return Response.json({ success: true, message: "Berhasil menghapus file" });
    }
    else if (intent === "update_folder") {
      const purpose = formData.get("purpose") as string;
      const result = await API.ORDER_UPLOAD.create_single_folder({
        session: { user, token },
        req: { body: { id, purpose, folder_name: formData.get("folder_name") as string } }
      });
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      return Response.json({ success: true, message: "Berhasil mengupdate folder" });
    }
  } catch (e: any) {
    return Response.json({ success: false, message: e.message || "Terjadi kesalahan" });
  }
  return Response.json({ success: false, message: "Aksi tidak ditermukan" });
};

export const loader: LoaderFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);

  const url = new URL(request.url);
  const { folder_id } = Object.fromEntries(url.searchParams.entries());

  const detailFolder = await API.ORDER_UPLOAD.get_folder({
    session: { user, token },
    req: { query: { id: folder_id || "null", size: 1 } },
  });

  return Response.json({
    current_folder: detailFolder?.items?.[0] ?? null,
  });
};

export default function DriveCustomerPage() {
  const data = useLoaderData<any>();
  return <DriveCustomerFeature {...data} />;
}

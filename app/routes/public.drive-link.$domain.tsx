// app/routes/public.drive-link.$domain.tsx
import { useLoaderData, type LoaderFunction, type ActionFunction } from "react-router";
import { API } from "~/nexus";
import { getOptionalUser } from "~/utils/session.server";
import { sendTelegramLog } from "~/utils/telegram-log";
import PublicDriveFeature from "~/components/features/public/PublicDriveFeature";

export const loader: LoaderFunction = async ({ request, params }) => {
  const domain = params?.domain;
  const authData = await getOptionalUser(request);

  if (!domain) {
    throw new Response("Domain tidak ditemukan", { status: 404 });
  }

  const url = new URL(request.url);
  const { folder_id } = Object.fromEntries(url.searchParams.entries());

  try {
    const orderRes = await API.ORDERS.get({
      session: {},
      req: {
        query: {
          ...(!domain?.includes("ORD")
            ? { institution_domain: domain }
            : { order_number: domain }),
          size: 1,
        },
      },
    });

    const detailFolder = await API.ORDER_UPLOAD.get_folder({
      session: {},
      req: { query: { id: folder_id || "null", size: 1 } },
    });

    return Response.json(
      {
        session: authData?.user || null,
        domain,
        orderData: orderRes?.items?.[0] ?? null,
        current_folder: detailFolder?.items?.[0] ?? null,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: any) {
    console.error("Loader error:", error);
    sendTelegramLog("PUBLIC_DRIVE_LINK_LOADER_ERROR", { domain, error });
    return Response.json(
      { session: authData?.user || null, domain, orderData: null },
      { headers: { "Content-Type": "application/json", "Cache-Control": "no-store", Pragma: "no-cache" } }
    );
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  const domain = params.domain;
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id") as string;
  const { folder_name, parent_id, order_number, ...payload } = Object.fromEntries(formData.entries());

  if (!domain) return Response.json({ success: false, message: "Domain tidak ditemukan" });

  try {
    let resMessage = "";
    if (intent === "create_folder") {
      const result = await API.ORDER_UPLOAD.create_single_folder({
        session: {},
        req: { body: { ...(id && { id }), folder_name, parent_id, order_number } },
      });
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      resMessage = "Berhasil menambahkan folder";
    }
    else if (intent === "create_file") {
      const result = await API.ORDER_UPLOAD.create_single_file({
        session: {},
        req: { body: payload },
      });
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      resMessage = "Berhasil menambahkan file";
    }
    else if (intent === "delete_folder") {
      const result = await API.ORDER_UPLOAD.delete_folder({ session: {}, req: { body: { id } } });
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      resMessage = "Berhasil menghapus folder";
    }
    else if (intent === "delete_file") {
      const result = await API.ORDER_UPLOAD.delete_file({ session: {}, req: { body: { id } } });
      if (!result.success) return Response.json({ success: false, message: result.message || "Gagal" });
      resMessage = "Berhasil menghapus file";
    }
    else if (intent === "update_review") {
      const rating = Number(formData.get("rating"));
      const review = formData.get("review") as string;
      const res = await API.ORDERS.update({ session: {}, req: { body: { id, rating, review } } });
      if (!res.success) return Response.json({ success: false, message: res.message || "Gagal" });
      resMessage = "Berhasil mengirim ulasan";
    }
    else if (intent === "update_payment_proof") {
      const proof = formData.get("proof") as string;
      const res = await API.ORDERS.update({ session: {}, req: { body: { id, payment_proof: proof } } });
      if (!res.success) return Response.json({ success: false, message: res.message || "Gagal" });
      resMessage = "Berhasil memperbarui bukti pembayaran";
    }
    else if (intent === "upsert_assignment") {
      const payload = {
        id: formData.get("id") as string,
        order_trx_code: formData.get("order_trx_code"),
        category: formData.get("category") === 'twibbon-idcard' ? 'idcard' : 'lanyard',
        twibbon_template_id: formData.get("twibbon_template_id"),
        twibbon_template_name: formData.get("twibbon_template_name"),
      };
      const res = await API.TWIBBON_ASSIGNMENT.upsert({
        session: {},
        req: { body: payload }
      });
      if (!res.success) return Response.json({ success: false, message: res.message || "Gagal menyimpan setting desain" });
      resMessage = "Berhasil menyimpan setting desain";
    }
    else if (intent === "delete_assignment") {
      const id = formData.get("id") as string;
      const res = await API.TWIBBON_ASSIGNMENT.delete({
        session: {},
        req: { body: { id } }
      });
      if (!res.success) return Response.json({ success: false, message: res.message || "Gagal menghapus desain" });
      resMessage = "Berhasil menghapus desain terpilih";
    }

    return Response.json({ success: true, message: resMessage });
  } catch (e: any) {
    console.error("Error:", e);
    sendTelegramLog("PUBLIC_DRIVE_LINK_ACTION_ERROR", { domain, error: e });
    return Response.json({ success: false, message: e.message || "Terjadi kesalahan" });
  }
};

export default function PublicDriveLinkPage() {
  const data = useLoaderData<any>();
  return <PublicDriveFeature {...data} />;
}


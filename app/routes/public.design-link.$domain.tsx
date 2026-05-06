import { type LoaderFunction, type ActionFunction, useLoaderData } from 'react-router';
import { getOptionalUser } from "~/utils/session.server";
import { API } from "~/nexus";
import { sendTelegramLog } from "~/utils/telegram-log";
import DesignGalleryFeature from '~/components/features/public/DesignGalleryFeature';

export const loader: LoaderFunction = async ({ request, params }) => {
    const domain = params?.domain;
    const authData = await getOptionalUser(request);

    if (!domain) {
        throw new Response("Domain tidak ditemukan", { status: 404 });
    }

    try {
        const [assignmentRes, orderRes] = await Promise.all([
            API.TWIBBON_ASSIGNMENT.get({
                session: {},
                req: { query: { unique_code: domain, size: 1 } },
            }),
            API.ORDERS.get({
                session: {},
                req: { query: { ...(domain.includes("ORD") ? { order_number: domain } : { institution_domain: domain }), size: 1 } },
            })
        ]);

        const order = orderRes?.items?.[0];
        const assignment = assignmentRes?.items?.[0];

        if (!order) {
            return Response.json({ session: authData?.user || null, domain, orderData: null });
        }

        const detailFolder = await API.ORDER_UPLOAD.get_folder({
            session: {},
            req: { query: { order_number: order.order_number, folder_id: "null", size: 1 } },
        });

        const mainFolder = detailFolder?.items?.[0];
        let bucketTwibbon = null;

        if (mainFolder) {
            const folderSearch = await API.ORDER_UPLOAD.get_folder({
                session: {},
                req: {
                    query: {
                        folder_id: mainFolder.id,
                        search: assignment?.category === "idcard" ? "ID Card (Depan)" : "Lanyard",
                        size: 1,
                    }
                }
            });
            bucketTwibbon = folderSearch?.items?.[0];
        }

        return Response.json({
            session: authData?.user || null,
            domain,
            orderData: order,
            assignmentData: assignment,
            bucketTwibbon,
        });

    } catch (error: any) {
        console.error("Loader error:", error);
        sendTelegramLog("PUBLIC_DESIGN_LINK_LOADER_ERROR", { domain, error });
        return Response.json({ session: authData?.user || null, domain, orderData: null });
    }
};

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const intent = formData.get('intent');

    try {
        if (intent === "upload_result") {
            const payload = Object.fromEntries(formData.entries());
            const res = await API.ORDER_UPLOAD.create_single_file({ session: {}, req: { body: payload } });
            return Response.json(res);
        }
        return Response.json({ success: false, message: "Unknown intent" });
    } catch (error: any) {
        return Response.json({ success: false, message: error.message || "Gagal memproses" });
    }
};

export default function PublicDesignLinkPage() {
    const data = useLoaderData<any>();
    return <DesignGalleryFeature {...data} />;
}

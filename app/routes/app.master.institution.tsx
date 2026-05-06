
import { type ActionFunction, type LoaderFunction } from "react-router";
import { API } from "~/nexus";
import InstitutionFeature from "~/components/features/institution/InstitutionFeature";

export const loader: LoaderFunction = async () => {
    try {
        const institution = await API.INSTITUTION.get({
            session: {},
            req: {
                pagination: "true",
                page: 0,
                size: 10,
            } as any,
        });

        return {
            table: {
                ...institution,
                page: 0,
                size: 10,
            },
        };
    } catch (err) {
        console.log(err);
        return { table: { items: [], total: 0 } };
    }
};

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries()) as Record<string, any>;
    const { id, ...payload } = data;

    try {
        let res: any = {};
        if (request.method === "DELETE") {
            res = await API.INSTITUTION.update({ session: {}, req: { body: { id, ...payload } as any } });
        } else if (request.method === "POST") {
            if (id) {
                res = await API.INSTITUTION.update({ session: {}, req: { body: { id, ...payload } as any } });
            } else {
                res = await API.INSTITUTION.create({ session: {}, req: { body: payload as any } });
            }
        }

        if (!res.success) throw new Error(res.message);

        return Response.json({ success: true, message: res.message });
    } catch (error: any) {
        return Response.json({ success: false, error_message: error.message || "Terjadi kesalahan" });
    }
};

export default function InstitutionPage() {
    return <InstitutionFeature />;
}

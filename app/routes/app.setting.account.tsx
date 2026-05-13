// import { useLoaderData, type LoaderFunction } from "react-router";
// import { CONFIG } from "~/config";
// import { API } from "~/nexus";
// import { unsealSession } from "~/lib/session";
// import { getSession } from "~/utils/session.server";
// import DataTable from "react-data-table-component";

import {
  useLoaderData,
  type ActionFunction,
  type LoaderFunction,
} from "react-router";
import { API } from "~/nexus/index.server";
import { AuthAPI } from "~/nexus/modules/user_auth.server";
import AccountSettingsFeature from "~/components/features/settings/AccountSettingsFeature";

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await API.USER.get({
    session: {},
    req: {
      pagination: "true",
      page: 0,
      size: 10,
      role: "customer",
    } as any,
  });

  return {
    table: {
      ...user,
      page: 0,
      size: 10,
    },
  };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries()) as Record<string, any>;

  const { id, ...payload } = data;

  try {
    let res: any = {};
    if (request.method === "DELETE") {
      res = await API.USER.update({
        session: {},
        req: {
          body: { id, deleted: 1 } as any,
        },
      });
    }
    if (request.method === "POST") {
      if (id) {
        res = await API.USER.update({
          session: {},
          req: {
            body: { id, ...payload } as any,
          },
        });

        if (payload.password) {
          await AuthAPI.upsertAuth({
            user_id: id,
            email: payload.email,
            password: payload.password,
          });
        }
      } else {
        res = await API.USER.create({
          session: {},
          req: {
            body: { ...(payload as any), role: payload.role || "admin" },
          },
        });
      }
    }

    if (!res.success) throw { error_message: res.message };

    return Response.json({
      success: true,
      message: res.message,
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error_message: error.error_message || error.message || "Terjadi kesalahan",
    });
  }
};

export default function AccountPage() {
  const { table } = useLoaderData<any>();
  return <AccountSettingsFeature tableData={table} />;
}

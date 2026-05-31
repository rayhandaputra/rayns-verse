import { type ActionFunction, type LoaderFunction } from "react-router";
import { API } from "~/nexus/index.server";
import { AuthAPI } from "~/nexus/modules/user_auth.server";
import { requireAuth } from "~/utils/session.server";
import UserManagementFeature from "~/components/features/user/UserManagementFeature";

export const loader: LoaderFunction = async ({ request }) => {
  await requireAuth(request);
  return Response.json({ initialized: true });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries()) as Record<string, any>;

  const { id, ...payload } = data;

  try {
    let res: any = {};
    if (payload.intent === "update-settings") {
      res = await API.CMS_CONTENT.update({
        session: {},
        req: {
          body: {
            id,
            image_gallery: JSON.stringify([payload.headerBackground]),
          } as any,
        },
      });

      return {
        success: true,
        message: "Settings updated successfully",
      }
    }
    if (request.method === "DELETE") {
      res = await API.USER.update({
        session: {},
        req: {
          body: {
            id,
            ...payload,
          } as any,
        },
      });
    }
    if (request.method === "POST") {
      if (id) {
        res = await API.USER.update({
          session: {},
          req: {
            body: {
              id,
              ...payload,
            } as any,
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
            body: {
              ...(payload as any),
              role: payload.role || "admin",
            },
          },
        });

        if (res.success && res.user?.id && payload.password) {
          await AuthAPI.upsertAuth({
            user_id: res.user.id,
            email: payload.email,
            password: payload.password,
          });
        }
      }
    }

    if (!res.success) throw { error_message: res.message };

    return Response.json({
      success: true,
      message: res.message,
      user: res.user,
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      error_message:
        error.error_message || error.message || "Terjadi kesalahan",
    });
  }
};

export default function UserManagementPage() {
  return <UserManagementFeature />;
}

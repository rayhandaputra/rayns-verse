import { type ActionFunction, type LoaderFunction } from "react-router";
import { APIProviderV2 } from "~/nexus/core/api-provider-v2";
import { API } from "~/nexus/index.server";
import { AuthAPI } from "~/nexus/modules/user_auth.server";
import { requireAuth } from "~/utils/session.server";
import UserManagementFeature from "~/components/features/user/UserManagementFeature";

export const loader: LoaderFunction = async ({ request }) => {
  const auth = (await requireAuth(request)) as any;
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 0;
  const size = Number(url.searchParams.get("size")) || 10;
  const search = url.searchParams.get("search") || "";
  const role = url.searchParams.get("role") || "";

  const users = await APIProviderV2({
    user: auth.user,
    token: auth.token,
  })
    .Table("users")
    .Select({
      page,
      size,
      search: search || undefined,
      where: {
        deleted: 0,
        ...(role ? { role } : {}),
      },
      columns: ["id", "fullname", "email", "role", "is_active"],
      orderBy: ["created_on", "DESC"],
    })
    .Result();

  return Response.json({
    initialized: true,
    usersData: {
      data: {
        items: users?.items || [],
        total_items: users?.total_items || 0,
      },
    },
  });
};

export const action: ActionFunction = async ({ request }) => {
  const auth = (await requireAuth(request)) as any;
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries()) as Record<string, any>;

  const { id, password, ...payload } = data;
  const session = {
    user: auth.user,
    token: auth.token,
  };

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
      await APIProviderV2(session)
        .Table("users")
        .Update({
          data: {
            ...payload,
            deleted: 1,
            modified_on: new Date().toISOString(),
          },
          where: { id },
        })
        .Result();
      res = { success: true, message: "User berhasil dihapus" };
    }
    if (request.method === "POST") {
      if (id) {
        const updateData = {
          ...payload,
          ...(payload.deleted
            ? { deleted: 1 }
            : {}),
          modified_on: new Date().toISOString(),
        };

        await APIProviderV2(session)
          .Table("users")
          .Update({
            data: updateData,
            where: { id },
          })
          .Result();
        res = { success: true, message: "User berhasil diperbarui" };

        if (password) {
          await AuthAPI.upsertAuth({
            user_id: id,
            email: payload.email,
            password,
          });
        }
      } else {
        const checkUser = await APIProviderV2(session)
          .Table("users")
          .Select({
            where: { email: payload.email },
            size: 1,
          })
          .Result();

        const existingUser = checkUser?.items?.[0];
        let userId;

        if (existingUser) {
          if (existingUser.deleted === 1) {
            // Restore and update
            await APIProviderV2(session)
              .Table("users")
              .Update({
                data: {
                  fullname: payload.fullname,
                  role: payload.role || "admin",
                  deleted: 0,
                  modified_on: new Date().toISOString(),
                },
                where: { id: existingUser.id },
              })
              .Result();
            userId = existingUser.id;
          } else {
            return Response.json(
              { success: false, error_message: "Email sudah terdaftar" },
              { status: 400 }
            );
          }
        } else {
          const userPayload = {
            fullname: payload.fullname,
            email: payload.email,
            role: payload.role || "admin",
            deleted: 0,
            created_on: new Date().toISOString(),
            modified_on: new Date().toISOString(),
          };

          const created = await APIProviderV2(session)
            .Table("users")
            .Insert(userPayload)
            .Result();
          userId = created?.insert_id;
        }

        res = {
          success: true,
          message: existingUser ? "User berhasil dipulihkan" : "User baru berhasil dibuat",
          user: {
            id: userId,
            fullname: payload.fullname,
            email: payload.email,
            role: payload.role || "admin",
          },
        };

        if (userId && password) {
          await AuthAPI.upsertAuth({
            user_id: userId,
            email: payload.email,
            password,
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

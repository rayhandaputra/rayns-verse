import { callApi } from "../core/callApi";
import { CONFIG } from "~/config";

export const UserAPI = {
    get: async ({
      session,
      req,
    }: {
      session: any;
      req: { query?: any; body?: any; header?: any };
    }) => {
      const {
        pagination = "true",
        page = 0,
        size = 10,
        search,
        email,
      } = req.query || {};

      const res = await fetch(CONFIG.apiBaseUrl.server_api_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer REPLACE_WITH_STRONG_KEY",
        },
        body: JSON.stringify({
          action: "select",
          table: "users",
          columns: ["id", "fullname", "email", "role"],
          where: { deleted: 0 },
          search,
          page: 0,
          size: 10,
        }),
      });
      const result = await res.json();
      return result;
    },
    create: async ({ req }: any) => {
      const {
        fullname,
        email,
        role = "customer",
        is_active = 1,
        deleted = 0,
      } = req.body || {};

      if (!fullname || !email) {
        return { success: false, message: "Email dan fullname wajib diisi" };
      }

      const newUser = {
        fullname,
        email,
        role,
        // is_active,
        // deleted,
        // created_on: new Date().toISOString(),
        // modified_on: new Date().toISOString(),
      };

      try {
        const result = await callApi({
          action: "insert",
          table: "users",
          data: newUser,
        });

        return {
          success: true,
          message: "User berhasil dibuat",
          user: { id: result.insert_id, ...newUser },
        };
      } catch (err: any) {
        console.log(err);
        return { success: false, message: err.message };
      }
    },
    findOrCreate: async ({ req }: any) => {
      const {
        fullname,
        email,
        role = "customer",
        is_active = 1,
        deleted = 0,
      } = req.body || {};

      if (!fullname || !email) {
        return { success: false, message: "Email dan fullname wajib diisi" };
      }

      try {
        // cek existing
        const existing = await callApi({
          action: "select",
          table: "users",
          columns: ["*"],
          where: { email },
          size: 1,
        });

        if (existing.items.length > 0) {
          const user = existing.items[0];
          if (user.deleted === 1) {
            // restore + update
            const updated = await callApi({
              action: "update",
              table: "users",
              data: {
                fullname,
                email,
                role,
                is_active,
                deleted: 0,
                modified_on: new Date().toISOString(),
              },
              where: { id: user.id },
            });

            return {
              success: true,
              message: "User berhasil dipulihkan dan diperbarui",
              user: { ...user, ...updated },
            };
          }
          return { success: false, message: "Email sudah terdaftar" };
        }

        // jika belum ada → insert baru
        const newUser = {
          fullname,
          email,
          role,
          is_active,
          deleted,
          created_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
        };

        const result = await callApi({
          action: "insert",
          table: "users",
          data: newUser,
        });

        return {
          success: true,
          message: "User baru berhasil dibuat",
          user: { id: result.insert_id, ...newUser },
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
    update: async ({ req }: any) => {
      const { id, ...fields } = req.body || {};

      if (!id) {
        return { success: false, message: "ID user wajib diisi" };
      }

      const updatedData: Record<string, any> = {
        ...fields,
        modified_on: new Date().toISOString(),
      };

      try {
        const result = await callApi({
          action: "update",
          table: "users",
          data: updatedData,
          where: { id },
        });

        return {
          success: true,
          message: "User berhasil diperbarui",
          affected: result.affected_rows,
        };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
  };

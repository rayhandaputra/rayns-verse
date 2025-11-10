import { APIProvider } from "../client";

export const UserAPI = {
  get: async ({ req }: any) => {
    const { page = 0, size = 10, search } = req.query || {};

    return APIProvider({
      endpoint: "select",
      method: "POST",
      table: "users",
      action: "select",
      body: {
        columns: ["id", "fullname", "email", "role"],
        where: { deleted: 0 },
        search,
        page,
        size
      }
    });
  },

  create: async ({ req }: any) => {
    const { fullname, email, role = "customer" } = req.body || {};

    if (!fullname || !email) {
      return { success: false, message: "Email dan fullname wajib diisi" };
    }

    const result = await APIProvider({
      endpoint: "insert",
      method: "POST",
      table: "users",
      action: "insert",
      body: {
        data: { fullname, email, role }
      }
    });

    return {
      success: true,
      message: "User berhasil dibuat",
      user: { id: result.insert_id, fullname, email, role }
    };
  },

  findOrCreate: async ({ req }: any) => {
    const { fullname, email, role = "customer" } = req.body || {};

    if (!fullname || !email) {
      return { success: false, message: "Email dan fullname wajib diisi" };
    }

    // check existing
    const existing = await APIProvider({
      endpoint: "select",
      method: "POST",
      table: "users",
      action: "select",
      body: {
        columns: ["*"],
        where: { email },
        size: 1
      }
    });

    const user = existing.items?.[0];

    if (user) {
      if (user.deleted === 1) {
        // restore
        const updated = await APIProvider({
          endpoint: "update",
          method: "POST",
          table: "users",
          action: "update",
          body: {
            data: {
              fullname,
              email,
              role,
              deleted: 0,
              modified_on: new Date().toISOString()
            },
            where: { id: user.id }
          }
        });

        return {
          success: true,
          message: "User dipulihkan dan diperbarui",
          user: updated
        };
      }
      return { success: false, message: "Email sudah terdaftar" };
    }

    // create new
    const newUser = {
      fullname,
      email,
      role,
      created_on: new Date().toISOString(),
      modified_on: new Date().toISOString()
    };

    const result = await APIProvider({
      endpoint: "insert",
      method: "POST",
      table: "users",
      action: "insert",
      body: { data: newUser }
    });

    return {
      success: true,
      message: "User baru berhasil dibuat",
      user: { id: result.insert_id, ...newUser }
    };
  },

  update: async ({ req }: any) => {
    const { id, ...fields } = req.body || {};

    if (!id) return { success: false, message: "ID user wajib diisi" };

    const updatedData = {
      ...fields,
      modified_on: new Date().toISOString()
    };

    const result = await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "users",
      action: "update",
      body: {
        data: updatedData,
        where: { id }
      }
    });

    return {
      success: true,
      message: "User berhasil diperbarui",
      affected: result.affected_rows
    };
  }
};

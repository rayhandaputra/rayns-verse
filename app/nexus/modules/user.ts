import bcrypt from "bcryptjs";
import { APIProvider } from "..";
import { AuthAPI } from "./user_auth";

export const UserAPI = {
  get: async ({ session, req }: any) => {
    const { page = 0, size = 10, search } = req.query || {};

    return APIProvider(session)
      .Endpoint("POST", "select", "users")
      .Data({
        columns: ["id", "fullname", "email", "role"],
        where: { deleted: 0 },
        search,
        page,
        size,
      })
      .Result();
  },

  // create: async ({ req }: any) => {
  //   const { fullname, email, role = "customer" } = req.body || {};

  //   if (!fullname || !email) {
  //     return { success: false, message: "Email dan fullname wajib diisi" };
  //   }

  //   const result = await APIProvider({
  //     endpoint: "insert",
  //     method: "POST",
  //     table: "users",
  //     action: "insert",
  //     body: {
  //       data: { fullname, email, role },
  //     },
  //   });

  //   return {
  //     success: true,
  //     message: "User berhasil dibuat",
  //     user: { id: result.insert_id, fullname, email, role },
  //   };
  // },
  create: async ({ session, req }: any) => {
    const { fullname, email, role = "customer", password } = req.body || {};

    if (!fullname || !email) {
      return { success: false, message: "Email dan fullname wajib diisi" };
    }

    const result = await APIProvider(session)
      .Endpoint("POST", "insert", "users")
      .Data({
        data: { fullname, email, role },
      })
      .Result();

    if (password) {
      await AuthAPI.upsertAuth({
        session,
        user_id: result.insert_id,
        email,
        password,
      });
    }

    return {
      success: true,
      message: "User berhasil dibuat",
    };
  },

  findOrCreate: async ({ session, req }: any) => {
    const { fullname, email, role = "customer" } = req.body || {};

    if (!fullname || !email) {
      return { success: false, message: "Email dan fullname wajib diisi" };
    }

    // check existing
    const existing = await APIProvider(session)
      .Endpoint("POST", "select", "users")
      .Data({
        columns: ["*"],
        where: { email },
        size: 1,
      })
      .Result();

    const user = existing.items?.[0];

    if (user) {
      if (user.deleted === 1) {
        // restore
        const updated = await APIProvider(session)
          .Endpoint("POST", "update", "users")
          .Data({
            data: {
              fullname,
              email,
              role,
              deleted: 0,
              modified_on: new Date().toISOString(),
            },
            where: { id: user.id },
          })
          .Result();

        return {
          success: true,
          message: "User dipulihkan dan diperbarui",
          user: updated,
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
      modified_on: new Date().toISOString(),
    };

    const result = await APIProvider(session)
      .Endpoint("POST", "insert", "users")
      .Data({ data: newUser })
      .Result();

    return {
      success: true,
      message: "User baru berhasil dibuat",
      user: { id: result.insert_id, ...newUser },
    };
  },

  update: async ({ session, req }: any) => {
    const { id, password, ...fields } = req.body || {};

    if (!id) return { success: false, message: "ID user wajib diisi" };

    const updatedData = {
      ...fields,
      modified_on: new Date().toISOString(),
    };

    console.log("updatedData => ", updatedData);
    const result = await APIProvider(session)
      .Endpoint("POST", "update", "users")
      .Data({
        data: updatedData,
        where: { id },
      })
      .Result();

    if (password) {
      await APIProvider(session)
        .Endpoint("POST", "update", "user_auth")
        .Data({
          data: {
            password_hash: await bcrypt.hash(password, 10),
          },
          where: { user_id: id },
        })
        .Result();
    }

    return {
      success: true,
      message: "User berhasil diperbarui",
      affected: result.affected_rows,
    };
  },
};

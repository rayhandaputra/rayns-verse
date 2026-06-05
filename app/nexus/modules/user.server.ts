import bcrypt from "bcryptjs";
import { APIProvider, APIProviderV2 } from "..";
// AuthAPI is imported dynamically in methods that need it to ensure browser compatibility


export const UserAPI = {
  get: async ({ session, req }: any) => {
    const { page = 0, size = 10, search } = req.query || {};

    return APIProviderV2(session)
      .Table("users")
      .Select({
        columns: ["id", "fullname", "email", "role"],
        where: { deleted: 0 },
        search,
        page,
        size,
      })
      .Result();
  },

  create: async ({ session, req }: any) => {
    const { fullname, email, role = "customer", password } = req.body || {};

    if (!fullname || !email) {
      return { success: false, message: "Email dan fullname wajib diisi" };
    }

    const checkUser = await APIProviderV2(session)
      .Table("users")
      .Select({
        where: { email },
        size: 1,
      })
      .Result();

    const existingUser = checkUser?.items?.[0];
    let insertId;

    if (existingUser) {
      if (existingUser.deleted === 1) {
        await APIProviderV2(session)
          .Table("users")
          .Update({
            data: {
              fullname,
              role,
              deleted: 0,
              modified_on: new Date().toISOString(),
            },
            where: { id: existingUser.id },
          })
          .Result();
        insertId = existingUser.id;
      } else {
        return { success: false, message: "Email sudah terdaftar" };
      }
    } else {
      const result = await APIProviderV2(session)
        .Table("users")
        .Insert({
          fullname,
          email,
          role,
          deleted: 0,
          created_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
        })
        .Result();
      
      let createdId = result.insert_id || result.id;
      if (!createdId) {
        const refresh = await APIProviderV2(session)
          .Table("users")
          .Select({ where: { email }, size: 1 })
          .Result();
        createdId = refresh?.items?.[0]?.id;
      }
      insertId = createdId;
    }

    if (password) {
      const { AuthAPI } = await import("./user_auth.server");
      await AuthAPI.upsertAuth({
        session,
        user_id: insertId,
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
    const existing = await APIProviderV2(session)
      .Table("users")
      .Select({
        where: { email },
        size: 1,
      })
      .Result();

    const user = existing.items?.[0];

    if (user) {
      if (user.deleted === 1) {
        // restore
        await APIProviderV2(session)
          .Table("users")
          .Update({
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

        const updatedUserRes = await APIProviderV2(session)
          .Table("users")
          .Select({
            where: { id: user.id },
            size: 1,
          })
          .Result();

        return {
          success: true,
          message: "User dipulihkan dan diperbarui",
          user: updatedUserRes.items?.[0],
        };
      }
      return {
        success: true,
        message: "User sudah aktif",
        user,
      };
    }

    // create new
    const newUser = {
      fullname,
      email,
      role,
      deleted: 0,
      created_on: new Date().toISOString(),
      modified_on: new Date().toISOString(),
    };

    const result = await APIProviderV2(session)
      .Table("users")
      .Insert(newUser)
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

    const result = await APIProviderV2(session)
      .Table("users")
      .Update({
        data: updatedData,
        where: { id },
      })
      .Result();

    if (password) {
      await APIProviderV2(session)
        .Table("user_auth")
        .Update({
          data: {
            password_hash: await bcrypt.hash(password, 10),
            modified_on: new Date().toISOString(),
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

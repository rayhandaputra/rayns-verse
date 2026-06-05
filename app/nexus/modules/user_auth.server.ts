import { APIProvider, APIProviderV2 } from "..";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export const AuthAPI = {
  generateToken: () => crypto.randomBytes(32).toString("hex"),
  hashToken: (token: string) =>
    crypto.createHash("sha256").update(token).digest("hex"),
  // ============================================================
  // CREATE / UPDATE AUTH (dipanggil opsional dari UserAPI)
  // ============================================================
  upsertAuth: async ({ session, user_id, email, password, email_verified = 0 }: any) => {
    if (!user_id || !email || !password) {
      return { success: false, message: "Auth data tidak lengkap" };
    }

    const password_hash = await bcrypt.hash(password, 10);

    // cek existing auth
    const existing = await APIProvider(session)
      .Endpoint("POST", "select", "user_auth")
      .Data({
        where: { email },
        size: 1,
      })
      .Result();

    if (existing.items?.length) {
      await APIProvider(session)
        .Endpoint("POST", "update", "user_auth")
        .Data({
          data: {
            password_hash,
            email_verified,
            modified_on: new Date().toISOString(),
          },
          where: { id: existing.items[0].id },
        })
        .Result();

      return { success: true, message: "Auth diperbarui" };
    }

    await APIProvider(session)
      .Endpoint("POST", "insert", "user_auth")
      .Data({
        data: {
          user_id,
          email,
          password_hash,
          email_verified,
        },
      })
      .Result();

    return { success: true, message: "Auth dibuat" };
  },

  // ============================================================
  // LOGIN
  // ============================================================
  login: async ({ session, req }: any) => {
    const { email, password, ip, user_agent } = req.body || {};

    if (!email || !password) {
      return { success: false, message: "Email dan password wajib diisi" };
    }

    const authRes = await APIProvider(session)
      .Endpoint("POST", "select", "user_auth")
      .Data({
        where: { email },
        size: 1,
      })
      .Result();

    const auth = authRes.items?.[0];
    let success = 0;

    if (!auth) {
      await AuthAPI.logLogin({ session, email, success, ip });
      return { success: false, message: "Email tidak ditemukan" };
    }

    // check locked
    // if (auth.locked_until && new Date(auth.locked_until) > new Date()) {
    //   return { success: false, message: "Akun terkunci sementara" };
    // }

    const valid = await bcrypt.compare(password, auth.password_hash);

    if (!valid) {
      await APIProvider(session)
        .Endpoint("POST", "update", "user_auth")
        .Data({
          data: {
            failed_attempt: auth.failed_attempt + 1,
            locked_until:
              auth.failed_attempt + 1 >= 5
                ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
                : null,
          },
          where: { id: auth.id },
        })
        .Result();

      await AuthAPI.logLogin({ session, user_id: auth.user_id, email, success, ip });
      return { success: false, message: "Password salah" };
    }

    // success login
    success = 1;
    const token = AuthAPI.generateToken();
    const tokenHash = AuthAPI.hashToken(token);

    await APIProvider(session)
      .Endpoint("POST", "update", "user_auth")
      .Data({
        data: {
          session_token_hash: tokenHash,
          session_expired_at: new Date(
            Date.now() + 2 * 60 * 60 * 1000
          ).toISOString(),
          session_ip: ip,
          session_user_agent: user_agent,
          last_login: new Date().toISOString(),
          failed_attempt: 0,
          locked_until: null,
        },
        where: { id: auth.id },
      })
      .Result();

    await AuthAPI.logLogin({ session, user_id: auth.user_id, email, success, ip });

    const userRes = await APIProvider(session)
      .Endpoint("POST", "select", "users")
      .Data({
        where: { id: auth.user_id },
        size: 1,
      })
      .Result();

    const user = userRes.items?.[0];

    return {
      success: true,
      token,
      expired_at: auth.session_expired_at,
      user,
    };
  },

  // ============================================================
  // LOGIN GOOGLE
  // ============================================================
  loginWithGoogle: async ({ session, req }: any) => {
    const { email, fullname, ip, user_agent } = req.body || {};

    if (!email) {
      return { success: false, message: "Email Google tidak ditemukan" };
    }

    // 1. Cek apakah user sudah ada di users (termasuk soft-deleted)
    const userRes = await APIProviderV2(session)
      .Table("users")
      .Select({
        where: { email },
        columns: ["id", "fullname", "email", "role", "phone", "is_active", "deleted"],
        size: 1,
      })
      .Result();

    let user = userRes.items?.[0];
    let isNewUser = false;

    // 2. Jika ada tapi terhapus, pulihkan. Jika tidak ada, buat baru.
    if (user) {
      if (user.deleted === 1) {
        await APIProviderV2(session)
          .Table("users")
          .Update({
            data: {
              fullname: fullname || user.fullname || "Customer",
              deleted: 0,
              modified_on: new Date().toISOString(),
            },
            where: { id: user.id },
          })
          .Result();

        // Ambil data user yang telah dipulihkan
        const refreshUserRes = await APIProviderV2(session)
          .Table("users")
          .Select({
            where: { id: user.id },
            columns: ["id", "fullname", "email", "role", "phone", "is_active", "deleted"],
            size: 1,
          })
          .Result();
        user = refreshUserRes.items?.[0];
      }
    } else {
      isNewUser = true;
      const created = await APIProviderV2(session)
        .Table("users")
        .Insert({
          fullname: fullname || "Customer",
          email,
          role: "customer",
          is_active: 1,
          deleted: 0,
          created_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
        })
        .Result();

      // Get the newly created user
      const refreshUserRes = await APIProviderV2(session)
        .Table("users")
        .Select({
          where: { email },
          columns: ["id", "fullname", "email", "role", "phone", "is_active", "deleted"],
          size: 1,
        })
        .Result();
      
      user = refreshUserRes.items?.[0];
    }

    // 3. Pastikan ada record di user_auth (tanpa password jika google)
    const authRes = await APIProviderV2(session)
      .Table("user_auth")
      .Select({
        where: { user_id: user.id },
        columns: ["id", "user_id", "email", "password_hash"],
        size: 1,
      })
      .Result();

    let auth = authRes.items?.[0];

    if (!auth) {
      await APIProviderV2(session)
        .Table("user_auth")
        .Insert({
          user_id: user.id,
          email,
          password_hash: "GOOGLE_AUTH",
          email_verified: 1,
          created_on: new Date().toISOString(),
          modified_on: new Date().toISOString(),
        })
        .Result();

      const refreshAuthRes = await APIProviderV2(session)
        .Table("user_auth")
        .Select({
          where: { user_id: user.id },
          columns: ["id", "user_id", "email", "password_hash"],
          size: 1,
        })
        .Result();
      auth = refreshAuthRes.items?.[0];
    }

    // 4. Generate token and success login
    const token = AuthAPI.generateToken();
    const tokenHash = AuthAPI.hashToken(token);

    await APIProviderV2(session)
      .Table("user_auth")
      .Update({
        data: {
          session_token_hash: tokenHash,
          session_expired_at: new Date(
            Date.now() + 2 * 60 * 60 * 1000
          ).toISOString(),
          session_ip: ip,
          session_user_agent: user_agent,
          last_login: new Date().toISOString(),
          modified_on: new Date().toISOString(),
        },
        where: { id: auth.id },
      })
      .Result();

    await AuthAPI.logLogin({ session, user_id: user.id, email, success: 1, ip });

    // 5. Check if registration is complete (phone is required for customers)
    const needsRegistration = isNewUser || !user.phone;

    return {
      success: true,
      token,
      user,
      needsRegistration,
    };
  },

  // ============================================================
  // COMPLETE REGISTRATION (Customer — add phone number)
  // ============================================================
  completeRegistration: async ({ session, req }: any) => {
    const { user_id, fullname, phone } = req.body || {};

    if (!user_id || !phone) {
      return { success: false, message: "User ID dan nomor HP wajib diisi" };
    }

    // Validate phone format (Indonesian)
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return { success: false, message: "Format nomor HP tidak valid" };
    }

    const updateData: any = { phone: cleanPhone };
    if (fullname) updateData.fullname = fullname;
    updateData.modified_on = new Date().toISOString();

    try {
      await APIProviderV2(session)
        .Table("users")
        .Update({ data: updateData, where: { id: user_id } })
        .Result();
    } catch (err: any) {
      // Auto-migrate: if column doesn't exist, add it then retry
      if (err?.message?.includes("Unknown column") && err?.message?.includes("phone")) {
        const { AgentAPI } = await import("./agent.server");
        await AgentAPI.query({ sql: "ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER email" });
        // Retry after migration
        await APIProviderV2(session)
          .Table("users")
          .Update({ data: updateData, where: { id: user_id } })
          .Result();
      } else {
        throw err;
      }
    }

    // Fetch updated user
    const userRes = await APIProviderV2(session)
      .Table("users")
      .Select({
        where: { id: user_id },
        columns: ["id", "fullname", "email", "role", "phone", "is_active", "deleted"],
        size: 1,
      })
      .Result();

    return {
      success: true,
      message: "Registrasi berhasil",
      user: userRes.items?.[0],
    };
  },

  // ============================================================
  // LOGIN LOGS
  // ============================================================
  logLogin: async ({ session, user_id, email, ip, success }: any) => {
    await APIProvider(session)
      .Endpoint("POST", "insert", "login_logs")
      .Data({
        data: {
          user_id,
          email,
          ip_address: ip,
          success,
        },
      })
      .Result();
  },
};

import { APIProvider } from "..";
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

    // 1. Cek apakah user sudah ada di users
    const userRes = await APIProvider(session)
      .Endpoint("POST", "select", "users")
      .Data({
        where: { email },
        size: 1,
      })
      .Result();

    let user = userRes.items?.[0];

    // 2. Jika tidak ada, buat user baru (sebagai customer secara default)
    if (!user) {
      const newUserRes = await APIProvider(session)
        .Endpoint("POST", "insert", "users")
        .Data({
          data: {
            fullname: fullname || "Customer",
            email,
            role: "customer",
            is_active: 1,
            created_on: new Date().toISOString(),
          },
        })
        .Result();

      // Get the newly created user
      const refreshUserRes = await APIProvider(session)
        .Endpoint("POST", "select", "users")
        .Data({
          where: { email },
          size: 1,
        })
        .Result();
      
      user = refreshUserRes.items?.[0];
    }

    // 3. Pastikan ada record di user_auth (tanpa password jika google)
    const authRes = await APIProvider(session)
      .Endpoint("POST", "select", "user_auth")
      .Data({
        where: { user_id: user.id },
        size: 1,
      })
      .Result();

    let auth = authRes.items?.[0];

    if (!auth) {
      // Create a dummy auth record if missing (for session tracking)
      await APIProvider(session)
        .Endpoint("POST", "insert", "user_auth")
        .Data({
          data: {
            user_id: user.id,
            email,
            password_hash: "GOOGLE_AUTH", // Placeholder
            email_verified: 1,
            created_on: new Date().toISOString(),
          },
        })
        .Result();

      const refreshAuthRes = await APIProvider(session)
        .Endpoint("POST", "select", "user_auth")
        .Data({
          where: { user_id: user.id },
          size: 1,
        })
        .Result();
      auth = refreshAuthRes.items?.[0];
    }

    // 4. Generate token and success login
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
        },
        where: { id: auth.id },
      })
      .Result();

    await AuthAPI.logLogin({ session, user_id: user.id, email, success: 1, ip });

    return {
      success: true,
      token,
      user,
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

import { APIProvider } from "../client";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const generateToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const AuthAPI = {
  // ============================================================
  // CREATE / UPDATE AUTH (dipanggil opsional dari UserAPI)
  // ============================================================
  upsertAuth: async ({ user_id, email, password, email_verified = 0 }: any) => {
    if (!user_id || !email || !password) {
      return { success: false, message: "Auth data tidak lengkap" };
    }

    const password_hash = await bcrypt.hash(password, 10);

    // cek existing auth
    const existing = await APIProvider({
      endpoint: "select",
      method: "POST",
      table: "user_auth",
      action: "select",
      body: {
        where: { email },
        size: 1,
      },
    });

    if (existing.items?.length) {
      await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "user_auth",
        action: "update",
        body: {
          data: {
            password_hash,
            email_verified,
            modified_on: new Date().toISOString(),
          },
          where: { id: existing.items[0].id },
        },
      });

      return { success: true, message: "Auth diperbarui" };
    }

    await APIProvider({
      endpoint: "insert",
      method: "POST",
      table: "user_auth",
      action: "insert",
      body: {
        data: {
          user_id,
          email,
          password_hash,
          email_verified,
        },
      },
    });

    return { success: true, message: "Auth dibuat" };
  },

  // ============================================================
  // LOGIN
  // ============================================================
  login: async ({ req }: any) => {
    const { email, password, ip, user_agent } = req.body || {};

    if (!email || !password) {
      return { success: false, message: "Email dan password wajib diisi" };
    }

    const authRes = await APIProvider({
      endpoint: "select",
      method: "POST",
      table: "user_auth",
      action: "select",
      body: {
        where: { email },
        size: 1,
      },
    });

    const auth = authRes.items?.[0];
    let success = 0;

    if (!auth) {
      await AuthAPI.logLogin({ email, success, ip });
      return { success: false, message: "Email tidak ditemukan" };
    }

    // check locked
    // if (auth.locked_until && new Date(auth.locked_until) > new Date()) {
    //   return { success: false, message: "Akun terkunci sementara" };
    // }

    const valid = await bcrypt.compare(password, auth.password_hash);

    if (!valid) {
      await APIProvider({
        endpoint: "update",
        method: "POST",
        table: "user_auth",
        action: "update",
        body: {
          data: {
            failed_attempt: auth.failed_attempt + 1,
            locked_until:
              auth.failed_attempt + 1 >= 5
                ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
                : null,
          },
          where: { id: auth.id },
        },
      });

      await AuthAPI.logLogin({ user_id: auth.user_id, email, success, ip });
      return { success: false, message: "Password salah" };
    }

    // success login
    success = 1;
    const token = generateToken();
    const tokenHash = hashToken(token);

    await APIProvider({
      endpoint: "update",
      method: "POST",
      table: "user_auth",
      action: "update",
      body: {
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
      },
    });

    await AuthAPI.logLogin({ user_id: auth.user_id, email, success, ip });

    const userRes = await APIProvider({
      endpoint: "select",
      method: "POST",
      table: "users",
      action: "select",
      body: {
        where: { id: auth.user_id },
        size: 1,
      },
    });

    const user = userRes.items?.[0];

    return {
      success: true,
      token,
      expired_at: auth.session_expired_at,
      user,
    };
  },

  // ============================================================
  // LOGIN LOGS
  // ============================================================
  logLogin: async ({ user_id, email, ip, success }: any) => {
    await APIProvider({
      endpoint: "insert",
      method: "POST",
      table: "login_logs",
      action: "insert",
      body: {
        data: {
          user_id,
          email,
          ip_address: ip,
          success,
        },
      },
    });
  },
};

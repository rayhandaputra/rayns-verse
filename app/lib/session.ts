import { getIronSession, type SessionOptions } from "iron-session";

// tipe data user dalam session
export interface UserSession {
  userId?: string;
  role?: string;
}

const sessionOptions: SessionOptions = {
  cookieName: "__session",
  password: process.env.SESSION_SECRET as string, // minimal 32 chars
  cookieOptions: {
    secure: process.env.NODE_ENV === "production", // true kalau di production
    sameSite: "lax",
  },
};

// 🟢 bikin helper untuk ambil session
export async function unsealSession(request: Request) {
  const cookie = request.headers.get("Cookie") || "";
  return getIronSession<UserSession>(
    { headers: { cookie } } as any, // request-like
    {} as any, // response-like (nggak dipakai di server)
    sessionOptions
  );
}

// 🟢 commit session → dipanggil kalau ada perubahan
export async function sealSession(session: Awaited<ReturnType<typeof unsealSession>>
) {
  return {
    "Set-Cookie": await session.save(),
  };
}

// 🟢 destroy session
export async function destroySession(session: Awaited<ReturnType<typeof unsealSession>>
) {
  session.destroy();
  return {
    "Set-Cookie": await session.save(),
  };
}

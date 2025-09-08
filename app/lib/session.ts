// import { getIronSession, type SessionOptions } from "iron-session";

// tipe data user dalam session
// export interface UserSession {
//   userId?: string;
//   role?: string;
// }

// const sessionOptions: SessionOptions = {
//   cookieName: "__session",
//   password: process.env.SESSION_SECRET as string, // minimal 32 chars
//   cookieOptions: {
//     secure: process.env.NODE_ENV === "production", // true kalau di production
//     sameSite: "lax",
//   },
// };

// 🟢 bikin helper untuk ambil session
// export async function unsealSession(request: Request) {
//   const cookie = request.headers.get("Cookie") || "";
//   return getIronSession<UserSession>(
//     { headers: { cookie } } as any, // request-like
//     {} as any, // response-like (nggak dipakai di server)
//     sessionOptions
//   );
// }

// 🟢 commit session → dipanggil kalau ada perubahan
// export async function sealSession(
//   session: Awaited<ReturnType<typeof unsealSession>>
// ) {
//   return {
//     "Set-Cookie": await session.save(),
//   };
// }

// export const sessionOptions: SessionOptions = {
//   password: process.env.SESSION_PASSWORD!,
//   cookieName: "my_remix_session",
//   cookieOptions: {
//     secure: process.env.NODE_ENV === "production",
//   },
// };

// export async function getSession(request: Request) {
//   // bikin object mirip IncomingMessage
//   const req = {
//     headers: {
//       cookie: request.headers.get("cookie") ?? "",
//     },
//   };

//   const res = {
//     setHeader() {}, // iron-session bakal panggil ini
//   };

//   return getIronSession(req as any, res as any, sessionOptions);
// }

// export async function getSession(request: Request) {
//   // Ambil cookies dari request.headers
//   const cookies = request.headers.get("cookie") ?? "";

//   return await getIronSession<UserSession>(
//     { cookies }, // cookieStore
//     {}, // response-like (ga kepake di Remix)
//     sessionOptions
//   );
// }

// 🟢 destroy session
// export async function destroySession(
//   session: Awaited<ReturnType<typeof unsealSession>>
// ) {
//   session.destroy();
//   return {
//     "Set-Cookie": await session.save(),
//   };
// }

import { createCookieSessionStorage } from "react-router";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secure: process.env.NODE_ENV === "production",
    secrets: ["supersecretkey"],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;

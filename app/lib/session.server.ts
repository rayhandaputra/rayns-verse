// app/lib/ironSession.server.ts
// import { createCookie } from "@remix-run/node";
// import * as Iron from "iron";
// import { createCookie } from "react-router";

// const SESSION_SECRET =
//   process.env.SESSION_SECRET || "super_long_secret_at_least_32_chars";

// const sealedCookie = createCookie("iron_session", {
//   httpOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   path: "/",
//   sameSite: "lax",
// });

// export async function sealSession(payload: any) {
//   return Iron.seal(payload, SESSION_SECRET, Iron.defaults);
// }

// export async function unsealSession<T = any>(sealed: string) {
//   return Iron.unseal(sealed, SESSION_SECRET, Iron.defaults) as Promise<T>;
// }

// // get dari request
// export async function getSession(request: Request) {
//   const cookieHeader = request.headers.get("Cookie");
//   const sealed = (await sealedCookie.parse(cookieHeader)) || null;
//   if (!sealed) return null;
//   return unsealSession(sealed);
// }

// // set ke response
// export async function commitSession(payload: any) {
//   const sealed = await sealSession(payload);
//   return sealedCookie.serialize(sealed);
// }

// lib/session.server.ts
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

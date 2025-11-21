// app/lib/session.server.ts
import {
  createCookie,
  createCookieSessionStorage,
  redirect,
} from "react-router";

import { deleteSession, getSessionUser } from "./auth.server";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in environment variables");
}

// COOKIE DEFINITION
const sessionCookie = createCookie("session", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  secrets: [process.env.SESSION_SECRET],
});

export const sessionStorage = createCookieSessionStorage({
  cookie: sessionCookie,
});

/**
 * Get session from request cookie
 */
export async function getSession(cookieHeader: string | null) {
  return sessionStorage.getSession(cookieHeader);
}

/**
 * Commit session and return Set-Cookie header
 */
export async function commitSession(session: any) {
  return sessionStorage.commitSession(session);
}

/**
 * Destroy session and return Set-Cookie header
 */
export async function destroySession(session: any) {
  return sessionStorage.destroySession(session);
}

/**
 * Create user session and redirect
 */
export async function createUserSession(token: string, redirectTo = "/") {
  const session = await sessionStorage.getSession();
  session.set("token", token);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

/**
 * Require authentication for protected routes
 * Redirects to /login if not authenticated
 */
export async function requireAuth(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  const token = session.get("token");
  if (!token) {
    throw redirect("/");
  }

  const user = await getSessionUser(token);
  if (!user) {
    throw redirect("/");
  }

  return { user, session, token };
}

/**
 * Get user if authenticated (optional)
 * Returns null if not authenticated
 */
export async function getOptionalUser(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const token = session.get("token");
  
  if (!token) {
    return null;
  }

  const user = await getSessionUser(token);
  return user ? { user, session, token } : null;
}

/**
 * Logout user and redirect to login
 */
export async function logout(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const token = session.get("token");

  if (token) {
    await deleteSession(token);
  }

  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

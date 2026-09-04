// Server-only — menyimpan access_token + refresh_token di encrypted cookie session.

import { createCookieSessionStorage, redirect } from "react-router";
import { APP_COOKIE_NAME } from "~/constants/brand";

const sessionSecret = process.env.SESSION_SECRET || "rayeen-kinau-session-secret";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: APP_COOKIE_NAME,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  },
});

export interface SessionData {
  access_token:  string;
  refresh_token: string;
  user_id:       string;
  user_email:    string;
  user_name:     string;
  user_role:     string;
}

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function getSessionData(request: Request): Promise<SessionData | null> {
  const session = await getSession(request);
  const access_token = session.get("access_token") as string | undefined;
  if (!access_token) return null;

  return {
    access_token,
    refresh_token: session.get("refresh_token") as string,
    user_id:       session.get("user_id")       as string,
    user_email:    session.get("user_email")     as string,
    user_name:     session.get("user_name")      as string,
    user_role:     session.get("user_role")      as string,
  };
}

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

const REFRESH_BUFFER_SECONDS = 5 * 60;

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
  try {
    const base = process.env.API_URL ?? "https://api.rayeen.web.id";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(`${base}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== "success" || !json.data?.access_token) return null;
    return {
      access_token: json.data.access_token,
      refresh_token: json.data.refresh_token ?? refreshToken,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request): Promise<SessionData> {
  const data = await getSessionData(request);
  if (!data) throw redirect("/auth/login");

  const exp = decodeJwtExp(data.access_token);
  const now = Math.floor(Date.now() / 1000);
  const needsRefresh = exp === null || exp - now < REFRESH_BUFFER_SECONDS;

  if (!needsRefresh) return data;

  const fresh = await refreshAccessToken(data.refresh_token);
  if (!fresh) throw redirect("/auth/login");

  return {
    ...data,
    access_token: fresh.access_token,
    refresh_token: fresh.refresh_token,
  };
}

export async function createUserSession(data: SessionData, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("access_token",  data.access_token);
  session.set("refresh_token", data.refresh_token);
  session.set("user_id",       data.user_id);
  session.set("user_email",    data.user_email);
  session.set("user_name",     data.user_name);
  session.set("user_role",     data.user_role);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function destroySession(request: Request, redirectTo = "/auth/login") {
  const session = await getSession(request);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

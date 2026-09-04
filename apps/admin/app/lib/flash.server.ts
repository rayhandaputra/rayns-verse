import { createCookieSessionStorage } from "react-router";

export type FlashType = "success" | "error" | "info" | "warning" | "confirm";

export interface FlashMessage {
  type: FlashType;
  title?: string;
  message: string;
}

const sessionSecret = process.env.SESSION_SECRET || "kinau-secret-key-2024";

const flashSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__flash_kinau",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
    maxAge: 5,
  },
});

export async function getFlashSession(request: Request) {
  return flashSessionStorage.getSession(request.headers.get("Cookie"));
}

export async function setFlashMessage(
  request: Request,
  flash: FlashMessage
): Promise<string> {
  const session = await getFlashSession(request);
  session.flash("toast", JSON.stringify(flash));
  return flashSessionStorage.commitSession(session);
}

export async function getFlashMessage(
  request: Request
): Promise<{ flash: FlashMessage | null; headers: Headers }> {
  const session = await getFlashSession(request);
  const raw = session.get("toast") as string | undefined;
  const flash = raw ? (JSON.parse(raw) as FlashMessage) : null;
  const headers = new Headers({
    "Set-Cookie": await flashSessionStorage.commitSession(session),
  });
  return { flash, headers };
}

export function flashRedirect(url: string, setCookieHeader: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      "Set-Cookie": setCookieHeader,
    },
  });
}

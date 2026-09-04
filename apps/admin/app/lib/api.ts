// Server-only — base fetch helper ke Rayeen API.

import { redirect } from "react-router";

export function getApiBase() {
  if (import.meta.env.SSR) return process.env.API_URL ?? "https://kinauid-backend.vercel.app";
  return "https://kinauid-backend.vercel.app";
}

export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  error_message: string | null;
  data: T | null;
  summary?: unknown;
  version: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function ErrorCatch({
  error,
  context,
}: {
  error: unknown;
  context: string;
}) {
  if (error instanceof Response) throw error;

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const statusCode = error instanceof ApiError ? error.statusCode : undefined;

  console.error(`[ErrorCatch] ${context}`, {
    message,
    statusCode,
    stack,
    timestamp: new Date().toISOString(),
  });
}

interface FetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  token?: string;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
  retries = 2
): Promise<ApiResponse<T>> {
  const { token, headers = {}, ...rest } = options;

  // Jika body adalah FormData, JANGAN set Content-Type manual — biarkan browser
  // men-set multipart boundary sendiri (menghindari error multipart).
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(`${getApiBase()}${path}`, {
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        signal: controller.signal,
        ...rest,
      });

      if (res.status === 401) {
        throw redirect("/auth/login");
      }

      const text = await res.text();
      let json: ApiResponse<T>;
      try {
        json = JSON.parse(text) as ApiResponse<T>;
      } catch {
        throw new ApiError(
          `Invalid JSON response from ${path}: ${text.slice(0, 100)}`,
          res.status
        );
      }

      if (!res.ok) {
        const issues = (json.data as any)?.issues;
        const issueDetails = Array.isArray(issues) && issues.length > 0
          ? issues.map((i: any) => `${i.field}: ${i.message}`).join(", ")
          : "";
        const finalMessage = issueDetails
          ? `${json.error_message || "Validation failed"} (${issueDetails})`
          : (json.error_message ?? `HTTP ${res.status}`);
        throw new ApiError(finalMessage, res.status);
      }

      return json;
    } catch (error) {
      if (error instanceof Response) throw error;
      if (error instanceof ApiError && error.statusCode < 500) throw error;
      if (attempt === retries) throw error;
      const delay = Math.min(2 ** attempt * 1000, 4000);
      await new Promise((r) => setTimeout(r, delay));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("unreachable");
}

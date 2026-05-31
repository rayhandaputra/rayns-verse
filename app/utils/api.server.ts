/**
 * Secure Curl Engine — Server-only
 *
 * A lightweight, robust fetch wrapper that mimics direct cURL operational properties.
 * Embeds global authorization tokens from environment variables.
 * This file uses `.server.ts` semantics to fully block client-bundle leakage.
 */

export interface FetchCurlOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: Record<string, any> | string | null;
  timeout?: number;
}

export interface FetchCurlResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || "REPLACE_WITH_STRONG_KEY";

/**
 * fetchCurl — Native fetch wrapper with cURL-like operational properties.
 * Automatically injects Authorization header and handles JSON serialization.
 *
 * @param url - Target endpoint URL
 * @param options - Request configuration
 * @returns Typed response object
 */
export async function fetchCurl<T = any>(
  url: string,
  options: FetchCurlOptions = {}
): Promise<FetchCurlResponse<T>> {
  const {
    method = "POST",
    headers = {},
    body = null,
    timeout = 30000,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${INTERNAL_API_SECRET}`,
    "x-agent-key": process.env.AGENT_KEY || "REPLACE_WITH_AGENT_KEY",
    ...headers,
  };

  const serializedBody =
    body === null
      ? undefined
      : typeof body === "string"
        ? body
        : JSON.stringify(body);

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: method === "GET" ? undefined : serializedBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";
    let data: T | null = null;

    if (contentType.includes("application/json")) {
      const json = await response.json();
      data = json?.data ?? json;
    } else {
      const text = await response.text();
      data = text as unknown as T;
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data: null,
        error: (data as any)?.error_message || (data as any)?.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      return {
        ok: false,
        status: 408,
        data: null,
        error: `Request timeout after ${timeout}ms`,
      };
    }

    return {
      ok: false,
      status: 0,
      data: null,
      error: error.message || "Network error",
    };
  }
}

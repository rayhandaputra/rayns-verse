// Client-only — fetch ke proxy route lokal /api/* yang handle token dari cookie.
// Token tidak pernah terexpose ke browser.

export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  error_message: string | null;
  data: T | null;
  summary?: unknown;
  version: string;
}

export class ClientApiError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "ClientApiError";
  }
}

export async function clientFetch<T>(
  path: string,
  options: { method?: string; body?: string | FormData } = {}
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  // FormData → jangan set Content-Type manual (browser set multipart boundary).
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  try {
    const res = await fetch(path, {
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
      },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      let json: ApiResponse<T> | null = null;
      try {
        json = (await res.json()) as ApiResponse<T>;
      } catch {
        /* ignore non-JSON body */
      }
      const message =
        json?.error_message ??
        (res.status === 401
          ? "Sesi berakhir. Silakan masuk kembali."
          : `HTTP ${res.status}`);
      throw new ClientApiError(message, res.status);
    }

    return res.json() as Promise<ApiResponse<T>>;
  } catch (error) {
    if (error instanceof ClientApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ClientApiError("Koneksi terputus. Coba lagi.", 408);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// import { CONFIG } from "~/config";

// export type ApiConfig = {
//   endpoint: string;
//   method?: string;
//   table?: string | null;
//   action?: string | null;
//   query?: Record<string, any>;
//   body?: Record<string, any> | FormData | null;
//   headers?: Record<string, string>;
//   auth?: boolean;
//   formData?: boolean;
// };

// const API_BASE = CONFIG.apiBaseUrl.server_api_url;
// const API_KEY = CONFIG.sessionSecret;

// export async function APIProvider<T = any>(config: ApiConfig): Promise<T> {
//   const {
//     endpoint,
//     method = "POST",
//     table = null,
//     action = null,
//     query = {},
//     body = null,
//     headers = {},
//     auth = true,
//     formData = false,
//   } = config;

//   const queryString = new URLSearchParams(query).toString();
//   const url = `${API_BASE}/${endpoint}${queryString ? `?${queryString}` : ""}`;

//   const finalHeaders: Record<string, string> = {
//     ...(formData ? {} : { "Content-Type": "application/json" }),
//     ...(auth ? { Authorization: `Bearer ${API_KEY}` } : {}),
//     ...headers,
//   };

//   let payload: any = null;

//   if (formData && body instanceof FormData) {
//     payload = body;
//   } else if (body) {
//     payload = JSON.stringify({ table, action, ...body });
//   } else {
//     payload = JSON.stringify({ table, action });
//   }

//   const res = await fetch(url, {
//     method,
//     headers: finalHeaders,
//     body: method === "GET" ? undefined : payload,
//   });
//   // if (endpoint === "bulk-insert") console.log(res);

//   if (!res.ok) {
//     throw new Error(`API Error: ${await res.statusText}`);
//   }

//   return res.json() as Promise<T>;
// }

import { CONFIG } from "~/config";

export type ApiConfig = {
  endpoint: string;
  method?: string;
  table?: string | null;
  action?: string | null;
  query?: Record<string, any>;
  body?: Record<string, any> | FormData | null;
  headers?: Record<string, string>;
  auth?: boolean;
  formData?: boolean;
  // Tambahkan opsi retry
  maxRetries?: number;
  retryDelay?: number;
};

const API_BASE = CONFIG.apiBaseUrl.server_api_url;
const API_KEY = CONFIG.sessionSecret;

// Helper untuk jeda (sleep)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// export async function APIProvider<T = any>(config: ApiConfig): Promise<T> {
//   const {
//     endpoint,
//     method = "POST",
//     table = null,
//     action = null,
//     query = {},
//     body = null,
//     headers = {},
//     auth = true,
//     formData = false,
//     maxRetries = 3, // Default 3 kali percobaan
//     retryDelay = 1000, // Default jeda 1 detik
//   } = config;

//   const queryString = new URLSearchParams(query).toString();
//   const url = `${API_BASE}/${endpoint}${queryString ? `?${queryString}` : ""}`;

//   const finalHeaders: Record<string, string> = {
//     ...(formData ? {} : { "Content-Type": "application/json" }),
//     ...(auth ? { Authorization: `Bearer ${API_KEY}` } : {}),
//     ...headers,
//   };

//   let payload: any = null;
//   if (formData && body instanceof FormData) {
//     payload = body;
//   } else if (body) {
//     payload = JSON.stringify({ table, action, ...body });
//   } else {
//     payload = JSON.stringify({ table, action });
//   }

//   // --- LOGIKA RETRY DIMULAI ---
//   let lastError: any;

//   for (let attempt = 0; attempt < maxRetries; attempt++) {
//     try {
//       const res = await fetch(url, {
//         method,
//         headers: finalHeaders,
//         body: method === "GET" ? undefined : payload,
//       });

//       // Jika response tidak ok (4xx atau 5xx)
//       if (!res.ok) {
//         // Jika error 5xx (server error), kita coba lagi.
//         // Jika 4xx (client error seperti Unauthorized), jangan retry, langsung lempar error.
//         if (res.status >= 500) {
//           throw new Error(`Server Error: ${res.statusText}`);
//         } else {
//           const errorData = await res.json().catch(() => ({}));
//           throw new Error(errorData.message || `API Error: ${res.statusText}`);
//         }
//       }

//       return (await res.json()) as T;
//     } catch (error: any) {
//       lastError = error;

//       // Cek apakah ini percobaan terakhir
//       if (attempt === maxRetries - 1) break;

//       // Logika Exponential Backoff: jeda bertambah lama di setiap percobaan
//       const backoffTime = retryDelay * Math.pow(2, attempt);
//       console.warn(
//         `[API Retry] Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${backoffTime}ms...`
//       );

//       await sleep(backoffTime);
//     }
//   }

//   // Jika semua percobaan gagal
//   console.error(`[API Final Error] All ${maxRetries} attempts failed.`);
//   throw lastError;
// }

export async function APIProvider<T = any>(config: ApiConfig): Promise<T> {
  const {
    endpoint,
    method = "POST",
    table = null,
    action = null,
    query = {},
    body = null,
    headers = {},
    auth = true,
    formData = false,
    maxRetries = 3,
    retryDelay = 1000,
  } = config;

  // ... (persiapan URL dan Headers tetap sama)
  const queryString = new URLSearchParams(query).toString();
  const url = `${API_BASE}/${endpoint}${queryString ? `?${queryString}` : ""}`;
  const finalHeaders: Record<string, string> = {
    ...(formData ? {} : { "Content-Type": "application/json" }),
    ...(auth ? { Authorization: `Bearer ${API_KEY}` } : {}),
    ...headers,
  };

  let payload: any = null;
  if (formData && body instanceof FormData) {
    payload = body;
  } else if (body) {
    payload = JSON.stringify({ table, action, ...body });
  } else {
    payload = JSON.stringify({ table, action });
  }

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // 1. Inisialisasi AbortController untuk timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Batas 15 detik

    try {
      const res = await fetch(url, {
        method,
        headers: finalHeaders,
        body: method === "GET" ? undefined : payload,
        signal: controller.signal, // 2. Masukkan signal ke fetch
      });

      // Bersihkan timeout jika fetch berhasil sebelum 15 detik
      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status >= 500) {
          throw new Error(`Server Error: ${res.statusText}`);
        } else {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `API Error: ${res.statusText}`);
        }
      }

      return (await res.json()) as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      // 1. Identifikasi tipe error
      const isAbortError = error.name === "AbortError";
      const isClientError = error.status >= 400 && error.status < 500;

      // 2. Tentukan apakah harus berhenti retry
      // Berhenti jika: Error 4xx (tapi bukan 408/429) ATAU sudah mencapai batas percobaan
      const isNotRetriable =
        isClientError && error.status !== 408 && error.status !== 429;
      const isLastAttempt = attempt === maxRetries - 1;

      if (isAbortError) {
        console.warn(`[API Timeout] Percobaan ke-${attempt + 1} gagal (15s).`);
      }

      if (isNotRetriable || isLastAttempt) {
        break; // Keluar dari loop for
      }

      // 3. Jika layak retry, lakukan backoff
      const backoffTime = retryDelay * Math.pow(2, attempt);
      console.warn(
        `[API Retry] Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${backoffTime}ms...`
      );

      await sleep(backoffTime);
    }
  }

  throw lastError;
}

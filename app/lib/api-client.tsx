import useSWR, { mutate as globalMutate, type SWRResponse } from "swr";
import qs from "query-string";
import { API_KEY } from "./api/core/config";

/**
 * 🔹 Universal fetcher
 * Bisa dipakai untuk GET, POST, PUT, DELETE, dan support headers custom
 */
export async function apiRequest<T>(
  url: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    headers?: Record<string, string>;
    params?: Record<string, any>;
  }
): Promise<T> {
  const { method = "GET", body, headers = {}, params } = options ?? {};

  const queryUrl =
    params && Object.keys(params).length > 0
      ? `${url}?${qs.stringify(params)}`
      : url;

  const res = await fetch(queryUrl, {
    method,
    // credentials: "include",
    headers: {
      "Content-Type": "application/json",
      //   ...headers, // ✅ bisa kirim Bearer, X-API-Key, dsb.
      Authorization: `Bearer ${API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error (${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * 🔹 useSWRLoader: Reusable SWR hook mirip Remix loader
 */
export function useSWRLoader<T>(
  key: string | null,
  options?: {
    params?: Record<string, any>;
    headers?: Record<string, string>;
    revalidateOnFocus?: boolean;
    refreshInterval?: number;
    fallbackData?: T;
    enabled?: boolean;
  }
): SWRResponse<T> {
  const { enabled = true, params, headers, ...swrOptions } = options ?? {};

  const queryUrl =
    // key && params ? `${key}?${qs.stringify(params)}` : (key ?? null);
    key ?? null;

  const fetcher = (url: string) =>
    apiRequest<T>(url, {
      method: "POST",
      headers,
      body: params,
    });

  return useSWR<T>(enabled ? queryUrl : null, fetcher, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
    ...swrOptions,
  });
}

/**
 * 🔁 mutateData: Update cache tanpa reload
 */
export const mutateData = async (
  key: string,
  newData: any,
  shouldRevalidate = true
) => {
  await globalMutate(key, newData, shouldRevalidate);
};

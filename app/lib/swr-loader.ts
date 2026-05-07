import useSWR, { mutate as globalMutate, type SWRResponse } from "swr";
import qs from "query-string"; // optional untuk mudah buat query params

// 🧠 Fetcher universal
const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
};

// 🧩 Reusable SWR Loader (mirip Remix loader)
export function useSWRLoader<T>(
  key: string | null,
  options?: {
    params?: Record<string, any>; // 🔹 filter/query dari client
    revalidateOnFocus?: boolean;
    refreshInterval?: number;
    fallbackData?: T;
    enabled?: boolean;
  }
): SWRResponse<T> {
  const { enabled = true, params, ...swrOptions } = options ?? {};

  // 🔹 Build URL dengan query string
  const queryUrl =
    key && params ? `${key}?${qs.stringify(params)}` : (key ?? null);

  return useSWR<T>(enabled ? queryUrl : null, fetcher<T>, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
    ...swrOptions,
  });
}

// 🔁 Mutasi global data (update tanpa reload)
export const mutateData = async (
  key: string,
  newData: any,
  shouldRevalidate = true
) => {
  await globalMutate(key, newData, shouldRevalidate);
};

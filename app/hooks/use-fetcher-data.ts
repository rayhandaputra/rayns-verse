// import { useFetcher } from "@remix-run/react";
import { useEffect } from "react";
import { useFetcher } from "react-router";

interface UseFetcherDataOptions {
  endpoint: string;
  method?: "GET" | "POST";
  autoLoad?: boolean;
  params?: Record<string, any>;
}

interface UseFetcherDataReturn<T> {
  data: T | undefined;
  loading: boolean;
  error: any;
  load: (customParams?: Record<string, any>) => void;
  reload: () => void;
  fetcher: ReturnType<typeof useFetcher>;
}

export function useFetcherData<T = any>(
  options: UseFetcherDataOptions
): UseFetcherDataReturn<T> {
  const { endpoint, method = "GET", autoLoad = true, params = {} } = options;
  const fetcher = useFetcher<T>();

  const load = (customParams?: Record<string, any>) => {
    const finalParams = { ...params, ...customParams };
    const searchParams = new URLSearchParams(
      Object.entries(finalParams).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        },
        {} as Record<string, string>
      )
    );

    const url = searchParams.toString()
      ? `${endpoint}?${searchParams.toString()}`
      : endpoint;

    if (method === "POST") {
      fetcher.submit(finalParams, {
        method: "POST",
        action: endpoint,
      });
    } else {
      if (fetcher.state === "idle" && !url.includes("undefined")) {
        fetcher.load(url);
      }
    }
  };

  const reload = () => {
    load(params);
  };

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [endpoint]);

  return {
    data: fetcher.data,
    loading: fetcher.state === "loading" || fetcher.state === "submitting",
    error: (fetcher.data as any)?.error,
    load,
    reload,
    fetcher,
  } as any;
}

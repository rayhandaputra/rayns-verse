// // import { useFetcher } from "@remix-run/react";
// import { useEffect } from "react";
// import { useFetcher } from "react-router";

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

// export function useFetcherData<T = any>(
//   options: UseFetcherDataOptions
// ): UseFetcherDataReturn<T> {
//   const { endpoint, method = "GET", autoLoad = true, params = {} } = options;
//   const fetcher = useFetcher<T>();

//   const load = (customParams?: Record<string, any>) => {
//     const finalParams = { ...params, ...customParams };
//     const searchParams = new URLSearchParams(
//       Object.entries(finalParams).reduce(
//         (acc, [key, value]) => {
//           if (value !== undefined && value !== null) {
//             acc[key] = String(value);
//           }
//           return acc;
//         },
//         {} as Record<string, string>
//       )
//     );

//     const url = searchParams.toString()
//       ? `${endpoint}?${searchParams.toString()}`
//       : endpoint;

//     if (method === "POST") {
//       fetcher.submit(finalParams, {
//         method: "POST",
//         action: endpoint,
//       });
//     } else {
//       if (fetcher.state === "idle" && !url.includes("undefined")) {
//         fetcher.load(url);
//       }
//     }
//   };

//   const reload = () => {
//     load(params);
//   };

//   useEffect(() => {
//     if (autoLoad) {
//       load();
//     }
//   }, [endpoint]);

//   return {
//     data: fetcher.data,
//     loading: fetcher.state === "loading" || fetcher.state === "submitting",
//     error: (fetcher.data as any)?.error,
//     load,
//     reload,
//     fetcher,
//   } as any;
// }
import { useEffect, useRef } from "react";
import { useFetcher, useNavigate } from "react-router";

export function useFetcherData<T = any>(
  options: UseFetcherDataOptions
): UseFetcherDataReturn<T> {
  const { endpoint, method = "GET", autoLoad = true, params = {} } = options;
  const fetcher = useFetcher<T>();
  const mountedRef = useRef(false);
  const navigate = useNavigate();

  const load = (customParams?: Record<string, any>) => {
    if (!mountedRef.current) return;

    const finalParams = { ...params, ...customParams };
    const searchParams = new URLSearchParams(
      Object.entries(finalParams).reduce(
        (acc, [key, value]) => {
          if (value != null) acc[key] = String(value);
          return acc;
        },
        {} as Record<string, string>
      )
    );

    const url = searchParams.toString()
      ? `${endpoint}?${searchParams}`
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

  // --- LOGIKA HANDLING GLOBAL ---
  useEffect(() => {
    const data = fetcher.data as any;

    // Cek apakah ada flag unauthorized di dalam data
    if (data && data.unauthorized) {
      // 1. Logika pembersihan (opsional)
      // localStorage.removeItem("token");

      // 2. Redirect ke halaman login
      // Kita tambahkan pengecekan agar tidak terjadi infinite loop jika sudah di login
      if (window.location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    }
  }, [fetcher.data, navigate]);
  // ------------------------------

  useEffect(() => {
    mountedRef.current = true;

    if (autoLoad) {
      load();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [endpoint]);

  return {
    data: fetcher.data,
    loading: fetcher.state === "loading" || fetcher.state === "submitting",
    error: (fetcher.data as any)?.error,
    load,
    reload: () => load(params),
    fetcher,
  };
}

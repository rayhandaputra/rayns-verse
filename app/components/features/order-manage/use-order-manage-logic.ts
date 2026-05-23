import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";

/**
 * Async search helper — wraps useFetcher so react-select loadOptions
 * can get Promise<Option[]> without calling fetch() directly.
 */
function useAsyncSearch() {
  const fetcher = useFetcher();
  const resolveRef = useRef<((value: any) => void) | null>(null);
  const rejectRef = useRef<((err: any) => void) | null>(null);

  useEffect(() => {
    if (fetcher.state !== "idle") return;
    if (resolveRef.current && fetcher.data) {
      const result = fetcher.data as any;
      if (result?.success) {
        const items = result.data?.items || result.data || [];
        resolveRef.current(items);
      } else {
        resolveRef.current([]);
      }
      resolveRef.current = null;
      rejectRef.current = null;
    }
  }, [fetcher.state, fetcher.data]);

  const asyncLoad = useCallback(
    (params: Record<string, string>) =>
      new Promise<any[]>((resolve, reject) => {
        resolveRef.current = resolve;
        rejectRef.current = reject;
        const qs = new URLSearchParams(params).toString();
        fetcher.load(`/api/nexus?${qs}`);
      }),
    [fetcher],
  );

  return { asyncLoad };
}

export const useOrderManageLogic = () => {
  const [state, setState] = useState<any>({ items: [{}] });
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [initialError, setInitialError] = useState<boolean>(false);

  const resetForm = () => {
    setState({ items: [{ qty: 1 }] });
  };

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetcher untuk async search (react-select)
  const { asyncLoad } = useAsyncSearch();

  // Fetcher untuk submit (create order, update status)
  const submitFetcher = useFetcher();

  // Pantau response submit
  useEffect(() => {
    if (submitFetcher.data && submitFetcher.state === "idle") {
      const result = submitFetcher.data as any;
      if (result?.success) {
        const data = result.data;
        setOrderResult(data?.data || data);
        toast.success("Pesanan berhasil dibuat");
        resetForm();
      } else if (result?.success === false) {
        toast.error(result?.error || "Gagal memproses");
      }
      setLoading(false);
    }
  }, [submitFetcher.data, submitFetcher.state]);

  // --- loadOptions (react-select async) ---

  const loadOptionInstitution = async (search: string) => {
    setInitialError(false);
    try {
      const items = await asyncLoad({
        module: "INSTITUTION",
        action: "get",
        search: search || "",
        size: "20",
        pagination: "false",
      });
      return items.map((o: any) => ({ value: o.id, label: o.name, ...o }));
    } catch {
      setInitialError(true);
      return [];
    }
  };

  const loadOptionDomain = async (search: string) => {
    try {
      const items = await asyncLoad({
        module: "INSTITUTION",
        action: "getDomains",
        institution_id: state?.institution_id || "",
        search: search || "",
      });
      return items.map((o: any) => ({ value: o.id, label: o.domain, ...o }));
    } catch {
      return [];
    }
  };

  const loadOptionProduct = async (search: string) => {
    try {
      const items = await asyncLoad({
        module: "PRODUCT",
        action: "get",
        search: search || "",
        size: "20",
        pagination: "false",
      });
      return items.map((o: any) => ({ value: o.id, label: o.name, ...o }));
    } catch {
      return [];
    }
  };

  // --- Submit actions ---

  const handleSubmit = async () => {
    setLoading(true);
    submitFetcher.submit(
      {
        module: "ORDERS",
        action: "create",
        data: JSON.stringify(state),
      },
      {
        method: "POST",
        action: "/api/nexus",
        encType: "application/json",
      },
    );
  };

  const handleDeliveryStatus = async () => {
    setLoading(true);
    const { order_id, status } = state;
    submitFetcher.submit(
      {
        module: "ORDERS",
        action: "update_status_single",
        id: order_id,
        status,
        table: "orders",
      },
      {
        method: "POST",
        action: "/api/nexus",
        encType: "application/json",
      },
    );
  };

  return {
    state,
    setState,
    resetForm,
    loading,
    loadOptionInstitution,
    loadOptionDomain,
    loadOptionProduct,
    handleSubmit,
    orderResult,
    setOrderResult,
    initialError,
    handleDeliveryStatus,
  };
};
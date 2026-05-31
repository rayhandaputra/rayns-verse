import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { toast } from "sonner";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { useModal } from "~/hooks";
import Swal from "sweetalert2";
import QRCode from "qrcode";
import { toBlob, toPng } from "html-to-image";

export interface OrderFilters {
  year: string;
  status: string;
  payment_status: string;
  order_type: string;
  kknInstitution: string;
}

const DEFAULT_FILTERS: OrderFilters = {
  year: "",
  status: "",
  payment_status: "",
  order_type: "",
  kknInstitution: "",
};

export function useOrderListLogic() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // ── State ──
  const [viewMode, setViewMode] = useState<"reguler" | "kkn">("reguler");
  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] = useState<OrderFilters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState("created_on:desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [modal, setModal] = useModal();
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // ── Data Fetching ──
  const { data: kknInstitutions, loading: loadingKknInstitutions } = useFetcherData({
    endpoint: "/api/nexus",
    params: { module: "OVERVIEW", action: "getKknInstitutions" },
  });

  const ordersParams = useMemo(() => ({
    module: "ORDERS",
    action: "get",
    page,
    size: pageSize,
    pagination: "true",
    ...(viewMode === "kkn" ? { is_kkn: "1" } : { is_kkn: "0" }),
    ...(filters.year && { year: filters.year }),
    ...(filters.status && { status: filters.status }),
    ...(filters.payment_status && { payment_status: filters.payment_status }),
    ...(filters.order_type && { order_type: filters.order_type }),
    ...(viewMode === "kkn" && filters.kknInstitution && { institution_id: filters.kknInstitution }),
    ...(sortBy && { sort: sortBy }),
    ...(searchTerm && { search: searchTerm }),
  }), [viewMode, filters, sortBy, searchTerm, page, pageSize]);

  const { data: orders, reload, loading: ordersLoading } = useFetcherData({
    endpoint: "/api/nexus",
    params: ordersParams,
  });

  const { data: bankList } = useFetcherData({
    endpoint: "/api/nexus",
    params: { module: "ACCOUNT", action: "get", size: 100, pagination: "true", is_bank: "1" },
  });

  const { data: actionData, load: submitAction, loading: actionLoading } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  // ── Share / QR ──
  const cardRef = useRef<HTMLDivElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [tempQr, setTempQr] = useState("");
  const [isProcessingShare, setIsProcessingShare] = useState<number | null>(null);

  // ── Filter Helpers ──
  const openFilterModal = useCallback(() => {
    setTempFilters(filters);
    setFilterModalOpen(true);
  }, [filters]);

  const applyFilters = useCallback(() => {
    setFilters(tempFilters);
    setPage(0);
    setFilterModalOpen(false);
  }, [tempFilters]);

  const resetFilters = useCallback(() => {
    setTempFilters(DEFAULT_FILTERS);
  }, []);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length;
  }, [filters]);

  // ── Tab Change ──
  const handleTabChange = useCallback((tab: string) => {
    setViewMode(tab as "reguler" | "kkn");
    setPage(0);
    setFilters(DEFAULT_FILTERS);
    setSearchTerm("");
  }, []);

  // ── Search ──
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const handleSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value);
      setPage(0);
    }, 400);
  }, []);

  // ── Pagination ──
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage - 1);
  }, []);

  const handleRowsPerPageChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  }, []);

  // ── Share Logic ──
  const handleShare = async (order: any) => {
    if (isProcessingShare !== null) return;
    try {
      setIsProcessingShare(order.id);
      setSelectedOrder(order);
      const qrContent = `https://kinau.id/public/drive-link/${order.order_number}`;
      const qrUrl = await QRCode.toDataURL(qrContent, { width: 400, margin: 2 });
      setTempQr(qrUrl);
      await new Promise((r) => setTimeout(r, 500));

      if (!cardRef.current) throw new Error("Template ref is not ready");

      const captureOptions = {
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,
        style: { fontFamily: "sans-serif" },
      };

      if (navigator.share) {
        const blob = await toBlob(cardRef.current, captureOptions);
        if (!blob) throw new Error("Gagal membuat file gambar");
        const file = new File([blob], `Order-${order.order_number}.png`, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: `Pesanan ${order.institution_name}`,
          text: `Halo, berikut adalah QR Drive untuk *${order.institution_name}*.\n\nNomor Pesanan: #${order.order_number}\nLink Drive: https://kinau.id/public/drive-link/${order.order_number}\n\nSilahkan scan atau klik link di atas.`,
        });
        toast.success("Berhasil dibagikan");
      } else {
        const dataUrl = await toPng(cardRef.current, captureOptions);
        const link = document.createElement("a");
        link.download = `QR-${order.institution_name}.png`;
        link.href = dataUrl;
        link.click();
        navigator.clipboard.writeText(qrContent);
        toast.success("Link disalin & QR didownload");
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        toast.error("Gagal memproses gambar");
      }
    } finally {
      setIsProcessingShare(null);
      setTempQr("");
      setSelectedOrder(null);
    }
  };

  const handleCopyImageQrCode = async (order: any) => {
    if (isProcessingShare !== null) return;
    const loadingToast = toast.loading("Sedang membuat QR Code...");
    try {
      setIsProcessingShare(order.id);
      setSelectedOrder(order);
      const qrContent = `https://kinau.id/public/drive-link/${order.order_number}`;
      const qrUrl = await QRCode.toDataURL(qrContent, { width: 400, margin: 2 });
      setTempQr(qrUrl);
      await new Promise((r) => setTimeout(r, 600));

      if (!cardRef.current) throw new Error("Template tidak siap.");

      const captureOptions = { pixelRatio: 2, skipFonts: true, cacheBust: true };
      const blob = await toBlob(cardRef.current, captureOptions);
      if (!blob) throw new Error("Gagal membuat gambar");

      if (navigator.clipboard && window.ClipboardItem) {
        const data = [new ClipboardItem({ [blob.type]: blob })];
        await navigator.clipboard.write(data);
        toast.dismiss(loadingToast);
        toast.success("Gambar berhasil disalin ke clipboard!");
      } else {
        throw new Error("Browser tidak mendukung penyalinan gambar");
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("Gagal menyalin: " + (error.message || "Pastikan tab tetap aktif"));
    } finally {
      setIsProcessingShare(null);
      setTempQr("");
      setSelectedOrder(null);
    }
  };

  // ── Actions ──
  const handleSubmitPaymentProof = (e: any) => {
    e.preventDefault();
    if (isUploadingFile) {
      toast.error("Tunggu sebentar, file masih diunggah...");
      return;
    }
    submitAction({
      action: "update_payment_proof",
      id: modal?.data?.id,
      order: JSON.stringify(modal?.data),
      payment_method: modal?.data?.payment_method,
      ...(modal?.data?.source_upload !== "down_payment"
        ? { payment_proof: modal?.data?.file, payment_detail: JSON.stringify(modal?.data?.payment_detail) }
        : { dp_payment_proof: modal?.data?.file, dp_payment_detail: JSON.stringify(modal?.data?.payment_detail) }),
    });
  };

  const onUpdateStatus = useCallback((id: string, status: string) => {
    submitAction({ action: "update_status", id, status });
  }, [submitAction]);

  const onUpdateStatusPrinted = useCallback((id: string, status: string) => {
    submitAction({ action: "update_status_printed", id, status });
  }, [submitAction]);

  const onUpdateReview = useCallback((id: string, rating: number, review: string) => {
    submitAction({ action: "update_review", id, rating: String(rating), review });
  }, [submitAction]);

  const onUpdatePaymentProof = useCallback((id: string, proof: string) => {
    submitAction({ action: "update_payment_proof", id, proof });
  }, [submitAction]);

  const onDeletePaymentProof = useCallback((id: string, field: string) => {
    submitAction({ action: "delete_payment_proof", id, field });
  }, [submitAction]);

  const onDelete = useCallback((order: any) => {
    Swal.fire({
      title: "Hapus Pesanan?",
      text: `Yakin ingin menghapus pesanan ${order.institution_name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        submitAction({ action: "delete", id: order.id });
      }
    });
  }, [submitAction]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Disalin ke clipboard");
  }, []);

  // ── Action Response Handler ──
  const lastProcessedActionData = useRef<any>(null);

  useEffect(() => {
    if (actionData && actionData !== lastProcessedActionData.current) {
      lastProcessedActionData.current = actionData;
      if (actionData.success) {
        setModal((prev: any) => ({ ...prev, open: false, type: "" }));
        toast.success(actionData.message || "Berhasil");
        reload();
      } else if (actionData.success === false) {
        toast.error(actionData.message || "Gagal");
      }
    }
  }, [actionData, reload, setModal]);

  // ── Derived Data ──
  const orderItems = useMemo(() => orders?.data?.items || [], [orders]);
  const totalItems = useMemo(() => orders?.data?.total_items || 0, [orders]);
  const totalPages = useMemo(() => orders?.data?.total_pages || 0, [orders]);

  return {
    navigate,
    viewMode,
    setViewMode: handleTabChange,
    filters,
    tempFilters,
    setTempFilters,
    sortBy,
    setSortBy,
    searchTerm,
    handleSearch,
    page,
    setPage,
    pageSize,
    handlePageChange,
    handleRowsPerPageChange,
    modal,
    setModal,
    isUploadingFile,
    setIsUploadingFile,
    orders,
    orderItems,
    totalItems,
    totalPages,
    ordersLoading,
    reload,
    kknInstitutions,
    loadingKknInstitutions,
    bankList,
    actionLoading,
    filterModalOpen,
    setFilterModalOpen,
    openFilterModal,
    applyFilters,
    resetFilters,
    activeFilterCount,
    handleShare,
    handleCopyImageQrCode,
    handleSubmitPaymentProof,
    onUpdateStatus,
    onUpdateStatusPrinted,
    onUpdateReview,
    onUpdatePaymentProof,
    onDeletePaymentProof,
    onDelete,
    copyToClipboard,
    cardRef,
    selectedOrder,
    tempQr,
    isProcessingShare,
  };
}

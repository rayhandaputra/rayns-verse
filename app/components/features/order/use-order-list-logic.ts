import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { toast } from "sonner";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/nexus/nexus-client";
import { useModal } from "~/hooks";
import Swal from "sweetalert2";
import QRCode from "qrcode";
import { toBlob, toPng } from "html-to-image";

export function useOrderListLogic() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const [viewMode, setViewMode] = useState<"reguler" | "kkn">("reguler");
  const [filterYear, setFilterYear] = useState("");
  const [filterKknInstitution, setFilterKknInstitution] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useModal();
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const { data: kknInstitutions, loading: loadingKknInstitutions } = useFetcherData({
    endpoint: nexus().module("OVERVIEW").action("getKknInstitutions").build(),
  });

  const { data: orders, reload } = useFetcherData({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({
        page: page ? page - 1 : 0,
        size: 100,
        pagination: "true",
        ...(viewMode === "kkn" ? { is_kkn: "1" } : { is_kkn: "0" }),
        ...(filterYear && { year: filterYear }),
        ...(viewMode === "kkn" && filterKknInstitution && { institution_id: filterKknInstitution }),
        ...(sortBy && { sort: sortBy }),
      })
      .build(),
  });

  const { data: bankList } = useFetcherData({
    endpoint: nexus()
      .module("ACCOUNT")
      .action("get")
      .params({ size: 100, pagination: "true", is_bank: "1" })
      .build(),
  });

  const { data: actionData, load: submitAction, loading: actionLoading } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [tempQr, setTempQr] = useState("");
  const [isProcessingShare, setIsProcessingShare] = useState<number | null>(null);

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
          text: `Halo, berikut adalah QR Drive untuk *${order.institution_name}*.\n\n` +
            `Nomor Pesanan: #${order.order_number}\n` +
            `Link Drive: https://kinau.id/public/drive-link/${order.order_number}\n\n` +
            `Silahkan scan atau klik link di atas.`,
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
        console.error(error);
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

      if (!cardRef.current) throw new Error("Template tidak siap. Pastikan tab browser tetap aktif.");

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
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error("Gagal menyalin: " + (error.message || "Pastikan tab tetap aktif saat proses"));
    } finally {
      setIsProcessingShare(null);
      setTempQr("");
      setSelectedOrder(null);
    }
  };

  const handleSubmitPaymentProof = (e: any) => {
    e.preventDefault();
    console.log(modal?.data)
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

  const onUpdateStatus = (id: string, status: string) => {
    submitAction({ action: "update_status", id, status });
  };

  const onUpdateStatusPrinted = (id: string, status: string) => {
    submitAction({ action: "update_status_printed", id, status });
  };

  const onUpdateReview = (id: string, rating: number, review: string) => {
    submitAction({ action: "update_review", id, rating: String(rating), review });
  };

  const onUpdatePaymentProof = (id: string, proof: string) => {
    submitAction({ action: "update_payment_proof", id, proof });
  };

  const onDeletePaymentProof = (id: string, field: string) => {
    submitAction({ action: "delete_payment_proof", id, field });
  };

  const onDelete = (order: any) => {
    Swal.fire({
      title: "Hapus Pesanan?",
      text: `Yakin ingin menghapus pesanan ${order.institution_name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      customClass: { confirmButton: "bg-red-600 text-white", cancelButton: "bg-gray-200 text-gray-800" },
    }).then((result) => {
      if (result.isConfirmed) {
        submitAction({ action: "delete", id: order.id });
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Disalin ke clipboard");
  };

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

  return {
    navigate,
    location,
    viewMode,
    setViewMode,
    filterYear,
    setFilterYear,
    filterKknInstitution,
    setFilterKknInstitution,
    sortBy,
    setSortBy,
    page,
    setPage,
    modal,
    setModal,
    isUploadingFile,
    setIsUploadingFile,
    orders,
    reload,
    kknInstitutions,
    loadingKknInstitutions,
    bankList,
    actionLoading,
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

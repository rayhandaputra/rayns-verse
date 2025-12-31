import React, { useState, useMemo, useEffect, useRef } from "react";
import type { Order } from "../types";
import {
  ADMIN_WA,
  formatCurrency,
  formatFullDate,
  getWhatsAppLink,
} from "../constants";
import {
  Check,
  Trash2,
  Copy,
  FileText,
  MessageCircle,
  FolderOpen,
  Handshake,
  X,
  Upload,
  Image,
  Loader2,
  ExternalLink,
  Share2Icon,
  QrCode,
  Pencil,
} from "lucide-react";
import NotaView from "../components/NotaView";
import {
  DataTable,
  TablePagination,
  type ColumnDef,
} from "../components/ui/data-table";
import {
  useNavigate,
  useLocation,
  type LoaderFunction,
  type ActionFunction,
} from "react-router";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";
import moment from "moment";
import {
  getOrderLabel,
  getPaymentStatusLabel,
  safeParseArray,
  safeParseObject,
  uploadFile,
} from "~/lib/utils";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/lib/nexus-client";
import { useModal } from "~/hooks";
import Swal from "sweetalert2";
import ModalSecond from "~/components/modal/ModalSecond";
import { Button } from "~/components/ui/button";
import { dateFormat } from "~/lib/dateFormatter";
import { toBlob, toPng } from "html-to-image";
import QRCode from "qrcode";
import OrderShareCard from "~/components/print/order/OrderShareTemplate";

export const loader: LoaderFunction = async ({ request }) => {
  // Only check authentication
  await requireAuth(request);
  return Response.json({ initialized: true });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const actionType = formData.get("action");
  const id = formData.get("id") as string;

  if (actionType === "delete") {
    const { id, order } = Object.fromEntries(formData.entries());
    const res = await API.ORDERS.update({
      session: { user, token },
      req: { body: { id, order, deleted_on: new Date().toISOString() } },
    });
    return Response.json({
      success: res.success,
      message: res.success ? "Pesanan dihapus" : "Gagal menghapus",
    });
  }

  if (actionType === "update_status") {
    const status = formData.get("status") as string;

    // Map UI status back to API status
    // let apiStatus = "ordered";
    // if (status === "selesai") apiStatus = "done";
    // else if (status === "sedang dikerjakan") apiStatus = "in_production";
    // else if (status === "pending") apiStatus = "ordered";

    const res = await API.ORDERS.update({
      session: { user, token },
      req: { body: { id, status } },
    });
    return Response.json({
      success: res.success,
      message: res.success ? "Status diperbarui" : "Gagal memperbarui status",
    });
  }

  if (actionType === "update_review") {
    const rating = Number(formData.get("rating"));
    const review = formData.get("review") as string;

    // Only update if valid
    const res = await API.ORDERS.update({
      session: { user, token },
      req: { body: { id, rating, review } },
    });
    return Response.json({
      success: res.success,
      message: res.success ? "Ulasan diperbarui" : "Gagal memperbarui ulasan",
    });
  }

  if (actionType === "update_payment_proof") {
    const {
      id,
      payment_proof,
      payment_method,
      payment_detail,
      dp_payment_proof,
      dp_payment_method,
      order,
      dp_payment_detail,
    } = Object.fromEntries(formData.entries());

    // Only update if valid
    const res = await API.ORDERS.update({
      session: { user, token },
      req: {
        body: {
          id,
          order,
          payment_proof,
          payment_method,
          payment_detail,
          dp_payment_proof,
          dp_payment_method,
          dp_payment_detail,
        },
      },
    });
    return Response.json({
      success: res.success,
      message: res.success
        ? "Bukti pembayaran diperbarui"
        : "Gagal memperbarui bukti pembayaran",
    });
  }

  return Response.json({ success: false });
};

export default function OrderList() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
      // Clear state to prevent toast from reappearing on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const [viewMode, setViewMode] = useState<"reguler" | "kkn">("reguler");
  const [filterYear, setFilterYear] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [page, setPage] = useState(1);

  const [modal, setModal] = useModal();

  // Fetch orders with Nexus
  // ... existing code ...
  const onUpdateReview = (id: string, rating: number, review: string) => {
    submitAction({
      action: "update_review",
      id,
      rating: String(rating),
      review,
    });
  };
  const onUpdatePaymentProof = (id: string, proof: string) => {
    submitAction({
      action: "update_payment_proof",
      id,
      proof,
    });
  };

  // ... existing code ...

  const {
    data: orders,
    loading,
    reload,
  } = useFetcherData({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({
        page: page ? page - 1 : 0,
        size: 10,
        pagination: "true",
        ...(viewMode === "kkn"
          ? {
              is_kkn: "1",
            }
          : {
              is_kkn: "0",
            }),
        ...(filterYear && {
          year: filterYear,
        }),
        ...(sortBy && {
          sort: sortBy,
        }),
      })
      .build(),
  });

  const {
    data: bankList,
    loading: loadingBank,
    reload: reloadBank,
  } = useFetcherData({
    endpoint: nexus()
      .module("ACCOUNT")
      .action("get")
      .params({
        size: 100,
        pagination: "true",
        is_bank: "1",
      })
      .build(),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Disalin ke clipboard");
  };

  const {
    data: actionData,
    load: submitAction,
    loading: actionLoading,
  } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  // ... di dalam komponen utama
  const cardRef = useRef(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [tempQr, setTempQr] = useState("");
  const [isProcessingShare, setIsProcessingShare] = useState<number | null>(
    null
  );

  const handleShare = async (order: any) => {
    // Pastikan ID valid sebelum membandingkan
    if (isProcessingShare !== null) return;

    try {
      setIsProcessingShare(order.id);
      setSelectedOrder(order);

      const qrContent = `https://kinau.id/public/drive-link/${order.order_number}`;

      // 1. Generate QR Code (Ini cepat karena library lokal)
      const qrUrl = await QRCode.toDataURL(qrContent, {
        width: 400,
        margin: 2,
      });
      setTempQr(qrUrl);

      // 2. TUNGGU LEBIH LAMA (PENTING!)
      // Render state di React butuh waktu, apalagi jika ada image tag (QR)
      await new Promise((r) => setTimeout(r, 500));

      if (!cardRef.current) {
        throw new Error("Template ref is not ready");
      }

      // 3. Opsi Capture (Pindahkan ke sini agar Error CSS hilang)
      const captureOptions = {
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true, // INI yang menghentikan error Security CSS Rules
        style: {
          fontFamily: "sans-serif",
        },
      };

      if (navigator.share) {
        // --- LOGIC MOBILE ---
        const blob = await toBlob(cardRef.current, captureOptions);
        if (!blob) throw new Error("Gagal membuat file gambar");

        const file = new File([blob], `Order-${order.order_number}.png`, {
          type: "image/png",
        });

        await navigator.share({
          files: [file],
          title: `Pesanan ${order.institution_name}`,
          text:
            `Halo, berikut adalah QR Drive untuk *${order.institution_name}*.\n\n` +
            `Nomor Pesanan: #${order.order_number}\n` +
            `Link Drive: https://kinau.id/public/drive-link/${order.order_number}\n\n` +
            `Silahkan scan atau klik link di atas.`,
        });
        toast.success("Berhasil dibagikan");
      } else {
        // --- LOGIC DESKTOP ---
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
      // Membersihkan state setelah selesai agar memori lega
      setTempQr("");
      setSelectedOrder(null);
    }
  };

  const handleCopyImageQrCode = async (order: any) => {
    if (isProcessingShare !== null) return;

    // Toast loading to give immediate feedback
    const loadingToast = toast.loading("Sedang membuat QR Code...");

    try {
      setIsProcessingShare(order.id);
      setSelectedOrder(order);

      // Prevent user from switching tabs/leaving by alerting if they try
      // (Browser safety: we can't truly "lock" tabs, but we can detect visibility changes)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          console.warn("User switched tabs during QR generation");
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      const qrContent = `https://kinau.id/public/drive-link/${order.order_number}`;
      const qrUrl = await QRCode.toDataURL(qrContent, {
        width: 400,
        margin: 2,
      });
      setTempQr(qrUrl);

      // Tunggu render template - ensure visibility
      await new Promise((r) => setTimeout(r, 600));

      if (!cardRef.current) {
        throw new Error("Template tidak siap. Pastikan tab browser tetap aktif.");
      }

      const captureOptions = {
        pixelRatio: 2,
        skipFonts: true,
        cacheBust: true,
      };

      // 1. Generate Blob dari elemen
      const blob = await toBlob(cardRef.current, captureOptions);
      if (!blob) throw new Error("Gagal membuat gambar");

      // 2. Gunakan Clipboard API untuk menyalin Blob
      if (navigator.clipboard && window.ClipboardItem) {
        const data = [new ClipboardItem({ [blob.type]: blob })];
        await navigator.clipboard.write(data);
        toast.dismiss(loadingToast);
        toast.success("Gambar berhasil disalin ke clipboard!");
      } else {
        throw new Error("Browser tidak mendukung penyalinan gambar");
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
    submitAction({
      action: "update_payment_proof",
      id: modal?.data?.id,
      order: JSON.stringify(modal?.data),
      payment_method: modal?.data?.payment_method,
      ...(modal?.data?.source_upload !== "down_payment"
        ? {
            payment_proof: modal?.data?.file,
            payment_detail: JSON.stringify(modal?.data?.payment_detail),
          }
        : {
            dp_payment_proof: modal?.data?.file,
            dp_payment_detail: JSON.stringify(modal?.data?.payment_detail),
          }),
    });
  };
  const onUpdateStatus = (id: string, status: string) => {
    submitAction({ action: "update_status", id, status });
  };

  const onMarkDone = (id: string) => {
    submitAction({ action: "update_status", id, status: "done" });
  };

  const onDelete = (order: any) => {
    Swal.fire({
      title: "Hapus Pesanan?",
      text: `Yakin ingin menghapus pesanan ${order.institution_name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      customClass: {
        confirmButton: "bg-red-600 text-white",
        cancelButton: "bg-gray-200 text-gray-800",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        submitAction({ action: "delete", id: order.id });
      }
    });
  };

  // Reload orders after action
  useEffect(() => {
    if (actionData?.success) {
      setModal({ ...modal, open: false, type: "" });
      toast.success(actionData.message || "Berhasil");
      reload();
    } else if (actionData?.success === false) {
      toast.error(actionData.message || "Gagal");
    }
  }, [actionData]);

  const onOpenDrive = (folderId: string) => {
    // Trying to construct a valid drive link.
    // Assuming accessCode acts as identifier or we navigate to main drive page
    navigate(`/app/drive?folder_id=${folderId}`);
  };

  const getStatusColor = (status: string) => {
    if (status === "done")
      return "bg-green-100 text-green-700 border border-green-200";
    if (status === "confirmed")
      return "bg-blue-100 text-blue-700 border border-blue-200";
    return "bg-gray-100 text-gray-700 border border-gray-200";
  };

  const getFunctionalLink = (accessCode: string) =>
    `/public/drive-link/${accessCode}`;

  const STATUS_OPTIONS = ["pending", "confirmed", "done"] as const;

  function normalizeStatus(value?: string | null) {
    return STATUS_OPTIONS.includes(value as any) ? value : "";
  }

  const isValidUploadedProof = (proof?: unknown) =>
    typeof proof === "string" && proof.includes("data.kinau.id");

  // Column definitions for DataTable
  const columns: ColumnDef<Order>[] = useMemo(
    () => [
      // {
      //   key: "createdAt",
      //   header: "No Order",
      //   cellClassName: "whitespace-nowrap text-xs text-gray-600 font-medium",
      //   cell: (order) => (
      //     <div className="flex flex-col">
      //       <p className="font-semibold">
      //         {+order?.is_archive === 1 ? "Arsip" : order.order_number}
      //       </p>
      //       {/* <p>
      //         {order?.order_date
      //           ? moment(order.order_date).format("DD MMM YYYY HH:mm")
      //           : "-"}
      //       </p> */}
      //     </div>
      //   ),
      // },
      {
        key: "instansi",
        header: "Instansi/Pemesan",
        cellClassName: "max-w-[180px]",
        cell: (order) => (
          <>
            {/* <div className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              {order.institution_name}
              {+(order?.is_sponsor ?? 0) === 1 && (
                <span
                  title="Sponsor / Kerja Sama"
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200"
                >
                  <Handshake size={10} className="mr-0.5" /> SPONSOR
                </span>
              )}
            </div> */}
            <div className="font-bold text-gray-900 w-[180px] flex items-center gap-2">
              {+(order?.is_kkn ?? 0) === 1
                ? `${order?.kkn_type?.toLowerCase() === "ppm" ? "Kelompok" : "Desa"} ${safeParseObject(order?.kkn_detail)?.value}`
                : order.institution_name}
              {+(order?.is_sponsor ?? 0) === 1 && (
                <span
                  title="Sponsor / Kerja Sama"
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200"
                >
                  <Handshake size={10} className="mr-0.5" /> PARTNER
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {order.pic_name || "-"}{" "}
              <a
                className="text-blue-600 hover:underline"
                href={getWhatsAppLink(
                  order.pic_phone || "",
                  `Halo ${order.pic_name}, saya ingin bertanya tentang pemesanan ${order.order_number}`
                )}
                target="_blank"
                rel="noreferrer"
              >
                ({order.pic_phone || "-"})
              </a>
            </div>
          </>
        ),
      },
      {
        key: "jenisPesanan",
        header: "Nama Item",
        cellClassName: "max-w-[250px]",
        cell: (order) => (
          <ul className="list-disc list-inside w-[180px] text-xs text-gray-600 break-words whitespace-normal">
            {safeParseArray(order.order_items)?.length > 0
              ? safeParseArray(order.order_items).map(
                  (item: any, idx: number) => (
                    <li key={idx}>{item.product_name}</li>
                  )
                )
              : "-"}
          </ul>
        ),
      },
      {
        key: "item_variant",
        header: "Varian Item",
        cell: (order) => (
          <ul className="list-disc list-inside w-[130px] text-xs text-gray-600 break-words whitespace-normal">
            {safeParseArray(order.order_items)?.length > 0
              ? safeParseArray(order.order_items).map(
                  (item: any, idx: number) => (
                    <li key={idx}>{item.variant_name}</li>
                  )
                )
              : "-"}
          </ul>
        ),
      },
      {
        key: "jumlah",
        header: "Jumlah",
        cellClassName: "text-center text-sm font-medium text-gray-900",
        cell: (order) => (
          <div className="space-y-1">
            {safeParseArray(order.order_items)?.length > 0
              ? safeParseArray(order.order_items).map(
                  (item: any, idx: number) => (
                    <div key={idx}>{item?.qty ?? 0}</div>
                  )
                )
              : "-"}
          </div>
        ),
      },
      {
        key: "deadline",
        header: "Deadline",
        cellClassName: "whitespace-nowrap text-xs text-gray-600 font-medium",
        cell: (order) => formatFullDate(order.deadline),
      },
      {
        key: "totalAmount",
        header: "Total Bayar",
        cellClassName: "whitespace-nowrap text-sm font-bold text-gray-900",
        // cell: (order) => formatCurrency(order.total_amount ?? 0),
        cell: (order) => (
          <div className="px-6 py-4">
            <div className="text-xs font-bold text-gray-900">
              {new Intl.NumberFormat("id-ID").format(order.total_amount)}
            </div>
            {+(order.is_sponsor ?? 0) === 0 && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium mt-1 inline-block ${
                  order.payment_status === "paid"
                    ? "bg-green-100 text-green-700"
                    : order.payment_status === "down_payment"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-600"
                }`}
              >
                {getPaymentStatusLabel(order.payment_status)}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "link",
        header: "Folder",
        cellClassName: "max-w-[220px]",
        cell: (order) =>
          +order?.is_archive !== 1 ? (
            // <div className="flex flex-col gap-2">
            //   {order.driveFolderId ? (
            //     <button
            //       onClick={() => onOpenDrive(order.driveFolderId!)}
            //       className="flex items-center justify-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 hover:bg-yellow-100 whitespace-nowrap"
            //     >
            //       <FolderOpen size={14} /> Buka
            //     </button>
            //   ) : (
            //     <span className="text-xs text-gray-400 italic">-</span>
            //   )}
            // </div>
            // <div className="flex flex-col gap-2">
            //   {order.drive_folder_id ? (
            //     <button
            //       onClick={() => onOpenDrive(order.drive_folder_id!)}
            //       className="flex items-center gap-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 shadow-sm w-fit"
            //     >
            //       <FolderOpen size={10} className="text-yellow-500" /> Buka
            //     </button>
            //   ) : (
            //     "-"
            //   )}
            //   <div className="flex items-center gap-1 group">
            //     <a
            //       href={`/public/drive-link/${order.order_number}`}
            //       className="truncate text-blue-600 hover:underline text-[10px] font-mono w-16"
            //     >
            //       link
            //     </a>
            //     <button
            //       onClick={() =>
            //         copyToClipboard(
            //           "kinau.id/public/drive-link/" + order.order_number
            //         )
            //       }
            //       className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition"
            //     >
            //       <Copy size={10} />
            //     </button>
            //   </div>
            // </div>
            <div className="flex flex-col">
              <div className="flex items-center whitespace-nowrap gap-2">
                <button
                  onClick={() => handleCopyImageQrCode(order)}
                  className="flex items-center gap-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 shadow-sm transition w-fit"
                >
                  <QrCode size={10} /> Salin QR
                </button>

                {/* Aksi 2: Copy Link Publik */}
                <button
                  onClick={() =>
                    copyToClipboard(
                      `kinau.id/public/drive-link/${order.order_number}`
                    )
                  }
                  className="flex items-center gap-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 shadow-sm transition w-fit"
                >
                  <Copy size={10} /> Salin
                </button>
              </div>
              <div className="flex items-center whitespace-nowrap gap-2">
                {/* Aksi 1: Buka Link Publik */}
                <a
                  href={`/public/drive-link/${order.order_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100 shadow-sm transition w-fit"
                >
                  <ExternalLink size={10} /> Buka Link
                </a>
                <button
                  title="Share Link"
                  // Gunakan perbandingan langsung tanpa tanda + jika ID sudah pasti angka/string
                  disabled={isProcessingShare === order.id}
                  onClick={() => handleShare(order)}
                  className={`p-1.5 rounded transition flex items-center justify-center min-w-[32px] ${
                    isProcessingShare === order.id
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                  }`}
                >
                  {isProcessingShare === order.id ? (
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Share2Icon size={16} />
                  )}
                </button>
              </div>
            </div>
          ) : (
            "Arsip"
          ),
      },
      {
        key: "statusPengerjaan",
        header: "Status Produksi",
        cell: (order) => {
          if (order.finishedAt) {
            return (
              <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                <Check size={12} /> Selesai
              </span>
            );
          }

          return (
            <select
              className={`text-xs border rounded py-1 px-2 font-medium ${getStatusColor(
                order.status
              )} cursor-pointer`}
              value={normalizeStatus(order.status)}
              onChange={(e) => onUpdateStatus(order.id, e.target.value as any)}
            >
              {/* fallback default */}
              <option value="" disabled hidden>
                {order.status === "ordered" ? "Ordered" : "Pilih status"}
              </option>

              <option value="pending" className="bg-white text-gray-700">
                Pending
              </option>
              <option value="confirmed" className="bg-white text-blue-700">
                Diproses
              </option>
              <option value="done" className="bg-white text-green-700">
                Selesai
              </option>
            </select>
          );
        },
      },
      {
        key: "statusPembayaran",
        header: "Status Pembayaran",
        cellClassName: "whitespace-nowrap",
        cell: (order) => {
          // =========================
          // PROOF CHECKER
          // =========================
          const hasDpProof =
            Boolean(order?.dp_payment_proof) &&
            isValidUploadedProof(order.dp_payment_proof);

          const hasPaidProof =
            Boolean(order?.payment_proof) &&
            isValidUploadedProof(order.payment_proof);

          // =========================
          // UPLOAD RULES
          // =========================
          const canUploadDp =
            order.payment_status === "down_payment" &&
            !hasDpProof &&
            +order?.is_archive !== 1;

          const canUploadPaid =
            ((order.payment_status === "down_payment" && !hasDpProof) ||
              (hasDpProof && !order?.payment_proof) ||
              (order.payment_status === "paid" && !hasPaidProof) ||
              order?.payment_status === "none" ||
              order?.payment_status === "unpaid") &&
            +order?.is_archive !== 1;

          // =========================
          // MODALS
          // =========================
          const openUploadModal = (source: "down_payment" | "paid") =>
            setModal({
              ...modal,
              open: true,
              type: "upload_payment_proof",
              data: {
                ...order,
                source_upload: source,
              },
            });

          const openViewModal = () =>
            setModal({
              ...modal,
              open: true,
              type: "view_payment_proof",
              data: order,
            });

          // =========================
          // STYLES
          // =========================
          const buttonBase =
            "flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition";

          const activeBtn =
            "bg-white text-gray-600 border-gray-300 hover:bg-gray-50";

          const disabledBtn =
            "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed";

          const successBtn = "bg-green-100 text-green-700 border-green-200";

          return (
            <div className="flex flex-col gap-1.5">
              {/* DP */}
              <button
                disabled={!canUploadDp}
                onClick={() => openUploadModal("down_payment")}
                className={`${buttonBase} ${
                  hasDpProof
                    ? successBtn
                    : canUploadDp
                      ? activeBtn
                      : disabledBtn
                }`}
              >
                {hasDpProof ? <Check size={10} /> : <Upload size={10} />}
                DP
              </button>

              {/* LUNAS */}
              <button
                disabled={!canUploadPaid}
                onClick={() => openUploadModal("paid")}
                className={`${buttonBase} ${
                  hasPaidProof
                    ? successBtn
                    : canUploadPaid
                      ? activeBtn
                      : disabledBtn
                }`}
              >
                {hasPaidProof ? <Check size={10} /> : <Upload size={10} />}
                LUNAS
              </button>

              {/* VIEW PROOF */}
              {(hasDpProof || hasPaidProof) && (
                <button
                  onClick={openViewModal}
                  className="mt-1 text-[10px] text-blue-600 hover:underline flex items-center justify-center gap-1"
                >
                  <Image size={10} />
                  Lihat Bukti
                </button>
              )}
            </div>
          );
        },
      },
      {
        key: "created_by",
        header: "Dibuat Oleh",
        headerClassName: "text-center",
        cellClassName: "text-center",
        cell: (order) => (
          <div className="flex flex-col">
            <p className="text-xs">
              {safeParseObject(order.created_by)?.fullname ?? "-"}
            </p>
            <p className="text-[0.675rem]">
              {/* {moment(order.created_on)
                .locale("id")
                .format("DD MMMM YYYY (HH:mm)")} */}
              {dateFormat(order.created_on, "DD MMM YYYY (HH:mm)")}
            </p>
          </div>
        ),
      },
      {
        key: "aksi",
        header: "Aksi",
        headerClassName: "text-center",
        cellClassName: "text-center",
        cell: (order) => (
          <div className="flex justify-center gap-2 relative">
            {+order?.is_archive !== 1 ? (
              <button
                title="Nota"
                onClick={() =>
                  setModal({
                    ...modal,
                    open: true,
                    type: "view_nota",
                    data: order,
                  })
                }
                className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition"
              >
                <FileText size={16} />
              </button>
            ) : (
              ""
            )}
            {order?.status === "pending" ? (
              <button
                title="Edit"
                onClick={() => navigate(`/app/order-edit/${order.id}`)}
                className="p-1.5 text-orange-500 bg-orange-50 rounded hover:bg-orange-100 transition"
              >
                <Pencil size={16} />
              </button>
            ) : (
              ""
            )}
            <button
              title="Hapus"
              onClick={() => onDelete(order)}
              className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [orders]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* View Toggles */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => {
            setViewMode("reguler");
          }}
          className={`flex-1 py-3 text-sm font-medium text-center ${viewMode === "reguler" ? "bg-gray-50 text-gray-900 border-b-2 border-gray-900" : "text-gray-500 hover:bg-gray-50"}`}
        >
          Pesanan Reguler
        </button>
        <button
          onClick={() => {
            setViewMode("kkn");
          }}
          className={`flex-1 py-3 text-sm font-medium text-center ${viewMode === "kkn" ? "bg-blue-50 text-blue-900 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
        >
          Pesanan Khusus KKN
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 justify-between items-center bg-gray-50">
        <div className="flex gap-4">
          <select
            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={filterYear}
            onChange={(e) => {
              setFilterYear(e.target.value);
            }}
          >
            <option value="">Semua Tahun</option>
            {Array.from(
              { length: new Date().getFullYear() - 2017 + 1 },
              (_, i) => (new Date().getFullYear() - i).toString()
            ).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
            }}
          >
            <option value="created_on:desc">Terbaru</option>
            <option value="created_on:asc">Terlama</option>
            <option value="institution_name:asc">Instansi (A-Z)</option>
            <option value="institution_name:desc">Instansi (Z-A)</option>
            {/* <option value="product">Jenis Produk</option> */}
            <option value="payment_status:desc">Status Bayar (Lunas-DP)</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
          Total: <b>{orders?.data?.total_items || 0}</b> Pesanan
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={orders?.data?.items || []}
        getRowKey={(order, _index) => order.id}
        rowClassName={(order) => (order.finishedAt ? "bg-green-50/30" : "")}
        emptyMessage="Belum ada pesanan di kategori ini."
        minHeight="400px"
      />

      {/* Pagination */}
      <TablePagination
        currentPage={page || orders?.data?.current_page || 1}
        totalPages={orders?.data?.total_pages || 0}
        onPageChange={(page) => {
          setPage(page);
        }}
        className="mt-auto"
      />

      <OrderShareCard order={selectedOrder} qrCodeUrl={tempQr} ref={cardRef} />

      {/* Upload Payment Modal with Bank Selection */}
      {modal?.type === "upload_payment_proof" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-4">Upload Bukti Bayar</h3>
            <form onSubmit={handleSubmitPaymentProof} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tujuan Transfer
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={
                    modal?.data?.payment_detail?.account_id ||
                    modal?.data?.payment_method ||
                    ""
                  }
                  onChange={(e) => {
                    setModal({
                      ...modal,
                      data: {
                        ...modal?.data,
                        ...(+e.target.value > 0
                          ? {
                              payment_method: "manual_transfer",
                              payment_detail: {
                                account_id: e.target.value,
                                account_code: bankList?.data?.items?.find(
                                  (bank: any) => bank.id === +e.target.value
                                )?.code,
                                account_name: bankList?.data?.items?.find(
                                  (bank: any) => bank.id === +e.target.value
                                )?.name,
                                account_number: bankList?.data?.items?.find(
                                  (bank: any) => bank.id === +e.target.value
                                )?.ref_account_number,
                                account_holder: bankList?.data?.items?.find(
                                  (bank: any) => bank.id === +e.target.value
                                )?.ref_account_holder,
                              },
                            }
                          : {
                              payment_method: e.target.value,
                              payment_detail: null,
                            }),
                      },
                    });
                  }}
                  required
                >
                  <option value="">-- Pilih Rekening --</option>
                  {bankList?.data?.items?.map((bank: any) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} - {bank.ref_account_number}-{" "}
                      {bank.ref_account_holder}
                    </option>
                  ))}
                  <option value="manual_transfer">Transfer</option>
                  <option value="cash">Tunai / Cash</option>
                </select>
              </div>

              {/* {modal?.data?.payment_method &&
                modal?.data?.payment_method !== "cash" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Nomor Rekening Pengirim
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                        placeholder="Contoh: 1234567890"
                        value={modal?.data?.ref_account_number || ""}
                        onChange={(e) =>
                          setModal({
                            ...modal,
                            data: {
                              ...modal.data,
                              ref_account_number: e.target.value,
                            },
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Nama Pemilik Rekening
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                        placeholder="Contoh: John Doe"
                        value={modal?.data?.ref_account_holder || ""}
                        onChange={(e) =>
                          setModal({
                            ...modal,
                            data: {
                              ...modal.data,
                              ref_account_holder: e.target.value,
                            },
                          })
                        }
                        required
                      />
                    </div>
                  </>
                )} */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  File Bukti Pembayaran
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadFile(file);
                    if (url) {
                      setModal({
                        ...modal,
                        data: { ...modal.data, file: url },
                      });
                    }
                  }}
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModal({ ...modal, open: false, type: "" })}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 size={16} /> : <Upload size={16} />}{" "}
                  {actionLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal?.type === "view_payment_proof" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in"
          onClick={() => setModal({ ...modal, open: false, type: "" })}
        >
          <div
            className="bg-white rounded-xl p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h3 className="font-bold text-lg text-gray-800">
                Bukti Pembayaran
              </h3>
              <button
                onClick={() => setModal({ ...modal, open: false, type: "" })}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ===================== */}
              {/* PELUNASAN (SINGLE) */}
              {/* ===================== */}
              {modal?.data?.dp_payment_proof && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">
                      Bukti DP
                    </span>
                  </div>

                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    {typeof modal?.data?.dp_payment_proof === "string" &&
                    modal?.data?.dp_payment_proof &&
                    modal?.data?.dp_payment_proof.includes("data.kinau.id") ? (
                      <img
                        src={modal.data.dp_payment_proof}
                        alt="Bukti DP"
                        className="w-full max-h-[320px] object-contain bg-white"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p>Tidak ada Bukti, silahkan unggah kembali</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {modal?.data?.payment_proof && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">
                      Bukti Pelunasan
                    </span>
                  </div>

                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={modal.data.payment_proof}
                      alt="Bukti Pelunasan"
                      className="w-full max-h-[320px] object-contain bg-white"
                    />
                  </div>
                </div>
              )}

              {/* ===================== */}
              {/* DP (MULTIPLE) */}
              {/* ===================== */}
              {/* {safeParseArray(modal?.data?.dp_payment_proofs).map(
                (proof, idx) => (
                  <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                        Bukti DP
                      </span>

                      {proof.proof_date && (
                        <span className="text-[10px] text-gray-400">
                          {new Date(proof.proof_date).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {(proof.proof_method || proof.proof_channel) && (
                      <div className="text-xs text-gray-600 mb-2">
                        {proof.proof_method && (
                          <span>
                            via <b>{proof.proof_method}</b>
                          </span>
                        )}
                        {proof.proof_channel && (
                          <span className="ml-1 text-gray-400">
                            ({proof.proof_channel})
                          </span>
                        )}
                      </div>
                    )}

                    <div className="rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={proof.proof_url}
                        alt={`Bukti DP ${idx + 1}`}
                        className="w-full max-h-[320px] object-contain bg-white"
                      />
                    </div>
                  </div>
                )
              )} */}
            </div>
          </div>
        </div>
      )}
      {modal?.type === "view_nota" && (
        <ModalSecond
          open={modal?.open}
          onClose={() => setModal({ ...modal, open: false })}
          title=""
          size="lg"
        >
          <NotaView
            order={modal?.data}
            isEditable={true}
            onReviewChange={(rating, review) =>
              onUpdateReview(modal?.data.id, rating, review)
            }
            onPaymentProofChange={(proof) =>
              onUpdatePaymentProof(modal?.data.id, proof)
            }
          />
        </ModalSecond>
      )}
    </div>
  );
}

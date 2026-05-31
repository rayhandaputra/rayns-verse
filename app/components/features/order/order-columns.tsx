import React from "react";
import { type ColumnDef } from "~/components/ui/data-table";
import type { Order } from "~/types";
import {
  Check,
  Trash2,
  Copy,
  FileText,
  Handshake,
  Upload,
  Image,
  ExternalLink,
  Share2Icon,
  QrCode,
  Pencil,
  RefreshCw,
} from "lucide-react";
import {
  formatFullDate,
  getWhatsAppLink,
} from "~/constants";
import {
  getPaymentStatusLabel,
  safeParseArray,
  safeParseObject,
} from "~/utils/utils";
import { dateFormat } from "~/utils/dateFormatter";

interface OrderColumnsProps {
  orders: any;
  filterKknInstitution: string;
  handleCopyImageQrCode: (order: Order) => void;
  handleShare: (order: Order) => void;
  isProcessingShare: number | null;
  onDelete: (order: Order) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdateStatusPrinted: (id: string, status: string) => void;
  setModal: (modal: any) => void;
  modal: any;
  navigate: (path: string) => void;
  copyToClipboard: (text: string) => void;
}

const STATUS_OPTIONS = ["pending", "confirmed", "done"] as const;

function normalizeStatus(value?: string | null) {
  return STATUS_OPTIONS.includes(value as any) ? value : "";
}

const isValidUploadedProof = (proof?: unknown) =>
  typeof proof === "string" && proof.includes("data.kinau.id");

const getStatusColor = (status: string) => {
  switch (status) {
    case "done":
      return "bg-green-100 text-green-700 border-green-200";
    case "confirmed":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "in_production":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "pending":
    case "ordered":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export const useOrderColumns = ({
  orders,
  filterKknInstitution,
  handleCopyImageQrCode,
  handleShare,
  isProcessingShare,
  onDelete,
  onUpdateStatus,
  onUpdateStatusPrinted,
  setModal,
  modal,
  navigate,
  copyToClipboard,
}: OrderColumnsProps): ColumnDef<Order>[] => {
  return React.useMemo(
    () => [
      {
        key: "no",
        header: "No",
        headerClassName: "w-[40px] min-w-[40px] max-w-[40px] sticky left-0 z-20 bg-gray-100",
        cellClassName: "bg-white group-hover:bg-gray-50 transition-colors w-[40px] min-w-[40px] max-w-[40px] whitespace-nowrap text-xs text-gray-600 font-medium sticky left-0 z-10",
        cell: (order, index) => {
          const pageNum = orders?.data?.current_page ?? 0;
          const pageSize = 100;
          return pageNum * pageSize + index + 1;
        },
      },
      {
        key: "instansi",
        header: "Instansi/Pemesan",
        headerClassName: "min-w-[260px] sticky left-[40px] z-20 bg-gray-100 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]",
        cellClassName: "min-w-[260px] bg-white group-hover:bg-gray-50 transition-colors sticky left-[40px] z-10 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)]",
        cell: (order) => (
          <div className="py-1">
            <div className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
              {+(order?.is_kkn ?? 0) === 1
                ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="whitespace-nowrap">
                      {order?.kkn_type?.toLowerCase() === "ppm" ? "Kelompok" : "Desa"}{" "}
                      {safeParseObject(order?.kkn_detail)?.value}
                    </span>
                    {!filterKknInstitution && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                        Periode {order.kkn_period}
                      </span>
                    )}
                  </div>
                )
                : (
                  <span className="font-medium text-slate-700 break-words">
                    {order.institution_name}
                  </span>
                )
              }
              {+(order?.is_sponsor ?? 0) === 1 && (
                <span
                  title="Sponsor / Kerja Sama"
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap"
                >
                  <Handshake size={10} className="mr-0.5" /> PARTNER
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {+order?.is_kkn === 1 ? `${order?.institution_name} ${order?.kkn_year} -` : ""} {order.pic_name || "-"}{" "}
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
          </div>
        ),
      },
      {
        key: "jenisPesanan",
        header: "Nama Item",
        cellClassName: "max-w-[140px]",
        cell: (order) => (
          <ul className="list-disc list-inside w-[140px] text-xs text-gray-600 break-words whitespace-normal">
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
          <ul className="list-disc list-inside w-[100px] text-xs text-gray-600 break-words whitespace-normal">
            {safeParseArray(order.order_items)?.length > 0
              ? safeParseArray(order.order_items).map(
                (item: any, idx: number) => (
                  <li key={idx}>{item.variant_name || "Caseless 1 Sisi"}</li>
                )
              )
              : "-"}
          </ul>
        ),
      },
      {
        key: "jumlah",
        header: "Jumlah",
        cellClassName: "text-center text-sm font-medium text-gray-900 w-[80px]",
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
        cellClassName:
          "whitespace-nowrap text-xs text-gray-600 w-[90px] font-medium",
        cell: (order) => formatFullDate(order.deadline),
      },
      {
        key: "totalAmount",
        header: "Total Bayar",
        cellClassName: "whitespace-nowrap text-sm font-bold text-gray-900",
        cell: (order) => {
          // ✅ Use server-computed subtotal (fixes data inefficiency)
          const computedSubtotal = Number(order.computed_items_subtotal) || 0;
          const dAmount = Number(order.discount_value) || 0;
          const subtotal = computedSubtotal > 0 ? computedSubtotal : (Number(order.total_amount) || 0) + dAmount;
          const total = subtotal - dAmount;

          return (
            <div className="px-6 py-4">
              <div className="text-xs font-bold text-gray-900">
                {new Intl.NumberFormat("id-ID").format(total)}
              </div>
              {dAmount > 0 && (
                <div className="text-[10px] text-red-500 font-medium line-through">
                  {new Intl.NumberFormat("id-ID").format(subtotal)}
                </div>
              )}
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium mt-1 inline-block ${order.payment_status === "paid"
                  ? "bg-green-100 text-green-700"
                  : order.payment_status === "down_payment"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-600"
                  }`}
              >
                {getPaymentStatusLabel(order.payment_status)}
              </span>
            </div>
          );
        },
      },
      {
        key: "link",
        header: "Folder",
        cellClassName: "max-w-[220px]",
        cell: (order) =>
          +order?.is_archive !== 1 ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center whitespace-nowrap gap-2">
                <button
                  onClick={() => handleCopyImageQrCode(order)}
                  className="flex items-center gap-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 shadow-sm transition w-fit"
                >
                  <QrCode size={10} /> Salin QR
                </button>

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
                  disabled={isProcessingShare === order.id}
                  onClick={() => handleShare(order)}
                  className={`p-1.5 rounded transition flex items-center justify-center min-w-[32px] ${isProcessingShare === order.id
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
            <span className="text-xs text-gray-500">Arsip</span>
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
          const hasDpProof =
            Boolean(order?.dp_payment_proof) &&
            isValidUploadedProof(order.dp_payment_proof);

          const hasPaidProof =
            Boolean(order?.payment_proof) &&
            isValidUploadedProof(order.payment_proof);

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

          const buttonBase =
            "flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition";
          const activeBtn =
            "bg-white text-gray-600 border-gray-300 hover:bg-gray-50";
          const disabledBtn =
            "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed";
          const successBtn = "bg-green-100 text-green-700 border-green-200";

          return (
            <div className="max-w-[200px]">
              <div className="flex flex-col gap-1.5">
                <button
                  disabled={!canUploadDp}
                  onClick={() => openUploadModal("down_payment")}
                  className={`${buttonBase} ${hasDpProof
                    ? successBtn
                    : canUploadDp
                      ? activeBtn
                      : disabledBtn
                    }`}
                >
                  {hasDpProof ? <Check size={10} /> : <Upload size={10} />}
                  Upload Bukti Bayar (DP)
                </button>

                <button
                  disabled={!canUploadPaid}
                  onClick={() => openUploadModal("paid")}
                  className={`${buttonBase} ${hasPaidProof
                    ? successBtn
                    : canUploadPaid
                      ? activeBtn
                      : disabledBtn
                    }`}
                >
                  {hasPaidProof ? <Check size={10} /> : <Upload size={10} />}
                  Upload Bukti Bayar (LUNAS)
                </button>

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
            </div>
          );
        },
      },
      {
        key: "status_printed",
        header: "Status Cetak",
        headerClassName: "text-center",
        cellClassName: "text-center",
        cell: (order: any) => (
          <div className="px-6 py-4">
            {order.status_printed === "done" ? (
              <div className="flex flex-col gap-1.5">
                <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                  <Check size={10} /> TER-CETAK
                </span>
                <button
                  onClick={() => onUpdateStatusPrinted(order.id, "waiting")}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
                >
                  <RefreshCw size={10} /> Cetak Ulang
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-gray-100 text-gray-400 border border-gray-200">
                Antrean
              </span>
            )}
          </div>
        ),
      },
      {
        key: "created_by",
        header: "Dibuat Oleh",
        headerClassName: "text-center",
        cellClassName: "text-center",
        cell: (order) => (
          <div className="flex justify-center items-center">
            <div className="flex flex-col text-center w-[100px]">
              <p className="text-xs">
                {safeParseObject(order.created_by)?.fullname ?? "-"}
              </p>
              <p className="text-[0.675rem]">
                {dateFormat(order.created_on, "DD MMM YYYY (HH:mm)")}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "aksi",
        header: "Aksi",
        headerClassName: "text-center",
        cellClassName: "text-center",
        cell: (order) => (
          <div className="flex items-center justify-end gap-2">
            <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-slate-100">
              {+order?.is_archive !== 1 && (
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
                  className="p-2 text-slate-500 hover:text-amber-500 hover:bg-white rounded transition-all"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}
              <button
                title="Edit"
                onClick={() => navigate(`/app/order-edit/${order.id}`)}
                className="p-2 text-slate-500 hover:text-blue-500 hover:bg-white rounded transition-all"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                title="Hapus"
                onClick={() => onDelete(order)}
                className="p-2 text-slate-500 hover:text-red-500 hover:bg-white rounded transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ),
      },
    ],
    [
      orders,
      filterKknInstitution,
      handleCopyImageQrCode,
      handleShare,
      isProcessingShare,
      modal,
      navigate,
      onDelete,
      onUpdateStatus,
      onUpdateStatusPrinted,
      setModal,
      copyToClipboard,
    ]
  );
};

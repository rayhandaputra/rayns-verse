import {
  MoreVertical,
  FileText,
  Pencil,
  Trash2,
  Upload,
  Image,
  ExternalLink,
  Check,
  Clock,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { formatFullDate, getWhatsAppLink } from "~/constants";
import {
  getPaymentStatusLabel,
  safeParseArray,
  safeParseObject,
} from "~/utils/utils";

interface OrderMobileCardProps {
  order: any;
  index: number;
  page: number;
  onDelete: (order: any) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onViewNota: (order: any) => void;
  onUploadPayment: (order: any) => void;
  onViewPayment: (order: any) => void;
  navigate: (path: string) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700" },
  confirmed: { label: "Diproses", color: "bg-blue-100 text-blue-700" },
  in_production: { label: "Produksi", color: "bg-yellow-100 text-yellow-700" },
  done: { label: "Selesai", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-600" },
  ordered: { label: "Ordered", color: "bg-gray-100 text-gray-600" },
};

const paymentConfig: Record<string, { label: string; color: string }> = {
  paid: { label: "Lunas", color: "bg-green-100 text-green-700" },
  down_payment: { label: "DP", color: "bg-yellow-100 text-yellow-700" },
  unpaid: { label: "Belum Bayar", color: "bg-red-100 text-red-600" },
  none: { label: "Belum Ada", color: "bg-gray-100 text-gray-500" },
};

export function OrderMobileCard({
  order,
  index,
  page,
  onDelete,
  onUpdateStatus,
  onViewNota,
  onUploadPayment,
  onViewPayment,
  navigate,
}: OrderMobileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const items = safeParseArray(order.order_items);
  const computedSubtotal = Number(order.computed_items_subtotal) || 0;
  const discount = Number(order.discount_value) || 0;
  const subtotal =
    computedSubtotal > 0
      ? computedSubtotal
      : (Number(order.total_amount) || 0) + discount;
  const total = subtotal - discount;

  const status = statusConfig[order.status] || statusConfig.pending;
  const payment = paymentConfig[order.payment_status] || paymentConfig.none;

  const isKkn = +(order?.is_kkn ?? 0) === 1;
  const kknDetail = safeParseObject(order?.kkn_detail);

  const institutionDisplay = isKkn
    ? `${order?.kkn_type?.toLowerCase() === "ppm" ? "Kelompok" : "Desa"} ${(kknDetail as any)?.value || ""}`
    : order.institution_name;

  const hasDpProof =
    Boolean(order?.dp_payment_proof) &&
    order.dp_payment_proof.includes("data.kinau.web.id");
  const hasPaidProof =
    Boolean(order?.payment_proof) &&
    order.payment_proof.includes("data.kinau.web.id");

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-gray-400">
              #{page * 20 + index + 1}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}
            >
              {status.label}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${payment.color}`}
            >
              {payment.label}
            </span>
          </div>
          <h3 className="text-sm font-bold text-gray-900 mt-1 break-words">
            {institutionDisplay}
          </h3>
          {isKkn && (
            <p className="text-[11px] text-blue-600 font-medium mt-0.5">
              {order.institution_name} — Periode {order.kkn_period}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-0.5">
            {order.pic_name || "-"}{" "}
            <a
              href={getWhatsAppLink(
                order.pic_phone || "",
                `Halo ${order.pic_name}`,
              )}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600"
            >
              ({order.pic_phone || "-"})
            </a>
          </p>
        </div>

        {/* 3-dot menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <MoreVertical size={16} className="text-gray-500" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="fixed right-4 mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-44">
                <button
                  onClick={() => {
                    onViewNota(order);
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-gray-50 text-gray-700"
                >
                  <FileText size={14} className="text-amber-500" /> Lihat Nota
                </button>
                <button
                  onClick={() => {
                    navigate(`/app/order-edit/${order.id}`);
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-gray-50 text-gray-700"
                >
                  <Pencil size={14} className="text-blue-500" /> Edit Pesanan
                </button>
                <button
                  onClick={() => {
                    onUploadPayment(order);
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-gray-50 text-gray-700"
                >
                  <Upload size={14} className="text-indigo-500" /> Upload Bukti
                </button>
                {(hasDpProof || hasPaidProof) && (
                  <button
                    onClick={() => {
                      onViewPayment(order);
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-gray-50 text-gray-700"
                  >
                    <Image size={14} className="text-green-500" /> Lihat Bukti
                  </button>
                )}
                <a
                  href={`/public/drive-link/${order.order_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-gray-50 text-gray-700"
                  onClick={() => setMenuOpen(false)}
                >
                  <ExternalLink size={14} className="text-cyan-500" /> Buka
                  Drive
                </a>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => {
                    onDelete(order);
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 hover:bg-red-50 text-red-600"
                >
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card Body — Items & Price */}
      <div className="px-4 pb-3 flex items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Items */}
          <div className="flex flex-wrap gap-1.5">
            {items.length > 0 ? (
              items.slice(0, 3).map((item: any, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded bg-gray-50 border border-gray-100 text-[11px] text-gray-600 font-medium"
                >
                  {item.product_name}{" "}
                  <span className="ml-1 text-gray-400">×{item.qty}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">Belum ada item</span>
            )}
            {items.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-50 border border-gray-100 text-[11px] text-gray-400 font-medium">
                +{items.length - 3} lainnya
              </span>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-gray-900">
            Rp {new Intl.NumberFormat("id-ID").format(total)}
          </p>
          {discount > 0 && (
            <p className="text-[10px] text-red-500 line-through">
              Rp {new Intl.NumberFormat("id-ID").format(subtotal)}
            </p>
          )}
        </div>
      </div>

      {/* Card Footer — Meta */}
      <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatFullDate(order.deadline)}
          </span>
          {order.status_printed === "done" && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <Check size={11} /> Tercetak
            </span>
          )}
        </div>
        {/* Quick status change */}
        <select
          className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white font-medium"
          value={order.status || ""}
          onChange={(e) => onUpdateStatus(order.id, e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Diproses</option>
          <option value="done">Selesai</option>
        </select>
      </div>
    </div>
  );
}

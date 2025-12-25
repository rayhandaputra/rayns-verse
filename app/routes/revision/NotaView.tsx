import React, { useState, useEffect } from "react";
import { Order, AppSettings } from "../types";
import {
  formatCurrency,
  formatFullDate,
  getGoogleMapsLink,
  getWhatsAppLink,
  ADMIN_WA,
} from "../constants";
import {
  MapPin,
  Phone,
  Printer,
  CheckCircle,
  Star,
  Handshake,
  Image,
  X,
  MessageSquare,
} from "lucide-react";
import { loadSettings } from "../services/storage";

interface NotaViewProps {
  order: Order;
  onSaveReview?: (rating: number, review: string) => void;
}

const NotaView: React.FC<NotaViewProps> = ({ order, onSaveReview }) => {
  const [showProofModal, setShowProofModal] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({});

  // Review State
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const total = order.totalAmount;
  const paid = order.dpAmount;
  const remain = Math.max(0, total - paid);
  const isPaidOff = remain === 0;
  const hasProof = order.paymentProofs && order.paymentProofs.length > 0;

  // Determine Label Logic
  const isPerorangan = !order.isKKN && order.instansi === order.pemesanName;

  let headerLabel = "INSTANSI";
  let subLabel = "Pemesan";

  if (order.isKKN) {
    headerLabel = "KELOMPOK";
    subLabel = "Pemesan";
  } else if (isPerorangan) {
    headerLabel = "PEMESAN";
    subLabel = "";
  }

  const handlePrint = () => {
    window.print();
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveReview) {
      onSaveReview(rating, reviewText);
    }
  };

  const PaymentProofModal = () => {
    if (!order.paymentProofs || order.paymentProofs.length === 0) return null;

    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 animate-fade-in no-print"
        onClick={() => setShowProofModal(false)}
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
              onClick={() => setShowProofModal(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.paymentProofs.map((proof, idx) => (
              <div key={idx} className="border rounded-lg p-2 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <div
                    className={`text-xs font-bold px-2 py-0.5 rounded ${proof.type === "DP" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                  >
                    {proof.type === "DP" ? "Bukti DP" : "Bukti Pelunasan"}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {new Date(proof.date).toLocaleString()}
                  </div>
                </div>
                <div className="mb-2 text-xs text-gray-600">
                  {proof.method && (
                    <span>
                      via: <b>{proof.method}</b>
                    </span>
                  )}
                </div>
                <div className="rounded overflow-hidden border border-gray-200">
                  <img
                    src={proof.imageUrl}
                    className="w-full h-auto object-contain max-h-[300px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white p-6 max-w-lg mx-auto font-sans text-gray-800 print-container relative">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center font-bold rounded">
                K
              </div>
              <h1 className="text-xl font-bold tracking-tight">Kinau.id</h1>
            </div>
            <p className="text-xs text-gray-500">Your Custom Specialist</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-400 uppercase tracking-widest">
              NOTA
            </h2>
            <p className="text-xs font-mono text-gray-500">
              #{order.id.slice(-6)}
            </p>
            <p className="text-xs text-gray-500">
              {formatFullDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Customer Details & Status Blocks - With Background Setting */}
        <div
          className="mb-6 p-4 rounded-lg border border-gray-100 print:border-gray-200 relative overflow-hidden"
          style={{
            backgroundColor: settings.headerBackground
              ? "transparent"
              : "#f9fafb",
          }}
        >
          {settings.headerBackground && (
            <div className="absolute inset-0 z-0">
              <img
                src={settings.headerBackground}
                className="w-full h-full object-cover opacity-15 print:opacity-10"
              />
              <div className="absolute inset-0 bg-white/50"></div>
            </div>
          )}

          <div className="relative z-10">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
              {headerLabel}
            </h3>
            <p className="font-bold text-lg leading-tight">{order.instansi}</p>

            {order.isKKN && order.kknDetails && (
              <p className="text-xs text-blue-600 mt-1 font-medium bg-blue-50 w-fit px-2 py-0.5 rounded print:text-gray-600 print:bg-transparent print:p-0">
                KKN ITERA {order.kknDetails.tahun} - Periode{" "}
                {order.kknDetails.periode}
              </p>
            )}

            <div className="mt-2 text-sm text-gray-600">
              {isPerorangan ? (
                // Perorangan: Just Phone
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-500">No. WA:</span>
                  <span>{order.pemesanPhone}</span>
                </div>
              ) : (
                // Reguler/KKN: Pemesan Name + Phone
                <>
                  <div className="font-medium text-gray-500 text-xs uppercase mb-0.5">
                    {subLabel}
                  </div>
                  <div>
                    {order.pemesanName}{" "}
                    <span className="text-gray-400">
                      ({order.pemesanPhone})
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200/50 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-gray-400 text-xs mb-1">
                  Status Produksi
                </span>
                <span className="font-bold text-sm capitalize bg-gray-200 px-2 py-1 rounded print:bg-transparent print:p-0 print:border print:border-gray-300">
                  {order.statusPengerjaan}
                </span>
              </div>
              <div>
                <span className="block text-gray-400 text-xs mb-1">
                  Status Pembayaran
                </span>
                <div className="flex flex-col items-start">
                  <span
                    className={`font-bold text-sm px-2 py-1 rounded print:bg-transparent print:p-0 print:text-black print:border print:border-gray-300 ${
                      order.statusPembayaran === "Lunas"
                        ? "bg-green-100 text-green-700"
                        : order.statusPembayaran === "DP"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {order.statusPembayaran === "Tidak Ada"
                      ? "BELUM BAYAR"
                      : order.statusPembayaran === "Lunas"
                        ? "LUNAS"
                        : "DP (BELUM LUNAS)"}
                  </span>
                  {hasProof && (
                    <span className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                      <CheckCircle size={10} className="text-green-500" /> Bukti
                      Uploaded
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs pt-2 border-t border-gray-200/50">
              <span className="text-gray-400 mr-2">Deadline:</span>
              <span className="font-semibold text-red-600 print:text-black">
                {formatFullDate(order.deadline)}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-2 font-semibold text-gray-600">
                  Produk
                </th>
                <th className="text-right py-2 font-semibold text-gray-600">
                  Qty
                </th>
                <th className="text-right py-2 font-semibold text-gray-600">
                  Harga
                </th>
                <th className="text-right py-2 font-semibold text-gray-600">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* V5 Multi-Items Support */}
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 font-medium">
                      {item.productName}
                      {item.variationName && (
                        <span className="font-normal text-gray-600">
                          {" "}
                          ({item.variationName})
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-500">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))
              ) : (
                /* Fallback for Legacy Data */
                <tr>
                  <td className="py-3">
                    <div className="font-medium">{order.jenisPesanan}</div>
                    {order.customItems && order.customItems.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {order.customItems.map((item, i) => (
                          <div key={i}>
                            + {item.name} ({item.quantity} pcs)
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-right">{order.jumlah}</td>
                  <td className="py-3 text-right">
                    {formatCurrency(order.unitPrice)}
                  </td>
                  <td className="py-3 text-right font-medium">
                    {formatCurrency(order.totalAmount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals & Discounts */}
        <div className="flex justify-end mb-8">
          <div className="w-3/5 space-y-2">
            {/* Subtotals for discounts */}
            {order.discount && (
              <div className="flex justify-between text-sm text-green-600 print:text-black">
                <span>
                  Diskon{" "}
                  {order.discount.type === "percent"
                    ? `(${order.discount.value}%)`
                    : ""}
                </span>
                <span>
                  -{" "}
                  {formatCurrency(
                    order.discount.type === "nominal"
                      ? order.discount.value
                      : (order.totalAmount / (1 - order.discount.value / 100)) *
                          (order.discount.value / 100) // approx reverse calc
                  )}
                </span>
              </div>
            )}

            {order.isSponsor && (
              <div className="flex justify-between text-sm text-purple-600 font-bold bg-purple-50 p-2 rounded print:bg-transparent print:text-black print:p-0">
                <span className="flex items-center gap-1">
                  <Handshake size={14} /> SPONSORSHIP / PARTNER
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500">Total Tagihan</span>
              <span className="font-bold">{formatCurrency(total)}</span>
            </div>

            {/* Always show payment status, even for sponsors as they might pay partial */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sudah Bayar (DP)</span>
              <span className="font-medium text-green-600 print:text-black">
                {formatCurrency(paid)}
              </span>
            </div>
            <div className="flex justify-between text-base border-t border-gray-200 pt-2">
              <span className="font-bold">Sisa Pembayaran</span>
              <span
                className={`font-bold ${isPaidOff ? "text-green-600" : "text-red-600"} print:text-black`}
              >
                {formatCurrency(remain)}
              </span>
            </div>

            {isPaidOff && (
              <div className="flex items-center justify-end gap-1 text-xs text-green-600 font-bold uppercase mt-1 print:text-black">
                <CheckCircle size={12} /> Lunas
              </div>
            )}
          </div>
        </div>

        {/* Review Section */}
        {order.review ? (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg print:bg-white print:border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
              Ulasan Pelanggan
            </h3>
            <div className="flex text-yellow-400 mb-1 print:text-black">
              {Array.from({ length: order.rating || 5 }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <p className="text-sm italic text-gray-700">"{order.review}"</p>
          </div>
        ) : (
          /* Input Form for Customer (Only shows if onSaveReview prop is present) */
          onSaveReview && (
            <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm no-print">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                <MessageSquare size={16} /> Berikan Ulasan
              </h3>
              <form onSubmit={handleReviewSubmit}>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    >
                      <Star size={24} />
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                  rows={3}
                  placeholder="Bagaimana hasil produksi kami? Tulis ulasan Anda disini..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                >
                  Kirim Ulasan
                </button>
              </form>
            </div>
          )
        )}

        {/* Action Buttons (Hidden on Print) */}
        <div className="grid grid-cols-2 gap-3 mb-4 no-print">
          <a
            href={getGoogleMapsLink()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <MapPin size={14} className="text-red-500" /> Lokasi Pengambilan
          </a>
          <a
            href={getWhatsAppLink(
              ADMIN_WA,
              `Halo Admin, saya ingin konfirmasi pesanan #${order.id.slice(-4)} (${order.instansi})`
            )}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Phone size={14} className="text-green-500" /> Hubungi Admin
          </a>
        </div>

        {/* Print & View Proof Row */}
        <div className="grid grid-cols-2 gap-3 mb-4 no-print">
          {hasProof ? (
            <button
              type="button"
              onClick={() => setShowProofModal(true)}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100"
            >
              <Image size={14} /> Lihat Bukti Pembayaran
            </button>
          ) : (
            <div className="flex items-center justify-center py-2 px-3 bg-gray-50 text-gray-400 border border-gray-200 rounded-lg text-xs font-medium cursor-not-allowed">
              <Image size={14} className="mr-2" /> Belum ada bukti
            </div>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800"
          >
            <Printer size={14} /> Cetak Nota
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-gray-400 mt-6 pt-4 border-t border-gray-100">
          <p>Kinau.id Production</p>
          <p>Terima kasih atas kepercayaan Anda.</p>
        </div>

        <style>{`
        @media print {
            @page {
                size: A5 portrait;
                margin: 0;
            }
            body {
                background: white;
                margin: 0;
            }
            .print-container {
                width: 148mm;
                min-height: 210mm;
                padding: 10mm;
                margin: 0;
                box-shadow: none !important;
                border: none !important;
            }
            .no-print { display: none !important; }
            .bg-gray-50 { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
      </div>

      {showProofModal && <PaymentProofModal />}
    </>
  );
};

export default NotaView;

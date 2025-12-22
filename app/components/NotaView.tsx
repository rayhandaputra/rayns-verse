import React, { useEffect, useRef, useState } from "react";
import type { Order } from "../types";
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
  UploadCloud,
  Printer,
  CheckCircle,
  Star,
} from "lucide-react";
import {
  getOrderStatusLabel,
  getPaymentStatusLabel,
  safeParseArray,
  uploadFile,
} from "~/lib/utils";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface NotaViewProps {
  order: Order;
  onReviewChange?: (rating: number, review: string) => void;
  onPaymentProofChange?: (proof: string) => void;
  isEditable?: boolean;
}

const NotaView: React.FC<NotaViewProps> = ({
  order,
  onReviewChange,
  isEditable = false,
  onPaymentProofChange,
}) => {
  const [rating, setRating] = React.useState(order.rating || 0);
  const [review, setReview] = React.useState(order.review || "");

  const [paymentProof, setPaymentProof] = React.useState(
    order.payment_proof || ""
  );

  const [PrintButton, setPrintButton] =
    useState<React.ComponentType<any> | null>(null);
  const [client, setClient] = useState<boolean>(false);

  useEffect(() => {
    setClient(true);
  }, []);

  useEffect(() => {
    if (!client) return;
    import("~/components/PrintButton.client").then((mod) =>
      setPrintButton(() => mod.PrintButton)
    );
  }, [client]);

  const total = order?.total_amount;
  const paid = order?.dp_amount;
  const remain = Math.max(0, total - paid);
  const isPaidOff = remain === 0;

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    onReviewChange?.(newRating, review);
  };

  const handleReviewChange = (newReview: string) => {
    setReview(newReview);
    onReviewChange?.(rating, newReview);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    // BELUM ADA BUKTI BAYAR → BUKA FILE PICKER
    if (!paymentProof) {
      fileInputRef.current?.click();
      return;
    }

    // SUDAH ADA → BUKA FILE DI TAB BARU
    window.open(paymentProof, "_blank");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: handle upload file ke server
    const url = await uploadFile(file);
    onPaymentProofChange?.(url);
    setPaymentProof(url);
  };

  return (
    <div className="bg-white p-6 max-w-lg mx-auto font-sans text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <img
              src="/kinau-logo.png"
              onClick={() => (window.location.href = "/")}
              alt="Kinau"
              className="w-24 opacity-80 cursor-pointer"
            />
          </div>
          <p className="text-xs text-gray-500">Your Custom Specialist</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-gray-400 uppercase tracking-widest">
            NOTA
          </h2>
          <p className="text-xs font-mono text-gray-500">
            {/* #{order?.id.slice(-6)} */}#{order?.order_number}
          </p>
          <p className="text-xs text-gray-500">
            {formatFullDate(order?.created_on)}
          </p>
        </div>
      </div>

      {/* Customer Details */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
          Pemesan
        </h3>
        <p className="font-bold text-lg leading-tight">
          {order.institution_name}
        </p>
        {order.pic_name && (
          <p className="text-sm text-gray-600 mt-1">
            PJ: {order.pic_name} ({order.pic_phone})
          </p>
        )}
        <div className="mt-3 flex gap-4 text-xs">
          <div>
            <span className="block text-gray-400">Deadline</span>
            <span className="font-semibold text-red-600">
              {formatFullDate(order.deadline)}
            </span>
          </div>
          <div>
            <span className="block text-gray-400">Status Produksi</span>
            <span className="font-semibold capitalize">
              {getOrderStatusLabel(order.status)}
            </span>
          </div>
          <div>
            <span className="block text-gray-400">Status Pembayaran</span>
            <span
              className={`font-semibold capitalize ${order.payment_status === "paid" ? "text-green-600" : "text-gray-600"}`}
            >
              {getPaymentStatusLabel(order.payment_status)}
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
            {safeParseArray(order?.order_items)?.map((item: any) => (
              <tr>
                <td className="py-3">
                  <div className="font-medium flex flex-col">
                    <span>{item.product_name}</span>

                    {item.variant_name && (
                      <span className="text-gray-500 font-normal text-xs">
                        ({item.variant_name})
                      </span>
                    )}

                    {item.variant_price && item.variant_price > 0 && (
                      <span className="text-xs text-emerald-600 font-medium">
                        + {formatCurrency(item.variant_price)} / pcs
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-3 text-right">{item.qty}</td>
                <td className="py-3 text-right">
                  {/* {formatCurrency(item.unit_price)} */}
                  {formatCurrency(item?.price_rule_value ?? 0)}
                </td>
                <td className="py-3 text-right font-medium">
                  {/* {formatCurrency(item.subtotal)} */}
                  {formatCurrency(item?.variant_final_price ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-1/2 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Tagihan</span>
            <span className="font-bold">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Sudah Bayar (DP)</span>
            <span className="font-medium text-green-600">
              {formatCurrency(paid)}
            </span>
          </div>
          <div className="flex justify-between text-base border-t border-gray-200 pt-2">
            <span className="font-bold">Sisa Pembayaran</span>
            <span
              className={`font-bold ${isPaidOff ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(remain)}
            </span>
          </div>
          {isPaidOff && (
            <div className="flex items-center justify-end gap-1 text-xs text-green-600 font-bold uppercase mt-1">
              <CheckCircle size={12} /> Lunas
            </div>
          )}
        </div>
      </div>

      {/* Review Section (Shown on Nota) */}
      {/* Review Section (Editable if isEditable) */}
      <div
        className={`mb-6 p-4 border rounded-lg ${isEditable ? "bg-blue-50 border-blue-200" : "bg-yellow-50 border-yellow-100"}`}
      >
        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
          {isEditable ? "✨ Berikan Ulasan Kamu" : "Ulasan Pelanggan"}
        </h3>

        {/* Rating Stars */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 block mb-2">
            Rating:
          </label>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                // onClick={() => isEditable && handleRatingChange(i + 1)}
                onClick={() => isEditable && setRating(i + 1)}
                disabled={!isEditable}
                className={`transition ${
                  i < rating ? "text-yellow-400" : "text-gray-300"
                } ${isEditable ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
              >
                <Star size={24} fill={i < rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>

        {/* Review Text */}
        {isEditable ? (
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            // onBlur={() => onReviewChange?.(rating, review)}
            placeholder="Tulis ulasan Anda tentang produk kami..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            rows={4}
            maxLength={500}
          />
        ) : review ? (
          <p className="text-sm italic text-gray-700">"{review}"</p>
        ) : (
          <p className="text-xs text-gray-400 italic">Belum ada ulasan</p>
        )}

        <div className="flex justify-between items-center gap-2">
          {isEditable && (
            <div className="text-xs text-gray-500 mt-2">
              {review.length}/500 karakter
            </div>
          )}
          <Button
            onClick={() => onReviewChange?.(rating, review)}
            disabled={!isEditable}
            size="sm"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Kirim
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
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
            `Halo Admin, saya ingin konfirmasi pesanan #${order?.id.slice(-4)} (${order.instansi})`
          )}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Phone size={14} className="text-green-500" /> Hubungi Admin
        </a>

        <>
          {PrintButton ? (
            <PrintButton>
              {({ handlePrint }: any) => (
                <button
                  // onClick={() => window.print()}
                  onClick={async () => {
                    try {
                      // 2️⃣ Siapkan QR Code
                      // const qrContent = `https://kinau.id/track/${row.order_number}`;
                      // const qrUrl = await import("qrcode").then((qr) =>
                      //   qr.default.toDataURL(qrContent, {
                      //     width: 200,
                      //     margin: 1,
                      //   })
                      // );

                      // 3️⃣ Kirim data ke print
                      handlePrint({
                        order: order,
                        items: safeParseArray(order.order_items),
                        // qrCodeUrl: qrUrl,
                      });
                    } catch (err) {
                      console.error("Gagal print nota:", err);
                      toast.error("Gagal memuat data nota.");
                    }
                  }}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800"
                >
                  <Printer size={14} /> Cetak Nota
                </button>
              )}
            </PrintButton>
          ) : (
            <button
              disabled
              className="bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed"
            >
              Loading Print...
            </button>
          )}
        </>
        <>
          <button
            type="button"
            onClick={handleClick}
            className="flex items-center justify-center gap-2 py-2 px-3
                   bg-blue-50 text-blue-700 border border-blue-200
                   rounded-lg text-xs font-semibold hover:bg-blue-100"
          >
            <UploadCloud size={14} />
            {!paymentProof ? "Unggah" : "Lihat"} Bukti Bayar
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
        {/* <button
          onClick={() =>
            alert(
              "Fitur upload bukti bayar akan tersedia di update berikutnya."
            )
          }
          className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100"
        >
          <UploadCloud size={14} /> Bukti Bayar
        </button> */}
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-400 mt-6 pt-4 border-t border-gray-100">
        <p>Kinau.id Production • Lampung</p>
        <p>Terima kasih atas kepercayaan Anda.</p>
      </div>

      <style>{`
        @media print {
            .no-print { display: none; }
            body { background: white; }
            .bg-gray-50 { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default NotaView;

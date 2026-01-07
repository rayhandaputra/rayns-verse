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
  getOrderStatusLabel,
  getPaymentStatusLabel,
  safeParseArray,
  safeParseObject,
  uploadFile,
} from "~/lib/utils";
import { nexus } from "~/lib/nexus-client";
import { useFetcherData } from "~/hooks";
import {
  MapPin,
  Phone,
  UploadCloud,
  Printer,
  CheckCircle,
  Star,
  X,
  EyeIcon,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
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
  const [proofModalOpen, setProofModalOpen] = React.useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = React.useState(false);
  // const [modal, setModal] = useModal();

  const [paymentProof, setPaymentProof] = React.useState(
    order.payment_proof || ""
  );

  const [PrintButton, setPrintButton] =
    useState<React.ComponentType<any> | null>(null);
  const [client, setClient] = useState<boolean>(false);

  // Fetch header background from CMS
  const { data: cmsContentData } = useFetcherData({
    endpoint: nexus()
      .module("CMS_CONTENT")
      .action("get")
      .params({
        pagination: "true",
        type: "hero-section",
        page: 0,
        size: 1,
      })
      .build(),
  });

  const headerBackground =
    (safeParseArray(
      cmsContentData?.data?.items?.[0]?.image_gallery
    )?.[0] as string) || "";

  useEffect(() => {
    setClient(true);
  }, []);

  useEffect(() => {
    if (!client) return;
    import("~/components/PrintButton.client").then((mod) =>
      setPrintButton(() => mod.PrintButton)
    );
  }, [client]);

  const total = order?.total_amount || 0;
  const paid = order?.dp_amount || 0;
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

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText("90360019583");
      setCopiedToClipboard(true);
      toast.success("Nomor rekening berhasil disalin!");
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      toast.error("Gagal menyalin nomor rekening");
    }
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Cek lebar layar atau user agent
    const checkMobile = () => {
      const userAgent =
        typeof window.navigator === "undefined" ? "" : navigator.userAgent;
      const mobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      setIsMobile(mobile || window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <div className="bg-white p-6 max-w-lg mx-auto font-sans text-gray-800 print-container relative">
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
              #{order?.order_number || order?.id.slice(-6)}
            </p>
            <p className="text-xs text-gray-500">
              {formatFullDate(order?.created_on || order?.createdAt || "")}
            </p>
          </div>
        </div>

        {/* Customer Details & Status Blocks - With Background Setting */}
        <div
          className="mb-6 p-4 rounded-lg border border-gray-100 print:border-gray-200 relative overflow-hidden"
          style={{
            backgroundColor: headerBackground ? "transparent" : "#f9fafb",
          }}
        >
          {headerBackground && (
            <div className="absolute inset-0 z-0">
              <img
                src={headerBackground}
                className="w-full h-full object-cover opacity-15 print:opacity-10"
                alt="Background"
              />
              <div className="absolute inset-0 bg-white/50"></div>
            </div>
          )}

          <div className="relative z-10">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
              Pemesan
            </h3>
            <p className="font-bold text-lg leading-tight">
              {+order?.is_kkn !== 1
                ? order.institution_name
                : `${order?.kkn_type?.toLowerCase() === "ppm" ? `Kelompok ${safeParseObject(order?.kkn_detail)?.value}` : `Desa ${safeParseObject(order?.kkn_detail)?.value}`}`}
            </p>
            {order.pic_name && (
              <p className="text-sm text-gray-600 mt-1">
                PJ: {order.pic_name} ({order.pic_phone})
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200/50 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-gray-400 text-xs mb-1">
                  Status Produksi
                </span>
                <span
                  className={`font-bold text-sm capitalize ${order?.status === "confirmed" ? "bg-blue-500 text-white" : order?.status === "pending" ? "bg-yellow-500 text-white" : order?.status === "done" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"} px-2 py-1 rounded print:bg-transparent print:p-0 print:border print:border-gray-300`}
                >
                  {getOrderStatusLabel(
                    order.status || order.statusPengerjaan || ""
                  )}
                </span>
              </div>
              <div>
                <span className="block text-gray-400 text-xs mb-1">
                  Status Pembayaran
                </span>
                <div className="flex flex-col items-start">
                  <span
                    className={`font-bold text-sm px-2 py-1 rounded print:bg-transparent print:p-0 print:text-black print:border print:border-gray-300 ${
                      order.payment_status === "paid"
                        ? "bg-green-100 text-green-700"
                        : order.payment_status === "down_payment"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {getPaymentStatusLabel(order.payment_status || "")}
                  </span>
                  {(order.dp_payment_proof || order.payment_proof) && (
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

                      {/* {item.variant_price && item.variant_price > 0 && (
                      <span className="text-xs text-emerald-600 font-medium">
                        + {formatCurrency(item.variant_price)} / pcs
                      </span>
                    )} */}
                    </div>
                  </td>

                  <td className="py-3 text-right">{item.qty}</td>
                  <td className="py-3 text-right">
                    {/* {formatCurrency(item.unit_price)} */}
                    {formatCurrency(
                      +(item?.price_rule_value ?? 0) +
                        +(item?.variant_price ?? 0)
                    )}
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
          <div className="w-3/5 space-y-2">
            <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
              <span className="text-gray-500">Total Tagihan</span>
              <span className="font-bold">{formatCurrency(total || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sudah Bayar (DP)</span>
              <span className="font-medium text-green-600 print:text-black">
                {formatCurrency(paid || 0)}
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

        {/* Payment Information */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-xs font-bold text-blue-700 uppercase mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600 rounded"></span>
            Informasi Pembayaran
          </h3>
          <div className="bg-white p-3 rounded border border-blue-100">
            <p className="text-sm font-semibold text-gray-800 mb-2">
              Jenius (Bank SMBC Indonesia)
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-mono font-bold text-gray-900">
                90360019583
              </p>
              <button
                type="button"
                onClick={handleCopyAccountNumber}
                className="flex items-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors no-print"
              >
                {copiedToClipboard ? (
                  <>
                    <Check size={14} /> Disalin
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Salin
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">a.n Rizki Naufal</p>
          </div>
        </div>

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
              `Halo Admin, saya ingin konfirmasi pesanan #${order?.id.slice(-4)} (${order.institution_name || order.instansi})`
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
          {order?.dp_payment_proof || order?.payment_proof ? (
            <button
              type="button"
              onClick={() => setProofModalOpen(true)}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100"
            >
              <EyeIcon size={14} /> Lihat Bukti Pembayaran
            </button>
          ) : (
            <div className="flex items-center justify-center py-2 px-3 bg-gray-50 text-gray-400 border border-gray-200 rounded-lg text-xs font-medium cursor-not-allowed">
              <EyeIcon size={14} className="mr-2" /> Belum ada bukti
            </div>
          )}

          {/* {PrintButton ? (
            <PrintButton>
              {({ handlePrint }: any) => (
                <button
                  onClick={async () => {
                    try {
                      handlePrint({
                        order: order,
                        items: safeParseArray(order.order_items),
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
              className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-300 text-gray-600 rounded-lg text-xs font-semibold cursor-not-allowed"
            >
              <Printer size={14} /> Loading Print...
            </button>
          )}
          <a
            href={`/app/orders/${order.id}/download`}
            target="_blank" // Membuka di tab baru (opsional)
            rel="noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-black font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Nota (PDF)
          </a> */}
          {isMobile ? (
            /* TAMPILAN UNTUK MOBILE (Direct Download) */
            <a
              href={`/app/orders/${order.id}/download`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors"
            >
              <Printer size={14} />
              <span>Cetak Nota</span>
            </a>
          ) : /* TAMPILAN UNTUK DESKTOP (Print Preview Browser) */
          PrintButton ? (
            <PrintButton>
              {({ handlePrint }: any) => (
                <button
                  onClick={async () => {
                    try {
                      handlePrint({
                        order: order,
                        items: safeParseArray(order.order_items),
                      });
                    } catch (err) {
                      console.error("Gagal print nota:", err);
                      toast.error("Gagal memuat data nota.");
                    }
                  }}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors"
                >
                  <Printer size={14} />
                  <span>Cetak Nota</span>
                </button>
              )}
            </PrintButton>
          ) : (
            /* LOADING STATE */
            <button
              disabled
              className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-300 text-gray-600 rounded-lg text-xs font-semibold cursor-not-allowed"
            >
              <Printer size={14} />
              <span>Loading Print...</span>
            </button>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Review Section (Editable if isEditable) */}
        {isEditable ? (
          <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm no-print">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
              <MessageSquare size={16} /> Berikan Ulasan
            </h3>
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-600 block mb-2">
                Rating:
              </label>
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setRating(i + 1)}
                    className={`transition ${
                      i < rating ? "text-yellow-400" : "text-gray-300"
                    } cursor-pointer hover:scale-110`}
                  >
                    <Star
                      size={24}
                      fill={i < rating ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Bagaimana hasil produksi kami? Tulis ulasan Anda disini..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none mb-3"
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-between items-center gap-2">
              <div className="text-xs text-gray-500">
                {review.length}/500 karakter
              </div>
              <Button
                onClick={() => onReviewChange?.(rating, review)}
                size="sm"
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Kirim Ulasan
              </Button>
            </div>
          </div>
        ) : review ? (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg print:bg-white print:border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
              Ulasan Pelanggan
            </h3>
            <div className="flex text-yellow-400 mb-1 print:text-black">
              {Array.from({ length: rating || 5 }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <p className="text-sm italic text-gray-700">"{review}"</p>
          </div>
        ) : null}

        {/* Footer */}
        <div className="text-center text-[10px] text-gray-400 mt-6 pt-4 border-t border-gray-100">
          <p>Kinau.id Production</p>
          <p>Terima kasih atas kepercayaan Anda.</p>
        </div>

        {/* <style>{`
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
      `}</style> */}
      </div>

      {proofModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 animate-fade-in no-print"
          onClick={() => setProofModalOpen(false)}
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
                onClick={() => setProofModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order?.dp_payment_proof && (
                <div className="border rounded-lg p-2 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                      Bukti DP
                    </div>
                  </div>
                  <div className="rounded overflow-hidden border border-gray-200">
                    <img
                      src={order?.dp_payment_proof}
                      alt="Bukti DP"
                      className="w-full h-auto object-contain max-h-[300px]"
                    />
                  </div>
                </div>
              )}

              {order?.payment_proof && (
                <div className="border rounded-lg p-2 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">
                      Bukti Pelunasan
                    </div>
                  </div>
                  <div className="rounded overflow-hidden border border-gray-200">
                    <img
                      src={order?.payment_proof}
                      alt="Bukti Pelunasan"
                      className="w-full h-auto object-contain max-h-[300px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotaView;

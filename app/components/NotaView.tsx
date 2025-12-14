import React from "react";
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

interface NotaViewProps {
  order: Order;
}

const NotaView: React.FC<NotaViewProps> = ({ order }) => {
  const total = order.totalAmount;
  const paid = order.dpAmount;
  const remain = Math.max(0, total - paid);
  const isPaidOff = remain === 0;

  return (
    <div className="bg-white p-6 max-w-lg mx-auto font-sans text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center font-bold rounded">
              K
            </div>
            <h1 className="text-xl font-bold tracking-tight">Kinau.id</h1>
          </div>
          <p className="text-xs text-gray-500">Percetakan ID Card & Lanyard</p>
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

      {/* Customer Details */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
          Pemesan
        </h3>
        <p className="font-bold text-lg leading-tight">{order.instansi}</p>
        {order.pjName && (
          <p className="text-sm text-gray-600 mt-1">
            PJ: {order.pjName} ({order.pjPhone})
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
              {order.statusPengerjaan}
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
                Deskripsi
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
      {order.review && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">
            Ulasan Pelanggan
          </h3>
          <div className="flex text-yellow-400 mb-1">
            {Array.from({ length: order.rating || 5 }).map((_, i) => (
              <Star key={i} size={14} fill="currentColor" />
            ))}
          </div>
          <p className="text-sm italic text-gray-700">"{order.review}"</p>
        </div>
      )}

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
            `Halo Admin, saya ingin konfirmasi pesanan #${order.id.slice(-4)} (${order.instansi})`
          )}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Phone size={14} className="text-green-500" /> Hubungi Admin
        </a>
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800"
        >
          <Printer size={14} /> Cetak Nota
        </button>
        <button
          onClick={() =>
            alert(
              "Fitur upload bukti bayar akan tersedia di update berikutnya."
            )
          }
          className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100"
        >
          <UploadCloud size={14} /> Bukti Bayar
        </button>
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

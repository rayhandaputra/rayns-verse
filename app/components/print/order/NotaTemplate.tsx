import React from "react";
// import { formatCurrency, formatFullDate } from "../constants"; // Pastikan path benar
import { CheckCircle } from "lucide-react";
import { ADMIN_WA, formatCurrency, formatFullDate } from "~/constants";
import { getOrderStatusLabel, getPaymentStatusLabel } from "~/lib/utils";

interface PrintNotaTemplateProps {
  order: any;
  items: any[];
}

export const PrintNotaTemplate = React.forwardRef<
  HTMLDivElement,
  PrintNotaTemplateProps
>(({ order, items }, ref) => {
  const total = order?.total_amount || 0;
  const paid = order?.dp_amount || 0;
  const remain = Math.max(0, total - paid);
  const isPaidOff = remain === 0;

  return (
    <div
      ref={ref}
      className="p-8 bg-white text-gray-800 font-sans w-full max-w-[210mm] mx-auto min-h-[297mm] flex flex-col"
    >
      {/* Content Wrapper */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img src="/kinau-logo.png" alt="Kinau" className="w-28" />
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Your Custom Specialist
            </p>
            <p className="text-[10px] text-gray-400">
              Kinau.id Production • Lampung
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
              NOTA PESANAN
            </h2>
            <p className="text-sm font-mono text-gray-600 font-bold">
              #{order?.order_number}
            </p>
            <p className="text-xs text-gray-500">
              Tanggal: {formatFullDate(order?.created_on)}
            </p>
          </div>
        </div>

        {/* Info Pelanggan & Deadline */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-1">
              Penerima
            </h3>
            <p className="font-bold text-lg text-gray-900 leading-tight">
              {order?.institution_name}
            </p>
            {order?.pic_name && (
              <p className="text-sm text-gray-600">
                PJ: {order?.pic_name} ({order?.pic_phone})
              </p>
            )}
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Deadline
                </h3>
                <p className="font-bold text-sm text-red-600">
                  {formatFullDate(order?.deadline)}
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Status
                </h3>
                <span className="text-xs font-bold px-2 py-1 bg-gray-200 rounded uppercase">
                  {getOrderStatusLabel(order?.status ?? "none")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Items */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-3 text-xs font-bold uppercase text-gray-600">
                Deskripsi Produk
              </th>
              <th className="text-right py-3 text-xs font-bold uppercase text-gray-600 w-20">
                Qty
              </th>
              <th className="text-right py-3 text-xs font-bold uppercase text-gray-600 w-32">
                Harga
              </th>
              <th className="text-right py-3 text-xs font-bold uppercase text-gray-600 w-32">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items?.map((item, idx) => (
              <tr key={idx} className="break-inside-avoid">
                <td className="py-4">
                  {/* <div className="font-bold text-gray-900">
                  {item.product_name}
                </div>
                {item.notes && (
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {item.notes}
                  </div>
                )} */}
                  {item.product_name}
                  {item.variant_name && (
                    <span className="text-blue-600">
                      {" "}
                      ({item.variant_name})
                    </span>
                  )}
                  {/* (x{item.qty}) */}
                </td>
                <td className="py-4 text-right text-sm">{item.qty}</td>
                <td className="py-4 text-right text-sm">
                  {formatCurrency(item.price_rule_value)}
                </td>
                <td className="py-4 text-right font-bold text-sm">
                  {formatCurrency(item.variant_final_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Ringkasan Biaya */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Tagihan</span>
              <span className="font-bold">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Uang Muka (DP)</span>
              <span className="font-medium text-green-600">
                {formatCurrency(paid)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-800 pt-2">
              <span className="font-black text-gray-900">SISA BAYAR</span>
              <span
                className={`font-black ${isPaidOff ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(remain)}
              </span>
            </div>
            {isPaidOff && (
              <div className="flex items-center justify-end gap-1 text-[10px] text-green-600 font-black uppercase tracking-wider">
                <CheckCircle
                  size={14}
                  fill="currentColor"
                  className="text-white"
                />
                PESANAN LUNAS
              </div>
            )}
          </div>
        </div>

        {/* Footer Cetak */}
        <div className="mt-16 pt-8 border-t border-dashed border-gray-200 flex justify-between items-end">
          <div>
            <p className="text-xs">
              Link akses bukti pesanan:{" "}
              <span className="text-blue-600">
                kinau.id/public/drive-link/{order?.order_number}
              </span>
            </p>

            <div className="text-[10px] text-gray-400 leading-relaxed">
              <p className="font-bold text-gray-500">Syarat & Ketentuan:</p>
              <p>
                1. Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.
              </p>
              <p>2. Bukti nota ini sah sebagai bukti pengambilan barang.</p>
              <p>
                3. Nota ini digunakan untuk claim garansi atau cetak ulang jika
                cacat produksi (Oleh PJ atau pemesan bersangkutan).
              </p>
              <p>
                4. Cap basah dapat diminta, dengan membawa hardcopy nota ini
                pada saat pengambilan
              </p>
            </div>
          </div>
          <div className="text-center border-t border-gray-800 w-40 pt-1">
            <p className="text-[10px] uppercase font-bold">Hormat Kami,</p>
            <div className="h-12"></div>
            <p className="text-xs font-bold">Admin Kinau.id</p>
          </div>
        </div>
      </div>

      {/* Footer Informasi Kontak - Fixed Bottom */}
      <div className="mt-auto pt-6 border-t-2 border-gray-800">
        <div className="text-center">
          <p className="text-xs font-bold text-gray-700 mb-3">HUBUNGI KAMI</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-[10px] text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-semibold">WhatsApp:</span>
              <span>{ADMIN_WA}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">Instagram:</span>
              <span>@kinauid</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">Email:</span>
              <span>admin@kinau.id</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">Website:</span>
              <span>www.kinau.id</span>
            </div>
          </div>
          <p className="text-[9px] text-gray-400 mt-2">
            Jalan Terusan Jl. Murai 1 No.7 , Kel. Korpri Raya, Kec. Sukarame,
            Kota Bandar Lampung, Lampung.
          </p>
        </div>
      </div>

      {/* Style Khusus Print */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 0; size: auto; }
            .bg-gray-50 { background-color: #f9fafb !important; }
            .bg-gray-200 { background-color: #e5e7eb !important; }
          }
        `,
        }}
      />
    </div>
  );
});

PrintNotaTemplate.displayName = "PrintNotaTemplate";

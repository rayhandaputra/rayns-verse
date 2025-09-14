import { forwardRef } from "react";

type InvoiceItem = {
  product: string;
  price: number;
  quantity: number;
};

type ReceiptProps = {
  invoiceNumber: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  institution: string;
  admin: string;
  paymentType: string;
  subtotal: number;
  dp: number;
  remaining: number;
  items: InvoiceItem[];
};

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>(
  (
    {
      invoiceNumber,
      date,
      time,
      customerName,
      customerPhone,
      institution,
      admin,
      paymentType,
      subtotal,
      dp,
      remaining,
      items,
    },
    ref
  ) => {
    return (
      <div ref={ref} className="p-6 w-[600px] font-sans text-sm text-gray-900">
        {/* Kop */}
        <div className="flex justify-between items-center mb-4">
          <img src="/logo.png" alt="Kop Nota Kinau" className="h-10" />
        </div>
        <hr className="border-gray-400 mb-3" />

        {/* Header */}
        <div className="flex justify-between mb-4">
          <div>
            <h1 className="font-bold text-lg">INVOICE</h1>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 border rounded">Transfer</span>
            <span className="px-3 py-1 border rounded">{paymentType}</span>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 mb-4 text-xs">
          <div className="space-y-1">
            <p>
              <span className="font-semibold">Kepada:</span> {customerName}
            </p>
            <p>
              <span className="font-semibold">Telepon:</span> {customerPhone}
            </p>
            <p>
              <span className="font-semibold">Instansi:</span> {institution}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p>
              <span className="font-semibold">Nomor:</span> {invoiceNumber}
            </p>
            <p>
              <span className="font-semibold">Tanggal:</span> {date}
            </p>
            <p>
              <span className="font-semibold">Jam:</span> {time}
            </p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-xs border-t border-b mb-4">
          <thead>
            <tr className="text-left">
              <th className="py-2">NAMA PRODUK</th>
              <th className="py-2">HARGA SATUAN</th>
              <th className="py-2">JUMLAH</th>
              <th className="py-2 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-t">
                <td className="py-2">{item.product}</td>
                <td className="py-2">
                  Rp. {item.price.toLocaleString("id-ID")}
                </td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2 text-right">
                  Rp. {(item.price * item.quantity).toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end text-xs space-y-1">
          <div className="w-1/2 space-y-1">
            <p className="flex justify-between">
              <span className="font-semibold">Subtotal</span>
              <span>Rp. {subtotal.toLocaleString("id-ID")}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold">DP</span>
              <span>Rp. {dp.toLocaleString("id-ID")}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-semibold">Sisa</span>
              <span>Rp. {remaining.toLocaleString("id-ID")}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-xs flex justify-between">
          <p>
            Admin: <span className="font-semibold">{admin}</span>
          </p>
          <p>
            Disahkan: {date} {time}
          </p>
        </div>
        <p className="text-xs mt-2">
          Akses nota resmi: <span className="underline">kinau.id/itera</span>
        </p>
      </div>
    );
  }
);

ReceiptTemplate.displayName = "ReceiptTemplate";

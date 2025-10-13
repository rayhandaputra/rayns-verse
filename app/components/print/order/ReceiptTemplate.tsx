import moment from "moment";
import { forwardRef } from "react";
import { toMoney } from "~/lib/utils";

type InvoiceItem = {
  product_name: string;
  product_price: number;
  qty: number;
};

type ReceiptProps = {
  order: any;
  // order: {
  //   order_number: string;
  //   institution_abbr: string;
  //   institution_name: string;
  //   status: string;
  //   total_tax: number;
  //   shipping_fee: number;
  //   created_by: any;
  //   created_on: string;
  // };
  // items: InvoiceItem[];
  items: any[];
  qrCodeUrl?: string;
};

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ order, items, qrCodeUrl }, ref) => {
    return (
      <div
        ref={ref}
        id="printable-content"
        // className="w-[700px] bg-white text-gray-900 font-sans p-8 rounded-2xl shadow-lg border border-gray-200"
        className="w-[700px] bg-white text-gray-900 font-sans p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <img src="/kinau-logo.png" alt="Logo" className="w-24 h-16" />
          <div className="text-right">
            <h2 className="text-xl font-bold capitalize">{order?.status}</h2>
            <p className="text-gray-500 text-sm">
              Order #{order?.order_number} •{" "}
              {moment(order?.created_on).format("DD/MM/YYYY")}{" "}
              {moment(order?.created_on).format("HH:mm:ss")}
            </p>
          </div>
        </div>

        {/* Customer Greeting */}
        <div className="mb-6">
          <p className="font-medium">Halo {order?.institution_abbr},</p>
          <p className="text-gray-600 text-sm">
            Terima kasih atas pembelian Anda! Pesanan Anda telah diverifikasi
            dan akan segera diproses.
          </p>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm border-y border-gray-200 mb-6">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-3">Item</th>
              <th className="py-3">Jumlah</th>
              <th className="py-3 text-right">Harga</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="py-3 flex items-center gap-3">
                  <span>{item?.product_name}</span>
                </td>
                <td className="py-3">{item?.qty ?? 0}</td>
                <td className="py-3 text-right">
                  Rp. {toMoney(item?.subtotal ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-between text-sm mb-6">
          <div>
            <p className="text-gray-500">Admin: {order?.created_by?.name}</p>
            <p className="text-gray-500">Instansi: {order?.institution_name}</p>
          </div>
          <div className="w-1/3 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>
                Rp.{" "}
                {toMoney(
                  items?.reduce(
                    (acc: number, item: any) => acc + +item?.subtotal,
                    0
                  )
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pajak</span>
              <span>Rp. {toMoney(order?.tax_value ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ongkir</span>
              <span>Rp. {toMoney(order?.shipping_fee ?? 0)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>Rp. {toMoney(order?.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between mt-8">
          {qrCodeUrl && (
            <div className="text-left">
              <img src={qrCodeUrl} alt="QR Code" className="h-28 w-28 mb-2" />
              <p className="text-xs text-gray-600">
                Pindai untuk melacak pesanan Anda
              </p>
            </div>
          )}
          <div className="text-right text-xs text-gray-500">
            <p>
              Kunjungi kami:{" "}
              <span className="text-blue-600 underline">kinau.id</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = "ReceiptTemplate";

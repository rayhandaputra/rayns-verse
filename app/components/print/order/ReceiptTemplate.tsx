import { forwardRef } from "react";

type InvoiceItem = {
  product: string;
  price: number;
  quantity: number;
  image?: string; // optional: untuk product thumbnail
};

type ReceiptProps = {
  invoiceNumber: string;
  status: string;
  date: string;
  time: string;
  customerName: string;
  institution: string;
  admin: string;
  subtotal: number;
  tax?: number;
  shippingFee?: number;
  total: number;
  items: InvoiceItem[];
  qrCodeUrl?: string;
  domainUrl: string;
};

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>(
  (
    {
      invoiceNumber,
      status,
      date,
      time,
      customerName,
      institution,
      admin,
      subtotal,
      tax = 0,
      shippingFee = 0,
      total,
      items,
      qrCodeUrl,
      domainUrl,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        id="printable-content"
        className="w-[700px] bg-white text-gray-900 font-sans p-8 rounded-2xl shadow-lg border border-gray-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <img src="/kinau-logo.png" alt="Logo" className="h-10" />
          <div className="text-right">
            <h2 className="text-xl font-bold">{status}</h2>
            <p className="text-gray-500 text-sm">
              Order #{invoiceNumber} • {date} {time}
            </p>
          </div>
        </div>

        {/* Customer Greeting */}
        <div className="mb-6">
          <p className="font-medium">Hi {customerName},</p>
          <p className="text-gray-600 text-sm">
            Thank you for your purchase! Your order has been verified and will
            be processed shortly.
          </p>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm border-y border-gray-200 mb-6">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-3">Item</th>
              <th className="py-3">Qty</th>
              <th className="py-3 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="py-3 flex items-center gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.product}
                      className="h-12 w-12 rounded object-cover border"
                    />
                  )}
                  <span>{item.product}</span>
                </td>
                <td className="py-3">{item.quantity}</td>
                <td className="py-3 text-right">
                  {/* Rp. {item.price.toLocaleString("id-ID")} */}
                  Rp. {1000000}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-between text-sm mb-6">
          <div>
            <p className="text-gray-500">Admin: {admin}</p>
            <p className="text-gray-500">Institution: {institution}</p>
          </div>
          <div className="w-1/3 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              {/* <span>Rp. {subtotal.toLocaleString("id-ID")}</span> */}
              <span>Rp. {100000}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                {/* <span>Rp. {tax.toLocaleString("id-ID")}</span> */}
                <span>Rp. {100000}</span>
              </div>
            )}
            {shippingFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                {/* <span>Rp. {shippingFee.toLocaleString("id-ID")}</span> */}
                <span>Rp. {100000}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              {/* <span>Rp. {total.toLocaleString("id-ID")}</span> */}
              <span>Rp. {100000}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-8">
          {qrCodeUrl && (
            <div className="text-center">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="h-28 w-28 mx-auto mb-2"
              />
              <p className="text-xs text-gray-600">Scan to track your order</p>
            </div>
          )}
          <div className="text-right text-xs text-gray-500">
            <p>
              Visit us:{" "}
              <span className="text-blue-600 underline">{domainUrl}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = "ReceiptTemplate";

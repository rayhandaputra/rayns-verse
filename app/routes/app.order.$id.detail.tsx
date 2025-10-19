"use client";

import {
  ChevronLeft,
  Printer,
  Building2,
  CreditCard,
  Receipt,
  FileText,
  Percent,
  Download,
} from "lucide-react";
import { useLoaderData, useNavigate } from "react-router";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import { TitleHeader } from "~/components/TitleHedaer";
import { Button } from "~/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { ReceiptTemplate } from "~/components/print/order/ReceiptTemplate";
import { usePrintJS } from "~/hooks/usePrintJS";
import QRCode from "qrcode";
import { toMoney } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import moment from "moment";
import "moment/locale/id";
import type { LoaderFunction } from "react-router";
import { API } from "~/lib/api";
import { toast } from "sonner";

export const loader: LoaderFunction = async ({ request, params }) => {
  // const url = new URL(request.url);
  // const { page = 0, size = 10 } = Object.fromEntries(
  //   url.searchParams.entries()
  // );
  try {
    const detail = await API.ORDERS.get({
      // session,
      session: {},
      req: {
        query: {
          pagination: "true",
          id: params.id,
          page: 0,
          size: 1,
        },
      } as any,
    });
    const items = await API.ORDER_ITEMS.get({
      // session,
      session: {},
      req: {
        query: {
          pagination: "true",
          id: detail?.items?.[0]?.order_number,
          page: 0,
          size: 1,
        },
      } as any,
    });

    const files = await API.ORDER_UPLOAD.get_file({
      // session,
      session: {},
      req: {
        query: {
          pagination: "true",
          order_number: detail?.items?.[0]?.order_number,
          page: 0,
          size: 100,
        },
      } as any,
    });

    return {
      // search,
      // APP_CONFIG: CONFIG,
      detail: detail?.items?.[0] ?? null,
      items: items?.items ?? [],
      files: files?.items ?? [],
    };
  } catch (err) {
    console.log(err);
  }
};

export default function DetailOrder() {
  const { detail: order, items, files: order_files } = useLoaderData();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  // const { printElement } = usePrintJS();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [PrintButton, setPrintButton] =
    useState<React.ComponentType<any> | null>(null);

  // Buat QR Code untuk tracking order
  useEffect(() => {
    if (order?.order_number) {
      const qrContent = `https://kinau.id/track/${order.order_number}`;
      QRCode.toDataURL(qrContent, { width: 200, margin: 1 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error("QR generation failed", err));
    }
  }, [order?.order_number]);

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

  if (!client) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <TitleHeader
        title="Detail Pesanan"
        description="Lihat dan kelola informasi lengkap pesanan."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Pesanan", href: "/app/order/pending" },
              { label: "Detail Pesanan", active: true },
            ]}
          />
        }
        actions={
          <Button
            className="text-blue-700"
            onClick={() => navigate("/app/order/pending")}
            variant="outline"
          >
            <ChevronLeft className="w-4" />
            Kembali
          </Button>
        }
      />

      {/* Informasi Umum */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Informasi Pesanan</h3>
            <Badge
              className={`${
                order?.status === "done"
                  ? "bg-green-700"
                  : order?.status === "pending"
                    ? "bg-yellow-600"
                    : "bg-gray-600"
              }`}
            >
              {order?.status?.toUpperCase()}
            </Badge>
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <strong>Kode:</strong> {order?.order_number}
            </p>
            <p>
              <strong>Tanggal:</strong>{" "}
              {moment(order?.created_on).format("DD MMMM YYYY HH:mm")}
            </p>
            <p>
              <strong>Admin:</strong> {order?.created_by?.name}
            </p>
            <p>
              <strong>Catatan:</strong> {order?.notes || "-"}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-white shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <Building2 className="w-5" /> Instansi
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <p>{order?.institution_name}</p>
            <p className="text-gray-500">{order?.institution_abbr}</p>
            <a
              href={`https://${order?.institution_domain}`}
              className="text-blue-600 text-xs underline"
              target="_blank"
            >
              {order?.institution_domain}
            </a>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-white shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <CreditCard className="w-5" /> Pembayaran
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <strong>Metode:</strong> {order?.payment_method?.toUpperCase()}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <Badge
                className={`${
                  order?.payment_status === "paid"
                    ? "bg-green-700"
                    : "bg-yellow-600"
                }`}
              >
                {order?.payment_status.toUpperCase()}
              </Badge>
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Item */}
      <div className="p-5 rounded-2xl border bg-white shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5" /> Detail Item
          </h3>
          {PrintButton ? (
            <PrintButton>
              {({ handlePrint }: any) => (
                <Button
                  onClick={async () => {
                    try {
                      // 2️⃣ Siapkan QR Code
                      const qrContent = `https://kinau.id/track/${order?.order_number}`;
                      const qrUrl = await import("qrcode").then((qr) =>
                        qr.default.toDataURL(qrContent, {
                          width: 200,
                          margin: 1,
                        })
                      );

                      // 3️⃣ Kirim data ke print
                      handlePrint({
                        order: order,
                        items: items,
                        qrCodeUrl: qrUrl,
                      });
                    } catch (err) {
                      console.error("Gagal print nota:", err);
                      toast.error("Gagal memuat data nota.");
                    }
                  }}
                  className="bg-gray-600 hover:bg-gray-500 text-white text-xs"
                >
                  <Printer className="w-4" />
                  Cetak Nota
                </Button>
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
        </div>

        <table className="w-full text-sm border-y border-gray-200">
          <thead className="text-gray-500 bg-gray-50">
            <tr>
              <th className="py-3 text-left">Produk</th>
              <th className="py-3">Jumlah</th>
              <th className="py-3 text-right">Harga</th>
              <th className="py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, i: number) => (
              <tr
                key={i}
                className="border-t border-gray-100 hover:bg-gray-50 transition"
              >
                <td className="py-3">{item?.product_name}</td>
                <td className="py-3 text-center">{item?.qty}</td>
                <td className="py-3 text-right">
                  Rp {toMoney(item?.unit_price)}
                </td>
                <td className="py-3 text-right">
                  Rp {toMoney(item?.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Ringkasan Total */}
        <div className="mt-4 text-sm text-gray-700 w-full flex justify-end">
          <div className="w-full sm:w-1/2 lg:w-1/3 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rp {toMoney(order?.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Diskon</span>
              <span>- Rp {toMoney(order?.discount_value)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pajak ({order?.tax_percent}%)</span>
              <span>Rp {toMoney(order?.tax_value)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ongkir</span>
              <span>Rp {toMoney(order?.shipping_fee)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2 mt-2">
              <span>Total</span>
              <span>Rp {toMoney(order?.grand_total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded-xl border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            File Upload dari Member
          </h3>
          <span className="text-xs text-gray-500">
            Total file: {order_files.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-left">
                {/* <th className="py-2 px-3 rounded-l-lg">Nama Member</th>
                <th className="py-2 px-3">Email</th> */}
                <th className="py-2 px-3">File</th>
                {/* <th className="py-2 px-3 text-center">Status</th> */}
                <th className="py-2 px-3 text-right rounded-r-lg">
                  Tanggal Upload
                </th>
              </tr>
            </thead>
            <tbody>
              {order_files.map((file: any) => (
                <tr key={file?.id} className="border-t hover:bg-gray-50">
                  {/* <td className="py-2 px-3 font-medium">{file?.member_name}</td>
                  <td className="py-2 px-3 text-gray-600">
                    {file?.member_email}
                  </td> */}
                  <td className="py-2 px-3 flex items-center gap-2">
                    <a
                      href={file?.file_url}
                      target="_blank"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      {file.original_name || "Lihat File"}
                    </a>
                  </td>
                  {/* <td className="py-2 px-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        file.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : file.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {file.status}
                    </span>
                  </td> */}
                  <td className="py-2 px-3 text-right text-gray-500">
                    {new Date(file.created_on).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR & Print Template */}
      <div className="hidden">
        <ReceiptTemplate
          ref={printRef}
          {...{
            order,
            items,
            qrCodeUrl: qrCodeUrl ?? undefined,
          }}
        />
      </div>
    </div>
  );
}

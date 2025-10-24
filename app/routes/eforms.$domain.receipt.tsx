import { QrCode, CreditCard, ReceiptText, ChevronLeftIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import { useLocation, useNavigate, type LoaderFunction } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { API } from "~/lib/api";
import QRCode from "qrcode";
import { toMoney } from "~/lib/utils";

export const loader: LoaderFunction = async ({ request, params }) => {
  try {
    const order = await API.ORDERS.get({
      session: {},
      req: {
        query: {
          pagination: "true",
          institution_domain: `kinau.id/eforms/${params.domain}`,
          page: 0,
          size: 1,
        },
      } as any,
    });
    const order_items = await API.ORDER_ITEMS.get({
      session: {},
      req: {
        query: {
          pagination: "true",
          order_number: order?.items?.[0]?.order_number,
          page: 0,
          size: 50,
        },
      } as any,
    });

    return {
      order: order?.items?.[0] ?? null,
      order_items: order_items?.items ?? [],
      table: {
        link: `eforms/${params.domain}/receipt`,
      },
    };
  } catch (err) {
    console.log(err);
  }
};

export default function DigitalInvoice() {
  const { order, order_items } = useLoaderData();
  const navigate = useNavigate();
  const location = useLocation();

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // Buat QR Code untuk tracking order
  useEffect(() => {
    if (order?.order_number) {
      const qrContent = `https://kinau.id/track/${order.order_number}`;
      QRCode.toDataURL(qrContent, {
        width: 200,
        margin: 1,
        color: {
          dark: "#000000", // warna titik QR
          light: "#0000", // transparan (tidak ada background)
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error("QR generation failed", err));
    }
  }, [order?.order_number]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header */}
      <div className="w-full mb-4 text-center">
        <p className="text-sm text-gray-500 mt-1">
          Order #{order?.order_number}
        </p>
        <p className="text-xs text-gray-400">{order?.created_on}</p>
      </div>

      {/* Invoice Card */}
      <Card className="w-full bg-white/80 shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 text-orange-600 p-2 rounded-xl">
                <ReceiptText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Halo {order?.institution_name}
                </h2>
                <p className="text-sm text-gray-500">
                  Pesanan Anda telah diverifikasi
                </p>
              </div>
            </div>
            <div>
              <Button
                type="button"
                variant="ghost"
                className="bg-white text-orange-700 flex items-center gap-2"
                onClick={() =>
                  navigate(`/eforms/${location.pathname?.split("/")[2]}`)
                }
              >
                <ChevronLeftIcon className="w-6" />
              </Button>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Item list */}
          <div className="text-sm text-gray-700 space-y-1">
            {order_items?.map((item: any) => (
              <div className="flex justify-between">
                <span>{item?.product_name}</span>
                <span>x{item?.qty}</span>
              </div>
            ))}

            <div className="flex justify-between font-semibold">
              <span>Total Produk</span>
              <span>Rp{toMoney(order?.subtotal)}</span>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Admin info */}
          <div className="text-sm text-gray-600">
            <p>
              <strong>Admin:</strong> ITERA 2
            </p>
          </div>

          <div className="text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rp{toMoney(order?.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pajak</span>
              <span>Rp{toMoney(order?.tax_fee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ongkir</span>
              <span>Rp{toMoney(order?.shipping_fee)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg text-orange-600">
              <span>Total</span>
              <span>Rp{toMoney(order?.grand_total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Section */}
      <div className="w-full mt-6 text-center">
        <div className="bg-white shadow-sm rounded-2xl p-4 flex flex-col items-center">
          <div className="bg-gray-100 p-4 rounded-xl">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" className="h-20 w-20 mb-2" />
            ) : (
              <QrCode className="w-20 h-20 text-gray-700" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Pindai untuk melacak pesanan Anda
          </p>
        </div>
      </div>

      {/* Payment Section */}
      <div className="w-full mt-6">
        <Card className="border-0 shadow-sm bg-white/90 rounded-2xl">
          <CardContent className="p-5 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-gray-600">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm font-medium">Metode Pembayaran</span>
            </div>
            <div className="text-sm text-gray-500">
              Authorized Credit Card •••• 7592
            </div>
            <Button className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl w-full shadow">
              Bayar Sekarang
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 mt-4">
        Kunjungi kami di{" "}
        <a href="https://kinau.id" className="text-blue-500">
          kinau.id
        </a>
      </p>
    </div>
  );
}

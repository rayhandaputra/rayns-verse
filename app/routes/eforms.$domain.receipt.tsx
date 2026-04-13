import {
  QrCode,
  CreditCard,
  ReceiptText,
  ChevronLeftIcon,
  Star,
  MessageSquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";
import {
  useLocation,
  useNavigate,
  type ActionFunction,
  type LoaderFunction,
} from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { API, API_KEY, API_URL } from "~/lib/api";
import QRCode from "qrcode";
import { toMoney } from "~/lib/utils";
import { useSWRLoader } from "~/lib/api-client";
import { toast } from "sonner";
// import { useSWRLoader } from "~/lib/swr-loader";

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

    // Check if testimonial already exists for this order
    const existingTestimonial = order?.items?.[0]?.order_number
      ? await API.TESTIMONIAL.get({
          session: {},
          req: {
            query: {
              pagination: "false",
              order_number: order?.items?.[0]?.order_number,
              page: 0,
              size: 1,
            },
          } as any,
        })
      : null;

    return {
      order: order?.items?.[0] ?? null,
      order_items: order_items?.items ?? [],
      hasTestimonial: existingTestimonial?.items?.length > 0,
      table: {
        link: `eforms/${params.domain}/receipt`,
      },
    };
  } catch (err) {
    console.log(err);
    return {
      order: null,
      order_items: [],
      hasTestimonial: false,
    };
  }
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const order_number = formData.get("order_number") as string;
  const institution_name = formData.get("institution_name") as string;
  const name = formData.get("name") as string;
  const rating = formData.get("rating") as string;
  const comment = formData.get("comment") as string;

  if (!order_number || !name || !rating || !comment) {
    return {
      success: false,
      error: "Semua field wajib diisi",
    };
  }

  try {
    const result = await API.TESTIMONIAL.create({
      session: {},
      req: {
        body: {
          order_number,
          institution_name,
          name,
          rating: Number(rating),
          comment,
        },
      } as any,
    });

    if (result.success) {
      return {
        success: true,
        message: result.message,
      };
    } else {
      return {
        success: false,
        error: result.message || "Gagal menyimpan ulasan",
      };
    }
  } catch (err: any) {
    console.error("Error creating testimonial:", err);
    return {
      success: false,
      error: err.message || "Terjadi kesalahan saat menyimpan ulasan",
    };
  }
};

export default function DigitalInvoice() {
  const { order, order_items, hasTestimonial } = useLoaderData();
  const actionData = useActionData() as any;
  const navigate = useNavigate();
  const location = useLocation();

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [showTestimonialForm, setShowTestimonialForm] =
    useState(!hasTestimonial);

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

  // Handle action data (success/error messages)
  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Ulasan berhasil dikirim!");
      setShowTestimonialForm(false);
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

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
            {order_items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between">
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
      {/* <div className="w-full mt-6">
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
      </div> */}

      {/* Testimonial Section */}
      {showTestimonialForm && order?.order_number && (
        <div className="w-full mt-6">
          <Card className="border-0 shadow-sm bg-white/90 rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <MessageSquare className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Berikan Ulasan</h3>
              </div>
              <p className="text-sm text-gray-500">
                Bagikan pengalaman Anda menggunakan layanan kami
              </p>

              <Form method="post" className="space-y-4">
                <input
                  type="hidden"
                  name="order_number"
                  value={order.order_number}
                />
                <input
                  type="hidden"
                  name="institution_name"
                  value={order.institution_name || ""}
                />

                <div className="space-y-2">
                  <Label htmlFor="name">Nama Anda</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Masukkan nama Anda"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (hoverRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <input type="hidden" name="rating" value={rating} required />
                  {rating === 0 && (
                    <p className="text-xs text-red-500">
                      Pilih rating terlebih dahulu
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Ulasan</Label>
                  <Textarea
                    id="comment"
                    name="comment"
                    placeholder="Tuliskan ulasan Anda di sini..."
                    required
                    rows={4}
                    className="w-full resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTestimonialForm(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={rating === 0}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-white"
                  >
                    Kirim Ulasan
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

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

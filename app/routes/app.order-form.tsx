// app/routes/app.order-form.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Form,
  useActionData,
  useNavigate,
  type LoaderFunction,
  type ActionFunction,
} from "react-router";
import type { HistoryEntry, Order, Product, OrderItem } from "../types";
import {
  formatCurrency,
  parseCurrency,
  generateAccessCode,
  getKKNPeriod,
  formatPhoneNumber,
} from "../constants";
import {
  Save,
  Eraser,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  Check,
  X,
  Handshake,
  Copy,
  Upload,
} from "lucide-react";
import AsyncReactSelect from "react-select/async";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/lib/nexus-client";
import { safeParseObject } from "~/lib/utils";
import OrderFormComponent from "~/components/OrderFormComponent";
import moment from "moment";

// ============================================
// TYPES & INTERFACES
// ============================================

interface LoaderData {
  products: Product[];
  history: HistoryEntry[];
  user: any;
}

interface OrderFormData {
  instansi: string;
  items: OrderItem[];
  jenisPesanan: string;
  jumlah: number;
  deadline: string;
  statusPembayaran: string;
  dpAmount: number;
  domain: string;
  accessCode: string;
  totalAmount: number;
  isKKN: boolean;
  kknDetails?: any;
  pemesanName: string;
  pemesanPhone: string;
  discount?: { type: string; value: number };
  isSponsor: boolean;
  createdAt: string;
  portfolioImages: string[];
  is_portfolio: boolean;
}

// ============================================
// LOADER FUNCTION
// ============================================

export const loader: LoaderFunction = async ({ request }) => {
  // Only check authentication
  await requireAuth(request);
  return Response.json({ initialized: true });
};

// ============================================
// ACTION FUNCTION
// ============================================

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create_order") {
    try {
      const rawData = formData.get("data") as string;
      const payload: any = safeParseObject(rawData);

      // Ensure status is done
      const finalPayload = {
        institution_id: payload.instansi_id,
        institution_name: payload.instansi,
        institution_domain: payload.accessCode,
        pic_name: payload.pemesanName,
        pic_phone: payload.pemesanPhone,
        deadline: payload.deadline,
        payment_status:
          payload.statusPembayaran?.toLowerCase() === "dp"
            ? "down_payment"
            : "paid",
        ...(payload?.dpAmount > 0 ? { dp_amount: payload?.dpAmount } : {}),
        total_amount: payload.totalAmount,
        is_sponsor: !payload?.isSponsor ? 0 : 1,
        is_kkn: !payload?.isKKN ? 0 : 1,
        ...(+payload?.isKKN && {
          kkn_source: "kkn_itera",
          kkn_type: payload?.kknDetails?.tipe ?? "PPM",
          kkn_detail: {
            period: payload?.kknDetails?.periode ?? 1,
            year: payload?.kknDetails?.tahun ?? moment().year(),
            value: payload?.kknDetails?.nilai ?? 0,
            total_group: payload?.kknDetails?.jumlahKelompok ?? 0,
          },
        }),
        discount_type: payload?.discount?.type || null,
        discount_value: payload?.discount?.value || 0,
        status: "ordered",
        images: payload.portfolioImages,
        items: payload.items,
      };

      const response = await API.ORDERS.create({
        session: { user, token },
        req: {
          body: finalPayload,
        },
      });

      if (response.success) {
        return Response.json({
          success: true,
          message: "Pesanan berhasil disimpan",
        });
      } else {
        return Response.json({
          success: false,
          message: response.message || "Gagal menyimpan pesanan",
        });
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      return Response.json({
        success: false,
        message: error.message || "Terjadi kesalahan saat menyimpan pesanan",
      });
    }
  }

  return Response.json({ success: false, message: "Invalid intent" });
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const transformToAPIFormat = (orderData: OrderFormData) => {
  // Transform items to API format
  const apiItems = orderData.items.map((item) => ({
    product_id: item.productId,
    product_name: item.productName,
    product_type: "single",
    unit_price: item.price,
    qty: item.quantity,
    subtotal: item.total,
  }));

  // Calculate discount
  let discountValue = 0;
  if (orderData.discount) {
    discountValue = orderData.discount.value;
  }

  // Build state object for API
  const state = {
    institution_name: orderData.instansi,
    institution_abbr: orderData.instansi,
    institution_domain: orderData.domain,
    order_type: orderData.isKKN
      ? "kkn"
      : orderData.items.length > 1
        ? "custom"
        : "single",
    payment_status:
      orderData.statusPembayaran === "Lunas"
        ? "paid"
        : orderData.statusPembayaran === "DP"
          ? "down_payment"
          : "unpaid",
    payment_method: "manual_transfer",
    discount_value: discountValue,
    discount_type: orderData.discount?.type === "percent" ? "percent" : "fixed",
    tax_percent: 0,
    shipping_fee: 0,
    other_fee: 0,
    deadline: orderData.deadline || new Date().toISOString().split("T")[0],
    notes: JSON.stringify({
      pemesanName: orderData.pemesanName,
      pemesanPhone: orderData.pemesanPhone,
      isSponsor: orderData.isSponsor,
      isKKN: orderData.isKKN,
      kknDetails: orderData.kknDetails,
      is_portfolio: orderData.is_portfolio,
      portfolioImages: orderData.portfolioImages,
    }),
    is_portfolio: orderData.is_portfolio ? 1 : 0,
  };

  return { state, items: apiItems };
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function OrderFormPage() {
  const actionData = useActionData<{ success?: boolean; message?: string }>();
  const navigate = useNavigate();

  // Fetch products
  const { data: productsData } = useFetcherData({
    endpoint: nexus()
      .module("PRODUCT")
      .action("get")
      .params({ page: 0, size: 100, pagination: "true" })
      .build(),
  });

  const products = productsData?.data?.items || [];

  // ========== STATE ==========
  const [isKKN, setIsKKN] = useState(false);
  const [autoPeriod, setAutoPeriod] = useState(getKKNPeriod());

  // Form Fields
  const [instansiMode, setInstansiMode] = useState<
    "new" | "existing" | "perorangan"
  >("new");
  const [instansi, setInstansi] = useState("");
  const [pemesanName, setPemesanName] = useState("");
  const [pemesanPhone, setPemesanPhone] = useState("");

  // KKN Specific
  const [kknType, setKknType] = useState<"PPM" | "Tematik">("PPM");
  const [kknGroupNo, setKknGroupNo] = useState("");
  const [kknVillage, setKknVillage] = useState("");

  // Products
  const [orderItems, setOrderItems] = useState<
    { productId: string; quantity: string | number }[]
  >([{ productId: "", quantity: "" }]);
  const [selectedProductsData, setSelectedProductsData] = useState<
    Record<string, any>
  >({});

  // Financial
  const [deadline, setDeadline] = useState("");
  const [pay, setPay] = useState<"Tidak Ada" | "DP" | "Lunas">("Tidak Ada");
  const [dpAmountStr, setDpAmountStr] = useState("");
  const [accessCode, setAccessCode] = useState(generateAccessCode(6));
  const [isSponsor, setIsSponsor] = useState(false);
  const [discountType, setDiscountType] = useState<"nominal" | "percent">(
    "nominal"
  );
  const [discountValStr, setDiscountValStr] = useState("");

  // UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<OrderFormData | null>(null);

  // Fetch done orders
  const { data: getOrdersData, reload } = useFetcherData({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({
        status: "done",
        page: 0,
        size: 200,
        pagination: "true",
      })
      .build(),
  });

  const orders = getOrdersData?.data?.items || [];

  // ========== EFFECTS ==========
  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Berhasil");
      handleClear();
    } else if (actionData?.success === false) {
      toast.error(actionData.message || "Gagal");
    }
  }, [actionData]);

  useEffect(() => {
    setAccessCode(generateAccessCode(6));
  }, [isKKN]);

  // ========== CALCULATIONS ==========
  const getPriceForProduct = (productId: string, qty: number) => {
    if (!productId) return 0;

    let p: any = selectedProductsData[productId];
    if (!p) {
      p = products.find((prod: any) => prod.id === productId);
    }
    if (!p) return 0;

    let finalPrice = 0;
    if (p.total_price !== undefined && p.total_price !== null) {
      finalPrice = Number(p.total_price);
    } else if (p.price !== undefined && p.price !== null) {
      finalPrice = Number(p.price);
    }

    // Wholesale pricing logic can be added here if needed

    return finalPrice;
  };

  const calculateFinancials = () => {
    let subTotal = 0;
    let totalQty = 0;
    const items: OrderItem[] = [];

    orderItems.forEach((item) => {
      const qtyNum = Number(item.quantity) || 0;
      if (item.productId && qtyNum > 0) {
        let p = selectedProductsData[item.productId];
        if (!p) {
          p = products.find((prod: any) => prod.id === item.productId);
        }

        if (p) {
          const unitPrice = getPriceForProduct(item.productId, qtyNum);
          const lineTotal = unitPrice * qtyNum;
          subTotal += lineTotal;
          totalQty += qtyNum;
          items.push({
            productId: p.id,
            productName: p.name,
            price: unitPrice,
            quantity: qtyNum,
            total: lineTotal,
          });
        }
      }
    });

    let discountAmount = 0;
    if (!isKKN) {
      const val = parseCurrency(discountValStr);
      if (discountType === "percent") {
        discountAmount = subTotal * (val / 100);
      } else {
        discountAmount = val;
      }
    }

    discountAmount = Math.min(discountAmount, subTotal);
    const grandTotal = subTotal - discountAmount;

    return { subTotal, totalQty, items, discountAmount, grandTotal };
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const { totalQty, grandTotal, items } = calculateFinancials();

    // Validation
    if (!isKKN) {
      if (instansiMode !== "perorangan" && !instansi.trim()) {
        newErrors.instansi = "Wajib diisi";
      }
    } else {
      if (
        kknType === "PPM" &&
        (!kknGroupNo || Number(kknGroupNo) < 1 || Number(kknGroupNo) > 400)
      ) {
        newErrors.kknGroup = "Pilih kelompok 1-400";
      }
      if (kknType === "Tematik" && !kknVillage.trim()) {
        newErrors.kknVillage = "Nama desa wajib diisi";
      }
    }

    if (!pemesanName.trim()) newErrors.pemesanName = "Nama Pemesan wajib diisi";
    if (!pemesanPhone.trim()) newErrors.pemesanPhone = "No WA wajib diisi";
    if (items.length === 0) newErrors.items = "Pilih produk dan isi jumlah";
    if (totalQty <= 0) newErrors.items = "Jumlah barang tidak valid";
    if (!deadline) newErrors.deadline = "Wajib diisi";

    let finalDp = 0;
    if (pay === "DP") {
      finalDp = parseCurrency(dpAmountStr);
      if (finalDp <= 0 || finalDp > grandTotal) {
        newErrors.dp = "Nominal DP tidak valid";
      }
    } else if (pay === "Lunas") {
      finalDp = grandTotal;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Construct data
    let finalInstansi = instansi;
    if (isKKN) {
      finalInstansi = kknType === "PPM" ? `Kelompok ${kknGroupNo}` : kknVillage;
    } else if (instansiMode === "perorangan") {
      finalInstansi = pemesanName;
    }

    const mainProduct =
      items.length > 0
        ? items.length > 1
          ? `${items[0].productName} (+${items.length - 1})`
          : items[0].productName
        : "Custom";

    const orderData: OrderFormData = {
      instansi: finalInstansi,
      items: items,
      jenisPesanan: mainProduct,
      jumlah: totalQty,
      deadline: deadline,
      statusPembayaran: pay,
      dpAmount: finalDp,
      domain: "kinau.id/public/drive-link/" + accessCode,
      accessCode: accessCode,
      totalAmount: grandTotal,
      isKKN,
      kknDetails: isKKN
        ? {
            periode: autoPeriod.period,
            tahun: autoPeriod.year,
            tipe: kknType,
            nilai: kknType === "PPM" ? String(kknGroupNo) : kknVillage,
            jumlahKelompok: 1,
          }
        : undefined,
      pemesanName: pemesanName,
      pemesanPhone: pemesanPhone,
      discount:
        !isKKN && parseCurrency(discountValStr) > 0
          ? {
              type: discountType,
              value: parseCurrency(discountValStr),
            }
          : undefined,
      isSponsor: isSponsor,
      createdAt: new Date().toISOString(),
      portfolioImages: [],
      is_portfolio: false,
    };

    setPendingData(orderData);
    setShowConfirm(true);
  };

  const handleClear = () => {
    setInstansiMode("new");
    setInstansi("");
    setOrderItems([{ productId: "", quantity: "" }]);
    setDeadline("");
    setPay("Tidak Ada");
    setDpAmountStr("");
    setKknGroupNo("");
    setKknVillage("");
    setPemesanName("");
    setPemesanPhone("");
    setIsSponsor(false);
    setDiscountValStr("");
    setErrors({});
    setAccessCode(generateAccessCode(6));
    setShowConfirm(false);
    setPendingData(null);
    setSelectedProductsData({});
  };

  const handleOrderSubmit = (data: any) => {
    // This will be called by OrderForm component
    // We need to trigger the form submission
    const form = document.createElement("form");
    form.method = "post";
    form.style.display = "none";

    const intentInput = document.createElement("input");
    intentInput.type = "hidden";
    intentInput.name = "intent";
    intentInput.value = "create_order";
    form.appendChild(intentInput);

    const dataInput = document.createElement("input");
    dataInput.type = "hidden";
    dataInput.name = "data";
    dataInput.value = JSON.stringify(data);
    form.appendChild(dataInput);

    document.body.appendChild(form);
    form.submit();
  };

  const copyLink = (code: string) => {
    const link = `kinau.id/public/drive-link/${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link disalin: " + link);
  };

  // ========== RENDER ==========
  return (
    <div className="space-y-6">
      <OrderFormComponent
        orders={orders}
        products={products}
        onSubmit={handleOrderSubmit}
        isArchive={false}
      />

      {/* CONFIRMATION MODAL */}
      {showConfirm && pendingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-yellow-600 mb-4">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Konfirmasi Pesanan
                </h3>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-2 mb-4">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">
                    {isKKN ? "KELOMPOK" : "Pemesan"}:
                  </span>
                  <span className="font-bold text-right truncate w-40">
                    {pendingData.instansi}
                  </span>
                </div>

                <div className="border-b border-gray-200 pb-2">
                  <span className="text-gray-500 text-xs block mb-1">
                    Item:
                  </span>
                  {pendingData.items?.map((it, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs font-semibold"
                    >
                      <span>
                        {it.productName} (x{it.quantity})
                      </span>
                      <span>{formatCurrency(it.total)}</span>
                    </div>
                  ))}
                </div>

                {pendingData.isSponsor && (
                  <div className="text-center font-bold text-purple-600 border-b border-gray-200 pb-2">
                    SPONSOR / PARTNER
                  </div>
                )}

                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-500">Total Akhir:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(pendingData.totalAmount)}
                  </span>
                </div>

                <div className="mt-4 pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">
                    Link Akses (Untuk Klien):
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-white border border-gray-300 rounded p-2 text-xs font-mono text-center select-all flex-1 truncate">
                      kinau.id/public/drive-link/{pendingData.accessCode}
                    </div>
                    <button
                      onClick={() => copyLink(pendingData.accessCode)}
                      className="bg-gray-200 hover:bg-gray-300 p-2 rounded text-gray-700"
                      title="Copy Link"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Pastikan data sudah benar.
              </p>

              <Form method="post" className="flex gap-3">
                <input type="hidden" name="intent" value="create_order" />
                <input
                  type="hidden"
                  name="state"
                  value={JSON.stringify(
                    transformToAPIFormat(pendingData).state
                  )}
                />
                <input
                  type="hidden"
                  name="items"
                  value={JSON.stringify(
                    transformToAPIFormat(pendingData).items
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <X size={16} /> Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Check size={16} /> Ya, Simpan
                </button>
              </Form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

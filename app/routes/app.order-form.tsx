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
          payload.statusPembayaran?.toLowerCase() === "lunas"
            ? "paid"
            : payload.statusPembayaran?.toLowerCase() === "dp"
              ? "down_payment"
              : "none",
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
        status: "pending",
        images: payload.portfolioImages,
        items: payload.items,
        created_by: {
          id: user?.id,
          fullname: user?.fullname,
        },
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
    </div>
  );
}

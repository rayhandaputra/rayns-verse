// app/routes/app.order-form.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Form,
  useActionData,
  useLoaderData,
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
  const { user, token } = await requireAuth(request);

  // Fetch Products
  const productsRes = await API.PRODUCT.get({
    req: { query: { page: 0, size: 100, pagination: "true" } },
  });

  // Fetch History (Institutions)
  let historyRes: any = { items: [] };
  try {
    historyRes = await API.INSTITUTION.get({
      session: { user, token },
      req: { query: { page: 0, size: 1000, pagination: "true" } },
    });
  } catch (e) {
    console.error("Failed to fetch history", e);
  }

  return {
    products: productsRes.items || [],
    history: historyRes.items || [],
    user,
  };
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
      const stateStr = formData.get("state") as string;
      const itemsStr = formData.get("items") as string;

      const state = JSON.parse(stateStr);
      const items = JSON.parse(itemsStr);

      const response = await API.ORDERS.create({
        session: { user, token },
        req: {
          body: {
            ...state,
            items,
          },
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
// SWITCH TOGGLE COMPONENT
// ============================================

const SwitchToggle = ({
  options,
  value,
  onChange,
}: {
  options: { val: string; label: string }[];
  value: string;
  onChange: (val: any) => void;
}) => (
  <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
    {options.map((opt) => (
      <button
        key={opt.val}
        type="button"
        onClick={() => onChange(opt.val)}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          value === opt.val
            ? "bg-white shadow text-gray-900"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export default function OrderFormPage() {
  const { products = [], history = [] } = useLoaderData<LoaderData>();
  const actionData = useActionData<{ success?: boolean; message?: string }>();
  const navigate = useNavigate();

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

  // ========== API LOADERS ==========
  const loadOptionProduct = async (search: string) => {
    try {
      const result = await API.PRODUCT.get({
        req: {
          query: {
            search: search || undefined,
            page: 0,
            size: 50,
            pagination: "true",
          },
        },
      });

      return (result?.items || []).map((v: any) => ({
        ...v,
        value: v?.id,
        label: `${v?.type === "package" ? "[PAKET] " : ""}${v?.name} - Rp${formatCurrency(v?.total_price || 0)}`,
      }));
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  const loadOptionInstitution = async (search: string) => {
    try {
      const result = await API.INSTITUTION.get({
        req: {
          query: {
            search: search || undefined,
            page: 0,
            size: 50,
            pagination: "true",
          },
        },
      });

      return (result?.items || []).map((v: any) => ({
        ...v,
        value: v?.id,
        label: `${v?.abbr ? v?.abbr + " - " : ""}${v?.name}`,
      }));
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  // ========== CALCULATIONS ==========
  const getPriceForProduct = (productId: string, qty: number) => {
    if (!productId) return 0;

    let p: any = selectedProductsData[productId];
    if (!p) {
      p = products.find((prod) => prod.id === productId);
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
          p = products.find((prod) => prod.id === item.productId);
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

  // ========== HANDLERS ==========
  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    const list = [...orderItems];
    list.splice(index, 1);
    setOrderItems(list);
  };

  const handleItemChange = (
    index: number,
    field: "productId" | "quantity",
    val: any
  ) => {
    const list = [...orderItems];
    list[index] = { ...list[index], [field]: val };
    setOrderItems(list);
  };

  const handleDpPercent = (percent: number) => {
    const { grandTotal } = calculateFinancials();
    if (grandTotal > 0) {
      setDpAmountStr(formatCurrency(Math.round(grandTotal * (percent / 100))));
    }
  };

  const handlePhoneChange = (val: string) => {
    setPemesanPhone(formatPhoneNumber(val));
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

  const copyLink = (code: string) => {
    const link = `kinau.id/public/drive-link/${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link disalin: " + link);
  };

  const financials = calculateFinancials();

  // ========== RENDER ==========
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative">
        <div className="mb-6 pb-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Form Pemesanan</h2>
            <p className="text-gray-500 text-sm">Input data pesanan baru</p>
          </div>

          <SwitchToggle
            options={[
              { val: "false", label: "Umum" },
              { val: "true", label: "Khusus KKN" },
            ]}
            value={String(isKKN)}
            onChange={(val) => {
              const newVal = val === "true";
              setIsKKN(newVal);
              handleClear();
              setIsKKN(newVal);
            }}
          />
        </div>

        <form onSubmit={handlePreSubmit} className="space-y-6">
          {/* KKN MODE */}
          {isKKN && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4 animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-blue-800 uppercase">
                  PESANAN KHUSUS KKN
                </h3>
                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-white/50 px-3 py-1 rounded-full border border-blue-200">
                  <Calendar size={12} />
                  Periode {autoPeriod.period} / {autoPeriod.year}
                </div>
              </div>

              <div className="border-b border-blue-200 pb-4 mb-4">
                <label className="block text-xs font-semibold text-blue-700 mb-2">
                  Jenis Kelompok
                </label>
                <SwitchToggle
                  options={[
                    { val: "PPM", label: "PPM (Reguler)" },
                    { val: "Tematik", label: "Tematik (Desa)" },
                  ]}
                  value={kknType}
                  onChange={(val) => setKknType(val)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {kknType === "PPM" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Nomor Kelompok (1-400)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="400"
                        className="w-full border-gray-300 rounded-lg p-2 text-sm"
                        value={kknGroupNo}
                        onChange={(e) => setKknGroupNo(e.target.value)}
                        placeholder="Contoh: 14"
                      />
                      {errors.kknGroup && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.kknGroup}
                        </p>
                      )}
                    </div>
                  )}
                  {kknType === "Tematik" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Nama Desa
                      </label>
                      <input
                        className="w-full border-gray-300 rounded-lg p-2 text-sm"
                        value={kknVillage}
                        onChange={(e) => setKknVillage(e.target.value)}
                        placeholder="Contoh: Rejosari"
                      />
                      {errors.kknVillage && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.kknVillage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STANDARD INPUTS */}
          {!isKKN && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jenis Pesanan
                </label>
                <div className="mb-2">
                  <SwitchToggle
                    options={[
                      { val: "new", label: "Instansi Baru" },
                      { val: "existing", label: "Pilih Instansi" },
                      { val: "perorangan", label: "Perorangan" },
                    ]}
                    value={instansiMode}
                    onChange={(val) => {
                      setInstansiMode(val);
                      setInstansi("");
                    }}
                  />
                </div>

                {instansiMode !== "perorangan" && (
                  <>
                    {instansiMode === "new" ? (
                      <input
                        className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none mt-2"
                        value={instansi}
                        onChange={(e) => setInstansi(e.target.value)}
                        placeholder="Ketik nama instansi baru..."
                      />
                    ) : (
                      <div className="mt-2">
                        <AsyncReactSelect
                          value={
                            instansi
                              ? {
                                  value: instansi,
                                  label: instansi,
                                }
                              : null
                          }
                          loadOptions={loadOptionInstitution}
                          defaultOptions
                          placeholder="Cari dan Pilih Instansi..."
                          onChange={(val: any) => {
                            if (val) {
                              setInstansi(val.label);
                            } else {
                              setInstansi("");
                            }
                          }}
                          isClearable
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "42px",
                              fontSize: "0.875rem",
                            }),
                          }}
                        />
                      </div>
                    )}
                    {errors.instansi && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.instansi}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* PEMESAN DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nama Pemesan
              </label>
              <input
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm border"
                value={pemesanName}
                onChange={(e) => setPemesanName(e.target.value)}
                placeholder="Nama lengkap pemesan"
              />
              {errors.pemesanName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.pemesanName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                No. WA
              </label>
              <input
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm border"
                value={pemesanPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+62..."
              />
              {errors.pemesanPhone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.pemesanPhone}
                </p>
              )}
            </div>
          </div>

          {/* PRODUCTS */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Daftar Produk yang Dipesan
            </label>
            <div className="space-y-3">
              {orderItems.map((item, idx) => {
                const qtyNum = Number(item.quantity) || 0;
                let selectedP = selectedProductsData[item.productId];
                if (!selectedP) {
                  selectedP = products.find((p) => p.id === item.productId);
                }
                const unitPrice = getPriceForProduct(item.productId, qtyNum);

                return (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-gray-50 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1 w-full">
                      <AsyncReactSelect
                        value={
                          item.productId
                            ? {
                                value: item.productId,
                                label:
                                  selectedProductsData[item.productId]?.name ||
                                  products.find((p) => p.id === item.productId)
                                    ?.name ||
                                  "Produk",
                              }
                            : null
                        }
                        loadOptions={loadOptionProduct}
                        defaultOptions
                        placeholder="Cari dan Pilih Produk..."
                        onChange={(val: any) => {
                          if (val) {
                            handleItemChange(idx, "productId", val.value);
                            setSelectedProductsData((prev) => ({
                              ...prev,
                              [val.value]: val,
                            }));
                          } else {
                            handleItemChange(idx, "productId", "");
                          }
                        }}
                        isClearable
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: "38px",
                            fontSize: "0.875rem",
                          }),
                        }}
                      />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <input
                        type="number"
                        min="1"
                        className="w-20 rounded-lg border-gray-300 border p-2 text-sm text-center"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", e.target.value)
                        }
                        placeholder="Qty"
                      />
                      <div className="w-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-sm font-semibold text-gray-700">
                        {item.productId && unitPrice > 0
                          ? formatCurrency(unitPrice)
                          : "Rp 0"}
                      </div>
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.items && (
              <p className="text-red-500 text-xs mt-1">{errors.items}</p>
            )}

            <button
              type="button"
              onClick={handleAddItem}
              className="mt-3 text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
            >
              <Plus size={16} /> Tambah Barang Lain
            </button>
          </div>

          {/* SPONSOR & DISCOUNT */}
          {!isKKN && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    className={`w-10 h-6 rounded-full relative transition-colors ${isSponsor ? "bg-purple-600" : "bg-gray-300"}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isSponsor}
                      onChange={(e) => setIsSponsor(e.target.checked)}
                    />
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isSponsor ? "left-5" : "left-1"}`}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-1">
                    <Handshake size={14} /> Sponsor / Kerja Sama
                  </span>
                </label>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <label className="text-sm font-semibold text-gray-600 w-24">
                  Diskon:
                </label>
                <div className="flex gap-2 flex-1">
                  <select
                    className="border border-gray-300 rounded-lg p-2 text-sm bg-white"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                  >
                    <option value="nominal">Nominal (Rp)</option>
                    <option value="percent">Persen (%)</option>
                  </select>
                  <input
                    className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                    placeholder={
                      discountType === "percent" ? "10" : "Rp 10.000"
                    }
                    value={discountValStr}
                    onChange={(e) => {
                      if (discountType === "nominal") {
                        setDiscountValStr(
                          formatCurrency(parseCurrency(e.target.value))
                        );
                      } else {
                        setDiscountValStr(e.target.value);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT & DEADLINE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                className="w-full rounded-lg border-gray-300 border px-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-[42px]"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              {errors.deadline && (
                <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Status Pembayaran
              </label>
              <select
                className="w-full rounded-lg border-gray-300 border px-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-[42px]"
                value={pay}
                onChange={(e) => setPay(e.target.value as any)}
              >
                <option>Tidak Ada</option>
                <option>DP</option>
                <option>Lunas</option>
              </select>
              {pay === "DP" && (
                <div className="flex gap-2 animate-fade-in flex-wrap mt-2">
                  <input
                    type="text"
                    className="flex-1 rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-[42px]"
                    value={dpAmountStr}
                    onChange={(e) =>
                      setDpAmountStr(
                        formatCurrency(parseCurrency(e.target.value))
                      )
                    }
                    placeholder="Nominal DP"
                  />
                  <button
                    type="button"
                    onClick={() => handleDpPercent(50)}
                    className="bg-yellow-50 border border-yellow-300 text-yellow-700 px-3 rounded-lg text-xs font-medium hover:bg-yellow-100 whitespace-nowrap h-[42px]"
                  >
                    50%
                  </button>
                  {!isKKN && (
                    <button
                      type="button"
                      onClick={() => handleDpPercent(70)}
                      className="bg-orange-50 border border-orange-300 text-orange-700 px-3 rounded-lg text-xs font-medium hover:bg-orange-100 whitespace-nowrap h-[42px]"
                    >
                      70%
                    </button>
                  )}
                </div>
              )}
              {errors.dp && (
                <p className="text-red-500 text-xs mt-1">{errors.dp}</p>
              )}
            </div>
          </div>

          {/* TOTAL SUMMARY */}
          <div className="p-4 bg-gray-900 text-white rounded-xl shadow-lg space-y-2">
            <div className="flex justify-between text-sm opacity-80">
              <span>Subtotal ({financials.totalQty} items)</span>
              <span>{formatCurrency(financials.subTotal)}</span>
            </div>
            {financials.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Diskon</span>
                <span>- {formatCurrency(financials.discountAmount)}</span>
              </div>
            )}
            {isSponsor && (
              <div className="flex justify-between text-sm text-purple-400 font-bold">
                <span>Status</span>
                <span>SPONSOR / PARTNER</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="text-sm font-bold">TOTAL TAGIHAN</span>
              <span className="text-xl font-bold">
                {formatCurrency(financials.grandTotal)}
              </span>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <Eraser size={16} /> Reset
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 shadow-lg shadow-gray-200 flex items-center gap-2"
            >
              <Save size={16} /> Simpan Pesanan
            </button>
          </div>
        </form>
      </div>

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

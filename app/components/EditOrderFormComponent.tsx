import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import type { Order, OrderItem } from "../types";
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
  Upload,
  Copy,
} from "lucide-react";
import AsyncReactSelect from "react-select/async";
import { API } from "~/lib/api";
import { toast } from "sonner";
import { safeParseArray, safeParseObject } from "~/lib/utils";

/**
 * PAYLOAD REQUEST EXPECTED (CLEAN VERSION)
 * {
 *     id: string,
 *     institution_id: string | null,
 *     institution_name: string,
 *     institution_domain: string,
 *     pic_name: string,
 *     pic_phone: string,
 *     deadline: string,
 *     payment_status: "paid" | "down_payment" | "none",
 *     dp_amount: number,
 *     total_amount: number,
 *     is_sponsor: number (0|1),
 *     is_kkn: number (0|1),
 *     kkn_source: string, // optional
 *     kkn_type: "PPM" | "Tematik", // optional
 *     kkn_detail: {
 *         period: number,
 *         year: number,
 *         value: string,
 *         total_group: number,
 *         total_qty: number
 *     }, // optional
 *     discount_type: "percent" | "fixed" | null,
 *     discount_value: number,
 *     status: string,
 *     images: string[],
 *     items: any[],
 *     updated_by: { id: string, fullname: string },
 *     is_personal: number (0|1),
 *     kkn_period: number,
 *     kkn_year: number
 * }
 */

// ============================================
// TYPES & INTERFACES
// ============================================

interface OrderFormProps {
  order?: Order;
  products?: any[];
  onSubmit: (payload: any) => void;
}

type InstitutionMode = "new" | "existing" | "personal";
type PaymentStatus = "none" | "down_payment" | "paid";
type DiscountType = "fixed" | "percent" | null;
type KKNType = "PPM" | "Tematik" | null;

interface FormState {
  // General Info
  institution_id: string | null;
  institution_name: string;
  pic_name: string;
  pic_phone: string;
  institution_mode: InstitutionMode;

  // Order Details
  deadline: string;
  order_date: string; // for archive/portfolio
  is_kkn: number;
  is_sponsor: number;
  is_archive: number;
  is_portfolio: number;

  // Financials
  payment_status: PaymentStatus;
  dp_amount: number;
  discount_type: DiscountType;
  discount_value: number;

  // Items
  items: any[];

  // KKN Specific
  kkn_type: KKNType;
  kkn_value: string; // Group No or Village Name
  kkn_year: number;
  kkn_period: number;
  kkn_total_group: number;

  // Assets/Media
  images: string[];
  access_code: string;
}

// ============================================
// MODULAR SUB-COMPONENTS
// ============================================

const FormSection = ({ title, children, icon: Icon }: any) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
      {Icon && <Icon size={18} className="text-gray-400" />}
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

const SwitchToggle = ({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { val: any; label: string }[];
  value: any;
  onChange: (val: any) => void;
  className?: string;
}) => (
  <div className={`flex bg-gray-100 p-1 rounded-lg w-fit ${className}`}>
    {options.map((opt) => (
      <button
        key={String(opt.val)}
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

const OrderFormComponent: React.FC<OrderFormProps> = ({
  order,
  onSubmit,
  products,
}) => {
  // Constants
  //   const isArchive = useMemo(() => !!order?.is_portfolio, [order]);
  const isArchive = useMemo(() => !!+order?.is_archive, [order]);

  // Initial State derived from Props/Constants
  const getInitialState = useCallback((): FormState => {
    const kknDetails = safeParseObject(order?.kkn_detail);
    const currentKknPeriod = getKKNPeriod();

    return {
      institution_id: order?.institution_id || null,
      institution_name: order?.institution_name || "",
      pic_name: order?.pic_name || "",
      pic_phone: order?.pic_phone || "",
      institution_mode: order?.is_personal
        ? "personal"
        : order?.institution_id
          ? "existing"
          : "new",

      deadline: order?.deadline || "",
      order_date:
        order?.created_on?.split("T")[0] ||
        new Date().toISOString().split("T")[0],
      is_kkn: +order?.is_kkn === 1 ? 1 : 0,
      is_sponsor: +order?.is_sponsor === 1 ? 1 : 0,
      is_portfolio: +order?.is_portfolio === 1 ? 1 : 0,
      is_archive: +order?.is_archive === 1 ? 1 : 0,

      payment_status:
        (order?.payment_status
          ?.toLowerCase()
          .replace(" ", "_") as PaymentStatus) || "none",
      dp_amount: Number(order?.dp_amount) || 0,
      discount_type: (order?.discount_type as DiscountType) || null,
      discount_value: Number(order?.discount_value) || 0,

      items: safeParseArray(order?.order_items || order?.items).map((item) => ({
        ...item,
        qty: Number(item.qty) || 0,
      })),

      kkn_type: (kknDetails?.kkn_type as KKNType) || "PPM",
      kkn_value: kknDetails?.value || "",
      kkn_year: kknDetails?.year || currentKknPeriod.year,
      kkn_period: kknDetails?.period || currentKknPeriod.period,
      kkn_total_group: kknDetails?.total_group || 1,

      images: safeParseArray(order?.images || []),
      access_code: order?.order_number || generateAccessCode(6),
    };
  }, [order]);

  const [form, setForm] = useState<FormState>(getInitialState());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedProductsData, setSelectedProductsData] = useState<
    Record<string, any>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when order changes (essential for Edit pages)
  useEffect(() => {
    setForm(getInitialState());
  }, [getInitialState]);

  // ========== API LOADERS ==========
  const loadOptions = {
    product: async (search: string) => {
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
          value: v.id,
          label: v.name,
        }));
      } catch (e) {
        return [];
      }
    },
    institution: async (search: string) => {
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
          value: v.id,
          label: `${v.abbr ? v.abbr + " - " : ""}${v.name}`,
        }));
      } catch (e) {
        return [];
      }
    },
  };

  // ========== CALCULATIONS ==========
  const financials = useMemo(() => {
    let subTotal = 0;
    let totalQty = 0;

    form.items.forEach((item) => {
      const lineTotal = Number(item.variant_final_price) || 0;
      subTotal += lineTotal;
      totalQty += Number(item.qty) || 0;
    });

    let discountAmount = 0;
    if (form.discount_type === "percent") {
      discountAmount = subTotal * (form.discount_value / 100);
    } else if (form.discount_type === "fixed") {
      discountAmount = form.discount_value;
    }

    discountAmount = Math.min(discountAmount, subTotal);
    const grandTotal = subTotal - discountAmount;

    return { subTotal, totalQty, discountAmount, grandTotal };
  }, [form.items, form.discount_type, form.discount_value]);

  // ========== HANDLERS ==========
  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleItemChange = (index: number, updates: any) => {
    const newItems = [...form.items];
    const item = { ...newItems[index], ...updates };

    // Calculate item pricing logic
    const qty = Number(item.qty) || 0;
    const priceRules = safeParseArray(item.product_price_rules).sort(
      (a, b) => b.min_qty - a.min_qty
    );
    const rule = priceRules.find((r) => qty >= Number(r.min_qty));

    const basePrice = Number(rule?.price || 0);
    const addonPrice = Number(item.variant_price || 0);

    item.price_rule_id = rule?.id || null;
    item.price_rule_min_qty = rule?.min_qty || null;
    item.price_rule_value = basePrice;
    item.variant_final_price = qty * (basePrice + addonPrice);

    newItems[index] = item;
    updateForm({ items: newItems });
  };

  const addItem = () =>
    updateForm({ items: [...form.items, { product_id: "", qty: "" }] });

  const removeItem = (index: number) => {
    const newItems = [...form.items];
    newItems.splice(index, 1);
    updateForm({ items: newItems });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      toast.loading("Mengunggah gambar...");
      try {
        const response = await API.ASSET.upload(e.target.files[0]);
        updateForm({ images: [...form.images, response.url] });
        toast.dismiss();
        toast.success("Gambar berhasil diunggah");
      } catch (err) {
        toast.error("Gagal mengunggah gambar");
      }
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (+form.is_kkn === 0) {
      if (form.institution_mode !== "personal" && !form.institution_name)
        errs.instansi = "Wajib diisi";
    } else if (!isArchive) {
      if (
        form.kkn_type === "PPM" &&
        (!form.kkn_value ||
          Number(form.kkn_value) < 1 ||
          Number(form.kkn_value) > 400)
      ) {
        errs.kknGroup = "Pilih kelompok 1-400";
      }
      if (form.kkn_type === "Tematik" && !form.kkn_value.trim()) {
        errs.kknVillage = "Nama desa wajib diisi";
      }
    }

    if (!isArchive || +form.is_kkn === 0) {
      if (!isArchive) {
        if (!form.pic_name.trim())
          errs.pemesanName = "Nama Pemesan wajib diisi";
        if (!form.pic_phone.trim()) errs.pemesanPhone = "No WA wajib diisi";
      }
    }

    if (form.items.length === 0) errs.items = "Pilih produk dan isi jumlah";
    if (financials.totalQty <= 0) errs.items = "Jumlah barang tidak valid";
    if (!isArchive && !form.deadline) errs.deadline = "Wajib diisi";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setShowConfirm(true);
  };

  const submitFinal = () => {
    const payload = {
      order_number: order?.order_number,
      institution_id: form.institution_id,
      institution_name:
        form.institution_mode === "personal"
          ? form.pic_name
          : form.institution_name,
      pic_name: form.pic_name,
      pic_phone: form.pic_phone,
      deadline: form.deadline,
      payment_status:
        form.payment_status === "none"
          ? "none"
          : form.payment_status === "down_payment"
            ? "DP"
            : "Lunas",
      dp_amount: form.dp_amount,
      total_amount: financials.grandTotal,
      is_sponsor: +form.is_sponsor ? 1 : 0,
      is_kkn: +form.is_kkn ? 1 : 0,
      discount_type: form.discount_type === "percent" ? "percent" : "nominal",
      discount_value: form.discount_value,
      status: order?.status || "pending",
      images: form.images,
      items: form.items,
      is_personal: form.institution_mode === "personal" ? 1 : 0,
      kkn_period: form.kkn_period,
      kkn_year: form.kkn_year,
      // KKN Details
      ...(+form.is_kkn === 1 && {
        kkn_type: form.kkn_type,
        kkn_detail: {
          period: form.kkn_period,
          year: form.kkn_year,
          value: form.kkn_value,
          total_group: form.kkn_total_group,
          total_qty: financials.totalQty,
        },
      }),
    };

    onSubmit(payload);
    setShowConfirm(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative">
        <div className="mb-6 pb-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {isArchive ? "Arsip Pesanan Lama" : "Form Pemesanan"}
            </h2>
            <p className="text-gray-500 text-sm">
              Input data pesanan {isArchive ? "terdahulu" : "baru"}
            </p>
          </div>
          <SwitchToggle
            options={[
              { val: false, label: "Umum" },
              { val: true, label: "Khusus KKN" },
            ]}
            value={+form.is_kkn === 1}
            onChange={(v) => updateForm({ is_kkn: v })}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CUSTOMER INFO SECTION */}
          {+form.is_kkn === 1 ? (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4 animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-blue-800 uppercase">
                  {isArchive ? "DATA ARSIP KKN" : "PESANAN KHUSUS KKN"}
                </h3>
                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-white/50 px-3 py-1 rounded-full border border-blue-200">
                  <Calendar size={12} />
                  Periode {form.kkn_period} / {form.kkn_year}
                </div>
              </div>

              {!isArchive && (
                <div className="border-b border-blue-200 pb-4 mb-4">
                  <label className="block text-xs font-semibold text-blue-700 mb-2">
                    Jenis Kelompok
                  </label>
                  <SwitchToggle
                    options={[
                      { val: "PPM", label: "PPM (Reguler)" },
                      { val: "Tematik", label: "Tematik (Desa)" },
                    ]}
                    value={form.kkn_type}
                    onChange={(v) => updateForm({ kkn_type: v })}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isArchive ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2 border-b border-blue-200 pb-4 mb-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Tahun KKN
                        </label>
                        <select
                          className="w-full border-gray-300 rounded-lg p-2 text-sm bg-white"
                          value={form.kkn_year}
                          onChange={(e) =>
                            updateForm({ kkn_year: Number(e.target.value) })
                          }
                        >
                          {[2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Periode
                        </label>
                        <select
                          className="w-full border-gray-300 rounded-lg p-2 text-sm bg-white"
                          value={form.kkn_period}
                          onChange={(e) =>
                            updateForm({ kkn_period: Number(e.target.value) })
                          }
                        >
                          <option value="1">Periode 1 (Jan-Feb)</option>
                          <option value="2">Periode 2 (Agt-Sep)</option>
                        </select>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Pilih Produk
                      </label>
                      <AsyncReactSelect
                        value={
                          form.items[0]?.product_id
                            ? {
                                value: form.items[0].product_id,
                                label: form.items[0].product_name,
                              }
                            : null
                        }
                        loadOptions={loadOptions.product}
                        defaultOptions
                        placeholder="Cari dan Pilih Produk..."
                        onChange={(v: any) => {
                          handleItemChange(0, {
                            product_id: v?.value,
                            product_name: v?.label,
                            product_variants: safeParseArray(
                              v?.product_variants
                            ),
                            product_price_rules: safeParseArray(
                              v?.product_price_rules
                            ),
                          });
                        }}
                        isClearable
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Jumlah Kelompok
                      </label>
                      <input
                        type="number"
                        className="w-full border-gray-300 rounded-lg p-2 text-sm"
                        value={form.kkn_total_group}
                        onChange={(e) =>
                          updateForm({
                            kkn_total_group: Number(e.target.value),
                          })
                        }
                        placeholder="Contoh: 15"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Estimasi Total Barang (Pcs)
                      </label>
                      <input
                        type="number"
                        className="w-full border-gray-300 rounded-lg p-2 text-sm"
                        value={form.items[0]?.qty || ""}
                        onChange={(e) =>
                          handleItemChange(0, { qty: e.target.value })
                        }
                        placeholder="Total gabungan..."
                      />
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {form.kkn_type === "PPM"
                        ? "Nomor Kelompok (1-400)"
                        : "Nama Desa"}
                    </label>
                    <input
                      type={form.kkn_type === "PPM" ? "number" : "text"}
                      className="w-full border-gray-300 rounded-lg p-2 text-sm"
                      value={form.kkn_value}
                      onChange={(e) =>
                        updateForm({ kkn_value: e.target.value })
                      }
                      placeholder={
                        form.kkn_type === "PPM"
                          ? "Contoh: 14"
                          : "Contoh: Rejosari"
                      }
                    />
                    {errors.kknGroup && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.kknGroup}
                      </p>
                    )}
                    {errors.kknVillage && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.kknVillage}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
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
                      { val: "personal", label: "Perorangan" },
                    ]}
                    value={form.institution_mode}
                    onChange={(v) =>
                      updateForm({
                        institution_mode: v,
                        institution_id: null,
                        institution_name: "",
                      })
                    }
                  />
                </div>
                {form.institution_mode !== "personal" && (
                  <>
                    {form.institution_mode === "new" ? (
                      <input
                        className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none mt-2"
                        placeholder="Ketik nama instansi baru..."
                        value={form.institution_name}
                        onChange={(e) =>
                          updateForm({ institution_name: e.target.value })
                        }
                      />
                    ) : (
                      <div className="mt-2">
                        <AsyncReactSelect
                          loadOptions={loadOptions.institution}
                          defaultOptions
                          placeholder="Cari dan Pilih Instansi..."
                          value={
                            form.institution_id
                              ? {
                                  value: form.institution_id,
                                  label: form.institution_name,
                                }
                              : null
                          }
                          onChange={(v: any) =>
                            updateForm({
                              institution_id: v?.id,
                              institution_name: v?.label,
                            })
                          }
                          isClearable
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

          {/* PIC DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nama Pemesan
              </label>
              <input
                className="w-full border-gray-300 rounded-lg p-2.5 text-sm border"
                placeholder="Nama lengkap pemesan"
                value={form.pic_name}
                onChange={(e) => updateForm({ pic_name: e.target.value })}
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
                placeholder="+62..."
                value={form.pic_phone}
                onChange={(e) =>
                  updateForm({ pic_phone: formatPhoneNumber(e.target.value) })
                }
              />
              {errors.pemesanPhone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.pemesanPhone}
                </p>
              )}
            </div>
          </div>

          {/* PRODUCTS SECTION */}
          {!(isArchive && +form.is_kkn === 1) && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Daftar Produk yang Dipesan
              </label>
              <div className="space-y-3">
                {form.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-gray-50 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1 w-full">
                      <AsyncReactSelect
                        value={
                          item.product_id
                            ? {
                                value: item.product_id,
                                label: item.product_name,
                              }
                            : null
                        }
                        loadOptions={loadOptions.product}
                        defaultOptions
                        placeholder="Cari dan Pilih Produk..."
                        onChange={(v: any) => {
                          handleItemChange(idx, {
                            product_id: v?.value,
                            product_name: v?.label,
                            product_variants: safeParseArray(
                              v?.product_variants
                            ),
                            product_price_rules: safeParseArray(
                              v?.product_price_rules
                            ),
                            variant_id: null,
                            variant_price: 0,
                          });
                        }}
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <select
                        className="w-full rounded-lg border-gray-300 border p-2 text-sm h-[38px]"
                        value={item.variant_id || ""}
                        onChange={(e) => {
                          const v = safeParseArray(item.product_variants).find(
                            (x) => x.id === Number(e.target.value)
                          );
                          handleItemChange(idx, {
                            variant_id: v?.id || null,
                            variant_name: v?.variant_name || "",
                            variant_price: Number(v?.base_price) || 0,
                          });
                        }}
                      >
                        <option value="">Pilih Varian</option>
                        {order ? (
                          <option key={item.variant_id} value={item.variant_id}>
                            {item.variant_name} ({item.variant_price})
                          </option>
                        ) : (
                          ""
                        )}
                        {safeParseArray(item.product_variants).map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.variant_name} ({v.base_price})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <input
                        type="number"
                        className="w-20 rounded-lg border-gray-300 border p-2 text-sm text-center"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) =>
                          handleItemChange(idx, { qty: e.target.value })
                        }
                      />
                      <div className="w-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-sm font-semibold text-gray-700">
                        {formatCurrency(item.variant_final_price || 0)}
                      </div>
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {errors.items && (
                <p className="text-red-500 text-xs mt-1">{errors.items}</p>
              )}
              <button
                type="button"
                onClick={addItem}
                className="mt-3 text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
              >
                <Plus size={16} /> Tambah Barang Lain
              </button>
            </div>
          )}

          {/* SPONSOR & DISCOUNT */}
          {+form.is_kkn === 0 && !isArchive && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    className={`w-10 h-6 rounded-full relative transition-colors ${+form.is_sponsor === 1 ? "bg-purple-600" : "bg-gray-300"}`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={+form.is_sponsor === 1}
                      onChange={(e) =>
                        updateForm({ is_sponsor: e.target.checked ? 1 : 0 })
                      }
                    />
                    <div
                      className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${+form.is_sponsor === 1 ? "left-5" : "left-1"}`}
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
                    value={form.discount_type || "nominal"}
                    onChange={(e) =>
                      updateForm({
                        discount_type: e.target.value as DiscountType,
                      })
                    }
                  >
                    <option value="nominal">Nominal (Rp)</option>
                    <option value="percent">Persen (%)</option>
                  </select>
                  <input
                    className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                    placeholder={
                      form.discount_type === "percent" ? "10" : "Rp 10.000"
                    }
                    value={
                      form.discount_type === "percent"
                        ? form.discount_value
                        : formatCurrency(form.discount_value)
                    }
                    onChange={(e) =>
                      updateForm({
                        discount_value:
                          form.discount_type === "percent"
                            ? Number(e.target.value)
                            : parseCurrency(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* LOGISTICS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {isArchive ? "Tanggal Pemesanan" : "Deadline"}
              </label>
              <input
                type="date"
                className="w-full rounded-lg border-gray-300 border px-2.5 text-sm h-[42px]"
                value={isArchive ? form.order_date : form.deadline}
                onChange={(e) =>
                  updateForm(
                    isArchive
                      ? { order_date: e.target.value }
                      : { deadline: e.target.value }
                  )
                }
              />
              {errors.deadline && (
                <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>
              )}
            </div>

            {!isArchive && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Status Pembayaran
                </label>
                <select
                  className="w-full rounded-lg border-gray-300 border px-2.5 text-sm h-[42px]"
                  value={form.payment_status}
                  onChange={(e) =>
                    updateForm({
                      payment_status: e.target.value as PaymentStatus,
                    })
                  }
                >
                  <option value="none">Tidak Ada</option>
                  <option value="down_payment">DP</option>
                  <option value="paid">Lunas</option>
                </select>
                {form.payment_status === "down_payment" && (
                  <div className="flex gap-2 animate-fade-in flex-wrap mt-2">
                    <input
                      className="flex-1 rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 h-[42px]"
                      placeholder="Nominal DP"
                      value={formatCurrency(form.dp_amount)}
                      onChange={(e) =>
                        updateForm({ dp_amount: parseCurrency(e.target.value) })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateForm({
                          dp_amount: Math.round(financials.grandTotal * 0.5),
                        })
                      }
                      className="bg-yellow-50 border border-yellow-300 text-yellow-700 px-3 rounded-lg text-xs font-medium h-[42px]"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateForm({
                          dp_amount: Math.round(financials.grandTotal * 0.7),
                        })
                      }
                      className="bg-orange-50 border border-orange-300 text-orange-700 px-3 rounded-lg text-xs font-medium h-[42px]"
                    >
                      70%
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PHOTO RESULTS (ARCHIVE ONLY) */}
          {isArchive && (
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Foto Hasil Produksi
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {form.images.map((img, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded border overflow-hidden relative"
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt="Archive"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500"
                >
                  <Upload size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleUpload}
                />
              </div>
            </div>
          )}

          {/* SUMMARY BOX */}
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
            {+form.is_sponsor === 1 && (
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

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setForm(getInitialState())}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <Eraser size={16} /> Reset
            </button>
            <button
              //   type="submit"
              type="button"
              onClick={submitFinal}
              className="px-6 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 shadow-lg flex items-center gap-2"
            >
              <Save size={16} /> {isArchive ? "Simpan Arsip" : "Simpan Pesanan"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default OrderFormComponent;

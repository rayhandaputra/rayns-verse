import { Link, useLoaderData, useOutletContext, type LoaderFunction } from "react-router";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  ChevronDown,
  CreditCard,
  IdCard,
  ImageIcon,
  Landmark,
  LayoutTemplate,
  Loader2,
  Package,
  Phone,
  Plus,
  Search,
  Shirt,
  Sparkles,
  Tag,
  User,
  X,
} from "lucide-react";
import { useMemo, useState, useEffect, type ReactNode } from "react";
import { CustomerPaymentProofUpload } from "~/components/customer/CustomerPaymentProofUpload";
import ClientTwibbonEditorPage from "~/components/features/twibbon/ClientTwibbonEditor";
import { APIProviderV2 } from "~/nexus/core/api-provider-v2";
import { toast } from "sonner";
import ModalShell from "~/components/modal/ModalShell";
import { cn } from "~/utils/utils";

const steps = ["Produk", "Kontak", "Bayar"];

type ProductOption = {
  id: string;
  name: string;
  category?: string;
  category_id?: number | string | null;
  description?: string;
  image?: string | null;
  price: number;
  product_price_rules?: any[];
  product_variants?: any[];
};

type DesignTemplateOption = {
  id: string;
  name: string;
  category: "idcard" | "lanyard" | string;
  baseImage: string;
  rules: any[];
  styleMode?: string;
};

const fallbackProducts: ProductOption[] = [
  { id: "fallback-idcard", name: "ID Card", category: "Id Card", price: 12000 },
  { id: "fallback-lanyard", name: "Lanyard", category: "Lanyard", price: 9000 },
  { id: "fallback-package", name: "Paket Event", category: "Paket", price: 18500 },
  { id: "fallback-shirt", name: "Kaos", category: "Lainnya", price: 85000 },
];

const deliveryOptions = [
  { label: "Standar", eta: "3-5 hari", price: 25000 },
  { label: "Prioritas", eta: "2-3 hari", price: 45000 },
  { label: "Ekspres", eta: "1-2 hari", price: 75000 },
];

const paymentMethods = [
  { label: "Transfer Bank", detail: "Virtual account Kinau", icon: Landmark },
  { label: "Kartu Debit", detail: "Visa / Mastercard", icon: CreditCard },
  { label: "DP Manual", detail: "Bayar sebagian dulu", icon: Plus },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseMaybeJson(value: any, fallback: any[] = []) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "string") return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getProductIconType(product: ProductOption) {
  const text = `${product.name} ${product.category || ""}`.toLowerCase();
  if (text.includes("lanyard")) return "lanyard";
  if (text.includes("kaos") || text.includes("shirt")) return "shirt";
  if (text.includes("paket") || text.includes("package")) return "package";
  return "idcard";
}

function ProductIcon({ product }: { product: ProductOption }) {
  const iconType = getProductIconType(product);
  const className = "text-[var(--customer-accent)]";

  if (iconType === "lanyard") return <Tag size={22} className={className} />;
  if (iconType === "shirt") return <Shirt size={22} className={className} />;
  if (iconType === "package") return <Package size={22} className={className} />;
  return <IdCard size={22} className={className} />;
}

function getProductPrice(product?: ProductOption | null) {
  return Number(product?.price || 0);
}

function normalizeProduct(item: any): ProductOption {
  const variants = parseMaybeJson(item?.product_variants);
  const defaultVariant = variants.find((variant: any) => Number(variant?.is_default) === 1) || variants[0];
  const price = Number(item?.total_price || item?.subtotal || defaultVariant?.base_price || item?.price || 0);

  let categoryName = "";
  let categoryId = null;

  if (typeof item?.category === "object" && item?.category !== null) {
    categoryName = item.category.name || "";
    categoryId = item.category.id || null;
  } else if (item?.category_name) {
    categoryName = item.category_name;
  } else if (typeof item?.category === "string") {
    categoryName = item.category;
  }

  return {
    id: String(item?.id || item?.code || item?.name),
    name: item?.name || "Produk",
    category: categoryName || item?.type || "",
    category_id: item?.category_id || categoryId,
    description: item?.description || "",
    image: item?.image || item?.images?.[0] || null,
    price,
    product_price_rules: parseMaybeJson(item?.product_price_rules),
    product_variants: variants,
  };
}

function normalizeTemplate(item: any): DesignTemplateOption {
  const category =
    item?.category === "twibbon-idcard"
      ? "idcard"
      : item?.category === "twibbon-lanyard"
        ? "lanyard"
        : item?.category;

  return {
    id: String(item?.id || item?.unique_code || item?.name),
    name: item?.name || "Template desain",
    category,
    baseImage: item?.base_image || item?.baseImage || "",
    rules: parseMaybeJson(item?.rules),
    styleMode: item?.style_mode || item?.styleMode || "dynamic",
  };
}

export const loader: LoaderFunction = async () => {
  try {
    const [productRes, templateRes] = await Promise.all([
      APIProviderV2({})
        .Table("products")
        .Select({
          columns: [
            "id",
            "name",
            "image",
            "type",
            "category_name",
            "description",
            "subtotal",
            "total_price",
            "show_in_dashboard",
          ],
          where: { deleted_on: "null" },
          page: 0,
          size: 50,
          orderBy: ["created_on", "DESC"],
          include: [
            {
              table: "product_price_rules",
              alias: "product_price_rules",
              foreign_key: "product_id",
              reference_key: "id",
              where: { deleted_on: "null" },
              columns: ["id", "min_qty", "price"],
            },
            {
              table: "product_variants",
              alias: "product_variants",
              foreign_key: "product_id",
              reference_key: "id",
              where: { deleted_on: "null" },
              columns: ["id", "variant_name", "base_price", "is_default"],
            },
          ],
        })
        .Result(),
      APIProviderV2({})
        .Table("x_twibbon_templates")
        .Select({
          columns: ["id", "name", "category", "base_image", "rules", "style_mode"],
          where: { deleted_on: "null" },
          page: 0,
          size: 100,
          orderBy: ["created_on", "DESC"],
        })
        .Result(),
    ]);

    return Response.json({
      products: (productRes?.items || productRes?.data?.items || []).map(normalizeProduct),
      templates: (templateRes?.items || templateRes?.data?.items || []).map(normalizeTemplate),
      apiError: null,
    });
  } catch (error: any) {
    return Response.json({
      products: fallbackProducts,
      templates: [],
      apiError: error?.message || "Gagal mengambil data produk dan template",
    });
  }
};

function WizardStep({
  index,
  active,
  complete,
}: {
  index: number;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="relative z-10 flex min-w-0 flex-col items-center">
      <span
        className={[
          "grid h-6 w-6 place-items-center rounded-full text-[9px] font-black ring-4 ring-white",
          active || complete
            ? "bg-[var(--customer-accent)] text-white"
            : "bg-[var(--customer-border)] text-[var(--customer-text-light)]",
        ].join(" ")}
      >
        {complete ? <Check size={12} strokeWidth={3} /> : index + 1}
      </span>
      <span
        className={[
          "mt-2 max-w-full truncate text-[8px] font-black leading-none",
          active ? "text-[var(--customer-primary)]" : "text-[var(--customer-text-light)]",
        ].join(" ")}
      >
        {steps[index]}
      </span>
    </div>
  );
}

function Field({
  label,
  placeholder,
  icon: Icon,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  icon?: typeof User;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black text-[var(--customer-primary)]">
        {label}
      </span>
      <span className="flex min-h-12 items-center gap-2 rounded-2xl bg-white px-3 shadow-sm ring-1 ring-[var(--customer-border)] focus-within:ring-[var(--customer-border-active)]">
        {Icon ? (
          <Icon size={15} className="shrink-0 text-[var(--customer-text-light)]" />
        ) : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-xs font-bold text-[var(--customer-primary)] outline-none placeholder:text-[var(--customer-text-light)]"
        />
      </span>
    </label>
  );
}

function TextArea({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black text-[var(--customer-primary)]">
        {label}
      </span>
      <textarea
        rows={4}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl bg-white px-3 py-3 text-xs font-bold leading-5 text-[var(--customer-primary)] shadow-sm outline-none ring-1 ring-[var(--customer-border)] placeholder:text-[var(--customer-text-light)] focus:ring-[var(--customer-border-active)]"
      />
    </label>
  );
}

function SectionCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[26px] bg-white/70 p-4 shadow-[0_18px_45px_rgba(30,67,76,0.06)] ring-1 ring-white">
      {children}
    </section>
  );
}

function ProductChoiceCard({
  product,
  selected,
  onSelect,
}: {
  product: ProductOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group flex w-full items-center gap-3 rounded-[22px] border bg-white p-3 text-left transition",
        selected
          ? "border-[var(--customer-border-active)] shadow-[0_14px_35px_rgba(0,151,178,0.14)]"
          : "border-[var(--customer-border)] hover:border-[var(--customer-border-active)]",
      ].join(" ")}
    >
      <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--customer-bg)]">
        {product.image ? (
          <img src={product.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <ProductIcon product={product} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-xs font-black leading-4 text-[var(--customer-primary)]">
          {product.name}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          {product.category ? (
            <span className="rounded-full bg-[var(--customer-accent-light)] px-2 py-0.5 text-[9px] font-black text-[var(--customer-accent)]">
              {product.category}
            </span>
          ) : null}
          <span className="text-[10px] font-black text-[var(--customer-primary)]">
            {formatMoney(getProductPrice(product))}
          </span>
        </span>
      </span>
      <span
        className={[
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
          selected
            ? "border-[var(--customer-accent)] bg-[var(--customer-accent)] text-white"
            : "border-[var(--customer-border)]",
        ].join(" ")}
      >
        {selected ? <Check size={12} strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

function DesignPickerSection({
  title,
  description,
  icon,
  templates,
  selectedTemplate,
  savedPreview,
  onSelect,
  onEdit,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  templates: DesignTemplateOption[];
  selectedTemplate: DesignTemplateOption | null;
  savedPreview?: string;
  onSelect: (template: DesignTemplateOption) => void;
  onEdit: (template: DesignTemplateOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState("");
  const [tempSelected, setTempSelected] = useState<DesignTemplateOption | null>(selectedTemplate);

  // Sync temp selection when modal opens
  const handleOpen = () => {
    setTempSelected(selectedTemplate);
    setSearch("");
    setStyleFilter("");
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (tempSelected) {
      onSelect(tempSelected);
    }
    setIsOpen(false);
  };

  const styles = useMemo(() => {
    return Array.from(new Set(templates.map((t) => t.styleMode).filter(Boolean))) as string[];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch = !search.trim() || t.name.toLowerCase().includes(search.toLowerCase());
      const matchesStyle = !styleFilter || t.styleMode === styleFilter;
      return matchesSearch && matchesStyle;
    });
  }, [templates, search, styleFilter]);

  return (
    <div className="rounded-[24px] border border-[var(--customer-border)] bg-white p-4 shadow-sm space-y-4">
      {/* Header Info */}
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-black text-[var(--customer-primary)]">{title}</h3>
          <p className="mt-0.5 text-[10px] font-semibold leading-4 text-[var(--customer-text-light)]">
            {description}
          </p>
        </div>
      </div>

      {/* Trigger & Selected Design Card */}
      {selectedTemplate ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[var(--customer-border)] p-3 bg-gray-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative block h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--customer-bg)] border border-[var(--customer-border)]">
              {savedPreview ? (
                <img src={savedPreview} alt="" className="h-full w-full object-cover" />
              ) : selectedTemplate.baseImage ? (
                <img src={selectedTemplate.baseImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-[var(--customer-text-light)]">
                  <ImageIcon size={20} />
                </span>
              )}
            </span>
            <div className="min-w-0">
              <p className="line-clamp-1 text-xs font-black text-[var(--customer-primary)]">
                {selectedTemplate.name}
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-[var(--customer-text-light)]">
                {selectedTemplate.styleMode || "Dynamic"}
              </p>
              {savedPreview && (
                <p className="mt-0.5 text-[9px] font-bold text-[var(--customer-success)]">
                  Preview tersimpan
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpen}
              className="px-3 py-2 text-[10px] font-black rounded-xl border border-[var(--customer-border)] bg-white text-[var(--customer-primary)] hover:bg-gray-50 transition shadow-sm"
            >
              Ganti Desain
            </button>
            <button
              type="button"
              onClick={() => onEdit(selectedTemplate)}
              className="inline-flex items-center gap-1 px-3 py-2 text-[10px] font-black rounded-xl bg-[var(--customer-primary)] text-white hover:opacity-90 transition shadow-sm"
            >
              <Sparkles size={11} />
              Edit
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--customer-border)] bg-white p-6 text-center hover:bg-gray-50/50 transition"
        >
          <span className="text-xs font-bold text-[var(--customer-text-muted)]">
            Belum ada template dipilih.
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--customer-accent)] hover:bg-[var(--customer-accent-hover)] text-white text-[10px] font-black rounded-xl transition shadow-md shadow-[rgba(0,151,178,0.2)]">
            Pilih Template Desain
          </span>
        </button>
      )}

      {/* Gallery selection modal */}
      <ModalShell open={isOpen} onClose={() => setIsOpen(false)} size="4xl">
        <div className="p-4 flex flex-col h-full max-h-[85vh]">
          <h2 className="text-lg font-black text-[var(--customer-primary)] mb-1">
            Pilih Template Desain
          </h2>
          <p className="text-xs text-[var(--customer-text-light)] mb-4">
            Pilih salah satu template visual dasar di bawah ini untuk Anda modifikasi.
          </p>

          {/* Search/filter toolbar */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari template desain..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-[var(--customer-accent)] focus:border-[var(--customer-accent)] outline-none font-bold"
              />
            </div>
            {styles.length > 0 && (
              <div className="relative min-w-[150px]">
                <select
                  value={styleFilter}
                  onChange={(e) => setStyleFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-xs font-bold focus:ring-1 focus:ring-[var(--customer-accent)] focus:border-[var(--customer-accent)] outline-none"
                >
                  <option value="">Semua Gaya</option>
                  {styles.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            )}
            {(search || styleFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStyleFilter("");
                }}
                className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg transition"
              >
                Reset
              </button>
            )}
          </div>

          {/* Responsive Gallery Grid */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-[250px]">
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-xs font-bold text-[var(--customer-text-muted)]">
                  Tidak ada template desain ditemukan.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredTemplates.map((template) => {
                  const selected = tempSelected?.id === template.id;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setTempSelected(template)}
                      className={cn(
                        "relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition hover:scale-[1.01] active:scale-[0.99] p-2",
                        selected
                          ? "border-[var(--customer-accent)] shadow-lg shadow-[rgba(0,151,178,0.1)] ring-1 ring-[var(--customer-accent)]"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-xl bg-[var(--customer-bg)] border border-gray-100">
                        {template.baseImage ? (
                          <img
                            src={template.baseImage}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="grid h-full place-items-center text-[var(--customer-text-light)]">
                            <ImageIcon size={24} />
                          </span>
                        )}
                        {selected && (
                          <span className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full bg-[var(--customer-accent)] text-white shadow-md">
                            <Check size={12} strokeWidth={3.5} />
                          </span>
                        )}
                      </span>
                      <span className="block pt-2">
                        <span className="line-clamp-1 text-xs font-black text-[var(--customer-primary)]">
                          {template.name}
                        </span>
                        <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-wider text-[var(--customer-text-light)]">
                          {template.styleMode || "Dynamic"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 shrink-0">
            <div>
              {tempSelected && (
                <span className="text-xs text-gray-600 font-semibold">
                  Terpilih: <span className="font-bold text-[var(--customer-accent)]">{tempSelected.name}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!tempSelected}
                onClick={handleConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-[var(--customer-accent)] hover:bg-[var(--customer-accent-hover)] rounded-lg transition disabled:opacity-50"
              >
                Pilih Desain
              </button>
            </div>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}

export default function CustomerConfigure() {
  const { user, token } = useOutletContext<{
    user: {
      id?: string | number;
      fullname?: string;
      name?: string;
      email?: string;
      role?: string;
      phone?: string;
    };
    token: string;
  }>();

  const { products: loaderProducts, templates, apiError } = useLoaderData<{
    products: ProductOption[];
    templates: DesignTemplateOption[];
    apiError: string | null;
  }>();
  const productOptions = loaderProducts?.length ? loaderProducts : fallbackProducts;
  const [activeStep, setActiveStep] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(productOptions[0] || null);
  const [selectedDelivery, setSelectedDelivery] = useState(deliveryOptions[0]);
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0]);
  const [quantity, setQuantity] = useState("100");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [instansiMode, setInstansiMode] = useState<"perorangan" | "existing" | "new">("perorangan");
  const [instansi, setInstansi] = useState("");
  const [instansiId, setInstansiId] = useState("");
  const [institutionsHistory, setInstitutionsHistory] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Set default values from session user object once it loads
  useEffect(() => {
    if (user) {
      if (!customerName && user.fullname) setCustomerName(user.fullname);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Load user's history of institutions using APIProviderV2
  useEffect(() => {
    if (!user?.phone) return;

    const fetchInstitutionHistory = async () => {
      setLoadingHistory(true);
      try {
        const response = await APIProviderV2({
          user: JSON.stringify(user),
          token,
        })
          .Table("orders")
          .Select({
            columns: ["institution_id", "institution_name"],
            where: { pic_phone: user.phone, deleted_on: "null" },
            page: 0,
            size: 100,
          })
          .Result();

        const items = response?.items || [];
        const uniqueMap = new Map<string, string>();
        items.forEach((item: any) => {
          if (item.institution_id && item.institution_name) {
            uniqueMap.set(String(item.institution_id), String(item.institution_name));
          }
        });

        const list = Array.from(uniqueMap.entries()).map(([id, name]) => ({
          id,
          name,
        }));
        setInstitutionsHistory(list);
      } catch (err) {
        console.error("Failed to load institution history", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchInstitutionHistory();
  }, [user, token]);
  const [dpProofUrl, setDpProofUrl] = useState("");
  const [paidProofUrl, setPaidProofUrl] = useState("");
  const [selectedIdCardTemplate, setSelectedIdCardTemplate] = useState<DesignTemplateOption | null>(null);
  const [selectedLanyardTemplate, setSelectedLanyardTemplate] = useState<DesignTemplateOption | null>(null);
  const [editorTemplate, setEditorTemplate] = useState<DesignTemplateOption | null>(null);
  const [savedDesigns, setSavedDesigns] = useState<Record<string, string>>({});
  const [isOrderCreated, setIsOrderCreated] = useState(false);
  const [bankList, setBankList] = useState<Array<{ id: number; bank_name: string; account_number: string; holder_name: string }>>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [selectedBankDetails, setSelectedBankDetails] = useState<any>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await APIProviderV2({ user: JSON.stringify(user), token })
          .Table("bank_accounts")
          .Select({
            columns: ["id", "bank_name", "account_number", "holder_name"],
            where: { deleted_on: "null" },
            page: 0,
            size: 50,
          })
          .Result();
        setBankList(response?.items || []);
      } catch (err) {
        console.error("Failed to load bank accounts", err);
      }
    };
    if (user && token) {
      fetchBanks();
    }
  }, [user, token]);

  const handleCreateOrder = async () => {
    if (!customerName.trim()) {
      toast.error("Nama pemesan wajib diisi");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("Nomor WhatsApp wajib diisi");
      return;
    }
    if (!selectedPaymentMethod) {
      toast.error("Silakan pilih tujuan transfer / metode pembayaran");
      return;
    }
    if (!dpProofUrl && !paidProofUrl) {
      toast.error("Silakan unggah bukti pembayaran (DP atau Lunas)");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      let finalInstitutionId = instansiId;
      if (instansiMode === "new" && instansi.trim()) {
        const instResult = await APIProviderV2({ user: JSON.stringify(user), token })
          .Table("institutions")
          .Insert({
            name: instansi,
            created_on: new Date().toISOString().replace("T", " ").substring(0, 19),
          })
          .Result();
        
        if (instResult?.insert_id || instResult?.id) {
          finalInstitutionId = String(instResult.insert_id || instResult.id);
        }
      }

      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const orderNumber = `ORD-${datePart}-${randomPart}`;

      let paymentStatus = "none";
      if (paidProofUrl) {
        paymentStatus = "paid";
      } else if (dpProofUrl) {
        paymentStatus = "down_payment";
      }

      let paymentDetail = null;
      let paymentMethodVal = selectedPaymentMethod;
      if (selectedBankDetails) {
        paymentMethodVal = "manual_transfer";
        paymentDetail = JSON.stringify({
          account_id: selectedBankDetails.id,
          account_code: selectedBankDetails.bank_name,
          account_name: selectedBankDetails.bank_name,
          account_number: selectedBankDetails.account_number,
          account_holder: selectedBankDetails.holder_name,
        });
      }

      let orderType: "package" | "id_card" | "lanyard" | "custom" | "service" = "custom";
      const catLower = (selectedProduct?.category || "").toLowerCase();
      if (catLower.includes("paket")) {
        orderType = "package";
      } else if (catLower.includes("id card") || catLower.includes("idcard")) {
        orderType = "id_card";
      } else if (catLower.includes("lanyard")) {
        orderType = "lanyard";
      } else if (catLower.includes("service") || catLower.includes("layanan")) {
        orderType = "service";
      }

      const orderPayload = {
        order_number: orderNumber,
        institution_id: instansiMode === "perorangan" ? null : finalInstitutionId,
        institution_name: instansiMode === "perorangan" ? "Perorangan" : instansi,
        pic_name: customerName,
        pic_phone: customerPhone,
        subtotal: subtotal,
        total_amount: subtotal,
        grand_total: subtotal,
        dp_amount: dpProofUrl ? Math.ceil(subtotal * 0.5) : 0,
        payment_status: paymentStatus,
        payment_proof: paidProofUrl || null,
        dp_payment_proof: dpProofUrl || null,
        payment_method: paidProofUrl ? paymentMethodVal : null,
        payment_detail: paidProofUrl ? paymentDetail : null,
        dp_payment_method: dpProofUrl ? paymentMethodVal : null,
        dp_payment_detail: dpProofUrl ? paymentDetail : null,
        status: "pending",
        is_personal: instansiMode === "perorangan" ? 1 : 0,
        order_type: orderType,
        images: JSON.stringify([
          selectedIdCardTemplate ? savedDesigns[selectedIdCardTemplate.id] : null,
          selectedLanyardTemplate ? savedDesigns[selectedLanyardTemplate.id] : null,
        ].filter(Boolean)),
        created_by: JSON.stringify({
          id: user?.id,
          fullname: user?.fullname || user?.name || "Customer",
        }),
        created_on: new Date().toISOString().replace("T", " ").substring(0, 19),
        order_date: new Date().toISOString().split("T")[0],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      };

      const orderResult = await APIProviderV2({ user: JSON.stringify(user), token })
        .Table("orders")
        .Insert(orderPayload)
        .Result();

      if (!orderResult?.insert_id && !orderResult?.id && !orderResult?.success) {
        throw new Error("Gagal menyimpan pesanan");
      }

      // Save to order_designs table
      const designPromises = [];
      if (selectedIdCardTemplate && savedDesigns[selectedIdCardTemplate.id]) {
        designPromises.push(
          APIProviderV2({ user: JSON.stringify(user), token })
            .Table("order_designs")
            .Insert({
              order_number: orderNumber,
              template_id: String(selectedIdCardTemplate.id),
              template_name: selectedIdCardTemplate.name,
              category: "id_card",
              preview_image: savedDesigns[selectedIdCardTemplate.id],
            })
            .Result()
        );
      }
      if (selectedLanyardTemplate && savedDesigns[selectedLanyardTemplate.id]) {
        designPromises.push(
          APIProviderV2({ user: JSON.stringify(user), token })
            .Table("order_designs")
            .Insert({
              order_number: orderNumber,
              template_id: String(selectedLanyardTemplate.id),
              template_name: selectedLanyardTemplate.name,
              category: "lanyard",
              preview_image: savedDesigns[selectedLanyardTemplate.id],
            })
            .Result()
        );
      }
      if (designPromises.length > 0) {
        await Promise.all(designPromises);
      }

      const defaultVariant = selectedProduct?.product_variants?.find((v: any) => Number(v?.is_default) === 1) || selectedProduct?.product_variants?.[0];
      let productType: "single" | "package" | "material" | "custom" | "addon" = "single";
      if (orderType === "package") {
        productType = "package";
      }

      const itemPayload = {
        order_number: orderNumber,
        product_id: selectedProduct?.id ? Number(selectedProduct.id) : null,
        category_id: selectedProduct?.category_id ? Number(selectedProduct.category_id) : null,
        category_name: selectedProduct?.category || null,
        variant_id: defaultVariant?.id ? Number(defaultVariant.id) : null,
        variant_name: defaultVariant?.variant_name || null,
        variant_price: defaultVariant?.base_price ? Number(defaultVariant.base_price) : 0,
        variant_final_price: defaultVariant?.base_price ? Number(defaultVariant.base_price) : 0,
        product_name: selectedProduct?.name,
        qty: Number(quantity) || 0,
        unit_price: getProductPrice(selectedProduct),
        subtotal: subtotal,
        total_after_tax: subtotal,
        product_type: productType,
        created_on: new Date().toISOString().replace("T", " ").substring(0, 19),
      };

      await APIProviderV2({ user: JSON.stringify(user), token })
        .Table("order_items")
        .Insert(itemPayload)
        .Result();

      setCreatedOrderNumber(orderNumber);
      setIsOrderCreated(true);
      toast.success("Pesanan berhasil dikirim!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Gagal menyimpan pesanan");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // States for the custom product list modal (Reference style: wr1-siakad yudisium modal)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalCategory, setModalCategory] = useState("");
  const [modalPage, setModalPage] = useState(0);
  const [tempSelectedProduct, setTempSelectedProduct] = useState<ProductOption | null>(selectedProduct);

  const productCategories = useMemo(() => {
    return Array.from(new Set(productOptions.map((p) => p.category).filter(Boolean))) as string[];
  }, [productOptions]);

  const modalFilteredProducts = useMemo(() => {
    return productOptions.filter((product) => {
      const matchesSearch =
        !modalSearch.trim() ||
        `${product.name} ${product.category || ""} ${product.description || ""}`
          .toLowerCase()
          .includes(modalSearch.trim().toLowerCase());
      const matchesCategory = !modalCategory || product.category === modalCategory;
      return matchesSearch && matchesCategory;
    });
  }, [productOptions, modalSearch, modalCategory]);

  const modalPageSize = 5;
  const modalPaginatedProducts = useMemo(() => {
    const start = modalPage * modalPageSize;
    return modalFilteredProducts.slice(start, start + modalPageSize);
  }, [modalFilteredProducts, modalPage]);

  const modalTotalPages = Math.max(1, Math.ceil(modalFilteredProducts.length / modalPageSize));

  const openProductModal = () => {
    setTempSelectedProduct(selectedProduct);
    setModalSearch("");
    setModalCategory("");
    setModalPage(0);
    setIsProductModalOpen(true);
  };

  const handleConfirmProduct = () => {
    setSelectedProduct(tempSelectedProduct);
    setIsProductModalOpen(false);
  };

  const idCardTemplates = useMemo(
    () => (templates || []).filter((template) => template.category === "idcard"),
    [templates]
  );

  const lanyardTemplates = useMemo(
    () => (templates || []).filter((template) => template.category === "lanyard"),
    [templates]
  );

  const subtotal = useMemo(() => {
    const qty = Number(quantity) || 0;
    return getProductPrice(selectedProduct) * qty;
  }, [quantity, selectedProduct]);

  const total = subtotal;

  const handleSelectTemplate = (
    template: DesignTemplateOption,
    category: "idcard" | "lanyard"
  ) => {
    if (category === "idcard") {
      setSelectedIdCardTemplate(template);
    } else {
      setSelectedLanyardTemplate(template);
    }
    setEditorTemplate(template);
  };

  const handleSaveDesign = (base64: string) => {
    if (!editorTemplate) return;
    setSavedDesigns((current) => ({ ...current, [editorTemplate.id]: base64 }));
    setEditorTemplate(null);
  };

  if (isOrderCreated) {
    return (
      <section className="relative flex min-h-[calc(100vh-1.5rem)] flex-col items-center justify-center overflow-hidden bg-white px-6 py-10 text-center">
        <div className="pointer-events-none absolute inset-0">
          {[
            "left-10 top-12 rotate-45 bg-[var(--customer-accent)]",
            "right-12 top-16 -rotate-12 bg-[var(--customer-danger)]",
            "left-20 top-28 -rotate-45 bg-[var(--customer-primary)]",
            "right-16 top-36 rotate-45 bg-[var(--customer-accent)]",
            "left-9 bottom-28 -rotate-12 bg-[var(--customer-primary)]",
            "right-9 bottom-20 rotate-45 bg-[var(--customer-danger)]",
            "left-24 bottom-16 rotate-12 bg-[var(--customer-accent)]",
          ].map((className) => (
            <span
              key={className}
              className={[
                "absolute h-1.5 w-1.5 rounded-sm opacity-75",
                className,
              ].join(" ")}
            />
          ))}
          <span className="absolute left-7 top-20 h-0.5 w-5 rotate-45 rounded-full bg-[var(--customer-primary)] opacity-75" />
          <span className="absolute right-9 top-24 h-0.5 w-5 -rotate-45 rounded-full bg-[var(--customer-primary)] opacity-75" />
          <span className="absolute left-8 bottom-20 h-0.5 w-5 -rotate-12 rounded-full bg-[var(--customer-primary)] opacity-75" />
          <span className="absolute right-12 bottom-32 h-0.5 w-5 rotate-12 rounded-full bg-[var(--customer-primary)] opacity-75" />
        </div>

        <div className="relative z-10 w-full max-w-[300px]">
          <p className="text-[10px] font-black text-[var(--customer-text-muted)]">
            ID Pesanan
          </p>
          <p className="mt-1 text-xs font-black text-[var(--customer-primary)]">
            #{createdOrderNumber}
          </p>

          <h1 className="mt-8 text-2xl font-black tracking-tight text-[var(--customer-primary)]">
            Selamat!
          </h1>
          <p className="mt-2 text-sm font-bold text-[var(--customer-danger)]">
            Pesanan kamu berhasil dibuat
          </p>

          <div className="mx-auto mt-9 grid h-28 w-28 place-items-center rounded-full bg-[var(--customer-primary)] text-white shadow-[0_24px_55px_rgba(30,67,76,0.22)]">
            <Check size={58} strokeWidth={3.2} />
          </div>

          <div className="mt-12 space-y-3">
            <Link
              to="/customer/orders"
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--customer-primary-light)] px-4 text-xs font-black text-[var(--customer-primary)] transition hover:bg-[var(--customer-accent-light)]"
            >
              Lacak pesanan
            </Link>
            <Link
              to="/customer/dashboard"
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--customer-card-hover)] px-4 text-xs font-black text-[var(--customer-primary)] transition hover:bg-[var(--customer-bg)]"
            >
              Batalkan pesanan?
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-1.5rem)] pb-4">
      <header className="flex items-center justify-between">
        <Link
          to="/customer/dashboard"
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--customer-primary)] shadow-sm ring-1 ring-[var(--customer-border)]"
          aria-label="Kembali"
        >
          <ArrowLeft size={17} strokeWidth={2.4} />
        </Link>
        <h1 className="text-base font-black text-[var(--customer-primary)]">
          Pesanan Baru
        </h1>
        <span className="h-9 w-9" />
      </header>

      <div className="mt-5 rounded-[28px] bg-white px-5 pb-4 pt-4 shadow-[0_24px_60px_rgba(30,67,76,0.08)] ring-1 ring-[var(--customer-border)]">
        <div className="relative grid grid-cols-3">
          <div className="absolute left-[16.67%] right-[16.67%] top-3 h-0.5 rounded-full bg-[var(--customer-border)]" />
          <div
            className="absolute left-[16.67%] top-3 h-0.5 rounded-full bg-[var(--customer-accent)] transition-all"
            style={{ width: `${(activeStep / (steps.length - 1)) * 66.67}%` }}
          />
          {steps.map((step, index) => (
            <WizardStep
              key={step}
              index={index}
              active={activeStep === index}
              complete={activeStep > index}
            />
          ))}
        </div>
      </div>

      <form className="mt-5 space-y-4">
        {activeStep === 0 ? (
          <SectionCard>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
                <Package size={18} />
              </span>
              <div>
                <h2 className="text-sm font-black text-[var(--customer-primary)]">
                  Pilih Produk & Desain
                </h2>
                <p className="text-[10px] font-semibold text-[var(--customer-text-light)]">
                  Tentukan produk, desain ID Card, dan desain Lanyard.
                </p>
              </div>
            </div>

            {apiError ? (
              <div className="mb-3 rounded-2xl border border-[var(--customer-warning)]/25 bg-[var(--customer-warning)]/10 px-3 py-2">
                <p className="text-[10px] font-bold leading-4 text-[var(--customer-primary)]">
                  Data live belum tersedia, sementara memakai daftar produk fallback.
                </p>
              </div>
            ) : null}

            <div className="space-y-3">
              <div>
                <span className="mb-1.5 block text-[10px] font-black text-[var(--customer-primary)]">
                  Produk Terpilih
                </span>
                {selectedProduct ? (
                  <div className="flex items-center justify-between gap-4 rounded-3xl border border-[var(--customer-border)] bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[var(--customer-bg)] border border-[var(--customer-border)]">
                        {selectedProduct.image ? (
                          <img src={selectedProduct.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ProductIcon product={selectedProduct} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-xs font-black text-[var(--customer-primary)]">
                          {selectedProduct.name}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-[var(--customer-text-light)]">
                          {selectedProduct.category && (
                            <span className="rounded-full bg-[var(--customer-accent-light)] px-2 py-0.5 text-[9px] font-black text-[var(--customer-accent)]">
                              {selectedProduct.category}
                            </span>
                          )}
                          <span>{formatMoney(getProductPrice(selectedProduct))}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openProductModal}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-[var(--customer-border)] bg-gray-50 text-[10px] font-black text-[var(--customer-primary)] hover:bg-gray-100 transition shadow-sm"
                    >
                      Ganti Produk
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-[var(--customer-border)] bg-white p-6 text-center">
                    <p className="text-xs font-bold text-[var(--customer-text-muted)]">
                      Belum ada produk yang dipilih.
                    </p>
                    <button
                      type="button"
                      onClick={openProductModal}
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--customer-accent)] hover:bg-[var(--customer-accent-hover)] text-white text-[10px] font-black rounded-2xl transition shadow-md shadow-[rgba(0,151,178,0.2)] opacity-90"
                    >
                      Pilih Produk Sekarang
                    </button>
                  </div>
                )}
              </div>

              {/* Radix Modal Shell for Product Selection (Reference style: wr1-siakad yudisium modal) */}
              <ModalShell
                open={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                size="4xl"
              >
                <div className="p-4">
                  <h1 className="text-lg font-black text-[var(--customer-primary)] mb-1">Pilih Produk Kinau</h1>
                  <p className="text-xs text-[var(--customer-text-light)] mb-4">
                    Daftar produk berkualitas yang dapat Anda pilih dan konfigurasi untuk pesanan Anda.
                  </p>

                  {/* Filter toolbar */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari nama atau deskripsi produk..."
                        value={modalSearch}
                        onChange={(e) => {
                          setModalSearch(e.target.value);
                          setModalPage(0);
                        }}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-[var(--customer-accent)] focus:border-[var(--customer-accent)] outline-none font-bold"
                      />
                    </div>
                    <div className="relative min-w-[180px]">
                      <select
                        value={modalCategory}
                        onChange={(e) => {
                          setModalCategory(e.target.value);
                          setModalPage(0);
                        }}
                        className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-xs font-bold focus:ring-1 focus:ring-[var(--customer-accent)] focus:border-[var(--customer-accent)] outline-none"
                      >
                        <option value="">Semua Kategori</option>
                        {productCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                    {(modalSearch || modalCategory) && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalSearch("");
                          setModalCategory("");
                          setModalPage(0);
                        }}
                        className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg transition"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-[350px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 w-12 text-center font-semibold text-gray-600 uppercase tracking-wider">
                              Pilih
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider w-16">
                              Foto
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider">
                              Nama Produk
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wider">
                              Kategori
                            </th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-600 uppercase tracking-wider pr-4">
                              Harga Dasar
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {modalPaginatedProducts.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-10 text-center text-gray-400">
                                Tidak ada produk ditemukan
                              </td>
                            </tr>
                          ) : (
                            modalPaginatedProducts.map((product) => {
                              const isChecked = tempSelectedProduct?.id === product.id;
                              return (
                                <tr
                                  key={product.id}
                                  className={cn(
                                    "hover:bg-gray-50 cursor-pointer transition-colors",
                                    isChecked && "bg-[var(--customer-accent-light)]/20"
                                  )}
                                  onClick={() => setTempSelectedProduct(product)}
                                >
                                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="radio"
                                      name="product-select"
                                      className="h-3.5 w-3.5 border-gray-300 text-[var(--customer-accent)] focus:ring-[var(--customer-accent)]"
                                      checked={isChecked}
                                      onChange={() => setTempSelectedProduct(product)}
                                      aria-label={`Pilih ${product.name}`}
                                    />
                                  </td>
                                  <td className="px-3 py-3">
                                    <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-[var(--customer-bg)] border border-[var(--customer-border)]">
                                      {product.image ? (
                                        <img src={product.image} alt="" className="h-full w-full object-cover" />
                                      ) : (
                                        <ProductIcon product={product} />
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 font-semibold text-gray-800">
                                    {product.name}
                                  </td>
                                  <td className="px-3 py-3 text-gray-600">
                                    {product.category ? (
                                      <span className="rounded-full bg-[var(--customer-accent-light)] px-2.5 py-0.5 text-[9px] font-black text-[var(--customer-accent)]">
                                        {product.category}
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="px-3 py-3 text-right font-black text-[var(--customer-primary)] pr-4">
                                    {formatMoney(getProductPrice(product))}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-500">
                      Total: <span className="font-semibold">{modalFilteredProducts.length}</span> produk
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={modalPage === 0}
                        onClick={() => setModalPage((prev) => Math.max(0, prev - 1))}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sebelumnya
                      </button>
                      <span className="text-xs text-gray-600 font-bold">
                        Halaman {modalPage + 1} / {modalTotalPages}
                      </span>
                      <button
                        type="button"
                        disabled={modalPage + 1 >= modalTotalPages}
                        onClick={() => setModalPage((prev) => Math.min(modalTotalPages - 1, prev + 1))}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div>
                      {tempSelectedProduct && (
                        <span className="text-xs text-gray-600 font-bold">
                          Terpilih: <span className="text-[var(--customer-accent)]">{tempSelectedProduct.name}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsProductModalOpen(false)}
                        className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={!tempSelectedProduct}
                        onClick={handleConfirmProduct}
                        className="px-4 py-2 text-xs font-bold text-white bg-[var(--customer-accent)] hover:bg-[var(--customer-accent-hover)] rounded-lg transition disabled:opacity-50"
                      >
                        Pilih Produk
                      </button>
                    </div>
                  </div>
                </div>
              </ModalShell>

              <Field
                label="Jumlah"
                placeholder="100"
                type="number"
                value={quantity}
                onChange={setQuantity}
              />

              {selectedProduct ? (
                <div className="rounded-[22px] bg-[var(--customer-primary)] p-4 text-white shadow-[0_18px_38px_rgba(30,67,76,0.16)]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                    Produk Terpilih
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-sm font-black leading-5">
                        {selectedProduct.name}
                      </h3>
                      <p className="mt-1 text-[10px] font-semibold text-white/70">
                        {Number(quantity) || 0} pcs x {formatMoney(getProductPrice(selectedProduct))}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-black">{formatMoney(subtotal)}</p>
                  </div>
                </div>
              ) : null}

              <DesignPickerSection
                title="Desain ID Card"
                description="Pilih template depan ID Card lalu sesuaikan foto dan teks."
                icon={<IdCard size={18} />}
                templates={idCardTemplates}
                selectedTemplate={selectedIdCardTemplate}
                savedPreview={selectedIdCardTemplate ? savedDesigns[selectedIdCardTemplate.id] : undefined}
                onSelect={(template) => handleSelectTemplate(template, "idcard")}
                onEdit={setEditorTemplate}
              />

              <DesignPickerSection
                title="Desain Lanyard"
                description="Pilih template lanyard dan cek komposisi visual sebelum order."
                icon={<LayoutTemplate size={18} />}
                templates={lanyardTemplates}
                selectedTemplate={selectedLanyardTemplate}
                savedPreview={selectedLanyardTemplate ? savedDesigns[selectedLanyardTemplate.id] : undefined}
                onSelect={(template) => handleSelectTemplate(template, "lanyard")}
                onEdit={setEditorTemplate}
              />
            </div>
          </SectionCard>
        ) : null}

        {activeStep === 1 ? (
          <SectionCard>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
                <User size={18} />
              </span>
              <div>
                <h2 className="text-sm font-black text-[var(--customer-primary)]">
                  Detail Kontak
                </h2>
                <p className="text-[10px] font-semibold text-[var(--customer-text-light)]">
                  Data pemesan dan instansi untuk invoice.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <Field
                label="Nama Pemesan"
                placeholder="Masukkan nama lengkap"
                icon={User}
                value={customerName}
                onChange={setCustomerName}
              />
              <Field
                label="Nomor WhatsApp"
                placeholder="+62 812-0000-0000"
                icon={Phone}
                value={customerPhone}
                onChange={setCustomerPhone}
              />
              
              <div>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[var(--customer-primary)]">
                  Jenis Pemesan
                </span>
                <div className="flex gap-2">
                  {[
                    { val: "perorangan", label: "Perorangan" },
                    { val: "instansi", label: "Instansi" }
                  ].map((opt) => {
                    const active = opt.val === "perorangan" ? instansiMode === "perorangan" : instansiMode !== "perorangan";
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => {
                          if (opt.val === "perorangan") {
                            setInstansiMode("perorangan");
                            setInstansi("");
                            setInstansiId("");
                          } else {
                            if (institutionsHistory.length > 0) {
                              setInstansiMode("existing");
                              setInstansiId(institutionsHistory[0].id);
                              setInstansi(institutionsHistory[0].name);
                            } else {
                              setInstansiMode("new");
                            }
                          }
                        }}
                        className={[
                          "flex-1 min-h-11 rounded-xl text-xs font-black border transition",
                          active
                            ? "bg-[var(--customer-accent-light)] border-[var(--customer-accent)] text-[var(--customer-accent)]"
                            : "bg-white border-[var(--customer-border)] text-[var(--customer-text-light)]"
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {instansiMode !== "perorangan" && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--customer-primary)]">
                      {instansiMode === "existing" ? "Pilih Riwayat Instansi" : "Nama Instansi Baru"}
                    </span>
                    {institutionsHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (instansiMode === "existing") {
                            setInstansiMode("new");
                            setInstansi("");
                            setInstansiId("");
                          } else {
                            setInstansiMode("existing");
                            if (institutionsHistory.length > 0) {
                              setInstansiId(institutionsHistory[0].id);
                              setInstansi(institutionsHistory[0].name);
                            }
                          }
                        }}
                        className="text-[10px] font-black text-[var(--customer-accent)] hover:underline"
                      >
                        {instansiMode === "existing" ? "+ Buat Instansi Baru" : "Pilih dari Riwayat"}
                      </button>
                    )}
                  </div>

                  {instansiMode === "existing" && institutionsHistory.length > 0 ? (
                    <div className="relative">
                      <select
                        value={instansiId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const matched = institutionsHistory.find((item) => item.id === id);
                          setInstansiId(id);
                          setInstansi(matched ? matched.name : "");
                        }}
                        className="w-full min-h-12 rounded-2xl bg-white px-3 text-xs font-bold text-[var(--customer-primary)] shadow-sm ring-1 ring-[var(--customer-border)] outline-none focus:ring-[var(--customer-border-active)]"
                      >
                        <option value="">-- Pilih Riwayat Instansi --</option>
                        {institutionsHistory.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <Field
                      label=""
                      placeholder="Masukkan nama instansi baru"
                      icon={Building2}
                      value={instansi}
                      onChange={setInstansi}
                    />
                  )}
                </div>
              )}

            </div>
          </SectionCard>
        ) : null}

        {activeStep === 2 ? (
          <SectionCard>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
                <Sparkles size={18} />
              </span>
              <div>
                <h2 className="text-sm font-black text-[var(--customer-primary)]">
                  Ringkasan Pesanan
                </h2>
                <p className="text-[10px] font-semibold text-[var(--customer-text-light)]">
                  Periksa estimasi sebelum dikirim ke tim Kinau.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[var(--customer-border)]">
              <div className="flex items-start justify-between gap-4 border-b border-dashed border-[var(--customer-border)] pb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--customer-accent)]">
                    Produk
                  </p>
                  <h3 className="mt-1 text-sm font-black text-[var(--customer-primary)]">
                    {selectedProduct?.name || "Produk belum dipilih"}
                  </h3>
                  <p className="mt-1 text-[10px] font-semibold text-[var(--customer-text-light)]">
                    {Number(quantity) || 0} buah x {formatMoney(getProductPrice(selectedProduct))}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--customer-accent-light)] px-3 py-1 text-[10px] font-black text-[var(--customer-accent)]">
                  Draft
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs font-bold">
                <div className="flex justify-between border-t border-[var(--customer-border)] pt-3 text-sm font-black text-[var(--customer-primary)]">
                  <span>Total Estimasi</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-[var(--customer-bg)] p-3 text-xs font-semibold space-y-1 text-[var(--customer-text-muted)] border border-[var(--customer-border)]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--customer-primary)] pb-1 border-b border-dashed border-[var(--customer-border)]">
                Informasi Pemesan
              </p>
              <div className="flex justify-between mt-1">
                <span>Nama</span>
                <span className="font-bold text-[var(--customer-primary)]">{customerName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>No. WhatsApp</span>
                <span className="font-bold text-[var(--customer-primary)]">{customerPhone || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipe Pemesan</span>
                <span className="font-bold text-[var(--customer-primary)]">
                  {instansiMode === "perorangan" ? "Perorangan" : "Instansi"}
                </span>
              </div>
              {instansiMode !== "perorangan" && instansi && (
                <div className="flex justify-between">
                  <span>Nama Instansi</span>
                  <span className="font-bold text-[var(--customer-primary)]">{instansi}</span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--customer-primary)] mb-1.5">
                  Tujuan Transfer / Metode
                </label>
                <select
                  className="w-full min-h-12 rounded-2xl bg-white px-3 text-xs font-bold text-[var(--customer-primary)] shadow-sm ring-1 ring-[var(--customer-border)] outline-none focus:ring-[var(--customer-border-active)]"
                  value={selectedPaymentMethod}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedPaymentMethod(val);
                    const bankId = Number(val);
                    if (bankId > 0) {
                      const bank = bankList.find((b) => b.id === bankId);
                      setSelectedBankDetails(bank || null);
                    } else {
                      setSelectedBankDetails(null);
                    }
                  }}
                  required
                >
                  <option value="">-- Pilih Rekening / Cara Bayar --</option>
                  {bankList.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.bank_name} - {bank.account_number} ({bank.holder_name})
                    </option>
                  ))}
                  <option value="manual_transfer">Transfer Manual (Lainnya)</option>
                  <option value="cash">Tunai / Cash</option>
                </select>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <h3 className="text-xs font-black text-[var(--customer-primary)]">
                    Bukti Pembayaran
                  </h3>
                  <p className="mt-1 text-[10px] font-semibold leading-4 text-[var(--customer-text-light)]">
                    Upload salah satu sesuai status pembayaran pesanan (DP 50% atau Lunas).
                  </p>
                </div>
                <CustomerPaymentProofUpload
                  kind="dp"
                  amountLabel={formatMoney(Math.ceil(total * 0.5))}
                  value={dpProofUrl}
                  onUploaded={setDpProofUrl}
                />
                <CustomerPaymentProofUpload
                  kind="paid"
                  amountLabel={formatMoney(total)}
                  value={paidProofUrl}
                  onUploaded={setPaidProofUrl}
                />
              </div>
            </div>
          </SectionCard>
        ) : null}

        <div className="sticky bottom-4 grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveStep((step) => Math.max(0, step - 1))}
            className="min-h-12 rounded-2xl bg-white text-xs font-black text-[var(--customer-primary)] shadow-sm ring-1 ring-[var(--customer-border)] disabled:opacity-50"
            disabled={activeStep === 0}
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeStep === steps.length - 1) {
                handleCreateOrder();
                return;
              }

              setActiveStep((step) => Math.min(steps.length - 1, step + 1));
            }}
            disabled={isSubmittingOrder}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--customer-accent),var(--customer-primary))] px-4 text-xs font-black text-white shadow-[0_18px_38px_rgba(0,151,178,0.22)] disabled:opacity-50"
          >
            {isSubmittingOrder ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Mengirim...
              </>
            ) : (
              <>
                {activeStep === steps.length - 1 ? "Kirim Pesanan" : "Lanjut"}
                <ChevronRight size={15} strokeWidth={3} />
              </>
            )}
          </button>
        </div>
      </form>

      {editorTemplate ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--customer-bg)]">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--customer-border)] bg-white px-4 py-3 shadow-sm">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--customer-accent)]">
                Editor Desain
              </p>
              <h2 className="truncate text-sm font-black text-[var(--customer-primary)]">
                {editorTemplate.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setEditorTemplate(null)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--customer-bg)] text-[var(--customer-primary)]"
              aria-label="Tutup editor"
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ClientTwibbonEditorPage
              initialTemplate={editorTemplate as any}
              onClose={() => setEditorTemplate(null)}
              onSaveResult={handleSaveDesign}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

// app/routes/app.product-list.tsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  useActionData,
  useFetcher,
  Form,
  type LoaderFunction,
  type ActionFunction,
} from "react-router";
import type { Product, ProductTier, ProductVariation } from "../types";
import { formatCurrency, parseCurrency } from "../constants";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Tag,
  Upload,
  Eye,
  EyeOff,
  Copy,
  Camera,
  Layers,
  Star,
  Folder,
  LayoutList,
  FolderCog,
  PencilLine,
} from "lucide-react";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/lib/nexus-client";
import { DataTable, type ColumnDef } from "~/components/ui/data-table";
import { Button } from "~/components/ui/button";
import TableHeader from "~/components/table/TableHeader";
import { useModal } from "~/hooks";
import ModalSecond from "~/components/modal/ModalSecond";
import ReactSelect from "react-select";

// ============================================
// TYPES & INTERFACES
// ============================================

interface LoaderData {
  products: Product[];
}

interface ActionData {
  success?: boolean;
  message?: string;
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
  const { user, token }: any = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // --- DELETE ---
  if (intent === "delete") {
    try {
      const id = formData.get("id") as string;
      const response = await API.PRODUCT.update({
        session: { user, token },
        req: {
          body: {
            id,
            deleted_on: new Date().toISOString(),
          },
        },
      });

      if (response.success) {
        return Response.json({
          success: true,
          message: "Produk berhasil dihapus",
        });
      }
      return Response.json(
        { success: false, message: response.message || "Gagal menghapus" },
        { status: 400 }
      );
    } catch (error: any) {
      return Response.json(
        { success: false, message: error.message || "Terjadi kesalahan" },
        { status: 500 }
      );
    }
  }

  // --- CREATE & EDIT ---
  try {
    const data = Object.fromEntries(formData);
    const {
      id,
      name,
      category,
      description,
      image,
      show_in_dashboard,
      product_price_rules,
      product_variants,
      ...tespayload
    } = data as any;

    let price_rules: ProductTier[] = [];
    let variants: ProductVariation[] = [];
    try {
      price_rules = JSON.parse(product_price_rules || "[]");
    } catch (e) { /* ignore */ }
    try {
      variants = JSON.parse(product_variants || "[]");
    } catch (e) { /* ignore */ }

    // Map category to API type - sekarang memakai category_id dari master
    // type di-set dari nama category yang dipilih (backward compat)
    let type = "other";
    if (category === "Paket") type = "package";
    else if (category === "Id Card") type = "id_card";
    else if (category === "Lanyard") type = "lanyard";
    else if (category === "Lainnya") type = "custom";

    const payload = {
      name,
      total_price: price_rules?.length > 0 ? price_rules?.[0].price : 0,
      type,
      category_id: data.category_id || null,
      description,
      image,
      show_in_dashboard,
      price_rules,
      variants: variants?.map((v: any) => ({
        ...v,
        is_default: +v.is_default === 1 ? 1 : 0,
      })),
      ...(+id > 0 ? { id } : {}),
    };

    console.log(+id > 0, id);
    // Use create for both create and update (it handles both)
    let response;
    if (+id > 0) {
      // Update mode
      response = await API.PRODUCT.update({
        session: { user, token },
        req: {
          body: payload,
        },
      });
    } else {
      // Create mode
      response = await API.PRODUCT.create({
        session: { user, token },
        req: {
          body: payload,
        },
      });
    }

    if (response.success) {
      return Response.json({
        success: true,
        message: id
          ? "Produk berhasil diperbarui"
          : "Produk berhasil ditambahkan",
      });
    } else {
      return Response.json(
        { success: false, message: response.message || "Gagal menyimpan" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProductListPage() {
  const actionData = useActionData<ActionData>();

  // Fetch products
  const {
    data: productsData,
    loading: isLoading,
    reload: reloadProducts,
  } = useFetcherData({
    endpoint: nexus()
      .module("PRODUCT")
      .action("get")
      .params({
        page: 0,
        size: 10,
        pagination: "true",
      })
      .build(),
  });

  // Fetcher for actions
  const { data: fetcherData, load: submitAction } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  // Fetch product categories dari master
  const { data: categoryRes } = useFetcherData<any>({
    endpoint: nexus().module("PRODUCT_CATEGORY").action("get").params({ page: 0, size: 50 }).build(),
    autoLoad: true,
  });

  const categoryOptions = useMemo(() => {
    const items = categoryRes?.data?.items || [];
    return items.map((c: any) => ({
      value: c.id,
      label: c.name,
      data: c,
    }));
  }, [categoryRes]);

  const categoryFetcher = useFetcher();

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");

  // ── Category modal state ──
  const [catModal, setCatModal] = useState<{
    open: boolean;
    key?: "create" | "update";
    data?: any;
  }>({ open: false });
  const [driveFolders, setDriveFolders] = useState<string[]>([]);
  const [newFolderInput, setNewFolderInput] = useState("");

  // Sync driveFolders saat catModal dibuka
  useEffect(() => {
    if (catModal?.open) {
      const raw = catModal?.data?.default_drive_folders;
      let folders: string[] = [];
      if (Array.isArray(raw)) folders = raw;
      else if (raw) { try { folders = JSON.parse(raw); } catch { folders = []; } }
      setDriveFolders(folders);
      setNewFolderInput("");
    }
  }, [catModal?.open, catModal?.data?.id]);

  const addCatFolder = () => {
    const t = newFolderInput.trim();
    if (!t || driveFolders.includes(t)) return;
    setDriveFolders(prev => [...prev, t]);
    setNewFolderInput("");
  };

  // ========== STATE ==========
  const [modal, setModal] = useModal<any>();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== DATA MAPPING ==========
  const products: Product[] = useMemo(() => {
    if (!productsData?.data?.items) return [];

    return (productsData.data.items || []).map((p: any) => {
      let category: any = "Lainnya";
      if (p.type === "package") category = "Paket";
      else if (p.type === "id_card") category = "Id Card";
      else if (p.type === "lanyard") category = "Lanyard";
      else if (p.type === "custom") category = "Lainnya";

      return {
        id: p.id,
        name: p.name || "",
        price: p.total_price || 0,
        category: category,
        category_id: p.category_id || null,
        description: p.description || "",
        image: p.image || "",
        show_in_dashboard: p.show_in_dashboard ?? 0,
        product_price_rules: p.product_price_rules ? JSON.parse(p.product_price_rules) : [],
        product_variants: p.product_variants ? JSON.parse(p.product_variants) : [],
      };
    });
  }, [productsData]);


  // ========== EFFECTS ==========
  const handleSuccess = (msg: string) => {
    toast.success(msg);
    reloadProducts();
  };

  const handleError = (msg: string) => {
    toast.error(msg);
  };

  useEffect(() => {
    if (actionData?.success) {
      handleSuccess(actionData.message || "Berhasil");
    } else if (actionData?.success === false) {
      handleError(actionData.message || "Gagal");
    }
  }, [actionData]);

  useEffect(() => {
    if (fetcherData?.success) {
      handleSuccess(fetcherData.message || "Berhasil");
    } else if (fetcherData?.success === false) {
      handleError(fetcherData.message || "Gagal");
    }
  }, [fetcherData]);

  // ========== HANDLERS ==========

  const handleOpenEdit = (p: Product) => {
    setModal({
      open: true,
      type: "update",
      data: {
        ...p,
        product_price_rules: p.product_price_rules || [],
        product_variants: p.product_variants || [],
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // const formData = new FormData(e.currentTarget);
    // const name = formData.get("name") as string;

    submitAction({
      id: modal.data?.id || 0,
      name: modal.data?.name,
      category: modal.data?.category || "Paket",
      category_id: modal.data?.category_id || "",
      description: modal.data?.description,
      image: modal.data?.image,
      show_in_dashboard: +(modal?.data?.show_in_dashboard ?? 1) ? 1 : 0,
      product_price_rules: JSON.stringify(modal?.data?.product_price_rules || []),
      product_variants: JSON.stringify(modal?.data?.product_variants || []),
    });
    setModal({
      open: false,
      type: undefined,
      data: undefined,
    });
  };

  const handleDelete = (id: string, productName: string) => {
    Swal.fire({
      title: "Hapus Produk?",
      text: `Yakin ingin menghapus ${productName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      customClass: {
        confirmButton: "bg-red-600 text-white",
        cancelButton: "bg-gray-200 text-gray-800",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        submitAction({ intent: "delete", id });
      }
    });
  };

  const handleDuplicate = (product: Product) => {
    submitAction({
      intent: "create",
      name: product.name + " (Copy)",
      category: product.category,
      category_id: (product as any).category_id || "",
      description: product.description || "",
      image: product.image || "",
      show_in_dashboard: +(product?.show_in_dashboard ?? 1) ? 1 : 0,
      product_price_rules: JSON.stringify(product.product_price_rules || []),
      product_variants: JSON.stringify(product.product_variants || []),
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setIsUploadingImage(true);
        const file = e.target.files[0];
        const response = await API.ASSET.upload(file);
        setModal({
          ...modal,
          data: { ...modal?.data, image: response.url },
        });
      } catch (error) {
        toast.error("Gagal mengupload gambar");
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  // --- Tier Logic ---
  const addTier = () => {
    setModal({
      ...modal,
      data: {
        ...modal?.data,
        product_price_rules: [
          ...(modal?.data?.product_price_rules ?? []),
          { min_qty: 0, price: 0 },
        ],
      },
    });
  };

  const updateTier = (idx: number, field: "min_qty" | "price", val: number) => {
    const copy = [...modal?.data?.product_price_rules];
    copy[idx] = { ...copy[idx], [field]: val };
    setModal({
      ...modal,
      data: {
        ...modal?.data,
        product_price_rules: copy,
      },
    });
  };
  const removeTier = (idx: number) =>
    setModal({
      ...modal,
      data: {
        ...modal?.data,
        product_price_rules: modal?.data?.product_price_rules?.filter(
          (_: any, i: number) => i !== idx
        ),
      },
    });

  // --- Variation Logic ---
  const addVariation = () =>
    setModal({
      ...modal,
      data: {
        ...modal?.data,
        product_variants: [
          ...modal?.data?.product_variants,
          { variant_name: "", base_price: 0, is_default: false },
        ],
      },
    });
  const updateVariation = (
    idx: number,
    field: "variant_name" | "base_price" | "is_default",
    val: string | number | boolean
  ) => {
    const copy = [...modal?.data?.product_variants];

    if (field === "is_default") {
      // If setting as default, uncheck others
      copy.forEach((v, i) => {
        // @ts-ignore
        v.is_default = i === idx ? val : false;
      });
    } else {
      // @ts-ignore
      copy[idx] = { ...copy[idx], [field]: val };
    }

    setModal({
      ...modal,
      data: {
        ...modal?.data,
        product_variants: copy,
      },
    });
  };
  const removeVariation = (idx: number) =>
    setModal({
      ...modal,
      data: {
        ...modal?.data,
        product_variants: modal?.data?.product_variants.filter(
          (_: any, i: number) => i !== idx
        ),
      },
    });

  // Column definitions for DataTable
  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Produk",
        cellClassName:
          "whitespace-nowrap text-xs text-gray-600 min-w-[180px] font-medium",
        cell: (row) => (
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden">
              {row.image && row.image !== "undefined" ? (
                <img
                  src={row.image}
                  className="w-full h-full object-cover"
                  alt="row"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Tag size={20} />
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base">
                {row.name}
              </div>
              {row?.description !== "undefined" && !!row?.description ? (
                <div className="text-xs text-gray-500 mt-1 max-w-xs">
                  {row?.description || ""}
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
        ),
      },
      {
        key: "price_variant",
        header: "Detail Harga & Variasi",
        cellClassName: "max-w-[180px]",
        cell: (row) => (
          <>
            <div className="flex flex-col gap-2">
              {/* Tiers */}
              {row.product_price_rules &&
                row.product_price_rules?.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    Grosir
                  </span>
                  {row.product_price_rules?.map((t: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs bg-gray-100 px-2 py-1 rounded w-48"
                    >
                      <span className="text-gray-600">≥ {t.min_qty} pcs</span>
                      <span className="font-bold text-gray-800">
                        {formatCurrency(t.price)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">
                  Tidak ada aturan grosir
                </span>
              )}

              {/* Variations */}
              {row.product_variants && row.product_variants?.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[10px] font-bold text-blue-400 uppercase">
                    Variasi
                  </span>
                  {row.product_variants.map((v: any, idx: number) => (
                    <div
                      key={idx}
                      className={`flex justify-between items-center text-xs px-2 py-1 rounded w-48 border ${+v?.is_default === 1
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-blue-50 border-blue-100"
                        }`}
                    >
                      <div className="flex items-center gap-1">
                        {+v?.is_default === 1 && (
                          <Star size={10} className="text-yellow-500 fill-yellow-500" />
                        )}
                        <span
                          className={
                            +v?.is_default === 1 ? "text-yellow-700 font-medium" : "text-blue-700"
                          }
                        >
                          {v.variant_name}
                        </span>
                      </div>
                      <span
                        className={`font-bold ${+v?.is_default === 1 ? "text-yellow-800" : "text-blue-800"
                          }`}
                      >
                        +{formatCurrency(v.base_price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ),
      },
      {
        key: "show_in_dashboard",
        header: "Tampil?",
        headerClassName: "text-center",
        cellClassName: "max-w-[150px]",
        cell: (row) =>
          +(row.show_in_dashboard ?? 0) > 0 ? (
            <Eye size={18} className="text-blue-500 mx-auto" />
          ) : (
            <EyeOff size={18} className="text-gray-300 mx-auto" />
          ),
      },
      {
        key: "aksi",
        header: "Aksi",
        headerClassName: "text-center",
        cellClassName: "text-center",
        cell: (row) => (
          <div className="flex justify-center gap-2 relative">
            <Button
              onClick={() => handleOpenEdit(row)}
              className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              title="Edit"
            >
              <Edit2 size={16} />
            </Button>
            <Button
              onClick={() => handleDuplicate(row)}
              className="text-orange-600 hover:text-orange-800 p-1.5 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
              title="Duplikat"
            >
              <Copy size={16} />
            </Button>
            <Button
              onClick={() => handleDelete(row.id, row.name)}
              className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition"
              title="Hapus"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── TABS HEADER ── */}
      <div className="flex border-b border-gray-200 px-4 pt-3 gap-1">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all ${activeTab === "products"
            ? "border-blue-600 text-blue-600 bg-blue-50"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
        >
          <LayoutList size={15} />
          Daftar Produk
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all ${activeTab === "categories"
            ? "border-blue-600 text-blue-600 bg-blue-50"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
        >
          <FolderCog size={15} />
          Kategori Produk
        </button>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* TAB: DAFTAR PRODUK */}
      {/* ═══════════════════════════════════════ */}
      {activeTab === "products" && (
        <>
          <TableHeader
            title="Daftar Produk"
            description="Atur jenis barang dan aturan harga."
            buttonText="Tambah Produk"
            onClick={() => {
              setModal({
                open: true,
                type: "create",
                data: {
                  product_price_rules: [],
                  product_variants: [],
                },
              });
            }}
            buttonIcon={Plus}
          />
          <DataTable
            columns={columns}
            data={products}
            getRowKey={(product, _index) => product.id}
            rowClassName={(product) =>
              +(product.show_in_dashboard || 0) > 0 ? "bg-green-50/30" : ""
            }
            emptyMessage="Belum ada produk."
            minHeight="400px"
          />
        </>
      )}

      {modal?.type === "create" || modal?.type === "update" ? (
        <ModalSecond
          open={modal?.open}
          onClose={() => setModal({ ...modal, open: false })}
          title={modal?.data?.id ? "Edit Produk" : "Tambah Produk Baru"}
          size="xl"
        >
          <div className="flex flex-col h-full">
            {" "}
            {/* Added missing wrapping div */}
            <div className="p-6 overflow-y-auto flex-1">
              <form
                id="productForm"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nama Produk
                    </label>
                    <input
                      className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={modal?.data?.name}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          data: { ...modal?.data, name: e.target.value },
                        })
                      }
                      placeholder="Contoh: Paket Premium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Gambar Produk
                    </label>
                    <div className="flex gap-2 items-center">
                      {isUploadingImage ? (
                        <div className="flex items-center gap-2 p-2 border border-blue-300 bg-blue-50 rounded text-xs text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                          <span>Uploading...</span>
                        </div>
                      ) : modal?.data?.image &&
                        modal.data.image !== "undefined" ? (
                        <div className="relative w-10 h-10 group">
                          <img
                            src={modal?.data?.image}
                            className="w-full h-full object-cover rounded border"
                            alt="Preview"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setModal({
                                ...modal,
                                data: { ...modal?.data, image: "" },
                              })
                            }
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 border border-gray-300 bg-white rounded text-xs text-gray-500 hover:bg-gray-50 flex items-center gap-1"
                        >
                          <Upload size={14} /> Upload
                        </button>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                      />
                    </div>
                  </div>
                </div>

                {/* KATEGORI PRODUK - dropdown dari master */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kategori Produk
                  </label>
                  <ReactSelect
                    options={categoryOptions}
                    value={categoryOptions.find(
                      (o: any) => o.value === modal?.data?.category_id
                    ) || null}
                    onChange={(opt: any) => {
                      setModal({
                        ...modal,
                        data: {
                          ...modal?.data,
                          category_id: opt?.value || null,
                          // derive folder info hint from category
                          _categoryData: opt?.data || null,
                        },
                      });
                    }}
                    placeholder="Pilih kategori produk..."
                    isClearable
                    className="text-sm"
                    classNamePrefix="rselect"
                    noOptionsMessage={() => "Tidak ada kategori"}
                  />
                  {/* Folder drive preview dari kategori terpilih */}
                  {(() => {
                    const folders: string[] = (() => {
                      const raw = modal?.data?._categoryData?.default_drive_folders;
                      if (!raw) return [];
                      if (Array.isArray(raw)) return raw;
                      try { return JSON.parse(raw); } catch { return []; }
                    })();
                    if (folders.length === 0) return null;
                    return (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className="text-[10px] text-gray-400 w-full">Folder drive otomatis:</span>
                        {folders.map((f: string, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-600 text-[10px] rounded-full">
                            <Folder size={9} /> {f}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                {/* DESKRIPSI */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    className="w-full border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={2}
                    value={modal?.data?.description}
                    onChange={(e) =>
                      setModal({
                        ...modal,
                        data: { ...modal?.data, description: e.target.value },
                      })
                    }
                    placeholder="Deskripsi singkat..."
                  />
                </div>

                {/* ATURAN HARGA - TIERS */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                      Aturan Harga (Grosir)
                    </label>
                    <button
                      type="button"
                      onClick={addTier}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Tambah Aturan
                    </button>
                  </div>
                  {modal?.data?.product_price_rules?.length === 0 && (
                    <p className="text-xs text-gray-400 italic">
                      Belum ada aturan harga.
                    </p>
                  )}
                  {modal?.data?.product_price_rules?.map(
                    (tier: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex gap-2 mb-2 items-center bg-white p-2 rounded border border-gray-100 shadow-sm"
                      >
                        <span className="text-xs text-gray-500">Min Qty:</span>
                        <input
                          type="number"
                          className="w-20 border rounded p-1 text-sm text-center"
                          value={tier.min_qty}
                          onChange={(e) =>
                            updateTier(idx, "min_qty", Number(e.target.value))
                          }
                        />
                        <span className="text-xs text-gray-500 mx-2">
                          Harga:
                        </span>
                        <input
                          type="number"
                          className="w-32 border rounded p-1 text-sm font-bold text-right"
                          value={tier.price}
                          onChange={(e) =>
                            updateTier(idx, "price", Number(e.target.value))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => removeTier(idx)}
                          className="text-red-500 ml-auto p-1 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  )}
                </div>

                {/* VARIASI PRODUK */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-blue-800 uppercase tracking-wide flex items-center gap-1">
                      <Layers size={14} /> Variasi Produk
                    </label>
                    <button
                      type="button"
                      onClick={addVariation}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Tambah Variasi
                    </button>
                  </div>
                  {modal?.data?.product_variants.length === 0 && (
                    <p className="text-xs text-blue-400 italic">
                      Tidak ada variasi.
                    </p>
                  )}
                  {modal?.data?.product_variants.map((v: any, idx: number) => (
                    <div
                      key={idx}
                      className={`flex gap-2 mb-2 items-center bg-white p-2 rounded border shadow-sm ${+v?.is_default === 1
                        ? "border-yellow-300 bg-yellow-50"
                        : "border-blue-100"
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          updateVariation(idx, "is_default", +!v.is_default)
                        }
                        className={`p-1 rounded ${+v?.is_default === 1
                          ? "text-yellow-500 hover:text-yellow-600"
                          : "text-gray-300 hover:text-yellow-500"
                          }`}
                        title={
                          +v?.is_default === 1
                            ? "Variasi Default"
                            : "Jadikan Default"
                        }
                      >
                        <Star
                          size={16}
                          fill={+v?.is_default === 1 ? "currentColor" : "none"}
                        />
                      </button>
                      <input
                        type="text"
                        className="flex-1 border-blue-200 rounded p-1 text-sm"
                        placeholder="Nama Variasi"
                        value={v.variant_name}
                        onChange={(e) =>
                          updateVariation(idx, "variant_name", e.target.value)
                        }
                      />
                      <span className="text-xs text-blue-500 whitespace-nowrap">
                        + Harga
                      </span>
                      <div className="relative w-32">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                          Rp
                        </span>
                        <input
                          type="number"
                          className="w-full border-blue-200 rounded p-1 pl-6 text-sm font-bold text-gray-800"
                          value={v.base_price}
                          onChange={(e) =>
                            updateVariation(
                              idx,
                              "base_price",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariation(idx)}
                        className="text-red-500 ml-auto p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>


                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded text-blue-600 focus:ring-blue-500"
                      checked={+(modal?.data?.show_in_dashboard ?? 1) > 0}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          data: {
                            ...modal?.data,
                            show_in_dashboard:
                              +(modal?.data?.show_in_dashboard ?? 0) > 0
                                ? 1
                                : 0,
                          },
                        })
                      }
                    />
                    <span>Tampilkan di Dashboard / Landing Page</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setModal({ ...modal, open: false })}
                className="bg-white border border-gray-300 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Batal
              </Button>
              <Button
                type="submit"
                form="productForm"
                className="bg-blue-600 text-white py-2 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
              >
                {modal?.data?.id ? "Simpan Perubahan" : "Simpan Produk"}
              </Button>
            </div>
          </div>{" "}
          {/* Closing the added wrapping div */}
        </ModalSecond>
      ) : (
        ""
      )}
      {/* ═══════════════════════════════════════ */}
      {/* TAB: KATEGORI PRODUK */}
      {/* ═══════════════════════════════════════ */}
      {activeTab === "categories" && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Kategori Produk</h3>
              <p className="text-xs text-gray-400 mt-0.5">Atur kategori dan folder drive default per kategori.</p>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-1.5"
              onClick={() => setCatModal({ open: true, key: "create", data: null })}
            >
              <Plus size={15} /> Kategori Baru
            </Button>
          </div>

          {/* Category Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 w-10">#</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Nama</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Deskripsi</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500">Folder Drive Default</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(categoryRes?.data?.items || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-300 text-xs py-12 italic">
                      Belum ada kategori produk.
                    </td>
                  </tr>
                )}
                {(categoryRes?.data?.items || []).map((cat: any, idx: number) => {
                  const folders: string[] = (() => {
                    const raw = cat?.default_drive_folders;
                    if (!raw) return [];
                    if (Array.isArray(raw)) return raw;
                    try { return JSON.parse(raw); } catch { return []; }
                  })();
                  return (
                    <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{cat.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{cat.description || "-"}</td>
                      <td className="px-4 py-3">
                        {folders.length === 0 ? (
                          <span className="text-xs text-gray-300 italic">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {folders.map((f: string, i: number) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-medium rounded-full">
                                <Folder size={9} /> {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"
                            onClick={() => setCatModal({ open: true, key: "update", data: cat })}
                          >
                            <PencilLine size={14} />
                          </Button>
                          <Button
                            className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg"
                            onClick={async () => {
                              const result = await Swal.fire({
                                title: "Hapus Kategori?",
                                text: `Yakin hapus "${cat.name}"?`,
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonText: "Hapus",
                                cancelButtonText: "Batal",
                                customClass: { confirmButton: "bg-red-600 text-white", cancelButton: "bg-gray-200 text-gray-800" },
                              });
                              if (result.isConfirmed) {
                                categoryFetcher.submit(
                                  { id: cat.id, deleted_on: new Date().toISOString() },
                                  { method: "delete", action: "/app/product/category" }
                                );
                                toast.success(`Kategori "${cat.name}" dihapus`);
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Category Modal */}
          {catModal.open && (
            <ModalSecond
              open={catModal.open}
              onClose={() => setCatModal({ open: false })}
              title={catModal.key === "create" ? "Tambah Kategori Produk" : "Edit Kategori Produk"}
              size="md"
            >
              <div className="flex flex-col h-full">
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                  {/* Hidden field for drive folders — controlled by state */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nama Kategori</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={catModal.data?.name || ""}
                      onChange={(e) => setCatModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                      placeholder="Contoh: Paket Wisuda"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={catModal.data?.description || ""}
                      onChange={(e) => setCatModal(prev => ({ ...prev, data: { ...prev.data, description: e.target.value } }))}
                      placeholder="Deskripsi singkat (opsional)"
                    />
                  </div>

                  {/* Folder Drive Default */}
                  <div>
                    <label className="block text-xs font-bold text-amber-700 mb-1 flex items-center gap-1">
                      <Folder size={12} /> Folder Drive Default
                    </label>
                    <p className="text-[10px] text-gray-400 mb-2">Otomatis dibuat di Drive saat pesanan dengan kategori ini diterima.</p>
                    {driveFolders.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-amber-50 border border-amber-100 rounded-lg mb-2">
                        {driveFolders.map((f, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-200 text-amber-800 text-xs font-medium rounded-full shadow-sm">
                            <Folder size={10} className="text-amber-400" />
                            {f}
                            <button type="button" onClick={() => setDriveFolders(prev => prev.filter((_, i) => i !== idx))} className="ml-0.5 text-amber-300 hover:text-red-500">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-amber-400 outline-none"
                        placeholder="Nama folder baru... (tekan Enter)"
                        value={newFolderInput}
                        onChange={e => setNewFolderInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCatFolder(); } }}
                      />
                      <Button type="button" className="px-3 border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50" onClick={addCatFolder}>
                        <Plus size={14} />
                      </Button>
                    </div>
                    {driveFolders.length === 0 && <p className="text-xs text-gray-300 italic mt-1">Belum ada folder default.</p>}
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                  <Button
                    type="button"
                    onClick={() => setCatModal({ open: false })}
                    className="bg-white border border-gray-300 text-gray-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    className="bg-blue-600 text-white py-2 px-6 rounded-lg text-sm font-medium hover:bg-blue-700"
                    onClick={() => {
                      if (!catModal.data?.name?.trim()) { toast.error("Nama kategori wajib diisi"); return; }
                      const body: any = {
                        name: catModal.data?.name,
                        description: catModal.data?.description || "",
                        default_drive_folders: JSON.stringify(driveFolders),
                      };
                      if (catModal.key === "update") body.id = catModal.data?.id;
                      categoryFetcher.submit(body, { method: "post", action: "/app/product/category" });
                      setCatModal({ open: false });
                      toast.success(catModal.key === "create" ? "Kategori berhasil ditambahkan" : "Kategori berhasil diperbarui");
                    }}
                  >
                    Simpan
                  </Button>
                </div>
              </div>
            </ModalSecond>
          )}
        </>
      )}
    </div>
  );
}
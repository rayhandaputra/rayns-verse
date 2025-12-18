// app/routes/app.product-list.tsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  useActionData,
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
  const { user, token } = await requireAuth(request);
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
    } catch (e) {
      /* ignore */
    }
    try {
      variants = JSON.parse(product_variants || "[]");
    } catch (e) {
      /* ignore */
    }

    // Map category to API type
    let type = "other";
    if (category === "Paket") type = "package";
    else if (category === "Id Card") type = "id_card";
    else if (category === "Lanyard") type = "lanyard";
    else if (category === "Lainnya") type = "custom";

    const payload = {
      name,
      total_price: price_rules?.length > 0 ? price_rules?.[0].price : 0,
      type,
      description,
      image,
      show_in_dashboard,
      price_rules,
      variants,
      ...(+id > 0 ? { id } : {}),
    };

    console.log(payload);

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

  // ========== STATE ==========
  const [modal, setModal] = useModal<any>();
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
        description: p.description || "",
        image: p.image || "",
        show_in_dashboard: p.show_in_dashboard ?? 0,

        product_price_rules: p.product_price_rules
          ? JSON.parse(p.product_price_rules)
          : [],
        product_variants: p.product_variants
          ? JSON.parse(p.product_variants)
          : [],
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
      description: modal.data?.description,
      image: modal.data?.image,
      show_in_dashboard: modal.data?.show_in_dashboard,
      product_price_rules: JSON.stringify(
        modal?.data?.product_price_rules || []
      ),
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
      description: product.description || "",
      image: product.image || "",
      show_in_dashboard: +(product?.show_in_dashboard ?? 0) ? 1 : 0,
      product_price_rules: JSON.stringify(product.product_price_rules || []),
      product_variants: JSON.stringify(product.product_variants || []),
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const response = await API.ASSET.upload(file);
      setModal({
        ...modal,
        data: { ...modal?.data, image: response.url },
      });
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
          { variant_name: "", base_price: 0 },
        ],
      },
    });
  const updateVariation = (
    idx: number,
    field: "variant_name" | "base_price",
    val: string | number
  ) => {
    const copy = [...modal?.data?.product_variants];
    // @ts-ignore
    copy[idx] = { ...copy[idx], [field]: val };
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
              {row.description && (
                <div className="text-xs text-gray-500 mt-1 max-w-xs">
                  {row.description}
                </div>
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
                      className="flex justify-between items-center text-xs bg-blue-50 px-2 py-1 rounded w-48 border border-blue-100"
                    >
                      <span className="text-blue-700">{v.variant_name}</span>
                      <span className="font-bold text-blue-800">
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

      {/* DataTable */}
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
                      {modal?.data?.image &&
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
                      />
                    </div>
                  </div>
                </div>

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
                      className="flex gap-2 mb-2 items-center bg-white p-2 rounded border border-blue-100 shadow-sm"
                    >
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

                {/* SHOW IN DASHBOARD */}
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded text-blue-600 focus:ring-blue-500"
                      checked={+modal?.data?.show_in_dashboard > 0}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          data: {
                            ...modal?.data,
                            show_in_dashboard:
                              +modal?.data?.show_in_dashboard > 0 ? 0 : 1,
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
    </div>
  );
}

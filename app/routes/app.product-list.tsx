// app/routes/app.product-list.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  useLoaderData,
  useActionData,
  Form,
  useFetcher,
  type LoaderFunction,
  type ActionFunction,
} from "react-router";
import type { Product, ProductTier } from "../types";
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
} from "lucide-react";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";
import Swal from "sweetalert2";

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
  const { user, token } = await requireAuth(request);

  const response = await API.PRODUCT.get({
    session: { user, token },
    req: {
      query: {
        page: 0,
        size: 100,
        pagination: "true",
      },
    },
  });

  // Fetch price rules for all products in parallel using Promise.all
  const productIds = (response.items || []).map((p: any) => p.id);

  const priceRulesPromises = productIds.map((productId: string) =>
    API.PRODUCT_PRICE_RULES.getTieredPricing({
      session: { user, token },
      req: {
        query: { product_id: productId },
      },
    }).then((priceRulesRes) => ({
      productId,
      tiers: priceRulesRes.success && priceRulesRes.tiers
        ? priceRulesRes.tiers.map((tier: any) => ({
            minQty: tier.min_qty,
            price: tier.price,
          }))
        : [],
    }))
  );

  // Wait for all price rules to be fetched
  const priceRulesResults = await Promise.all(priceRulesPromises);

  // Convert array to object for easy lookup
  const allPriceRules: Record<string, ProductTier[]> = {};
  priceRulesResults.forEach(({ productId, tiers }) => {
    allPriceRules[productId] = tiers;
  });

  // Map API products to UI Product interface
  const mappedProducts = (response.items || []).map((p: any) => {
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
      showInDashboard: p.show_in_dashboard ?? false,
      show_in_dashboard: p.show_in_dashboard ?? false,
      wholesalePrices: allPriceRules[p.id] || [], // ✅ Load from product_price_rules table
    };
  });

  return {
    products: mappedProducts,
  };
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
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as string;
    const showInDashboard = +(formData.get("showInDashboard") ?? 0) === 1;
    const tiersStr = formData.get("tiers") as string;

    let tiers: ProductTier[] = [];
    try {
      tiers = JSON.parse(tiersStr || "[]");
    } catch (e) {
      /* ignore */
    }

    // Map category to API type
    let type = "other";
    if (category === "Paket") type = "package";
    else if (category === "Id Card") type = "id_card";
    else if (category === "Lanyard") type = "lanyard";
    else if (category === "Lainnya") type = "custom";

    // Base price from first tier or 0
    const basePrice = tiers.length > 0 ? tiers[0].price : 0;

    // ✅ Map tiers to price_rules format for API
    const price_rules = tiers.map((tier) => ({
      min_qty: tier.minQty,
      price: tier.price,
    }));

    const payload = {
      name,
      total_price: basePrice,
      type,
      description,
      image,
      show_in_dashboard: showInDashboard,
      price_rules, // ✅ Use price_rules instead of wholesale_prices
      ...(id ? { id } : {}),
    };

    // Use create for both create and update (it handles both)
    let response;
    if (id) {
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
  const { products = [] } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const fetcher = useFetcher();

  // ========== STATE ==========
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Product | null>(null);

  // New Product State
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newShow, setNewShow] = useState(true);
  const [newTiers, setNewTiers] = useState<ProductTier[]>([]);

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // ========== EFFECTS ==========
  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Berhasil");
      setShowAdd(false);
      setNewName("");
      setNewDesc("");
      setNewImage("");
      setNewShow(true);
      setNewTiers([]);
      setIsEditing(null);
      setEditForm(null);
    } else if (actionData?.success === false) {
      toast.error(actionData.message || "Gagal");
    }
  }, [actionData]);

  useEffect(() => {
    if (fetcher.data?.success) {
      toast.success(fetcher.data.message || "Berhasil");
    } else if (fetcher.data?.success === false) {
      toast.error(fetcher.data.message || "Gagal");
    }
  }, [fetcher.data]);

  // ========== HANDLERS ==========
  const handleEdit = (p: Product) => {
    setIsEditing(p.id);
    setEditForm({ ...p, wholesalePrices: p.wholesalePrices || [] });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;

    const formData = new FormData();
    formData.append("intent", "edit");
    formData.append("id", editForm.id);
    formData.append("name", editForm.name);
    formData.append("category", editForm.category);
    formData.append("description", editForm.description || "");
    formData.append("image", editForm.image || "");
    formData.append(
      "showInDashboard",
      String(editForm.showInDashboard ?? false)
    );
    formData.append("tiers", JSON.stringify(editForm.wholesalePrices || []));

    fetcher.submit(formData, { method: "post" });
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: "Hapus Produk?",
      text: `Yakin ingin menghapus ${name}?`,
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
        fetcher.submit({ intent: "delete", id }, { method: "post" });
      }
    });
  };

  const handleDuplicate = (product: Product) => {
    const formData = new FormData();
    formData.append("intent", "create");
    formData.append("name", product.name + " (Copy)");
    formData.append("category", product.category);
    formData.append("description", product.description || "");
    formData.append("image", product.image || "");
    formData.append(
      "showInDashboard",
      String(product.showInDashboard ?? false)
    );
    formData.append("tiers", JSON.stringify(product.wholesalePrices || []));

    fetcher.submit(formData, { method: "post" });
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        if (isEdit && editForm) {
          setEditForm({ ...editForm, image: res });
        } else {
          setNewImage(res);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const formData = new FormData();
    formData.append("intent", "create");
    formData.append("name", newName);
    formData.append("category", "Paket"); // Default category
    formData.append("description", newDesc);
    formData.append("image", newImage);
    formData.append("showInDashboard", String(newShow));
    formData.append("tiers", JSON.stringify(newTiers));

    fetcher.submit(formData, { method: "post" });
  };

  // ========== TIER HANDLERS ==========
  // Add Form Tiers
  const addTier = () => setNewTiers([...newTiers, { minQty: 0, price: 0 }]);
  const updateTier = (
    index: number,
    field: "minQty" | "price",
    val: number
  ) => {
    const copy = [...newTiers];
    copy[index] = { ...copy[index], [field]: val };
    setNewTiers(copy);
  };
  const removeTier = (index: number) =>
    setNewTiers(newTiers.filter((_, i) => i !== index));

  // Edit Form Tiers
  const editAddTier = () =>
    editForm &&
    setEditForm({
      ...editForm,
      wholesalePrices: [
        ...(editForm.wholesalePrices || []),
        { minQty: 0, price: 0 },
      ],
    });

  const editUpdateTier = (
    index: number,
    field: "minQty" | "price",
    val: number
  ) => {
    if (!editForm) return;
    const copy = [...(editForm.wholesalePrices || [])];
    copy[index] = { ...copy[index], [field]: val };
    setEditForm({ ...editForm, wholesalePrices: copy });
  };

  const editRemoveTier = (index: number) =>
    editForm &&
    setEditForm({
      ...editForm,
      wholesalePrices: (editForm.wholesalePrices || []).filter(
        (_, i) => i !== index
      ),
    });

  // ========== RENDER ==========
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Daftar Produk</h2>
          <p className="text-gray-500 text-sm">
            Atur jenis barang dan aturan harga.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {/* ADD FORM */}
      {showAdd && (
        <div className="p-6 bg-blue-50 border-b border-blue-100 animate-fade-in">
          <h3 className="text-sm font-bold text-blue-800 mb-3">
            Tambah Produk Baru
          </h3>
          <form
            onSubmit={handleAdd}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start"
          >
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Nama Produk
              </label>
              <input
                className="w-full border-gray-300 rounded-lg p-2 text-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Contoh: Paket Premium"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Gambar Produk
              </label>
              <div className="flex gap-2 items-center">
                {newImage ? (
                  <div className="relative w-10 h-10">
                    <img
                      src={newImage}
                      className="w-full h-full object-cover rounded border"
                      alt="Product"
                    />
                    <button
                      type="button"
                      onClick={() => setNewImage("")}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X size={8} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => addFileInputRef.current?.click()}
                    className="p-2 border border-gray-300 bg-white rounded text-xs text-gray-500 hover:bg-gray-50"
                  >
                    <Upload size={14} />
                  </button>
                )}
                <input
                  type="file"
                  className="hidden"
                  ref={addFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, false)}
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Keterangan (Opsional)
              </label>
              <input
                className="w-full border-gray-300 rounded-lg p-2 text-sm"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Deskripsi singkat..."
              />
            </div>

            {/* ATURAN HARGA */}
            <div className="md:col-span-4 bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  ATURAN HARGA
                </label>
                <button
                  type="button"
                  onClick={addTier}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Tambah Aturan
                </button>
              </div>
              {newTiers.length === 0 && (
                <p className="text-xs text-gray-400 italic">
                  Belum ada aturan harga. Produk ini akan gratis jika tidak
                  diatur.
                </p>
              )}
              {newTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="flex gap-2 mb-2 items-center bg-gray-50 p-2 rounded border border-gray-100"
                >
                  <span className="text-xs text-gray-500">Minimal Qty:</span>
                  <input
                    type="number"
                    className="w-20 border rounded p-1 text-sm text-center"
                    value={tier.minQty}
                    onChange={(e) =>
                      updateTier(idx, "minQty", Number(e.target.value))
                    }
                  />
                  <span className="text-xs text-gray-500 mx-2">
                    Harga Satuan:
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
                    className="text-red-500 ml-auto p-1 bg-white rounded border hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* SHOW IN DASHBOARD */}
            <div className="md:col-span-4 flex gap-4 items-center mt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500"
                  checked={newShow}
                  onChange={(e) => setNewShow(e.target.checked)}
                />
                <span>Tampilkan di Dashboard / Landing Page</span>
              </label>
            </div>

            {/* BUTTONS */}
            <div className="md:col-span-4 flex gap-2 justify-end mt-4 pt-4 border-t border-blue-200">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="bg-white border border-gray-300 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-6 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Simpan Produk
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRODUCT TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-6 py-3 w-1/3">Produk</th>
              <th className="px-6 py-3 w-1/3">Aturan Harga</th>
              <th className="px-6 py-3 text-center">Tampil</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  Belum ada produk. Klik 'Tambah Produk' untuk menambahkan.
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                {isEditing === product.id && editForm ? (
                  <>
                    {/* EDIT MODE - PRODUCT INFO */}
                    <td className="px-6 py-3 align-top">
                      <div className="flex gap-2 items-start flex-col">
                        <div className="flex gap-2 w-full">
                          {/* Editable Image Area */}
                          <div
                            className="w-16 h-16 flex-shrink-0 relative bg-gray-100 rounded-lg border border-gray-300 cursor-pointer hover:ring-2 hover:ring-blue-400 group overflow-hidden"
                            onClick={() => editFileInputRef.current?.click()}
                            title="Klik untuk ganti gambar"
                          >
                            {editForm.image ? (
                              <img
                                src={editForm.image}
                                className="w-full h-full object-cover"
                                alt="Product"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Tag size={20} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <Camera size={20} className="text-white" />
                            </div>
                          </div>

                          <div className="flex-1">
                            <input
                              className="w-full border-gray-300 rounded p-1.5 text-sm font-bold mb-1"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Nama Produk"
                            />
                            <textarea
                              className="w-full border-gray-300 rounded p-1.5 text-xs"
                              rows={2}
                              value={editForm.description || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Deskripsi..."
                            />
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            ref={editFileInputRef}
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, true)}
                          />
                        </div>
                      </div>
                    </td>

                    {/* EDIT MODE - PRICE TIERS */}
                    <td className="px-6 py-3 align-top">
                      <div className="space-y-2">
                        {(editForm.wholesalePrices || []).map((t, idx) => (
                          <div
                            key={idx}
                            className="flex gap-2 items-center bg-gray-50 p-1 rounded"
                          >
                            <span className="text-[10px] text-gray-500 w-12">
                              Min Qty:
                            </span>
                            <input
                              type="number"
                              className="w-16 border rounded p-0.5 text-xs text-center"
                              value={t.minQty}
                              onChange={(e) =>
                                editUpdateTier(
                                  idx,
                                  "minQty",
                                  Number(e.target.value)
                                )
                              }
                            />
                            <span className="text-[10px] text-gray-500 w-8 text-right">
                              Harga:
                            </span>
                            <input
                              type="number"
                              className="w-24 border rounded p-0.5 text-xs text-right font-semibold"
                              value={t.price}
                              onChange={(e) =>
                                editUpdateTier(
                                  idx,
                                  "price",
                                  Number(e.target.value)
                                )
                              }
                            />
                            <button
                              onClick={() => editRemoveTier(idx)}
                              className="text-red-500 hover:bg-red-100 rounded p-0.5"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={editAddTier}
                          className="w-full text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 py-1 rounded border border-blue-100"
                        >
                          + Tambah Aturan
                        </button>
                      </div>
                    </td>

                    {/* EDIT MODE - SHOW IN DASHBOARD */}
                    <td className="px-6 py-3 text-center align-top">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded"
                        checked={editForm.showInDashboard ?? false}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            showInDashboard: e.target.checked,
                          })
                        }
                      />
                    </td>

                    {/* EDIT MODE - ACTIONS */}
                    <td className="px-6 py-3 flex justify-center gap-2 align-top">
                      <button
                        onClick={handleSaveEdit}
                        className="p-2 bg-green-600 text-white rounded hover:bg-green-700 shadow-sm"
                        title="Simpan"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setIsEditing(null)}
                        className="p-2 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                        title="Batal"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    {/* VIEW MODE - PRODUCT INFO */}
                    <td className="px-6 py-3 align-top">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              className="w-full h-full object-cover"
                              alt="Product"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Tag size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-base">
                            {product.name}
                          </div>
                          {product.description && (
                            <div className="text-xs text-gray-500 mt-1 max-w-xs">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* VIEW MODE - PRICE TIERS */}
                    <td className="px-6 py-3 align-top">
                      {product.wholesalePrices &&
                      product.wholesalePrices.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {product.wholesalePrices.map((t, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-xs bg-gray-100 px-2 py-1 rounded w-48"
                            >
                              <span className="text-gray-600">
                                ≥ {t.minQty} pcs
                              </span>
                              <span className="font-bold text-gray-800">
                                {formatCurrency(t.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Tidak ada aturan (Gratis)
                        </span>
                      )}
                    </td>

                    {/* VIEW MODE - SHOW IN DASHBOARD */}
                    <td className="px-6 py-3 text-center align-top pt-4">
                      {+((product as any).show_in_dashboard ?? 0) === 1 ? (
                        <Eye size={18} className="text-blue-500 mx-auto" />
                      ) : (
                        <EyeOff size={18} className="text-gray-300 mx-auto" />
                      )}
                    </td>

                    {/* VIEW MODE - ACTIONS */}
                    <td className="px-6 py-3 align-top pt-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(product)}
                          className="text-orange-600 hover:text-orange-800 p-1.5 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
                          title="Duplikat"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

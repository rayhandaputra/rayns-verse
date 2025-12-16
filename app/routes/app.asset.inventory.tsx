// app/routes/app.asset.inventory.tsx
import React, { useState, useEffect } from "react";
import {
  useActionData,
  Form,
  useFetcher,
  type LoaderFunction,
  type ActionFunction,
} from "react-router";
import type { Asset } from "../types";
import { formatCurrency, parseCurrency, formatFullDate } from "../constants";
import {
  Monitor,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Check,
  Filter,
} from "lucide-react";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";
import { API } from "~/lib/api";

// ============================================
// TYPES & INTERFACES
// ============================================

interface LoaderData {
  assets: Asset[];
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
  const intent = formData.get("intent");

  if (intent === "create") {
    try {
      const name = formData.get("name") as string;
      const category = formData.get("category") as string;
      const purchaseDate = formData.get("purchaseDate") as string;
      const value = Number(formData.get("value"));
      const status = formData.get("status") as Asset["status"];
      const location = formData.get("location") as string;
      const unit = Number(formData.get("unit")) || 1;

      if (!name || !value) {
        return Response.json({
          success: false,
          message: "Nama dan nilai aset wajib diisi",
        });
      }

      const response = await API.INVENTORY_ASSET.create({
        session: { user, token },
        req: {
          body: {
            asset_name: name,
            category,
            purchase_date: purchaseDate,
            total_value: value,
            status,
            location,
            total_unit: unit,
          },
        },
      });

      return Response.json({
        success: response.success,
        message: response.message || "Aset berhasil ditambahkan",
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        message: error.message || "Gagal menambahkan aset",
      });
    }
  }

  if (intent === "update") {
    try {
      const id = formData.get("id") as string;
      const name = formData.get("name") as string;
      const category = formData.get("category") as string;
      const purchaseDate = formData.get("purchaseDate") as string;
      const value = Number(formData.get("value"));
      const status = formData.get("status") as Asset["status"];
      const location = formData.get("location") as string;
      const unit = Number(formData.get("unit")) || 1;

      if (!id || !name || !value) {
        return Response.json({
          success: false,
          message: "ID, nama, dan nilai aset wajib diisi",
        });
      }

      const response = await API.INVENTORY_ASSET.update({
        session: { user, token },
        req: {
          body: {
            id,
            asset_name: name,
            category,
            purchase_date: purchaseDate,
            total_value: value,
            status,
            location,
            total_unit: unit,
          },
        },
      });

      return Response.json({
        success: response.success,
        message: response.message || "Aset berhasil diupdate",
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        message: error.message || "Gagal mengupdate aset",
      });
    }
  }

  if (intent === "delete") {
    try {
      const id = formData.get("id") as string;

      if (!id) {
        return Response.json({
          success: false,
          message: "ID aset wajib diisi",
        });
      }

      const response = await API.INVENTORY_ASSET.delete({
        session: { user, token },
        req: {
          body: { id },
        },
      });

      return Response.json({
        success: response.success,
        message: response.message || "Aset berhasil dihapus",
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        message: error.message || "Gagal menghapus aset",
      });
    }
  }

  return Response.json({ success: false, message: "Invalid intent" });
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function AssetInventoryPage() {
  const actionData = useActionData<ActionData>();
  const assetsFetcher = useFetcher<LoaderData>();

  // ========== STATE ==========
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Asset>>({});

  // ========== EFFECTS ==========
  // Initial load
  useEffect(() => {
    if (assetsFetcher.state === "idle" && !assetsFetcher.data) {
      assetsFetcher.load("/api/assets");
    }
  }, [assetsFetcher]);

  // Reload after action success
  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Berhasil");
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({});
      // Reload assets data
      assetsFetcher.load("/api/assets");
    } else if (actionData?.success === false) {
      toast.error(actionData.message || "Gagal");
    }
  }, [actionData]);

  // ========== COMPUTED ==========
  const assets = assetsFetcher.data?.assets || [];
  const isLoading = assetsFetcher.state === "loading";

  const filteredAssets = assets.filter(
    (a) =>
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = assets.reduce((sum, a) => sum + (a.value || 0), 0);

  // ========== HANDLERS ==========
  const handleEdit = (asset: Asset) => {
    setEditingId(asset.id);
    setFormData({ ...asset });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus aset "${name}"?`)) {
      const form = document.createElement("form");
      form.method = "post";
      form.style.display = "none";

      const intentInput = document.createElement("input");
      intentInput.type = "hidden";
      intentInput.name = "intent";
      intentInput.value = "delete";
      form.appendChild(intentInput);

      const idInput = document.createElement("input");
      idInput.type = "hidden";
      idInput.name = "id";
      idInput.value = id;
      form.appendChild(idInput);

      document.body.appendChild(form);
      form.submit();
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      category: "Elektronik",
      status: "Good",
      purchaseDate: new Date().toISOString().split("T")[0],
      unit: 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.value) return;

    const form = e.target as HTMLFormElement;
    form.submit();
  };

  // ========== RENDER ==========
  return (
    <div className="space-y-6">
      {/* Loading Indicator */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          Memuat data aset...
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Aset</h3>
          <div className="text-2xl font-bold text-gray-900">
            {assets.length} Unit
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Nilai Aset</h3>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalValue)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Kondisi Rusak
          </h3>
          <div className="text-2xl font-bold text-red-500">
            {
              assets.filter(
                (a) => a.status === "Damaged" || a.status === "Maintenance"
              ).length
            }{" "}
            Unit
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-gray-800">Daftar Inventaris</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Cari aset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={handleAddNew}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
            >
              <Plus size={16} /> Tambah
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-3">Nama Aset</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3">Tgl Beli</th>
                <th className="px-6 py-3">Lokasi</th>
                <th className="px-6 py-3">Unit</th>
                <th className="px-6 py-3">Kondisi</th>
                <th className="px-6 py-3 text-right">Nilai Total</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAssets?.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    {searchTerm ? "Tidak ada hasil" : "Belum ada data aset."}
                  </td>
                </tr>
              )}
              {filteredAssets?.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {asset.name}
                  </td>
                  <td className="px-6 py-3">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                      {asset.category}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {formatFullDate(asset.purchaseDate)}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{asset.location}</td>
                  <td className="px-6 py-3 text-gray-600">{asset.unit || 1}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        asset.status === "Good"
                          ? "bg-green-100 text-green-700"
                          : asset.status === "Maintenance"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {asset.status === "Good"
                        ? "Baik"
                        : asset.status === "Damaged"
                          ? "Rusak"
                          : "Maintenance"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-gray-700">
                    {formatCurrency(asset.value)}
                  </td>
                  <td className="px-6 py-3 flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id, asset.name)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingId ? "Edit Aset" : "Tambah Aset Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="text-gray-400" />
              </button>
            </div>
            <Form method="post" onSubmit={handleSubmit} className="space-y-4">
              <input
                type="hidden"
                name="intent"
                value={editingId ? "update" : "create"}
              />
              {editingId && <input type="hidden" name="id" value={editingId} />}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Aset
                </label>
                <input
                  name="name"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    name="category"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option>Elektronik</option>
                    <option>Mesin Cetak</option>
                    <option>Mesin Produksi</option>
                    <option>Kendaraan</option>
                    <option>Furniture</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tanggal Beli
                  </label>
                  <input
                    name="purchaseDate"
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Lokasi
                </label>
                <input
                  name="location"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={formData.location || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g. Gudang"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    name="unit"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    value={formData.unit || 1}
                    type="number"
                    min="1"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nilai (Rp)
                  </label>
                  <input
                    name="value"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    value={formData.value || ""}
                    type="number"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        value: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Kondisi
                  </label>
                  <select
                    name="status"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as any,
                      })
                    }
                  >
                    <option value="Good">Baik</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Damaged">Rusak</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
                >
                  Simpan
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

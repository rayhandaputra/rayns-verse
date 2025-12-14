import React, { useState, useMemo } from "react";
import type { Product } from "../types";
import { formatCurrency, parseCurrency } from "../constants";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { DataTable, type ColumnDef } from "../components/ui/data-table";

interface ProductListPageProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

const ProductListPage: React.FC<ProductListPageProps> = ({
  products = [],
  onUpdateProducts,
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Product | null>(null);

  // New Product State
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState<
    "Id Card" | "Lanyard" | "Paket" | "Lainnya"
  >("Paket");
  const [newDesc, setNewDesc] = useState("");

  const handleEdit = (p: Product) => {
    setIsEditing(p.id);
    setEditForm({ ...p });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    const updated = products.map((p) => (p.id === editForm.id ? editForm : p));
    onUpdateProducts(updated);
    setIsEditing(null);
    setEditForm(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus produk ini?")) {
      onUpdateProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;

    const newProduct: Product = {
      id: String(Date.now()),
      name: newName,
      price: parseCurrency(newPrice),
      category: newCategory,
      description: newDesc,
    };

    onUpdateProducts([...products, newProduct]);
    setShowAdd(false);
    setNewName("");
    setNewPrice("");
    setNewCategory("Paket");
    setNewDesc("");
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "Paket":
        return "bg-purple-100 text-purple-800";
      case "Id Card":
        return "bg-blue-100 text-blue-800";
      case "Lanyard":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Column definitions for DataTable
  const columns: ColumnDef<Product>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Nama Produk",
        cellClassName: "px-6",
        headerClassName: "px-6",
        cell: (product) => {
          if (isEditing === product.id && editForm) {
            return (
              <input
                className="w-full border-gray-300 rounded p-1 text-sm"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            );
          }
          return (
            <span className="font-medium text-gray-900">{product.name}</span>
          );
        },
      },
      {
        key: "category",
        header: "Kategori",
        cellClassName: "px-6",
        headerClassName: "px-6",
        cell: (product) => {
          if (isEditing === product.id && editForm) {
            return (
              <select
                className="w-full border-gray-300 rounded p-1 text-sm"
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value as any })
                }
              >
                <option value="Paket">Paket</option>
                <option value="Id Card">Id Card</option>
                <option value="Lanyard">Lanyard</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            );
          }
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeClass(product.category)}`}
            >
              {product.category}
            </span>
          );
        },
      },
      {
        key: "price",
        header: "Harga Satuan",
        cellClassName: "px-6",
        headerClassName: "px-6",
        cell: (product) => {
          if (isEditing === product.id && editForm) {
            return (
              <input
                className="w-32 border-gray-300 rounded p-1 text-sm"
                value={formatCurrency(editForm.price)}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    price: parseCurrency(e.target.value),
                  })
                }
              />
            );
          }
          return (
            <span className="font-bold text-gray-800">
              {formatCurrency(product.price)}
            </span>
          );
        },
      },
      {
        key: "description",
        header: "Keterangan",
        cellClassName: "px-6",
        headerClassName: "px-6",
        cell: (product) => {
          if (isEditing === product.id && editForm) {
            return (
              <input
                className="w-full border-gray-300 rounded p-1 text-sm"
                value={editForm.description || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            );
          }
          return (
            <span className="text-gray-500">{product.description || "-"}</span>
          );
        },
      },
      {
        key: "actions",
        header: "Aksi",
        headerClassName: "px-6 text-center",
        cellClassName: "px-6",
        cell: (product) => {
          if (isEditing === product.id) {
            return (
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="text-green-600 hover:text-green-800"
                >
                  <Save size={18} />
                </button>
                <button
                  onClick={() => setIsEditing(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            );
          }
          return (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handleEdit(product)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        },
      },
    ],
    [isEditing, editForm]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            Daftar Produk & Harga
          </h2>
          <p className="text-gray-500 text-sm">
            Atur jenis barang dan harga satuan untuk Form Pemesanan.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {showAdd && (
        <div className="p-6 bg-blue-50 border-b border-blue-100 animate-fade-in">
          <h3 className="text-sm font-bold text-blue-800 mb-3">
            Tambah Produk Baru
          </h3>
          <form
            onSubmit={handleAdd}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <div className="md:col-span-1">
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
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Kategori
              </label>
              <select
                className="w-full border-gray-300 rounded-lg p-2 text-sm"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
              >
                <option value="Paket">Paket</option>
                <option value="Id Card">Id Card</option>
                <option value="Lanyard">Lanyard</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Harga Satuan
              </label>
              <input
                className="w-full border-gray-300 rounded-lg p-2 text-sm"
                value={newPrice}
                onChange={(e) =>
                  setNewPrice(formatCurrency(parseCurrency(e.target.value)))
                }
                placeholder="Rp 0"
                required
              />
            </div>
            <div className="md:col-span-1 flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="bg-white border border-gray-300 text-gray-600 py-2 px-3 rounded-lg hover:bg-gray-50"
              >
                <X size={18} />
              </button>
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
          </form>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={products}
        getRowKey={(product, _index) => product.id}
        emptyMessage="Belum ada produk. Klik 'Tambah Produk' untuk menambahkan."
        minHeight="200px"
      />
    </div>
  );
};

export default ProductListPage;

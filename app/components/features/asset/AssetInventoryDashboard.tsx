import React, { useState, useEffect } from "react";
import { useActionData, useFetcher, Form } from "react-router";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatFullDate } from "~/constants";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/nexus/nexus-client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import ModalShell from "~/components/modal/ModalShell";

interface InventoryAsset {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  value: number;
  status: "Good" | "Maintenance" | "Damaged";
  location: string;
  unit: number;
}

export const AssetInventoryDashboard: React.FC = () => {
  const actionFetcher = useFetcher();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryAsset>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: assetsData,
    loading: isLoading,
    reload: reloadAssets,
  } = useFetcherData<any>({
    endpoint: nexus()
      .module("INVENTORY_ASSET")
      .action("get")
      .params({
        page: 0,
        size: 1000,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      })
      .build(),
    autoLoad: true,
  });

  useEffect(() => {
    if (actionFetcher.state === "idle" && actionFetcher.data) {
      const result = actionFetcher.data as any;
      if (result?.success) {
        toast.success(result.message || "Berhasil");
        setTimeout(() => {
          setIsModalOpen(false);
          setEditingId(null);
          setFormData({});
          reloadAssets();
        }, 0);
      } else if (result?.success === false) {
        toast.error(result.message || "Gagal");
      }
    }
  }, [actionFetcher.state, actionFetcher.data, reloadAssets]);

  const assets: InventoryAsset[] = (assetsData?.data?.items || []).map((item: any) => ({
    id: String(item.id),
    name: item.asset_name || "",
    category: item.category || "",
    purchaseDate: item.purchase_date || "",
    value: Number(item.total_value) || 0,
    status: (item.status || "Good") as any,
    location: item.location || "",
    unit: Number(item.total_unit) || 1,
  }));

  const totalValue = assets.reduce((sum, a) => sum + (a.value || 0), 0);

  const handleEdit = (asset: InventoryAsset) => {
    setEditingId(asset.id);
    setFormData({ ...asset });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus aset "${name}"?`)) {
      actionFetcher.submit({ intent: "delete", id }, { method: "POST" });
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
    actionFetcher.submit(new FormData(form), { method: "POST" });
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Inventaris Aset</h2>
          <p className="text-xs text-gray-500">Kelola aset dan properti perusahaan</p>
        </div>
        <Button onClick={handleAddNew} className="bg-gray-900 text-white gap-2 h-9">
          <Plus size={16} /> Tambah Aset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-indigo-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Aset</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{assets.length} <span className="text-sm font-medium text-gray-400">Unit</span></p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Nilai</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aset Bermasalah</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {assets.filter(a => a.status !== "Good").length} <span className="text-sm font-medium text-gray-400">Unit</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-gray-100 overflow-hidden">
        <CardHeader className="flex flex-row justify-between items-center px-6 py-4 border-b border-gray-50 bg-gray-50/20">
          <CardTitle className="text-lg font-bold">Daftar Inventaris</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10 pr-4 py-2 border rounded-full text-sm w-64 h-9 bg-white"
              placeholder="Cari aset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-bold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Nama Aset</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Tgl Beli</th>
                  <th className="px-6 py-4">Lokasi</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Nilai Total</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading && assets.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400">Memuat data...</td></tr>
                ) : assets.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400">Belum ada data aset.</td></tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">{asset.name}</td>
                      <td className="px-6 py-4"><span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">{asset.category}</span></td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatFullDate(asset.purchaseDate)}</td>
                      <td className="px-6 py-4 text-gray-600">{asset.location}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{asset.unit}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          asset.status === "Good" ? "bg-emerald-100 text-emerald-700" :
                          asset.status === "Maintenance" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                        }`}>
                          {asset.status === "Good" ? "Baik" : asset.status === "Damaged" ? "Rusak" : "Service"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-600">{formatCurrency(asset.value)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-slate-100">
                            <button
                              title="Edit"
                              onClick={() => handleEdit(asset)}
                              className="p-2 text-slate-500 hover:text-blue-500 hover:bg-white rounded transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              title="Hapus"
                              onClick={() => handleDelete(asset.id, asset.name)}
                              className="p-2 text-slate-500 hover:text-red-500 hover:bg-white rounded transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ModalShell open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Aset" : "Tambah Aset Baru"} size="md">
        <Form method="post" onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="intent" value={editingId ? "update" : "create"} />
          {editingId && <input type="hidden" name="id" value={editingId} />}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-400">Nama Aset</Label>
            <Input
              name="name"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Printer Epson L3110"
              required
              className="bg-gray-50 border-gray-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-gray-400">Kategori</Label>
              <select
                name="category"
                className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option>Elektronik</option>
                <option>Mesin Cetak</option>
                <option>Mesin Produksi</option>
                <option>Kendaraan</option>
                <option>Furniture</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-gray-400">Tanggal Beli</Label>
              <Input
                name="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="bg-gray-50 border-gray-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-400">Lokasi</Label>
            <Input
              name="location"
              value={formData.location || ""}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Kantor Utama / Gudang"
              className="bg-gray-50 border-gray-200"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-gray-400">Unit</Label>
              <Input
                name="unit"
                value={formData.unit || 1}
                type="number"
                min="1"
                onChange={(e) => setFormData({ ...formData, unit: Number(e.target.value) })}
                required
                className="bg-gray-50 border-gray-200 text-center"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-bold uppercase text-gray-400">Nilai (Rp)</Label>
              <Input
                name="value"
                value={formData.value || ""}
                type="number"
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                required
                placeholder="2000000"
                className="bg-gray-50 border-gray-200 font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase text-gray-400">Kondisi</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Baik", value: "Good", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
                { label: "Service", value: "Maintenance", color: "bg-amber-50 text-amber-600 border-amber-200" },
                { label: "Rusak", value: "Damaged", color: "bg-rose-50 text-rose-600 border-rose-200" }
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: s.value as any })}
                  className={`py-2 text-[10px] font-bold rounded-lg border uppercase transition-all ${
                    formData.status === s.value ? s.color : "bg-gray-50 text-gray-400 border-gray-100"
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <input type="hidden" name="status" value={formData.status} />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-10">Batal</Button>
            <Button type="submit" className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white">Simpan Perubahan</Button>
          </div>
        </Form>
      </ModalShell>
    </div>
  );
};

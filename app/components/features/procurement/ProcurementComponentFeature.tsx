import React, { useState, useMemo, useEffect } from "react";
import { useFetcher, useParams } from "react-router";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { nexus } from "~/nexus/nexus-client";
import { useFetcherData } from "~/hooks";
import { safeParseArray } from "~/utils/utils";
import Swal from "sweetalert2";
import { formatCurrency, formatCurrencyUnprefix } from "~/constants";
import { toast } from "sonner";
import { RawMaterial, SubComponent, Shop } from "./types";

const parseCurrency = (value: string): number => {
    return Number(value.replace(/[^0-9]/g, ""));
};

const formatNumberInput = (val: number | string) => {
    const num = typeof val === "string" ? parseCurrency(val) : val;
    if (!num) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function ProcurementComponentFeature() {
    const { category } = useParams();
    const fetcher = useFetcher();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formState, setFormState] = useState<Partial<RawMaterial>>({
        unit: "pcs",
        is_package: 0,
        is_affected_side: 1,
        sub_components: []
    });

    const { data: rawData, reload } = useFetcherData({
        endpoint: nexus().module("SUPPLIER_COMMODITY").action("get").params({ size: 100, level: 1 }).build(),
    });

    const { data: supplierData } = useFetcherData({
        endpoint: nexus().module("SUPPLIER").action("get").params({ size: 100 }).build(),
    });

    const materials = useMemo(() => {
        const items = rawData?.data?.items || [];
        return items.filter((m: any) => m.category === category).map((m: any) => ({
            ...m,
            sub_components: safeParseArray(m.sub_components)
        }));
    }, [rawData, category]);

    const shops: Shop[] = supplierData?.data?.items || [];
    const currentShops = shops.filter((s: any) => s.category === category);

    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data && (fetcher.data as any).success) {
            toast.success((fetcher.data as any).message || "Berhasil");
            setTimeout(() => {
                setShowForm(false);
                setEditingId(null);
                setFormState({ unit: "pcs", is_package: 0, is_affected_side: 1, sub_components: [] });
                reload();
            }, 0);
        }
    }, [fetcher.state, fetcher.data]);

    const handleEdit = (mat: RawMaterial) => {
        setEditingId(mat.id);
        setFormState({
            ...mat,
            is_package: +mat.is_package!,
            is_affected_side: +mat.is_affected_side!,
            sub_components: safeParseArray(mat.sub_components)
        });
        setShowForm(true);
    };

    const handleAddSubComp = () => {
        setFormState({
            ...formState,
            sub_components: [
                ...(formState.sub_components as SubComponent[] || []),
                {
                    id: "sub-" + Date.now(),
                    commodity_name: "",
                    capacity_per_unit: 0,
                    current_stock: 0,
                },
            ],
        });
    };

    const handleSave = () => {
        if (!formState.commodity_name) return toast.error("Nama komponen wajib diisi");

        fetcher.submit(
            {
                intent: editingId ? "update_material" : "create_material",
                id: editingId || "",
                data: JSON.stringify({ ...formState, category }),
                sub_components: JSON.stringify(formState.sub_components),
            },
            { method: "post" }
        );
    };

    const handleDelete = (id: string, name: string) => {
        Swal.fire({
            title: "Hapus Komponen?",
            text: `Yakin ingin menghapus ${name}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, Hapus",
            confirmButtonColor: "#ef4444",
            cancelButtonText: "Batal"
        }).then((res) => {
            if (res.isConfirmed) {
                fetcher.submit({ intent: "delete_material", id }, { method: "post" });
            }
        });
    };

    return (
        <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <h3 className="font-black text-gray-800 text-lg uppercase">Katalog Komponen {category?.replace(/_/g, " ")}</h3>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                        setFormState({ unit: 'pcs', is_package: 0, is_affected_side: 1, sub_components: [] });
                    }}
                    className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition hover:bg-gray-800"
                >
                    <Plus size={18} /> {showForm ? "TUTUP FORM" : "TAMBAH KOMPONEN"}
                </button>
            </div>

            {showForm && (
                <div className="p-8 bg-white border-b border-gray-100 animate-fade-in space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <input
                                placeholder="Nama Induk Komponen"
                                className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-400"
                                value={formState.commodity_name || ""}
                                onChange={(e) => setFormState({ ...formState, commodity_name: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    className="border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-white"
                                    value={formState.unit}
                                    onChange={(e) => setFormState({ ...formState, unit: e.target.value })}
                                >
                                    <option value="pcs">Pcs</option>
                                    <option value="roll">Roll</option>
                                    <option value="liter">Liter</option>
                                    <option value="pack">Pack</option>
                                    <option value="lembar">Lembar</option>
                                </select>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                                    <input
                                        type="text"
                                        placeholder={`Harga / ${formState.unit?.toUpperCase() || "UNIT"}`}
                                        className="w-full border-2 border-gray-100 p-4 pl-9 rounded-2xl text-sm font-bold"
                                        value={formatNumberInput(+(formState.unit_price?.toString() || "0"))}
                                        onChange={(e) => setFormState({ ...formState, unit_price: parseCurrency(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <select
                                className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-white"
                                value={formState.supplier_id || ""}
                                onChange={(e) => setFormState({ ...formState, supplier_id: e.target.value })}
                            >
                                <option value="">-- Pilih Supplier --</option>
                                {currentShops.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 h-[60px]">
                                <input
                                    id="is_package"
                                    type="checkbox"
                                    className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={+(formState.is_package as any) === 1}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormState({ ...formState, is_package: checked ? 1 : 0 });
                                        if (checked && formState.sub_components?.length === 0) {
                                            handleAddSubComp();
                                        }
                                    }}
                                />
                                <label htmlFor="is_package" className="text-xs font-black text-gray-600 cursor-pointer uppercase">
                                    PAKET KOMPONEN
                                </label>
                            </div>
                        </div>
                    </div>

                    {+(formState.is_package as any) === 1 ? (
                        <div className="bg-blue-50/50 p-8 rounded-[40px] space-y-4 border border-blue-100">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest">
                                    PENGATURAN PAKET (SATUAN: {formState.unit?.toUpperCase()})
                                </h4>
                                <button onClick={handleAddSubComp} className="text-[10px] font-black bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition">
                                    + TAMBAH KOMPONEN
                                </button>
                            </div>
                            {formState.sub_components?.map((sub, i) => (
                                <div key={sub.id || i} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-blue-50 shadow-sm animate-fade-in">
                                    <input
                                        placeholder="Nama Komponen (e.g. Cyan)"
                                        className="md:col-span-2 border border-gray-200 p-3 rounded-xl text-sm font-bold"
                                        value={sub.commodity_name || ""}
                                        onChange={(e) => {
                                            const n = [...(formState.sub_components as SubComponent[] || [])];
                                            n[i] = { ...n[i], commodity_name: e.target.value };
                                            setFormState({ ...formState, sub_components: n });
                                        }}
                                    />
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="Kapasitas"
                                            className="w-full border border-gray-200 p-3 rounded-xl text-sm font-bold no-spinners"
                                            value={sub.capacity_per_unit || ""}
                                            onChange={(e) => {
                                                const n = [...(formState.sub_components as SubComponent[] || [])];
                                                n[i] = { ...n[i], capacity_per_unit: Number(e.target.value) };
                                                setFormState({ ...formState, sub_components: n });
                                            }}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 uppercase">
                                            Per {formState.unit?.toUpperCase()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const n = (formState.sub_components as SubComponent[] || []).filter((_, idx) => idx !== i);
                                            setFormState({ ...formState, sub_components: n });
                                        }}
                                        className="text-red-400 hover:bg-red-50 rounded-xl transition flex items-center justify-center p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100">
                            <label className="text-[10px] font-black text-gray-400 block mb-3 uppercase tracking-widest">
                                Kapasitas Produksi (Pcs Jadi) Per 1 {formState.unit?.toUpperCase()}
                            </label>
                            <div className="relative max-w-sm">
                                <input
                                    type="number"
                                    className="w-full border-2 border-gray-100 p-5 rounded-2xl text-lg font-black no-spinners"
                                    value={formState.capacity_per_unit || ""}
                                    onChange={(e) => setFormState({ ...formState, capacity_per_unit: Number(e.target.value) })}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 uppercase">
                                    PCS JADI
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center gap-4">
                            <input
                                id="affectedSides"
                                type="checkbox"
                                className="w-6 h-6 rounded-lg border-blue-200 text-blue-600"
                                checked={+(formState.is_affected_side as any) === 1}
                                onChange={(e) => setFormState({ ...formState, is_affected_side: e.target.checked ? 1 : 0 })}
                            />
                            <div className="flex-1">
                                <label htmlFor="affectedSides" className="text-sm font-black text-blue-800 cursor-pointer uppercase block mb-1">
                                    DIPENGARUHI SISI CETAK (2 SISI)
                                </label>
                                <p className="text-[10px] text-blue-600 font-bold opacity-70">
                                    Jika dicentang, hasil produksi akan terbagi 2 otomatis saat menghitung varian produk 2 sisi.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-end">
                            <button
                                onClick={handleSave}
                                disabled={fetcher.state !== "idle"}
                                className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {fetcher.state !== "idle" ? "MENYIMPAN..." : (editingId ? "SIMPAN PERUBAHAN" : "SIMPAN KOMPONEN")}
                            </button>
                            <button
                                onClick={() => { setShowForm(false); setEditingId(null); }}
                                className="px-10 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition"
                            >
                                BATAL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        <tr>
                            <th className="px-8 py-5">Nama Induk & Paket</th>
                            <th className="px-8 py-5">Supplier</th>
                            <th className="px-8 py-5">Harga Beli</th>
                            <th className="px-8 py-5">Stok Saat Ini</th>
                            <th className="px-8 py-5">Kapasitas Produksi</th>
                            <th className="px-8 py-5">Dipengaruhi Sisi Cetak</th>
                            <th className="px-8 py-5 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {materials.map((m: RawMaterial) => (
                            <tr key={m.id} className="hover:bg-gray-50/80 transition">
                                <td className="px-8 py-6">
                                    <div className="font-black text-gray-800 text-base">{m.commodity_name}</div>
                                    {+(m?.is_package ?? 0) === 1 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {Array.isArray(m.sub_components) && m.sub_components.map((s: SubComponent) => (
                                                <span key={s.id} className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 shadow-sm">
                                                    {s.name || s.commodity_name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="px-8 py-6 font-black text-gray-400 uppercase text-[10px] tracking-widest">
                                    {currentShops.find((s: any) => s.id === m.supplier_id)?.name || "-"}
                                </td>
                                <td className="px-8 py-6 font-black text-gray-700">
                                    <div className="text-sm">{formatCurrency(m.unit_price)}</div>
                                    <span className="text-[10px] text-gray-400 uppercase mt-0.5 font-bold tracking-widest">/ {m.unit}</span>
                                </td>
                                <td className="px-8 py-6 font-black text-gray-400 uppercase text-[10px] tracking-widest">
                                    {+m.current_stock}
                                </td>
                                <td className="px-8 py-6 font-black text-gray-400 uppercase text-[10px] tracking-widest">
                                    {formatCurrencyUnprefix(+(m?.capacity_per_unit ?? 0))}
                                </td>
                                <td className="px-8 py-6 font-black text-gray-400 uppercase text-[10px] tracking-widest">
                                    {+(m?.is_affected_side ?? 0) === 1 ? "Ya" : "Tidak"}
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg border border-slate-100">
                                            <button
                                                title="Edit"
                                                onClick={() => handleEdit(m)}
                                                className="p-2 text-slate-500 hover:text-blue-500 hover:bg-white rounded transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                title="Hapus"
                                                onClick={() => handleDelete(m.id, m.commodity_name)}
                                                className="p-2 text-slate-500 hover:text-red-500 hover:bg-white rounded transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {materials.length === 0 && (
                    <div className="text-center py-20 text-gray-400 font-bold">
                        Belum ada komponen yang terdaftar untuk kategori ini.
                    </div>
                )}
            </div>
            <style>{`
                .no-spinners::-webkit-outer-spin-button, .no-spinners::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                .no-spinners { -moz-appearance: textfield; }
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

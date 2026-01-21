import { useState, useMemo, useEffect } from "react";
import { useFetcher, useParams } from "react-router";
import type { ActionFunction } from "react-router";
import { Plus, Edit2, Trash2, Check } from "lucide-react";
import { API } from "~/lib/api";
// import { requireAuth } from "~/lib/session.server";
import { nexus } from "~/lib/nexus-client";
import { useFetcherData } from "~/hooks";
// import { RawMaterial, SubComponent } from "~/types/inventory";
import { safeParseArray } from "~/lib/utils"; // Pindahkan helper ke utils
import Swal from "sweetalert2";
import type { RawMaterial, SubComponent } from "./app.procurement.$category";
import { formatCurrency } from "~/constants";

export const action: ActionFunction = async ({ request }) => {
    // ... Implementasi action create_material, update_material, delete_material
    // Sama seperti logic di StockPage.tsx action, tapi spesifik untuk material
    return Response.json({ success: true });
}

export default function ComponentsPage() {
    const { category } = useParams();
    const fetcher = useFetcher();

    // State Form
    const [showForm, setShowForm] = useState(false);
    const [editingMat, setEditingMat] = useState<Partial<RawMaterial> | null>(null);

    // Fetch Data
    const { data: rawData, reload } = useFetcherData({
        endpoint: nexus().module("SUPPLIER_COMMODITY").action("get").params({ size: 100, level: 1 }).build(),
    });

    const materials = useMemo(() => {
        const items = rawData?.data?.items || [];
        // Parsing sub_components sekali saja di sini
        return items.filter((m: any) => m.category === category).map((m: any) => ({
            ...m,
            sub_components: safeParseArray(m.sub_components)
        }));
    }, [rawData, category]);

    // Handlers
    const handleSave = () => {
        // Validasi form
        // fetcher.submit(...)
    };

    return (
        <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <h3 className="font-black text-gray-800 text-lg uppercase">Katalog Komponen</h3>
                <button onClick={() => { setShowForm(!showForm); setEditingMat({ unit: 'pcs', is_package: 0 }); }} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2">
                    <Plus size={18} /> TAMBAH KOMPONEN
                </button>
            </div>

            {/* Form Component (Bisa diekstrak jadi file terpisah ComponentForm.tsx) */}
            {showForm && (
                <div className="p-8 bg-white border-b border-gray-100">
                    {/* Render Input Fields untuk material & sub components disini */}
                    {/* Menggunakan state 'editingMat' */}
                    <p className="text-gray-400 italic">Form Component Placeholder - Implementasi input sama seperti StockPage.tsx</p>
                </div>
            )}

            {/* Table List */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        <tr>
                            <th className="px-8 py-5">Nama Induk & Paket</th>
                            <th className="px-8 py-5">Harga Beli</th>
                            <th className="px-8 py-5 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {materials.map((m: RawMaterial) => (
                            <tr key={m.id} className="hover:bg-gray-50/80">
                                <td className="px-8 py-6">
                                    <div className="font-black text-gray-800 text-base">{m.commodity_name}</div>
                                    {m.is_package === 1 && (Array.isArray(m.sub_components) && m.sub_components.map((s: SubComponent) => (
                                        <span key={s.id} className="badge-sub">{s.name || s.commodity_name}</span>
                                    )))}
                                </td>
                                <td className="px-8 py-6 font-black text-gray-700">
                                    {formatCurrency(m.unit_price)} <span className="text-[10px] text-gray-400">/ {m.unit}</span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => { setEditingMat(m); setShowForm(true); }} className="btn-icon-blue"><Edit2 size={18} /></button>
                                        <button className="btn-icon-red"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style>{`
                .badge-sub { font-size: 9px; font-weight: 900; background: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 9999px; margin-right: 4px; display: inline-block; margin-top: 4px; border: 1px solid #dbeafe; }
                .btn-icon-blue { color: #2563eb; padding: 0.6rem; background: #eff6ff; border-radius: 1rem; }
                .btn-icon-red { color: #f87171; padding: 0.6rem; background: #fef2f2; border-radius: 1rem; }
            `}</style>
        </div>
    );
}
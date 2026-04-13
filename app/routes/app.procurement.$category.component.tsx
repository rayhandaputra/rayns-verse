// import { useState, useMemo, useEffect } from "react";
// import { useFetcher, useParams } from "react-router";
// import type { ActionFunction } from "react-router";
// import { Plus, Edit2, Trash2, Check } from "lucide-react";
// import { API } from "~/lib/api";
// import { requireAuth } from "~/lib/session.server";
// import { nexus } from "~/lib/nexus-client";
// import { useFetcherData } from "~/hooks";
// import { safeParseArray } from "~/lib/utils"; // Pindahkan helper ke utils
// import Swal from "sweetalert2";
// import type { RawMaterial, SubComponent } from "./app.procurement.$category";
// import { formatCurrency } from "~/constants";

// export const action: ActionFunction = async ({ request }) => {
//     const { user, token }: any = await requireAuth(request);
//     const formData = await request.formData();
//     let { id, intent, data, sub_components }: any = Object.fromEntries(
//         formData.entries()
//     );
//     data = data ? JSON.parse(data) : {};
//     sub_components = sub_components ? JSON.parse(sub_components) : {};
//     try {
//         if (intent === "update_material") {
//             const payload = {
//                 id,
//                 commodity_name: data?.commodity_name,
//                 is_affected_side: data?.is_affected_side,
//                 is_package: data?.is_package,
//                 supplier_id: data?.supplier_id,
//                 unit: data?.unit,
//                 unit_price: data?.unit_price,
//                 capacity_per_unit: data?.capacity_per_unit,
//             };
//             const res = await API.SUPPLIER_COMMODITY.update({
//                 session: { user, token },
//                 req: {
//                     body: {
//                         ...payload,
//                         sub_components: safeParseArray(sub_components)?.map((v: any) => ({
//                             id: v.id,
//                             commodity_id: v.commodity_id,
//                             commodity_name: v.commodity_name,
//                             capacity_per_unit: v.capacity_per_unit,
//                         })),
//                     },
//                 },
//             });
//             return Response.json({
//                 success: res.success,
//                 message: res.success
//                     ? "Berhasil memperbarui Komponen"
//                     : "Gagal memperbarui Komponen",
//             });
//         }
//         if (intent === "create_material") {
//             const payload = {
//                 commodity_id: 0,
//                 commodity_name: data?.name,
//                 is_affected_side: data?.is_affected_side,
//                 is_package: data?.is_package,
//                 supplier_id: data?.supplier_id,
//                 unit: data?.unit,
//                 unit_price: data?.unit_price,
//                 capacity_per_unit: data?.capacity_per_unit,
//             };

//             const res = await API.SUPPLIER_COMMODITY.create({
//                 session: { user, token },
//                 req: {
//                     body: {
//                         ...payload,
//                         sub_components: sub_components?.map((v: any) => ({
//                             commodity_id: 0,
//                             commodity_name: v.name,
//                         })),
//                     },
//                 },
//             });
//             return Response.json({
//                 success: res.success,
//                 message: res.success
//                     ? "Berhasil menambahkan Komponen"
//                     : "Gagal menambahkan Komponen",
//             });
//         }
//         if (intent === "delete_material") {
//             const payload = {
//                 id,
//                 deleted: 1,
//             };

//             const res = await API.SUPPLIER_COMMODITY.update({
//                 session: { user, token },
//                 req: { body: payload },
//             });
//             return Response.json({
//                 success: res.success,
//                 message: res.success
//                     ? "Berhasil menghapus Komponen"
//                     : "Gagal menghapus Komponen",
//             });
//         }
//         return Response.json({ success: false, message: "Unknown intent" });
//     } catch (error: any) {
//         console.error("Finance action error:", error);
//         return Response.json({
//             success: false,
//             message: error.message || "An error occurred",
//         });
//     }
// };

// export default function ComponentsPage() {
//     const { category } = useParams();
//     const fetcher = useFetcher();

//     // State Form
//     const [showForm, setShowForm] = useState(false);
//     const [editingMat, setEditingMat] = useState<Partial<RawMaterial> | null>(null);

//     // Fetch Data
//     const { data: rawData, reload } = useFetcherData({
//         endpoint: nexus().module("SUPPLIER_COMMODITY").action("get").params({ size: 100, level: 1 }).build(),
//     });
//     // 3. Actions & Handlers
//     const { data: actionData, load: submitAction } = useFetcherData({
//         endpoint: "",
//         method: "POST",
//         autoLoad: false,
//     });

//     useEffect(() => {
//         if (actionData?.success) {
//             reloadSuppliers();
//             toast.success(
//                 actionData?.message || actionData?.error_message || "Berhasil"
//             );
//         }
//     }, [actionData]);

//     const materials = useMemo(() => {
//         const items = rawData?.data?.items || [];
//         // Parsing sub_components sekali saja di sini
//         return items.filter((m: any) => m.category === category).map((m: any) => ({
//             ...m,
//             sub_components: safeParseArray(m.sub_components)
//         }));
//     }, [rawData, category]);

//     // Handlers
//     const handleSave = () => {
//         // Validasi form
//         // fetcher.submit(...)
//         if (state.editingMatId) {
//             submitAction({
//                 intent: "update_material",
//                 id: state.editingMatId,
//                 data: JSON.stringify(state.newMat),
//                 sub_components: JSON.stringify(state.newMat.sub_components),
//                 // sub_components: JSON.stringify(state.tempSubComponents),
//             });
//         } else {
//             submitAction({
//                 intent: "create_material",
//                 data: JSON.stringify(state.newMat),
//                 sub_components: JSON.stringify(state.newMat.sub_components),
//             });
//         }
//     };

//     return (
//         <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
//             {/* Header */}
//             <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
//                 <h3 className="font-black text-gray-800 text-lg uppercase">Katalog Komponen</h3>
//                 <button onClick={() => { setShowForm(!showForm); setEditingMat({ unit: 'pcs', is_package: 0 }); }} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2">
//                     <Plus size={18} /> TAMBAH KOMPONEN
//                 </button>
//             </div>

//             {/* Form Component (Bisa diekstrak jadi file terpisah ComponentForm.tsx) */}
//             {showForm && (
//                 <div className="p-8 bg-white border-b border-gray-100">
//                     {/* Render Input Fields untuk material & sub components disini */}
//                     {/* Menggunakan state 'editingMat' */}
//                     <p className="text-gray-400 italic">Form Component Placeholder - Implementasi input sama seperti StockPage.tsx</p>
//                 </div>
//             )}

//             {/* Table List */}
//             <div className="overflow-x-auto">
//                 <table className="w-full text-sm text-left">
//                     <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
//                         <tr>
//                             <th className="px-8 py-5">Nama Induk & Paket</th>
//                             <th className="px-8 py-5">Harga Beli</th>
//                             <th className="px-8 py-5 text-center">Aksi</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-100">
//                         {materials.map((m: RawMaterial) => (
//                             <tr key={m.id} className="hover:bg-gray-50/80">
//                                 <td className="px-8 py-6">
//                                     <div className="font-black text-gray-800 text-base">{m.commodity_name}</div>
//                                     {m.is_package === 1 && (Array.isArray(m.sub_components) && m.sub_components.map((s: SubComponent) => (
//                                         <span key={s.id} className="badge-sub">{s.name || s.commodity_name}</span>
//                                     )))}
//                                 </td>
//                                 <td className="px-8 py-6 font-black text-gray-700">
//                                     {formatCurrency(m.unit_price)} <span className="text-[10px] text-gray-400">/ {m.unit}</span>
//                                 </td>
//                                 <td className="px-8 py-6 text-center">
//                                     <div className="flex justify-center gap-2">
//                                         <button onClick={() => { setEditingMat(m); setShowForm(true); }} className="btn-icon-blue"><Edit2 size={18} /></button>
//                                         <button className="btn-icon-red"><Trash2 size={18} /></button>
//                                     </div>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//             <style>{`
//                 .badge-sub { font-size: 9px; font-weight: 900; background: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 9999px; margin-right: 4px; display: inline-block; margin-top: 4px; border: 1px solid #dbeafe; }
//                 .btn-icon-blue { color: #2563eb; padding: 0.6rem; background: #eff6ff; border-radius: 1rem; }
//                 .btn-icon-red { color: #f87171; padding: 0.6rem; background: #fef2f2; border-radius: 1rem; }
//             `}</style>
//         </div>
//     );
// }
// import { useState, useMemo, useEffect } from "react";
// import { useParams, useFetcher } from "react-router";
// import type { ActionFunction } from "react-router";
// import { Plus, Edit2, Trash2, Check, Package, Layers, X, PlusCircle, Info } from "lucide-react";
// import { API } from "~/lib/api";
// import { requireAuth } from "~/lib/session.server";
// import { nexus } from "~/lib/nexus-client";
// import { useFetcherData } from "~/hooks";
// import { safeParseArray } from "~/lib/utils";
// import { toast } from "sonner";
// import Swal from "sweetalert2";

// // --- TYPES ---
// export interface SubComponent {
//     id?: string;
//     commodity_id?: number;
//     commodity_name: string;
//     capacity_per_unit: number;
//     current_stock?: number;
// }

// export interface RawMaterial {
//     id: string;
//     commodity_name: string;
//     category: string;
//     unit: string;
//     unit_price: number;
//     supplier_id: string;
//     current_stock: number;
//     capacity_per_unit: number;
//     is_package: number;
//     is_affected_side: number;
//     sub_components?: SubComponent[];
// }

// // --- HELPERS ---
// const formatCurrency = (val: number) =>
//     new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

// const parseNumber = (val: string) => Number(val.replace(/[^0-9]/g, ""));

// // --- ACTION FUNCTION ---
// export const action: ActionFunction = async ({ request }) => {
//     const { user, token }: any = await requireAuth(request);
//     const formData = await request.formData();
//     let { id, intent, data, sub_components }: any = Object.fromEntries(formData.entries());

//     const parsedData = data ? JSON.parse(data) : {};
//     const parsedSubs = sub_components ? JSON.parse(sub_components) : [];

//     try {
//         if (intent === "update_material") {
//             const res = await API.SUPPLIER_COMMODITY.update({
//                 session: { user, token },
//                 req: {
//                     body: {
//                         id,
//                         ...parsedData,
//                         sub_components: parsedSubs.map((s: any) => ({
//                             id: s.id,
//                             commodity_name: s.commodity_name,
//                             capacity_per_unit: s.capacity_per_unit
//                         }))
//                     }
//                 }
//             });
//             return Response.json({ success: res.success, message: res.success ? "Berhasil diperbarui" : "Gagal memperbarui" });
//         }

//         if (intent === "create_material") {
//             const res = await API.SUPPLIER_COMMODITY.create({
//                 session: { user, token },
//                 req: {
//                     body: {
//                         ...parsedData,
//                         sub_components: parsedSubs.map((s: any) => ({
//                             commodity_name: s.commodity_name,
//                             capacity_per_unit: s.capacity_per_unit
//                         }))
//                     }
//                 }
//             });
//             return Response.json({ success: res.success, message: res.success ? "Berhasil ditambahkan" : "Gagal menambahkan" });
//         }

//         if (intent === "delete_material") {
//             const res = await API.SUPPLIER_COMMODITY.update({
//                 session: { user, token },
//                 req: { body: { id, deleted: 1 } }
//             });
//             return Response.json({ success: res.success, message: res.success ? "Berhasil dihapus" : "Gagal menghapus" });
//         }
//         return Response.json({ success: false, message: "Unknown intent" });
//     } catch (e: any) {
//         return Response.json({ success: false, message: e.message });
//     }
// };

// export default function ComponentsPage() {
//     const { category } = useParams();
//     const [showForm, setShowForm] = useState(false);

//     // Unified State for Form
//     const [formState, setFormState] = useState<Partial<RawMaterial>>({
//         commodity_name: "",
//         unit: "pcs",
//         unit_price: 0,
//         is_package: 0,
//         is_affected_side: 1,
//         capacity_per_unit: 1,
//         sub_components: []
//     });

//     // Fetchers
//     const { data: rawData, reload } = useFetcherData({
//         endpoint: nexus().module("SUPPLIER_COMMODITY").action("get").params({ size: 100, level: 1 }).build(),
//     });

//     const { data: actionData, load: submitAction } = useFetcherData({
//         endpoint: "", method: "POST", autoLoad: false,
//     });

//     const { data: suppliers } = useFetcherData({
//         endpoint: nexus().module("SUPPLIER").action("get").params({ size: 100 }).build(),
//     });

//     useEffect(() => {
//         if (actionData?.success) {
//             reload();
//             setShowForm(false);
//             toast.success(actionData.message);
//         }
//     }, [actionData]);

//     const materials = useMemo(() => {
//         const items = rawData?.data?.items || [];
//         return items.filter((m: any) => m.category === category).map((m: any) => ({
//             ...m,
//             sub_components: safeParseArray(m.sub_components)
//         }));
//     }, [rawData, category]);

//     // Handlers
//     const handleSave = () => {
//         const intent = formState.id ? "update_material" : "create_material";
//         submitAction({
//             intent,
//             id: formState.id || "",
//             data: JSON.stringify({ ...formState, category }),
//             sub_components: JSON.stringify(formState.sub_components)
//         });
//     };

//     const handleDelete = (id: string, name: string) => {
//         Swal.fire({
//             title: "Hapus Komponen?",
//             text: `Yakin ingin menghapus ${name}?`,
//             icon: "warning",
//             showCancelButton: true,
//             confirmButtonColor: "#ef4444",
//             confirmButtonText: "Ya, Hapus!"
//         }).then((result) => {
//             if (result.isConfirmed) submitAction({ intent: "delete_material", id });
//         });
//     };

//     return (
//         <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
//             {/* Header */}
//             <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
//                 <div>
//                     <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">Katalog Komponen</h3>
//                     <p className="text-xs text-gray-400 font-bold uppercase mt-1">Kategori: {category?.replace(/_/g, ' ')}</p>
//                 </div>
//                 <button
//                     onClick={() => {
//                         setFormState({ commodity_name: "", unit: "pcs", unit_price: 0, is_package: 0, is_affected_side: 1, capacity_per_unit: 1, sub_components: [] });
//                         setShowForm(!showForm);
//                     }}
//                     className={`px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${showForm ? 'bg-red-50 text-red-600' : 'bg-gray-900 text-white'}`}
//                 >
//                     {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? "BATAL" : "TAMBAH KOMPONEN"}
//                 </button>
//             </div>

//             {/* Form Fungsional */}
//             {showForm && (
//                 <div className="p-8 bg-slate-50 border-b border-gray-100 animate-in slide-in-from-top duration-300">
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                         {/* Nama & Supplier */}
//                         <div className="space-y-4">
//                             <div>
//                                 <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nama Komponen</label>
//                                 <input
//                                     value={formState.commodity_name}
//                                     onChange={(e) => setFormState({ ...formState, commodity_name: e.target.value })}
//                                     className="w-full p-4 rounded-2xl border-2 border-white focus:border-violet-200 outline-none shadow-sm font-bold"
//                                     placeholder="Contoh: Tali Lanyard 2cm"
//                                 />
//                             </div>
//                             <div>
//                                 <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Supplier Utama</label>
//                                 <select
//                                     value={formState.supplier_id}
//                                     onChange={(e) => setFormState({ ...formState, supplier_id: e.target.value })}
//                                     className="w-full p-4 rounded-2xl border-2 border-white focus:border-violet-200 outline-none shadow-sm font-bold bg-white"
//                                 >
//                                     <option value="">Pilih Supplier</option>
//                                     {suppliers?.data?.items?.map((s: any) => (
//                                         <option key={s.id} value={s.id}>{s.name}</option>
//                                     ))}
//                                 </select>
//                             </div>
//                         </div>

//                         {/* Harga & Unit */}
//                         <div className="space-y-4">
//                             <div className="grid grid-cols-2 gap-3">
//                                 <div>
//                                     <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Harga Beli</label>
//                                     <input
//                                         value={formState.unit_price?.toLocaleString('id-ID')}
//                                         onChange={(e) => setFormState({ ...formState, unit_price: parseNumber(e.target.value) })}
//                                         className="w-full p-4 rounded-2xl border-2 border-white focus:border-violet-200 outline-none shadow-sm font-bold"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Satuan</label>
//                                     <input
//                                         value={formState.unit}
//                                         onChange={(e) => setFormState({ ...formState, unit: e.target.value })}
//                                         className="w-full p-4 rounded-2xl border-2 border-white focus:border-violet-200 outline-none shadow-sm font-bold"
//                                         placeholder="pcs / roll"
//                                     />
//                                 </div>
//                             </div>
//                             <div className="flex gap-4 p-2 bg-white rounded-2xl shadow-sm border-2 border-white">
//                                 <button
//                                     onClick={() => setFormState({ ...formState, is_package: 0 })}
//                                     className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${formState.is_package === 0 ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
//                                 >
//                                     SINGLE
//                                 </button>
//                                 <button
//                                     onClick={() => setFormState({ ...formState, is_package: 1 })}
//                                     className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${formState.is_package === 1 ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
//                                 >
//                                     PAKET (BUNDLE)
//                                 </button>
//                             </div>
//                         </div>

//                         {/* Kapasitas / Yield */}
//                         <div className="space-y-4">
//                             {formState.is_package === 0 && (
//                                 <div>
//                                     <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Hasil per {formState.unit}</label>
//                                     <div className="relative">
//                                         <input
//                                             type="number"
//                                             value={formState.capacity_per_unit}
//                                             onChange={(e) => setFormState({ ...formState, capacity_per_unit: Number(e.target.value) })}
//                                             className="w-full p-4 rounded-2xl border-2 border-white focus:border-violet-200 outline-none shadow-sm font-bold"
//                                         />
//                                         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">PRODUK</span>
//                                     </div>
//                                 </div>
//                             )}
//                             <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
//                                 <Info size={16} className="text-blue-500" />
//                                 <div className="text-[10px] font-bold text-blue-700 leading-tight">
//                                     Pengaruh ke kapasitas produksi?
//                                     <div className="flex gap-2 mt-1">
//                                         <label className="flex items-center gap-1 cursor-pointer">
//                                             <input type="radio" checked={formState.is_affected_side === 1} onChange={() => setFormState({ ...formState, is_affected_side: 1 })} /> Ya (2 Sisi)
//                                         </label>
//                                         <label className="flex items-center gap-1 cursor-pointer">
//                                             <input type="radio" checked={formState.is_affected_side === 0} onChange={() => setFormState({ ...formState, is_affected_side: 0 })} /> Tidak
//                                         </label>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Sub-Components (Jika Paket) */}
//                     {formState.is_package === 1 && (
//                         <div className="mt-8 p-6 bg-white rounded-3xl border-2 border-dashed border-gray-200">
//                             <div className="flex justify-between items-center mb-4">
//                                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daftar Isi Paket</h4>
//                                 <button
//                                     onClick={() => setFormState({ ...formState, sub_components: [...(formState.sub_components || []), { commodity_name: "", capacity_per_unit: 1 }] })}
//                                     className="text-violet-600 font-black text-[10px] flex items-center gap-1 hover:underline"
//                                 >
//                                     <PlusCircle size={14} /> TAMBAH ISI
//                                 </button>
//                             </div>
//                             <div className="space-y-3">
//                                 {formState.sub_components?.map((sub, idx) => (
//                                     <div key={idx} className="flex gap-3 animate-in fade-in zoom-in duration-200">
//                                         <input
//                                             placeholder="Nama Sub-Komponen"
//                                             value={sub.commodity_name}
//                                             onChange={(e) => {
//                                                 const newSubs = [...formState.sub_components!];
//                                                 newSubs[idx].commodity_name = e.target.value;
//                                                 setFormState({ ...formState, sub_components: newSubs });
//                                             }}
//                                             className="flex-1 p-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-violet-200 outline-none text-xs font-bold"
//                                         />
//                                         <input
//                                             type="number"
//                                             placeholder="Yield"
//                                             value={sub.capacity_per_unit}
//                                             onChange={(e) => {
//                                                 const newSubs = [...formState.sub_components!];
//                                                 newSubs[idx].capacity_per_unit = Number(e.target.value);
//                                                 setFormState({ ...formState, sub_components: newSubs });
//                                             }}
//                                             className="w-24 p-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-violet-200 outline-none text-xs font-bold text-center"
//                                         />
//                                         <button
//                                             onClick={() => setFormState({ ...formState, sub_components: formState.sub_components?.filter((_, i) => i !== idx) })}
//                                             className="p-3 text-red-400 hover:text-red-600 transition"
//                                         >
//                                             <Trash2 size={16} />
//                                         </button>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     )}

//                     <div className="mt-8 flex justify-end">
//                         <button onClick={handleSave} className="bg-violet-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-lg shadow-violet-100 flex items-center gap-3 active:scale-95 transition-all">
//                             <Check size={20} /> SIMPAN KOMPONEN
//                         </button>
//                     </div>
//                 </div>
//             )}

//             {/* Table List */}
//             <div className="overflow-x-auto">
//                 <table className="w-full text-sm text-left">
//                     <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
//                         <tr>
//                             <th className="px-8 py-5">Info Komponen</th>
//                             <th className="px-8 py-5">Tipe</th>
//                             <th className="px-8 py-5">Harga Beli</th>
//                             <th className="px-8 py-5">Stok</th>
//                             <th className="px-8 py-5 text-center">Aksi</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-100">
//                         {materials.length === 0 ? (
//                             <tr>
//                                 <td colSpan={4} className="py-20 text-center text-gray-300 font-black uppercase tracking-widest text-xs">Belum ada komponen di kategori ini</td>
//                             </tr>
//                         ) : (
//                             materials.map((m: RawMaterial) => (
//                                 <tr key={m.id} className="group hover:bg-slate-50/80 transition-all">
//                                     <td className="px-8 py-6">
//                                         <div className="font-black text-gray-800 text-base mb-1">{m.commodity_name}</div>
//                                         <div className="flex flex-wrap gap-1">
//                                             {+m.is_package === 1 ? (
//                                                 m.sub_components?.map((s, i) => (
//                                                     <span key={i} className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100 uppercase">
//                                                         {s.commodity_name} (x{s.capacity_per_unit})
//                                                     </span>
//                                                 ))
//                                             ) : (
//                                                 <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase">
//                                                     Hasil: {m.capacity_per_unit} per {m.unit}
//                                                 </span>
//                                             )}
//                                         </div>
//                                     </td>
//                                     <td className="px-8 py-6">
//                                         {+m.is_package === 1 ? (
//                                             <div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 w-fit">
//                                                 <Layers size={12} /> Paket
//                                             </div>
//                                         ) : (
//                                             <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 w-fit">
//                                                 <Package size={12} /> Single
//                                             </div>
//                                         )}
//                                     </td>
//                                     <td className="px-8 py-6">
//                                         <div className="font-black text-gray-700">{formatCurrency(m.unit_price)}</div>
//                                         <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Per {m.unit}</div>
//                                     </td>
//                                     <td className="px-8 py-6">
//                                         <div className="font-black text-gray-700">{Number(m.current_stock).toLocaleString()}</div>
//                                     </td>
//                                     <td className="px-8 py-6">
//                                         <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
//                                             <button
//                                                 onClick={() => { setFormState(m); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
//                                                 className="p-3 text-blue-600 bg-blue-50 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"
//                                             >
//                                                 <Edit2 size={18} />
//                                             </button>
//                                             <button
//                                                 onClick={() => handleDelete(m.id, m.commodity_name)}
//                                                 className="p-3 text-red-600 bg-red-50 rounded-2xl hover:bg-red-600 hover:text-white transition-all"
//                                             >
//                                                 <Trash2 size={18} />
//                                             </button>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ))
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// }
import { useState, useMemo, useEffect, useRef } from "react";
import { useFetcher, useParams } from "react-router";
import type { ActionFunction } from "react-router";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { nexus } from "~/lib/nexus-client";
import { useFetcherData } from "~/hooks";
import { safeParseArray } from "~/lib/utils";
import Swal from "sweetalert2";
import { formatCurrency, formatCurrencyUnprefix } from "~/constants"; // Pastikan path ini benar
import { toast } from "sonner";

// --- TYPES MOCK (Sesuaikan dengan project Anda) ---
export interface SubComponent {
    id: string;
    commodity_name?: string; // Sesuai referensi
    name?: string;
    capacity_per_unit: number;
    current_stock?: number;
    parent_id?: string;
}

export interface RawMaterial {
    id: string;
    commodity_name: string;
    category: string;
    unit: string;
    unit_price: number;
    supplier_id: string;
    current_stock: number;
    capacity_per_unit?: number;
    is_package?: number | boolean;
    sub_components?: SubComponent[];
    is_affected_side?: number | boolean;
}

interface Shop {
    id: string;
    name: string;
}

// --- HELPER ---
const parseCurrency = (value: string): number => {
    return Number(value.replace(/[^0-9]/g, ""));
};

const formatNumberInput = (val: number | string) => {
    const num = typeof val === "string" ? parseCurrency(val) : val;
    if (!num) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// --- ACTION ---
export const action: ActionFunction = async ({ request }) => {
    const { user, token }: any = await requireAuth(request);
    const formData = await request.formData();
    let { id, intent, data, sub_components }: any = Object.fromEntries(formData.entries());

    data = data ? JSON.parse(data) : {};
    sub_components = sub_components ? JSON.parse(sub_components) : [];

    try {
        if (intent === "update_material") {
            const payload = {
                id,
                commodity_name: data?.commodity_name,
                is_affected_side: data?.is_affected_side,
                is_package: data?.is_package,
                supplier_id: data?.supplier_id,
                unit: data?.unit,
                unit_price: data?.unit_price,
                capacity_per_unit: data?.capacity_per_unit,
            };
            const res = await API.SUPPLIER_COMMODITY.update({
                session: { user, token },
                req: {
                    body: {
                        ...payload,
                        sub_components: safeParseArray(sub_components)?.map((v: any) => ({
                            id: v.id.startsWith("sub-") ? null : v.id, // Handle ID baru vs lama
                            commodity_id: v.commodity_id || 0,
                            commodity_name: v.commodity_name,
                            capacity_per_unit: v.capacity_per_unit,
                        })),
                    },
                },
            });
            return Response.json({ success: res.success, message: res.message || "Berhasil update" });
        }

        if (intent === "create_material") {
            const payload = {
                commodity_id: 0,
                commodity_name: data?.commodity_name,
                is_affected_side: data?.is_affected_side,
                is_package: data?.is_package,
                supplier_id: data?.supplier_id,
                unit: data?.unit,
                unit_price: data?.unit_price,
                capacity_per_unit: data?.capacity_per_unit,
                category: data?.category // Penting agar masuk ke kategori yg benar
            };

            const res = await API.SUPPLIER_COMMODITY.create({
                session: { user, token },
                req: {
                    body: {
                        ...payload,
                        sub_components: sub_components?.map((v: any) => ({
                            commodity_id: 0,
                            commodity_name: v.commodity_name,
                            capacity_per_unit: v.capacity_per_unit
                        })),
                    },
                },
            });
            return Response.json({ success: res.success, message: res.message || "Berhasil tambah" });
        }

        if (intent === "delete_material") {
            const res = await API.SUPPLIER_COMMODITY.update({
                session: { user, token },
                req: { body: { id, deleted: 1 } },
            });
            return Response.json({ success: res.success, message: "Terhapus" });
        }
    } catch (error: any) {
        return Response.json({ success: false, message: error.message });
    }
    return Response.json({ success: false });
};

export default function ComponentsPage() {
    const { category } = useParams();
    const fetcher = useFetcher();

    // --- STATE ---
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formState, setFormState] = useState<Partial<RawMaterial>>({
        unit: "pcs",
        is_package: 0,
        is_affected_side: 1,
        sub_components: []
    });

    // --- FETCH DATA ---
    // 1. Fetch Materials
    const { data: rawData, reload } = useFetcherData({
        endpoint: nexus().module("SUPPLIER_COMMODITY").action("get").params({ size: 100, level: 1 }).build(),
    });

    // 2. Fetch Suppliers (Penting untuk Dropdown Form)
    const { data: supplierData } = useFetcherData({
        endpoint: nexus().module("SUPPLIER").action("get").params({ size: 100 }).build(),
    });

    // --- DATA PROCESSING ---
    const materials = useMemo(() => {
        const items = rawData?.data?.items || [];
        return items.filter((m: any) => m.category === category).map((m: any) => ({
            ...m,
            sub_components: safeParseArray(m.sub_components)
        }));
    }, [rawData, category]);

    const shops: Shop[] = supplierData?.data?.items || [];
    const currentShops = shops.filter((s: any) => s.category === category);

    // --- EFFECT: POST SUBMIT ---
    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data && (fetcher.data as any).success) {
            toast.success((fetcher.data as any).message || "Berhasil");
            setShowForm(false);
            setEditingId(null);
            setFormState({ unit: "pcs", is_package: 0, is_affected_side: 1, sub_components: [] });
            reload();
        }
    }, [fetcher.state, fetcher.data]);

    // --- HANDLERS ---
    const handleEdit = (mat: RawMaterial) => {
        setEditingId(mat.id);
        setFormState({
            ...mat,
            is_package: +mat.is_package!, // Pastikan number
            is_affected_side: +mat.is_affected_side!, // Pastikan number
            sub_components: safeParseArray(mat.sub_components)
        });
        setShowForm(true);
    };

    const handleAddSubComp = () => {
        setFormState({
            ...formState,
            sub_components: [
                ...(formState.sub_components || []),
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
                data: JSON.stringify({ ...formState, category }), // Sertakan kategori saat create
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
            {/* Header */}
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

            {/* Form Component - Diadaptasi dari StockPage.tsx */}
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

                    {/* Sub Components Logic */}
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
                                            const n = [...(formState.sub_components || [])];
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
                                                const n = [...(formState.sub_components || [])];
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
                                            const n = (formState.sub_components || []).filter((_, idx) => idx !== i);
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

                    {/* Affected Side Checkbox */}
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

            {/* Table List */}
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
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleEdit(m)} className="text-blue-600 hover:bg-blue-100 p-2.5 bg-blue-50 rounded-2xl transition">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(m.id, m.commodity_name)} className="text-red-400 hover:bg-red-100 p-2.5 bg-red-50 rounded-2xl transition">
                                            <Trash2 size={18} />
                                        </button>
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
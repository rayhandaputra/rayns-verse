// import { useState, useEffect } from "react";
// import { useFetcher, useLoaderData, useParams } from "react-router";
// import type { ActionFunction } from "react-router";
// import { Plus, Edit2, Trash2, MapPin, Phone, ExternalLink, Check } from "lucide-react";
// import { API } from "~/lib/api";
// import { requireAuth } from "~/lib/session.server";
// import { nexus } from "~/lib/nexus-client";
// import { useFetcherData } from "~/hooks";
// // import { Shop } from "~/types/inventory";
// import Swal from "sweetalert2";
// import { toast } from "sonner";
// import type { Shop } from "./app.procurement.$category";
// import { formatWA } from "~/lib/utils";

// // --- ACTION REMIX ---
// export const action: ActionFunction = async ({ request }) => {
//     const { user, token }: any = await requireAuth(request);
//     const formData = await request.formData();
//     const intent = formData.get("intent");
//     const dataRaw = formData.get("data") as string;
//     const id = formData.get("id") as string;

//     const data = dataRaw ? JSON.parse(dataRaw) : {};

//     try {
//         if (intent === "create_supplier" || intent === "update_supplier") {
//             const payload = { ...data }; // Mapping field sesuai API
//             const apiCall = intent === "create_supplier"
//                 ? API.SUPPLIER.create
//                 : API.SUPPLIER.update;

//             const res = await apiCall({
//                 session: { user, token },
//                 req: { body: intent === "update_supplier" ? { ...payload, id } : payload },
//             });
//             return Response.json({ success: res.success, message: res.message });
//         }

//         if (intent === "delete_supplier") {
//             const res = await API.SUPPLIER.update({
//                 session: { user, token },
//                 req: { body: { id, deleted: 1 } },
//             });
//             return Response.json({ success: res.success, message: "Terhapus" });
//         }
//     } catch (error: any) {
//         return Response.json({ success: false, message: error.message });
//     }
//     return Response.json({ success: false });
// };

// export default function SupplierPage() {
//     const { category } = useParams();
//     const fetcher = useFetcher();

//     // State Lokal untuk Form
//     const [showForm, setShowForm] = useState(false);
//     const [editingId, setEditingId] = useState<string | null>(null);
//     const [formState, setFormState] = useState<Partial<Shop>>({ type: "online" });

//     // Data Fetching Client-Side (Sesuai request menggunakan hooks yg ada)
//     const { data: supplierData, reload } = useFetcherData({
//         endpoint: nexus().module("SUPPLIER").action("get").params({ size: 100 }).build(),
//     });

//     const shops: Shop[] = (supplierData?.data?.items || []).filter(
//         (s: Shop) => s.category === category
//     );

//     // Efek setelah Action sukses
//     useEffect(() => {
//         if (fetcher.data && (fetcher.data as any).success) {
//             toast.success((fetcher.data as any).message || "Berhasil");
//             setShowForm(false);
//             setEditingId(null);
//             setFormState({ type: "online" });
//             reload(); // Refresh data
//         }
//     }, [fetcher.data]);

//     const handleSubmit = () => {
//         fetcher.submit(
//             {
//                 intent: editingId ? "update_supplier" : "create_supplier",
//                 id: editingId || "",
//                 data: JSON.stringify({ ...formState, category: category }),
//             },
//             { method: "post" }
//         );
//     };

//     const handleDelete = (id: string, name: string) => {
//         Swal.fire({
//             title: "Hapus?",
//             text: name,
//             icon: "warning",
//             showCancelButton: true,
//             confirmButtonText: "Ya",
//         }).then((res) => {
//             if (res.isConfirmed) {
//                 fetcher.submit({ intent: "delete_supplier", id }, { method: "post" });
//             }
//         });
//     };

//     return (
//         <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
//             {/* Header */}
//             <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
//                 <h3 className="font-black text-gray-800 text-lg uppercase">
//                     Database Supplier {category?.replace(/_/g, " ")}
//                 </h3>
//                 <button
//                     onClick={() => {
//                         setShowForm(!showForm);
//                         setEditingId(null);
//                         setFormState({ type: "online" });
//                     }}
//                     className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition"
//                 >
//                     <Plus size={18} /> {showForm ? "TUTUP FORM" : "TAMBAH SUPPLIER"}
//                 </button>
//             </div>

//             {/* Form Section */}
//             {showForm && (
//                 <div className="p-8 bg-gray-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                     <input
//                         placeholder="Nama Toko"
//                         className="input-field" // Asumsi ada class utility
//                         value={formState.name || ""}
//                         onChange={(e) => setFormState({ ...formState, name: e.target.value })}
//                     />
//                     <input
//                         placeholder="Lokasi"
//                         className="input-field"
//                         value={formState.location || ""}
//                         onChange={(e) => setFormState({ ...formState, location: e.target.value })}
//                     />
//                     <select
//                         className="input-field"
//                         value={formState.type}
//                         onChange={(e) => setFormState({ ...formState, type: e.target.value as any })}
//                     >
//                         <option value="online">Online Shop</option>
//                         <option value="offline">Toko Fisik</option>
//                     </select>
//                     <div className="flex gap-2">
//                         <input
//                             placeholder={formState.type === 'online' ? "Link Toko" : "No HP"}
//                             className="input-field flex-1"
//                             value={formState.type === 'online' ? formState.external_link : formState.phone}
//                             onChange={(e) => setFormState(formState.type === 'online'
//                                 ? { ...formState, external_link: e.target.value }
//                                 : { ...formState, phone: e.target.value }
//                             )}
//                         />
//                         <button onClick={handleSubmit} disabled={fetcher.state !== "idle"} className="btn-primary">
//                             <Check size={20} />
//                         </button>
//                     </div>
//                 </div>
//             )}

//             {/* List Section */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
//                 {shops.map((s) => (
//                     <div key={s.id} className="card-shop group">
//                         {/* Render Card UI Sama seperti sebelumnya, hanya ganti handler ke handleDelete / setEditingId */}
//                         <div className="flex justify-between">
//                             <h4 className="font-black text-xl uppercase">{s.name}</h4>
//                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
//                                 <button onClick={() => { setShowForm(true); setEditingId(s.id); setFormState(s); }} className="btn-icon-blue"><Edit2 size={16} /></button>
//                                 <button onClick={() => handleDelete(s.id, s.name)} className="btn-icon-red"><Trash2 size={16} /></button>
//                             </div>
//                         </div>
//                         {/* Detail Info ... */}
//                         <div className="text-xs text-gray-500 font-bold uppercase mt-2 space-y-2">
//                             <div className="flex gap-2"><MapPin size={14} /> {s.location}</div>
//                             {/* {s.phone && <div className="flex gap-2 text-green-600"><Phone size={14} /> {s.phone}</div>} */}
//                             {s.phone && (
//                                 <div className="flex gap-2 text-green-600 items-center">
//                                     <Phone size={14} />
//                                     <a
//                                         href={`https://wa.me/${formatWA(s.phone)}`}
//                                         target="_blank"
//                                         rel="noopener noreferrer"
//                                         className="hover:underline transition-all active:scale-95"
//                                     >
//                                         {s.phone}
//                                     </a>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 ))}
//             </div>
//             <style>{`
//         .input-field { width: 100%; border: 2px solid white; padding: 1rem; border-radius: 1rem; font-size: 0.875rem; font-weight: 700; outline: none; }
//         .btn-primary { padding: 0 1.5rem; background: #2563eb; color: white; border-radius: 1rem; display: flex; align-items: center; justify-content: center; }
//         .card-shop { padding: 2rem; border: 1px solid #f3f4f6; border-radius: 2.5rem; background: white; transition: all 0.2s; }
//         .card-shop:hover { border-color: #60a5fa; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
//         .btn-icon-blue { color: #60a5fa; padding: 0.5rem; background: #eff6ff; border-radius: 0.75rem; }
//         .btn-icon-red { color: #f87171; padding: 0.5rem; background: #fef2f2; border-radius: 0.75rem; }
//       `}</style>
//         </div>
//     );
// }
import { useState, useEffect } from "react";
import { useFetcher, useParams } from "react-router"; // Sesuaikan import dengan versi remix/react-router Anda
import type { ActionFunction } from "react-router";
import { Plus, Edit2, Trash2, MapPin, Phone, Check, X, ExternalLink } from "lucide-react";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { nexus } from "~/lib/nexus-client";
import { useFetcherData } from "~/hooks";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { formatWA } from "~/lib/utils";

// --- ACTION REMIX ---
export const action: ActionFunction = async ({ request }) => {
    const { user, token }: any = await requireAuth(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    // Ambil data yang dikirim sebagai string JSON
    const dataRaw = formData.get("data") as string;
    const id = formData.get("id") as string;
    const data = dataRaw ? JSON.parse(dataRaw) : {};

    try {
        if (intent === "create_supplier" || intent === "update_supplier") {
            const payload = { ...data };
            const apiCall = intent === "create_supplier"
                ? API.SUPPLIER.create
                : API.SUPPLIER.update;

            // Jika update, sertakan ID di body atau params tergantung API
            const reqBody = intent === "update_supplier" ? { ...payload, id } : payload;

            const res = await apiCall({
                session: { user, token },
                req: { body: reqBody },
            });
            return Response.json({ success: res.success, message: res.message });
        }

        if (intent === "delete_supplier") {
            const res = await API.SUPPLIER.update({
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

// Interface sesuaikan dengan API
interface Shop {
    id: string;
    name: string;
    location: string;
    type: "online" | "offline";
    phone?: string;
    external_link?: string;
    category: string;
}

export default function SupplierPage() {
    const { category } = useParams();
    const fetcher = useFetcher();

    // State Lokal
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    // Inisialisasi state form agar tidak undefined saat pertama render
    const [formState, setFormState] = useState<Partial<Shop>>({
        type: "online",
        name: "",
        location: "",
        phone: "",
        external_link: ""
    });

    // Data Fetching Client-Side
    const { data: supplierData, reload } = useFetcherData({
        endpoint: nexus().module("SUPPLIER").action("get").params({ size: 100 }).build(),
    });

    const shops: Shop[] = (supplierData?.data?.items || []).filter(
        (s: Shop) => s.category === category
    );

    // Efek setelah Action sukses
    useEffect(() => {
        // Cek jika fetcher selesai dan sukses
        if (fetcher.state === "idle" && fetcher.data && (fetcher.data as any).success) {
            toast.success((fetcher.data as any).message || "Berhasil");

            // Reset Form hanya jika intent bukan delete (atau reset semua aman)
            setShowForm(false);
            setEditingId(null);
            setFormState({ type: "online", name: "", location: "", phone: "", external_link: "" });

            reload(); // Refresh data list
        }
    }, [fetcher.state, fetcher.data]);

    const handleSubmit = () => {
        // Validasi Sederhana
        if (!formState.name) return toast.error("Nama toko wajib diisi");

        // Submit ke Action
        fetcher.submit(
            {
                intent: editingId ? "update_supplier" : "create_supplier",
                id: editingId || "",
                // Kirim semua data form + kategori dari URL params
                data: JSON.stringify({ ...formState, category: category }),
            },
            { method: "post" }
        );
    };

    const handleDelete = (id: string, name: string) => {
        Swal.fire({
            title: "Hapus Supplier?",
            text: `Yakin ingin menghapus ${name}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, Hapus",
            confirmButtonColor: "#ef4444",
            cancelButtonText: "Batal"
        }).then((res) => {
            if (res.isConfirmed) {
                fetcher.submit({ intent: "delete_supplier", id }, { method: "post" });
            }
        });
    };

    // Helper untuk reset/buka form tambah
    const handleAddClick = () => {
        setShowForm(!showForm);
        setEditingId(null);
        setFormState({ type: "online", name: "", location: "", phone: "", external_link: "" });
    };

    // Helper untuk buka form edit
    const handleEditClick = (s: Shop) => {
        setShowForm(true);
        setEditingId(s.id);
        setFormState({
            name: s.name,
            location: s.location,
            type: s.type,
            phone: s.phone || "",
            external_link: s.external_link || ""
        });
    };

    return (
        <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <h3 className="font-black text-gray-800 text-lg uppercase">
                    Database Supplier {category?.replace(/_/g, " ")}
                </h3>
                <button
                    onClick={handleAddClick}
                    className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition hover:bg-gray-800"
                >
                    <Plus size={18} /> {showForm ? "TUTUP FORM" : "TAMBAH SUPPLIER"}
                </button>
            </div>

            {/* Form Section */}
            {showForm && (
                <div className="p-8 bg-gray-50 border-b border-gray-100 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Nama Toko</label>
                            <input
                                placeholder="Contoh: Toko Maju Jaya"
                                className="input-field"
                                value={formState.name}
                                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Lokasi</label>
                            <input
                                placeholder="Contoh: Jakarta / Tokopedia"
                                className="input-field"
                                value={formState.location}
                                onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Tipe Toko</label>
                            <select
                                className="input-field bg-white"
                                value={formState.type}
                                onChange={(e) => setFormState({ ...formState, type: e.target.value as any })}
                            >
                                <option value="online">Online Shop</option>
                                <option value="offline">Toko Fisik</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">
                                {formState.type === 'online' ? "Link Eksternal" : "Nomor WhatsApp"}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    placeholder={formState.type === 'online' ? "https://..." : "0812..."}
                                    className="input-field flex-1"
                                    value={formState.type === 'online' ? formState.external_link : formState.phone}
                                    onChange={(e) => setFormState(formState.type === 'online'
                                        ? { ...formState, external_link: e.target.value }
                                        : { ...formState, phone: e.target.value }
                                    )}
                                />
                                <button
                                    onClick={handleSubmit}
                                    disabled={fetcher.state !== "idle"}
                                    className="btn-primary"
                                    title="Simpan Data"
                                >
                                    {fetcher.state !== "idle" ? "..." : <Check size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* List Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
                {shops.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-400 font-bold">
                        Belum ada data supplier untuk kategori ini.
                    </div>
                )}

                {shops.map((s) => (
                    <div key={s.id} className="card-shop group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-black text-xl uppercase text-gray-800">{s.name}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${s.type === 'online' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {s.type}
                                </span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 right-6 bg-white pl-2">
                                <button onClick={() => handleEditClick(s)} className="btn-icon-blue" title="Edit">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(s.id, s.name)} className="btn-icon-red" title="Hapus">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 font-bold uppercase mt-2 space-y-2 border-t border-gray-50 pt-4">
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-gray-400" />
                                <span className="truncate">{s.location || "-"}</span>
                            </div>

                            {s.phone && (
                                <div className="flex items-center gap-2 text-green-600">
                                    <Phone size={14} />
                                    <a
                                        href={`https://wa.me/${formatWA(s.phone)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline"
                                    >
                                        {s.phone}
                                    </a>
                                </div>
                            )}

                            {s.external_link && (
                                <div className="flex items-center gap-2 text-blue-600">
                                    <ExternalLink size={14} />
                                    <a
                                        href={s.external_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline truncate w-full"
                                    >
                                        Buka Link Toko
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .input-field { width: 100%; border: 2px solid #f3f4f6; padding: 1rem; border-radius: 1rem; font-size: 0.875rem; font-weight: 700; outline: none; transition: all 0.2s; }
                .input-field:focus { border-color: #3b82f6; }
                .btn-primary { padding: 0 1.5rem; background: #2563eb; color: white; border-radius: 1rem; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
                .btn-primary:hover { background: #1d4ed8; }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
                .card-shop { padding: 2rem; border: 1px solid #f3f4f6; border-radius: 2rem; background: white; transition: all 0.2s; }
                .card-shop:hover { border-color: #bfdbfe; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
                .btn-icon-blue { color: #3b82f6; padding: 0.5rem; background: #eff6ff; border-radius: 0.75rem; transition: background 0.2s; }
                .btn-icon-blue:hover { background: #dbeafe; }
                .btn-icon-red { color: #ef4444; padding: 0.5rem; background: #fef2f2; border-radius: 0.75rem; transition: background 0.2s; }
                .btn-icon-red:hover { background: #fee2e2; }
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
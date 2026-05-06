import React, { useState, useEffect } from "react";
import { useFetcher, useParams } from "react-router";
import { Store, Plus, MapPin, Edit2, Trash2, Link as LinkIcon, MessageCircle, Check, Tag, Scissors } from "lucide-react";
import { nexus } from "~/nexus/nexus-client";
import { useFetcherData } from "~/hooks";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { formatWA } from "~/utils/utils";
import { Shop } from "./types";

const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

const parseCurrency = (val: string) => Number(val.replace(/[^0-9]/g, "")) || 0;

const formatNumberInput = (val: number | string) => {
    const num = typeof val === 'string' ? parseCurrency(val) : val;
    if (!num) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function ProcurementVendorFeature() {
    const { category } = useParams();
    const fetcher = useFetcher();

    const [showAddShop, setShowAddShop] = useState(false);
    const [editingShopId, setEditingShopId] = useState<string | null>(null);
    const [formState, setFormState] = useState<Partial<Shop>>({ type: 'online', cotton_combed_category: 'kaos' });

    const { data: supplierData, reload } = useFetcherData({
        endpoint: nexus().module("SUPPLIER").action("get").params({ size: 100, category: "cotton_combed_premium" }).build(),
    });

    const shops: Shop[] = supplierData?.data?.items || [];

    useEffect(() => {
        if (fetcher.data && (fetcher.data as any).success) {
            toast.success((fetcher.data as any).message || "Berhasil");
            setTimeout(() => {
                setShowAddShop(false);
                setEditingShopId(null);
                setFormState({ type: 'online', cotton_combed_category: 'kaos' });
                reload();
            }, 0);
        } else if (fetcher.data && !(fetcher.data as any).success) {
            toast.error((fetcher.data as any).message || "Gagal memproses data");
        }
    }, [fetcher.data]);

    const handleEdit = (shop: Shop) => {
        setEditingShopId(shop.id);
        setFormState({
            ...shop,
            type: shop.type.toLowerCase() as "online" | "offline"
        });
        setShowAddShop(true);
    };

    const handleDelete = (id: string, name: string) => {
        Swal.fire({
            title: "Hapus Vendor?",
            text: `Yakin ingin menghapus ${name}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, Hapus",
            cancelButtonText: "Batal",
            customClass: {
                confirmButton: "bg-red-600 text-white px-4 py-2 rounded-lg",
                cancelButton: "bg-gray-200 text-gray-800 px-4 py-2 rounded-lg ml-2"
            }
        }).then((res) => {
            if (res.isConfirmed) {
                fetcher.submit({ intent: "delete", id }, { method: "post" });
            }
        });
    };

    const handleSubmit = () => {
        if (!formState.name) return toast.error("Nama Vendor wajib diisi");

        fetcher.submit(
            {
                intent: editingShopId ? "update" : "create",
                id: editingShopId || "",
                data: JSON.stringify(formState),
            },
            { method: "post" }
        );
    };

    const updateForm = (key: keyof Shop, value: any) => {
        setFormState(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">Database Vendor Kaos & Sablon</h3>
                    <button
                        onClick={() => {
                            setShowAddShop(!showAddShop);
                            setEditingShopId(null);
                            setFormState({ type: 'online', cotton_combed_category: 'kaos' });
                        }}
                        className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-xs font-black flex items-center gap-2 transition hover:bg-gray-800 shadow-xl shadow-gray-200"
                    >
                        <Plus size={18} /> TAMBAH VENDOR
                    </button>
                </div>

                {showAddShop && (
                    <div className="p-10 bg-gray-50 border-b border-gray-100 animate-fade-in space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase px-1">Nama Vendor:</label>
                                <input
                                    placeholder="Nama Vendor..."
                                    className="w-full border-2 border-white p-4 rounded-2xl outline-none text-sm font-bold bg-white"
                                    value={formState.name || ''}
                                    onChange={e => updateForm('name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase px-1">Lokasi:</label>
                                <input
                                    placeholder="Kota/Alamat..."
                                    className="w-full border-2 border-white p-4 rounded-2xl outline-none text-sm font-bold bg-white"
                                    value={formState.location || ''}
                                    onChange={e => updateForm('location', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase px-1">Kategori:</label>
                                <select
                                    className="w-full border-2 border-white p-4 rounded-2xl outline-none text-sm font-bold bg-white"
                                    value={formState.cotton_combed_category}
                                    onChange={e => updateForm('cotton_combed_category', e.target.value as any)}
                                >
                                    <option value="kaos">Vendor Kaos Polos</option>
                                    <option value="sablon">Vendor Sablon DTF</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase px-1">Tipe Vendor:</label>
                                <select
                                    className="w-full border-2 border-white p-4 rounded-2xl outline-none text-sm font-bold bg-white"
                                    value={formState.type}
                                    onChange={e => updateForm('type', e.target.value as any)}
                                >
                                    <option value="online">Online / Marketplace</option>
                                    <option value="offline">Offline / Konveksi</option>
                                </select>
                            </div>

                            <div className="space-y-2 lg:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase px-1">
                                    {formState.type === 'online' ? 'Link Toko/Marketplace:' : 'Nomor WhatsApp:'}
                                </label>
                                <input
                                    placeholder={formState.type === 'online' ? "https://..." : "0812..."}
                                    className="w-full border-2 border-white p-4 rounded-2xl outline-none text-sm font-bold bg-white"
                                    value={formState.type === 'online' ? (formState.external_link || '') : (formState.phone || '')}
                                    onChange={e => updateForm(
                                        formState.type === 'online' ? 'external_link' : 'phone',
                                        e.target.value
                                    )}
                                />
                            </div>
                        </div>

                        {formState.cotton_combed_category === 'kaos' ? (
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-2">
                                    <Tag size={14} /> Detail Harga Kaos Vendor (Per PCS)
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                                    {[
                                        { k: 'price_s_xl', l: 'Harga S - XL' },
                                        { k: 'price_2xl', l: 'Harga 2XL' },
                                        { k: 'price_3xl', l: 'Harga 3XL' },
                                        { k: 'price_4xl', l: 'Harga 4XL' },
                                        { k: 'price_5xl', l: 'Harga 5XL' },
                                        { k: 'price_long_sleeve', l: 'Lengan Pjg' }
                                    ].map(field => (
                                        <div key={field.k} className="relative">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">{field.l}</label>
                                            <span className="absolute left-4 top-11 text-sm font-bold text-gray-400">Rp</span>
                                            <input
                                                type="text"
                                                className="w-full border-2 border-gray-100 p-4 pl-10 rounded-2xl text-sm font-bold focus:border-blue-400 outline-none"
                                                value={formatNumberInput((formState as any)[field.k] || 0)}
                                                onChange={e => updateForm(field.k as keyof Shop, parseCurrency(e.target.value))}
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-[32px] border border-orange-100 shadow-sm space-y-4">
                                <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-2">
                                    <Scissors size={14} /> Detail Harga Sablon Vendor
                                </h4>
                                <div className="relative max-w-xs">
                                    <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Harga per Meter (DTF)</label>
                                    <span className="absolute left-4 top-11 text-sm font-bold text-gray-400">Rp</span>
                                    <input
                                        type="text"
                                        className="w-full border-2 border-gray-100 p-4 pl-10 rounded-2xl text-sm font-bold focus:border-orange-400 outline-none"
                                        value={formatNumberInput(formState.price_per_meter || 0)}
                                        onChange={e => updateForm('price_per_meter', parseCurrency(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setShowAddShop(false)}
                                disabled={fetcher.state !== 'idle'}
                                className="px-8 py-4 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-100 transition disabled:opacity-50"
                            >
                                BATAL
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={fetcher.state !== 'idle'}
                                className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {fetcher.state !== 'idle' ? 'MENYIMPAN...' : <><Check size={20} /> SIMPAN</>}
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-10">
                    {shops.length === 0 ? (
                        <div className="col-span-full text-center text-gray-400 py-10 italic">
                            Belum ada data vendor. Silakan tambah vendor baru.
                        </div>
                    ) : (
                        shops.map(s => (
                            <div key={s.id} className={`p-8 border rounded-[40px] hover:shadow-xl transition bg-white shadow-sm group relative flex flex-col justify-between ${s.cotton_combed_category === 'sablon' ? 'border-orange-100' : 'border-gray-100'}`}>
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className={`text-[8px] font-black px-2 py-0.5 rounded-full w-fit mb-2 uppercase ${s.cotton_combed_category === 'sablon' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{s.cotton_combed_category}</div>
                                            <h4 className="font-black text-gray-800 text-xl uppercase leading-tight mb-1 truncate pr-2" title={s.name}>{s.name}</h4>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                                                <MapPin size={12} />
                                                {s.location || "-"} • {s.type}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button onClick={() => handleEdit(s)} className="text-blue-400 hover:text-blue-600 p-2 bg-blue-50 rounded-xl"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(s.id, s.name)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-xl"><Trash2 size={16} /></button>
                                        </div>
                                    </div>

                                    {s.cotton_combed_category === 'kaos' ? (
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6 border-t border-gray-50 mb-8">
                                            <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-gray-400">S - XL</span><span className="font-black text-gray-800">{formatCurrency(s.price_s_xl || 0)}</span></div>
                                            <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-gray-400">2XL</span><span className="font-black text-gray-800">{formatCurrency(s.price_2xl || 0)}</span></div>
                                            <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-gray-400">3XL</span><span className="font-black text-gray-800">{formatCurrency(s.price_3xl || 0)}</span></div>
                                            <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-gray-400">4XL</span><span className="font-black text-gray-800">{formatCurrency(s.price_4xl || 0)}</span></div>
                                            <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-gray-400">5XL</span><span className="font-black text-gray-800">{formatCurrency(s.price_5xl || 0)}</span></div>
                                            <div className="flex justify-between items-center text-[10px]"><span className="font-bold text-gray-400">L. PJG</span><span className="font-black text-gray-800">{formatCurrency(s.price_long_sleeve || 0)}</span></div>
                                        </div>
                                    ) : (
                                        <div className="pt-6 border-t border-orange-50 mb-8">
                                            <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sablon DTF</span><span className="text-lg font-black text-orange-600">{formatCurrency(s.price_per_meter || 0)} <span className="text-xs">/m</span></span></div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    {s.type === 'online' && s.external_link ? (
                                        <a href={s.external_link} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-sm transition shadow-lg shadow-blue-100">
                                            <LinkIcon size={18} /> BUKA MARKETPLACE
                                        </a>
                                    ) : s.phone ? (
                                        <a href={`https://wa.me/${formatWA(s.phone)}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-sm transition shadow-lg shadow-green-100">
                                            <MessageCircle size={20} /> HUBUNGI VENDOR
                                        </a>
                                    ) : (
                                        <div className="w-full py-4 text-center text-xs font-bold text-gray-300 bg-gray-50 rounded-2xl border border-dashed border-gray-200 uppercase tracking-widest">Kontak Belum Ada</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

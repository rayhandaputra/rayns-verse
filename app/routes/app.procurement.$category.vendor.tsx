/* === DATABASE REQUIREMENTS (Table: shops) ===
  - id: VARCHAR/UUID (Primary Key)
  - name: VARCHAR
  - location: VARCHAR
  - type: ENUM('Online', 'Offline')
  - category: ENUM('Kaos', 'Sablon')
  - wa: VARCHAR (Nullable)
  - link: VARCHAR (Nullable)
  - price_s_xl: DECIMAL/INT (Default 0)
  - price_2xl: DECIMAL/INT (Default 0)
  - price_3xl: DECIMAL/INT (Default 0)
  - price_4xl: DECIMAL/INT (Default 0)
  - price_5xl: DECIMAL/INT (Default 0)
  - price_long_sleeve: DECIMAL/INT (Default 0) -- Biaya tambahan lengan panjang
  - price_per_meter: DECIMAL/INT (Default 0) -- Khusus kategori sablon
*/

import React, { useState } from 'react';
import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useSubmit, Form } from 'react-router';
import { Store, Plus, MapPin, Edit2, Trash2, Link as LinkIcon, MessageCircle, Check, Tag, Scissors } from 'lucide-react';
// import { type Shop, formatCurrency, parseCurrency, formatNumberInput } from '~/types/kaos';

export interface ShirtColor {
    id: string;
    name: string;
    imageUrl: string;
    createdAt: string;
}

export interface Shop {
    id: string;
    name: string;
    location: string;
    type: 'Online' | 'Offline';
    wa?: string;
    link?: string;
    category: 'Kaos' | 'Sablon';
    // Harga Kaos
    priceSXL?: number;
    price2XL?: number;
    price3XL?: number;
    price4XL?: number;
    price5XL?: number;
    priceLongSleeve?: number;
    // Harga Sablon
    pricePerMeter?: number;
}

export interface ShirtSizeItem {
    size: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL' | '5XL';
    sleeve: 'Pendek' | 'Panjang';
    color?: string;
    quantity: number;
}

export interface Order {
    id: string;
    instansi: string;
    jenisPesanan: string; // Harus mengandung 'cotton' untuk deteksi
    statusPengerjaan: string;
    jumlah: number;
    totalAmount: number; // Nilai jual ke customer
    createdAt: string;
    shirtSizes?: ShirtSizeItem[];
    items?: { productName: string }[];
}

export interface Transaction {
    id: string;
    date: string;
    type: 'Expense' | 'Income';
    category: 'Bahan Baku' | 'Operasional';
    amount: number;
    description: string;
    isAuto: boolean;
    proofImage?: string;
}

// Utils Sederhana
const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

const parseCurrency = (val: string) => Number(val.replace(/[^0-9]/g, "")) || 0;

const formatNumberInput = (val: number | string) => {
    const num = typeof val === 'string' ? parseCurrency(val) : val;
    if (!num) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// --- LOADER (GET DATA) ---
export const loader = async ({ request }: LoaderFunctionArgs) => {
    // const shops = await db.shops.findMany(); 
    const shops: Shop[] = []; // Replace with actual DB call
    return Response.json({ shops });
};

// --- ACTION (MUTATION) ---
export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const intent = formData.get('intent');
    // Handle Create/Update/Delete logic here based on intent
    return Response.json({ success: true });
};

export default function KaosVendorsPage() {
    const { shops } = useLoaderData<typeof loader>();
    const submit = useSubmit();

    const [showAddShop, setShowAddShop] = useState(false);
    const [editingShopId, setEditingShopId] = useState<string | null>(null);
    const [formState, setFormState] = useState<Partial<Shop>>({ type: 'Online', category: 'Kaos' });

    const handleEdit = (shop: Shop) => {
        setEditingShopId(shop.id);
        setFormState(shop);
        setShowAddShop(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Hapus vendor ini?')) {
            submit({ intent: 'delete', id }, { method: 'post' });
        }
    };

    // Helper untuk update state form
    const updateForm = (key: keyof Shop, value: any) => {
        setFormState(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6 animate-fade-in p-6">
            {/* Header */}
            <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">Database Vendor Kaos & Sablon</h3>
                    <button
                        onClick={() => { setShowAddShop(!showAddShop); setEditingShopId(null); setFormState({ type: 'Online', category: 'Kaos' }); }}
                        className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-xs font-black flex items-center gap-2 transition hover:bg-gray-800 shadow-xl shadow-gray-200"
                    >
                        <Plus size={18} /> TAMBAH VENDOR
                    </button>
                </div>

                {/* Form Add/Edit */}
                {showAddShop && (
                    <Form method="post" className="p-10 bg-gray-50 border-b border-gray-100 animate-fade-in space-y-8">
                        <input type="hidden" name="intent" value={editingShopId ? 'update' : 'create'} />
                        <input type="hidden" name="id" value={editingShopId || ''} />

                        {/* ... (Existing Grid Inputs) ... */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase px-1">Nama Vendor:</label>
                                <input name="name" placeholder="Nama Vendor..." className="w-full border-2 border-white p-4 rounded-2xl outline-none text-sm font-bold bg-white" value={formState.name || ''} onChange={e => updateForm('name', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase px-1">Kategori:</label>
                                <select name="category" className="w-full border-2 border-white p-4 rounded-2xl outline-none text-sm font-bold bg-white" value={formState.category} onChange={e => updateForm('category', e.target.value as any)}>
                                    <option value="Kaos">Vendor Kaos Polos</option>
                                    <option value="Sablon">Vendor Sablon DTF</option>
                                </select>
                            </div>
                            {/* ... (Other inputs: Type, Link/WA) ... */}
                        </div>

                        {/* Conditional Pricing Inputs */}
                        {formState.category === 'Kaos' ? (
                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b border-gray-50 pb-4 flex items-center gap-2"><Tag size={14} /> Detail Harga Kaos Vendor (Per PCS)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                                    {[
                                        { k: 'priceSXL', l: 'Harga S - XL' },
                                        { k: 'price2XL', l: 'Harga 2XL' },
                                        { k: 'price3XL', l: 'Harga 3XL' },
                                        { k: 'price4XL', l: 'Harga 4XL' },
                                        { k: 'price5XL', l: 'Harga 5XL' },
                                        { k: 'priceLongSleeve', l: 'Lengan Pjg' }
                                    ].map(field => (
                                        <div key={field.k} className="relative">
                                            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">{field.l}</label>
                                            <span className="absolute left-4 top-11 text-sm font-bold text-gray-400">Rp</span>
                                            <input
                                                type="text"
                                                name={field.k}
                                                className="w-full border-2 border-gray-100 p-4 pl-10 rounded-2xl text-sm font-bold"
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
                                {/* ... (Sablon Inputs) ... */}
                                <div className="relative max-w-xs">
                                    <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Harga per Meter (DTF)</label>
                                    <span className="absolute left-4 top-11 text-sm font-bold text-gray-400">Rp</span>
                                    <input name="pricePerMeter" type="text" className="w-full border-2 border-gray-100 p-4 pl-10 rounded-2xl text-sm font-bold" value={formatNumberInput(formState.pricePerMeter || 0)} onChange={e => updateForm('pricePerMeter', parseCurrency(e.target.value))} placeholder="0" />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={() => setShowAddShop(false)} className="px-8 py-4 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-100 transition">BATAL</button>
                            <button type="submit" className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition flex items-center gap-2"><Check size={20} /> SIMPAN</button>
                        </div>
                    </Form>
                )}

                {/* List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-10">
                    {shops.map(s => (
                        <div key={s.id} className={`p-8 border rounded-[40px] hover:shadow-xl transition bg-white shadow-sm group relative flex flex-col justify-between ${s.category === 'Sablon' ? 'border-orange-100' : 'border-gray-100'}`}>
                            {/* ... (Card UI Implementation similar to original) ... */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className={`text-[8px] font-black px-2 py-0.5 rounded-full w-fit mb-2 uppercase ${s.category === 'Sablon' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{s.category}</div>
                                    <h4 className="font-black text-gray-800 text-xl uppercase leading-tight mb-1">{s.name}</h4>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400"><MapPin size={12} /> {s.location} • {s.type.toUpperCase()}</div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => handleEdit(s)} className="text-blue-400 hover:text-blue-600 p-2 bg-blue-50 rounded-xl"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-xl"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            {/* Pricing Display Logic */}
                            {/* ... Reuse the UI logic from original code here ... */}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
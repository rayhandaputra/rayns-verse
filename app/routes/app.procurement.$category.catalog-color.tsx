/* === DATABASE REQUIREMENTS (Table: shirt_colors) ===
  - id: VARCHAR/UUID (Primary Key)
  - name: VARCHAR
  - image_url: TEXT/VARCHAR (Store path or Base64 if small)
  - created_at: DATETIME
*/

import React, { useState, useRef } from 'react';
import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { useLoaderData, useSubmit, Form } from 'react-router';
import { Palette, Upload, Check, Trash2 } from 'lucide-react';
// import type { ShirtColor } from '~/types/kaos';

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
    // const colors = await db.shirtColors.findMany({ orderBy: { createdAt: 'desc' } });
    const colors: ShirtColor[] = [];
    return Response.json({ colors });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    // Handle image upload handling (write to disk/S3) and DB insert
    return Response.json({ success: true });
};

export default function KaosColorsPage() {
    const { colors } = useLoaderData<typeof loader>();
    const submit = useSubmit();

    const [newColorName, setNewColorName] = useState('');
    const [newColorImage, setNewColorImage] = useState('');
    const colorFileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = () => setNewColorImage(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Hapus warna ini?')) submit({ intent: 'delete', id }, { method: 'post' });
    }

    return (
        <div className="space-y-6 animate-fade-in p-6">
            {/* Form Upload */}
            <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-gray-100 bg-violet-50/20">
                    <h3 className="font-black text-gray-800 flex items-center gap-3"><Palette size={22} className="text-violet-600" /> MANAJEMEN WARNA KAIN</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase mt-2">Upload contoh warna kain (PNG) agar muncul di pilihan warna customer.</p>
                </div>
                <Form method="post" encType="multipart/form-data" className="p-10">
                    <input type="hidden" name="intent" value="create" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Nama Warna</label>
                            <input name="name" className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-black focus:border-violet-400 outline-none" placeholder="Contoh: Maroon, Navy" value={newColorName} onChange={e => setNewColorName(e.target.value)} required />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Gambar PNG (134x105)</label>
                                {/* Input File Hidden */}
                                <input type="file" name="image" ref={colorFileInputRef} className="hidden" accept="image/png" onChange={handleImageUpload} />

                                <button type="button" onClick={() => colorFileInputRef.current?.click()} className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed transition font-black text-sm ${newColorImage ? 'border-violet-400 bg-violet-50 text-violet-600' : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-violet-200'}`}>
                                    {newColorImage ? <Check size={20} /> : <Upload size={20} />} {newColorImage ? 'GAMBAR DIPILIH' : 'PILIH GAMBAR'}
                                </button>
                            </div>
                            <button type="submit" disabled={!newColorName || !newColorImage} className="bg-violet-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-violet-700 disabled:opacity-50 transition shadow-lg">TAMBAH WARNA</button>
                        </div>
                    </div>
                </Form>
            </div>

            {/* Grid List */}
            <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden p-10">
                <div className="flex justify-between items-center mb-10"><h3 className="font-black text-gray-800 text-lg uppercase flex items-center gap-3"><Palette size={24} className="text-violet-600" /> Katalog Warna Tersedia</h3></div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {colors.map(color => (
                        <div key={color.id} className="group relative bg-gray-50 p-3 rounded-[32px] border-2 border-transparent hover:border-violet-200 transition-all flex flex-col items-center gap-3 shadow-sm">
                            <div className="w-24 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-white"><img src={color.imageUrl} className="w-full h-full object-cover" alt={color.name} /></div>
                            <div className="text-[10px] font-black text-gray-700 text-center uppercase tracking-tight truncate w-full px-1">{color.name}</div>
                            <button onClick={() => handleDelete(color.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"><Trash2 size={12} /></button>
                        </div>
                    ))}
                    {colors.length === 0 && <div className="col-span-full py-20 text-center text-xs font-bold text-gray-300 uppercase tracking-[0.2em] border-2 border-dashed border-gray-100 rounded-[32px]">Belum ada katalog warna</div>}
                </div>
            </div>
        </div>
    );
}
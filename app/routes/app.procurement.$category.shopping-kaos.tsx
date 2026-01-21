/* === DATABASE REQUIREMENTS ===
  Table: transactions
  - id: VARCHAR (PK)
  - created_at: DATETIME
  - type: ENUM('Expense')
  - category: VARCHAR ('Bahan Baku')
  - amount: DECIMAL
  - description: TEXT (Stores JSON or structured string for order ref)
  - is_auto: BOOLEAN
  - proof_image: TEXT (Base64 or URL)

  Table: orders (References)
  - Must allow querying by 'status_pengerjaan' != 'selesai'
  - JSON field for shirt_sizes: [{size, sleeve, color, quantity}]
*/

import React, { useState, useMemo, useRef } from 'react';
// import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from 'react-router';
import { ShoppingCart, Check, FileText, Palette, Scissors, Ruler, X } from 'lucide-react';
// import { type Shop, type Order, type Transaction, type ShirtColor, formatCurrency, parseCurrency, formatNumberInput } from '~/types/kaos';
import type { LoaderFunction } from 'react-router';
import type { ActionFunction } from 'react-router';

// ~/types/kaos.ts

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

// --- LOADER ---
export const loader: LoaderFunction = async ({ request }) => {
    // Fetch data in parallel
    // const [shops, orders, transactions, colors] = await Promise.all([...])
    const shops: Shop[] = [];
    const orders: Order[] = [];
    const transactions: Transaction[] = [];
    const colors: ShirtColor[] = [];

    return Response.json({ shops, orders, transactions, colors });
};

// --- ACTION ---
export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    // Handle 'create_expense' logic for both Cotton and Sablon
    return Response.json({ success: true });
};

export default function KaosProcurementPage() {
    const { shops, orders, transactions, colors: shirtColors } = useLoaderData<typeof loader>();
    const submit = useSubmit();

    // Local State for Calculations
    const [selectedShopId, setSelectedShopId] = useState<string>('');
    const [selectedOrderId, setSelectedOrderId] = useState<string>('');
    const [mDiscountStr, setMDiscountStr] = useState('');
    const [mAdminStr, setMAdminStr] = useState('');
    const [mShippingStr, setMShippingStr] = useState('');

    // Sablon State
    const [activeSablonForm, setActiveSablonForm] = useState<string | null>(null);
    const [sablonShopId, setSablonShopId] = useState('');
    const [sablonQtyMeters, setSablonQtyMeters] = useState('');
    // ... other sablon costs state ...

    // --- MEMOS (LOGIC) ---
    const cottonOrderOptions = useMemo(() => {
        // Filter orders logic... (same as original)
        return orders; // Placeholder for logic
    }, [orders, transactions]);

    const selectedOrderData = useMemo(() => orders.find((o: any) => o.id === selectedOrderId), [orders, selectedOrderId]);
    const selectedVendorData = useMemo(() => shops.find((s: any) => s.id === selectedShopId), [shops, selectedShopId]);

    // Kalkulator Harga Otomatis (Client Side for responsiveness)
    const cottonProcurementCalc = useMemo(() => {
        if (!selectedOrderData || !selectedVendorData) return { total: 0, itemsByColor: {} };

        const getUnitPrice = (size: string, sleeve: string) => {
            let base = 0;
            if (['XS', 'S', 'M', 'L', 'XL'].includes(size)) base = selectedVendorData.priceSXL || 0;
            else if (size === '2XL') base = selectedVendorData.price2XL || 0;
            else if (size === '3XL') base = selectedVendorData.price3XL || 0;
            else if (size === '4XL') base = selectedVendorData.price4XL || 0;
            else if (size === '5XL') base = selectedVendorData.price5XL || 0;

            if (sleeve === 'Panjang') base += (selectedVendorData.priceLongSleeve || 0);
            return base;
        };

        const grouped: Record<string, any[]> = {};
        // Grouping logic based on shirtSizes...
        if (selectedOrderData.shirtSizes) {
            selectedOrderData.shirtSizes.forEach((s: any) => {
                const uPrice = getUnitPrice(s.size, s.sleeve);
                const colorKey = s.color || 'Belum Diatur';
                if (!grouped[colorKey]) grouped[colorKey] = [];
                grouped[colorKey].push({ ...s, price: uPrice, total: uPrice * s.quantity });
            });
        }

        let grandTotal = 0;
        Object.values(grouped).forEach(items => items.forEach(it => grandTotal += it.total));
        return { total: grandTotal, itemsByColor: grouped };
    }, [selectedOrderData, selectedVendorData]);

    // --- HANDLERS ---
    const handleProcessBelanja = () => {
        if (!selectedShopId || !selectedOrderId) return alert("Pilih Vendor dan Pesanan.");

        const finalTotal = cottonProcurementCalc.total
            + parseCurrency(mAdminStr)
            + parseCurrency(mShippingStr)
            - parseCurrency(mDiscountStr);

        const description = `[COTTON] Belanja Kaos di ${selectedVendorData?.name} untuk ${selectedOrderData?.instansi}...`;

        const formData = new FormData();
        formData.append('intent', 'create_expense');
        formData.append('category', 'Bahan Baku');
        formData.append('amount', finalTotal.toString());
        formData.append('description', description);

        submit(formData, { method: 'post' });
    };

    return (
        <div className="space-y-8 animate-fade-in p-6">
            {/* FORM BELANJA KAOS */}
            <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-gray-100 bg-blue-50/20">
                    <h3 className="font-black text-gray-800 text-lg flex items-center gap-3"><ShoppingCart size={24} className="text-blue-600" /> FORM BELANJA VENDOR KAOS</h3>
                </div>
                <div className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Select Vendor */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Pilih Vendor Kaos:</label>
                            <select className="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 text-sm font-black focus:border-blue-400 outline-none transition shadow-sm" value={selectedShopId} onChange={e => setSelectedShopId(e.target.value)}>
                                <option value="">-- Pilih Vendor Kaos --</option>
                                {shops.filter((s: any) => s.category === 'Kaos').map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.location})</option>)}
                            </select>
                        </div>
                        {/* Select Order */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Pesanan Kaos Baru:</label>
                            <select className="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 text-sm font-black focus:border-blue-400 outline-none transition shadow-sm" value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
                                <option value="">-- Pilih Pesanan --</option>
                                {cottonOrderOptions.map((o: any) => <option key={o.id} value={o.id}>{o.instansi} ({o.jumlah} pcs)</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Calculation Result & Submit */}
                    {selectedShopId && selectedOrderId && (
                        <div className="space-y-10 animate-fade-in">
                            {/* Rincian Per Warna */}
                            <div className="space-y-8">
                                {Object.entries(cottonProcurementCalc.itemsByColor).map(([colorName, items]: [string, any[]]) => (
                                    <div key={colorName} className="bg-gray-50 rounded-[32px] border border-gray-200 overflow-hidden shadow-sm">
                                        <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300"><Palette size={20} /></div>
                                                <div><h4 className="text-lg font-black text-gray-800 uppercase leading-none">{colorName}</h4></div>
                                            </div>
                                            {/* Total per color */}
                                            <div className="text-right"><div className="text-xl font-black text-blue-600">{formatCurrency(items.reduce((a, b) => a + b.total, 0))}</div></div>
                                        </div>
                                        {/* Table Items */}
                                        <table className="w-full text-left text-xs font-bold">
                                            <tbody className="divide-y divide-gray-100 bg-white/50">
                                                {items.map((it, i) => (
                                                    <tr key={i}>
                                                        <td className="px-8 py-4">{it.size} {it.sleeve}</td>
                                                        <td className="px-8 py-4 text-center">{it.quantity} PCS</td>
                                                        <td className="px-8 py-4 text-right">{formatCurrency(it.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>

                            {/* Grand Total Bar */}
                            <div className="bg-gray-900 rounded-[40px] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden">
                                <div className="relative z-10 space-y-6">
                                    <div className="text-4xl font-black text-blue-400">{formatCurrency(cottonProcurementCalc.total)}</div>
                                </div>
                                <div className="relative z-10 flex flex-col gap-4 w-full md:w-auto">
                                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <input className="input-dark" placeholder="Potongan" value={mDiscountStr} onChange={e => setMDiscountStr(formatNumberInput(e.target.value))} />
                                            <input className="input-dark" placeholder="Admin" value={mAdminStr} onChange={e => setMAdminStr(formatNumberInput(e.target.value))} />
                                        </div>
                                    </div>
                                    <button onClick={handleProcessBelanja} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[28px] font-black flex items-center justify-center gap-3 transition-all shadow-xl"><Check size={24} /> CATAT PENGADAAN</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* LOG HISTORY TABLE */}
            <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                <div className="p-10 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-black text-gray-800 text-lg flex items-center gap-3 uppercase tracking-tight"><FileText size={22} className="text-purple-600" /> Log Pengadaan & Laba</h3>
                </div>
                {/* ... Render Table similar to original code, iterating over orders/transactions ... */}
                <div className="p-10 text-center text-gray-400 font-bold text-sm">
                    (Table Log Implementation Here - Using mapped transactions)
                </div>
            </div>
        </div>
    );
}
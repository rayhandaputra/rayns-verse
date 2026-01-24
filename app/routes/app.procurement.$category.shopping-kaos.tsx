
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSubmit, useFetcher } from 'react-router';
import type { ActionFunction } from 'react-router';
import { ShoppingCart, Check, FileText, Palette, Loader2, X, Upload, Scissors, Ruler, AlertTriangle } from 'lucide-react';
import { nexus } from '~/lib/nexus-client';
import { useFetcherData } from '~/hooks';
import { formatCurrency, parseCurrency, formatNumberInput } from '~/constants';
import { toast } from 'sonner';
import { API } from '~/lib/api';
import { requireAuth } from "~/lib/session.server";
import { safeParseArray } from '~/lib/utils';

// --- TYPES ---
export interface Shop {
    id: string;
    name: string;
    location: string;
    type: 'Online' | 'Offline';
    category: 'Kaos' | 'Sablon';
    price_s_xl?: number;
    price_2xl?: number;
    price_3xl?: number;
    price_4xl?: number;
    price_5xl?: number;
    price_long_sleeve?: number;
    price_per_meter?: number;
}

export interface Order {
    id: number;
    trx_code: string;
    order_number: string;
    institution_name: string;
    instansi: string; // UI Mapping
    total_amount: number;
    jumlah: number; // UI Mapping
    details: any[];
    created_on: string;
}

export interface Transaction {
    id: number;
    trx_code: string;
    order_trx_code?: string;
    supplier_name: string;
    total_amount: number;
    grand_total: number;
    description: string;
    created_on: string;
    proof?: string;
    category: string;
    // INJECTED FROM API INCLUDE
    order?: Order; 
}

// --- ACTION ---
export const action: ActionFunction = async ({ request }) => {
    const { user, token }: any = await requireAuth(request);
    const formData = await request.formData();
    const intent = formData.get('intent');

    if (intent === 'create_expense') {
        try {
            const payload = {
                supplier_id: Number(formData.get('supplier_id')),
                supplier_name: formData.get('supplier_name'),
                total_amount: Number(formData.get('amount')),
                shipping_cost: Number(formData.get('shipping_cost') || 0),
                admin_cost: Number(formData.get('admin_cost') || 0),
                discount: Number(formData.get('discount') || 0),
                grand_total: Number(formData.get('amount')),
                order_trx_code: formData.get('order_trx_code'), // Key Relasi
                direction: 'OUT',
                category: 'cotton_combed_premium',
                description: formData.get('description'),
                is_auto: true,
            };
            console.log(payload)

            // await API.STOCK_LOG.create({
            //     session: { user, token },
            //     req: { body: payload },
            // });
            return Response.json({ success: true, message: "Pengadaan berhasil dicatat" });
        } catch (error: any) {
            return Response.json({ success: false, message: error.message || "Gagal mencatat pengadaan" });
        }
    }
    return Response.json({ success: false });
};

// --- COMPONENT ---
export default function KaosProcurementPage() {
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === "submitting";
    const logProofInputRef = useRef<HTMLInputElement>(null);
    const [pendingLogUpload, setPendingLogUpload] = useState<{ txId: number, type: 'DP' | 'Lunas' } | null>(null);

    // --- DATA FETCHING (Client Side) ---
    // 1. Suppliers
    const { data: shopsData } = useFetcherData({
        endpoint: nexus().module("SUPPLIER").action("get").params({ size: 100, category: "cotton_combed_premium" }).build(),
    });

    // 2. Orders (Hanya untuk Dropdown Pilihan)
    const { data: ordersData } = useFetcherData({
        endpoint: nexus().module("ORDERS").action("get").params({
            size: 100,
            status_ne: 'done,cancelled,rejected',
        }).build(),
    });

    // 3. Stock Logs (Data Utama Tabel Riwayat)
    // NOTE: Pastikan API ini mengembalikan relasi `order`
    const { data: transData, reload: reloadTransactions } = useFetcherData({
        endpoint: nexus().module("STOCK_LOG").action("get").params({
            size: 200, 
            category: 'cotton_combed_premium',
            sort_by: 'created_on',
            order: 'DESC',
            // include: 'order' // Pastikan backend mendukung ini jika perlu
        }).build(),
    });

    // --- DATA PREPARATION ---
    const shops: Shop[] = shopsData?.data?.items || [];
    const ordersRaw: any[] = ordersData?.data?.items || [];
    
    // Transactions List (Flat Data)
    const transactions: Transaction[] = transData?.data?.items || [];
    
    const shirtColors: any[] = []; // Placeholder

    // --- LOCAL STATE ---
    const [selectedShopId, setSelectedShopId] = useState<string>('');
    const [selectedOrderTrx, setSelectedOrderTrx] = useState<string>(''); 
    
    // Form States
    const [mDiscountStr, setMDiscountStr] = useState('');
    const [mAdminStr, setMAdminStr] = useState('');
    const [mShippingStr, setMShippingStr] = useState('');

    // Sablon Form
    const [activeSablonForm, setActiveSablonForm] = useState<string | null>(null);
    const [sablonShopId, setSablonShopId] = useState('');
    const [sablonQtyMeters, setSablonQtyMeters] = useState('');
    const [sDiscStr, setSDiscStr] = useState('');
    const [sAdminStr, setSAdminStr] = useState('');
    const [sShipStr, setSShipStr] = useState('');

    // --- EFFECTS ---
    useEffect(() => {
        if (fetcher.data && (fetcher.data as any).success) {
            toast.success("Pengadaan Berhasil Dicatat");
            setSelectedOrderTrx(''); setMDiscountStr(''); setMAdminStr(''); setMShippingStr('');
            setActiveSablonForm(null); setSablonShopId(''); setSablonQtyMeters(''); 
            setSDiscStr(''); setSAdminStr(''); setSShipStr('');
            reloadTransactions();
        } else if (fetcher.data && !(fetcher.data as any).success) {
            toast.error((fetcher.data as any).message || "Gagal memproses data");
        }
    }, [fetcher.data]);

    // --- MEMOS ---
    const cottonOrderOptions = useMemo(() => {
        return ordersRaw.map((o: any) => ({
            ...o,
            instansi: o.institution_name || "Tanpa Nama",
            jumlah: o.items_count || (o.items || []).reduce((sum: number, item: any) => sum + (item.qty || 0), 0),
            details: typeof o.details === 'string' ? JSON.parse(o.details) : (o.items || [])
        }));
    }, [ordersRaw]);

    const selectedOrderData = useMemo(() => 
        cottonOrderOptions.find((o: any) => o.trx_code === selectedOrderTrx), 
    [cottonOrderOptions, selectedOrderTrx]);

    const selectedVendorData = useMemo(() => 
        shops.find((s: any) => String(s.id) === selectedShopId), 
    [shops, selectedShopId]);

    const cottonProcurementCalc = useMemo(() => {
        if (!selectedOrderData || !selectedVendorData) return { total: 0, itemsByColor: {} };

        const getUnitPrice = (size: string, sleeve: string) => {
            let base = 0;
            const s = size?.toUpperCase();
            if (['XS', 'S', 'M', 'L', 'XL'].includes(s)) base = selectedVendorData.price_s_xl || 0;
            else if (s === '2XL' || s === 'XXL') base = selectedVendorData.price_2xl || 0;
            else if (s === '3XL' || s === 'XXXL') base = selectedVendorData.price_3xl || 0;
            else if (s === '4XL') base = selectedVendorData.price_4xl || 0;
            else if (s === '5XL') base = selectedVendorData.price_5xl || 0;
            if (sleeve?.toLowerCase() === 'panjang') base += (selectedVendorData.price_long_sleeve || 0);
            return base;
        };

        const grouped: Record<string, any[]> = {};
        if (selectedOrderData.details) {
            selectedOrderData.details.forEach((item: any) => {
                const uPrice = getUnitPrice(item.size || 'L', item.sleeve || 'Pendek');
                const colorKey = item.color || 'Belum Diatur';
                const qty = item.quantity || item.qty || 0;
                if (!grouped[colorKey]) grouped[colorKey] = [];
                grouped[colorKey].push({ 
                    size: item.size, sleeve: item.sleeve, quantity: qty, price: uPrice, total: uPrice * qty 
                });
            });
        }

        let grandTotal = 0;
        Object.values(grouped).forEach(items => items.forEach(it => grandTotal += it.total));
        return { total: grandTotal, itemsByColor: grouped };
    }, [selectedOrderData, selectedVendorData]);

    const handleLogProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && pendingLogUpload) {
            toast.info("Fitur upload bukti sedang dalam pengembangan.");
        }
    };

    // --- HANDLERS ---
    const handleProcessBelanja = () => {
        if (!selectedShopId || !selectedOrderTrx) return toast.error("Pilih Vendor dan Pesanan.");

        const finalTotal = cottonProcurementCalc.total
            + parseCurrency(mAdminStr) + parseCurrency(mShippingStr) - parseCurrency(mDiscountStr);

        const description = `[COTTON] Belanja Kaos di ${selectedVendorData?.name} untuk Pesanan ${selectedOrderData?.instansi} (${selectedOrderData?.order_number})`;

        const formData = new FormData();
        formData.append('intent', 'create_expense');
        formData.append('order_trx_code', selectedOrderTrx);
        formData.append('supplier_id', selectedShopId);
        formData.append('supplier_name', selectedVendorData?.name || '');
        formData.append('amount', finalTotal.toString());
        formData.append('shipping_cost', parseCurrency(mShippingStr).toString());
        formData.append('admin_cost', parseCurrency(mAdminStr).toString());
        formData.append('discount', parseCurrency(mDiscountStr).toString());
        formData.append('description', description);

        fetcher.submit(formData, { method: 'post' });
    };

    const handleProcessSablon = (trxCode: string, orderInstansi: string, orderNumber: string) => {
        const sVendor = shops.find(s => String(s.id) === sablonShopId);
        if (!sVendor || !sablonQtyMeters) return toast.error("Pilih vendor dan jumlah meter.");

        const baseCost = Number(sVendor.price_per_meter || 0) * Number(sablonQtyMeters);
        const finalTotal = baseCost + parseCurrency(sAdminStr) + parseCurrency(sShipStr) - parseCurrency(sDiscStr);
        
        const description = `[SABLON] Belanja DTF di ${sVendor.name} untuk Pesanan ${orderInstansi} (${orderNumber}) | Meter: ${sablonQtyMeters}`;

        const formData = new FormData();
        formData.append('intent', 'create_expense');
        formData.append('order_trx_code', trxCode);
        formData.append('supplier_id', sablonShopId);
        formData.append('supplier_name', sVendor.name);
        formData.append('amount', finalTotal.toString());
        formData.append('description', description);

        fetcher.submit(formData, { method: 'post' });
    };

    return (
        <div className="space-y-8 animate-fade-in p-6">
            {/* UI: FORM BELANJA KAOS */}
            <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-gray-100 bg-blue-50/20">
                    <h3 className="font-black text-gray-800 text-lg flex items-center gap-3"><ShoppingCart size={24} className="text-blue-600"/> FORM BELANJA VENDOR KAOS</h3>
                </div>
                <div className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Pilih Vendor Kaos:</label>
                            <select className="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 text-sm font-black focus:border-blue-400 outline-none transition shadow-sm" value={selectedShopId} onChange={e => setSelectedShopId(e.target.value)}>
                                <option value="">-- Pilih Vendor Kaos --</option>
                                {shops.filter(s => s.category === 'Kaos' || s.category === 'cotton_combed_premium').map(s => <option key={s.id} value={s.id}>{s.name} ({s.location})</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Pesanan Kaos Baru:</label>
                            <select className="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 text-sm font-black focus:border-blue-400 outline-none transition shadow-sm" value={selectedOrderTrx} onChange={e => setSelectedOrderTrx(e.target.value)}>
                                <option value="">-- Pilih Pesanan --</option>
                                {cottonOrderOptions.map(o => <option key={o.id} value={o.trx_code}>{o.instansi} ({o.jumlah} pcs)</option>)}
                            </select>
                        </div>
                    </div>

                    {selectedShopId && selectedOrderTrx && (
                        <div className="space-y-10 animate-fade-in">
                            <div className="space-y-8">
                                {Object.entries(cottonProcurementCalc.itemsByColor).map(([colorName, items]: [string, any[]]) => {
                                    const colorObj = shirtColors.find(c => c.name === colorName);
                                    const colorTotal = items.reduce((sum, it) => sum + it.total, 0);
                                    return (
                                        <div key={colorName} className="bg-gray-50 rounded-[32px] border border-gray-200 overflow-hidden shadow-sm">
                                            <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    {colorObj ? <div className="w-20 h-14 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white"><img src={colorObj.imageUrl} className="w-full h-full object-cover" /></div> : <div className="w-20 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300"><Palette size={20}/></div>}
                                                    <div><h4 className="text-lg font-black text-gray-800 uppercase leading-none">{colorName}</h4><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">RINCIAN PRODUKSI WARNA</p></div>
                                                </div>
                                                <div className="text-right"><div className="text-[10px] font-black text-gray-400 uppercase">Subtotal Kaos</div><div className="text-xl font-black text-blue-600">{formatCurrency(colorTotal)}</div></div>
                                            </div>
                                            <table className="w-full text-left text-xs font-bold">
                                                <thead><tr className="border-b border-gray-200 text-gray-400"><th className="px-8 py-4 uppercase font-black">Ukuran & Lengan</th><th className="px-8 py-4 text-center font-black">Jumlah</th><th className="px-8 py-4 text-right font-black">Harga Vendor</th><th className="px-8 py-4 text-right font-black">Subtotal</th></tr></thead>
                                                <tbody className="divide-y divide-gray-100 bg-white/50">{items.map((it, i) => (<tr key={i} className="hover:bg-white transition"><td className="px-8 py-4"><span className="font-black text-gray-900 text-sm">{it.size}</span><span className={`ml-3 px-2 py-0.5 rounded-full text-[9px] font-black border ${it.sleeve === 'Panjang' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{it.sleeve.toUpperCase()}</span></td><td className="px-8 py-4 text-center font-black text-gray-900">{it.qty} PCS</td><td className="px-8 py-4 text-right text-gray-400">{formatCurrency(it.price)}</td><td className="px-8 py-4 text-right font-black text-gray-700">{formatCurrency(it.total)}</td></tr>))}</tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="bg-gray-900 rounded-[40px] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden group">
                                <div className="relative z-10 space-y-6">
                                    <div className="flex flex-wrap gap-10">
                                        <div><div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Total Jumlah Kaos</div><div className="text-4xl font-black">{selectedOrderData?.jumlah} <span className="text-sm font-bold text-gray-500">PCS</span></div></div>
                                        <div><div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Total Harga Kaos</div><div className="text-4xl font-black text-blue-400">{formatCurrency(cottonProcurementCalc.total)}</div></div>
                                    </div>
                                </div>
                                <div className="relative z-10 flex flex-col gap-4 w-full md:w-auto">
                                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 space-y-3">
                                        <div className="grid grid-cols-2 gap-3"><input className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400" placeholder="Potongan" value={mDiscountStr} onChange={e => setMDiscountStr(formatNumberInput(e.target.value))} /><input className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400" placeholder="Admin" value={mAdminStr} onChange={e => setMAdminStr(formatNumberInput(e.target.value))} /></div>
                                        <input className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400" placeholder="Ongkir" value={mShippingStr} onChange={e => setMShippingStr(formatNumberInput(e.target.value))} />
                                    </div>
                                    <button onClick={handleProcessBelanja} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 py-5 rounded-[28px] font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-900/20">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Check size={24}/>} CATAT PENGADAAN KAOS
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* UI: LOG PENGADAAN & LABA (FLAT LIST DARI STOCK LOGS) */}
            <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                <div className="p-10 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-black text-gray-800 text-lg flex items-center gap-3 uppercase tracking-tight"><FileText size={22} className="text-purple-600"/> Log Pengadaan & Keuntungan Bersih</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                            <tr>
                                <th className="px-10 py-6">Pesanan</th>
                                <th className="px-10 py-6 text-center">Status Kaos</th>
                                <th className="px-10 py-6 text-center">Status Sablon</th>
                                <th className="px-10 py-6 text-right">Biaya / Laba</th>
                                <th className="px-10 py-6 text-center">Aksi Bayar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* LANGSUNG LOOPING TRANSACTIONS, TANPA GROUPING DI CLIENT */}
                            {transactions.map((t) => {
                                // TANGKAP DATA ORDER DARI INCLUDE API
                                // Menggunakan optional chaining sesuai request: `t?.order?.order_number`
                                // const orderData = t.order || {}; 
                                const orderData = safeParseArray(t.orders)?.[0] || {}; 
                                const instansi = orderData.institution_name || t.description.split('untuk Pesanan')[1]?.split('(')[0] || 'Unknown';
                                const orderTrx = t.order_trx_code || orderData.trx_code;
                                const isKaos = t.description.includes('[COTTON]');
                                const isSablon = t.description.includes('[SABLON]');
                                const expense = Number(t.grand_total || t.total_amount || 0);

                                return (
                                <React.Fragment key={t.id}>
                                    <tr className="hover:bg-gray-50/50 transition group">
                                        <td className="px-10 py-8">
                                            <div className="font-black text-gray-800 text-base leading-tight">{instansi}</div>
                                            <div className="text-[10px] font-black text-blue-600 uppercase mt-1">Order ID: {orderData.order_number || '-'}</div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            {isKaos ? (
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-black text-green-600 flex items-center justify-center gap-2"><Check size={12}/> TERPROSES</div>
                                                    <div className="text-[10px] font-bold text-gray-400">{formatCurrency(expense)}</div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] font-black text-gray-300">-</div>
                                            )}
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            {isSablon ? (
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-black text-green-600 flex items-center justify-center gap-2"><Check size={12}/> TERPROSES</div>
                                                    <div className="text-[10px] font-bold text-gray-400">{formatCurrency(expense)}</div>
                                                </div>
                                            ) : (
                                                // Jika bukan transaksi sablon (berarti kaos), tampilkan tombol beli sablon
                                                <button onClick={() => setActiveSablonForm(activeSablonForm === orderTrx ? null : orderTrx)} className="mx-auto flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl text-[10px] font-black hover:bg-orange-200 transition">
                                                    <Scissors size={12}/> BELI SABLON
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            {/* Di Flat Table, Laba Bersih susah dihitung per baris, jadi kita tampilkan Expense per transaksi */}
                                            <div className="text-lg font-black text-red-500">-{formatCurrency(expense)}</div>
                                            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">PENGELUARAN</div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col gap-2 items-center">
                                                {t.proof ? (
                                                    <a href={t.proof} target="_blank" rel="noreferrer" className="px-4 py-2 border-2 border-green-200 bg-green-50 text-green-700 rounded-xl text-[10px] font-black transition w-28 text-center">LIHAT BUKTI</a>
                                                ) : (
                                                    <button onClick={() => { setPendingLogUpload({txId: t.id, type: 'DP'}); logProofInputRef.current?.click(); }} className={`px-4 py-2 border-2 rounded-xl text-[10px] font-black transition w-28 bg-white border-blue-100 text-blue-600`}>UPLOAD BUKTI</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {/* FORM SABLON (Hanya muncul jika tombol diklik di baris Kaos) */}
                                    {activeSablonForm === orderTrx && !isSablon && (
                                        <tr className="bg-orange-50/30 animate-fade-in border-y-2 border-orange-100">
                                            <td colSpan={5} className="p-10">
                                                <div className="flex justify-between items-center mb-6">
                                                    <h4 className="font-black text-orange-700 text-sm uppercase flex items-center gap-2"><Ruler size={16}/> PENGADAAN SABLON DTF : {instansi}</h4>
                                                    <button onClick={() => setActiveSablonForm(null)} className="p-2 text-orange-300 hover:text-orange-600"><X size={20}/></button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Pilih Vendor Sablon:</label>
                                                        <select className="w-full bg-white border-2 border-orange-100 rounded-2xl p-4 text-sm font-black outline-none focus:border-orange-400" value={sablonShopId} onChange={e => setSablonShopId(e.target.value)}>
                                                            <option value="">-- Pilih Vendor Sablon --</option>
                                                            {shops.filter(s => s.category === 'Sablon').map(s => <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price_per_meter || 0)}/m)</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Kebutuhan Sablon (Meter):</label>
                                                        <input type="number" className="w-full bg-white border-2 border-orange-100 rounded-2xl p-4 text-sm font-black outline-none" placeholder="0.0" value={sablonQtyMeters} onChange={e => setSablonQtyMeters(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Biaya Tambahan & Diskon:</label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <input placeholder="Disk" className="bg-white border-2 border-orange-100 rounded-xl p-3 text-xs font-black" value={sDiscStr} onChange={e => setSDiscStr(formatNumberInput(e.target.value))} />
                                                            <input placeholder="Adm" className="bg-white border-2 border-orange-100 rounded-xl p-3 text-xs font-black" value={sAdminStr} onChange={e => setSAdminStr(formatNumberInput(e.target.value))} />
                                                            <input placeholder="Ongk" className="bg-white border-2 border-orange-100 rounded-xl p-3 text-xs font-black" value={sShipStr} onChange={e => setSShipStr(formatNumberInput(e.target.value))} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-8 flex justify-between items-center bg-white p-6 rounded-3xl border border-orange-100">
                                                    <div className="text-orange-800">
                                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Estimasi Biaya Sablon</div>
                                                        <div className="text-3xl font-black">
                                                            {formatCurrency((Number(shops.find(s => String(s.id) === sablonShopId)?.price_per_meter || 0) * Number(sablonQtyMeters)) + parseCurrency(sAdminStr) + parseCurrency(sShipStr) - parseCurrency(sDiscStr))}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleProcessSablon(orderTrx || '', instansi, orderData.order_number)} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 transition shadow-xl shadow-orange-900/10">
                                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Check size={20}/>} CATAT BELANJA SABLON
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                                )})}
                        </tbody>
                    </table>
                </div>
            </div>
            <input type="file" ref={logProofInputRef} className="hidden" accept="image/*" onChange={handleLogProofUpload} />
        </div>
    );
}
// /* === DATABASE REQUIREMENTS ===
//   Table: transactions
//   - id: VARCHAR (PK)
//   - created_at: DATETIME
//   - type: ENUM('Expense')
//   - category: VARCHAR ('Bahan Baku')
//   - amount: DECIMAL
//   - description: TEXT (Stores JSON or structured string for order ref)
//   - is_auto: BOOLEAN
//   - proof_image: TEXT (Base64 or URL)

//   Table: orders (References)
//   - Must allow querying by 'status_pengerjaan' != 'selesai'
//   - JSON field for shirt_sizes: [{size, sleeve, color, quantity}]
// */

// import React, { useState, useMemo, useRef } from 'react';
// // import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
// import { useLoaderData, useSubmit } from 'react-router';
// import { ShoppingCart, Check, FileText, Palette, Scissors, Ruler, X } from 'lucide-react';
// // import { type Shop, type Order, type Transaction, type ShirtColor, formatCurrency, parseCurrency, formatNumberInput } from '~/types/kaos';
// import type { LoaderFunction } from 'react-router';
// import type { ActionFunction } from 'react-router';

// // ~/types/kaos.ts

// export interface ShirtColor {
//     id: string;
//     name: string;
//     imageUrl: string;
//     createdAt: string;
// }

// export interface Shop {
//     id: string;
//     name: string;
//     location: string;
//     type: 'Online' | 'Offline';
//     wa?: string;
//     link?: string;
//     category: 'Kaos' | 'Sablon';
//     // Harga Kaos
//     priceSXL?: number;
//     price2XL?: number;
//     price3XL?: number;
//     price4XL?: number;
//     price5XL?: number;
//     priceLongSleeve?: number;
//     // Harga Sablon
//     pricePerMeter?: number;
// }

// export interface ShirtSizeItem {
//     size: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL' | '5XL';
//     sleeve: 'Pendek' | 'Panjang';
//     color?: string;
//     quantity: number;
// }

// export interface Order {
//     id: string;
//     instansi: string;
//     jenisPesanan: string; // Harus mengandung 'cotton' untuk deteksi
//     statusPengerjaan: string;
//     jumlah: number;
//     totalAmount: number; // Nilai jual ke customer
//     createdAt: string;
//     shirtSizes?: ShirtSizeItem[];
//     items?: { productName: string }[];
// }

// export interface Transaction {
//     id: string;
//     date: string;
//     type: 'Expense' | 'Income';
//     category: 'Bahan Baku' | 'Operasional';
//     amount: number;
//     description: string;
//     isAuto: boolean;
//     proofImage?: string;
// }

// // Utils Sederhana
// const formatCurrency = (val: number) =>
//     new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

// const parseCurrency = (val: string) => Number(val.replace(/[^0-9]/g, "")) || 0;

// const formatNumberInput = (val: number | string) => {
//     const num = typeof val === 'string' ? parseCurrency(val) : val;
//     if (!num) return '';
//     return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
// };

// // --- LOADER ---
// export const loader: LoaderFunction = async ({ request }) => {
//     // Fetch data in parallel
//     // const [shops, orders, transactions, colors] = await Promise.all([...])
//     const shops: Shop[] = [];
//     const orders: Order[] = [];
//     const transactions: Transaction[] = [];
//     const colors: ShirtColor[] = [];

//     return Response.json({ shops, orders, transactions, colors });
// };

// // --- ACTION ---
// export const action: ActionFunction = async ({ request }) => {
//     const formData = await request.formData();
//     // Handle 'create_expense' logic for both Cotton and Sablon
//     return Response.json({ success: true });
// };

// export default function KaosProcurementPage() {
//     const { shops, orders, transactions, colors: shirtColors } = useLoaderData<typeof loader>();
//     const submit = useSubmit();

//     // Local State for Calculations
//     const [selectedShopId, setSelectedShopId] = useState<string>('');
//     const [selectedOrderId, setSelectedOrderId] = useState<string>('');
//     const [mDiscountStr, setMDiscountStr] = useState('');
//     const [mAdminStr, setMAdminStr] = useState('');
//     const [mShippingStr, setMShippingStr] = useState('');

//     // Sablon State
//     const [activeSablonForm, setActiveSablonForm] = useState<string | null>(null);
//     const [sablonShopId, setSablonShopId] = useState('');
//     const [sablonQtyMeters, setSablonQtyMeters] = useState('');
//     // ... other sablon costs state ...

//     // --- MEMOS (LOGIC) ---
//     const cottonOrderOptions = useMemo(() => {
//         // Filter orders logic... (same as original)
//         return orders; // Placeholder for logic
//     }, [orders, transactions]);

//     const selectedOrderData = useMemo(() => orders.find((o: any) => o.id === selectedOrderId), [orders, selectedOrderId]);
//     const selectedVendorData = useMemo(() => shops.find((s: any) => s.id === selectedShopId), [shops, selectedShopId]);

//     // Kalkulator Harga Otomatis (Client Side for responsiveness)
//     const cottonProcurementCalc = useMemo(() => {
//         if (!selectedOrderData || !selectedVendorData) return { total: 0, itemsByColor: {} };

//         const getUnitPrice = (size: string, sleeve: string) => {
//             let base = 0;
//             if (['XS', 'S', 'M', 'L', 'XL'].includes(size)) base = selectedVendorData.priceSXL || 0;
//             else if (size === '2XL') base = selectedVendorData.price2XL || 0;
//             else if (size === '3XL') base = selectedVendorData.price3XL || 0;
//             else if (size === '4XL') base = selectedVendorData.price4XL || 0;
//             else if (size === '5XL') base = selectedVendorData.price5XL || 0;

//             if (sleeve === 'Panjang') base += (selectedVendorData.priceLongSleeve || 0);
//             return base;
//         };

//         const grouped: Record<string, any[]> = {};
//         // Grouping logic based on shirtSizes...
//         if (selectedOrderData.shirtSizes) {
//             selectedOrderData.shirtSizes.forEach((s: any) => {
//                 const uPrice = getUnitPrice(s.size, s.sleeve);
//                 const colorKey = s.color || 'Belum Diatur';
//                 if (!grouped[colorKey]) grouped[colorKey] = [];
//                 grouped[colorKey].push({ ...s, price: uPrice, total: uPrice * s.quantity });
//             });
//         }

//         let grandTotal = 0;
//         Object.values(grouped).forEach(items => items.forEach(it => grandTotal += it.total));
//         return { total: grandTotal, itemsByColor: grouped };
//     }, [selectedOrderData, selectedVendorData]);

//     // --- HANDLERS ---
//     const handleProcessBelanja = () => {
//         if (!selectedShopId || !selectedOrderId) return alert("Pilih Vendor dan Pesanan.");

//         const finalTotal = cottonProcurementCalc.total
//             + parseCurrency(mAdminStr)
//             + parseCurrency(mShippingStr)
//             - parseCurrency(mDiscountStr);

//         const description = `[COTTON] Belanja Kaos di ${selectedVendorData?.name} untuk ${selectedOrderData?.instansi}...`;

//         const formData = new FormData();
//         formData.append('intent', 'create_expense');
//         formData.append('category', 'Bahan Baku');
//         formData.append('amount', finalTotal.toString());
//         formData.append('description', description);

//         submit(formData, { method: 'post' });
//     };

//     return (
//         <div className="space-y-8 animate-fade-in p-6">
//             {/* FORM BELANJA KAOS */}
//             <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
//                 <div className="p-10 border-b border-gray-100 bg-blue-50/20">
//                     <h3 className="font-black text-gray-800 text-lg flex items-center gap-3"><ShoppingCart size={24} className="text-blue-600" /> FORM BELANJA VENDOR KAOS</h3>
//                 </div>
//                 <div className="p-10 space-y-8">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {/* Select Vendor */}
//                         <div className="space-y-2">
//                             <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Pilih Vendor Kaos:</label>
//                             <select className="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 text-sm font-black focus:border-blue-400 outline-none transition shadow-sm" value={selectedShopId} onChange={e => setSelectedShopId(e.target.value)}>
//                                 <option value="">-- Pilih Vendor Kaos --</option>
//                                 {shops.filter((s: any) => s.category === 'Kaos').map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.location})</option>)}
//                             </select>
//                         </div>
//                         {/* Select Order */}
//                         <div className="space-y-2">
//                             <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Pesanan Kaos Baru:</label>
//                             <select className="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 text-sm font-black focus:border-blue-400 outline-none transition shadow-sm" value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
//                                 <option value="">-- Pilih Pesanan --</option>
//                                 {cottonOrderOptions.map((o: any) => <option key={o.id} value={o.id}>{o.instansi} ({o.jumlah} pcs)</option>)}
//                             </select>
//                         </div>
//                     </div>

//                     {/* Calculation Result & Submit */}
//                     {selectedShopId && selectedOrderId && (
//                         <div className="space-y-10 animate-fade-in">
//                             {/* Rincian Per Warna */}
//                             <div className="space-y-8">
//                                 {Object.entries(cottonProcurementCalc.itemsByColor).map(([colorName, items]: [string, any[]]) => (
//                                     <div key={colorName} className="bg-gray-50 rounded-[32px] border border-gray-200 overflow-hidden shadow-sm">
//                                         <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
//                                             <div className="flex items-center gap-4">
//                                                 <div className="w-20 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300"><Palette size={20} /></div>
//                                                 <div><h4 className="text-lg font-black text-gray-800 uppercase leading-none">{colorName}</h4></div>
//                                             </div>
//                                             {/* Total per color */}
//                                             <div className="text-right"><div className="text-xl font-black text-blue-600">{formatCurrency(items.reduce((a, b) => a + b.total, 0))}</div></div>
//                                         </div>
//                                         {/* Table Items */}
//                                         <table className="w-full text-left text-xs font-bold">
//                                             <tbody className="divide-y divide-gray-100 bg-white/50">
//                                                 {items.map((it, i) => (
//                                                     <tr key={i}>
//                                                         <td className="px-8 py-4">{it.size} {it.sleeve}</td>
//                                                         <td className="px-8 py-4 text-center">{it.quantity} PCS</td>
//                                                         <td className="px-8 py-4 text-right">{formatCurrency(it.total)}</td>
//                                                     </tr>
//                                                 ))}
//                                             </tbody>
//                                         </table>
//                                     </div>
//                                 ))}
//                             </div>

//                             {/* Grand Total Bar */}
//                             <div className="bg-gray-900 rounded-[40px] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden">
//                                 <div className="relative z-10 space-y-6">
//                                     <div className="text-4xl font-black text-blue-400">{formatCurrency(cottonProcurementCalc.total)}</div>
//                                 </div>
//                                 <div className="relative z-10 flex flex-col gap-4 w-full md:w-auto">
//                                     <div className="bg-white/5 p-4 rounded-3xl border border-white/10 space-y-3">
//                                         <div className="grid grid-cols-2 gap-3">
//                                             <input className="input-dark" placeholder="Potongan" value={mDiscountStr} onChange={e => setMDiscountStr(formatNumberInput(e.target.value))} />
//                                             <input className="input-dark" placeholder="Admin" value={mAdminStr} onChange={e => setMAdminStr(formatNumberInput(e.target.value))} />
//                                         </div>
//                                     </div>
//                                     <button onClick={handleProcessBelanja} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[28px] font-black flex items-center justify-center gap-3 transition-all shadow-xl"><Check size={24} /> CATAT PENGADAAN</button>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* LOG HISTORY TABLE */}
//             <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
//                 <div className="p-10 border-b border-gray-100 flex items-center justify-between">
//                     <h3 className="font-black text-gray-800 text-lg flex items-center gap-3 uppercase tracking-tight"><FileText size={22} className="text-purple-600" /> Log Pengadaan & Laba</h3>
//                 </div>
//                 {/* ... Render Table similar to original code, iterating over orders/transactions ... */}
//                 <div className="p-10 text-center text-gray-400 font-bold text-sm">
//                     (Table Log Implementation Here - Using mapped transactions)
//                 </div>
//             </div>
//         </div>
//     );
// }

/* === DATABASE REQUIREMENTS ===
  Table: transactions (stock_logs)
  - id: INT (PK, AI) -> map to stock_logs
  - created_on: TIMESTAMP
  - direction: ENUM('IN', 'OUT') -> 'OUT' for Expense/Purchase
  - category: 'material'
  - total_amount: DECIMAL
  - description: TEXT
  - is_auto: TINYINT
  - proof: TEXT

  Table: orders
  - id: INT (PK)
  - order_number: VARCHAR
  - institution_name: VARCHAR
  - total_amount: DECIMAL
  - order_date: DATETIME
  - ... other fields from your schema
*/
/* === DATABASE REQUIREMENTS ===
  Table: transactions (stock_logs)
  - id: INT (PK, AI) -> map to stock_logs
  - created_on: TIMESTAMP
  - direction: ENUM('IN', 'OUT') -> 'OUT' for Expense/Purchase
  - category: 'material'
  - total_amount: DECIMAL
  - description: TEXT
  - is_auto: TINYINT
  - proof: TEXT

  Table: orders
  - id: INT (PK)
  - order_number: VARCHAR
  - institution_name: VARCHAR
  - total_amount: DECIMAL
  - order_date: DATETIME
  - details: JSON/TEXT (Mapped from DB)
*/
/* === DATABASE REQUIREMENTS ===
  Table: stock_logs
  - id: INT (PK, AI) -> map to stock_logs
  - created_on: TIMESTAMP
  - direction: ENUM('IN', 'OUT') -> 'OUT' for Expense/Purchase
  - category: 'material'
  - total_amount: DECIMAL
  - description: TEXT (Stores JSON or structured string for order ref)
  - is_auto: TINYINT
  - proof: TEXT

  Table: orders
  - id: INT (PK)
  - order_number: VARCHAR
  - institution_name: VARCHAR
  - total_amount: DECIMAL
  - order_date: DATETIME
  - order_type: VARCHAR
  - status: VARCHAR
*/

// import React, { useState, useMemo, useRef, useEffect } from 'react';
// import { useSubmit, useFetcher } from 'react-router';
// import type { ActionFunction } from 'react-router';
// import { ShoppingCart, Check, FileText, Palette, Loader2 } from 'lucide-react';
// import { nexus } from '~/lib/nexus-client';
// import { useFetcherData } from '~/hooks'; // Custom hook useFetcherData
// import { formatCurrency, parseCurrency, formatNumberInput } from '~/constants';
// import { toast } from 'sonner';
// import { API } from '~/lib/api';
// import { requireAuth } from "~/lib/session.server";

// // --- TYPES ---
// export interface Shop {
//     id: string;
//     name: string;
//     location: string;
//     type: 'Online' | 'Offline';
//     wa?: string;
//     link?: string;
//     category: 'Kaos' | 'Sablon';
//     price_s_xl?: number;
//     price_2xl?: number;
//     price_3xl?: number;
//     price_4xl?: number;
//     price_5xl?: number;
//     price_long_sleeve?: number;
//     price_per_meter?: number;
// }

// export interface OrderItemDetail {
//     product_name: string;
//     size: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL' | '5XL';
//     sleeve: 'Pendek' | 'Panjang';
//     color?: string;
//     quantity: number;
// }

// export interface Order {
//     id: number;
//     order_number: string;
//     institution_name: string;
//     order_type: string;
//     status: string;
//     total_amount: number;
//     created_on: string;
//     items_count: number;
//     details: OrderItemDetail[];
// }

// export interface Transaction {
//     id: number;
//     created_on: string;
//     direction: 'IN' | 'OUT';
//     total_amount: number;
//     description: string;
//     is_auto: boolean;
//     proof?: string;
//     grand_total?: number;
// }

// // --- ACTION (Server Side Mutation) ---
// export const action: ActionFunction = async ({ request }) => {
//     const { user, token }: any = await requireAuth(request);
//     const formData = await request.formData();
//     const intent = formData.get('intent');

//     if (intent === 'create_expense') {
//         try {
//             const payload = {
//                 supplier_id: Number(formData.get('supplier_id')),
//                 supplier_name: formData.get('supplier_name'),
//                 total_amount: Number(formData.get('amount')),
//                 shipping_cost: Number(formData.get('shipping_cost') || 0),
//                 admin_cost: Number(formData.get('admin_cost') || 0),
//                 discount: Number(formData.get('discount') || 0),
//                 grand_total: Number(formData.get('amount')),
//                 direction: 'OUT', // Expense
//                 // category: 'material',
//                 category: 'cotton_combed_premium',
//                 description: formData.get('description'),
//                 is_auto: true,
//             };

//             await API.STOCK_LOG.create({
//                 session: { user, token },
//                 req: { body: payload },
//             });
//             return Response.json({ success: true, message: "Pengadaan berhasil dicatat" });
//         } catch (error: any) {
//             return Response.json({ success: false, message: error.message || "Gagal mencatat pengadaan" });
//         }
//     }

//     return Response.json({ success: false });
// };

// // --- COMPONENT ---
// export default function KaosProcurementPage() {
//     const fetcher = useFetcher();
//     const isSubmitting = fetcher.state === "submitting";

//     // --- DATA FETCHING (Client Side via useFetcherData) ---
//     const { data: shopsData } = useFetcherData({
//         endpoint: nexus().module("SUPPLIER").action("get").params({ size: 100, category: "cotton_combed_premium" }).build(),
//     });

//     const { data: ordersData } = useFetcherData({
//         endpoint: nexus().module("ORDERS").action("get").params({
//             size: 100,
//             status_ne: 'done,cancelled,rejected',
//             // order_type: 'custom' 
//         }).build(),
//     });

//     const { data: transData, reload: reloadTransactions } = useFetcherData({
//         endpoint: nexus().module("STOCK_LOG").action("get").params({
//             size: 50,
//             // category: 'material',
//             category: 'cotton_combed_premium',
//             sort_by: 'created_on',
//             order: 'DESC'
//         }).build(),
//     });

//     // --- EXTRACT DATA ---
//     const shops: Shop[] = shopsData?.data?.items || [];
//     const orders: any[] = ordersData?.data?.items || [];
//     const transactions: Transaction[] = transData?.data?.items || [];

//     // --- LOCAL STATE ---
//     const [selectedShopId, setSelectedShopId] = useState<string>('');
//     const [selectedOrderId, setSelectedOrderId] = useState<string>('');
//     const [mDiscountStr, setMDiscountStr] = useState('');
//     const [mAdminStr, setMAdminStr] = useState('');
//     const [mShippingStr, setMShippingStr] = useState('');

//     // --- EFFECT: Handle Action Response ---
//     useEffect(() => {
//         if (fetcher.data && (fetcher.data as any).success) {
//             toast.success((fetcher.data as any).message || "Berhasil");
//             setSelectedOrderId('');
//             setMDiscountStr('');
//             setMAdminStr('');
//             setMShippingStr('');
//             reloadTransactions();
//         } else if (fetcher.data && !(fetcher.data as any).success) {
//             toast.error((fetcher.data as any).message || "Gagal memproses data");
//         }
//     }, [fetcher.data]);

//     // --- MEMOS (LOGIC) ---

//     // Filter & Map Orders (Integrasi field DB baru)
//     const cottonOrderOptions = useMemo(() => {
//         return orders.map((o: any) => ({
//             ...o,
//             // Mapping field DB 'institution_name' ke UI logic 'instansi' jika perlu
//             instansi: o.institution_name,
//             jumlah: o.items_count || (o.items || []).reduce((sum: number, item: any) => sum + (item.qty || 0), 0),
//             // Parse details
//             details: typeof o.details === 'string' ? JSON.parse(o.details) : (o.items || [])
//         }));
//     }, [orders]);

//     const selectedOrderData = useMemo(() => cottonOrderOptions.find((o: any) => String(o.id) === selectedOrderId), [cottonOrderOptions, selectedOrderId]);
//     const selectedVendorData = useMemo(() => shops.find((s: any) => String(s.id) === selectedShopId), [shops, selectedShopId]);

//     // Kalkulator Harga Otomatis
//     const cottonProcurementCalc = useMemo(() => {
//         if (!selectedOrderData || !selectedVendorData) return { total: 0, itemsByColor: {} };

//         const getUnitPrice = (size: string, sleeve: string) => {
//             let base = 0;
//             const s = size?.toUpperCase();
//             // Mapping harga dari DB shop field
//             if (['XS', 'S', 'M', 'L', 'XL'].includes(s)) base = selectedVendorData.price_s_xl || 0;
//             else if (s === '2XL' || s === 'XXL') base = selectedVendorData.price_2xl || 0;
//             else if (s === '3XL' || s === 'XXXL') base = selectedVendorData.price_3xl || 0;
//             else if (s === '4XL') base = selectedVendorData.price_4xl || 0;
//             else if (s === '5XL') base = selectedVendorData.price_5xl || 0;

//             if (sleeve?.toLowerCase() === 'panjang') base += (selectedVendorData.price_long_sleeve || 0);
//             return base;
//         };

//         const grouped: Record<string, any[]> = {};

//         if (selectedOrderData.details && selectedOrderData.details.length > 0) {
//             selectedOrderData.details.forEach((item: any) => {
//                 // Check if item is cotton shirt
//                 if (item.product_name?.toLowerCase().includes('cotton') || true) {
//                     const uPrice = getUnitPrice(item.size || 'L', item.sleeve || 'Pendek');
//                     const colorKey = item.color || 'Belum Diatur';
//                     const qty = item.quantity || item.qty || 0;

//                     if (!grouped[colorKey]) grouped[colorKey] = [];
//                     grouped[colorKey].push({
//                         size: item.size,
//                         sleeve: item.sleeve,
//                         quantity: qty,
//                         price: uPrice,
//                         total: uPrice * qty
//                     });
//                 }
//             });
//         }

//         let grandTotal = 0;
//         Object.values(grouped).forEach(items => items.forEach(it => grandTotal += it.total));
//         return { total: grandTotal, itemsByColor: grouped };
//     }, [selectedOrderData, selectedVendorData]);

//     // --- HANDLERS ---
//     const handleProcessBelanja = () => {
//         if (!selectedShopId || !selectedOrderId) return toast.error("Pilih Vendor dan Pesanan.");

//         const finalTotal = cottonProcurementCalc.total
//             + parseCurrency(mAdminStr)
//             + parseCurrency(mShippingStr)
//             - parseCurrency(mDiscountStr);

//         const description = `[COTTON] Belanja Kaos di ${selectedVendorData?.name} untuk Pesanan ${selectedOrderData?.institution_name} (${selectedOrderData?.order_number})...`;

//         const formData = new FormData();
//         formData.append('intent', 'create_expense');
//         formData.append('supplier_id', selectedShopId);
//         formData.append('supplier_name', selectedVendorData?.name || '');
//         formData.append('amount', finalTotal.toString());
//         formData.append('shipping_cost', parseCurrency(mShippingStr).toString());
//         formData.append('admin_cost', parseCurrency(mAdminStr).toString());
//         formData.append('discount', parseCurrency(mDiscountStr).toString());
//         formData.append('description', description);

//         fetcher.submit(formData, { method: 'post' });
//     };

//     return (
//         <div className="space-y-8 animate-fade-in p-6">
//             {/* FORM BELANJA KAOS */}
//             <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
//                 <div className="p-10 border-b border-gray-100 bg-blue-50/20">
//                     <h3 className="font-black text-gray-800 text-lg flex items-center gap-3"><ShoppingCart size={24} className="text-blue-600" /> FORM BELANJA VENDOR KAOS</h3>
//                 </div>
//                 <div className="p-10 space-y-8">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {/* Select Vendor */}
//                         <div className="space-y-2">
//                             <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Pilih Vendor Kaos:</label>
//                             <select className="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 text-sm font-black focus:border-blue-400 outline-none transition shadow-sm" value={selectedShopId} onChange={e => setSelectedShopId(e.target.value)}>
//                                 <option value="">-- Pilih Vendor Kaos --</option>
//                                 {shops.filter((s: any) => s.category === 'cotton_combed_premium').map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.location})</option>)}
//                             </select>
//                         </div>
//                         {/* Select Order */}
//                         <div className="space-y-2">
//                             <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Pesanan Kaos Baru:</label>
//                             <select className="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 text-sm font-black focus:border-blue-400 outline-none transition shadow-sm" value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
//                                 <option value="">-- Pilih Pesanan --</option>
//                                 {/* Mapping data Order sesuai field baru */}
//                                 {cottonOrderOptions.map((o: any) => <option key={o.id} value={o.id}>{o.institution_name} - {o.order_number} ({o.jumlah} pcs)</option>)}
//                             </select>
//                         </div>
//                     </div>

//                     {/* Calculation Result & Submit */}
//                     {selectedShopId && selectedOrderId && (
//                         <div className="space-y-10 animate-fade-in">
//                             {/* Rincian Per Warna */}
//                             <div className="space-y-8">
//                                 {Object.entries(cottonProcurementCalc.itemsByColor).map(([colorName, items]: [string, any[]]) => (
//                                     <div key={colorName} className="bg-gray-50 rounded-[32px] border border-gray-200 overflow-hidden shadow-sm">
//                                         <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
//                                             <div className="flex items-center gap-4">
//                                                 <div className="w-20 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300"><Palette size={20} /></div>
//                                                 <div><h4 className="text-lg font-black text-gray-800 uppercase leading-none">{colorName}</h4></div>
//                                             </div>
//                                             {/* Total per color */}
//                                             <div className="text-right"><div className="text-xl font-black text-blue-600">{formatCurrency(items.reduce((a, b) => a + b.total, 0))}</div></div>
//                                         </div>
//                                         {/* Table Items */}
//                                         <table className="w-full text-left text-xs font-bold">
//                                             <tbody className="divide-y divide-gray-100 bg-white/50">
//                                                 {items.map((it, i) => (
//                                                     <tr key={i}>
//                                                         <td className="px-8 py-4"><span className="font-black text-gray-900 text-sm">{it.size}</span> <span className="ml-2 bg-gray-200 px-2 py-0.5 rounded text-[10px]">{it.sleeve?.toUpperCase()}</span></td>
//                                                         <td className="px-8 py-4 text-center">{it.quantity} PCS</td>
//                                                         <td className="px-8 py-4 text-right">{formatCurrency(it.total)}</td>
//                                                     </tr>
//                                                 ))}
//                                             </tbody>
//                                         </table>
//                                     </div>
//                                 ))}
//                             </div>

//                             {/* Grand Total Bar */}
//                             <div className="bg-gray-900 rounded-[40px] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden">
//                                 <div className="relative z-10 space-y-6">
//                                     <div className="flex flex-wrap gap-10">
//                                         <div><div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Total Jumlah Kaos</div><div className="text-4xl font-black">{selectedOrderData?.jumlah} <span className="text-sm font-bold text-gray-500">PCS</span></div></div>
//                                         <div><div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Total Harga Kaos</div><div className="text-4xl font-black text-blue-400">{formatCurrency(cottonProcurementCalc.total)}</div></div>
//                                     </div>
//                                 </div>
//                                 <div className="relative z-10 flex flex-col gap-4 w-full md:w-auto">
//                                     <div className="bg-white/5 p-4 rounded-3xl border border-white/10 space-y-3">
//                                         <div className="grid grid-cols-2 gap-3">
//                                             <input className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400" placeholder="Potongan" value={mDiscountStr} onChange={e => setMDiscountStr(formatNumberInput(e.target.value))} />
//                                             <input className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400" placeholder="Admin" value={mAdminStr} onChange={e => setMAdminStr(formatNumberInput(e.target.value))} />
//                                         </div>
//                                         <input className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400" placeholder="Ongkir" value={mShippingStr} onChange={e => setMShippingStr(formatNumberInput(e.target.value))} />
//                                     </div>
//                                     <button onClick={handleProcessBelanja} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[28px] font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-900/20 disabled:opacity-50">
//                                         {isSubmitting ? <Loader2 className="animate-spin" /> : <Check size={24} />} CATAT PENGADAAN KAOS
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* LOG HISTORY TABLE */}
//             <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
//                 <div className="p-10 border-b border-gray-100 flex items-center justify-between">
//                     <h3 className="font-black text-gray-800 text-lg flex items-center gap-3 uppercase tracking-tight"><FileText size={22} className="text-purple-600" /> Log Pengadaan & Laba</h3>
//                 </div>

//                 <div className="overflow-x-auto p-0">
//                     <table className="w-full text-left text-sm">
//                         <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
//                             <tr>
//                                 <th className="px-10 py-6">Tanggal</th>
//                                 <th className="px-10 py-6">Deskripsi</th>
//                                 <th className="px-10 py-6 text-right">Nominal</th>
//                                 <th className="px-10 py-6 text-center">Status</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-gray-100">
//                             {transactions.map((t: any) => (
//                                 <tr key={t.id} className="hover:bg-gray-50/50 transition">
//                                     <td className="px-10 py-6 font-bold text-gray-500">
//                                         {new Date(t.created_on).toLocaleDateString('id-ID')}
//                                     </td>
//                                     <td className="px-10 py-6 font-medium text-gray-800 max-w-md">
//                                         {t.description}
//                                     </td>
//                                     <td className="px-10 py-6 text-right font-black text-gray-800">
//                                         {formatCurrency(Number(t.grand_total || t.total_amount))}
//                                     </td>
//                                     <td className="px-10 py-6 text-center">
//                                         <span className="bg-green-100 text-green-700 text-xs font-black px-3 py-1 rounded-full">OK</span>
//                                     </td>
//                                 </tr>
//                             ))}
//                             {transactions.length === 0 && (
//                                 <tr><td colSpan={4} className="text-center py-10 text-gray-400 italic">Belum ada data transaksi.</td></tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// }


/* === DATABASE REQUIREMENTS ===
  Table: stock_logs
  - id: INT (PK, AI) -> map to stock_logs
  - created_on: TIMESTAMP
  - direction: ENUM('IN', 'OUT') -> 'OUT' for Expense/Purchase
  - category: 'material'
  - total_amount: DECIMAL
  - description: TEXT (Stores JSON or structured string for order ref)
  - is_auto: TINYINT
  - proof: TEXT

  Table: orders
  - id: INT (PK)
  - order_number: VARCHAR
  - institution_name: VARCHAR
  - total_amount: DECIMAL
  - order_date: DATETIME
  - order_type: VARCHAR
  - status: VARCHAR
*/

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSubmit, useFetcher } from 'react-router';
import type { ActionFunction } from 'react-router';
import { ShoppingCart, Check, FileText, Palette, Scissors, Ruler, X, Loader2 } from 'lucide-react';
import { nexus } from '~/lib/nexus-client';
import { useFetcherData } from '~/hooks'; // Custom hook useFetcherData
import { formatCurrency, parseCurrency, formatNumberInput } from '~/constants';
import { toast } from 'sonner';
import { API } from '~/lib/api';
import { requireAuth } from "~/lib/session.server";

// --- TYPES ---
export interface Shop {
    id: string;
    name: string;
    location: string;
    type: 'Online' | 'Offline';
    wa?: string;
    link?: string;
    category: 'Kaos' | 'Sablon';
    price_s_xl?: number;
    price_2xl?: number;
    price_3xl?: number;
    price_4xl?: number;
    price_5xl?: number;
    price_long_sleeve?: number;
    price_per_meter?: number;
}

export interface OrderItemDetail {
    product_name: string;
    size: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL' | '5XL';
    sleeve: 'Pendek' | 'Panjang';
    color?: string;
    quantity: number;
}

export interface Order {
    id: number;
    order_number: string;
    institution_name: string;
    instansi: string; // Mapped UI Field
    order_type: string;
    status: string;
    total_amount: number;
    jumlah: number; // Mapped UI Field
    created_on: string;
    items_count: number;
    details: OrderItemDetail[];
}

export interface Transaction {
    id: number;
    created_on: string;
    direction: 'IN' | 'OUT';
    total_amount: number;
    description: string;
    is_auto: boolean;
    proof?: string;
    grand_total?: number;
}

export interface ShirtColor {
    id: string;
    name: string;
    imageUrl: string;
}

// --- ACTION (Server Side Mutation) ---
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
                direction: 'OUT', // Expense
                category: 'material',
                description: formData.get('description'),
                is_auto: true,
            };

            await API.STOCK_LOG.create({
                session: { user, token },
                req: { body: payload },
            });
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

    // --- UPLOAD REFS ---
    const logProofInputRef = useRef<HTMLInputElement>(null);
    const [pendingLogUpload, setPendingLogUpload] = useState<{ txId: number, type: 'DP' | 'Lunas' } | null>(null);

    // --- DATA FETCHING (Client Side via useFetcherData) ---
    const { data: shopsData } = useFetcherData({
        endpoint: nexus().module("SUPPLIER").action("get").params({ size: 100, category: "cotton_combed_premium" }).build(),
    });

    const { data: ordersData } = useFetcherData({
        endpoint: nexus().module("ORDERS").action("get").params({
            size: 100,
            status_ne: 'done,cancelled,rejected',
            // order_type: 'custom' 
        }).build(),
    });

    const { data: transData, reload: reloadTransactions } = useFetcherData({
        endpoint: nexus().module("STOCK_LOG").action("get").params({
            size: 50,
            category: 'material',
            sort_by: 'created_on',
            order: 'DESC'
        }).build(),
    });

    // TODO: Fetch Shirt Colors from API if available
    const shirtColors: ShirtColor[] = [];

    // --- EXTRACT DATA ---
    const shops: Shop[] = shopsData?.data?.items || [];
    const ordersRaw: any[] = ordersData?.data?.items || [];
    const transactions: Transaction[] = transData?.data?.items || [];

    // --- LOCAL STATE ---
    const [selectedShopId, setSelectedShopId] = useState<string>('');
    const [selectedOrderId, setSelectedOrderId] = useState<string>('');

    // Form Kaos State
    const [mDiscountStr, setMDiscountStr] = useState('');
    const [mAdminStr, setMAdminStr] = useState('');
    const [mShippingStr, setMShippingStr] = useState('');

    // Form Sablon State
    const [activeSablonForm, setActiveSablonForm] = useState<string | null>(null);
    const [sablonShopId, setSablonShopId] = useState('');
    const [sablonQtyMeters, setSablonQtyMeters] = useState('');
    const [sDiscStr, setSDiscStr] = useState('');
    const [sAdminStr, setSAdminStr] = useState('');
    const [sShipStr, setSShipStr] = useState('');

    // --- EFFECT: Handle Action Response ---
    useEffect(() => {
        if (fetcher.data && (fetcher.data as any).success) {
            toast.success((fetcher.data as any).message || "Berhasil");
            // Reset Form Kaos
            setSelectedOrderId('');
            setMDiscountStr('');
            setMAdminStr('');
            setMShippingStr('');

            // Reset Form Sablon
            setActiveSablonForm(null);
            setSablonShopId('');
            setSablonQtyMeters('');
            setSDiscStr('');
            setSAdminStr('');
            setSShipStr('');

            reloadTransactions();
        } else if (fetcher.data && !(fetcher.data as any).success) {
            toast.error((fetcher.data as any).message || "Gagal memproses data");
        }
    }, [fetcher.data]);

    // --- MEMOS (LOGIC) ---

    // Filter & Map Orders (Integrasi field DB baru)
    const cottonOrderOptions = useMemo(() => {
        return ordersRaw.map((o: any) => ({
            ...o,
            // Mapping field DB 'institution_name' ke UI logic 'instansi'
            instansi: o.institution_name || "Tanpa Nama",
            jumlah: o.items_count || (o.items || []).reduce((sum: number, item: any) => sum + (item.qty || 0), 0),
            // Parse details
            details: typeof o.details === 'string' ? JSON.parse(o.details) : (o.items || [])
        }));
    }, [ordersRaw]);

    const selectedOrderData = useMemo(() => cottonOrderOptions.find((o: any) => String(o.id) === selectedOrderId), [cottonOrderOptions, selectedOrderId]);
    const selectedVendorData = useMemo(() => shops.find((s: any) => String(s.id) === selectedShopId), [shops, selectedShopId]);

    // Kalkulator Harga Otomatis
    const cottonProcurementCalc = useMemo(() => {
        if (!selectedOrderData || !selectedVendorData) return { total: 0, itemsByColor: {} };

        const getUnitPrice = (size: string, sleeve: string) => {
            let base = 0;
            const s = size?.toUpperCase();
            // Mapping harga dari DB shop field
            if (['XS', 'S', 'M', 'L', 'XL'].includes(s)) base = selectedVendorData.price_s_xl || 0;
            else if (s === '2XL' || s === 'XXL') base = selectedVendorData.price_2xl || 0;
            else if (s === '3XL' || s === 'XXXL') base = selectedVendorData.price_3xl || 0;
            else if (s === '4XL') base = selectedVendorData.price_4xl || 0;
            else if (s === '5XL') base = selectedVendorData.price_5xl || 0;

            if (sleeve?.toLowerCase() === 'panjang') base += (selectedVendorData.price_long_sleeve || 0);
            return base;
        };

        const grouped: Record<string, any[]> = {};

        if (selectedOrderData.details && selectedOrderData.details.length > 0) {
            selectedOrderData.details.forEach((item: any) => {
                // Check if item is cotton shirt
                if (item.product_name?.toLowerCase().includes('cotton') || true) {
                    const uPrice = getUnitPrice(item.size || 'L', item.sleeve || 'Pendek');
                    const colorKey = item.color || 'Belum Diatur';
                    const qty = item.quantity || item.qty || 0;

                    if (!grouped[colorKey]) grouped[colorKey] = [];
                    grouped[colorKey].push({
                        size: item.size,
                        sleeve: item.sleeve,
                        quantity: qty,
                        price: uPrice,
                        total: uPrice * qty
                    });
                }
            });
        }

        let grandTotal = 0;
        Object.values(grouped).forEach(items => items.forEach(it => grandTotal += it.total));
        return { total: grandTotal, itemsByColor: grouped };
    }, [selectedOrderData, selectedVendorData]);

    // --- LOGIC: Group Log Pengadaan ---
    const groupedLogData = useMemo(() => {
        const logs: Record<string, { order: Order | undefined, cottonTx: Transaction | null, sablonTx: Transaction | null }> = {};

        // 1. Init logs from orders (Mapping field DB ke UI struct)
        cottonOrderOptions.forEach((o: any) => {
            logs[o.id] = { order: o, cottonTx: null, sablonTx: null };
        });

        // 2. Match transactions
        transactions.forEach(t => {
            let matchedOrderId = null;

            // Cari Order ID di description (e.g., "... (ord-123) ...")
            // Sesuaikan regex ini dengan format deskripsi yang Anda simpan di handleProcessBelanja
            // Format saat ini: `... (${selectedOrderData?.order_number})...` atau ID langsung

            // Coba cari order number
            const foundOrder = cottonOrderOptions.find((o: any) => t.description.includes(o.order_number) || t.description.includes(o.instansi));
            if (foundOrder) matchedOrderId = foundOrder.id;

            if (matchedOrderId && logs[matchedOrderId]) {
                if (t.description.includes('[COTTON]')) logs[matchedOrderId].cottonTx = t;
                if (t.description.includes('[SABLON]')) logs[matchedOrderId].sablonTx = t;
            }
        });

        // 3. Sort by date desc
        return Object.values(logs).sort((a, b) => {
            return new Date(b.order?.created_on || 0).getTime() - new Date(a.order?.created_on || 0).getTime();
        });
    }, [cottonOrderOptions, transactions]);

    const extractCost = (desc?: string) => {
        // Helper untuk ekstrak nilai dari deskripsi jika perlu, tapi kita pakai total_amount dari DB
        return 0;
    };

    const handleLogProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && pendingLogUpload) {
            // Upload Logic Here
            toast.info("Fitur upload bukti sedang dalam pengembangan.");
        }
    };

    // --- HANDLERS ---
    const handleProcessBelanja = () => {
        if (!selectedShopId || !selectedOrderId) return toast.error("Pilih Vendor dan Pesanan.");

        const finalTotal = cottonProcurementCalc.total
            + parseCurrency(mAdminStr)
            + parseCurrency(mShippingStr)
            - parseCurrency(mDiscountStr);

        const description = `[COTTON] Belanja Kaos di ${selectedVendorData?.name} untuk Pesanan ${selectedOrderData?.instansi} (${selectedOrderData?.order_number})...`;

        const formData = new FormData();
        formData.append('intent', 'create_expense');
        formData.append('supplier_id', selectedShopId);
        formData.append('supplier_name', selectedVendorData?.name || '');
        formData.append('amount', finalTotal.toString());
        formData.append('shipping_cost', parseCurrency(mShippingStr).toString());
        formData.append('admin_cost', parseCurrency(mAdminStr).toString());
        formData.append('discount', parseCurrency(mDiscountStr).toString());
        formData.append('description', description);

        fetcher.submit(formData, { method: 'post' });
    };

    const handleProcessSablon = (orderId: number) => {
        const sVendor = shops.find(s => String(s.id) === sablonShopId);
        if (!sVendor || !sablonQtyMeters) return toast.error("Pilih vendor dan jumlah meter.");

        const baseCost = Number(sVendor.price_per_meter || 0) * Number(sablonQtyMeters);
        const finalTotal = baseCost
            + parseCurrency(sAdminStr)
            + parseCurrency(sShipStr)
            - parseCurrency(sDiscStr);

        const order = cottonOrderOptions.find((o: any) => o.id === orderId);
        const description = `[SABLON] Belanja DTF di ${sVendor.name} untuk Pesanan ${order?.instansi} (${order?.order_number}) | Meter: ${sablonQtyMeters}...`;

        const formData = new FormData();
        formData.append('intent', 'create_expense');
        formData.append('supplier_id', sablonShopId);
        formData.append('supplier_name', sVendor.name);
        formData.append('amount', finalTotal.toString());
        formData.append('description', description);
        // ... append other costs fields

        fetcher.submit(formData, { method: 'post' });
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
                                {/* Filter hanya vendor kaos */}
                                {shops.filter((s: any) => s.category === 'Kaos' || s.category === 'cotton_combed_premium' || s.cotton_combed_category === 'kaos').map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.location})</option>)}
                            </select>
                        </div>
                        {/* Select Order */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Pesanan Kaos Baru:</label>
                            <select className="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 text-sm font-black focus:border-blue-400 outline-none transition shadow-sm" value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}>
                                <option value="">-- Pilih Pesanan --</option>
                                {/* Mapping data Order sesuai field baru */}
                                {cottonOrderOptions.map((o: any) => <option key={o.id} value={o.id}>{o.instansi} ({o.jumlah} pcs)</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Calculation Result & Submit */}
                    {selectedShopId && selectedOrderId && (
                        <div className="space-y-10 animate-fade-in">
                            {/* Rincian Per Warna */}
                            <div className="space-y-8">
                                {Object.entries(cottonProcurementCalc.itemsByColor).map(([colorName, items]: [string, any[]]) => {
                                    // Cari warna di list (jika ada)
                                    const colorObj = shirtColors.find(c => c.name === colorName);
                                    const colorTotal = items.reduce((sum, it) => sum + it.total, 0);
                                    return (
                                        <div key={colorName} className="bg-gray-50 rounded-[32px] border border-gray-200 overflow-hidden shadow-sm">
                                            <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    {colorObj ? <div className="w-20 h-14 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white"><img src={colorObj.imageUrl} className="w-full h-full object-cover" /></div> : <div className="w-20 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300"><Palette size={20} /></div>}
                                                    <div><h4 className="text-lg font-black text-gray-800 uppercase leading-none">{colorName}</h4><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">RINCIAN PRODUKSI WARNA</p></div>
                                                </div>
                                                {/* Total per color */}
                                                <div className="text-right"><div className="text-[10px] font-black text-gray-400 uppercase">Subtotal Kaos</div><div className="text-xl font-black text-blue-600">{formatCurrency(colorTotal)}</div></div>
                                            </div>
                                            {/* Table Items */}
                                            <table className="w-full text-left text-xs font-bold">
                                                <thead><tr className="border-b border-gray-200 text-gray-400"><th className="px-8 py-4 uppercase font-black">Ukuran & Lengan</th><th className="px-8 py-4 text-center font-black">Jumlah</th><th className="px-8 py-4 text-right font-black">Harga Vendor</th><th className="px-8 py-4 text-right font-black">Subtotal</th></tr></thead>
                                                <tbody className="divide-y divide-gray-100 bg-white/50">{items.map((it, i) => (<tr key={i} className="hover:bg-white transition"><td className="px-8 py-4"><span className="font-black text-gray-900 text-sm">{it.size}</span><span className={`ml-3 px-2 py-0.5 rounded-full text-[9px] font-black border ${it.sleeve === 'Panjang' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{it.sleeve.toUpperCase()}</span></td><td className="px-8 py-4 text-center font-black text-gray-900">{it.quantity} PCS</td><td className="px-8 py-4 text-right text-gray-400">{formatCurrency(it.price)}</td><td className="px-8 py-4 text-right font-black text-gray-700">{formatCurrency(it.total)}</td></tr>))}</tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Grand Total Bar */}
                            <div className="bg-gray-900 rounded-[40px] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden group">
                                <div className="relative z-10 space-y-6">
                                    <div className="flex flex-wrap gap-10">
                                        <div><div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Total Jumlah Kaos</div><div className="text-4xl font-black">{selectedOrderData?.jumlah} <span className="text-sm font-bold text-gray-500">PCS</span></div></div>
                                        <div><div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Total Harga Kaos</div><div className="text-4xl font-black text-blue-400">{formatCurrency(cottonProcurementCalc.total)}</div></div>
                                    </div>
                                </div>
                                <div className="relative z-10 flex flex-col gap-4 w-full md:w-auto">
                                    <div className="bg-white/5 p-4 rounded-3xl border border-white/10 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <input className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400" placeholder="Potongan" value={mDiscountStr} onChange={e => setMDiscountStr(formatNumberInput(e.target.value))} />
                                            <input className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400" placeholder="Admin" value={mAdminStr} onChange={e => setMAdminStr(formatNumberInput(e.target.value))} />
                                        </div>
                                        <input className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400" placeholder="Ongkir" value={mShippingStr} onChange={e => setMShippingStr(formatNumberInput(e.target.value))} />
                                    </div>
                                    <button onClick={handleProcessBelanja} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[28px] font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-900/20 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Check size={24} />} CATAT PENGADAAN KAOS
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* LOG HISTORY TABLE */}
            <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                <div className="p-10 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-black text-gray-800 text-lg flex items-center gap-3 uppercase tracking-tight"><FileText size={22} className="text-purple-600" /> Log Pengadaan & Keuntungan Bersih</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                            <tr>
                                <th className="px-10 py-6">Pesanan</th>
                                <th className="px-10 py-6 text-center">Status Kaos</th>
                                <th className="px-10 py-6 text-center">Status Sablon</th>
                                <th className="px-10 py-6 text-right">Laba Bersih</th>
                                <th className="px-10 py-6 text-center">Aksi Bayar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {groupedLogData.map((log, idx) => {
                                if (!log.order) return null;

                                // Costs from transactions
                                const cCost = Number(log.cottonTx?.grand_total || log.cottonTx?.total_amount || 0);
                                const sCost = Number(log.sablonTx?.grand_total || log.sablonTx?.total_amount || 0);

                                const revenue = Number(log.order.total_amount || 0);
                                const profit = revenue - cCost - sCost;

                                const hasKaosProof = !!log.cottonTx?.proof;
                                const hasSablonProof = !!log.sablonTx?.proof;

                                return (
                                    <React.Fragment key={idx}>
                                        <tr className="hover:bg-gray-50/50 transition group">
                                            <td className="px-10 py-8">
                                                <div className="font-black text-gray-800 text-base leading-tight">{log.order.instansi}</div>
                                                <div className="text-[10px] font-black text-blue-600 uppercase mt-1">JUAL: {formatCurrency(revenue)}</div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                {log.cottonTx ? (
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-black text-green-600 flex items-center justify-center gap-2"><Check size={12} /> TERPROSES</div>
                                                        <div className="text-[10px] font-bold text-gray-400">{formatCurrency(cCost)}</div>
                                                    </div>
                                                ) : <div className="text-[10px] font-black text-red-400 uppercase">BELUM ORDER</div>}
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                {log.sablonTx ? (
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-black text-green-600 flex items-center justify-center gap-2"><Check size={12} /> TERPROSES</div>
                                                        <div className="text-[10px] font-bold text-gray-400">{formatCurrency(sCost)}</div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setActiveSablonForm(activeSablonForm === String(log.order?.id) ? null : String(log.order?.id))} className="mx-auto flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl text-[10px] font-black hover:bg-orange-200 transition">
                                                        <Scissors size={12} /> BELI SABLON
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className={`text-lg font-black ${profit > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(profit)}</div>
                                                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">NET PROFIT</div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-2 items-center">
                                                    <button onClick={() => { if (log.cottonTx) { setPendingLogUpload({ txId: log.cottonTx.id, type: 'DP' }); logProofInputRef.current?.click(); } }} className={`px-4 py-2 border-2 rounded-xl text-[10px] font-black transition w-28 ${hasKaosProof ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-orange-100 text-orange-600'}`}>BUKTI KAOS</button>
                                                    <button onClick={() => { if (log.sablonTx) { setPendingLogUpload({ txId: log.sablonTx.id, type: 'DP' }); logProofInputRef.current?.click(); } }} className={`px-4 py-2 border-2 rounded-xl text-[10px] font-black transition w-28 ${hasSablonProof ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-blue-100 text-blue-600'}`}>BUKTI SABLON</button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* FORM BELANJA SABLON (Embedded in Table) */}
                                        {activeSablonForm === String(log.order?.id) && (
                                            <tr className="bg-orange-50/30 animate-fade-in border-y-2 border-orange-100">
                                                <td colSpan={5} className="p-10">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h4 className="font-black text-orange-700 text-sm uppercase flex items-center gap-2"><Ruler size={16} /> PENGADAAN SABLON DTF : {log.order.instansi}</h4>
                                                        <button onClick={() => setActiveSablonForm(null)} className="p-2 text-orange-300 hover:text-orange-600"><X size={20} /></button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Pilih Vendor Sablon:</label>
                                                            <select className="w-full bg-white border-2 border-orange-100 rounded-2xl p-4 text-sm font-black outline-none focus:border-orange-400" value={sablonShopId} onChange={e => setSablonShopId(e.target.value)}>
                                                                <option value="">-- Pilih Vendor Sablon --</option>
                                                                {shops.filter(s => s.category === 'Sablon' || s.category === 'cotton_combed_premium' || s.cotton_combed_category === 'sablon').map(s => <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price_per_meter || 0)}/m)</option>)}
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
                                                        <button onClick={() => handleProcessSablon(log.order!.id)} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 transition shadow-xl shadow-orange-900/10 disabled:opacity-50">
                                                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Check size={20} />} CATAT BELANJA SABLON
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden Input for Proof Upload Logic if needed later */}
            <input type="file" ref={logProofInputRef} className="hidden" accept="image/*" onChange={() => toast.info("Upload not implemented yet")} />
        </div>
    );
}
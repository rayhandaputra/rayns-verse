
// import React, { useState, useMemo, useRef, useEffect } from 'react';
// import { useFetcher } from 'react-router';
// import type { ActionFunction } from 'react-router';
// import { ShoppingCart, Check, FileText, Palette, Loader2, X, Upload, Scissors, Ruler, Image, Trash2 } from 'lucide-react';
// import { nexus } from '~/lib/nexus-client';
// import { useFetcherData, useModal } from '~/hooks';
// import { formatCurrency, parseCurrency, formatNumberInput } from '~/constants';
// import { toast } from 'sonner';
// import { API } from '~/lib/api';
// import { requireAuth } from "~/lib/session.server";
// import { safeParseArray, uploadFile } from '~/lib/utils';
// import Swal from 'sweetalert2';
// import { dateFormat } from '~/lib/dateFormatter';
// import ReactSelect from "react-select"
// import AsyncReactSelect from "react-select/async"

// // --- UTILS & CONSTANTS ---
// const isValidUploadedProof = (proof?: unknown) =>
//     typeof proof === "string" && proof.includes("data.kinau.id");

// // --- TYPES (ALIGNED WITH DB SCHEMA) ---

// const customStyleSelect = {
//     control: (baseStyles: any, state: any) => ({
//         ...baseStyles,
//         borderRadius: '1rem', // rounded-2xl
//         padding: '0.75rem', // p-5 (disesuaikan agar tidak terlalu raksasa)
//         borderWidth: '2px',
//         borderColor: state.isFocused ? '#60a5fa' : '#f3f4f6', // focus:border-blue-400 : border-gray-100
//         boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', // shadow-sm
//         fontWeight: 900, // font-black
//         fontSize: '0.875rem', // text-sm
//         '&:hover': {
//             borderColor: '#60a5fa'
//         }
//     }),
//     menu: (base: any) => ({
//         ...base,
//         borderRadius: '1rem',
//         overflow: 'hidden'
//     }),
//     option: (base: any, state: any) => ({
//         ...base,
//         backgroundColor: state.isSelected ? '#60a5fa' : state.isFocused ? '#eff6ff' : 'white',
//         color: state.isSelected ? 'white' : 'black',
//         fontWeight: 500
//     })
// }

// export interface Supplier {
//     id: number;
//     uid: string;
//     name: string;
//     location: string;
//     category: 'id_card_with_lanyard' | 'cotton_combed_premium';
//     cotton_combed_category?: 'kaos' | 'sablon'; // From DB Structure
//     price_s_xl?: number;
//     price_2xl?: number;
//     price_3xl?: number;
//     price_4xl?: number;
//     price_5xl?: number;
//     price_long_sleeve?: number;
//     price_per_meter?: number;
// }

// export interface OrderItem {
//     id: number;
//     order_number: string;
//     product_name: string;
//     qty: number;
//     quantity?: number; // Alternative field name that may come from API
//     unit_price: number;
//     // Mapped fields for calculation logic
//     size?: string;
//     sleeve?: string;
//     color?: string;
//     variant_name?: string;
// }

// export interface Order {
//     id: number;
//     uid: string;
//     trx_code: string; // Mapped from logic, possibly not in DB but returned by API
//     order_number: string;
//     institution_name: string;
//     total_amount: number;
//     status: string;
//     order_items: OrderItem[]; // Relation
//     // UI Mapped props
//     instansi: string;
//     jumlah: number;
// }

// export interface StockLog {
//     id: number;
//     trx_code: string;
//     order_trx_code?: string;
//     supplier_id: number;
//     supplier_name: string;
//     total_amount: number;
//     grand_total: number;
//     description: string;
//     created_on: string;
//     category: 'id_card_with_lanyard' | 'cotton_combed_premium';

//     // Payment Proofs
//     payment_status?: 'none' | 'unpaid' | 'paid' | 'down_payment';
//     payment_proof?: string;
//     payment_proof_on?: string;
//     payment_detail?: any;

//     dp_payment_proof?: string;
//     dp_payment_proof_on?: string;
//     dp_payment_detail?: any;

//     // Injected Relations
//     orders?: Order[]; // Adjusted based on safeParseArray usage in original code
// }

// // --- ACTION FUNCTION ---
// export const action: ActionFunction = async ({ request }) => {
//     const { user, token }: any = await requireAuth(request);
//     const formData = await request.formData();
//     const intent = formData.get('intent');
//     const actionType = formData.get("action");

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
//                 order_trx_code: formData.get('order_trx_code'),
//                 direction: 'OUT',
//                 category: 'cotton_combed_premium', // Enforced by DB Enum
//                 description: formData.get('description'),
//                 is_auto: true,
//             };

//             // Uncomment API call when ready
//             await API.STOCK_LOG.create({ session: { user, token }, req: { body: payload } });

//             return Response.json({ success: true, message: "Pengadaan berhasil dicatat" });
//         } catch (error: any) {
//             return Response.json({ success: false, message: error.message || "Gagal mencatat pengadaan" });
//         }
//     }

//     if (actionType === "update_payment_proof") {
//         const { id, payment_proof, payment_detail, dp_payment_proof, dp_payment_detail, order } = Object.fromEntries(formData.entries());

//         const res = await API.STOCK_LOG.update({
//             session: { user, token },
//             req: {
//                 body: {
//                     id,
//                     order, // Sending order object as requested
//                     payment_proof,
//                     payment_detail,
//                     dp_payment_proof,
//                     dp_payment_detail,
//                 },
//             },
//         });

//         return Response.json({
//             success: res.success,
//             message: res.success ? "Bukti pembayaran diperbarui" : "Gagal memperbarui bukti pembayaran",
//         });
//     }
//     return Response.json({ success: false });
// };

// // --- LOGIC HELPERS ---

// const calculateProcurementCosts = (order: Order | undefined, vendor: Supplier | undefined) => {
//     if (!order || !vendor) return { total: 0, itemsByColor: {} };

//     const getUnitPrice = (size: string, sleeve: string) => {
//         let base = 0;
//         const s = size?.toUpperCase() || 'L';

//         // Mapping DB fields to size logic
//         if (['XS', 'S', 'M', 'L', 'XL'].includes(s)) base = Number(vendor.price_s_xl || 0);
//         else if (s === '2XL' || s === 'XXL') base = Number(vendor.price_2xl || 0);
//         else if (s === '3XL' || s === 'XXXL') base = Number(vendor.price_3xl || 0);
//         else if (s === '4XL') base = Number(vendor.price_4xl || 0);
//         else if (s === '5XL') base = Number(vendor.price_5xl || 0);

//         if (sleeve?.toLowerCase() === 'panjang') base += Number(vendor.price_long_sleeve || 0);

//         return base;
//     };

//     const grouped: Record<string, any[]> = {};
//     const details = order.order_items || [];

//     details.forEach((item: any) => {
//         // Fallback logic if explicit size/sleeve columns aren't in order_items (parsing from variant_name or similar)
//         const size = item.size || 'L';
//         const sleeve = item.sleeve || 'Pendek';
//         const uPrice = getUnitPrice(size, sleeve);
//         const colorKey = item.color || 'Belum Diatur';
//         const qty = Number(item.qty || item.quantity || 0);

//         if (!grouped[colorKey]) grouped[colorKey] = [];
//         grouped[colorKey].push({
//             size: size,
//             sleeve: sleeve,
//             quantity: qty,
//             price: uPrice,
//             total: uPrice * qty
//         });
//     });

//     let grandTotal = 0;
//     Object.values(grouped).forEach(items => items.forEach(it => grandTotal += it.total));
//     return { total: grandTotal, itemsByColor: grouped };
// };

// // --- SUB-COMPONENTS ---

// const ProcurementForm = ({
//     shops,
//     orders,
//     procurementForm,
//     setProcurementForm,
//     calcData,
//     selectedOrderData,
//     selectedVendorData,
//     handleProcess,
//     isSubmitting
// }: any) => {
//     const orderOptions = orders.map((o: Order) => ({
//         value: o.order_number,
//         label: `${o.instansi} (${o.jumlah} pcs)`
//     }));
//     const selectedOption = orderOptions.find((opt: any) => opt.value === procurementForm.selectedOrderTrx) || null;
//     return (
//         <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm">
//             <div className="p-10 border-b border-gray-100 bg-blue-50/20">
//                 <h3 className="font-black text-gray-800 text-lg flex items-center gap-3"><ShoppingCart size={24} className="text-blue-600" /> FORM BELANJA VENDOR KAOS</h3>
//             </div>
//             <div className="p-10 space-y-8">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="space-y-2">
//                         <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Pilih Vendor Kaos:</label>
//                         <select
//                             className="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 text-sm font-black focus:border-blue-400 outline-none transition shadow-sm"
//                             value={procurementForm.selectedShopId}
//                             onChange={e => setProcurementForm({ ...procurementForm, selectedShopId: e.target.value })}
//                         >
//                             <option value="">-- Pilih Vendor Kaos --</option>
//                             {shops.filter((s: Supplier) => s.category === 'cotton_combed_premium' || s.cotton_combed_category === 'kaos').map((s: Supplier) => (
//                                 <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
//                             ))}
//                         </select>
//                     </div>
//                     <div className="space-y-2">
//                         <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">
//                             Pesanan Kaos Baru:
//                         </label>

//                         <ReactSelect
//                             options={orderOptions}
//                             value={selectedOption}
//                             onChange={(newValue: any) => {
//                                 setProcurementForm({
//                                     ...procurementForm,
//                                     selectedOrderTrx: newValue ? newValue.value : ""
//                                 });
//                             }}
//                             placeholder="-- Pilih Pesanan --"
//                             isClearable
//                             isSearchable
//                             // Styling agar mirip dengan desain Tailwind Anda sebelumnya
//                             styles={{
//                                 control: (baseStyles: any, state: any) => ({
//                                     ...baseStyles,
//                                     borderRadius: '1rem', // rounded-2xl
//                                     padding: '0.75rem', // p-5 (disesuaikan agar tidak terlalu raksasa)
//                                     borderWidth: '2px',
//                                     borderColor: state.isFocused ? '#60a5fa' : '#f3f4f6', // focus:border-blue-400 : border-gray-100
//                                     boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', // shadow-sm
//                                     fontWeight: 900, // font-black
//                                     fontSize: '0.875rem', // text-sm
//                                     '&:hover': {
//                                         borderColor: '#60a5fa'
//                                     }
//                                 }),
//                                 menu: (base: any) => ({
//                                     ...base,
//                                     borderRadius: '1rem',
//                                     overflow: 'hidden'
//                                 }),
//                                 option: (base: any, state: any) => ({
//                                     ...base,
//                                     backgroundColor: state.isSelected ? '#60a5fa' : state.isFocused ? '#eff6ff' : 'white',
//                                     color: state.isSelected ? 'white' : 'black',
//                                     fontWeight: 500
//                                 })
//                             }}
//                         />
//                     </div>
//                 </div>

//                 {procurementForm.selectedShopId && procurementForm.selectedOrderTrx && (
//                     <div className="space-y-10 animate-fade-in">
//                         <div className="space-y-8">
//                             {Object.entries(calcData.itemsByColor).map(([colorName, items]: [string, any[]]) => {
//                                 const colorTotal = items.reduce((sum, it) => sum + it.total, 0);
//                                 return (
//                                     <div key={colorName} className="bg-gray-50 rounded-[32px] border border-gray-200 shadow-sm">
//                                         <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
//                                             <div className="flex items-center gap-4">
//                                                 <div className="w-20 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300"><Palette size={20} /></div>
//                                                 {/* <div><h4 className="text-lg font-black text-gray-800 uppercase leading-none">{colorName}</h4><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">RINCIAN PRODUKSI WARNA</p></div> */}
//                                                 <div><h4 className="text-lg font-black text-gray-800 uppercase leading-none">ESTIMASI</h4><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">RINCIAN PRODUKSI WARNA</p></div>
//                                             </div>
//                                             <div className="text-right"><div className="text-[10px] font-black text-gray-400 uppercase">Subtotal Kaos</div><div className="text-xl font-black text-blue-600">{formatCurrency(colorTotal)}</div></div>
//                                         </div>
//                                         <table className="w-full text-left text-xs font-bold">
//                                             <thead>
//                                                 <tr className="border-b border-gray-200 text-gray-400">
//                                                     <th className="px-8 py-4 uppercase font-black">Ukuran & Lengan</th>
//                                                     <th className="px-8 py-4 text-center font-black">Jumlah</th>
//                                                     <th className="px-8 py-4 text-right font-black">Harga Jual</th>
//                                                     <th className="px-8 py-4 text-right font-black">Harga Vendor</th>
//                                                     <th className="px-8 py-4 text-right font-black">Subtotal</th>
//                                                 </tr>
//                                             </thead>
//                                             <tbody className="divide-y divide-gray-100 bg-white/50">
//                                                 {items.map((it, i) => (
//                                                     <tr key={i} className="hover:bg-white transition">
//                                                         <td className="px-8 py-4"><span className="font-black text-gray-900 text-sm">{it.size}</span><span className={`ml-3 px-2 py-0.5 rounded-full text-[9px] font-black border ${it.sleeve === 'Panjang' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{it.sleeve.toUpperCase()}</span></td>
//                                                         <td className="px-8 py-4 text-center font-black text-gray-900">{it.quantity} PCS</td>
//                                                         <td className="px-8 py-4 text-right text-gray-400">{formatCurrency(it.price)}</td>
//                                                         <td className="px-8 py-4 text-right text-gray-400 w-[260px]">
//                                                             <AsyncReactSelect
//                                                                 // options={orderOptions}
//                                                                 loadOptions={async (search: string) => {
//                                                                     try {
//                                                                         console.log(procurementForm?.selectedShopId)
//                                                                         const result = await API.SUPPLIER.get({
//                                                                             req: {
//                                                                                 query: {
//                                                                                     search: search || undefined,
//                                                                                     page: 0,
//                                                                                     size: 1,
//                                                                                     id: procurementForm?.selectedShopId,
//                                                                                     pagination: "true",
//                                                                                 },
//                                                                             },
//                                                                         });
//                                                                         // return (result?.items || []).map((v: any) => ({
//                                                                         //     ...v,
//                                                                         //     value: v.id,
//                                                                         //     label: v.name,
//                                                                         // }));
//                                                                         return [
//                                                                             {
//                                                                                 value: result?.items[0]?.price_s_xl,
//                                                                                 label: `S - XL : ${formatCurrency(result?.items[0]?.price_s_xl)}`,
//                                                                             },
//                                                                             {
//                                                                                 value: result?.items[0]?.price_2xl,
//                                                                                 label: `2XL : ${formatCurrency(result?.items[0]?.price_2xl)}`,
//                                                                             },
//                                                                             {
//                                                                                 value: result?.items[0]?.price_3xl,
//                                                                                 label: `3XL : ${formatCurrency(result?.items[0]?.price_3xl)}`,
//                                                                             },
//                                                                             {
//                                                                                 value: result?.items[0]?.price_4xl,
//                                                                                 label: `4XL : ${formatCurrency(result?.items[0]?.price_4xl)}`,
//                                                                             },
//                                                                             {
//                                                                                 value: result?.items[0]?.price_5xl,
//                                                                                 label: `5XL : ${formatCurrency(result?.items[0]?.price_5xl)}`,
//                                                                             },
//                                                                             {
//                                                                                 value: result?.items[0]?.price_long_sleeve,
//                                                                                 label: `Long Sleeve : ${formatCurrency(result?.items[0]?.price_long_sleeve)}`,
//                                                                             },
//                                                                             {
//                                                                                 value: result?.items[0]?.price_per_meter,
//                                                                                 label: `Per Meter : ${formatCurrency(result?.items[0]?.price_per_meter)}`,
//                                                                             },
//                                                                         ]
//                                                                     } catch (e) {
//                                                                         return [];
//                                                                     }
//                                                                 }}
//                                                                 // value={selectedOption}
//                                                                 onChange={(newValue: any) => {
//                                                                     // setProcurementForm({
//                                                                     //     ...procurementForm,
//                                                                     //     selectedOrderTrx: newValue ? newValue.value : ""
//                                                                     // });
//                                                                     console.log(newValue)

//                                                                 }}
//                                                                 placeholder="-- Pilih Harga --"
//                                                                 isClearable
//                                                                 isSearchable
//                                                                 defaultOptions
//                                                             // Styling agar mirip dengan desain Tailwind Anda sebelumnya
//                                                             // styles={customStyleSelect}
//                                                             />
//                                                         </td>
//                                                         <td className="px-8 py-4 text-right font-black text-gray-700">{formatCurrency(it.total)}</td>
//                                                     </tr>
//                                                 ))}
//                                             </tbody>
//                                         </table>
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                         <div className="bg-gray-900 rounded-[40px] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden group">
//                             <div className="relative z-10 space-y-6">
//                                 <div className="flex flex-wrap gap-10">
//                                     <div><div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Total Jumlah Kaos</div><div className="text-4xl font-black">{selectedOrderData?.jumlah} <span className="text-sm font-bold text-gray-500">PCS</span></div></div>
//                                     <div><div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Total Harga Kaos</div><div className="text-4xl font-black text-blue-400">{formatCurrency(calcData.total)}</div></div>
//                                 </div>
//                             </div>
//                             <div className="relative z-10 flex flex-col gap-4 w-full md:w-auto">
//                                 <div className="bg-white/5 p-4 rounded-3xl border border-white/10 space-y-3">
//                                     <div className="grid grid-cols-2 gap-3">
//                                         <input
//                                             className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400"
//                                             placeholder="Potongan"
//                                             value={procurementForm.discount}
//                                             onChange={e => setProcurementForm({ ...procurementForm, discount: formatNumberInput(e.target.value) })}
//                                         />
//                                         <input
//                                             className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400"
//                                             placeholder="Admin"
//                                             value={procurementForm.admin}
//                                             onChange={e => setProcurementForm({ ...procurementForm, admin: formatNumberInput(e.target.value) })}
//                                         />
//                                     </div>
//                                     <input
//                                         className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400"
//                                         placeholder="Ongkir"
//                                         value={procurementForm.shipping}
//                                         onChange={e => setProcurementForm({ ...procurementForm, shipping: formatNumberInput(e.target.value) })}
//                                     />
//                                 </div>
//                                 <button onClick={handleProcess} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 py-5 rounded-[28px] font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-900/20">
//                                     {isSubmitting ? <Loader2 className="animate-spin" /> : <Check size={24} />} CATAT PENGADAAN KAOS
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// const LogTable = ({ transactions, shops, isSubmitting, handleProcessSablon, openUploadModal, openViewModal }: any) => {
//     // Local state for Sablon Form within table
//     const [activeSablonForm, setActiveSablonForm] = useState<string | null>(null);
//     const [sablonState, setSablonState] = useState({ shopId: '', qty: '', disc: '', admin: '', ship: '' });

//     return (
//         <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
//             <div className="p-10 border-b border-gray-100 flex items-center justify-between">
//                 <h3 className="font-black text-gray-800 text-lg flex items-center gap-3 uppercase tracking-tight"><FileText size={22} className="text-purple-600" /> Log Pengadaan & Keuntungan Bersih</h3>
//             </div>
//             <div className="overflow-x-auto">
//                 <table className="w-full text-left text-sm">
//                     <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
//                         <tr>
//                             <th className="px-10 py-6">Pesanan</th>
//                             <th className="px-10 py-6 text-center">Status Kaos</th>
//                             <th className="px-10 py-6 text-center">Status Sablon</th>
//                             <th className="px-10 py-6 text-right">Biaya / Laba</th>
//                             <th className="px-10 py-6 text-center">Aksi Bayar</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-100">
//                         {transactions.map((t: StockLog) => {
//                             const orderData: any = safeParseArray(t.orders)?.[0] || {};
//                             const instansi = orderData.institution_name || t.description.split('untuk Pesanan')[1]?.split('(')[0] || 'Unknown';
//                             const orderTrx = t.order_trx_code || orderData.trx_code;
//                             const isKaos = t.description.includes('[COTTON]');
//                             const isSablon = t.description.includes('[SABLON]');
//                             const expense = Number(t.grand_total || t.total_amount || 0);

//                             const hasDpProof = Boolean(t?.dp_payment_proof) && isValidUploadedProof(t.dp_payment_proof);
//                             const hasPaidProof = Boolean(t?.payment_proof) && isValidUploadedProof(t.payment_proof);
//                             const canUploadDp = !hasDpProof && !hasPaidProof;
//                             const canUploadPaid = (!hasDpProof) || (hasDpProof && !t?.payment_proof) || (!hasPaidProof);

//                             const buttonBase = "flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition";
//                             const activeBtn = "bg-white text-gray-600 border-gray-300 hover:bg-gray-50";
//                             const disabledBtn = "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed";
//                             const successBtn = "bg-green-100 text-green-700 border-green-200";

//                             return (
//                                 <React.Fragment key={t.id}>
//                                     <tr className="hover:bg-gray-50/50 transition group">
//                                         <td className="px-10 py-8">
//                                             <div className="font-black text-gray-800 text-base leading-tight">{instansi}</div>
//                                             <div className="text-[10px] font-black text-blue-600 uppercase mt-1">Order ID: {orderData.order_number || '-'}</div>
//                                         </td>
//                                         <td className="px-10 py-8 text-center">
//                                             {isKaos ? (
//                                                 <div className="space-y-1">
//                                                     <div className="text-[10px] font-black text-green-600 flex items-center justify-center gap-2"><Check size={12} /> TERPROSES</div>
//                                                     <div className="text-[10px] font-bold text-gray-400">{formatCurrency(expense)}</div>
//                                                 </div>
//                                             ) : (
//                                                 <div className="text-[10px] font-black text-gray-300">-</div>
//                                             )}
//                                         </td>
//                                         <td className="px-10 py-8 text-center">
//                                             {isSablon ? (
//                                                 <div className="space-y-1">
//                                                     <div className="text-[10px] font-black text-green-600 flex items-center justify-center gap-2"><Check size={12} /> TERPROSES</div>
//                                                     <div className="text-[10px] font-bold text-gray-400">{formatCurrency(expense)}</div>
//                                                 </div>
//                                             ) : (
//                                                 <button onClick={() => setActiveSablonForm(activeSablonForm === orderTrx ? null : orderTrx)} className="mx-auto flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl text-[10px] font-black hover:bg-orange-200 transition">
//                                                     <Scissors size={12} /> BELI SABLON
//                                                 </button>
//                                             )}
//                                         </td>
//                                         <td className="px-10 py-8 text-right">
//                                             <div className="text-lg font-black text-red-500">-{formatCurrency(expense)}</div>
//                                             <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">PENGELUARAN</div>
//                                         </td>
//                                         <td className="px-10 py-8">
//                                             <div className="flex flex-col gap-1.5">
//                                                 <button disabled={!canUploadDp} onClick={() => openUploadModal(t, "down_payment")} className={`${buttonBase} ${hasDpProof ? successBtn : canUploadDp ? activeBtn : disabledBtn}`}>
//                                                     {hasDpProof ? <Check size={10} /> : <Upload size={10} />} DP
//                                                 </button>
//                                                 <button disabled={!canUploadPaid} onClick={() => openUploadModal(t, "paid")} className={`${buttonBase} ${hasPaidProof ? successBtn : canUploadPaid ? activeBtn : disabledBtn}`}>
//                                                     {hasPaidProof ? <Check size={10} /> : <Upload size={10} />} LUNAS
//                                                 </button>
//                                                 {(hasDpProof || hasPaidProof) && (
//                                                     <button onClick={() => openViewModal(t)} className="mt-1 text-[10px] text-blue-600 hover:underline flex items-center justify-center gap-1">
//                                                         <Image size={10} /> Lihat Bukti
//                                                     </button>
//                                                 )}
//                                             </div>
//                                         </td>
//                                     </tr>
//                                     {activeSablonForm === orderTrx && !isSablon && (
//                                         <tr className="bg-orange-50/30 animate-fade-in border-y-2 border-orange-100">
//                                             <td colSpan={5} className="p-10">
//                                                 <div className="flex justify-between items-center mb-6">
//                                                     <h4 className="font-black text-orange-700 text-sm uppercase flex items-center gap-2"><Ruler size={16} /> PENGADAAN SABLON DTF : {instansi}</h4>
//                                                     <button onClick={() => setActiveSablonForm(null)} className="p-2 text-orange-300 hover:text-orange-600"><X size={20} /></button>
//                                                 </div>
//                                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
//                                                     <div className="space-y-2">
//                                                         <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Pilih Vendor Sablon:</label>
//                                                         <select className="w-full bg-white border-2 border-orange-100 rounded-2xl p-4 text-sm font-black outline-none focus:border-orange-400" value={sablonState.shopId} onChange={e => setSablonState({ ...sablonState, shopId: e.target.value })}>
//                                                             <option value="">-- Pilih Vendor Sablon --</option>
//                                                             {shops.filter((s: Supplier) => s.category === 'cotton_combed_premium' || s.cotton_combed_category === 'sablon').map((s: Supplier) => <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price_per_meter || 0)}/m)</option>)}
//                                                         </select>
//                                                     </div>
//                                                     <div className="space-y-2">
//                                                         <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Kebutuhan Sablon (Meter):</label>
//                                                         <input type="number" className="w-full bg-white border-2 border-orange-100 rounded-2xl p-4 text-sm font-black outline-none" placeholder="0.0" value={sablonState.qty} onChange={e => setSablonState({ ...sablonState, qty: e.target.value })} />
//                                                     </div>
//                                                     <div className="space-y-2">
//                                                         <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Biaya Tambahan & Diskon:</label>
//                                                         <div className="grid grid-cols-3 gap-2">
//                                                             <input placeholder="Disk" className="bg-white border-2 border-orange-100 rounded-xl p-3 text-xs font-black" value={sablonState.disc} onChange={e => setSablonState({ ...sablonState, disc: formatNumberInput(e.target.value) })} />
//                                                             <input placeholder="Adm" className="bg-white border-2 border-orange-100 rounded-xl p-3 text-xs font-black" value={sablonState.admin} onChange={e => setSablonState({ ...sablonState, admin: formatNumberInput(e.target.value) })} />
//                                                             <input placeholder="Ongk" className="bg-white border-2 border-orange-100 rounded-xl p-3 text-xs font-black" value={sablonState.ship} onChange={e => setSablonState({ ...sablonState, ship: formatNumberInput(e.target.value) })} />
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                                 <div className="mt-8 flex justify-between items-center bg-white p-6 rounded-3xl border border-orange-100">
//                                                     <div className="text-orange-800">
//                                                         <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Estimasi Biaya Sablon</div>
//                                                         <div className="text-3xl font-black">
//                                                             {formatCurrency((Number(shops.find((s: Supplier) => String(s.id) === sablonState.shopId)?.price_per_meter || 0) * Number(sablonState.qty)) + parseCurrency(sablonState.admin) + parseCurrency(sablonState.ship) - parseCurrency(sablonState.disc))}
//                                                         </div>
//                                                     </div>
//                                                     <button onClick={() => handleProcessSablon(orderTrx || '', instansi, orderData.order_number, sablonState)} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 transition shadow-xl shadow-orange-900/10">
//                                                         {isSubmitting ? <Loader2 className="animate-spin" /> : <Check size={20} />} CATAT BELANJA SABLON
//                                                     </button>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     )}
//                                 </React.Fragment>
//                             )
//                         })}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// };

// const ProofModals = ({ modal, setModal, bankList, handleSubmitPaymentProof, actionLoading, submitAction }: any) => {
//     if (!modal.open) return null;

//     if (modal.type === "upload_payment_proof") {
//         return (
//             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
//                 <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
//                     <h3 className="text-lg font-bold mb-4">Upload Bukti Bayar</h3>
//                     <form onSubmit={handleSubmitPaymentProof} className="space-y-4">
//                         <div>
//                             <label className="block text-sm font-semibold text-gray-700 mb-2">Tujuan Transfer</label>
//                             <select className="w-full border border-gray-300 rounded-lg p-2 text-sm"
//                                 value={modal?.data?.payment_detail?.account_id || modal?.data?.payment_method || ""}
//                                 onChange={(e) => {
//                                     setModal({
//                                         ...modal,
//                                         data: {
//                                             ...modal?.data,
//                                             ...(+e.target.value > 0
//                                                 ? {
//                                                     payment_method: "manual_transfer",
//                                                     payment_detail: {
//                                                         account_id: e.target.value,
//                                                         account_code: bankList?.data?.items?.find((b: any) => b.id === +e.target.value)?.code,
//                                                         account_name: bankList?.data?.items?.find((b: any) => b.id === +e.target.value)?.name,
//                                                         account_number: bankList?.data?.items?.find((b: any) => b.id === +e.target.value)?.ref_account_number,
//                                                         account_holder: bankList?.data?.items?.find((b: any) => b.id === +e.target.value)?.ref_account_holder,
//                                                     },
//                                                 }
//                                                 : { payment_method: e.target.value, payment_detail: null }),
//                                         },
//                                     });
//                                 }}
//                                 required
//                             >
//                                 <option value="">-- Pilih Rekening --</option>
//                                 {bankList?.data?.items?.map((bank: any) => (
//                                     <option key={bank.id} value={bank.id}>{bank.name} - {bank.ref_account_number}- {bank.ref_account_holder}</option>
//                                 ))}
//                                 <option value="manual_transfer">Transfer</option>
//                                 <option value="cash">Tunai / Cash</option>
//                             </select>
//                         </div>
//                         <div>
//                             <label className="block text-sm font-semibold text-gray-700 mb-2">File Bukti Pembayaran</label>
//                             <input type="file" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//                                 onChange={async (e) => {
//                                     const file = e.target.files?.[0];
//                                     if (!file) return;
//                                     const url = await uploadFile(file);
//                                     if (url) setModal({ ...modal, data: { ...modal.data, file: url } });
//                                 }}
//                                 required
//                             />
//                         </div>
//                         <div className="flex gap-2 pt-2">
//                             <button type="button" onClick={() => setModal({ ...modal, open: false, type: "" })} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium">Batal</button>
//                             <button type="submit" disabled={actionLoading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
//                                 {actionLoading ? <Loader2 size={16} /> : <Upload size={16} />} {actionLoading ? "Menyimpan..." : "Simpan"}
//                             </button>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         );
//     }

//     if (modal.type === "view_payment_proof") {
//         return (
//             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in" onClick={() => setModal({ ...modal, open: false, type: "" })}>
//                 <div className="bg-white rounded-xl p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
//                     <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
//                         <h3 className="font-bold text-lg text-gray-800">Bukti Pembayaran</h3>
//                         <button onClick={() => setModal({ ...modal, open: false, type: "" })} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
//                     </div>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         {modal?.data?.dp_payment_proof && (
//                             <ProofImageCard
//                                 label="Bukti DP"
//                                 url={modal.data.dp_payment_proof}
//                                 date={modal.data.dp_payment_proof_uploaded_on}
//                                 onDelete={() => {
//                                     Swal.fire({
//                                         title: "Hapus Bukti DP?", text: "Yakin ingin menghapus bukti pembayaran DP?", icon: "warning", showCancelButton: true, confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal",
//                                         customClass: { confirmButton: "bg-red-600 text-white", cancelButton: "bg-gray-200 text-gray-800" },
//                                     }).then((result) => {
//                                         if (result.isConfirmed) submitAction({ action: "update_payment_proof", id: modal?.data?.id, order: JSON.stringify(modal?.data), dp_payment_proof: "" });
//                                     });
//                                 }}
//                                 onZoom={() => setModal({ open: true, type: "zoom_payment_proof", data: { payment_proof: modal.data.dp_payment_proof } })}
//                             />
//                         )}
//                         {modal?.data?.payment_proof && (
//                             <ProofImageCard
//                                 label="Bukti Pelunasan"
//                                 url={modal.data.payment_proof}
//                                 date={modal.data.payment_proof_uploaded_on}
//                                 onDelete={() => {
//                                     Swal.fire({
//                                         title: "Hapus Bukti Pelunasan?", text: "Yakin ingin menghapus bukti pembayaran pelunasan?", icon: "warning", showCancelButton: true, confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal",
//                                         customClass: { confirmButton: "bg-red-600 text-white", cancelButton: "bg-gray-200 text-gray-800" },
//                                     }).then((result) => {
//                                         if (result.isConfirmed) submitAction({ action: "update_payment_proof", id: modal?.data?.id, order: JSON.stringify(modal?.data), payment_proof: "" });
//                                     });
//                                 }}
//                                 onZoom={() => setModal({ open: true, type: "zoom_payment_proof", data: { payment_proof: modal.data.payment_proof } })}
//                             />
//                         )}
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     if (modal.type === "zoom_payment_proof") {
//         return (
//             <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in" onClick={() => setModal({ ...modal, open: false, type: "" })}>
//                 <button onClick={() => setModal({ ...modal, open: false, type: "" })} className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"><X size={32} /></button>
//                 <img src={modal?.data?.payment_proof} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
//             </div>
//         );
//     }
//     return null;
// };

// const ProofImageCard = ({ label, url, date, onDelete, onZoom }: any) => (
//     <div className="border rounded-lg p-3 bg-gray-50">
//         <div className="flex justify-between items-center mb-2">
//             <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">{label}</span>
//             <button onClick={onDelete} className="p-1 text-red-600 hover:bg-red-50 rounded transition" title={`Hapus ${label}`}><Trash2 size={14} /></button>
//         </div>
//         <div className="text-[10px] text-gray-500 mb-2">Diupload: {date ? dateFormat(date, "DD MMM YYYY (HH:mm)") : "-"}</div>
//         <div className="rounded-lg overflow-hidden border border-gray-200">
//             {typeof url === "string" && url.includes("data.kinau.id") ? (
//                 <img src={url} alt={label} className="w-full max-h-[320px] object-contain bg-white cursor-pointer" onClick={onZoom} />
//             ) : (<div className="flex items-center justify-center h-full p-4 text-xs"><p>Tidak ada Bukti, silahkan unggah kembali</p></div>)}
//         </div>
//     </div>
// );

// // --- MAIN PAGE COMPONENT ---
// export default function KaosProcurementPage() {
//     const fetcher = useFetcher();
//     const isSubmitting = fetcher.state === "submitting";
//     const [modal, setModal] = useModal();

//     // --- DATA FETCHING ---
//     const { data: shopsData } = useFetcherData({ endpoint: nexus().module("SUPPLIER").action("get").params({ size: 100, category: "cotton_combed_premium" }).build() });
//     const { data: ordersData } = useFetcherData({
//         endpoint: nexus().module("ORDERS").action("get").params({
//             size: 100, status_ne: 'done,cancelled,rejected', exclude_order_stock: "1", check_product_item: "cotton",
//             include: "order_items" // Ensure order_items relation is fetched
//         }).build()
//     });
//     const { data: bankList } = useFetcherData({ endpoint: nexus().module("ACCOUNT").action("get").params({ size: 100, pagination: "true", is_bank: "1" }).build() });
//     const { data: transData, reload: reloadTransactions } = useFetcherData({
//         endpoint: nexus().module("STOCK_LOG").action("get").params({
//             size: 200, category: 'cotton_combed_premium', sort_by: 'created_on', order: 'DESC', include: 'orders'
//         }).build()
//     });

//     const shops: Supplier[] = shopsData?.data?.items || [];
//     const ordersRaw: any[] = ordersData?.data?.items || [];
//     const transactions: StockLog[] = transData?.data?.items || [];

//     // --- STATE (Consolidated using unified pattern) ---
//     const [procurementForm, setProcurementForm] = useState({
//         selectedShopId: '',
//         selectedOrderTrx: '',
//         discount: '',
//         admin: '',
//         shipping: ''
//     });

//     // --- EFFECT ---
//     useEffect(() => {
//         if (fetcher.data && (fetcher.data as any).success) {
//             toast.success("Pengadaan Berhasil Dicatat");
//             // Reset form using unified state
//             setProcurementForm({
//                 selectedShopId: '',
//                 selectedOrderTrx: '',
//                 discount: '',
//                 admin: '',
//                 shipping: ''
//             });
//             reloadTransactions();
//         } else if (fetcher.data && !(fetcher.data as any).success) {
//             toast.error((fetcher.data as any).message || "Gagal memproses data");
//         }
//     }, [fetcher.data]);

//     // --- DATA MAPPING ---
//     const cottonOrderOptions = useMemo(() => {
//         return ordersRaw.map((o: any) => {
//             // Parse order_items - handle both array and string JSON
//             let items: OrderItem[] = [];
//             if (Array.isArray(o.order_items)) {
//                 items = o.order_items;
//             } else if (typeof o.order_items === 'string') {
//                 items = safeParseArray(o.order_items);
//             }

//             // Calculate total quantity from all items
//             const totalQty = items.reduce((sum, item) => {
//                 const qty = Number(item.qty || item.quantity || 0);
//                 return sum + qty;
//             }, 0);

//             // Enhanced mapping with better fallback for variant data
//             const enhancedItems = items.map(item => ({
//                 ...item,
//                 size: item.size || 'L',
//                 sleeve: item.sleeve || 'Pendek',
//                 color: item.color || 'Belum Diatur',
//                 qty: Number(item.qty || item.quantity || 0)
//             }));

//             return {
//                 ...o,
//                 instansi: o.institution_name || "Tanpa Nama",
//                 jumlah: totalQty,
//                 order_items: enhancedItems
//             } as Order;
//         });
//     }, [ordersRaw]);

//     const selectedOrderData = useMemo(() => {
//         return cottonOrderOptions.find(o => o.order_number === procurementForm.selectedOrderTrx)
//     },
//         [cottonOrderOptions, procurementForm.selectedOrderTrx]
//     );
//     const selectedVendorData = useMemo(() =>
//         shops.find(s => String(s.id) === procurementForm.selectedShopId),
//         [shops, procurementForm.selectedShopId]
//     );
//     const cottonProcurementCalc = useMemo(() => calculateProcurementCosts(selectedOrderData, selectedVendorData), [selectedOrderData, selectedVendorData]);

//     const { data: actionData, load: submitAction, loading: actionLoading } = useFetcherData({ endpoint: "", method: "POST", autoLoad: false });

//     useEffect(() => {
//         if (actionData?.success) {
//             setModal({ ...modal, open: false, type: "" });
//             toast.success(actionData.message || "Berhasil");
//             reloadTransactions();
//         } else if (actionData?.success === false) {
//             toast.error(actionData.message || "Gagal");
//         }
//     }, [actionData]);

//     // --- HANDLERS ---
//     const handleSubmitPaymentProof = (e: any) => {
//         e.preventDefault();
//         const payload: any = {
//             action: "update_payment_proof",
//             id: modal?.data?.id,
//             order: JSON.stringify(modal?.data),
//             payment_method: modal?.data?.payment_method,
//         };
//         if (modal?.data?.source_upload !== "down_payment") {
//             payload.payment_proof = modal?.data?.file;
//             payload.payment_detail = JSON.stringify(modal?.data?.payment_detail);
//         } else {
//             payload.dp_payment_proof = modal?.data?.file;
//             payload.dp_payment_detail = JSON.stringify(modal?.data?.payment_detail);
//         }
//         submitAction(payload);
//     };

//     const handleProcessBelanja = () => {
//         if (!procurementForm.selectedShopId || !procurementForm.selectedOrderTrx) {
//             return toast.error("Pilih Vendor dan Pesanan.");
//         }

//         const finalTotal = cottonProcurementCalc.total
//             + parseCurrency(procurementForm.admin)
//             + parseCurrency(procurementForm.shipping)
//             - parseCurrency(procurementForm.discount);

//         const description = `[COTTON] Belanja Kaos di ${selectedVendorData?.name} untuk Pesanan ${selectedOrderData?.instansi} (${selectedOrderData?.order_number})`;

//         const formData = new FormData();
//         formData.append('intent', 'create_expense');
//         formData.append('order_trx_code', procurementForm.selectedOrderTrx);
//         formData.append('supplier_id', procurementForm.selectedShopId);
//         formData.append('supplier_name', selectedVendorData?.name || '');
//         formData.append('amount', finalTotal.toString());
//         formData.append('shipping_cost', parseCurrency(procurementForm.shipping).toString());
//         formData.append('admin_cost', parseCurrency(procurementForm.admin).toString());
//         formData.append('discount', parseCurrency(procurementForm.discount).toString());
//         formData.append('description', description);
//         fetcher.submit(formData, { method: 'post' });
//     };

//     const handleProcessSablon = (trxCode: string, orderInstansi: string, orderNumber: string, sablonState: any) => {
//         const sVendor = shops.find(s => String(s.id) === sablonState.shopId);
//         if (!sVendor || !sablonState.qty) return toast.error("Pilih vendor dan jumlah meter.");

//         const baseCost = Number(sVendor.price_per_meter || 0) * Number(sablonState.qty);
//         const finalTotal = baseCost + parseCurrency(sablonState.admin) + parseCurrency(sablonState.ship) - parseCurrency(sablonState.disc);
//         const description = `[SABLON] Belanja DTF di ${sVendor.name} untuk Pesanan ${orderInstansi} (${orderNumber}) | Meter: ${sablonState.qty}`;

//         const formData = new FormData();
//         formData.append('intent', 'create_expense');
//         formData.append('order_trx_code', trxCode);
//         formData.append('supplier_id', sablonState.shopId);
//         formData.append('supplier_name', sVendor.name);
//         formData.append('amount', finalTotal.toString());
//         formData.append('description', description);
//         fetcher.submit(formData, { method: 'post' });
//     };

//     return (
//         <div className="space-y-8 animate-fade-in p-6">
//             <ProcurementForm
//                 shops={shops}
//                 orders={cottonOrderOptions}
//                 procurementForm={procurementForm}
//                 setProcurementForm={setProcurementForm}
//                 calcData={cottonProcurementCalc}
//                 selectedOrderData={selectedOrderData}
//                 selectedVendorData={selectedVendorData}
//                 handleProcess={handleProcessBelanja}
//                 isSubmitting={isSubmitting}
//             />

//             <LogTable
//                 transactions={transactions}
//                 shops={shops}
//                 isSubmitting={isSubmitting}
//                 handleProcessSablon={handleProcessSablon}
//                 openUploadModal={(data: any, source: string) => setModal({ open: true, type: "upload_payment_proof", data: { ...data, source_upload: source } })}
//                 openViewModal={(data: any) => setModal({ open: true, type: "view_payment_proof", data })}
//             />

//             <ProofModals
//                 modal={modal}
//                 setModal={setModal}
//                 bankList={bankList}
//                 handleSubmitPaymentProof={handleSubmitPaymentProof}
//                 actionLoading={actionLoading}
//                 submitAction={submitAction}
//             />
//         </div>
//     );
// }
import React, { useState, useMemo, useEffect } from 'react';
import { useFetcher } from 'react-router';
import type { ActionFunction } from 'react-router';
import { ShoppingCart, Check, FileText, Palette, Loader2, X, Upload, Scissors, Image, Trash2, ImageIcon, Ruler } from 'lucide-react';
import { nexus } from '~/lib/nexus-client';
import { useFetcherData, useModal } from '~/hooks';
import { formatCurrency, parseCurrency, formatNumberInput } from '~/constants';
import { toast } from 'sonner';
import { API } from '~/lib/api';
import { requireAuth } from "~/lib/session.server";
import { safeParseArray, uploadFile } from '~/lib/utils';
import Swal from 'sweetalert2';
import { dateFormat } from '~/lib/dateFormatter';
import ReactSelect from "react-select";
import AsyncReactSelect from "react-select/async";

// --- UTILS & CONSTANTS ---
const isValidUploadedProof = (proof?: unknown) => typeof proof === "string" && proof.includes("data.kinau.id");

const customStyleSelect = {
    control: (baseStyles: any, state: any) => ({
        ...baseStyles,
        borderRadius: '1rem',
        padding: '0.75rem',
        borderWidth: '2px',
        borderColor: state.isFocused ? '#60a5fa' : '#f3f4f6',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        fontWeight: 900,
        fontSize: '0.875rem',
        '&:hover': { borderColor: '#60a5fa' }
    }),
    menu: (base: any) => ({
        ...base,
        borderRadius: '1rem',
        overflow: 'hidden'
    }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected ? '#60a5fa' : state.isFocused ? '#eff6ff' : 'white',
        color: state.isSelected ? 'white' : 'black',
        fontWeight: 500
    })
};

// --- TYPES ---
export interface Supplier {
    id: number;
    name: string;
    location: string;
    category: string;
    cotton_combed_category?: 'kaos' | 'sablon';
    price_s_xl?: number;
    price_2xl?: number;
    price_3xl?: number;
    price_4xl?: number;
    price_5xl?: number;
    price_long_sleeve?: number;
    price_per_meter?: number;
}

export interface OrderItem {
    id?: number;
    product_id?: number;
    order_number: string;
    product_name: string;
    qty: number;
    quantity?: number;
    unit_price: number;
    size?: string;
    sleeve?: string;
    color?: string;
}

export interface Order {
    id: number;
    order_number: string;
    institution_name: string;
    total_amount: number;
    order_items: OrderItem[];
    instansi: string;
    jumlah: number;
}

// --- ACTION FUNCTION ---
export const action: ActionFunction = async ({ request }) => {
    const { user, token }: any = await requireAuth(request);
    const formData = await request.formData();
    const intent = formData.get('intent');

    if (intent === 'create_procurement') {
        try {
            const items = JSON.parse(formData.get('items') as string || "[]");
            const payload = {
                order_trx_code: formData.get('order_trx_code'),
                supplier_id: Number(formData.get('supplier_id')),
                total_item_qty: Number(formData.get('total_item_qty')),
                total_item_price: Number(formData.get('total_item_price')),
                discount_value: Number(formData.get('discount_value') || 0),
                admin_cost: Number(formData.get('admin_cost') || 0),
                shipping_cost: Number(formData.get('shipping_cost') || 0),

                sablon_supplier_id: formData.get('sablon_supplier_id') ? Number(formData.get('sablon_supplier_id')) : null,
                sablon_kebutuhan_per_meter: Number(formData.get('sablon_kebutuhan_per_meter') || 0),
                sablon_cost: Number(formData.get('sablon_cost') || 0),
                sablon_discount_value: Number(formData.get('sablon_discount_value') || 0),
                sablon_admin_cost: Number(formData.get('sablon_admin_cost') || 0),
                sablon_shipping_cost: Number(formData.get('sablon_shipping_cost') || 0),

                final_amount: Number(formData.get('final_amount')),
                laba_bersih: Number(formData.get('laba_bersih')),
                description: formData.get('description'),
                items: items
            };

            await API.STOCK_LOG.create({ session: { user, token }, req: { body: payload } });
            return Response.json({ success: true, message: "Pengadaan & Laba berhasil dicatat" });
        } catch (error: any) {
            return Response.json({ success: false, message: error.message });
        }
    }

    // TAMBAHKAN BLOK INI UNTUK MENANGANI FORM SABLON INLINE
    if (intent === 'update_sablon') {
        try {
            const id = formData.get('id');
            const payload = {
                id,
                sablon_supplier_id: Number(formData.get('sablon_supplier_id')),
                sablon_kebutuhan_per_meter: Number(formData.get('sablon_kebutuhan_per_meter')),
                sablon_cost: Number(formData.get('sablon_cost')),
                sablon_discount_value: Number(formData.get('sablon_discount_value') || 0),
                sablon_admin_cost: Number(formData.get('sablon_admin_cost') || 0),
                sablon_shipping_cost: Number(formData.get('sablon_shipping_cost') || 0),
                final_amount: Number(formData.get('final_amount')),
                laba_bersih: Number(formData.get('laba_bersih')),
                description: formData.get('description')
            };
            await API.STOCK_LOG.update({ session: { user, token }, req: { body: payload } });
            return Response.json({ success: true, message: "Belanja sablon berhasil ditambahkan" });
        } catch (error: any) {
            return Response.json({ success: false, message: error.message });
        }
    }

    // TIMPA BLOK INI UNTUK MENGAKOMODIR 4 KOLOM BUKTI BAYAR
    if (intent === "update_payment_proof") {
        const id = formData.get("id");
        const payload: any = { id };

        const targetField = formData.get("target_field") as string;
        const fileUrl = formData.get("file_url");

        if (targetField && fileUrl) {
            payload[targetField] = fileUrl;
        } else {
            // Fallback jika tidak pakai target_field
            if (formData.has("kaos_payment_proof_dp")) payload.kaos_payment_proof_dp = formData.get("kaos_payment_proof_dp");
            if (formData.has("kaos_payment_proof_paid")) payload.kaos_payment_proof_paid = formData.get("kaos_payment_proof_paid");
            if (formData.has("sablon_payment_proof_dp")) payload.sablon_payment_proof_dp = formData.get("sablon_payment_proof_dp");
            if (formData.has("sablon_payment_proof_paid")) payload.sablon_payment_proof_paid = formData.get("sablon_payment_proof_paid");
        }

        const res = await API.STOCK_LOG.update({ session: { user, token }, req: { body: payload } });
        return Response.json({ success: res.success, message: res.success ? "Bukti pembayaran diperbarui" : "Gagal memperbarui bukti pembayaran" });
    }
    // if (intent === "update_payment_proof") {
    //     const id = formData.get("id");
    //     const payload: any = { id };

    //     // Cek file apa yang diupload (Kaos DP / Lunas)
    //     if (formData.has("kaos_payment_proof_dp")) payload.kaos_payment_proof_dp = formData.get("kaos_payment_proof_dp");
    //     if (formData.has("kaos_payment_proof_paid")) payload.kaos_payment_proof_paid = formData.get("kaos_payment_proof_paid");

    //     const res = await API.STOCK_LOG.update({
    //         session: { user, token },
    //         req: { body: payload },
    //     });

    //     return Response.json({ success: res.success, message: res.success ? "Bukti pembayaran diperbarui" : "Gagal memperbarui bukti pembayaran" });
    // }

    return Response.json({ success: false });
};

// --- LOGIC HELPERS ---
const calculateProcurementCosts = (order: Order | undefined, vendor: Supplier | undefined) => {
    if (!order || !vendor) return { total: 0, itemsByColor: {} };

    const getUnitPrice = (size: string, sleeve: string) => {
        let base = 0;
        const s = size?.toUpperCase() || 'L';
        if (['XS', 'S', 'M', 'L', 'XL'].includes(s)) base = Number(vendor.price_s_xl || 0);
        else if (s === '2XL' || s === 'XXL') base = Number(vendor.price_2xl || 0);
        else if (s === '3XL' || s === 'XXXL') base = Number(vendor.price_3xl || 0);
        else if (s === '4XL') base = Number(vendor.price_4xl || 0);
        else if (s === '5XL') base = Number(vendor.price_5xl || 0);

        if (sleeve?.toLowerCase() === 'panjang') base += Number(vendor.price_long_sleeve || 0);
        return base;
    };

    const grouped: Record<string, any[]> = {};
    const details = order.order_items || [];

    details.forEach((item: any) => {
        const size = item.size || 'L';
        const sleeve = item.sleeve || 'Pendek';
        const uPrice = getUnitPrice(size, sleeve);
        const colorKey = item.color || 'Belum Diatur';
        const qty = Number(item.qty || item.quantity || 0);

        if (!grouped[colorKey]) grouped[colorKey] = [];
        grouped[colorKey].push({
            ...item,
            size, sleeve, quantity: qty, price: uPrice, total: uPrice * qty
        });
    });

    let grandTotal = 0;
    Object.values(grouped).forEach(items => items.forEach(it => grandTotal += it.total));
    return { total: grandTotal, itemsByColor: grouped };
};

// --- MAIN PAGE COMPONENT ---
export default function KaosProcurementPage() {
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === "submitting";
    const [modal, setModal] = useModal();

    // --- DATA FETCHING ---
    const { data: shopsData } = useFetcherData({ endpoint: nexus().module("SUPPLIER").action("get").params({ size: 100, category: "cotton_combed_premium" }).build() });
    const { data: ordersData } = useFetcherData({
        endpoint: nexus().module("ORDERS").action("get").params({ size: 100, status_ne: 'done,cancelled,rejected', exclude_order_stock: "1", check_product_item: "cotton", include: "order_items" }).build()
    });
    const { data: bankList } = useFetcherData({ endpoint: nexus().module("ACCOUNT").action("get").params({ size: 100, pagination: "true", is_bank: "1" }).build() });
    const { data: transData, reload: reloadTransactions } = useFetcherData({
        endpoint: nexus().module("STOCK_LOG").action("get").params({ size: 200, category: 'cotton_combed_premium', sort_by: 'created_on', order: 'DESC', include: 'orders' }).build()
    });

    const shops: Supplier[] = shopsData?.data?.items || [];
    const ordersRaw: any[] = ordersData?.data?.items || [];
    const transactions = transData?.data?.items || [];

    // --- FORM STATE ---
    const [form, setForm] = useState({
        selectedOrderTrx: '',
        selectedShopId: '',
        discount: '', admin: '', shipping: '',
        // Sablon
        sablonShopId: '', sablonQty: '', sablonCost: '', sablonDisc: '', sablonAdmin: '', sablonShip: ''
    });

    // --- EFFECT ---
    useEffect(() => {
        if (fetcher.data && (fetcher.data as any).success) {
            toast.success((fetcher.data as any).message || "Berhasil");
            setForm({
                selectedOrderTrx: '', selectedShopId: '', discount: '', admin: '', shipping: '',
                sablonShopId: '', sablonQty: '', sablonCost: '', sablonDisc: '', sablonAdmin: '', sablonShip: ''
            });
            setModal({ open: false, type: "" });
            reloadTransactions();
        } else if (fetcher.data && !(fetcher.data as any).success) {
            toast.error((fetcher.data as any).message || "Gagal memproses data");
        }
    }, [fetcher.data]);

    // --- DATA MAPPING ---
    const cottonOrderOptions = useMemo(() => {
        return ordersRaw.map((o: any) => {
            let items: OrderItem[] = Array.isArray(o.order_items) ? o.order_items : safeParseArray(o.order_items);
            const totalQty = items.reduce((sum, item) => sum + Number(item.qty || item.quantity || 0), 0);
            return {
                ...o, instansi: o.institution_name || "Tanpa Nama", jumlah: totalQty,
                order_items: items.map(item => ({ ...item, size: item.size || 'L', sleeve: item.sleeve || 'Pendek', color: item.color || 'Belum Diatur', qty: Number(item.qty || item.quantity || 0) }))
            } as Order;
        });
    }, [ordersRaw]);

    const selectedOrderData = useMemo(() => cottonOrderOptions.find(o => o.order_number === form.selectedOrderTrx), [cottonOrderOptions, form.selectedOrderTrx]);
    const selectedVendorData = useMemo(() => shops.find(s => String(s.id) === form.selectedShopId), [shops, form.selectedShopId]);
    const calcData = useMemo(() => calculateProcurementCosts(selectedOrderData, selectedVendorData), [selectedOrderData, selectedVendorData]);

    // --- HANDLERS ---
    const handleProcess = () => {
        if (!form.selectedShopId || !form.selectedOrderTrx) return toast.error("Pilih Vendor Kaos dan Pesanan.");

        const totalKaosCost = calcData.total - parseCurrency(form.discount) + parseCurrency(form.admin) + parseCurrency(form.shipping);

        let totalSablonCost = 0;
        let sablonBaseCost = 0;
        if (form.sablonShopId) {
            const sVendor = shops.find(s => String(s.id) === form.sablonShopId);
            sablonBaseCost = Number(sVendor?.price_per_meter || 0) * Number(form.sablonQty || 0);
            totalSablonCost = sablonBaseCost - parseCurrency(form.sablonDisc) + parseCurrency(form.sablonAdmin) + parseCurrency(form.sablonShip);
        }

        const finalAmount = totalKaosCost + totalSablonCost;
        const labaBersih = (selectedOrderData?.total_amount || 0) - finalAmount;

        const formData = new FormData();
        formData.append('intent', 'create_procurement');
        formData.append('order_trx_code', form.selectedOrderTrx);
        formData.append('supplier_id', form.selectedShopId);
        formData.append('total_item_qty', selectedOrderData?.jumlah?.toString() || '0');
        formData.append('total_item_price', calcData.total.toString());
        formData.append('discount_value', parseCurrency(form.discount).toString());
        formData.append('admin_cost', parseCurrency(form.admin).toString());
        formData.append('shipping_cost', parseCurrency(form.shipping).toString());

        if (form.sablonShopId) {
            formData.append('sablon_supplier_id', form.sablonShopId);
            formData.append('sablon_kebutuhan_per_meter', form.sablonQty);
            formData.append('sablon_cost', sablonBaseCost.toString());
            formData.append('sablon_discount_value', parseCurrency(form.sablonDisc).toString());
            formData.append('sablon_admin_cost', parseCurrency(form.sablonAdmin).toString());
            formData.append('sablon_shipping_cost', parseCurrency(form.sablonShip).toString());
        }

        formData.append('final_amount', finalAmount.toString());
        formData.append('laba_bersih', labaBersih.toString());
        formData.append('description', `[COTTON] Belanja Pengadaan Pesanan ${selectedOrderData?.instansi}`);

        const itemLogs: any = [];
        for (const items of Object.values(calcData.itemsByColor)) {
            items.forEach((it: any) => {
                itemLogs.push({
                    product_id: it.product_id || null,
                    qty: it.quantity,
                    selling_price: it.unit_price || 0,
                    supplier_price: it.price || 0,
                    subtotal: it.total || 0
                });
            });
        }
        formData.append('items', JSON.stringify(itemLogs));

        fetcher.submit(formData, { method: 'POST' });
    };

    // TAMBAHKAN FUNGSI INI UNTUK TOMBOL "BELI SABLON" DI TABEL
    const handleProcessSablon = (logId: string, oldFinalAmount: number, orderTotalAmount: number, sablonState: any) => {
        const sVendor = shops.find((s: any) => String(s.id) === sablonState.shopId);
        if (!sVendor || !sablonState.qty) return toast.error("Pilih vendor sablon dan jumlah meter.");

        const baseCost = Number(sVendor.price_per_meter || 0) * Number(sablonState.qty);
        const sablonTotal = baseCost + parseCurrency(sablonState.admin) + parseCurrency(sablonState.ship) - parseCurrency(sablonState.disc);

        const newFinalAmount = oldFinalAmount + sablonTotal;
        const newLabaBersih = orderTotalAmount - newFinalAmount;

        const formData = new FormData();
        formData.append('intent', 'update_sablon');
        formData.append('id', logId);
        formData.append('sablon_supplier_id', sablonState.shopId);
        formData.append('sablon_kebutuhan_per_meter', sablonState.qty);
        formData.append('sablon_cost', baseCost.toString());
        formData.append('sablon_discount_value', parseCurrency(sablonState.disc).toString());
        formData.append('sablon_admin_cost', parseCurrency(sablonState.admin).toString());
        formData.append('sablon_shipping_cost', parseCurrency(sablonState.ship).toString());
        formData.append('final_amount', newFinalAmount.toString());
        formData.append('laba_bersih', newLabaBersih.toString());
        formData.append('description', `[SABLON] Tambahan SablohandlePron DTF`);

        fetcher.submit(formData, { method: 'POST' });
    };

    // TIMPA FUNGSI INI AGAR DINAMIS MENERIMA KAOS/SABLON (DP/LUNAS)
    const handleSubmitPaymentProof = (e: any) => {
        e.preventDefault();
        const payload = new FormData();
        payload.append('intent', 'update_payment_proof');
        payload.append('id', modal?.data?.id);

        // Dinamis menggunakan target_field dari modal
        const targetField = modal?.data?.target_field;
        if (targetField) {
            payload.append(targetField, modal?.data?.file);
        } else {
            // Fallback
            if (modal?.data?.source_upload === "down_payment") {
                payload.append('kaos_payment_proof_dp', modal?.data?.file);
            } else {
                payload.append('kaos_payment_proof_paid', modal?.data?.file);
            }
        }
        fetcher.submit(payload, { method: 'POST' });
    };
    // const handleSubmitPaymentProof = (e: any) => {
    //     e.preventDefault();
    //     const payload = new FormData();
    //     payload.append('intent', 'update_payment_proof');
    //     payload.append('id', modal?.data?.id);

    //     if (modal?.data?.source_upload === "down_payment") {
    //         payload.append('kaos_payment_proof_dp', modal?.data?.file);
    //     } else {
    //         payload.append('kaos_payment_proof_paid', modal?.data?.file);
    //     }
    //     fetcher.submit(payload, { method: 'POST' });
    // };

    return (
        <div className="space-y-8 animate-fade-in p-6">
            <ProcurementForm
                shops={shops}
                orders={cottonOrderOptions}
                form={form}
                setForm={setForm}
                calcData={calcData}
                selectedOrderData={selectedOrderData}
                handleProcess={handleProcess}
                isSubmitting={isSubmitting}
            />

            {/* <LogTable
                transactions={transactions}
                openUploadModal={(data: any, source: string) => setModal({ open: true, type: "upload_payment_proof", data: { ...data, source_upload: source } })}
                openViewModal={(data: any) => setModal({ open: true, type: "view_payment_proof", data })}
            /> */}
            {/* TIMPA PEMANGGILAN LOGTABLE MENJADI SEPERTI INI */}
            <LogTable
                transactions={transactions}
                shops={shops}
                isSubmitting={isSubmitting}
                handleProcessSablon={handleProcessSablon}
                openUploadModal={(data: any, fieldName: string) => setModal({ open: true, type: "upload_payment_proof", data: { ...data, target_field: fieldName } })}
                openViewModal={(data: any) => setModal({ open: true, type: "view_payment_proof", data })}
            />

            <ProofModals
                modal={modal}
                setModal={setModal}
                bankList={bankList}
                handleSubmitPaymentProof={handleSubmitPaymentProof}
                actionLoading={isSubmitting}
            />
        </div>
    );
}

// --- SUB-COMPONENTS ---

const ProcurementForm = ({ shops, orders, form, setForm, calcData, selectedOrderData, handleProcess, isSubmitting }: any) => {
    const orderOptions = orders.map((o: any) => ({ value: o.order_number, label: `${o.instansi} (${o.jumlah} pcs)` }));
    const selectedOption = orderOptions.find((opt: any) => opt.value === form.selectedOrderTrx) || null;

    const totalExpansesKaos = calcData.total - parseCurrency(form.discount) + parseCurrency(form.admin) + parseCurrency(form.shipping);

    let totalExpansesSablon = 0;
    if (form.sablonShopId) {
        const sVendor = shops.find((s: any) => String(s.id) === form.sablonShopId);
        const sablonBase = Number(sVendor?.price_per_meter || 0) * Number(form.sablonQty || 0);
        totalExpansesSablon = sablonBase - parseCurrency(form.sablonDisc) + parseCurrency(form.sablonAdmin) + parseCurrency(form.sablonShip);
    }

    const estimatedLaba = (selectedOrderData?.total_amount || 0) - (totalExpansesKaos + totalExpansesSablon);

    return (
        <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm">
            <div className="p-10 border-b border-gray-100 bg-blue-50/20">
                <h3 className="font-black text-gray-800 text-lg flex items-center gap-3"><ShoppingCart size={24} className="text-blue-600" /> FORM PENGADAAN & KALKULASI LABA</h3>
            </div>
            <div className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Pilih Pesanan:</label>
                        <ReactSelect
                            options={orderOptions}
                            value={selectedOption}
                            onChange={(val: any) => setForm({ ...form, selectedOrderTrx: val ? val.value : "" })}
                            placeholder="-- Cari Pesanan --"
                            isClearable isSearchable styles={customStyleSelect}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Vendor Kaos Utama:</label>
                        <select
                            className="w-full bg-white border-2 border-gray-100 rounded-2xl p-5 text-sm font-black focus:border-blue-400 outline-none transition shadow-sm"
                            value={form.selectedShopId}
                            onChange={e => setForm({ ...form, selectedShopId: e.target.value })}
                        >
                            <option value="">-- Pilih Vendor Kaos --</option>
                            {shops.filter((s: any) => s.category === 'cotton_combed_premium' || s.cotton_combed_category === 'kaos').map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {form.selectedOrderTrx && form.selectedShopId && (
                    <div className="space-y-10 animate-fade-in">
                        {/* ITEM LIST */}
                        <div className="space-y-8">
                            {(Object.entries(calcData.itemsByColor) as any).map(([colorName, items]: [string, any[]]) => {
                                const colorTotal = items.reduce((sum, it) => sum + it.total, 0);
                                return (
                                    <div key={colorName} className="bg-gray-50 rounded-[32px] border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300"><Palette size={20} /></div>
                                                <div><h4 className="text-lg font-black text-gray-800 uppercase leading-none">{colorName}</h4><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">RINCIAN WARNA</p></div>
                                            </div>
                                            <div className="text-right"><div className="text-[10px] font-black text-gray-400 uppercase">Subtotal Kaos</div><div className="text-xl font-black text-blue-600">{formatCurrency(colorTotal)}</div></div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs font-bold min-w-max">
                                                <thead>
                                                    <tr className="border-b border-gray-200 text-gray-400">
                                                        <th className="px-8 py-4 uppercase font-black">Ukuran & Lengan</th>
                                                        <th className="px-8 py-4 text-center font-black">Jumlah</th>
                                                        <th className="px-8 py-4 text-right font-black">Harga Jual</th>
                                                        <th className="px-8 py-4 text-right font-black">Harga Vendor</th>
                                                        <th className="px-8 py-4 text-right font-black">Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 bg-white/50">
                                                    {items.map((it, i) => (
                                                        <tr key={i} className="hover:bg-white transition">
                                                            <td className="px-8 py-4"><span className="font-black text-gray-900 text-sm">{it.size}</span><span className={`ml-3 px-2 py-0.5 rounded-full text-[9px] font-black border ${it.sleeve === 'Panjang' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{it.sleeve.toUpperCase()}</span></td>
                                                            <td className="px-8 py-4 text-center font-black text-gray-900">{it.quantity} PCS</td>
                                                            <td className="px-8 py-4 text-right text-gray-400">{formatCurrency(it.unit_price)}</td>
                                                            <td className="px-8 py-4 text-right text-gray-400">{formatCurrency(it.price)}</td>
                                                            <td className="px-8 py-4 text-right font-black text-gray-700">{formatCurrency(it.total)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* SABLON SECTION (Digabungkan ke Form Utama) */}
                        <div className="bg-orange-50/50 rounded-[32px] p-8 border-2 border-dashed border-orange-200 space-y-6">
                            <div className="flex items-center gap-3 text-orange-600 font-black text-sm uppercase tracking-widest">
                                <Scissors size={20} /> Opsi Tambahan Vendor Sablon
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Pilih Vendor Sablon:</label>
                                    <select className="w-full bg-white border-2 border-orange-100 rounded-2xl p-4 text-sm font-black outline-none focus:border-orange-400" value={form.sablonShopId} onChange={e => setForm({ ...form, sablonShopId: e.target.value })}>
                                        <option value="">-- Lewati Jika Tidak Ada --</option>
                                        {shops.filter((s: any) => s.cotton_combed_category === 'sablon').map((s: any) => <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.price_per_meter || 0)}/m)</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Kebutuhan (Meter):</label>
                                    <input type="number" className="w-full bg-white border-2 border-orange-100 rounded-2xl p-4 text-sm font-black outline-none" placeholder="0.0" value={form.sablonQty} onChange={e => setForm({ ...form, sablonQty: e.target.value })} />
                                </div>
                                <div className="space-y-2 lg:col-span-2">
                                    <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Penyesuaian Biaya Sablon:</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input placeholder="Diskon" className="w-full bg-white border-2 border-orange-100 rounded-2xl p-4 text-sm font-black" value={form.sablonDisc} onChange={e => setForm({ ...form, sablonDisc: formatNumberInput(e.target.value) })} />
                                        <input placeholder="Admin" className="w-full bg-white border-2 border-orange-100 rounded-2xl p-4 text-sm font-black" value={form.sablonAdmin} onChange={e => setForm({ ...form, sablonAdmin: formatNumberInput(e.target.value) })} />
                                        <input placeholder="Ongkir" className="w-full bg-white border-2 border-orange-100 rounded-2xl p-4 text-sm font-black" value={form.sablonShip} onChange={e => setForm({ ...form, sablonShip: formatNumberInput(e.target.value) })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SUMMARY & SUBMIT */}
                        <div className="bg-gray-900 rounded-[40px] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10 space-y-6">
                                <div className="flex flex-wrap gap-10">
                                    <div><div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Total Harga Beli (Kaos + Sablon)</div><div className="text-3xl font-black text-red-400">{formatCurrency(totalExpansesKaos + totalExpansesSablon)}</div></div>
                                    <div><div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Estimasi Laba Bersih</div><div className="text-3xl font-black text-green-400">{formatCurrency(estimatedLaba)}</div></div>
                                </div>
                            </div>
                            <div className="relative z-10 flex flex-col gap-4 w-full md:w-auto">
                                <div className="bg-white/5 p-4 rounded-3xl border border-white/10 space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Penyesuaian Biaya Kaos:</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400" placeholder="Diskon Kaos" value={form.discount} onChange={e => setForm({ ...form, discount: formatNumberInput(e.target.value) })} />
                                        <input className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400" placeholder="Admin Kaos" value={form.admin} onChange={e => setForm({ ...form, admin: formatNumberInput(e.target.value) })} />
                                    </div>
                                    <input className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-blue-400" placeholder="Ongkir Kaos" value={form.shipping} onChange={e => setForm({ ...form, shipping: formatNumberInput(e.target.value) })} />
                                </div>
                                <button onClick={handleProcess} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 py-5 rounded-[28px] font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-900/20">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Check size={24} />} SIMPAN DATA PENGADAAN
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const LogTable = ({ transactions, shops, isSubmitting, handleProcessSablon, openUploadModal, openViewModal }: any) => {
    // State untuk form sablon yang merentang di dalam tabel
    const [activeSablonForm, setActiveSablonForm] = useState<string | null>(null);
    const [sablonState, setSablonState] = useState({ shopId: '', qty: '', disc: '', admin: '', ship: '' });

    const loadSupplierOptions = async (inputValue: string) => {
        try {
            const response = await API.SUPPLIER.get({
                session: {},
                req: {
                    query: {
                        size: 100, category: "cotton_combed_premium"
                    }
                }
            })
            return response?.items?.map((v: any) => ({
                ...v,
                value: v?.id,
                label: v?.name
            }))
        } catch (err) {
            console.log(err)
        }
    };

    return (
        <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-black text-gray-800 text-lg flex items-center gap-3 uppercase tracking-tight"><FileText size={22} className="text-purple-600" /> Log Pengadaan & Keuntungan Bersih</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-max">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                        <tr>
                            <th className="px-10 py-6">Pesanan</th>
                            <th className="px-10 py-6 text-center border-l border-gray-100">Status Kaos</th>
                            <th className="px-10 py-6 text-center border-l border-gray-100">Status Sablon</th>
                            <th className="px-10 py-6 text-right border-l border-gray-100">Laba Bersih</th>
                            <th className="px-10 py-6 text-center border-l border-gray-100">Aksi Bayar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-bold">Belum ada data pengadaan.</td></tr>
                        ) : (
                            transactions.map((t: any) => {
                                const orderData: any = safeParseArray(t.orders)?.[0] || {};
                                const instansi = orderData.institution_name || 'Tanpa Nama';
                                const revenue = Number(orderData.total_amount || 0);

                                // Kalkulasi Biaya Satuan
                                const cCost = Number(t.total_item_price || 0) - Number(t.discount_value || 0) + Number(t.admin_cost || 0) + Number(t.shipping_cost || 0);
                                const sCost = Number(t.sablon_cost || 0) - Number(t.sablon_discount_value || 0) + Number(t.sablon_admin_cost || 0) + Number(t.sablon_shipping_cost || 0);
                                const profit = Number(t.laba_bersih || 0);

                                const isKaosPurchased = cCost > 0;
                                const isSablonPurchased = sCost > 0 || t.sablon_supplier_id;

                                // Kondisi Bukti Bayar Kaos
                                const hasKaosDp = isValidUploadedProof(t.kaos_payment_proof_dp);
                                const hasKaosPaid = isValidUploadedProof(t.kaos_payment_proof_paid);
                                const canKaosDp = !hasKaosDp && !hasKaosPaid;
                                const canKaosPaid = (!hasKaosDp) || (hasKaosDp && !hasKaosPaid) || (!hasKaosPaid);

                                // Kondisi Bukti Bayar Sablon
                                const hasSablonDp = isValidUploadedProof(t.sablon_payment_proof_dp);
                                const hasSablonPaid = isValidUploadedProof(t.sablon_payment_proof_paid);
                                const canSablonDp = !hasSablonDp && !hasSablonPaid;
                                const canSablonPaid = (!hasSablonDp) || (hasSablonDp && !hasSablonPaid) || (!hasSablonPaid);

                                const btnBase = "px-3 py-1.5 rounded-lg text-[10px] font-black transition flex items-center justify-center gap-1 w-full border";

                                return (
                                    <React.Fragment key={t.id}>
                                        <tr className="hover:bg-gray-50/50 transition group">
                                            {/* PESANAN */}
                                            <td className="px-10 py-8">
                                                <div className="font-black text-gray-800 text-base leading-tight">{instansi}</div>
                                                <div className="text-[10px] font-black text-blue-600 uppercase mt-1">JUAL: {formatCurrency(revenue)}</div>
                                            </td>

                                            {/* STATUS KAOS */}
                                            <td className="px-10 py-8 text-center border-l border-gray-50">
                                                {isKaosPurchased ? (
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-black text-green-600 flex items-center justify-center gap-1"><Check size={12} /> TERPROSES</div>
                                                        <div className="text-[10px] font-bold text-gray-400">{formatCurrency(cCost)}</div>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] font-black text-red-400 uppercase">BELUM ORDER</div>
                                                )}
                                            </td>

                                            {/* STATUS SABLON */}
                                            <td className="px-10 py-8 text-center border-l border-gray-50">
                                                {isSablonPurchased ? (
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-black text-green-600 flex items-center justify-center gap-1"><Check size={12} /> TERPROSES</div>
                                                        <div className="text-[10px] font-bold text-gray-400">{formatCurrency(sCost)}</div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            if (activeSablonForm === t.id) { setActiveSablonForm(null); }
                                                            else { setActiveSablonForm(t.id); setSablonState({ shopId: '', qty: '', disc: '', admin: '', ship: '' }); }
                                                        }}
                                                        className="mx-auto flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl text-[10px] font-black hover:bg-orange-200 transition"
                                                    >
                                                        <Scissors size={12} /> BELI SABLON
                                                    </button>
                                                )}
                                            </td>

                                            {/* LABA BERSIH */}
                                            <td className="px-10 py-8 text-right border-l border-gray-50">
                                                <div className={`text-lg font-black ${profit > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(profit)}</div>
                                                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">NET PROFIT</div>
                                            </td>

                                            {/* AKSI BAYAR */}
                                            <td className="px-10 py-6 border-l border-gray-50">
                                                <div className="flex gap-4 min-w-[240px]">
                                                    <div className="flex-1 space-y-2 border-r border-gray-100 pr-4">
                                                        <div className="text-[9px] font-black text-gray-400 text-center uppercase tracking-widest">Bukti Kaos</div>
                                                        <button disabled={!canKaosDp} onClick={() => openUploadModal(t, "kaos_payment_proof_dp")} className={`${btnBase} ${hasKaosDp ? 'bg-green-50 text-green-700 border-green-200' : canKaosDp ? 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                                            {hasKaosDp ? <Check size={12} /> : <Upload size={12} />} DP
                                                        </button>
                                                        <button disabled={!canKaosPaid} onClick={() => openUploadModal(t, "kaos_payment_proof_paid")} className={`${btnBase} ${hasKaosPaid ? 'bg-green-50 text-green-700 border-green-200' : canKaosPaid ? 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                                            {hasKaosPaid ? <Check size={12} /> : <Upload size={12} />} LUNAS
                                                        </button>
                                                    </div>

                                                    <div className="flex-1 space-y-2">
                                                        <div className="text-[9px] font-black text-gray-400 text-center uppercase tracking-widest">Bukti Sablon</div>
                                                        <button disabled={!isSablonPurchased || !canSablonDp} onClick={() => openUploadModal(t, "sablon_payment_proof_dp")} className={`${btnBase} ${hasSablonDp ? 'bg-green-50 text-green-700 border-green-200' : (!isSablonPurchased || !canSablonDp) ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                                                            {hasSablonDp ? <Check size={12} /> : <Upload size={12} />} DP
                                                        </button>
                                                        <button disabled={!isSablonPurchased || !canSablonPaid} onClick={() => openUploadModal(t, "sablon_payment_proof_paid")} className={`${btnBase} ${hasSablonPaid ? 'bg-green-50 text-green-700 border-green-200' : (!isSablonPurchased || !canSablonPaid) ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                                                            {hasSablonPaid ? <Check size={12} /> : <Upload size={12} />} LUNAS
                                                        </button>
                                                    </div>
                                                </div>
                                                {(hasKaosDp || hasKaosPaid || hasSablonDp || hasSablonPaid) && (
                                                    <button onClick={() => openViewModal(t)} className="w-full mt-3 text-[10px] font-bold text-blue-600 hover:underline flex items-center justify-center gap-1">
                                                        <ImageIcon size={12} /> Lihat Semua Bukti
                                                    </button>
                                                )}
                                            </td>
                                        </tr>

                                        {/* INLINE FORM SABLON (Hanya Muncul Jika Diklik & Belum Beli) */}
                                        {activeSablonForm === t.id && !isSablonPurchased && (
                                            <tr className="bg-orange-50/30 animate-fade-in border-y-2 border-orange-100">
                                                <td colSpan={5} className="p-10">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h4 className="font-black text-orange-700 text-sm uppercase flex items-center gap-2"><Ruler size={16} /> PENGADAAN SABLON DTF : {instansi}</h4>
                                                        <button onClick={() => setActiveSablonForm(null)} className="p-2 text-orange-300 hover:text-orange-600 bg-white rounded-full shadow-sm"><X size={20} /></button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
                                                                Pilih Vendor Sablon:
                                                            </label>

                                                            <AsyncReactSelect
                                                                cacheOptions
                                                                defaultOptions
                                                                loadOptions={loadSupplierOptions}
                                                                styles={{
                                                                    control: (provided: any, state: any) => ({
                                                                        ...provided,
                                                                        backgroundColor: 'white',
                                                                        borderWidth: '2px',
                                                                        borderColor: state.isFocused ? '#fb923c' : '#ffedd5', // orange-400 : orange-100
                                                                        borderRadius: '1rem', // rounded-2xl
                                                                        padding: '0.5rem', // p-2 (p-4 agak terlalu besar untuk select, tapi bisa disesuaikan)
                                                                        boxShadow: 'none',
                                                                        '&:hover': {
                                                                            borderColor: '#fb923c' // orange-400
                                                                        }
                                                                    }),
                                                                    option: (provided: any, state: any) => ({
                                                                        ...provided,
                                                                        fontSize: '0.875rem', // text-sm
                                                                        color: 'black',
                                                                        fontWeight: '900', // font-black
                                                                        backgroundColor: state.isSelected ? '#ffedd5' : 'white',
                                                                        '&:hover': {
                                                                            backgroundColor: '#fff7ed'
                                                                        }
                                                                    }),
                                                                    singleValue: (provided: any) => ({
                                                                        ...provided,
                                                                        fontSize: '0.875rem', // text-sm
                                                                        fontWeight: '900', // font-black
                                                                    })
                                                                }}
                                                                placeholder="-- Pilih Vendor Sablon --"

                                                                // Handling perubahan value
                                                                onChange={(option: any) => {
                                                                    setSablonState({
                                                                        ...sablonState,
                                                                        shopId: option ? option.value : ''
                                                                    });
                                                                }}

                                                            // Menghandle value yang terpilih (Optional: butuh logic tambahan jika ingin menampilkan value saat edit)
                                                            // value={selectedOption} 
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Kebutuhan Sablon (Meter):</label>
                                                            <input type="number" className="w-full bg-white border-2 border-orange-100 rounded-2xl p-4 text-sm font-black outline-none" placeholder="0.0" value={sablonState.qty} onChange={e => setSablonState({ ...sablonState, qty: e.target.value })} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Biaya Tambahan & Diskon:</label>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <input placeholder="Disk" className="bg-white border-2 border-orange-100 rounded-xl p-3 text-xs font-black" value={sablonState.disc} onChange={e => setSablonState({ ...sablonState, disc: formatNumberInput(e.target.value) })} />
                                                                <input placeholder="Adm" className="bg-white border-2 border-orange-100 rounded-xl p-3 text-xs font-black" value={sablonState.admin} onChange={e => setSablonState({ ...sablonState, admin: formatNumberInput(e.target.value) })} />
                                                                <input placeholder="Ongk" className="bg-white border-2 border-orange-100 rounded-xl p-3 text-xs font-black" value={sablonState.ship} onChange={e => setSablonState({ ...sablonState, ship: formatNumberInput(e.target.value) })} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-8 flex justify-between items-center bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
                                                        <div className="text-orange-800">
                                                            <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Estimasi Biaya Sablon</div>
                                                            <div className="text-3xl font-black">
                                                                {formatCurrency((Number(shops.find((s: any) => String(s.id) === sablonState.shopId)?.price_per_meter || 0) * Number(sablonState.qty)) + parseCurrency(sablonState.admin) + parseCurrency(sablonState.ship) - parseCurrency(sablonState.disc))}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => handleProcessSablon(t.id, Number(t.final_amount), revenue, sablonState)} disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 transition shadow-xl shadow-orange-900/20">
                                                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Check size={20} />} CATAT BELANJA SABLON
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ProofModals = ({ modal, setModal, bankList, handleSubmitPaymentProof, actionLoading }: any) => {
    if (!modal.open) return null;

    if (modal.type === "upload_payment_proof") {
        const isKaos = modal.data?.target_field?.includes("kaos");
        const isDP = modal.data?.target_field?.includes("dp");
        const title = `Upload Bukti ${isKaos ? "Kaos" : "Sablon"} (${isDP ? "DP" : "Lunas"})`;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
                    <h3 className="text-lg font-black text-gray-800 mb-6">{title}</h3>
                    <form onSubmit={handleSubmitPaymentProof} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">File Bukti Pembayaran</label>
                            <input type="file" accept="image/*" className={`w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase outline-none ${isKaos ? 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100' : 'file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100'}`}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const url = await uploadFile(file);
                                    if (url) setModal({ ...modal, data: { ...modal.data, file: url } });
                                }}
                                required
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setModal({ ...modal, open: false, type: "" })} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-black uppercase">Batal</button>
                            <button type="submit" disabled={actionLoading} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-black uppercase flex items-center justify-center gap-2">
                                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (modal.type === "view_payment_proof") {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in" onClick={() => setModal({ ...modal, open: false, type: "" })}>
                <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h3 className="font-black text-xl text-gray-800">Galeri Bukti Pembayaran</h3>
                        <button onClick={() => setModal({ ...modal, open: false, type: "" })} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
                    </div>

                    <div className="space-y-6">
                        {/* Area Bukti Kaos */}
                        <div>
                            <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4 border-b border-blue-50 pb-2">Bukti Pembayaran Kaos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ProofImageCard label="Bukti DP Kaos" url={modal?.data?.kaos_payment_proof_dp} date={modal.data.modified_on} onZoom={() => setModal({ open: true, type: "zoom_payment_proof", data: { payment_proof: modal.data.kaos_payment_proof_dp } })} />
                                <ProofImageCard label="Bukti Lunas Kaos" url={modal?.data?.kaos_payment_proof_paid} date={modal.data.modified_on} onZoom={() => setModal({ open: true, type: "zoom_payment_proof", data: { payment_proof: modal.data.kaos_payment_proof_paid } })} />
                            </div>
                        </div>

                        {/* Area Bukti Sablon (Jika Ada) */}
                        {(modal?.data?.sablon_payment_proof_dp || modal?.data?.sablon_payment_proof_paid || modal?.data?.sablon_supplier_id) && (
                            <div>
                                <h4 className="text-sm font-black text-orange-600 uppercase tracking-widest mb-4 border-b border-orange-50 pb-2 mt-8">Bukti Pembayaran Sablon</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ProofImageCard label="Bukti DP Sablon" url={modal?.data?.sablon_payment_proof_dp} date={modal.data.modified_on} onZoom={() => setModal({ open: true, type: "zoom_payment_proof", data: { payment_proof: modal.data.sablon_payment_proof_dp } })} />
                                    <ProofImageCard label="Bukti Lunas Sablon" url={modal?.data?.sablon_payment_proof_paid} date={modal.data.modified_on} onZoom={() => setModal({ open: true, type: "zoom_payment_proof", data: { payment_proof: modal.data.sablon_payment_proof_paid } })} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (modal.type === "zoom_payment_proof") {
        return (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in" onClick={() => setModal({ ...modal, open: false, type: "" })}>
                <button onClick={() => setModal({ ...modal, open: false, type: "" })} className="absolute top-6 right-6 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"><X size={32} /></button>
                <img src={modal?.data?.payment_proof} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
            </div>
        );
    }
    return null;
};

const ProofImageCard = ({ label, url, date, onZoom }: any) => (
    <div className="border-2 border-gray-100 rounded-2xl p-4 bg-gray-50/50">
        <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black px-3 py-1 rounded-full bg-green-100 text-green-700 uppercase tracking-widest">{label}</span>
        </div>
        <div className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">Update: {date ? dateFormat(date, "DD MMM YYYY") : "-"}</div>
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
            {typeof url === "string" && url.includes("data.kinau.id") ? (
                <img src={url} alt={label} className="w-full h-[200px] object-cover cursor-pointer hover:scale-105 transition duration-300" onClick={onZoom} />
            ) : (<div className="flex items-center justify-center h-[200px] p-4 text-xs font-bold text-gray-400">Tidak ada Bukti</div>)}
        </div>
    </div>
);
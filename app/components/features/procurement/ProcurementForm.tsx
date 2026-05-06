
import React from 'react';
import { ShoppingCart, Palette, Check, Loader2, Scissors } from 'lucide-react';
import ReactSelect from "react-select";
import { formatCurrency, formatNumberInput, parseCurrency } from '~/constants';
import { customStyleSelect } from './procurement-utils';

export const ProcurementForm = ({ shops, orders, form, setForm, calcData, selectedOrderData, handleProcess, isSubmitting }: any) => {
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
                                const colorTotal = items.reduce((sum: number, it: any) => sum + it.total, 0);
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
                                                    {items.map((it: any, i: number) => (
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

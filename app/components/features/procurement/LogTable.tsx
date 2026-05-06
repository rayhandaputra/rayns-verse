
import React, { useState } from 'react';
import { FileText, Check, Scissors, Upload, ImageIcon, Ruler, X, Loader2 } from 'lucide-react';
import AsyncReactSelect from "react-select/async";
import { formatCurrency, formatNumberInput, parseCurrency } from '~/constants';
import { safeParseArray } from '~/utils/utils';
import { isValidUploadedProof } from './procurement-utils';

export const LogTable = ({ transactions, shops, isSubmitting, handleProcessSablon, openUploadModal, openViewModal, loadSupplierOptions }: any) => {
    // State untuk form sablon yang merentang di dalam tabel
    const [activeSablonForm, setActiveSablonForm] = useState<string | null>(null);
    const [sablonState, setSablonState] = useState({ shopId: '', qty: '', disc: '', admin: '', ship: '' });

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
                                                                        borderColor: state.isFocused ? '#fb923c' : '#ffedd5',
                                                                        borderRadius: '1rem',
                                                                        padding: '0.5rem',
                                                                        boxShadow: 'none',
                                                                        '&:hover': {
                                                                            borderColor: '#fb923c'
                                                                        }
                                                                    }),
                                                                    option: (provided: any, state: any) => ({
                                                                        ...provided,
                                                                        fontSize: '0.875rem',
                                                                        color: 'black',
                                                                        fontWeight: '900',
                                                                        backgroundColor: state.isSelected ? '#ffedd5' : 'white',
                                                                        '&:hover': {
                                                                            backgroundColor: '#fff7ed'
                                                                        }
                                                                    }),
                                                                    singleValue: (provided: any) => ({
                                                                        ...provided,
                                                                        fontSize: '0.875rem',
                                                                        fontWeight: '900',
                                                                    })
                                                                }}
                                                                placeholder="-- Pilih Vendor Sablon --"
                                                                onChange={(option: any) => {
                                                                    setSablonState({
                                                                        ...sablonState,
                                                                        shopId: option ? option.value : ''
                                                                    });
                                                                }}
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

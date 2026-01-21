import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useParams, type ActionFunction } from "react-router";
import {
    ShoppingCart, Upload, Check, X, Box, PlusCircle,
    Package
} from "lucide-react";
import ReactSelect from "react-select";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/lib/nexus-client";
import { safeParseArray, uploadFile } from "~/lib/utils";
import { toast } from "sonner";
import { requireAuth } from "~/lib/session.server";
import { API } from "~/lib/api";
import {
    formatCurrency, parseCurrency,
    // formatNumberInput,
    // type any, type any, type Shop, 
    // type Material, 
    // type SubComponent
} from "~/constants"; // Sesuaikan import path
import type { SubComponent } from "./app.procurement.$category";
import { formatNumberInput } from "./app.procurement-old";

// --- SERVER ACTION ---
export const action: ActionFunction = async ({ request }) => {
    const { user, token }: any = await requireAuth(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    // Parse Payload
    const rawData = Object.fromEntries(formData);

    try {
        if (intent === "shopping") {
            // Reconstruct Payload with proper types
            const payload: any = {
                ...rawData,
                items: rawData.items ? JSON.parse(rawData.items as string) : [],
                // Ensure number types
                supplier_id: Number(rawData.supplier_id),
                total_amount: Number(rawData.total_amount),
                shipping_cost: Number(rawData.shipping_cost),
                admin_cost: Number(rawData.admin_cost),
                discount: Number(rawData.discount),
                grand_total: Number(rawData.grand_total),
                is_auto: rawData.is_auto === "true",
            };

            const res = await API.STOCK_LOG.create({
                session: { user, token },
                req: { body: payload },
            });

            return Response.json({
                success: res.success,
                message: res.success ? "Transaksi Berhasil Disimpan" : "Gagal menyimpan transaksi",
            });
        }
        return Response.json({ success: false, message: "Unknown intent" });
    } catch (error: any) {
        console.error("Action Error:", error);
        return Response.json({ success: false, message: error.message || "Server Error" });
    }
};

// --- SUB-COMPONENTS (UI CLEANUP) ---

const ShoppingItemCard = ({
    m,
    cart,
    onUpdateCart
}: {
    m: any;
    cart: Record<string, number>;
    onUpdateCart: (key: string, qty: number) => void;
}) => {
    const subComponents = safeParseArray(m.sub_components) as SubComponent[];
    const isPackage = +m.is_package === 1 && subComponents.length > 0;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-blue-300 transition-all shadow-sm">
            <div className="p-4 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
                <div>
                    <div className="font-black text-gray-800 text-sm flex items-center gap-2">
                        {m.commodity_name}
                        {isPackage && <span className="bg-blue-100 text-blue-600 text-[9px] px-2 py-0.5 rounded-full">PAKET</span>}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                        Stok: {m.current_stock} {m.unit}
                    </div>
                </div>
                <div className="text-xs font-black text-blue-600 bg-white px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm">
                    {formatCurrency(m.unit_price)} / {m.unit}
                </div>
            </div>

            <div className="p-4">
                {isPackage ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {subComponents.map((sub) => (
                            <div key={sub.id} className={`flex items-center justify-between p-2 pr-3 rounded-xl border transition-all ${cart[`sub:${sub.id}`] ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100"}`}>
                                <span className="text-xs font-bold text-gray-600 pl-2 truncate flex-1">{sub.commodity_name}</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        className="w-16 bg-white border border-gray-200 rounded-lg p-1.5 text-center text-xs font-black focus:border-blue-400 outline-none transition shadow-sm"
                                        placeholder="0"
                                        value={cart[`sub:${sub.id}`] || ""}
                                        onChange={(e) => onUpdateCart(`sub:${sub.id}`, Number(e.target.value))}
                                        min="0"
                                    />
                                    <span className="text-[9px] font-black text-gray-300 w-6 text-right">{m.unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-between bg-white p-2 rounded-xl">
                        <span className="text-xs text-gray-500 font-bold pl-2">Input Jumlah Pembelian:</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                className={`w-24 border-2 outline-none rounded-xl p-2 text-center text-sm font-black shadow-sm transition-colors ${cart[m.id] ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-100 bg-white"}`}
                                placeholder="0"
                                value={cart[m.id] || ""}
                                onChange={(e) => onUpdateCart(m.id, Number(e.target.value))}
                                min="0"
                            />
                            <span className="text-xs font-black text-gray-400 uppercase w-8 text-center">{m.unit}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function ShoppingPage() {
    const { category } = useParams();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- STATES ---
    const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
    const [cart, setCart] = useState<Record<string, number>>({});
    const [costs, setCosts] = useState({ discount: "", admin: "", shipping: "" });
    const [proofImage, setProofImage] = useState<string>("");

    // Manual Input State
    const [manualMatId, setManualMatId] = useState<string>("");
    const [manualSubId, setManualSubId] = useState<string>("");
    const [manualQty, setManualQty] = useState<string>("");

    // UI States
    const [isProcessing, setIsProcessing] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // --- FETCHERS ---
    const { data: shopData } = useFetcherData({ endpoint: nexus().module("SUPPLIER").action("get").params({ size: 100 }).build() });
    const { data: matData } = useFetcherData({ endpoint: nexus().module("SUPPLIER_COMMODITY").action("get").params({ size: 100, level: 1 }).build() });
    const { data: stockLogData, reload: reloadLogs } = useFetcherData({ endpoint: nexus().module("STOCK_LOG").action("get").params({ size: 20, category: 'id_card_with_lanyard', sort_by: "created_on", order: "DESC" }).build() });
    const { data: actionData, load: submitAction } = useFetcherData({ endpoint: "", method: "POST", autoLoad: false });

    // --- MEMOIZED DATA ---
    const shops: any[] = useMemo(() => (shopData?.data?.items || []).filter((s: any) => s.category === category), [shopData, category]);
    const allMaterials: any[] = useMemo(() => (matData?.data?.items || []).filter((m: any) => m.category === category), [matData, category]);
    const transactions = useMemo(() => stockLogData?.data?.items || [], [stockLogData]);

    const selectedShopData = useMemo(() => shops.find(s => +s.id === Number(selectedShopId)), [selectedShopId, shops]);

    const selectedShopMaterials = useMemo(() => {
        if (!selectedShopId) return [];
        return allMaterials.filter(m => +m.supplier_id === Number(selectedShopId));
    }, [selectedShopId, allMaterials]);

    const selectedManualMat = useMemo(() => allMaterials.find(m => +m.id === Number(manualMatId)), [manualMatId, allMaterials]);

    // --- CALCULATIONS ---
    const calculation = useMemo(() => {
        let itemsTotal = 0;
        const cartItems: any[] = [];

        Object.entries(cart).forEach(([key, qty]) => {
            if (qty <= 0) return;

            const isSub = key.startsWith("sub:");
            const cleanId = isSub ? key.replace("sub:", "") : key;

            // Logic Lookup Material
            // 1. Cari di Selected Shop (Priority)
            // 2. Fallback ke All Materials (jika needed)
            let material = selectedShopMaterials.find(m => m.id === cleanId) ||
                selectedShopMaterials.find(m =>
                    (safeParseArray(m.sub_components) as SubComponent[]).some(s => s.id === cleanId)
                );

            if (!material) return;

            let price = material.unit_price;
            let name = material.commodity_name;
            let commodityId = Number(material.id);
            let isParent: 0 | 1 = 1;

            if (isSub) {
                const sub = (safeParseArray(material.sub_components) as SubComponent[]).find(s => s.id === cleanId);
                if (sub) {
                    name = `${material.commodity_name} [${sub.commodity_name}]`;
                    commodityId = Number(sub.id);
                    isParent = 0;
                    // Harga ikut parent (paket) atau sub? Asumsi: Harga Parent per paket
                    price = material.unit_price;
                }
            }

            const subtotal = price * qty;
            itemsTotal += subtotal;

            cartItems.push({
                commodity_id: commodityId,
                commodity_name: name,
                is_commodity_parent: isParent,
                category: 'material',
                movement_type: 'purchase',
                qty: qty,
                price_per_unit: price,
                subtotal: subtotal
            });
        });

        const admin = parseCurrency(costs.admin);
        const shipping = parseCurrency(costs.shipping);
        const discount = parseCurrency(costs.discount);
        const grandTotal = itemsTotal + admin + shipping - discount;

        return { itemsTotal, grandTotal, admin, shipping, discount, cartItems };
    }, [cart, costs, selectedShopMaterials]);

    // --- EFFECTS ---
    useEffect(() => {
        if (actionData?.success) {
            toast.success(actionData.message || "Berhasil");
            // Reset All Forms
            setCart({});
            setCosts({ discount: "", admin: "", shipping: "" });
            setProofImage("");
            setSelectedShopId(null);
            setManualQty(""); setManualMatId(""); setManualSubId("");
            reloadLogs();
        } else if (actionData?.success === false) {
            toast.error(actionData.message || "Gagal");
        }
    }, [actionData]);

    // --- HANDLERS ---
    const updateCart = useCallback((key: string, val: number) => {
        setCart(prev => ({ ...prev, [key]: val }));
    }, []);

    const submitStockLog = (payload: any) => {
        setIsProcessing(true);
        // Transform payload objects to simpler types for FormData if needed, 
        // or just pass as is since our custom hook handles JSON conversion usually.
        // But based on 'action' code: items need to be stringified manually.
        submitAction({
            intent: "shopping",
            ...payload,
            items: JSON.stringify(payload.items)
        });
        setTimeout(() => setIsProcessing(false), 2000); // Failsafe loader
    };

    const handleCheckout = () => {
        if (calculation.cartItems.length === 0) return toast.error("Keranjang kosong!");

        const payload: any = {
            supplier_id: Number(selectedShopId),
            supplier_name: selectedShopData?.name || "Unknown",
            total_amount: calculation.itemsTotal,
            shipping_cost: calculation.shipping,
            admin_cost: calculation.admin,
            discount: calculation.discount,
            grand_total: calculation.grandTotal,
            direction: 'IN',
            description: `Belanja Stok: ${calculation.cartItems.length} items dari ${selectedShopData?.name}`,
            is_auto: true,
            proof: proofImage,
            items: calculation.cartItems
        };
        submitStockLog(payload);
    };

    const handleManualEntry = () => {
        if (!manualMatId || !manualQty) return toast.error("Data manual tidak lengkap");

        let targetId = Number(manualMatId);
        let name = selectedManualMat?.commodity_name || "";
        let isParent: 0 | 1 = 1;

        if (manualSubId) {
            const sub = (safeParseArray(selectedManualMat?.sub_components) as SubComponent[])
                .find(s => +s.id === +manualSubId);
            if (sub) {
                name += ` [${sub.commodity_name}]`;
                targetId = Number(manualSubId);
                isParent = 0;
            }
        }

        const qty = Number(manualQty);
        const payload: any = {
            supplier_id: 0,
            supplier_name: "Manual Adjustment",
            total_amount: 0,
            shipping_cost: 0, admin_cost: 0, discount: 0, grand_total: 0,
            direction: 'IN',
            description: `Manual Input: ${name} (${qty})`,
            is_auto: true,
            items: [{
                commodity_id: targetId,
                commodity_name: name,
                is_commodity_parent: isParent,
                category: 'material',
                movement_type: 'adjustment',
                qty: qty,
                price_per_unit: 0,
                subtotal: 0
            }]
        };
        submitStockLog(payload);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in pb-20">
            {/* --- LEFT COLUMN: FORMS --- */}
            <div className="lg:col-span-2 space-y-6">

                {/* 1. SHOPPING CART FORM */}
                <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-100 bg-blue-50/30">
                        <h3 className="font-black text-gray-800 flex items-center gap-3 text-lg">
                            <ShoppingCart size={24} className="text-blue-600" /> FORM BELANJA BAHAN
                        </h3>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Supplier Select */}
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Pilih Supplier</label>
                            <ReactSelect
                                options={shops.map(s => ({ value: s.id, label: `${s.name} (${s.type})` }))}
                                value={shops.map(s => ({ value: s.id, label: `${s.name} (${s.type})` })).find(o => +o.value === Number(selectedShopId))}
                                onChange={(val: any) => {
                                    setSelectedShopId(val?.value || null);
                                    setCart({});
                                }}
                                placeholder="-- Cari Nama Toko --"
                                classNames={{
                                    control: () => "!rounded-2xl !border-2 !border-gray-100 !p-2 !text-sm !font-bold !shadow-none hover:!border-blue-300",
                                    menu: () => "!rounded-2xl !overflow-hidden !border !border-gray-100 !shadow-xl !mt-2",
                                    option: ({ isSelected }) => `!text-sm !font-bold ${isSelected ? "!bg-blue-600" : "!text-gray-700 hover:!bg-blue-50"}`,
                                }}
                            />
                        </div>

                        {selectedShopId && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Items List */}
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedShopMaterials.length === 0 ? (
                                        <div className="text-center py-10 bg-gray-50 border border-dashed rounded-2xl text-gray-400">Tidak ada produk terdaftar.</div>
                                    ) : (
                                        selectedShopMaterials.map(m => (
                                            <ShoppingItemCard key={m.id} m={m} cart={cart} onUpdateCart={updateCart} />
                                        ))
                                    )}
                                </div>

                                {/* Financials */}
                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detail Biaya & Bukti</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { label: "Diskon", val: costs.discount, key: "discount", color: "text-green-500" },
                                            { label: "Admin", val: costs.admin, key: "admin", color: "text-gray-400" },
                                            { label: "Ongkir", val: costs.shipping, key: "shipping", color: "text-red-500" }
                                        ].map((f) => (
                                            <div key={f.key} className="relative group">
                                                <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black ${f.color}`}>Rp</span>
                                                <input
                                                    type="text"
                                                    className="w-full border-2 border-white rounded-2xl p-3 pl-10 text-sm font-bold bg-white shadow-sm focus:border-blue-400 outline-none"
                                                    value={f.val}
                                                    onChange={(e) => setCosts({ ...costs, [f.key]: formatNumberInput(e.target.value) })}
                                                    placeholder={f.label}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* File Upload */}
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed transition font-black text-xs uppercase tracking-wide
                                                ${proofImage ? "border-emerald-400 bg-emerald-50 text-emerald-600" : "border-gray-300 bg-white text-gray-400 hover:border-blue-400"}`}
                                        >
                                            {proofImage ? <Check size={18} /> : <Upload size={18} />}
                                            {proofImage ? "Bukti Terupload" : "Upload Bukti Transaksi"}
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                if (e.target.files?.[0]) {
                                                    toast.promise(uploadFile(e.target.files[0]), {
                                                        loading: 'Uploading...',
                                                        success: (url: any) => {
                                                            setProofImage(url);
                                                            return 'Upload Berhasil';
                                                        },
                                                        error: 'Upload Gagal'
                                                    });
                                                }
                                            }}
                                        />
                                        {proofImage && (
                                            <div className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden relative group cursor-pointer" onClick={() => setZoomedImage(proofImage)}>
                                                <img src={proofImage} className="w-full h-full object-cover" alt="Proof" />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setProofImage(""); }}
                                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Summary & Action */}
                                <div className="bg-gray-900 rounded-[32px] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Grand Belanja</span>
                                        <h4 className="text-3xl font-black tracking-tight">{formatCurrency(calculation.grandTotal)}</h4>
                                        <span className="text-[10px] text-gray-500 font-medium">Items: {calculation.cartItems.length} | Subtotal: {formatCurrency(calculation.itemsTotal)}</span>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        disabled={isProcessing || calculation.cartItems.length === 0}
                                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition shadow-lg shadow-blue-900/20"
                                    >
                                        {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={20} />}
                                        {isProcessing ? "Menyimpan..." : "Simpan Transaksi"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. MANUAL INPUT FORM */}
                <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-100 bg-orange-50/30">
                        <h3 className="font-black text-gray-800 flex items-center gap-3 text-lg">
                            <PlusCircle size={24} className="text-orange-500" /> TAMBAH STOK MANUAL (INTERNAL)
                        </h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select
                                className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-white focus:border-orange-300 outline-none"
                                value={manualMatId}
                                onChange={(e) => { setManualMatId(e.target.value); setManualSubId(""); }}
                            >
                                <option value="">-- Pilih Komponen --</option>
                                {allMaterials.map(m => (
                                    <option key={m.id} value={m.id}>{m.commodity_name}</option>
                                ))}
                            </select>

                            {+selectedManualMat?.is_package === 1 && (
                                <select
                                    className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-white focus:border-orange-300 outline-none"
                                    value={manualSubId}
                                    onChange={(e) => setManualSubId(e.target.value)}
                                >
                                    <option value="">-- Pilih Varian/Warna --</option>
                                    {(safeParseArray(selectedManualMat.sub_components) as SubComponent[]).map(s => (
                                        <option key={s.id} value={s.id}>{s.commodity_name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="relative flex-1 w-full">
                                <input
                                    type="number"
                                    className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold focus:border-orange-300 outline-none"
                                    placeholder="Jumlah Penambahan"
                                    value={manualQty}
                                    onChange={(e) => setManualQty(e.target.value)}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 uppercase">
                                    {selectedManualMat?.unit || "UNIT"}
                                </span>
                            </div>
                            <button
                                onClick={handleManualEntry}
                                disabled={!manualMatId || !manualQty || isProcessing}
                                className="w-full md:w-auto bg-orange-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition shadow-lg shadow-orange-500/20"
                            >
                                {isProcessing ? "..." : <><PlusCircle size={20} /> TAMBAH</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT COLUMN: SIDEBAR --- */}
            <div className="space-y-6">
                <div className="bg-white rounded-[32px] p-8 border border-gray-200 shadow-sm sticky top-6">
                    <h4 className="font-black text-gray-800 text-sm mb-6 flex items-center gap-2 uppercase tracking-tight">
                        <Box size={18} className="text-purple-600" /> Riwayat Stok Terakhir
                    </h4>

                    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {transactions.map((t: any) => (
                            <div key={t.id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                                <div className="text-[10px] font-black text-gray-400 uppercase mb-1">
                                    {new Date(t.created_on).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-xs font-bold text-gray-700 leading-relaxed mb-2 line-clamp-2">
                                    {t.description}
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-xs font-black text-blue-600">
                                        {Number(t.grand_total) > 0 ? formatCurrency(Number(t.grand_total)) : "Adjustment"}
                                    </div>
                                    {t.proof && (
                                        <button
                                            onClick={() => setZoomedImage(t.proof)}
                                            className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded-lg font-bold text-gray-500 hover:text-blue-600 hover:border-blue-200 transition"
                                        >
                                            LIHAT BUKTI
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {transactions.length === 0 && <div className="text-center text-xs text-gray-400 py-4">Belum ada riwayat.</div>}
                    </div>
                </div>
            </div>

            {/* MODAL ZOOM */}
            {zoomedImage && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in" onClick={() => setZoomedImage(null)}>
                    <button onClick={() => setZoomedImage(null)} className="absolute top-6 right-6 text-white hover:text-gray-300">
                        <X size={32} />
                    </button>

                    <img src={zoomedImage} className="max-w-full max-h-[90vh] object-contain rounded-xl" alt="Zoom" />
                </div>
            )}
        </div>
    );
}
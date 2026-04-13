
import { useState, useMemo } from "react";
import { useParams } from "react-router";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/lib/nexus-client";
import { safeParseArray } from "~/lib/utils";
import { Calculator, Check, Info, Package, Plus, Zap } from "lucide-react";
import { formatCurrency } from "~/constants";

// Interface Definitions (Sesuaikan dengan data dari API)
interface SubComponent {
    id: string;
    commodity_name: string;
    capacity_per_unit: number;
    current_stock: number;
}

interface RawMaterial {
    id: string;
    commodity_name: string;
    category: string;
    unit: string;
    unit_price: number;
    supplier_id: string;
    current_stock: number;
    capacity_per_unit?: number;
    is_package?: number;
    sub_components?: SubComponent[];
    is_affected_side?: number;
}

interface Product {
    id: string;
    name: string;
    code: string;
    product_variants: string; // JSON string from DB
}

interface BottleneckDetail {
    name: string;
    stock: number;
    cap1Sisi: number;
}

interface BottleneckGroup {
    id: string;
    parentName: string;
    unit: string;
    minCap: number;
    details: BottleneckDetail[];
}

export default function CapacityPage() {
    const { category } = useParams();
    // Gunakan state lokal untuk resep HPP sementara
    const [hppRecipes, setHppRecipes] = useState<Record<string, string[]>>({});

    // Fetch Data Material & Product
    const { data: matData } = useFetcherData({ endpoint: nexus().module("SUPPLIER_COMMODITY").action("get").params({ size: 100 }).build() });
    const { data: prodData } = useFetcherData({ endpoint: nexus().module("PRODUCT").action("get").params({ size: 100, searchUniqueName: "card,lanyard" }).build() });

    const materials: RawMaterial[] = useMemo(() =>
        (matData?.data?.items || []).filter((m: any) => m.category === category),
        [matData, category]);

    const products: Product[] = useMemo(() => prodData?.data?.items || [], [prodData]);

    // Logic Analisa Kapasitas (Dari kode asli)
    const analysis = useMemo(() => {
        if (materials.length === 0) return { cap1: 0, cap2: 0, groupedBottlenecks: [] };

        let totalCap1 = 0;
        let totalCap2 = 0;
        const groups: BottleneckGroup[] = [];

        materials.forEach((m: RawMaterial) => {
            const itemDetails: BottleneckDetail[] = [];
            let groupMinCap = Infinity;

            if (m.is_package && safeParseArray(m.sub_components).length > 0) {
                safeParseArray(m.sub_components).forEach((sub: any) => {
                    const yieldVal = Number(sub.capacity_per_unit || 0);
                    const stockVal = Number(sub.current_stock || 0);
                    const c1 = Math.floor(stockVal * yieldVal);

                    // Logic ini bisa disesuaikan jika kapasitas 2 sisi berbeda untuk sub komponen
                    // Disini diasumsikan 2 sisi = 1/2 kapasitas 1 sisi jika affected side true pada parent
                    // const c2 = m.is_affected_side
                    //     ? Math.floor(stockVal * (yieldVal / 2))
                    //     : c1;

                    // totalCap1 += c1; // Total cap mungkin tidak relevan dijumlahkan semua jika paralel
                    // totalCap2 += c2;

                    if (c1 < groupMinCap) groupMinCap = c1;
                    itemDetails.push({ name: sub.commodity_name, stock: stockVal, cap1Sisi: c1 });
                });
            } else {
                const yieldVal = Number(m.capacity_per_unit || 0);
                const stockVal = Number(m.current_stock || 0);
                const c1 = Math.floor(stockVal * yieldVal);
                // const c2 = m.is_affected_side
                //     ? Math.floor(stockVal * (yieldVal / 2))
                //     : c1;

                // totalCap1 += c1;
                // totalCap2 += c2;

                groupMinCap = c1;
                itemDetails.push({ name: "Utama", stock: stockVal, cap1Sisi: c1 });
            }

            // Logic Total Cap Global (Sederhana: Penjumlahan semua potensi)
            // Anda mungkin ingin logika yang lebih kompleks seperti bottleneck terendah dari semua bahan
            if (groupMinCap !== Infinity) {
                totalCap1 += groupMinCap;
                const currentCap2 = m.is_affected_side ? Math.floor(groupMinCap / 2) : groupMinCap;
                totalCap2 += currentCap2;
            }


            groups.push({
                id: m.id,
                parentName: m.commodity_name,
                unit: m.unit,
                minCap: groupMinCap === Infinity ? 0 : groupMinCap,
                details: itemDetails,
            });
        });

        // Sorting bottleneck: yang paling kritis (minCap terkecil) di atas
        groups.sort((a, b) => a.minCap - b.minCap);

        return { cap1: totalCap1, cap2: totalCap2, groupedBottlenecks: groups };
    }, [materials]);


    const toggleHppComponent = (recipeKey: string, matId: string) => {
        const current = hppRecipes[recipeKey] || [];
        let updated;
        if (current.includes(matId)) {
            updated = current.filter((id) => id !== matId);
        } else {
            updated = [...current, matId];
        }
        setHppRecipes({ ...hppRecipes, [recipeKey]: updated });
    };

    const calculateHppForVariation = (recipeKey: string, is2Sisi: boolean) => {
        const selectedIds = hppRecipes[recipeKey] || [];
        return selectedIds.reduce((sum, id) => {
            const m: any = materials.find((x) => x.id === id);
            if (!m) return sum;
            let baseYield = Number(m.capacity_per_unit || 0);
            if (+m.is_package === 1 && safeParseArray(m.sub_components).length > 0) {
                baseYield = Math.min(
                    ...safeParseArray(m.sub_components).map((s: any) =>
                        Number(s.capacity_per_unit || 0)
                    )
                );
            }
            if (baseYield <= 0) return sum;
            const effectiveYield =
                +m.is_affected_side === 1 && is2Sisi ? baseYield / 2 : baseYield;
            return sum + Number(m.unit_price || 0) / effectiveYield;
        }, 0);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Card Potensi Produksi */}
                <div className="bg-gray-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2 opacity-80 tracking-[0.2em]">
                        Potensi Produksi {category}
                    </p>
                    <div className="space-y-4">
                        <div>
                            <div className="text-4xl font-black tracking-tighter">
                                {analysis.cap1.toLocaleString()}{" "}
                                <span className="text-sm font-bold text-gray-500 uppercase">
                                    Pcs Jadi (1 Sisi)
                                </span>
                            </div>
                            <div className="text-2xl font-black tracking-tighter opacity-60 mt-1">
                                {analysis.cap2.toLocaleString()}{" "}
                                <span className="text-xs font-bold text-gray-500 uppercase">
                                    Pcs Jadi (2 Sisi)
                                </span>
                            </div>
                        </div>
                    </div>
                    <Package
                        size={160}
                        className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition duration-500"
                    />
                </div>

                {/* Card Bottleneck */}
                <div className="bg-white rounded-[40px] p-10 border border-gray-200 shadow-sm overflow-hidden">
                    <h4 className="text-sm font-black text-gray-400 uppercase mb-8 flex items-center gap-3 tracking-[0.1em]">
                        <Zap size={22} className="text-blue-600" /> Bottleneck
                        Bahan Baku
                    </h4>
                    <div className="space-y-10 max-h-[600px] overflow-y-auto pr-4 no-scrollbar">
                        {analysis.groupedBottlenecks.map((group) => (
                            <div key={group.id} className="space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                    <span className="text-xs font-black text-gray-800 uppercase tracking-tight">
                                        {group.parentName}
                                    </span>
                                    {group.minCap === 0 && (
                                        <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black">
                                            STOK KOSONG
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-4 pl-4 border-l-2 border-gray-50">
                                    {group.details.map((sub: any, i: number) => {
                                        const isBottleneck =
                                            sub.cap1Sisi === group.minCap &&
                                            group.minCap > 0;
                                        return (
                                            <div key={i} className="space-y-1">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <span
                                                            className={`text-[10px] font-black uppercase ${sub.stock === 0 ? "text-red-500" : isBottleneck ? "text-orange-500" : "text-gray-400"}`}
                                                        >
                                                            {sub.name}
                                                        </span>
                                                        <div className="text-[10px] font-bold text-gray-400">
                                                            Tersisa: {sub.stock.toLocaleString()}{" "}
                                                            {group.unit}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`text-xs font-black ${sub.stock === 0 ? "text-red-600" : "text-gray-600"}`}
                                                    >
                                                        {sub.cap1Sisi.toLocaleString()}{" "}
                                                        <span className="text-[8px]">PCS</span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${sub.stock === 0 ? "bg-red-500" : isBottleneck ? "bg-orange-400" : "bg-blue-400"}`}
                                                        style={{
                                                            width: `${Math.min(100, (sub.cap1Sisi / (analysis.cap1 || 1)) * 100)}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- ESTIMASI HPP VARIABEL SECTION --- */}
            <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden mt-8">
                <div className="p-10 border-b border-gray-100 bg-emerald-50/30 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                            <Calculator size={28} className="text-emerald-600" />{" "}
                            KALKULATOR HPP VARIABEL
                        </h3>
                        <p className="text-xs font-bold text-gray-400 uppercase mt-2">
                            Pilih komponen pendukung untuk menghitung estimasi
                            modal produksi setiap varian produk.
                        </p>
                    </div>
                </div>

                <div className="p-10 grid grid-cols-1 gap-10">
                    <div className="space-y-6">
                        {products.map((prod: Product) => (
                            <div
                                key={prod.id}
                                className="bg-gray-50 rounded-[32px] border border-gray-100 p-6 space-y-4"
                            >
                                <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-200 text-emerald-600 shadow-sm">
                                        <Package size={24} />
                                    </div>
                                    <h4 className="font-black text-gray-800 text-lg uppercase tracking-tight">
                                        {prod.name}
                                    </h4>
                                </div>

                                <div className="space-y-3">
                                    {safeParseArray(prod.product_variants).map(
                                        (vari: any, vIdx: number) => {
                                            const recipeKey = `${prod.id}-${vari.variant_name}`;
                                            const is2Sisi = vari.variant_name
                                                ?.toLowerCase()
                                                .includes("2 sisi");
                                            const estimatedHpp = calculateHppForVariation(
                                                recipeKey,
                                                is2Sisi
                                            );

                                            return (
                                                <div
                                                    key={vIdx}
                                                    className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col gap-4 transition-all hover:border-emerald-200"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">
                                                                Pilih Komponen Bahan:
                                                            </span>
                                                            <h5 className="font-black text-gray-800 text-base">
                                                                {vari.variant_name}
                                                            </h5>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                                                                Estimasi HPP
                                                            </span>
                                                            <div className="text-xl font-black text-emerald-600">
                                                                {formatCurrency(estimatedHpp)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-gray-100 pt-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {materials.map((mat) => {
                                                                const isChecked = (
                                                                    hppRecipes[recipeKey] || []
                                                                ).includes(mat.id);
                                                                return (
                                                                    <button
                                                                        key={mat.id}
                                                                        onClick={() =>
                                                                            toggleHppComponent(
                                                                                recipeKey,
                                                                                mat.id
                                                                            )
                                                                        }
                                                                        className={`px-4 py-2 rounded-full text-[10px] font-black transition flex items-center gap-2 border ${isChecked ? "bg-emerald-600 border-emerald-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-400 hover:border-emerald-200 hover:text-emerald-400"}`}
                                                                    >
                                                                        {isChecked ? (
                                                                            <Check size={12} />
                                                                        ) : (
                                                                            <Plus size={12} />
                                                                        )}
                                                                        {mat.commodity_name?.toUpperCase()}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        ))}
                        {products.length === 0 && (
                            <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200 text-gray-400 font-bold">
                                Belum ada produk yang terdaftar.
                            </div>
                        )}
                    </div>

                    {/* <div className="space-y-6">
                        <div className="bg-gray-900 rounded-[40px] p-8 text-white shadow-2xl sticky top-24">
                            <h4 className="font-black text-emerald-400 text-lg mb-6 flex items-center gap-3">
                                <Info size={20} /> CATATAN PENGHITUNGAN
                            </h4>
                            <div className="space-y-6 text-sm">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold">
                                        1
                                    </div>
                                    <p className="text-gray-300 leading-relaxed">
                                        HPP per pcs dihitung dari <b>Harga Beli</b>{" "}
                                        dibagi <b>Kapasitas Produksi Jadi</b> komponen
                                        yang Anda pilih di checklist.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold">
                                        2
                                    </div>
                                    <p className="text-gray-300 leading-relaxed">
                                        Jika varian produk mengandung kata{" "}
                                        <b>"2 Sisi"</b> dan komponen ditandai{" "}
                                        <b>"Dipengaruhi Sisi Cetak"</b>, modal komponen
                                        akan dikalikan 2 otomatis.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold">
                                        3
                                    </div>
                                    <p className="text-gray-300 leading-relaxed">
                                        Untuk material <b>Paketan</b>, kalkulator
                                        menggunakan kapasitas terkecil dari isi paket
                                        sebagai dasar perhitungan yield.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 pt-10 border-t border-white/10">
                                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
                                    Statistik Bahan Baku
                                </h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                        <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                                            Total Komponen
                                        </span>
                                        <span className="text-2xl font-black">
                                            {materials.length}
                                        </span>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                        <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                                            Total Produk
                                        </span>
                                        <span className="text-2xl font-black">
                                            {products.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
}
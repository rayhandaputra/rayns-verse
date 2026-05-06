import React, { useState, useMemo } from "react";
import { useParams } from "react-router";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/nexus/nexus-client";
import { safeParseArray } from "~/utils/utils";
import { Calculator, Check, Package, Plus, Zap } from "lucide-react";
import { formatCurrency } from "~/constants";
import type { RawMaterial, Product } from "~/types";
// import { RawMaterial, Product } from "~/types";

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

export default function ProcurementCapacityFeature() {
    const { category } = useParams();
    const [hppRecipes, setHppRecipes] = useState<Record<string, string[]>>({});

    const { data: matData } = useFetcherData({ endpoint: nexus().module("SUPPLIER_COMMODITY").action("get").params({ size: 100 }).build() });
    const { data: prodData } = useFetcherData({ endpoint: nexus().module("PRODUCT").action("get").params({ size: 100, searchUniqueName: "card,lanyard" }).build() });

    const materials: RawMaterial[] = useMemo(() =>
        (matData?.data?.items || []).filter((m: any) => m.category === category),
        [matData, category]);

    const products: Product[] = useMemo(() => prodData?.data?.items || [], [prodData]);

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

                    if (c1 < groupMinCap) groupMinCap = c1;
                    itemDetails.push({ name: sub.commodity_name || sub.name, stock: stockVal, cap1Sisi: c1 });
                });
            } else {
                const yieldVal = Number(m.capacity_per_unit || 0);
                const stockVal = Number(m.current_stock || 0);
                const c1 = Math.floor(stockVal * yieldVal);

                groupMinCap = c1;
                itemDetails.push({ name: "Utama", stock: stockVal, cap1Sisi: c1 });
            }

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
                </div>
            </div>
        </div>
    );
}

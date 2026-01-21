// import { useState, useMemo } from "react";
// import { useParams } from "react-router";
// import { useFetcherData } from "~/hooks";
// import { nexus } from "~/lib/nexus-client";
// import { safeParseArray } from "~/lib/utils";
// import { Calculator, Check, Info, Package, Plus, Zap } from "lucide-react";
// import type { RawMaterial } from "./app.procurement.$category";
// import { formatCurrency } from "~/constants";

// export default function CapacityPage() {
//     const { category } = useParams();
//     // Gunakan state lokal untuk resep HPP sementara
//     const [hppRecipes, setHppRecipes] = useState<Record<string, string[]>>({});

//     // Fetch Data Material & Product
//     const { data: matData } = useFetcherData({ endpoint: nexus().module("SUPPLIER_COMMODITY").action("get").params({ size: 100 }).build() });
//     const { data: prodData } = useFetcherData({ endpoint: nexus().module("PRODUCT").action("get").params({ size: 100 }).build() });

//     const materials: RawMaterial[] = useMemo(() =>
//         (matData?.data?.items || []).filter((m: any) => m.category === category),
//         [matData, category]);

//     const products = useMemo(() => prodData?.data?.items || [], [prodData]);

//     // Logic Analisa Kapasitas (Dari kode asli)
//     const analysis = useMemo(() => {
//         if (materials.length === 0) return { cap1: 0, cap2: 0, groupedBottlenecks: [] };

//         let totalCap1 = 0;
//         let totalCap2 = 0;
//         const groups: any[] = [];

//         // ... Logic forEach materials dari kode asli ...
//         // Refactor: Pastikan typesafe

//         return { cap1: totalCap1, cap2: totalCap2, groupedBottlenecks: groups };
//     }, [materials]);

//     const calculateHpp = (recipeKey: string, is2Sisi: boolean) => {
//         // ... Logic calculateHppForVariation dari kode asli ...
//         return 0; // placeholder
//     };

//     const toggleRecipe = (key: string, matId: string) => {
//         setHppRecipes(prev => {
//             const current = prev[key] || [];
//             return {
//                 ...prev,
//                 [key]: current.includes(matId) ? current.filter(id => id !== matId) : [...current, matId]
//             };
//         });
//     };

//     const toggleHppComponent = (recipeKey: string, matId: string) => {
//         const current = state.hppRecipes[recipeKey] || [];
//         let updated;
//         if (current.includes(matId)) {
//             updated = current.filter((id) => id !== matId);
//         } else {
//             updated = [...current, matId];
//         }
//         updateState({
//             hppRecipes: { ...state.hppRecipes, [recipeKey]: updated },
//         });
//     };

//     const calculateHppForVariation = (recipeKey: string, is2Sisi: boolean) => {
//         const selectedIds = state.hppRecipes[recipeKey] || [];
//         return selectedIds.reduce((sum, id) => {
//             const m: any = materials.find((x) => x.id === id);
//             if (!m) return sum;
//             let baseYield = Number(m.capacity_per_unit || 0);
//             if (+m.is_package === 1 && safeParseArray(m.sub_components).length > 0) {
//                 baseYield = Math.min(
//                     ...safeParseArray(m.sub_components).map((s: any) =>
//                         Number(s.capacity_per_unit || 0)
//                     )
//                 );
//             }
//             if (baseYield <= 0) return sum;
//             const effectiveYield =
//                 +m.is_affected_side === 1 && is2Sisi ? baseYield / 2 : baseYield;
//             return sum + Number(m.unit_price || 0) / effectiveYield;
//         }, 0);
//     };

//     return (
//         // <div className="space-y-8 animate-fade-in">
//         //     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         //         {/* Card Kapasitas Total */}
//         //         <div className="bg-gray-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
//         //             <div className="text-4xl font-black">{analysis.cap1.toLocaleString()} <span className="text-sm">Pcs (1 Sisi)</span></div>
//         //             <Package className="absolute -right-10 -bottom-10 opacity-10" size={160} />
//         //         </div>

//         //         {/* Card Bottleneck */}
//         //         <div className="bg-white rounded-[40px] p-10 border border-gray-200">
//         //             <h4 className="text-sm font-black text-gray-400 uppercase mb-8 flex items-center gap-3">
//         //                 <Zap size={22} className="text-blue-600" /> Bottleneck
//         //             </h4>
//         //             {/* Render groupedBottlenecks list */}
//         //         </div>
//         //     </div>

//         //     {/* HPP Simulator */}
//         //     <div className="bg-white rounded-[40px] border border-gray-200 mt-8 overflow-hidden">
//         //         <div className="p-10 bg-emerald-50/30 border-b border-gray-100">
//         //             <h3 className="text-2xl font-black flex items-center gap-3"><Calculator className="text-emerald-600" /> Simulator HPP</h3>
//         //         </div>
//         //         <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
//         //             {/* Render Products & Variants Loop */}
//         //             {products.map((prod: any) => (
//         //                 <div key={prod.id} className="bg-gray-50 rounded-[32px] p-6">
//         //                     <h4>{prod.name}</h4>
//         //                     {/* Render Variants and Toggle Buttons */}
//         //                 </div>
//         //             ))}
//         //         </div>
//         //     </div>
//         // </div>
//         <div className="space-y-8 animate-fade-in">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                 <div className="bg-gray-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
//                     <p className="text-[10px] font-black text-gray-400 uppercase mb-2 opacity-80 tracking-[0.2em]">
//                         Potensi Produksi {category}
//                     </p>
//                     <div className="space-y-4">
//                         <div>
//                             <div className="text-4xl font-black tracking-tighter">
//                                 {analysis.cap1.toLocaleString()}{" "}
//                                 <span className="text-sm font-bold text-gray-500 uppercase">
//                                     Pcs Jadi (1 Sisi)
//                                 </span>
//                             </div>
//                             <div className="text-2xl font-black tracking-tighter opacity-60 mt-1">
//                                 {analysis.cap2.toLocaleString()}{" "}
//                                 <span className="text-xs font-bold text-gray-500 uppercase">
//                                     Pcs Jadi (2 Sisi)
//                                 </span>
//                             </div>
//                         </div>
//                     </div>
//                     <Package
//                         size={160}
//                         className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition duration-500"
//                     />
//                 </div>

//                 <div className="bg-white rounded-[40px] p-10 border border-gray-200 shadow-sm overflow-hidden">
//                     <h4 className="text-sm font-black text-gray-400 uppercase mb-8 flex items-center gap-3 tracking-[0.1em]">
//                         <Zap size={22} className="text-blue-600" /> Bottleneck
//                         Bahan Baku
//                     </h4>
//                     <div className="space-y-10 max-h-[600px] overflow-y-auto pr-4 no-scrollbar">
//                         {analysis.groupedBottlenecks.map((group) => (
//                             <div key={group.id} className="space-y-4">
//                                 <div className="flex justify-between items-center border-b border-gray-50 pb-2">
//                                     <span className="text-xs font-black text-gray-800 uppercase tracking-tight">
//                                         {group.parentName}
//                                     </span>
//                                     {group.minCap === 0 && (
//                                         <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black">
//                                             STOK KOSONG
//                                         </span>
//                                     )}
//                                 </div>
//                                 <div className="space-y-4 pl-4 border-l-2 border-gray-50">
//                                     {group.details.map((sub: any, i: number) => {
//                                         const isBottleneck =
//                                             sub.cap1Sisi === group.minCap &&
//                                             group.minCap > 0;
//                                         return (
//                                             <div key={i} className="space-y-1">
//                                                 <div className="flex justify-between items-end">
//                                                     <div>
//                                                         <span
//                                                             className={`text-[10px] font-black uppercase ${sub.stock === 0 ? "text-red-500" : isBottleneck ? "text-orange-500" : "text-gray-400"}`}
//                                                         >
//                                                             {sub.name}
//                                                         </span>
//                                                         <div className="text-[10px] font-bold text-gray-400">
//                                                             Tersisa: {sub.stock.toLocaleString()}{" "}
//                                                             {group.unit}
//                                                         </div>
//                                                     </div>
//                                                     <div
//                                                         className={`text-xs font-black ${sub.stock === 0 ? "text-red-600" : "text-gray-600"}`}
//                                                     >
//                                                         {sub.cap1Sisi.toLocaleString()}{" "}
//                                                         <span className="text-[8px]">PCS</span>
//                                                     </div>
//                                                 </div>
//                                                 <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
//                                                     <div
//                                                         className={`h-full transition-all duration-1000 ${sub.stock === 0 ? "bg-red-500" : isBottleneck ? "bg-orange-400" : "bg-blue-400"}`}
//                                                         style={{
//                                                             width: `${Math.min(100, (sub.cap1Sisi / (analysis.cap1 || 1)) * 100)}%`,
//                                                         }}
//                                                     ></div>
//                                                 </div>
//                                             </div>
//                                         );
//                                     })}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             {/* --- ESTIMASI HPP VARIABEL SECTION --- */}
//             <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden mt-8">
//                 <div className="p-10 border-b border-gray-100 bg-emerald-50/30 flex justify-between items-center">
//                     <div>
//                         <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
//                             <Calculator size={28} className="text-emerald-600" />{" "}
//                             KALKULATOR HPP VARIABEL
//                         </h3>
//                         <p className="text-xs font-bold text-gray-400 uppercase mt-2">
//                             Pilih komponen pendukung untuk menghitung estimasi
//                             modal produksi setiap varian produk.
//                         </p>
//                     </div>
//                 </div>

//                 <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
//                     <div className="space-y-6">
//                         {products.map((prod: any) => (
//                             <div
//                                 key={prod.id}
//                                 className="bg-gray-50 rounded-[32px] border border-gray-100 p-6 space-y-4"
//                             >
//                                 <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
//                                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-200 text-emerald-600 shadow-sm">
//                                         <Package size={24} />
//                                     </div>
//                                     <h4 className="font-black text-gray-800 text-lg uppercase tracking-tight">
//                                         {prod.name}
//                                     </h4>
//                                 </div>

//                                 <div className="space-y-3">
//                                     {safeParseArray(prod.product_variants).map(
//                                         (vari: any, vIdx) => {
//                                             const recipeKey = `${prod.id}-${vari.variant_name}`;
//                                             const is2Sisi = vari.variant_name
//                                                 ?.toLowerCase()
//                                                 .includes("2 sisi");
//                                             const estimatedHpp = calculateHppForVariation(
//                                                 recipeKey,
//                                                 is2Sisi
//                                             );

//                                             return (
//                                                 <div
//                                                     key={vIdx}
//                                                     className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col gap-4 transition-all hover:border-emerald-200"
//                                                 >
//                                                     <div className="flex justify-between items-start">
//                                                         <div>
//                                                             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">
//                                                                 Pilih Komponen Bahan:
//                                                             </span>
//                                                             <h5 className="font-black text-gray-800 text-base">
//                                                                 {vari.variant_name}
//                                                             </h5>
//                                                         </div>
//                                                         <div className="text-right">
//                                                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
//                                                                 Estimasi HPP
//                                                             </span>
//                                                             <div className="text-xl font-black text-emerald-600">
//                                                                 {formatCurrency(estimatedHpp)}
//                                                             </div>
//                                                         </div>
//                                                     </div>

//                                                     <div className="border-t border-gray-100 pt-4">
//                                                         <div className="flex flex-wrap gap-2">
//                                                             {currentMaterials.map((mat) => {
//                                                                 const isChecked = (
//                                                                     state.hppRecipes[recipeKey] || []
//                                                                 ).includes(mat.id);
//                                                                 return (
//                                                                     <button
//                                                                         key={mat.id}
//                                                                         onClick={() =>
//                                                                             toggleHppComponent(
//                                                                                 recipeKey,
//                                                                                 mat.id
//                                                                             )
//                                                                         }
//                                                                         className={`px-4 py-2 rounded-full text-[10px] font-black transition flex items-center gap-2 border ${isChecked ? "bg-emerald-600 border-emerald-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-400 hover:border-emerald-200 hover:text-emerald-400"}`}
//                                                                     >
//                                                                         {isChecked ? (
//                                                                             <Check size={12} />
//                                                                         ) : (
//                                                                             <Plus size={12} />
//                                                                         )}
//                                                                         {mat.name?.toUpperCase()}
//                                                                     </button>
//                                                                 );
//                                                             })}
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             );
//                                         }
//                                     )}
//                                 </div>
//                             </div>
//                         ))}
//                         {products.length === 0 && (
//                             <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200 text-gray-400 font-bold">
//                                 Belum ada produk yang terdaftar.
//                             </div>
//                         )}
//                     </div>

//                     <div className="space-y-6">
//                         <div className="bg-gray-900 rounded-[40px] p-8 text-white shadow-2xl sticky top-24">
//                             <h4 className="font-black text-emerald-400 text-lg mb-6 flex items-center gap-3">
//                                 <Info size={20} /> CATATAN PENGHITUNGAN
//                             </h4>
//                             <div className="space-y-6 text-sm">
//                                 <div className="flex gap-4">
//                                     <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold">
//                                         1
//                                     </div>
//                                     <p className="text-gray-300 leading-relaxed">
//                                         HPP per pcs dihitung dari <b>Harga Beli</b>{" "}
//                                         dibagi <b>Kapasitas Produksi Jadi</b> komponen
//                                         yang Anda pilih di checklist.
//                                     </p>
//                                 </div>
//                                 <div className="flex gap-4">
//                                     <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold">
//                                         2
//                                     </div>
//                                     <p className="text-gray-300 leading-relaxed">
//                                         Jika varian produk mengandung kata{" "}
//                                         <b>"2 Sisi"</b> dan komponen ditandai{" "}
//                                         <b>"Dipengaruhi Sisi Cetak"</b>, modal komponen
//                                         akan dikalikan 2 otomatis.
//                                     </p>
//                                 </div>
//                                 <div className="flex gap-4">
//                                     <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold">
//                                         3
//                                     </div>
//                                     <p className="text-gray-300 leading-relaxed">
//                                         Untuk material <b>Paketan</b>, kalkulator
//                                         menggunakan kapasitas terkecil dari isi paket
//                                         sebagai dasar perhitungan yield.
//                                     </p>
//                                 </div>
//                             </div>

//                             <div className="mt-10 pt-10 border-t border-white/10">
//                                 <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
//                                     Statistik Bahan Baku
//                                 </h5>
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
//                                         <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">
//                                             Total Komponen
//                                         </span>
//                                         <span className="text-2xl font-black">
//                                             {0}
//                                         </span>
//                                     </div>
//                                     <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
//                                         <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">
//                                             Total Produk
//                                         </span>
//                                         <span className="text-2xl font-black">
//                                             {products.length}
//                                         </span>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
// import { useState, useMemo } from "react";
// import { useParams } from "react-router";
// import { useFetcherData } from "~/hooks";
// import { nexus } from "~/lib/nexus-client";
// import { safeParseArray } from "~/lib/utils";
// import { Calculator, Check, Info, Package, Plus, Zap } from "lucide-react";
// import { formatCurrency } from "~/constants";
// // import type { RawMaterial, Product, SubComponent } from "~/types/inventory";

// export interface SubComponent {
//     id: string;
//     commodity_name: string;
//     current_stock: number;
//     capacity_per_unit: number;
// }

// export interface RawMaterial {
//     id: string;
//     commodity_name: string;
//     category: string;
//     unit: string;
//     unit_price: number;
//     current_stock: number;
//     capacity_per_unit: number; // Kapasitas produksi per 1 unit bahan baku
//     is_package: number; // 0 or 1
//     sub_components: SubComponent[] | string;
//     is_affected_side: number; // 0 or 1
// }

// export interface Product {
//     id: string;
//     name: string;
//     // Struktur product_variants tidak ada di schema DB yang diberikan,
//     // tapi logika HPP butuh varian. Saya asumsikan ada relasi atau JSON field.
//     // Jika tidak ada, kita gunakan 'name' produk saja sebagai varian tunggal.
//     product_variants?: { variant_name: string }[] | string;
// }

// // Definisi Group Bottleneck untuk UI
// interface BottleneckGroup {
//     id: string;
//     parentName: string;
//     unit: string;
//     minCap: number; // Kapasitas produksi minimum (bottleneck)
//     details: {
//         name: string;
//         stock: number;
//         cap1Sisi: number;
//         cap2Sisi: number;
//     }[];
// }

// export default function CapacityPage() {
//     const { category } = useParams();

//     // State lokal untuk checklist resep HPP per varian produk
//     // Key format: "productID-variantName" -> Value: Array of Material IDs
//     const [hppRecipes, setHppRecipes] = useState<Record<string, string[]>>({});

//     // --- DATA FETCHING ---
//     const { data: matData } = useFetcherData({
//         endpoint: nexus().module("SUPPLIER_COMMODITY").action("get").params({ size: 100 }).build()
//     });

//     const { data: prodData } = useFetcherData({
//         endpoint: nexus().module("PRODUCT").action("get").params({ size: 100 }).build()
//     });

//     // --- MEMOS & FILTERS ---
//     const materials: RawMaterial[] = useMemo(() =>
//         (matData?.data?.items || []).filter((m: any) => m.category === category).map((m: any) => ({
//             ...m,
//             sub_components: safeParseArray(m.sub_components)
//         })),
//         [matData, category]);

//     const products: Product[] = useMemo(() => prodData?.data?.items || [], [prodData]);

//     // --- LOGIC 1: ANALISA KAPASITAS TOTAL & BOTTLENECK ---
//     const analysis = useMemo(() => {
//         if (materials.length === 0) return { cap1: 0, cap2: 0, groupedBottlenecks: [] };

//         let totalCap1 = 0; // Total kapasitas 1 sisi (akumulatif semua bahan) - *Hanya indikator kasar*
//         let totalCap2 = 0; // Total kapasitas 2 sisi
//         const groups: BottleneckGroup[] = [];

//         materials.forEach((m) => {
//             const itemDetails: BottleneckGroup['details'] = [];
//             let groupMinCap = Infinity; // Kapasitas terkecil di grup ini (bottleneck lokal)

//             const subComponents = m.sub_components as SubComponent[];

//             // Jika Paket (misal Tinta CMYK), hitung per sub-komponen
//             if (m.is_package === 1 && subComponents.length > 0) {
//                 subComponents.forEach((sub) => {
//                     const yieldVal = Number(sub.capacity_per_unit || 0); // Berapa pcs jadi per 1 unit bahan
//                     const stockVal = Number(sub.current_stock || 0);

//                     // Hitung kapasitas produksi
//                     const c1 = Math.floor(stockVal * yieldVal);
//                     // Jika dipengaruhi sisi cetak, kapasitas 2 sisi = setengahnya
//                     const c2 = m.is_affected_side === 1 ? Math.floor(c1 / 2) : c1;

//                     // Update bottleneck lokal
//                     if (c1 < groupMinCap) groupMinCap = c1;

//                     itemDetails.push({
//                         name: sub.commodity_name,
//                         stock: stockVal,
//                         cap1Sisi: c1,
//                         cap2Sisi: c2
//                     });
//                 });
//             } else {
//                 // Barang Tunggal
//                 const yieldVal = Number(m.capacity_per_unit || 0);
//                 const stockVal = Number(m.current_stock || 0);
//                 const c1 = Math.floor(stockVal * yieldVal);
//                 const c2 = m.is_affected_side === 1 ? Math.floor(c1 / 2) : c1;

//                 groupMinCap = c1;
//                 itemDetails.push({
//                     name: "Utama",
//                     stock: stockVal,
//                     cap1Sisi: c1,
//                     cap2Sisi: c2
//                 });
//             }

//             // Hindari Infinity jika data error
//             if (groupMinCap === Infinity) groupMinCap = 0;

//             // Tambahkan ke total global (Logic ini tergantung bisnis: 
//             // apakah semua bahan dipakai bersamaan untuk 1 produk, atau bahan alternatif?
//             // Disini diasumsikan bahan-bahan ini INDEPENDEN / saling melengkapi untuk produk berbeda, 
//             // jadi kita tidak menjumlahkan kapasitas mereka menjadi satu angka global bottleneck, 
//             // tapi kita bisa menjumlahkan potensi omset produksi).
//             // *Untuk dashboard ini, kita tampilkan total potensi pcs dari bottleneck masing-masing bahan.*
//             totalCap1 += groupMinCap;
//             totalCap2 += (m.is_affected_side === 1 ? Math.floor(groupMinCap / 2) : groupMinCap);

//             groups.push({
//                 id: m.id,
//                 parentName: m.commodity_name,
//                 unit: m.unit,
//                 minCap: groupMinCap,
//                 details: itemDetails,
//             });
//         });

//         // Sort agar bottleneck terparah (kapasitas terkecil) muncul di atas
//         groups.sort((a, b) => a.minCap - b.minCap);

//         return {
//             cap1: totalCap1,
//             cap2: totalCap2,
//             groupedBottlenecks: groups
//         };
//     }, [materials]);

//     // --- LOGIC 2: HPP CALCULATOR ---
//     const toggleHppComponent = (recipeKey: string, matId: string) => {
//         setHppRecipes(prev => {
//             const current = prev[recipeKey] || [];
//             return {
//                 ...prev,
//                 [recipeKey]: current.includes(matId)
//                     ? current.filter(id => id !== matId)
//                     : [...current, matId]
//             };
//         });
//     };

//     const calculateHppForVariation = (recipeKey: string, is2Sisi: boolean) => {
//         const selectedMatIds = hppRecipes[recipeKey] || [];

//         return selectedMatIds.reduce((totalHpp, id) => {
//             const m = materials.find((x) => x.id === id);
//             if (!m) return totalHpp;

//             let baseYield = Number(m.capacity_per_unit || 0);

//             // Jika paket, ambil yield terkecil dari sub-komponen (worst case scenario)
//             // Atau bisa juga rata-rata, tergantung kebijakan. Disini pakai min (konservatif).
//             const subComponents = m.sub_components as SubComponent[];
//             if (m.is_package === 1 && subComponents.length > 0) {
//                 const subYields = subComponents.map(s => Number(s.capacity_per_unit || 0)).filter(y => y > 0);
//                 if (subYields.length > 0) {
//                     baseYield = Math.min(...subYields);
//                 }
//             }

//             if (baseYield <= 0) return totalHpp; // Hindari pembagian nol

//             // Jika produksi 2 sisi dan bahan ini terpengaruh sisi (misal tinta/kertas), yield dibagi 2
//             const effectiveYield = (m.is_affected_side === 1 && is2Sisi)
//                 ? baseYield / 2
//                 : baseYield;

//             // HPP per pcs = Harga Beli Bahan / Yield Efektif
//             const costPerPcs = Number(m.unit_price || 0) / effectiveYield;

//             return totalHpp + costPerPcs;
//         }, 0);
//     };

//     return (
//         <div className="space-y-8 animate-fade-in pb-20">
//             {/* --- SECTION 1: DASHBOARD KAPASITAS --- */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                 {/* Card Potensi Produksi */}
//                 <div className="bg-gray-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group border border-gray-800">
//                     <p className="text-[10px] font-black text-gray-400 uppercase mb-2 opacity-80 tracking-[0.2em]">
//                         Potensi Produksi {category?.replace(/_/g, ' ')}
//                     </p>
//                     <div className="space-y-4 relative z-10">
//                         <div>
//                             <div className="text-5xl font-black tracking-tighter">
//                                 {analysis.cap1.toLocaleString()}
//                                 <span className="text-lg font-bold text-gray-500 uppercase ml-2">Pcs</span>
//                             </div>
//                             <div className="text-xs font-bold text-gray-500 uppercase mt-1 tracking-widest">
//                                 Estimasi 1 Sisi
//                             </div>
//                         </div>
//                         <div className="pt-4 border-t border-gray-800">
//                             <div className="text-3xl font-black tracking-tighter text-gray-400">
//                                 {analysis.cap2.toLocaleString()}
//                                 <span className="text-sm font-bold text-gray-600 uppercase ml-2">Pcs</span>
//                             </div>
//                             <div className="text-xs font-bold text-gray-600 uppercase mt-1 tracking-widest">
//                                 Estimasi 2 Sisi
//                             </div>
//                         </div>
//                     </div>
//                     <Package
//                         size={200}
//                         className="absolute -right-12 -bottom-12 text-gray-800 opacity-20 group-hover:scale-110 transition duration-700 ease-in-out rotate-12"
//                     />
//                 </div>

//                 {/* Card Analisa Bottleneck */}
//                 <div className="bg-white rounded-[40px] p-10 border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
//                     <div className="flex justify-between items-center mb-6">
//                         <h4 className="text-sm font-black text-gray-800 uppercase flex items-center gap-3 tracking-[0.1em]">
//                             <Zap size={20} className="text-amber-500 fill-amber-500" /> Analisa Stok & Bottleneck
//                         </h4>
//                         <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
//                             {analysis.groupedBottlenecks.length} Bahan Baku
//                         </span>
//                     </div>

//                     <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
//                         {analysis.groupedBottlenecks.map((group) => (
//                             <div key={group.id} className="space-y-3">
//                                 <div className="flex justify-between items-center">
//                                     <span className="text-xs font-black text-gray-700 uppercase tracking-tight">
//                                         {group.parentName}
//                                     </span>
//                                     {group.minCap === 0 && (
//                                         <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-md font-bold animate-pulse">
//                                             STOK HABIS
//                                         </span>
//                                     )}
//                                 </div>

//                                 <div className="space-y-3 pl-3 border-l-2 border-dashed border-gray-100">
//                                     {group.details.map((sub, i) => {
//                                         const isBottleneck = sub.cap1Sisi === group.minCap && group.minCap > 0;
//                                         const percentage = Math.min(100, (sub.cap1Sisi / (analysis.cap1 || 1)) * 100);

//                                         return (
//                                             <div key={i} className="group/item">
//                                                 <div className="flex justify-between items-end mb-1">
//                                                     <div>
//                                                         <div className={`text-[10px] font-bold uppercase mb-0.5 ${sub.stock === 0 ? "text-red-500" : "text-gray-500"}`}>
//                                                             {sub.name}
//                                                         </div>
//                                                         <div className="text-[10px] text-gray-400">
//                                                             Sisa: <span className="font-mono font-bold text-gray-600">{sub.stock.toLocaleString()}</span> {group.unit}
//                                                         </div>
//                                                     </div>
//                                                     <div className={`text-right ${isBottleneck ? "text-amber-600" : "text-gray-600"}`}>
//                                                         <div className="text-sm font-black tabular-nums">
//                                                             {sub.cap1Sisi.toLocaleString()}
//                                                         </div>
//                                                         <div className="text-[8px] font-bold uppercase opacity-60">Kapasitas Pcs</div>
//                                                     </div>
//                                                 </div>

//                                                 {/* Progress Bar Visualisasi Stok */}
//                                                 <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
//                                                     <div
//                                                         className={`h-full transition-all duration-1000 ${sub.stock === 0 ? "bg-red-500" :
//                                                             isBottleneck ? "bg-amber-400" : "bg-emerald-400"
//                                                             }`}
//                                                         style={{ width: `${percentage}%` }}
//                                                     />
//                                                 </div>
//                                             </div>
//                                         );
//                                     })}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             {/* --- SECTION 2: SIMULATOR HPP --- */}
//             <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
//                 <div className="p-10 border-b border-gray-100 bg-emerald-50/30 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
//                     <div>
//                         <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
//                             <Calculator size={28} className="text-emerald-600" />
//                             SIMULATOR HPP
//                         </h3>
//                         <p className="text-sm text-gray-500 mt-2 max-w-xl leading-relaxed">
//                             Pilih komponen bahan baku untuk menghitung estimasi
//                             modal produksi (HPP) per varian produk secara dinamis.
//                         </p>
//                     </div>
//                     <div className="hidden md:block">
//                         <div className="bg-white px-6 py-3 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
//                             <div className="text-right">
//                                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Produk</div>
//                                 <div className="text-xl font-black text-emerald-600">{products.length} Item</div>
//                             </div>
//                             <div className="h-8 w-px bg-gray-100"></div>
//                             <div className="text-right">
//                                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Bahan</div>
//                                 <div className="text-xl font-black text-gray-800">{materials.length} Item</div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="p-10 grid grid-cols-1 xl:grid-cols-2 gap-10 bg-gray-50/30">
//                     <div className="space-y-8">
//                         {products.map((prod) => {
//                             // Parsing Variants. Jika tidak ada di DB, buat default variant 'Standard'
//                             const variants = safeParseArray(prod.product_variants);
//                             const productVariants = variants.length > 0
//                                 ? variants
//                                 : [{ variant_name: "Standard" }];

//                             return (
//                                 <div key={prod.id} className="bg-white rounded-[32px] border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
//                                     <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-6">
//                                         <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 text-emerald-600 shadow-inner">
//                                             <Package size={28} />
//                                         </div>
//                                         <div>
//                                             <h4 className="font-black text-gray-800 text-xl uppercase tracking-tight leading-none">
//                                                 {prod.name}
//                                             </h4>
//                                             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 block">
//                                                 {prod.code || "NO-CODE"}
//                                             </span>
//                                         </div>
//                                     </div>

//                                     <div className="space-y-4">
//                                         {productVariants.map((vari: any, vIdx: number) => {
//                                             const recipeKey = `${prod.id}-${vari.variant_name}`;
//                                             const is2Sisi = vari.variant_name?.toLowerCase().includes("2 sisi");
//                                             const estimatedHpp = calculateHppForVariation(recipeKey, is2Sisi);

//                                             return (
//                                                 <div key={vIdx} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex flex-col gap-4">
//                                                     <div className="flex justify-between items-start">
//                                                         <div>
//                                                             <div className="flex items-center gap-2 mb-1">
//                                                                 <h5 className="font-black text-gray-800 text-base">
//                                                                     {vari.variant_name}
//                                                                 </h5>
//                                                                 {is2Sisi && (
//                                                                     <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md uppercase">
//                                                                         2 Sisi
//                                                                     </span>
//                                                                 )}
//                                                             </div>
//                                                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
//                                                                 Pilih Komponen:
//                                                             </span>
//                                                         </div>
//                                                         <div className="text-right bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
//                                                             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">
//                                                                 Estimasi HPP
//                                                             </span>
//                                                             <div className="text-lg font-black text-emerald-600">
//                                                                 {formatCurrency(estimatedHpp)}
//                                                             </div>
//                                                         </div>
//                                                     </div>

//                                                     {/* Material Selection Grid */}
//                                                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
//                                                         {materials.map((mat) => {
//                                                             // const isChecked = (state.hppRecipes[recipeKey] || []).includes(mat.id);
//                                                             const isChecked = (hppRecipes[recipeKey] || []).includes(mat.id);
//                                                             return (
//                                                                 <button
//                                                                     key={mat.id}
//                                                                     onClick={() => toggleHppComponent(recipeKey, mat.id)}
//                                                                     className={`
//                                                                         px-3 py-2 rounded-xl text-[10px] font-bold transition-all duration-200 flex items-center justify-between gap-2 border text-left
//                                                                         ${isChecked
//                                                                             ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200 transform scale-[1.02]"
//                                                                             : "bg-white border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
//                                                                         }
//                                                                     `}
//                                                                 >
//                                                                     <span className="truncate w-full">{mat.commodity_name}</span>
//                                                                     {isChecked ? <Check size={12} className="flex-shrink-0" /> : <Plus size={12} className="flex-shrink-0 opacity-50" />}
//                                                                 </button>
//                                                             );
//                                                         })}
//                                                     </div>
//                                                 </div>
//                                             );
//                                         })}
//                                     </div>
//                                 </div>
//                             );
//                         })}

//                         {products.length === 0 && (
//                             <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-200">
//                                 <Package className="mx-auto text-gray-200 mb-4" size={48} />
//                                 <p className="text-gray-400 font-bold">Belum ada data produk.</p>
//                             </div>
//                         )}
//                     </div>

//                     {/* --- INFO SIDEBAR --- */}
//                     <div className="space-y-6">
//                         <div className="bg-gray-900 rounded-[40px] p-8 text-white shadow-xl sticky top-24 border border-gray-800">
//                             <h4 className="font-black text-emerald-400 text-lg mb-8 flex items-center gap-3 tracking-wide">
//                                 <Info size={22} /> LOGIKA PENGHITUNGAN
//                             </h4>
//                             <div className="space-y-8 relative">
//                                 {/* Garis timeline */}
//                                 <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-800"></div>

//                                 <div className="relative pl-12">
//                                     <div className="absolute left-0 top-0 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 text-emerald-400 font-black text-sm z-10">1</div>
//                                     <h6 className="font-bold text-white text-sm mb-1">Rumus Dasar HPP</h6>
//                                     <p className="text-xs text-gray-400 leading-relaxed">
//                                         Harga Beli Bahan ÷ Kapasitas Produksi per Unit Bahan.
//                                         <br />Contoh: Tinta 100rb, kapasitas 1000 pcs = HPP 100 rupiah.
//                                     </p>
//                                 </div>

//                                 <div className="relative pl-12">
//                                     <div className="absolute left-0 top-0 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 text-emerald-400 font-black text-sm z-10">2</div>
//                                     <h6 className="font-bold text-white text-sm mb-1">Produk 2 Sisi</h6>
//                                     <p className="text-xs text-gray-400 leading-relaxed">
//                                         Jika varian mengandung kata <b>"2 Sisi"</b> dan bahan ditandai <b>"Dipengaruhi Sisi Cetak"</b>, maka biaya bahan tersebut dikalikan 2.
//                                     </p>
//                                 </div>

//                                 <div className="relative pl-12">
//                                     <div className="absolute left-0 top-0 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 text-emerald-400 font-black text-sm z-10">3</div>
//                                     <h6 className="font-bold text-white text-sm mb-1">Bahan Paketan</h6>
//                                     <p className="text-xs text-gray-400 leading-relaxed">
//                                         Untuk bahan tipe paket (misal: Set Tinta CMYK), sistem mengambil <b>kapasitas terkecil</b> dari isi paket sebagai pembagi untuk perhitungan yield paling konservatif.
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
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
    const { data: prodData } = useFetcherData({ endpoint: nexus().module("PRODUCT").action("get").params({ size: 100 }).build() });

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

                <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
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

                    <div className="space-y-6">
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
                    </div>
                </div>
            </div>
        </div>
    );
}
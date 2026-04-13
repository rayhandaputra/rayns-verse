// import React, { useState, useMemo } from "react";
// import type { StockState, RawMaterial } from "../types";
// import {
//   formatCurrency,
//   mlPerPaket,
//   ROLL_CM,
//   CM_PER_LANYARD,
//   A4_PER_PAKET,
//   LANYARD_PER_ROLL,
//   TAPE_CM_PER_ROLL,
//   RIVET_PER_PAKET,
//   PLASTIC_SMALL_CAP,
//   PLASTIC_MED_CAP,
//   PLASTIC_BIG_CAP,
//   INITIAL_SHOPS,
// } from "../constants";
// import {
//   Calculator,
//   Store,
//   Settings,
//   Plus,
//   RefreshCw,
//   Trash2,
//   Edit2,
//   Check,
//   X,
//   Save,
// } from "lucide-react";
import AsyncReactSelect from "react-select/async";

import { Store, Settings, Plus, Edit2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { CapacityTable } from "~/components/CapacityTable";
import { useStockLogic } from "~/hooks/useStockLogic";
import { API } from "~/lib/api";
import { formatCurrency } from "~/constants";
import { safeParseArray } from "~/lib/utils";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/lib/nexus-client";

// const StockPage = () => {
//   const {
//     stock = {},
//     // materials = [],
//     onUpdateMaterials = () => {},
//     onRestock = () => {},
//   } = {};

//   const { data: stockData, reload } = useFetcherData({
//     endpoint: nexus()
//       .module("COMMODITY_STOCK")
//       .action("get")
//       .params({ size: 100, pagination: "false" })
//       .build(),
//   });

//   const materials = stockData?.data?.items || [];

//   const loadOptionSupplier = async (search: string) => {
//     try {
//       const result = await API.SUPPLIER.get({
//         req: {
//           query: {
//             search: search || undefined,
//             page: 0,
//             size: 50,
//             pagination: "true",
//           },
//         },
//       });

//       return (result?.items || []).map((v: any) => ({
//         ...v,
//         value: v?.id,
//         label: `${v?.name}`,
//       }));
//     } catch (error) {
//       console.log(error);
//       return [];
//     }
//   };

//   // -- States for Materials Management --
//   const [showAddMaterial, setShowAddMaterial] = useState(false);
//   const [newMatForm, setNewMatForm] = useState<Partial<RawMaterial>>({
//     unit: "pcs",
//     category: "Lainnya",
//   });
//   const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(
//     null
//   );

//   // -- States for Multi Restock --
//   const [selectedShop, setSelectedShop] = useState<string>("");
//   const [restockInputs, setRestockInputs] = useState<Record<string, number>>(
//     {}
//   );
//   const [shippingCost, setShippingCost] = useState<string>("");
//   const [discount, setDiscount] = useState<string>("");

//   // -- Calculation: Capacity --
//   const metrics = useMemo(() => {
//     const s = stock;

//     // Capacity (Paket)
//     const cap_tinta =
//       s.tinta_ml > 0 ? Math.floor(s.tinta_ml / mlPerPaket()) : 0;
//     const cap_roll = Math.floor(
//       (s.roll_100m || 0) * Math.floor(ROLL_CM / CM_PER_LANYARD)
//     );
//     const cap_a4 = Math.floor((s.a4_sheets || 0) * (1 / A4_PER_PAKET));
//     const cap_tape = Math.floor(
//       (s.tape_roll || 0) * Math.floor(TAPE_CM_PER_ROLL / 38.75)
//     );
//     const cap_lan = Math.floor(
//       (s.lanyard_roll || 0) * LANYARD_PER_ROLL + (s.lanyard_pcs || 0)
//     );
//     const cap_pvc = s.pvc_pcs || 0;
//     const cap_case = s.case_pcs || 0;
//     const cap_kait = s.kait_pcs || 0;
//     const cap_stop = s.stopper_pcs || 0;
//     const cap_rivet = Math.floor((s.rivet_pcs || 0) / RIVET_PER_PAKET);
//     const cap_plast =
//       (s.plastic_small_pcs || 0) * PLASTIC_SMALL_CAP +
//       (s.plastic_med_pcs || 0) * PLASTIC_MED_CAP +
//       (s.plastic_big_pcs || 0) * PLASTIC_BIG_CAP;

//     const allCaps = [
//       { name: "Tinta (ml)", val: cap_tinta, unit: "ml", stock: s.tinta_ml },
//       { name: "Kertas Roll", val: cap_roll, unit: "roll", stock: s.roll_100m },
//       { name: "Kertas A4", val: cap_a4, unit: "lembar", stock: s.a4_sheets },
//       { name: "Solasi", val: cap_tape, unit: "roll", stock: s.tape_roll },
//       {
//         name: "Lanyard",
//         val: cap_lan,
//         unit: "pcs",
//         stock: (s.lanyard_roll || 0) * LANYARD_PER_ROLL + (s.lanyard_pcs || 0),
//       },
//       { name: "PVC", val: cap_pvc, unit: "pcs", stock: s.pvc_pcs },
//       { name: "Case", val: cap_case, unit: "pcs", stock: s.case_pcs },
//       { name: "Kait", val: cap_kait, unit: "pcs", stock: s.kait_pcs },
//       { name: "Stopper", val: cap_stop, unit: "pcs", stock: s.stopper_pcs },
//       { name: "Rivet", val: cap_rivet, unit: "pcs", stock: s.rivet_pcs },
//       { name: "Plastik", val: cap_plast, unit: "pack", stock: "Mix" },
//     ];

//     const maxPackage = Math.min(...allCaps.map((c) => c.val));
//     return { allCaps, maxPackage };
//   }, [stock]);

//   // -- Format Helper --
//   const formatNumber = (num: number | string | undefined) => {
//     if (num === undefined || num === null || num === "") return "";
//     return num
//       .toString()
//       .replace(/\D/g, "")
//       .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
//   };

//   const parseNumber = (str: string) => {
//     return Number(str.replace(/\./g, "")) || 0;
//   };

//   // -- Material Actions --
//   const handleAddMaterial = () => {
//     if (!newMatForm.name || !newMatForm.pricePerUnit || !newMatForm.stockKey) {
//       alert("Lengkapi data bahan baku");
//       return;
//     }
//     const newMat: RawMaterial = {
//       id: "mat-" + Date.now(),
//       name: newMatForm.name!,
//       unit: newMatForm.unit || "pcs",
//       pricePerUnit: Number(newMatForm.pricePerUnit),
//       shopId: newMatForm.shopId || "Umum",
//       category: newMatForm.category || "Lainnya",
//       stockKey: newMatForm.stockKey!,
//     };
//     onUpdateMaterials([...materials, newMat]);
//     setShowAddMaterial(false);
//     setNewMatForm({ unit: "pcs", category: "Lainnya" });
//   };

//   const handleEditMaterial = () => {
//     if (!editingMaterial || !editingMaterial.name) return;

//     const updatedMaterials = materials.map((m) =>
//       m.id === editingMaterial.id ? editingMaterial : m
//     );
//     onUpdateMaterials(updatedMaterials);
//     setEditingMaterial(null);
//   };

//   const handleDeleteMaterial = (id: string) => {
//     if (confirm("Hapus bahan baku ini?")) {
//       onUpdateMaterials(materials.filter((m) => m.id !== id));
//     }
//   };

//   // -- Restock Logic --
//   const calculateItemsCost = () => {
//     let total = 0;
//     Object.entries(restockInputs).forEach(([matId, val]) => {
//       const qty = val as number;
//       const mat = materials.find((m) => m.id === matId);
//       if (mat) {
//         total += qty * mat.pricePerUnit;
//       }
//     });
//     return total;
//   };

//   const calculateGrandTotal = () => {
//     const itemsCost = calculateItemsCost();
//     const ship = parseNumber(shippingCost);
//     const disc = parseNumber(discount);
//     return Math.max(0, itemsCost - disc + ship);
//   };

//   const handleExecuteRestock = () => {
//     const newStock = { ...stock };
//     let itemNames: string[] = [];
//     const hasItems = Object.values(restockInputs).some((v: number) => v > 0);

//     if (!hasItems) {
//       alert("Masukkan jumlah barang terlebih dahulu.");
//       return;
//     }

//     Object.entries(restockInputs).forEach(([matId, val]) => {
//       const qty = val as number;
//       if (qty > 0) {
//         const mat = materials.find((m) => m.id === matId);
//         if (mat) {
//           // Conversion Logic
//           let addAmount = qty;
//           if (mat.stockKey === "tinta_ml" && mat.unit === "set")
//             addAmount = qty * 4000;
//           if (mat.stockKey.includes("plastic") && mat.unit === "pack")
//             addAmount = qty * 500;
//           if (mat.unit === "pack" && mat.stockKey === "pvc_pcs")
//             addAmount = qty * 250;
//           if (mat.unit === "pack" && mat.stockKey === "case_pcs")
//             addAmount = qty * 100;
//           if (mat.unit === "pack" && mat.stockKey === "kait_pcs")
//             addAmount = qty * 500;
//           if (mat.unit === "pack" && mat.stockKey === "stopper_pcs")
//             addAmount = qty * 120;
//           if (mat.unit === "pack" && mat.stockKey === "rivet_pcs")
//             addAmount = qty * 2000;

//           newStock[mat.stockKey] = (newStock[mat.stockKey] || 0) + addAmount;
//           itemNames.push(`${mat.name} (x${qty})`);
//         }
//       }
//     });

//     const grandTotal = calculateGrandTotal();
//     const shopName =
//       INITIAL_SHOPS[selectedShop as keyof typeof INITIAL_SHOPS] ||
//       selectedShop ||
//       "Toko";
//     const desc = `Restock ${shopName}: ${itemNames.join(", ")}`;

//     onRestock(newStock, grandTotal, desc);

//     // Reset Form
//     setRestockInputs({});
//     setShippingCost("");
//     setDiscount("");
//     alert(
//       `Restock berhasil! Pengeluaran Rp ${grandTotal.toLocaleString("id-ID")} dicatat.`
//     );
//   };

//   const filteredMaterials = useMemo(() => {
//     if (!selectedShop) return [];
//     return materials.filter((m) => m.shopId === selectedShop);
//   }, [materials, selectedShop]);

//   return (
//     <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full items-start">
//       {/* LEFT COLUMN: CAPACITY & CALCULATIONS */}
//       <div className="space-y-6">
//         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
//           <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
//             <Calculator size={20} /> Kalkulasi Stok
//           </h2>

//           <div className="border border-gray-100 rounded-lg overflow-hidden">
//             <table className="w-full text-sm">
//               <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
//                 <tr>
//                   <th className="px-4 py-3 text-left">Komponen</th>
//                   <th className="px-4 py-3 text-right">Stok Fisik</th>
//                   <th className="px-4 py-3 text-right">Konversi Paket</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100">
//                 {metrics.allCaps.map((c, i) => (
//                   <tr
//                     key={i}
//                     className={`hover:bg-gray-50 ${c.val === metrics.maxPackage ? "bg-red-50/50" : ""}`}
//                   >
//                     <td className="px-4 py-3 text-gray-700 font-medium">
//                       {c.name}
//                     </td>
//                     <td className="px-4 py-3 text-right text-gray-500">
//                       {typeof c.stock === "number"
//                         ? Number(c.stock).toLocaleString("id-ID")
//                         : c.stock}
//                     </td>
//                     <td className="px-4 py-3 text-right font-bold text-gray-900">
//                       {c.val}{" "}
//                       <span className="text-xs font-normal text-gray-400">
//                         pkt
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex items-center gap-2">
//             <RefreshCw size={16} />
//             <span>
//               Produksi Maksimal Saat Ini: <b>{metrics.maxPackage} Paket</b>
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* RIGHT COLUMN: MANAGEMENT */}
//       <div className="space-y-6">
//         {/* Section 1: Restock with Cost */}
//         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
//           <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2">
//             <Store size={18} /> Restock Bahan Baru
//           </h3>

//           {/* Shop Selector */}
//           <div className="mb-4">
//             <label className="block text-xs font-bold text-gray-600 mb-1">
//               Pilih Toko Supplier
//             </label>
//             {/* <select
//               className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-gray-50"
//               value={selectedShop}
//               onChange={(e) => setSelectedShop(e.target.value)}
//             >
//               <option value="">-- Pilih Toko --</option>
//               {Object.entries(INITIAL_SHOPS).map(([code, name]) => (
//                 <option key={code} value={code}>
//                   {name}
//                 </option>
//               ))}
//             </select> */}
//             <AsyncReactSelect
//               value={
//                 selectedShop
//                   ? {
//                       value: selectedShop,
//                       label: selectedShop,
//                     }
//                   : null
//               }
//               loadOptions={loadOptionSupplier}
//               defaultOptions
//               placeholder="Cari dan Pilih Toko..."
//               onChange={(val: any) => {
//                 setSelectedShop(val.value);
//               }}
//               isClearable
//               styles={{
//                 control: (base) => ({
//                   ...base,
//                   minHeight: "38px",
//                   fontSize: "0.875rem",
//                 }),
//               }}
//             />
//           </div>

//           {selectedShop ? (
//             <>
//               <div className="space-y-3 mb-4 max-h-60 overflow-y-auto border rounded-lg p-2 bg-gray-50">
//                 {filteredMaterials.length === 0 ? (
//                   <p className="text-center text-gray-400 text-xs py-4">
//                     Tidak ada item terdaftar untuk toko ini.
//                   </p>
//                 ) : (
//                   filteredMaterials.map((mat) => (
//                     <div
//                       key={mat.id}
//                       className="flex items-center justify-between text-sm border-b border-gray-200 last:border-0 pb-2 mb-2 last:mb-0"
//                     >
//                       <div className="flex-1">
//                         <div className="font-medium text-gray-800">
//                           {mat.name}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           {formatCurrency(mat.pricePerUnit)} / {mat.unit}
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <input
//                           type="text"
//                           inputMode="numeric"
//                           className="w-20 text-right border border-gray-300 rounded-md text-sm p-1.5 focus:ring-blue-500 focus:outline-none"
//                           placeholder="0"
//                           value={
//                             restockInputs[mat.id]
//                               ? formatNumber(restockInputs[mat.id])
//                               : ""
//                           }
//                           onChange={(e) => {
//                             const val = parseNumber(e.target.value);
//                             setRestockInputs({
//                               ...restockInputs,
//                               [mat.id]: val,
//                             });
//                           }}
//                         />
//                         <span className="text-xs text-gray-500 w-8">
//                           {mat.unit}
//                         </span>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>

//               <div className="grid grid-cols-2 gap-4 mb-4">
//                 <div>
//                   <label className="block text-xs text-gray-600 mb-1">
//                     Diskon (Rp)
//                   </label>
//                   <input
//                     type="text"
//                     inputMode="numeric"
//                     className="w-full border border-gray-300 rounded-lg p-2 text-sm"
//                     placeholder="0"
//                     value={formatNumber(discount)}
//                     onChange={(e) =>
//                       setDiscount(e.target.value.replace(/\./g, ""))
//                     }
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs text-gray-600 mb-1">
//                     Ongkir (Rp)
//                   </label>
//                   <input
//                     type="text"
//                     inputMode="numeric"
//                     className="w-full border border-gray-300 rounded-lg p-2 text-sm"
//                     placeholder="0"
//                     value={formatNumber(shippingCost)}
//                     onChange={(e) =>
//                       setShippingCost(e.target.value.replace(/\./g, ""))
//                     }
//                   />
//                 </div>
//               </div>

//               <div className="bg-gray-900 text-white p-4 rounded-lg flex justify-between items-center mb-4">
//                 <span className="text-sm font-bold">Total Pengeluaran:</span>
//                 <span className="text-lg font-bold">
//                   {formatCurrency(calculateGrandTotal())}
//                 </span>
//               </div>

//               <button
//                 onClick={handleExecuteRestock}
//                 disabled={filteredMaterials.length === 0}
//                 className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 transition disabled:opacity-50"
//               >
//                 <Plus size={16} /> Proses & Catat Keuangan
//               </button>
//             </>
//           ) : (
//             <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
//               Silakan pilih toko untuk mulai restock.
//             </div>
//           )}
//         </div>

//         {/* Section 2: Manage Materials */}
//         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="text-sm font-bold text-gray-800 uppercase flex items-center gap-2">
//               <Settings size={18} /> Data Bahan Baku
//             </h3>
//             <button
//               onClick={() => setShowAddMaterial(!showAddMaterial)}
//               className="text-blue-600 text-xs font-bold hover:underline"
//             >
//               {showAddMaterial ? "Batal" : "+ Item Baru"}
//             </button>
//           </div>

//           {showAddMaterial && (
//             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 animate-fade-in">
//               <div className="grid grid-cols-2 gap-3 mb-3">
//                 <input
//                   placeholder="Nama Item"
//                   className="text-sm border p-2 rounded col-span-2"
//                   value={newMatForm.name || ""}
//                   onChange={(e) =>
//                     setNewMatForm({ ...newMatForm, name: e.target.value })
//                   }
//                 />
//                 <input
//                   placeholder="Satuan (e.g. roll, pack)"
//                   className="text-sm border p-2 rounded"
//                   value={newMatForm.unit || ""}
//                   onChange={(e) =>
//                     setNewMatForm({ ...newMatForm, unit: e.target.value })
//                   }
//                 />
//                 <input
//                   type="text"
//                   inputMode="numeric"
//                   placeholder="Harga Beli Satuan"
//                   className="text-sm border p-2 rounded"
//                   value={formatNumber(newMatForm.pricePerUnit)}
//                   onChange={(e) =>
//                     setNewMatForm({
//                       ...newMatForm,
//                       pricePerUnit: parseNumber(e.target.value),
//                     })
//                   }
//                 />
//                 <select
//                   className="text-sm border p-2 rounded"
//                   value={newMatForm.shopId || ""}
//                   onChange={(e) =>
//                     setNewMatForm({ ...newMatForm, shopId: e.target.value })
//                   }
//                 >
//                   <option value="">Pilih Toko...</option>
//                   {Object.entries(INITIAL_SHOPS).map(([code, name]) => (
//                     <option key={code} value={code}>
//                       {name}
//                     </option>
//                   ))}
//                 </select>
//                 <select
//                   className="text-sm border p-2 rounded"
//                   value={newMatForm.stockKey}
//                   onChange={(e) =>
//                     setNewMatForm({ ...newMatForm, stockKey: e.target.value })
//                   }
//                 >
//                   <option value="">Link ke Stok Fisik...</option>
//                   <option value="tinta_ml">Tinta</option>
//                   <option value="roll_100m">Kertas Roll</option>
//                   <option value="a4_sheets">Kertas A4</option>
//                   <option value="tape_roll">Solasi</option>
//                   <option value="lanyard_pcs">Lanyard</option>
//                   <option value="pvc_pcs">PVC</option>
//                   <option value="case_pcs">Case</option>
//                   <option value="kait_pcs">Kait</option>
//                   <option value="stopper_pcs">Stopper</option>
//                   <option value="rivet_pcs">Rivet</option>
//                   <option value="plastic_med_pcs">Plastik</option>
//                 </select>
//               </div>
//               <button
//                 onClick={handleAddMaterial}
//                 className="w-full bg-blue-600 text-white py-2 rounded text-sm font-bold"
//               >
//                 Simpan Item
//               </button>
//             </div>
//           )}

//           <div className="space-y-2 max-h-60 overflow-y-auto">
//             {materials.map((mat) => (
//               <div
//                 key={mat.id}
//                 className="flex justify-between items-center text-xs p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 group"
//               >
//                 <div>
//                   <span className="font-bold block">{mat.name}</span>
//                   <div className="text-gray-500 flex gap-2">
//                     <span>
//                       {formatCurrency(mat.base_price)}/{mat.unit}
//                     </span>
//                     <div className="flex gap-1">
//                       {/* {INITIAL_SHOPS[
//                         mat.shopId as keyof typeof INITIAL_SHOPS
//                       ] || mat.shopId} */}
//                       {safeParseArray(mat.supplier_commodities)?.map((item) => (
//                         <span
//                           className="bg-gray-100 px-1 rounded text-[10px]"
//                           key={item.id}
//                         >
//                           {item.supplier_name}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
//                   <button
//                     onClick={() => setEditingMaterial(mat)}
//                     className="text-blue-500 hover:bg-blue-50 p-1 rounded"
//                   >
//                     <Edit2 size={14} />
//                   </button>
//                   <button
//                     onClick={() => handleDeleteMaterial(mat.id)}
//                     className="text-red-500 hover:bg-red-50 p-1 rounded"
//                   >
//                     <Trash2 size={14} />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Edit Material Modal */}
//       {editingMaterial && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
//           <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
//             <h3 className="text-lg font-bold mb-4">Edit Bahan Baku</h3>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-xs font-bold text-gray-600 mb-1">
//                   Nama Item
//                 </label>
//                 <input
//                   className="w-full border border-gray-300 rounded-lg p-2 text-sm"
//                   value={editingMaterial.name}
//                   onChange={(e) =>
//                     setEditingMaterial({
//                       ...editingMaterial,
//                       name: e.target.value,
//                     })
//                   }
//                 />
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-xs font-bold text-gray-600 mb-1">
//                     Harga Satuan
//                   </label>
//                   <input
//                     type="text"
//                     inputMode="numeric"
//                     className="w-full border border-gray-300 rounded-lg p-2 text-sm"
//                     value={formatNumber(editingMaterial.pricePerUnit)}
//                     onChange={(e) =>
//                       setEditingMaterial({
//                         ...editingMaterial,
//                         pricePerUnit: parseNumber(e.target.value),
//                       })
//                     }
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-bold text-gray-600 mb-1">
//                     Satuan
//                   </label>
//                   <input
//                     className="w-full border border-gray-300 rounded-lg p-2 text-sm"
//                     value={editingMaterial.unit}
//                     onChange={(e) =>
//                       setEditingMaterial({
//                         ...editingMaterial,
//                         unit: e.target.value,
//                       })
//                     }
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-xs font-bold text-gray-600 mb-1">
//                   Toko Supplier
//                 </label>
//                 <select
//                   className="w-full border border-gray-300 rounded-lg p-2 text-sm"
//                   value={editingMaterial.shopId}
//                   onChange={(e) =>
//                     setEditingMaterial({
//                       ...editingMaterial,
//                       shopId: e.target.value,
//                     })
//                   }
//                 >
//                   {Object.entries(INITIAL_SHOPS).map(([code, name]) => (
//                     <option key={code} value={code}>
//                       {name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div className="flex gap-2 pt-2">
//                 <button
//                   onClick={() => setEditingMaterial(null)}
//                   className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold"
//                 >
//                   Batal
//                 </button>
//                 <button
//                   onClick={handleEditMaterial}
//                   className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold"
//                 >
//                   Simpan
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StockPage;

export default function StockPage() {
  const { metrics, materials, reloadStock } = useStockLogic();
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [restockInputs, setRestockInputs] = useState<Record<string, number>>(
    {}
  );

  const { data: componentsRes, reload: reloadComponents } = useFetcherData({
    endpoint: nexus()
      .module("COMPONENTS")
      .action("get")
      .params({ pagination: "false" })
      .build(),
  });

  const [shippingCost, setShippingCost] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");

  // States for Materials Management
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] =
    useState<any>(null);
  const [newMatForm, setNewMatForm] = useState<any>({
    name: "",
    unit: "pcs",
    base_price: 0,
    category: "Lainnya",
    supplier_id: null,
    stock_key: "",
  });
  const [selectedSupplierForNew, setSelectedSupplierForNew] =
    useState<any>(null);

  // Format Helper
  const formatNumber = (num: number | string | undefined) => {
    if (num === undefined || num === null || num === "") return "";
    return num
      .toString()
      .replace(/\D/g, "")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumber = (str: string) => {
    return Number(str.replace(/\./g, "")) || 0;
  };

  // Calculate costs
  const calculateItemsCost = () => {
    let total = 0;
    Object.entries(restockInputs).forEach(([matId, qty]) => {
      const mat = materials.find((m: any) => m.id === Number(matId));
      if (mat) {
        total += qty * mat.base_price;
      }
    });
    return total;
  };

  const calculateGrandTotal = () => {
    const itemsCost = calculateItemsCost();
    const ship = parseNumber(shippingCost);
    const disc = parseNumber(discount);
    return Math.max(0, itemsCost - disc + ship);
  };

  // Execute Restock
  const handleExecuteRestock = async () => {
    const hasItems = Object.values(restockInputs).some((v) => v > 0);

    if (!hasItems) {
      alert("Masukkan jumlah barang terlebih dahulu.");
      return;
    }

    const payload = Object.entries(restockInputs)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const mat = materials.find((m: any) => m.id === Number(id));
        return {
          commodity_id: mat.id,
          qty: qty,
          total_price: qty * mat.base_price,
        };
      });

    try {
      await API.RESTOCK.create(payload);
      reloadStock();
      setRestockInputs({});
      setShippingCost("");
      setDiscount("");
      alert(
        `Restock berhasil! Pengeluaran Rp ${calculateGrandTotal().toLocaleString("id-ID")} dicatat.`
      );
    } catch (e) {
      alert("Gagal melakukan restock");
    }
  };

  const loadOptionSupplier = async (search: string) => {
    try {
      const result = await API.SUPPLIER.get({
        req: {
          query: {
            search: search || undefined,
            page: 0,
            size: 50,
            pagination: "true",
          },
        },
      });

      return (result?.items || []).map((v: any) => ({
        ...v,
        value: v?.id,
        label: `${v?.name}`,
      }));
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  // Filter materials by selected supplier
  const filteredMaterials = materials.filter((m: any) => {
    if (!selectedShop) return false;
    return (
      m.supplier_id === selectedShop?.value ||
      m.supplier_id === selectedShop?.id
    );
  });

  // Material CRUD Actions
  const handleAddMaterial = async () => {
    if (!newMatForm.name || !newMatForm.base_price) {
      alert("Lengkapi nama dan harga bahan baku");
      return;
    }

    if (!selectedSupplierForNew) {
      alert("Pilih supplier/toko terlebih dahulu");
      return;
    }

    try {
      await API.COMMODITY.create({
        req: {
          body: {
            name: newMatForm.name,
            unit: newMatForm.unit || "pcs",
            base_price: parseNumber(newMatForm.base_price.toString()),
            category: newMatForm.category || "Lainnya",
            supplier_id: selectedSupplierForNew.value,
            stock_key: newMatForm.stock_key || null,
          },
        },
      });
      reloadStock();
      setShowAddMaterial(false);
      setNewMatForm({
        name: "",
        unit: "pcs",
        base_price: 0,
        category: "Lainnya",
        supplier_id: null,
        stock_key: "",
      });
      setSelectedSupplierForNew(null);
      alert("Bahan baku berhasil ditambahkan!");
    } catch (e) {
      alert("Gagal menambahkan bahan baku");
    }
  };

  const handleEditMaterial = async () => {
    if (!editingMaterial || !editingMaterial.name) return;

    try {
      const updateBody: any = {
        name: editingMaterial.name,
        unit: editingMaterial.unit,
        base_price: parseNumber(editingMaterial.base_price.toString()),
        category: editingMaterial.category,
      };

      // Only update supplier_id if changed
      if (selectedSupplierForEdit) {
        updateBody.supplier_id = selectedSupplierForEdit.value;
      }

      // Only update stock_key if exists
      if (editingMaterial.stock_key !== undefined) {
        updateBody.stock_key = editingMaterial.stock_key;
      }

      await API.COMMODITY.update({
        req: {
          params: { id: editingMaterial.id },
          body: updateBody,
        },
      });
      reloadStock();
      setEditingMaterial(null);
      setSelectedSupplierForEdit(null);
      alert("Bahan baku berhasil diperbarui!");
    } catch (e) {
      alert("Gagal memperbarui bahan baku");
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!confirm("Hapus bahan baku ini?")) return;

    try {
      // Menggunakan update untuk soft delete atau status inactive
      await API.COMMODITY.update({
        req: {
          params: { id },
          body: {
            status: "inactive", // atau field lain yang sesuai dengan backend
          },
        },
      });
      reloadStock();
      alert("Bahan baku berhasil dihapus!");
    } catch (e) {
      console.error("Error deleting:", e);
      alert("Gagal menghapus bahan baku");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-6">
      {/* LEFT COLUMN: CAPACITY TABLE */}
      <CapacityTable
        allCaps={metrics.allCaps}
        maxPackage={metrics.maxPackage}
      />

      {/* RIGHT COLUMN: RESTOCK FORM */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2">
            <Store size={18} /> Restock Bahan Baru
          </h3>

          {/* Shop Selector */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Pilih Toko Supplier
            </label>
            <AsyncReactSelect
              value={selectedShop}
              loadOptions={loadOptionSupplier}
              defaultOptions
              placeholder="Cari dan Pilih Toko..."
              onChange={(val: any) => {
                setSelectedShop(val);
              }}
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "38px",
                  fontSize: "0.875rem",
                }),
              }}
            />
          </div>

          {selectedShop ? (
            <>
              {/* Materials List */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                {filteredMaterials.length === 0 ? (
                  <p className="text-center text-gray-400 text-xs py-4">
                    Tidak ada item terdaftar untuk toko ini.
                  </p>
                ) : (
                  filteredMaterials.map((mat: any) => (
                    <div
                      key={mat.id}
                      className="flex items-center justify-between text-sm border-b border-gray-200 last:border-0 pb-2 mb-2 last:mb-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {mat.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(mat.base_price)} / {mat.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          className="w-20 text-right border border-gray-300 rounded-md text-sm p-1.5 focus:ring-blue-500 focus:outline-none"
                          placeholder="0"
                          value={
                            restockInputs[mat.id]
                              ? formatNumber(restockInputs[mat.id])
                              : ""
                          }
                          onChange={(e) => {
                            const val = parseNumber(e.target.value);
                            setRestockInputs({
                              ...restockInputs,
                              [mat.id]: val,
                            });
                          }}
                        />
                        <span className="text-xs text-gray-500 w-8">
                          {mat.unit}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Discount & Shipping */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Diskon (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    placeholder="0"
                    value={formatNumber(discount)}
                    onChange={(e) =>
                      setDiscount(e.target.value.replace(/\./g, ""))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Ongkir (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    placeholder="0"
                    value={formatNumber(shippingCost)}
                    onChange={(e) =>
                      setShippingCost(e.target.value.replace(/\./g, ""))
                    }
                  />
                </div>
              </div>

              {/* Total Cost */}
              <div className="bg-gray-900 text-white p-4 rounded-lg flex justify-between items-center mb-4">
                <span className="text-sm font-bold">Total Pengeluaran:</span>
                <span className="text-lg font-bold">
                  {formatCurrency(calculateGrandTotal())}
                </span>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleExecuteRestock}
                disabled={filteredMaterials.length === 0}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proses & Catat Keuangan
              </button>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              Silakan pilih toko untuk mulai restock.
            </div>
          )}
        </div>

        {/* Section 2: Manage Materials */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase flex items-center gap-2">
              <Settings size={18} /> Data Bahan Baku
            </h3>
            <button
              onClick={() => setShowAddMaterial(!showAddMaterial)}
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              {showAddMaterial ? "Batal" : "+ Item Baru"}
            </button>
          </div>

          {/* Add Material Form */}
          {showAddMaterial && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 animate-fade-in">
              <div className="space-y-3 mb-3">
                <input
                  placeholder="Nama Item"
                  className="text-sm border p-2 rounded w-full"
                  value={newMatForm.name || ""}
                  onChange={(e) =>
                    setNewMatForm({ ...newMatForm, name: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Satuan (e.g. roll, pack)"
                    className="text-sm border p-2 rounded"
                    value={newMatForm.unit || ""}
                    onChange={(e) =>
                      setNewMatForm({ ...newMatForm, unit: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Harga Beli Satuan"
                    className="text-sm border p-2 rounded"
                    value={formatNumber(newMatForm.base_price)}
                    onChange={(e) =>
                      setNewMatForm({
                        ...newMatForm,
                        base_price: parseNumber(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Supplier Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Pilih Toko Supplier
                  </label>
                  <AsyncReactSelect
                    value={selectedSupplierForNew}
                    loadOptions={loadOptionSupplier}
                    defaultOptions
                    placeholder="Cari dan Pilih Toko..."
                    onChange={(val: any) => {
                      setSelectedSupplierForNew(val);
                    }}
                    isClearable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: "38px",
                        fontSize: "0.875rem",
                      }),
                    }}
                  />
                </div>

                {/* Stock Key Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Link ke Komponen Stok (Optional)
                  </label>
                  <select
                    className="w-full text-sm border border-gray-300 p-2 rounded bg-white"
                    value={newMatForm.stock_key || ""}
                    onChange={(e) =>
                      setNewMatForm({
                        ...newMatForm,
                        stock_key: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Tidak Link --</option>
                    {componentsRes?.data?.items?.map((component: any) => (
                      <option key={component.id} value={component.id}>
                        {component.name} ({component.unit})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddMaterial}
                className="w-full bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700 transition"
              >
                Simpan Item
              </button>
            </div>
          )}

          {/* Materials List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {materials.map((mat: any) => (
              <div
                key={mat.id}
                className="flex justify-between items-center text-xs p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 group"
              >
                <div>
                  <span className="font-bold block">{mat.name}</span>
                  <div className="text-gray-500 flex gap-2">
                    <span>
                      {formatCurrency(mat.base_price)}/{mat.unit}
                    </span>
                    <div className="flex gap-1">
                      {safeParseArray(mat.supplier_commodities)?.map(
                        (item: any) => (
                          <span
                            className="bg-gray-100 px-1 rounded text-[10px]"
                            key={item.id}
                          >
                            {item.supplier_name}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => setEditingMaterial(mat)}
                    className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteMaterial(mat.id)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Material Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Bahan Baku</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Nama Item
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={editingMaterial.name}
                  onChange={(e) =>
                    setEditingMaterial({
                      ...editingMaterial,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Harga Satuan
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    value={formatNumber(editingMaterial.base_price)}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        base_price: parseNumber(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Satuan
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    value={editingMaterial.unit}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        unit: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Supplier Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Toko Supplier
                </label>
                <AsyncReactSelect
                  value={selectedSupplierForEdit}
                  loadOptions={loadOptionSupplier}
                  defaultOptions
                  placeholder={
                    editingMaterial.supplier_commodities?.[0]?.supplier_name ||
                    "Pilih Supplier..."
                  }
                  onChange={(val: any) => {
                    setSelectedSupplierForEdit(val);
                  }}
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "38px",
                      fontSize: "0.875rem",
                    }),
                  }}
                />
              </div>

              {/* Stock Key Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Link ke Komponen Stok (Optional)
                </label>
                <select
                  className="w-full text-sm border border-gray-300 p-2 rounded-lg bg-white"
                  value={editingMaterial.stock_key || ""}
                  onChange={(e) =>
                    setEditingMaterial({
                      ...editingMaterial,
                      stock_key: e.target.value,
                    })
                  }
                >
                  <option value="">-- Tidak Link --</option>
                  {componentsRes?.data?.items?.map((component: any) => (
                    <option key={component.id} value={component.id}>
                      {component.name} ({component.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setEditingMaterial(null);
                    setSelectedSupplierForEdit(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditMaterial}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

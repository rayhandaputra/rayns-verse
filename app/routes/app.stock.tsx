import React, { useState, useMemo, useEffect } from "react";
import type { StockState, PriceList, ShopList } from "../types";
import {
  formatCurrency,
  mlPerPaket,
  unitAdd,
  SHOP_ITEMS_CONFIG,
  ROLL_CM,
  CM_PER_LANYARD,
  A4_PER_PAKET,
  LANYARD_PER_ROLL,
  TAPE_CM_PER_ROLL,
  RIVET_PER_PAKET,
  PLASTIC_SMALL_CAP,
  PLASTIC_MED_CAP,
  PLASTIC_BIG_CAP,
  INITIAL_STOCK,
  INITIAL_PRICES,
  INITIAL_SHOPS,
} from "../constants";
import {
  Calculator,
  Store,
  Settings,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
} from "lucide-react";
import { type LoaderFunction, type ActionFunction } from "react-router";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/lib/nexus-client";
import { safeParseArray } from "~/lib/utils";
import AsyncReactSelect from "react-select/async";
import { useQueryParams } from "~/hooks/use-query-params";

// Mapping specific commodity codes to StockState keys if needed
// Or we assume the "code" in DB matches the keys in StockState
const STOCK_KEYS = Object.keys(INITIAL_STOCK);

export const loader: LoaderFunction = async ({ request }) => {
  // Only check authentication
  await requireAuth(request);
  return Response.json({ initialized: true });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "restock") {
    const rawData = formData.get("data");
    if (typeof rawData !== "string") return Response.json({ success: false });

    const updates = JSON.parse(rawData); // Array of { key, qty, id }

    // Use first supplier as default
    const suppliersRes = await API.SUPPLIER.get({
      session: { user, token },
      req: { query: { size: 1 } },
    });

    const supplier_id = suppliersRes.items?.[0]?.id || "1";

    const promises = updates.map(async (u: any) => {
      if (!u.id) return; // Need commodity ID

      // Calculate actual unit quantity to add based on logic unless 'isDirect'
      let qtyToAdd = Number(u.qty);
      if (!u.isDirect) {
        qtyToAdd = unitAdd(u.key, qtyToAdd);
      }

      return API.COMMODITY_STOCK.restock({
        session: { user, token },
        req: { body: { supplier_id, commodity_id: u.id, qty: qtyToAdd } },
      });
    });

    try {
      await Promise.all(promises);
      return Response.json({
        success: true,
        message: "Stok berhasil ditambahkan",
      });
    } catch (e: any) {
      return Response.json({ success: false, message: e.message });
    }
  }

  return Response.json({ success: true });
};

export default function StockPage() {
  const query = useQueryParams();

  // Fetch stock data
  const { data: stockData, reload } = useFetcherData({
    endpoint: nexus()
      .module("COMMODITY_STOCK")
      .action("get")
      .params({ size: 100, pagination: "false" })
      .build(),
  });

  // Fetch suppliers
  const { data: suppliersData } = useFetcherData({
    endpoint: nexus()
      .module("SUPPLIER")
      .action("get")
      .params({ size: 100 })
      .build(),
  });

  // Fetch supplier commodities for prices
  const { data: supplierCommodityData } = useFetcherData({
    endpoint: nexus()
      .module("SUPPLIER_COMMODITY")
      .action("get")
      .params({ size: 1000, pagination: "false" })
      .build(),
  });

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

  // Map to StockState
  // const { stock, commodityMap } = useMemo(() => {
  //   const stockResult: StockState = { ...INITIAL_STOCK };
  //   const mapResult: Record<string, string> = {};

  //   if (stockData?.data?.items) {
  //     stockData.data.items.forEach((item: any) => {
  //       if (STOCK_KEYS.includes(item.code)) {
  //         stockResult[item.code as keyof StockState] = Number(item.stock || 0);
  //         mapResult[item.code] = item.id;
  //       }
  //     });
  //   }

  //   return { stock: stockResult, commodityMap: mapResult };
  // }, [stockData]);

  // Map prices from supplier_commodities
  // const initialPrices = useMemo(() => {
  //   const pricesResult: PriceList = { ...INITIAL_PRICES };

  //   if (supplierCommodityData?.data?.items && stockData?.data?.items) {
  //     const priceMap: Record<string, number> = {};

  //     stockData.data.items.forEach((commodity: any) => {
  //       const supplierPrices = supplierCommodityData.data.items.filter(
  //         (sc: any) => sc.commodity_id === commodity.id
  //       );

  //       if (supplierPrices.length > 0) {
  //         const avgPrice =
  //           supplierPrices.reduce(
  //             (sum: number, sc: any) => sum + Number(sc.price || 0),
  //             0
  //           ) / supplierPrices.length;
  //         priceMap[commodity.code] = avgPrice;
  //       }
  //     });

  //     Object.keys(INITIAL_PRICES).forEach((key) => {
  //       if (priceMap[key]) {
  //         pricesResult[key] = priceMap[key];
  //       }
  //     });
  //   }

  //   return pricesResult;
  // }, [supplierCommodityData, stockData]);

  // Map shops from suppliers
  // const initialShops = useMemo(() => {
  //   const shopsResult: ShopList = { ...INITIAL_SHOPS };

  //   if (suppliersData?.data?.items) {
  //     suppliersData.data.items.forEach((supplier: any, index: number) => {
  //       const code = String.fromCharCode(65 + index);
  //       if (code.charCodeAt(0) <= 90) {
  //         shopsResult[code] = supplier.name;
  //       }
  //     });
  //   }

  //   return shopsResult;
  // }, [suppliersData]);

  // Fetcher for actions
  const { data: actionData, load: submitAction } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  // Local state for prices and shops
  // const [prices, setPrices] = useState<PriceList>(initialPrices);
  const [shops, setShops] = useState<ShopList>();
  // const [shops, setShops] = useState<ShopList>(initialShops);

  // Update when data changes
  // useEffect(() => {
  //   setPrices(initialPrices);
  // }, [initialPrices]);

  // useEffect(() => {
  //   setShops(initialShops);
  // }, [initialShops]);

  // -- States for Multi Restock --
  const [restockShop, setRestockShop] = useState("");
  const [restockInputs, setRestockInputs] = useState<Record<string, number>>(
    {}
  );
  const [shippingCost, setShippingCost] = useState("");
  const [discount, setDiscount] = useState("");

  // -- States for Manual Stock --

  // -- States for Materials Management --
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [newMatForm, setNewMatForm] = useState<any>({
    unit: "pcs",
    category: "Lainnya",
  });
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);

  // -- Format Helper --
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

  // -- Calculation: Capacity --
  // const metrics = useMemo(() => {
  //   const s = stock;

  //   // Capacity (Paket)
  //   const cap_tinta =
  //     s.tinta_ml > 0 ? Math.floor(s.tinta_ml / mlPerPaket()) : 0;
  //   const cap_roll = Math.floor(
  //     (s.roll_100m || 0) * Math.floor(ROLL_CM / CM_PER_LANYARD)
  //   );
  //   const cap_a4 = Math.floor((s.a4_sheets || 0) * (1 / A4_PER_PAKET));
  //   const cap_tape = Math.floor(
  //     (s.tape_roll || 0) * Math.floor(TAPE_CM_PER_ROLL / 38.75)
  //   );
  //   const cap_lan = Math.floor(
  //     (s.lanyard_roll || 0) * LANYARD_PER_ROLL + (s.lanyard_pcs || 0)
  //   );
  //   const cap_pvc = s.pvc_pcs || 0;
  //   const cap_case = s.case_pcs || 0;
  //   const cap_kait = s.kait_pcs || 0;
  //   const cap_stop = s.stopper_pcs || 0;
  //   const cap_rivet = Math.floor((s.rivet_pcs || 0) / RIVET_PER_PAKET);
  //   const cap_plast =
  //     (s.plastic_small_pcs || 0) * PLASTIC_SMALL_CAP +
  //     (s.plastic_med_pcs || 0) * PLASTIC_MED_CAP +
  //     (s.plastic_big_pcs || 0) * PLASTIC_BIG_CAP;

  //   const allCaps = [
  //     { name: "Tinta (ml)", val: cap_tinta, unit: "ml", stock: s.tinta_ml },
  //     { name: "Kertas Roll", val: cap_roll, unit: "roll", stock: s.roll_100m },
  //     { name: "Kertas A4", val: cap_a4, unit: "lembar", stock: s.a4_sheets },
  //     { name: "Solasi", val: cap_tape, unit: "roll", stock: s.tape_roll },
  //     {
  //       name: "Lanyard",
  //       val: cap_lan,
  //       unit: "pcs",
  //       stock: (s.lanyard_roll || 0) * LANYARD_PER_ROLL + (s.lanyard_pcs || 0),
  //     },
  //     { name: "PVC", val: cap_pvc, unit: "pcs", stock: s.pvc_pcs },
  //     { name: "Case", val: cap_case, unit: "pcs", stock: s.case_pcs },
  //     { name: "Kait", val: cap_kait, unit: "pcs", stock: s.kait_pcs },
  //     { name: "Stopper", val: cap_stop, unit: "pcs", stock: s.stopper_pcs },
  //     { name: "Rivet", val: cap_rivet, unit: "pcs", stock: s.rivet_pcs },
  //     { name: "Plastik", val: cap_plast, unit: "pack", stock: "Mix" },
  //   ];

  //   const maxPackage = Math.min(...allCaps.map((c) => c.val));
  //   return { allCaps, maxPackage };
  // }, [stock]);

  // -- Calculate filtered materials based on selected shop --
  const filteredMaterials = useMemo(() => {
    if (!restockShop) return [];
    return SHOP_ITEMS_CONFIG[restockShop] || [];
  }, [restockShop]);

  // -- Calculate items cost --
  // const calculateItemsCost = () => {
  //   let total = 0;
  //   Object.entries(restockInputs).forEach(([key, qty]) => {
  //     const item = SHOP_ITEMS_CONFIG[restockShop]?.find(it => it.k === key);
  //     if (item && prices[key]) {
  //       total += qty * (prices[key] || 0);
  //     }
  //   });
  //   return total;
  // };

  // const calculateGrandTotal = () => {
  //   const itemsCost = calculateItemsCost();
  //   const ship = parseNumber(shippingCost);
  //   const disc = parseNumber(discount);
  //   return Math.max(0, itemsCost - disc + ship);
  // };

  // -- Material Actions --
  const handleAddMaterial = () => {
    if (!newMatForm.name || !newMatForm.pricePerUnit || !newMatForm.stockKey) {
      toast.error("Lengkapi data bahan baku");
      return;
    }
    const newMat = {
      id: "mat-" + Date.now(),
      name: newMatForm.name,
      unit: newMatForm.unit || "pcs",
      pricePerUnit: Number(newMatForm.pricePerUnit),
      shopId: newMatForm.shopId || "Umum",
      category: newMatForm.category || "Lainnya",
      stockKey: newMatForm.stockKey,
    };
    setMaterials([...materials, newMat]);
    setShowAddMaterial(false);
    setNewMatForm({ unit: "pcs", category: "Lainnya" });
    toast.success("Material berhasil ditambahkan");
  };

  const handleEditMaterial = () => {
    if (!editingMaterial || !editingMaterial.name) return;

    const updatedMaterials = materials.map((m) =>
      m.id === editingMaterial.id ? editingMaterial : m
    );
    setMaterials(updatedMaterials);
    setEditingMaterial(null);
    toast.success("Material berhasil diupdate");
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm("Hapus bahan baku ini?")) {
      setMaterials(materials.filter((m) => m.id !== id));
      toast.success("Material berhasil dihapus");
    }
  };

  // -- Handlers --

  const handleMultiRestock = () => {
    const items = SHOP_ITEMS_CONFIG[restockShop];
    if (!items) return;

    const hasItems = Object.values(restockInputs).some((v: number) => v > 0);
    if (!hasItems) {
      toast.error("Masukkan jumlah barang terlebih dahulu.");
      return;
    }

    const updates: any[] = [];

    items.forEach((it) => {
      const qty = restockInputs[it.k] || 0;
      if (qty > 0) {
        let targetKey = it.k;
        if (["tinta_cL", "tinta_mL", "tinta_yL", "tinta_kL"].includes(it.k)) {
          targetKey = "tinta_ml";
        }

        const id = commodityMap[targetKey];
        if (id) {
          updates.push({ key: it.k, qty, id });
        }
      }
    });

    if (updates.length > 0) {
      submitAction({ actionType: "restock", data: JSON.stringify(updates) });

      // Reset form
      setRestockInputs({});
      setShippingCost("");
      setDiscount("");
    } else {
      toast.error("Item tidak ditemukan di database atau qty 0");
    }
  };

  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Berhasil");
      reload();
    } else if (actionData?.success === false) {
      toast.error(actionData.message || "Gagal");
    }
  }, [actionData]);

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full items-start">
        {/* LEFT COLUMN: CAPACITY & CALCULATIONS */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calculator size={20} /> Kalkulasi Stok
            </h2>

            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Komponen</th>
                    <th className="px-4 py-3 text-right">Stok Fisik</th>
                    <th className="px-4 py-3 text-right">Konversi Paket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stockData?.data?.items.map((c, i) => (
                    <tr
                      key={i}
                      // className={`hover:bg-gray-50 ${c.val === metrics.maxPackage ? 'bg-red-50/50' : ''}`}
                      className={`hover:bg-gray-50`}
                    >
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {typeof c.stock === "number"
                          ? Number(c.stock).toLocaleString("id-ID")
                          : c.stock || "0"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {c.val || 0}{" "}
                        <span className="text-xs font-normal text-gray-400">
                          pkt
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex items-center gap-2">
              <RefreshCw size={16} />
              {/* <span>Produksi Maksimal Saat Ini: <b>{metrics.maxPackage} Paket</b></span> */}
              <span>
                Produksi Maksimal Saat Ini: <b>0 Paket</b>
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MANAGEMENT */}
        <div className="space-y-6">
          {/* Section 1: Restock with Cost */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2">
              <Store size={18} /> Restock Bahan Baru
            </h3>

            {/* Shop Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Pilih Toko Supplier
              </label>
              {/* <select
                className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-gray-50"
                value={restockShop}
                onChange={(e) => setRestockShop(e.target.value)}
              >
                <option value="">-- Pilih Toko --</option>
                {Object.entries(shops).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select> */}
              <AsyncReactSelect
                value={
                  // kknArchiveProductId
                  //   ? {
                  //       value: kknArchiveProductId,
                  //       label:
                  //         kknArchiveProductData?.name ||
                  //         products.find((p) => p.id === kknArchiveProductId)
                  //           ?.name ||
                  //         "Produk",
                  //     }
                  //   :
                  null
                }
                loadOptions={loadOptionSupplier}
                defaultOptions
                placeholder="Cari dan Pilih Toko..."
                onChange={(val: any) => {
                  // if (val) {
                  //   setKknArchiveProductId(val.value);
                  //   setKknArchiveProductData(val);
                  // } else {
                  //   setKknArchiveProductId("");
                  //   setKknArchiveProductData(null);
                  // }
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

            {/* {restockShop ? ( */}
            <>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                {(stockData?.data?.items || [])?.filter(
                  (v: any, i: number) => i <= 5
                )?.length === 0 ? (
                  <p className="text-center text-gray-400 text-xs py-4">
                    Tidak ada item terdaftar untuk toko ini.
                  </p>
                ) : (
                  (stockData?.data?.items || [])
                    ?.filter((v: any, i: number) => i <= 5)
                    ?.map((item) => (
                      <div
                        key={item.k}
                        className="flex items-center justify-between text-sm border-b border-gray-200 last:border-0 pb-2 mb-2 last:mb-0"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {/* {formatCurrency(prices[item.k] || 0)} / unit */}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            className="w-20 text-right border border-gray-300 rounded-md text-sm p-1.5 focus:ring-blue-500 focus:outline-none"
                            placeholder="0"
                            value={
                              restockInputs[item.k]
                                ? formatNumber(restockInputs[item.k])
                                : ""
                            }
                            onChange={(e) => {
                              const val = parseNumber(e.target.value);
                              setRestockInputs({
                                ...restockInputs,
                                [item.k]: val,
                              });
                            }}
                          />
                          <span className="text-xs text-gray-500 w-8">
                            unit
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>

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

              <div className="bg-gray-900 text-white p-4 rounded-lg flex justify-between items-center mb-4">
                <span className="text-sm font-bold">Total Pengeluaran:</span>
                <span className="text-lg font-bold">
                  {/* {formatCurrency(calculateGrandTotal())} */}0
                </span>
              </div>

              <button
                onClick={handleMultiRestock}
                disabled={filteredMaterials.length === 0}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Plus size={16} /> Proses & Catat Keuangan
              </button>
            </>
            {/* ) : (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                Silakan pilih toko untuk mulai restock.
              </div>
            )} */}
          </div>

          {/* Section 3: Manage Materials */}
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

            {showAddMaterial && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    placeholder="Nama Item"
                    className="text-sm border p-2 rounded col-span-2"
                    value={newMatForm.name || ""}
                    onChange={(e) =>
                      setNewMatForm({ ...newMatForm, name: e.target.value })
                    }
                  />
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
                    value={formatNumber(newMatForm.pricePerUnit)}
                    onChange={(e) =>
                      setNewMatForm({
                        ...newMatForm,
                        pricePerUnit: parseNumber(e.target.value),
                      })
                    }
                  />

                  <AsyncReactSelect
                    value={
                      // kknArchiveProductId
                      //   ? {
                      //       value: kknArchiveProductId,
                      //       label:
                      //         kknArchiveProductData?.name ||
                      //         products.find((p) => p.id === kknArchiveProductId)
                      //           ?.name ||
                      //         "Produk",
                      //     }
                      //   :
                      null
                    }
                    loadOptions={loadOptionSupplier}
                    defaultOptions
                    placeholder="Cari dan Pilih Toko..."
                    onChange={(val: any) => {
                      // if (val) {
                      //   setKknArchiveProductId(val.value);
                      //   setKknArchiveProductData(val);
                      // } else {
                      //   setKknArchiveProductId("");
                      //   setKknArchiveProductData(null);
                      // }
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
                  <select
                    className="text-sm border p-2 rounded"
                    value={newMatForm.shopId || ""}
                    onChange={(e) =>
                      setNewMatForm({ ...newMatForm, shopId: e.target.value })
                    }
                  >
                    <option value="">Link ke Stok Fisik...</option>
                    {stockData?.data?.items.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  {/* <select
                    className="text-sm border p-2 rounded"
                    value={newMatForm.stockKey}
                    onChange={(e) =>
                      setNewMatForm({ ...newMatForm, stockKey: e.target.value })
                    }
                  >
                    <option value="">Link ke Stok Fisik...</option>
                  </select> */}
                </div>
                <button
                  onClick={handleAddMaterial}
                  className="w-full bg-blue-600 text-white py-2 rounded text-sm font-bold"
                >
                  Simpan Item
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stockData?.data?.items?.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-4">
                  Belum ada bahan baku terdaftar
                </p>
              ) : (
                stockData?.data?.items?.map((mat) => (
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
                        <span className="bg-gray-100 px-1 rounded text-[10px]">
                          <ul>
                            {safeParseArray(mat.supplier_commodities).map(
                              (sc, i) => (
                                <li key={i}>{sc.supplier_name}</li>
                              )
                            )}
                          </ul>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 transition">
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Material Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
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
                    value={formatNumber(editingMaterial.pricePerUnit)}
                    onChange={(e) =>
                      setEditingMaterial({
                        ...editingMaterial,
                        pricePerUnit: parseNumber(e.target.value),
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
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Toko Supplier
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  value={editingMaterial.shopId}
                  onChange={(e) =>
                    setEditingMaterial({
                      ...editingMaterial,
                      shopId: e.target.value,
                    })
                  }
                >
                  {Object.entries(INITIAL_SHOPS).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditingMaterial(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditMaterial}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

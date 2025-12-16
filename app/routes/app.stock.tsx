import React, { useState, useMemo, useEffect } from "react";
import type { StockState, PriceList, ShopList } from "../types";
import {
  formatCurrency,
  parseCurrency,
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
  AlertTriangle,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  useLoaderData,
  useFetcher,
  type LoaderFunction,
  type ActionFunction,
  // json,
} from "react-router";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";

// Mapping specific commodity codes to StockState keys if needed
// Or we assume the "code" in DB matches the keys in StockState
const STOCK_KEYS = Object.keys(INITIAL_STOCK);

export const loader: LoaderFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);

  // 1. Fetch Commodities (Stock)
  const stockRes = await API.COMMODITY_STOCK.get({
    session: { user, token },
    req: { query: { size: 100, pagination: "false" } },
  });

  // 2. Fetch Suppliers
  const suppliersRes = await API.SUPPLIER.get({
    session: { user, token },
    req: { query: { size: 100 } },
  });

  // 3. Fetch Supplier Commodities (for prices)
  const supplierCommodityRes = await API.SUPPLIER_COMMODITY.get({
    session: { user, token },
    req: { query: { size: 1000, pagination: "false" } },
  });

  // 4. Map to StockState
  const stock: StockState = { ...INITIAL_STOCK }; // Start with default to ensure all keys exist

  // Create a map for ID lookups (key -> id) for the UI to submit correct IDs
  const commodityMap: Record<string, string> = {};

  if (stockRes.items) {
    stockRes.items.forEach((item: any) => {
      // Match item.code to our internal keys
      if (STOCK_KEYS.includes(item.code)) {
        stock[item.code as keyof StockState] = Number(item.stock || 0);
        commodityMap[item.code] = item.id;
      }
    });
  }

  // 5. Map prices from supplier_commodities
  const prices: PriceList = { ...INITIAL_PRICES };

  if (supplierCommodityRes.items) {
    // Group by commodity_id and get average or latest price
    const priceMap: Record<string, number> = {};

    stockRes.items?.forEach((commodity: any) => {
      // Find all supplier commodities for this commodity
      const supplierPrices = supplierCommodityRes.items.filter(
        (sc: any) => sc.commodity_id === commodity.id
      );

      if (supplierPrices.length > 0) {
        // Use average price or latest price
        const avgPrice = supplierPrices.reduce((sum: number, sc: any) => sum + Number(sc.price || 0), 0) / supplierPrices.length;
        priceMap[commodity.code] = avgPrice;
      }
    });

    // Map to our price keys
    Object.keys(INITIAL_PRICES).forEach((key) => {
      if (priceMap[key]) {
        prices[key] = priceMap[key];
      }
    });
  }

  // 6. Map shops from suppliers
  const shops: ShopList = { ...INITIAL_SHOPS };

  if (suppliersRes.items) {
    suppliersRes.items.forEach((supplier: any, index: number) => {
      const code = String.fromCharCode(65 + index); // A, B, C, D...
      if (code.charCodeAt(0) <= 90) { // Only A-Z
        shops[code] = supplier.name;
      }
    });
  }

  return Response.json({
    stock,
    commodityMap,
    prices,
    shops,
    suppliers: suppliersRes.items || [],
    commodities: stockRes.items || [],
  });
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

  if (actionType === "update_price") {
    const commodity_code = formData.get("commodity_code") as string;
    const price = Number(formData.get("price"));

    if (!commodity_code || isNaN(price)) {
      return Response.json({
        success: false,
        message: "Data tidak valid",
      });
    }

    try {
      // Get commodity ID from code
      const commodityRes = await API.COMMODITY.get({
        session: { user, token },
        req: { query: { search: commodity_code, size: 1 } },
      });

      const commodity = commodityRes.items?.find((item: any) => item.code === commodity_code);
      if (!commodity) {
        return Response.json({
          success: false,
          message: "Commodity tidak ditemukan",
        });
      }

      // Get first supplier
      const suppliersRes = await API.SUPPLIER.get({
        session: { user, token },
        req: { query: { size: 1 } },
      });

      const supplier_id = suppliersRes.items?.[0]?.id;
      if (!supplier_id) {
        return Response.json({
          success: false,
          message: "Supplier tidak ditemukan",
        });
      }

      // Update price
      const result = await API.SUPPLIER_COMMODITY.updatePrice({
        session: { user, token },
        req: {
          body: {
            supplier_id,
            commodity_id: commodity.id,
            price,
          },
        },
      });

      return Response.json(result);
    } catch (e: any) {
      return Response.json({ success: false, message: e.message });
    }
  }

  if (actionType === "update_shop") {
    const shop_code = formData.get("shop_code") as string;
    const shop_name = formData.get("shop_name") as string;

    if (!shop_code || !shop_name) {
      return Response.json({
        success: false,
        message: "Data tidak valid",
      });
    }

    try {
      // Get suppliers and find the one matching the code
      const suppliersRes = await API.SUPPLIER.get({
        session: { user, token },
        req: { query: { size: 100 } },
      });

      // Map code to index (A=0, B=1, etc)
      const index = shop_code.charCodeAt(0) - 65;
      const supplier = suppliersRes.items?.[index];

      if (!supplier) {
        return Response.json({
          success: false,
          message: "Supplier tidak ditemukan",
        });
      }

      // Update supplier name
      const result = await API.SUPPLIER.update({
        session: { user, token },
        req: {
          body: {
            id: supplier.id,
            name: shop_name,
          },
        },
      });

      return Response.json(result);
    } catch (e: any) {
      return Response.json({ success: false, message: e.message });
    }
  }

  return Response.json({ success: true });
};

export default function StockPage() {
  const loaderData = useLoaderData<{
    stock: StockState;
    commodityMap: Record<string, string>;
    prices: PriceList;
    shops: ShopList;
    suppliers: any[];
    commodities: any[];
  }>();

  const fetcher = useFetcher();

  // Use real data from loader
  const stock = loaderData.stock;
  const commodityMap = loaderData.commodityMap;

  // Use real prices and shops from loader (not local state anymore)
  const [prices, setPrices] = useState<PriceList>(loaderData.prices);
  const [shops, setShops] = useState<ShopList>(loaderData.shops);

  // Update when loader data changes
  useEffect(() => {
    setPrices(loaderData.prices);
    setShops(loaderData.shops);
  }, [loaderData.prices, loaderData.shops]);

  const [priceKey, setPriceKey] = useState("ink_set");
  const [priceInput, setPriceInput] = useState("");
  const [selectedShopCode, setSelectedShopCode] = useState("A");
  const [shopNameInput, setShopNameInput] = useState("");

  // -- States for Multi Restock --
  const [restockShop, setRestockShop] = useState("D");
  const [restockInputs, setRestockInputs] = useState<Record<string, number>>(
    {}
  );

  // -- States for Manual Stock --
  const [manualItem, setManualItem] = useState("ink");
  const [manualValue, setManualValue] = useState("");

  useEffect(() => {
    setPriceInput(formatCurrency(prices[priceKey] || 0));
  }, [priceKey, prices]);

  // -- Calculation: Capacity --
  const metrics = useMemo(() => {
    const s = stock;

    // Capacity (Paket)
    const cap_tinta =
      s.tinta_ml > 0 ? Math.floor(s.tinta_ml / mlPerPaket()) : 0;
    const cap_roll = Math.floor(
      (s.roll_100m || 0) * Math.floor(ROLL_CM / CM_PER_LANYARD)
    );
    const cap_a4 = Math.floor((s.a4_sheets || 0) * (1 / A4_PER_PAKET));
    const cap_tape = Math.floor(
      (s.tape_roll || 0) * Math.floor(TAPE_CM_PER_ROLL / 38.75)
    );
    const cap_lan = Math.floor(
      (s.lanyard_roll || 0) * LANYARD_PER_ROLL + (s.lanyard_pcs || 0)
    );
    const cap_pvc = s.pvc_pcs || 0;
    const cap_case = s.case_pcs || 0;
    const cap_kait = s.kait_pcs || 0;
    const cap_stop = s.stopper_pcs || 0;
    const cap_rivet = Math.floor((s.rivet_pcs || 0) / RIVET_PER_PAKET);
    const cap_plast =
      (s.plastic_small_pcs || 0) * PLASTIC_SMALL_CAP +
      (s.plastic_med_pcs || 0) * PLASTIC_MED_CAP +
      (s.plastic_big_pcs || 0) * PLASTIC_BIG_CAP;

    const allCaps = [
      { name: "Tinta (ml)", val: cap_tinta, unit: "ml", stock: s.tinta_ml },
      { name: "Kertas Roll", val: cap_roll, unit: "roll", stock: s.roll_100m },
      { name: "Kertas A4", val: cap_a4, unit: "lembar", stock: s.a4_sheets },
      { name: "Solasi", val: cap_tape, unit: "roll", stock: s.tape_roll },
      {
        name: "Lanyard",
        val: cap_lan,
        unit: "pcs",
        stock: (s.lanyard_roll || 0) * LANYARD_PER_ROLL + (s.lanyard_pcs || 0),
      },
      { name: "PVC", val: cap_pvc, unit: "pcs", stock: s.pvc_pcs },
      { name: "Case", val: cap_case, unit: "pcs", stock: s.case_pcs },
      { name: "Kait", val: cap_kait, unit: "pcs", stock: s.kait_pcs },
      { name: "Stopper", val: cap_stop, unit: "pcs", stock: s.stopper_pcs },
      { name: "Rivet", val: cap_rivet, unit: "pcs", stock: s.rivet_pcs },
      { name: "Plastik", val: cap_plast, unit: "pack", stock: "Mix" },
    ];

    const maxPackage = Math.min(...allCaps.map((c) => c.val));
    return { allCaps, maxPackage };
  }, [stock]);

  // -- Handlers --
  const handleApplyPrice = () => {
    const val = parseCurrency(priceInput);

    // Submit to API
    fetcher.submit(
      {
        actionType: "update_price",
        commodity_code: priceKey,
        price: String(val),
      },
      { method: "post" }
    );

    // Optimistic update
    setPrices({ ...prices, [priceKey]: val });
  };

  const handleUpdateShopName = () => {
    if (!shopNameInput.trim()) return;

    // Submit to API
    fetcher.submit(
      {
        actionType: "update_shop",
        shop_code: selectedShopCode,
        shop_name: shopNameInput,
      },
      { method: "post" }
    );

    // Optimistic update
    setShops({ ...shops, [selectedShopCode]: shopNameInput });
    setShopNameInput("");
  };

  const handleMultiRestock = () => {
    const items = SHOP_ITEMS_CONFIG[restockShop];
    if (!items) return;

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
        } else {
          // console.warn(`Commodity ID not found for ${targetKey}`);
        }
      }
    });

    if (updates.length > 0) {
      fetcher.submit(
        { actionType: "restock", data: JSON.stringify(updates) },
        { method: "post" }
      );
      setRestockInputs({});
    } else {
      toast.error("Item tidak ditemukan di database atau qty 0");
    }
  };

  const handleManualRestock = () => {
    const raw = manualValue.trim();
    const updates: any[] = [];

    if (manualItem === "ink") {
      const m = raw.match(/C(\d{1,3})\s*M(\d{1,3})\s*Y(\d{1,3})\s*K(\d{1,3})/i);
      if (!m) {
        toast.error("Format salah! Gunakan: C20 M30 Y0 K10");
        return;
      }
      const [_, C, M, Y, K] = m.map(Number);
      const ml = ((C + M + Y + K) / 100) * 1000;

      const id = commodityMap["tinta_ml"];
      if (id) updates.push({ key: "tinta_ml", qty: 0, overrideQty: ml, id });
    } else if (manualItem === "roll_100m" || manualItem === "tape_roll") {
      const pct = Math.max(0, Math.min(100, Number(raw) || 0));
      const add = pct / 100;
      const id = commodityMap[manualItem];
      if (id) updates.push({ key: manualItem, qty: 0, overrideQty: add, id });
    } else if (manualItem === "rivet_pcs") {
      const pct = Math.max(0, Math.min(100, Number(raw) || 0));
      const pcs = Math.round((pct / 100) * 2000);
      const id = commodityMap["rivet_pcs"];
      if (id) updates.push({ key: "rivet_pcs", qty: 0, overrideQty: pcs, id });
    } else {
      const qty = Number(raw);
      if (!isFinite(qty)) return;
      const id = commodityMap[manualItem];
      if (id) updates.push({ key: manualItem, qty: 0, overrideQty: qty, id });
    }

    if (updates.length > 0) {
      const refinedUpdates = updates.map((u) => ({
        ...u,
        isDirect: !!u.overrideQty,
        qty: u.overrideQty !== undefined ? u.overrideQty : u.qty,
      }));

      fetcher.submit(
        { actionType: "restock", data: JSON.stringify(refinedUpdates) },
        { method: "post" }
      );
      setManualValue("");
    } else {
      toast.error("Item tidak ditemukan / ID missing");
    }
  };

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success) {
        toast.success(fetcher.data.message);
        // Reload data after successful operation
        fetcher.load(window.location.pathname + window.location.search);
      } else if (fetcher.data.success === false) {
        toast.error(fetcher.data.message);
      }
    }
  }, [fetcher.data, fetcher.state]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-start">
      {/* LEFT COLUMN: CAPACITY & CALCULATIONS */}
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
              {metrics.allCaps.map((c, i) => (
                <tr
                  key={i}
                  className={`hover:bg-gray-50 ${c.val === metrics.maxPackage ? "bg-red-50/50" : ""}`}
                >
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {typeof c.stock === "number"
                      ? Number(c.stock).toLocaleString("id-ID")
                      : c.stock}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {c.val}{" "}
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
          <span>
            Produksi Maksimal Saat Ini: <b>{metrics.maxPackage} Paket</b>
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: MANAGEMENT */}
      <div className="space-y-6">
        {/* Section 1: Multi Restock */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2">
            <Store size={18} /> Restock Toko (Multi Item)
          </h3>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Pilih Toko
            </label>
            <select
              className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
              value={restockShop}
              onChange={(e) => setRestockShop(e.target.value)}
            >
              {Object.entries(shops).map(([k, v]) => (
                <option key={k} value={k}>
                  {v} ({k})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {(SHOP_ITEMS_CONFIG[restockShop] || []).map((item) => (
              <div
                key={item.k}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700 font-medium flex-1">
                  {item.label}
                </span>
                <input
                  type="number"
                  min="0"
                  className="w-24 text-right border border-gray-300 rounded-md text-sm p-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="0"
                  value={restockInputs[item.k] || ""}
                  onChange={(e) =>
                    setRestockInputs({
                      ...restockInputs,
                      [item.k]: Number(e.target.value),
                    })
                  }
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleMultiRestock}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center justify-center gap-2 transition shadow-lg shadow-gray-200"
          >
            <Plus size={16} /> Tambah Stok
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 2: Manual Input */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2">
              <Settings size={18} /> Stok Manual
            </h3>
            <div className="space-y-3">
              <select
                className="w-full text-sm border border-gray-300 rounded-lg p-2"
                value={manualItem}
                onChange={(e) => {
                  setManualItem(e.target.value);
                  setManualValue("");
                }}
              >
                <option value="ink">Tinta CMYK</option>
                <option value="roll_100m">Kertas Roll 100m</option>
                <option value="tape_roll">Solasi 33m</option>
                <option value="rivet_pcs">Rivet (Persen)</option>
                <option value="lanyard_pcs">Lanyard (Pcs)</option>
                <option value="pvc_pcs">PVC (Pcs)</option>
                <option value="case_pcs">Case (Pcs)</option>
                <option value="kait_pcs">Kait (Pcs)</option>
                <option value="stopper_pcs">Stopper (Pcs)</option>
              </select>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg text-sm p-2"
                placeholder={manualItem === "ink" ? "C20 M30 Y0 K10" : "100..."}
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
              />
              <button
                onClick={handleManualRestock}
                className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
              >
                SIMPAN MANUAL
              </button>
            </div>
          </div>

          {/* Section 3: Prices (Local) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2">
              <AlertTriangle size={18} /> Harga & Toko
            </h3>
            <div className="space-y-3">
              <select
                className="w-full text-xs border border-gray-300 rounded-lg p-2"
                value={priceKey}
                onChange={(e) => setPriceKey(e.target.value)}
              >
                {Object.keys(prices).map((k) => (
                  <option key={k} value={k}>
                    {k.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-300 rounded-lg text-sm p-2"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                />
                <button
                  onClick={handleApplyPrice}
                  className="bg-blue-600 text-white px-3 rounded-lg text-xs font-bold"
                >
                  SET
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="text-[10px] text-gray-400 uppercase font-bold mb-2 block">
                Ubah Nama Toko
              </label>
              <div className="flex gap-2">
                <select
                  className="w-16 text-xs border border-gray-300 rounded-lg p-1"
                  value={selectedShopCode}
                  onChange={(e) => setSelectedShopCode(e.target.value)}
                >
                  {Object.keys(shops).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <input
                  className="flex-1 border border-gray-300 rounded-lg text-xs p-2"
                  placeholder="Nama baru..."
                  value={shopNameInput}
                  onChange={(e) => setShopNameInput(e.target.value)}
                />
                <button
                  onClick={handleUpdateShopName}
                  className="bg-gray-800 text-white px-3 rounded-lg text-xs font-bold"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  INK_SET_ML,
} from "../constants";
import {
  Calculator,
  Store,
  Settings,
  AlertTriangle,
  Plus,
  RefreshCw,
} from "lucide-react";
// import {
//   savePrices,
//   saveShops,
//   loadPrices,
//   loadShops,
// } from "../services/storage";

interface StockPageProps {
  stock: StockState;
  onUpdateStock: (newStock: StockState) => void;
}

const StockPage: React.FC<StockPageProps> = ({
  stock = {},
  onUpdateStock = {},
}) => {
  const [prices, setPrices] = useState<PriceList>({});
  const [shops, setShops] = useState<ShopList>({});

  // -- States for Price Management --
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
    const newPrices = { ...prices, [priceKey]: val };
    setPrices(newPrices);
    // savePrices(newPrices);
    alert("Harga diperbarui!");
  };

  const handleUpdateShopName = () => {
    if (!shopNameInput.trim()) return;
    const newShops = { ...shops, [selectedShopCode]: shopNameInput };
    setShops(newShops);
    // saveShops(newShops);
    setShopNameInput("");
  };

  const handleMultiRestock = () => {
    const items = SHOP_ITEMS_CONFIG[restockShop];
    if (!items) return;
    const newStock = { ...stock };
    let addedCount = 0;

    items.forEach((it) => {
      const qty = restockInputs[it.k] || 0;
      if (qty > 0) {
        const add = unitAdd(it.k, qty);
        if (["tinta_cL", "tinta_mL", "tinta_yL", "tinta_kL"].includes(it.k)) {
          newStock.tinta_ml = (newStock.tinta_ml || 0) + add;
        } else {
          newStock[it.k] = (newStock[it.k] || 0) + add;
        }
        addedCount++;
      }
    });

    if (addedCount > 0) {
      //   onUpdateStock(newStock);
      setRestockInputs({});
      alert("Stok berhasil ditambahkan!");
    }
  };

  const handleManualRestock = () => {
    const newStock = { ...stock };
    const raw = manualValue.trim();

    if (manualItem === "ink") {
      const m = raw.match(/C(\d{1,3})\s*M(\d{1,3})\s*Y(\d{1,3})\s*K(\d{1,3})/i);
      if (!m) {
        alert("Format salah! Gunakan: C20 M30 Y0 K10");
        return;
      }
      const [_, C, M, Y, K] = m.map(Number);
      const ml = ((C + M + Y + K) / 100) * 1000;
      newStock.tinta_ml = (newStock.tinta_ml || 0) + ml;
    } else if (manualItem === "roll_100m" || manualItem === "tape_roll") {
      const pct = Math.max(0, Math.min(100, Number(raw) || 0));
      const add = pct / 100;
      newStock[manualItem] = (newStock[manualItem] || 0) + add;
    } else if (manualItem === "rivet_pcs") {
      const pct = Math.max(0, Math.min(100, Number(raw) || 0));
      const pcs = Math.round((pct / 100) * 2000);
      newStock.rivet_pcs = (newStock.rivet_pcs || 0) + pcs;
    } else {
      const qty = Number(raw);
      if (!isFinite(qty)) return;
      newStock[manualItem] = (newStock[manualItem] || 0) + qty;
    }

    // onUpdateStock(newStock);
    setManualValue("");
    alert("Stok manual tersimpan!");
  };

  const getManualPlaceholder = () => {
    if (manualItem === "ink") return "C20 M30 Y0 K10";
    if (["roll_100m", "tape_roll", "rivet_pcs"].includes(manualItem))
      return "50 (Persen)";
    return "100 (Jumlah)";
  };

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
                placeholder={getManualPlaceholder()}
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

          {/* Section 3: Prices */}
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
};

export default StockPage;

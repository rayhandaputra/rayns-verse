import React, { useState, useEffect } from "react";
import type { HistoryEntry, Order, CustomItem, Product } from "../types";
import {
  getUnitPrice,
  formatCurrency,
  parseCurrency,
  slugifyBase,
  getKKNPeriod,
  formatPhoneNumber,
  generateAccessCode,
} from "../constants";
import {
  Save,
  Eraser,
  AlertCircle,
  Users,
  Plus,
  Trash2,
  Calendar,
  Lock,
  AlertTriangle,
  X,
  Check,
  PackagePlus,
  Tag,
} from "lucide-react";

interface OrderFormProps {
  history: HistoryEntry[];
  orders: Order[];
  onSubmit: (order: any) => void;
  products?: Product[]; // Added dynamic products
}

const OrderForm: React.FC<OrderFormProps> = ({
  history = [],
  orders = [],
  onSubmit,
  products = [],
}) => {
  // Global Mode
  const [isKKN, setIsKKN] = useState(false);

  // Auto Calc Period (ReadOnly)
  const [autoPeriod, setAutoPeriod] = useState({
    period: "1",
    year: new Date().getFullYear().toString(),
  });

  // Form Fields
  const [instansi, setInstansi] = useState("");
  const [singkatan, setSingkatan] = useState("");

  // KKN Specific Inputs
  const [kknType, setKknType] = useState<"PPM" | "Tematik">("PPM"); // PPM = Reguler logic
  const [kknGroupNo, setKknGroupNo] = useState<number | "">(""); // 1-400
  const [kknVillage, setKknVillage] = useState(""); // Tematik Village
  const [pjName, setPjName] = useState("");
  const [pjPhone, setPjPhone] = useState("");

  // Custom Items
  const [customItems, setCustomItems] = useState<
    { name: string; quantity: string }[]
  >([]);

  // Product Selection State
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const [jumlah, setJumlah] = useState<string>("");
  const [deadline, setDeadline] = useState("");
  const [pay, setPay] = useState<"Tidak Ada" | "DP" | "Lunas">("Tidak Ada");
  const [dpAmountStr, setDpAmountStr] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Confirmation Modal State
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  // Set default product on load
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products]);

  // Init Auto Period
  useEffect(() => {
    setAutoPeriod(getKKNPeriod());
  }, []);

  // Generate Random Access Code on Mount or Mode change
  useEffect(() => {
    setAccessCode(generateAccessCode(6));
  }, [isKKN, kknType]);

  // Auto-fill Abbreviation (Standard Mode)
  useEffect(() => {
    if (isKKN) return;
    const found = history.find(
      (h) => h.name.toLowerCase() === instansi.trim().toLowerCase()
    );
    if (found) {
      setSingkatan(found.abbr);
    }
  }, [instansi, history, isKKN]);

  // Determine current unit price based on selected product
  const currentProduct = products.find((p) => p.id === selectedProductId);
  const currentUnitPrice = currentProduct ? currentProduct.price : 0;

  const calculateFinancials = () => {
    const qty = Number(jumlah) || 0;
    // Use the product price defined in the Product List
    const price = currentUnitPrice;
    const total = qty * price;
    return { qty, price, total };
  };

  const handleDp50 = () => {
    const { total } = calculateFinancials();
    if (total > 0) {
      setDpAmountStr(formatCurrency(Math.round(total / 2)));
    }
  };

  const handlePhoneChange = (val: string) => {
    setPjPhone(formatPhoneNumber(val));
  };

  const addCustomItem = () => {
    setCustomItems([...customItems, { name: "", quantity: "" }]);
  };

  const removeCustomItem = (idx: number) => {
    const newItems = [...customItems];
    newItems.splice(idx, 1);
    setCustomItems(newItems);
  };

  const updateCustomItem = (
    idx: number,
    field: "name" | "quantity",
    val: string
  ) => {
    const newItems = [...customItems];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setCustomItems(newItems);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const { qty, price, total } = calculateFinancials();

    if (!isKKN) {
      if (!instansi.trim()) newErrors.instansi = "Wajib diisi";
      if (!singkatan.trim()) newErrors.singkatan = "Wajib diisi";
    } else {
      if (
        kknType === "PPM" &&
        (!kknGroupNo || kknGroupNo < 1 || kknGroupNo > 400)
      ) {
        newErrors.kknGroup = "Pilih kelompok 1-400";
      }
      if (kknType === "Tematik" && !kknVillage.trim()) {
        newErrors.kknVillage = "Nama desa wajib diisi";
      }
      if (!pjName.trim()) newErrors.pjName = "Nama PJ wajib diisi";
      if (!pjPhone.trim()) newErrors.pjPhone = "No HP PJ wajib diisi";
    }

    if (!qty || qty <= 0) newErrors.jumlah = "Minimal 1";
    if (!deadline) newErrors.deadline = "Wajib diisi";

    // Validate Custom Items
    const finalCustomItems: CustomItem[] = [];
    customItems.forEach((item) => {
      if (item.name.trim()) {
        finalCustomItems.push({
          name: item.name.trim(),
          quantity: parseInt(item.quantity) || 0,
        });
      }
    });

    let finalDp = 0;
    if (pay === "DP") {
      finalDp = parseCurrency(dpAmountStr);
      if (finalDp <= 0 || finalDp > total)
        newErrors.dp = "Nominal DP tidak valid";
    } else if (pay === "Lunas") {
      finalDp = total;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Construct Data
    let finalInstansi = instansi;
    let finalSingkatan = singkatan;

    if (isKKN) {
      // Auto-generate display names for KKN
      const typeLabel =
        kknType === "PPM"
          ? `PPM Kelompok ${kknGroupNo}`
          : `Tematik ${kknVillage}`;
      finalInstansi = `KKN Periode ${autoPeriod.period} ${autoPeriod.year} - ${typeLabel}`;
      finalSingkatan = `KKN${autoPeriod.period}${autoPeriod.year}`;
    }

    const orderData = {
      instansi: finalInstansi,
      singkatan: finalSingkatan,
      jenisPesanan: currentProduct
        ? currentProduct.name
        : finalCustomItems.length > 0
          ? "Campuran/Lainnya"
          : "Custom",
      jumlah: qty,
      deadline,
      statusPembayaran: pay,
      dpAmount: finalDp,
      domain: "kinau.id/" + accessCode, // Secure Link
      accessCode: accessCode,
      unitPrice: price,
      totalAmount: total,
      isKKN,
      kknDetails: isKKN
        ? {
            periode: autoPeriod.period,
            tahun: autoPeriod.year,
            tipe: kknType,
            nilai: kknType === "PPM" ? String(kknGroupNo) : kknVillage,
          }
        : undefined,
      pjName: isKKN ? pjName : undefined,
      pjPhone: isKKN ? pjPhone : undefined,
      customItems: finalCustomItems.length > 0 ? finalCustomItems : undefined,
    };

    setPendingData(orderData);
    setShowConfirm(true);
  };

  const handleFinalSubmit = () => {
    if (pendingData) {
      onSubmit(pendingData);
      handleClear();
    }
  };

  const handleClear = () => {
    setInstansi("");
    setSingkatan("");
    // setJenis('Paket'); // Removed
    if (products.length > 0) setSelectedProductId(products[0].id);
    setJumlah("");
    setDeadline("");
    setPay("Tidak Ada");
    setDpAmountStr("");
    setKknGroupNo("");
    setKknVillage("");
    setPjName("");
    setPjPhone("");
    setCustomItems([]);
    setErrors({});
    setAccessCode(generateAccessCode(6)); // Reset Code
    setShowConfirm(false);
    setPendingData(null);
  };

  const { total } = calculateFinancials();

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative">
        <div className="mb-6 pb-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Form Pemesanan</h2>
            <p className="text-gray-500 text-sm">Input data pesanan baru</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setIsKKN(false)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${!isKKN ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Umum
            </button>
            <button
              type="button"
              onClick={() => setIsKKN(true)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${isKKN ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Users size={14} /> Khusus KKN
            </button>
          </div>
        </div>

        <form onSubmit={handlePreSubmit} className="space-y-6">
          {/* KKN Global Inputs */}
          {isKKN && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4 animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-blue-800 uppercase">
                  PESANAN KHUSUS KKN
                </h3>
                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-white/50 px-3 py-1 rounded-full border border-blue-200">
                  <Calendar size={12} />
                  Periode {autoPeriod.period} / {autoPeriod.year}
                </div>
              </div>

              <div className="border-b border-blue-200 pb-4 mb-4">
                <label className="block text-xs font-semibold text-blue-700 mb-2">
                  Jenis Kelompok
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kknType"
                      checked={kknType === "PPM"}
                      onChange={() => setKknType("PPM")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      PPM (Reguler dengan Nomor)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kknType"
                      checked={kknType === "Tematik"}
                      onChange={() => setKknType("Tematik")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Tematik (Nama Desa)
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {kknType === "PPM" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Nomor Kelompok (1-400)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="400"
                        className="w-full border-gray-300 rounded-lg p-2 text-sm"
                        value={kknGroupNo}
                        onChange={(e) => setKknGroupNo(Number(e.target.value))}
                        placeholder="Masukkan nomor kelompok..."
                      />
                      {errors.kknGroup && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.kknGroup}
                        </p>
                      )}
                    </div>
                  )}
                  {kknType === "Tematik" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Nama Desa
                      </label>
                      <input
                        className="w-full border-gray-300 rounded-lg p-2 text-sm"
                        value={kknVillage}
                        onChange={(e) => setKknVillage(e.target.value)}
                        placeholder="Masukkan nama desa..."
                      />
                      {errors.kknVillage && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.kknVillage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Nama PJ
                    </label>
                    <input
                      className="w-full border-gray-300 rounded-lg p-2 text-sm"
                      value={pjName}
                      onChange={(e) => setPjName(e.target.value)}
                      placeholder="Nama satu kata"
                    />
                    {errors.pjName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.pjName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      No. HP PJ (WA)
                    </label>
                    <input
                      className="w-full border-gray-300 rounded-lg p-2 text-sm"
                      value={pjPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="+62..."
                    />
                    {errors.pjPhone && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.pjPhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Standard Inputs (Hidden if KKN) */}
          {!isKKN && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nama Instansi
                </label>
                <input
                  list="instansiList"
                  className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={instansi}
                  onChange={(e) => setInstansi(e.target.value)}
                  placeholder="Ketik nama instansi..."
                />
                <datalist id="instansiList">
                  {history.map((h, i) => (
                    <option key={i} value={h.name} />
                  ))}
                </datalist>
                {errors.instansi && (
                  <p className="text-red-500 text-xs mt-1">{errors.instansi}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Singkatan (Internal)
                </label>
                <input
                  className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={singkatan}
                  onChange={(e) => setSingkatan(e.target.value)}
                  placeholder="e.g. itera"
                />
                {errors.singkatan && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.singkatan}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Order Type & Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Produk (Pilih dari Daftar Produk)
              </label>
              <div className="flex items-center gap-2">
                <select
                  className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  {products.length === 0 && (
                    <option value="">Belum ada produk...</option>
                  )}
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {formatCurrency(p.price)}
                    </option>
                  ))}
                </select>
              </div>
              {currentProduct && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Tag size={12} /> Harga Satuan:{" "}
                  <b>{formatCurrency(currentProduct.price)}</b>
                </p>
              )}
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Jumlah
              </label>
              <input
                type="number"
                min="1"
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder="0"
              />
              {errors.jumlah && (
                <p className="text-red-500 text-xs mt-1">{errors.jumlah}</p>
              )}
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              {errors.deadline && (
                <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>
              )}
            </div>
          </div>

          {/* Custom Items Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <PackagePlus size={16} /> Jenis Barang Lain / Tambahan
              </label>
            </div>
            <div className="space-y-2">
              {customItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    className="flex-[2] border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={item.name}
                    onChange={(e) =>
                      updateCustomItem(idx, "name", e.target.value)
                    }
                    placeholder="Nama barang (Misal: Pin, Sticker...)"
                  />
                  <input
                    type="number"
                    min="1"
                    className="flex-1 border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={item.quantity}
                    onChange={(e) =>
                      updateCustomItem(idx, "quantity", e.target.value)
                    }
                    placeholder="Jml"
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomItem(idx)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCustomItem}
              className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline"
            >
              <Plus size={14} /> Tambah Item Lain
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Status Pembayaran
              </label>
              <select
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={pay}
                onChange={(e) => setPay(e.target.value as any)}
              >
                <option>Tidak Ada</option>
                <option>DP</option>
                <option>Lunas</option>
              </select>
            </div>
            {pay === "DP" && (
              <div className="flex flex-col animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nominal DP
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={dpAmountStr}
                    onChange={(e) =>
                      setDpAmountStr(
                        formatCurrency(parseCurrency(e.target.value))
                      )
                    }
                    placeholder="Rp 0"
                  />
                  <button
                    type="button"
                    onClick={handleDp50}
                    className="bg-yellow-50 border border-yellow-300 text-yellow-700 px-3 rounded-lg text-xs font-medium hover:bg-yellow-100 whitespace-nowrap"
                  >
                    50%
                  </button>
                </div>
                {errors.dp && (
                  <p className="text-red-500 text-xs mt-1">{errors.dp}</p>
                )}
              </div>
            )}
          </div>

          {total > 0 && (
            <div className="p-4 bg-gray-900 text-white rounded-xl flex justify-between items-center shadow-lg">
              <span className="text-sm font-medium opacity-80">
                Total Estimasi
              </span>
              <span className="text-xl font-bold">{formatCurrency(total)}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Link Upload Desain (Random/Secure)
            </label>
            <div className="flex items-center">
              <span className="bg-gray-100 border border-r-0 border-gray-300 text-gray-600 rounded-l-lg p-2.5 text-sm font-medium">
                kinau.id/
              </span>
              <input
                readOnly
                value={accessCode}
                className="flex-1 bg-gray-50 text-gray-500 border border-gray-300 rounded-r-lg p-2.5 text-sm font-mono tracking-wider focus:outline-none"
                placeholder="Auto..."
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Lock size={12} /> Link dibuat random demi kerahasiaan folder
              desain.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <Eraser size={16} /> Reset
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 shadow-lg shadow-gray-200 flex items-center gap-2"
            >
              <Save size={16} /> Simpan Pesanan
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && pendingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-yellow-600 mb-4">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Konfirmasi Pesanan
                </h3>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-2 mb-4">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Pemesan:</span>
                  <span className="font-bold text-right truncate w-40">
                    {pendingData.instansi}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Produk:</span>
                  <span className="font-bold text-right text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {pendingData.jenisPesanan}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Total Tagihan:</span>
                  <span className="font-bold">
                    {formatCurrency(pendingData.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-500">Jumlah:</span>
                  <span className="font-bold">{pendingData.jumlah} Pcs</span>
                </div>
                {pendingData.customItems && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="block text-gray-500 text-xs mb-1">
                      Item Tambahan:
                    </span>
                    {pendingData.customItems.map((ci: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>- {ci.name}</span>
                        <span className="font-semibold">{ci.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Pastikan data sudah benar. Stok akan otomatis berkurang setelah
                pesanan disimpan.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <X size={16} /> Batal
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Check size={16} /> Ya, Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderForm;

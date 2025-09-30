// src/pages/Restock.tsx
import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";

export default function RestockPage() {
  const [items, setItems] = useState([{ name: "ID Card", qty: 0, price: 0 }]);
  const [shop, setShop] = useState("Toko A");
  const [ongkir, setOngkir] = useState(0);
  const [admin, setAdmin] = useState(0);
  const [diskon, setDiskon] = useState(0);

  const addItem = () => {
    setItems([...items, { name: "", qty: 0, price: 0 }]);
  };

  const updateItem = (i: number, field: string, value: any) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[i][field] = value;
    setItems(newItems);
  };

  const removeItem = (i: number) => {
    setItems(items.filter((_, idx) => idx !== i));
  };

  const total = items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const finalTotal = total + ongkir + admin - diskon;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Restock Stok</h1>

      {/* Pilih Toko */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Toko</label>
        <select
          value={shop}
          onChange={(e) => setShop(e.target.value)}
          className="w-full border rounded-lg p-2"
        >
          <option>Toko A</option>
          <option>Toko B</option>
        </select>
      </div>

      {/* Daftar Item */}
      <div className="space-y-4 mb-6">
        {items.map((item, i) => (
          <div
            key={i}
            className="p-3 border rounded-lg flex items-center gap-3 bg-white shadow-sm"
          >
            <input
              placeholder="Nama item"
              value={item.name}
              onChange={(e) => updateItem(i, "name", e.target.value)}
              className="flex-1 border rounded p-2"
            />
            <input
              type="number"
              placeholder="Jumlah"
              value={item.qty}
              onChange={(e) => updateItem(i, "qty", Number(e.target.value))}
              className="w-20 border rounded p-2"
            />
            <input
              type="number"
              placeholder="Harga"
              value={item.price}
              onChange={(e) => updateItem(i, "price", Number(e.target.value))}
              className="w-28 border rounded p-2"
            />
            <button
              onClick={() => removeItem(i)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Tambah Item */}
      <button
        onClick={addItem}
        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg mb-6"
      >
        <PlusCircle className="w-5 h-5" /> Tambah Item
      </button>

      {/* Biaya Lain */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm">Ongkir (Rp)</label>
          <input
            type="number"
            value={ongkir}
            onChange={(e) => setOngkir(Number(e.target.value))}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm">Admin (Rp)</label>
          <input
            type="number"
            value={admin}
            onChange={(e) => setAdmin(Number(e.target.value))}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm">Diskon (Rp)</label>
          <input
            type="number"
            value={diskon}
            onChange={(e) => setDiskon(Number(e.target.value))}
            className="w-full border rounded p-2"
          />
        </div>
      </div>

      {/* Ringkasan */}
      <div className="p-4 bg-gray-50 border rounded-lg mb-6">
        <p className="text-sm">Total Item: {items.length}</p>
        <p className="text-sm">Subtotal: Rp {total.toLocaleString()}</p>
        <p className="text-sm">Ongkir: Rp {ongkir.toLocaleString()}</p>
        <p className="text-sm">Admin: Rp {admin.toLocaleString()}</p>
        <p className="text-sm">Diskon: Rp {diskon.toLocaleString()}</p>
        <p className="font-bold text-lg mt-2">
          Total Akhir: Rp {finalTotal.toLocaleString()}
        </p>
      </div>

      {/* Submit */}
      <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
        Tambah ke Stok & Catat Log
      </button>

      {/* Log Restock */}
      <div className="mt-8">
        <h2 className="font-semibold mb-3">Log Restock</h2>
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">17-09-2025 | ID Card +10 pcs</p>
          <p className="text-sm text-gray-500">Toko A — Rp 1.500.000</p>
        </div>
      </div>
    </div>
  );
}

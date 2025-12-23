import React, { useState } from "react";
import { Search, Plus, Edit2, MoreVertical, LayoutGrid } from "lucide-react";

// Tipe Data untuk Akun
interface Account {
  code: string;
  name: string;
  type: string;
  balance: string;
}

type Category = "Aset" | "Kewajiban" | "Modal" | "Pendapatan" | "Beban";

const ChartOfAccounts = () => {
  const [activeTab, setActiveTab] = useState<Category>("Aset");
  const [searchQuery, setSearchQuery] = useState("");

  // Data Dummy berdasarkan kategori
  const accountData: Record<Category, Account[]> = {
    Aset: [
      {
        code: "1-1000",
        name: "Kas Utama",
        type: "Kas & Bank",
        balance: "Rp 15.000.000",
      },
      {
        code: "1-1100",
        name: "Bank BCA",
        type: "Kas & Bank",
        balance: "Rp 250.000.000",
      },
      {
        code: "1-1200",
        name: "Piutang Usaha",
        type: "Piutang",
        balance: "Rp 12.500.000",
      },
    ],
    Kewajiban: [
      {
        code: "2-1000",
        name: "Hutang Dagang",
        type: "Hutang Lancar",
        balance: "Rp 5.000.000",
      },
      {
        code: "2-2000",
        name: "Hutang Bank Jangka Panjang",
        type: "Hutang LT",
        balance: "Rp 100.000.000",
      },
    ],
    Modal: [
      {
        code: "3-1000",
        name: "Modal Disetor",
        type: "Ekuitas",
        balance: "Rp 300.000.000",
      },
      {
        code: "3-2000",
        name: "Laba Ditahan",
        type: "Ekuitas",
        balance: "Rp 50.000.000",
      },
    ],
    Pendapatan: [
      {
        code: "4-1000",
        name: "Pendapatan Penjualan",
        type: "Pendapatan",
        balance: "Rp 45.000.000",
      },
      {
        code: "4-2000",
        name: "Pendapatan Jasa",
        type: "Pendapatan",
        balance: "Rp 10.000.000",
      },
    ],
    Beban: [
      {
        code: "5-1000",
        name: "Beban Gaji Karyawan",
        type: "Beban Operasional",
        balance: "Rp 20.000.000",
      },
      {
        code: "5-1100",
        name: "Beban Listrik & Air",
        type: "Beban Operasional",
        balance: "Rp 1.500.000",
      },
    ],
  };

  const categories: Category[] = [
    "Aset",
    "Kewajiban",
    "Modal",
    "Pendapatan",
    "Beban",
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Daftar Akun (COA)
          </h1>
          <p className="text-sm text-gray-500">
            Kelola bagan akun keuangan perusahaan Anda
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm">
          <Plus size={18} />
          <span>Tambah Akun</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Search & Tabs Section */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari kode atau nama akun..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === cat
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-200"
                    : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Kode Akun</th>
                <th className="px-6 py-4 font-semibold">Nama Akun</th>
                <th className="px-6 py-4 font-semibold">Tipe Akun</th>
                <th className="px-6 py-4 font-semibold text-right">Saldo</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {accountData[activeTab].map((account) => (
                <tr
                  key={account.code}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-blue-600">
                    {account.code}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {account.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {account.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono">
                    {account.balance}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3 text-gray-400">
                      <button className="hover:text-blue-600 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button className="hover:text-gray-600 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Menampilkan {accountData[activeTab].length} akun untuk kategori{" "}
            <strong>{activeTab}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChartOfAccounts;

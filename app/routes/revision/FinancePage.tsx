
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, Product, Asset, Order, BankAccount, RawMaterial } from '../types';
import { formatCurrency, parseCurrency } from '../constants';
import { Wallet, TrendingUp, TrendingDown, Plus, Monitor, Tag, Save, Check, CreditCard, Trash2, Edit2, Image, X, Download, Filter, PieChart as PieIcon, BarChart3, PlusCircle } from 'lucide-react';
import AssetPage from './AssetPage';
import { loadBanks, saveBanks } from '../services/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FinancePageProps {
  transactions: Transaction[];
  onUpdateTransactions: (data: Transaction[]) => void;
  products: Product[];
  onUpdateProducts: (data: Product[]) => void;
  assets: Asset[];
  onUpdateAssets: (data: Asset[]) => void;
  orders: Order[];
  materials?: RawMaterial[];
}

const FinancePage: React.FC<FinancePageProps> = ({ 
    transactions, onUpdateTransactions, 
    products, onUpdateProducts,
    assets, onUpdateAssets,
    orders,
    materials = []
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'product_cost' | 'assets' | 'banks'>('report');
  
  // -- TAB 1: REPORT & TRANSACTIONS --
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txForm, setTxForm] = useState<Partial<Transaction>>({ type: 'Expense', date: new Date().toISOString().split('T')[0] });
  const [proofImage, setProofImage] = useState<string>('');
  const proofInputRef = useRef<HTMLInputElement>(null);
  
  // Filters & Sorting
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [sortOption, setSortOption] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // -- TAB 4: BANKS --
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [bankForm, setBankForm] = useState<Partial<BankAccount>>({});
  const [editingBankId, setEditingBankId] = useState<string | null>(null);

  useEffect(() => {
      setBanks(loadBanks());
  }, []);

  // -- FILTER LOGIC --
  const availableYears = useMemo(() => {
      const years = new Set<number>(transactions.map(t => new Date(t.date).getFullYear()));
      years.add(new Date().getFullYear());
      return Array.from(years).sort((a: number, b: number) => b - a);
  }, [transactions]);

  // Ensure filterYear matches something in availableYears if possible, otherwise default to current
  useEffect(() => {
      if (!availableYears.includes(filterYear)) {
          setFilterYear(new Date().getFullYear());
      }
  }, [availableYears]);

  const filteredTransactions = useMemo(() => {
      return transactions.filter(t => {
          const tYear = new Date(t.date).getFullYear();
          return tYear === filterYear;
      }).sort((a, b) => {
          if (sortOption === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
          if (sortOption === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
          if (sortOption === 'amount_desc') return b.amount - a.amount;
          if (sortOption === 'amount_asc') return a.amount - b.amount;
          return 0;
      });
  }, [transactions, filterYear, sortOption]);

  // -- ANALYTICS LOGIC (Based on Filtered Year) --
  const totalIncome = filteredTransactions.filter(t => t.type === 'Income').reduce((sum: number, t) => sum + Number(t.amount), 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'Expense').reduce((sum: number, t) => sum + Number(t.amount), 0);
  const netIncome = totalIncome - totalExpense;

  const monthlyChartData = useMemo(() => {
      const data: { name: string; income: number; expense: number; net: number }[] = Array.from({ length: 12 }, (_, i) => ({
          name: new Date(filterYear, i, 1).toLocaleString('id-ID', { month: 'short' }),
          income: 0,
          expense: 0,
          net: 0
      }));

      filteredTransactions.forEach(t => {
          const d = new Date(t.date);
          if (!isNaN(d.getTime())) {
              const m = d.getMonth();
              const amt = Number(t.amount);
              if (t.type === 'Income') data[m].income += amt;
              else data[m].expense += amt;
          }
      });

      return data.map(d => ({ ...d, net: d.income - d.expense }));
  }, [filteredTransactions, filterYear]);

  const categoryPieData = useMemo(() => {
      const inc: Record<string, number> = {};
      const exp: Record<string, number> = {};

      filteredTransactions.forEach(t => {
          const amt = Number(t.amount);
          if (t.type === 'Income') inc[t.category] = (inc[t.category] || 0) + amt;
          else exp[t.category] = (exp[t.category] || 0) + amt;
      });

      const toChart = (rec: Record<string, number>) => Object.entries(rec).map(([name, value]) => ({ name, value }));
      
      return { income: toChart(inc), expense: toChart(exp) };
  }, [filteredTransactions]);

  // -- BANK BALANCE CALCULATION --
  const bankBalances = useMemo(() => {
      const bals: Record<string, number> = {};
      // Init all banks with 0
      banks.forEach(b => {
          const key = `${b.bankName} - ${b.holderName}`;
          bals[key] = 0; 
      });
      // Tunai is also a 'bank' conceptually for balance tracking
      bals['Tunai'] = 0;

      // Iterate ALL transactions (not just filtered year)
      transactions.forEach(t => {
          // If transaction has a bankId string that matches our format "Bank - Holder" or "Tunai"
          // Note: In AddTx, bankId is saved as `${b.bankName} - ${b.holderName}`
          if (t.bankId) {
              const amt = Number(t.amount);
              // Clean up bankId potentially having account number inside parenthesis if changed later
              // For now assuming strict string match from the select value
              // If key doesn't exist (maybe deleted bank), ignore or add to 'Unknown'
              if (bals[t.bankId] === undefined) bals[t.bankId] = 0;
              
              if (t.type === 'Income') bals[t.bankId] += amt;
              else bals[t.bankId] -= amt;
          }
      });
      return bals;
  }, [transactions, banks]);

  // -- EXPORT LOGIC --
  const handleExportExcel = () => {
      const headers = ['Waktu', 'Tipe', 'Kategori', 'Deskripsi', 'Rekening', 'Jumlah'];
      const rows = filteredTransactions.map(t => [
          t.date,
          t.type,
          t.category,
          `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
          t.bankId || '-',
          t.amount
      ]);

      const csvContent = [
          headers.join(','),
          ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Laporan_Keuangan_Kinau_${filterYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // -- BANK HANDLERS --
  const handleSaveBank = () => {
      if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.holderName) return;
      
      let newBanks = [];
      if (editingBankId) {
          newBanks = banks.map(b => b.id === editingBankId ? { ...b, ...bankForm } as BankAccount : b);
      } else {
          const newBank: BankAccount = {
              id: String(Date.now()),
              bankName: bankForm.bankName!,
              accountNumber: bankForm.accountNumber!,
              holderName: bankForm.holderName!
          };
          newBanks = [...banks, newBank];
      }
      setBanks(newBanks);
      saveBanks(newBanks);
      setBankForm({});
      setEditingBankId(null);
  };

  const handleEditBank = (b: BankAccount) => {
      setBankForm(b);
      setEditingBankId(b.id);
  };

  const handleDeleteBank = (id: string) => {
      if (confirm('Hapus rekening ini?')) {
          const newBanks = banks.filter(b => b.id !== id);
          setBanks(newBanks);
          saveBanks(newBanks);
      }
  };

  const handleAddTx = (e: React.FormEvent) => {
      e.preventDefault();
      if (!txForm.amount || !txForm.category) return;
      
      const newTx: Transaction = {
          id: String(Date.now()),
          date: txForm.date || new Date().toISOString(),
          type: txForm.type as 'Income' | 'Expense',
          category: txForm.category!,
          amount: Number(txForm.amount),
          description: txForm.description || '',
          bankId: txForm.bankId,
          proofImage: proofImage
      };
      
      onUpdateTransactions([newTx, ...transactions]);

      // --- ASSET AUTOMATION ---
      if (txForm.category === 'Pembelian Aset' && txForm.type === 'Expense') {
          const newAsset: Asset = {
              id: 'ast-' + Date.now(),
              name: txForm.description || 'Aset Baru',
              category: 'Baru',
              purchaseDate: txForm.date || new Date().toISOString(),
              value: Number(txForm.amount),
              condition: 'Baik',
              location: 'Kantor',
              image: proofImage
          };
          onUpdateAssets([...assets, newAsset]);
          alert("Transaksi disimpan & Aset baru otomatis ditambahkan ke inventaris.");
      }

      setIsTxModalOpen(false);
      setTxForm({ type: 'Expense', date: new Date().toISOString().split('T')[0], amount: 0, category: '', description: '' });
      setProofImage('');
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setProofImage(reader.result as string);
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  // Helper formatting for Date + Time
  const formatFullDateTime = (isoString: string) => {
      try {
          const date = new Date(isoString);
          return date.toLocaleString('id-ID', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
          });
      } catch {
          return isoString;
      }
  };

  // -- HPP MANUAL LOGIC --
  const handleUpdateHpp = (id: string, val: number) => {
      const updated = products.map(p => p.id === id ? { ...p, productionCost: val } : p);
      onUpdateProducts(updated);
  };

  // COLORS for Charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
        {/* Navigation */}
        <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden flex-wrap">
            <button onClick={() => setActiveTab('report')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'report' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Wallet size={16} className="inline mr-2" /> Laporan Keuangan
            </button>
            <button onClick={() => setActiveTab('product_cost')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'product_cost' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Tag size={16} className="inline mr-2" /> Modal Produk (HPP)
            </button>
            <button onClick={() => setActiveTab('assets')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'assets' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Monitor size={16} className="inline mr-2" /> Aset Perusahaan
            </button>
            <button onClick={() => setActiveTab('banks')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'banks' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <CreditCard size={16} className="inline mr-2" /> Rekening Bank
            </button>
        </div>

        {activeTab === 'report' && (
            <div className="space-y-6 animate-fade-in">
                {/* Header Control */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-gray-500" />
                        <span className="text-sm font-bold text-gray-700">Tahun Laporan:</span>
                        <select 
                            className="border border-gray-300 rounded-lg p-1.5 text-sm font-medium"
                            value={filterYear}
                            onChange={e => setFilterYear(Number(e.target.value))}
                        >
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700"
                    >
                        <Download size={16} /> Export Excel (CSV)
                    </button>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2"><TrendingUp size={16} className="text-green-500"/> Total Pemasukan {filterYear}</h3>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2"><TrendingDown size={16} className="text-red-500"/> Total Pengeluaran {filterYear}</h3>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpense)}</div>
                    </div>
                    <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-white">
                        <h3 className="text-sm font-medium text-gray-400 mb-1">Laba Bersih {filterYear}</h3>
                        <div className="text-3xl font-bold">{formatCurrency(netIncome)}</div>
                    </div>
                </div>

                {/* Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 size={16}/> Pengeluaran & Pemasukan</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => v.toLocaleString('id-ID')} />
                                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                                    <Legend />
                                    <Bar dataKey="income" name="Masuk" fill="#22c55e" radius={[2,2,0,0]} />
                                    <Bar dataKey="expense" name="Keluar" fill="#ef4444" radius={[2,2,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><PieIcon size={16}/> Komposisi Pengeluaran</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={categoryPieData.expense} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" cy="50%" 
                                        outerRadius={80} 
                                        label={({cx, cy, midAngle, innerRadius, outerRadius, percent}) => {
                                            const RADIAN = Math.PI / 180;
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                            return percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '';
                                        }}
                                        labelLine={false}
                                    >
                                        {categoryPieData.expense.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                                    <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Transaction List */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
                        <h3 className="font-bold text-gray-800">Riwayat Transaksi {filterYear}</h3>
                        <div className="flex gap-2">
                            <select 
                                className="border border-gray-300 rounded-lg p-2 text-sm"
                                value={sortOption}
                                onChange={e => setSortOption(e.target.value as any)}
                            >
                                <option value="date_desc">Terbaru</option>
                                <option value="date_asc">Terlama</option>
                                <option value="amount_desc">Nominal Terbesar</option>
                                <option value="amount_asc">Nominal Terkecil</option>
                            </select>
                            <button onClick={() => setIsTxModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                                <Plus size={16} /> Catat Transaksi
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                <tr>
                                    <th className="px-6 py-3">Waktu</th>
                                    <th className="px-6 py-3">Kategori</th>
                                    <th className="px-6 py-3">Deskripsi</th>
                                    <th className="px-6 py-3">Rekening</th>
                                    <th className="px-6 py-3 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTransactions.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-gray-500 whitespace-nowrap text-xs">
                                            {formatFullDateTime(t.date)}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'Income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-700 max-w-xs truncate font-medium">{t.description}</td>
                                        <td className="px-6 py-3 text-gray-500 text-xs">{t.bankId || '-'}</td>
                                        <td className={`px-6 py-3 text-right font-bold whitespace-nowrap ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'Income' ? '+' : '-'} {formatCurrency(t.amount)}
                                        </td>
                                    </tr>
                                ))}
                                {filteredTransactions.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-gray-400">Belum ada transaksi untuk tahun {filterYear}.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* --- HPP MANUAL TAB --- */}
        {activeTab === 'product_cost' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-gray-200 bg-yellow-50">
                    <h3 className="font-bold text-gray-800 text-lg">HPP / Modal Produk</h3>
                    <p className="text-sm text-gray-600">
                        Input manual modal per pcs untuk setiap produk.
                    </p>
                </div>
                
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                        <tr>
                            <th className="px-6 py-3">Nama Produk</th>
                            <th className="px-6 py-3">Harga Jual Dasar</th>
                            <th className="px-6 py-3">Modal HPP (Per Pcs)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 font-medium">{p.name}</td>
                                <td className="px-6 py-3 text-gray-500">{formatCurrency(p.price)}</td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400">Rp</span>
                                        <input 
                                            type="number" 
                                            className="border border-gray-300 rounded px-2 py-1 w-32 font-bold text-gray-700"
                                            placeholder="0"
                                            value={p.productionCost || ''}
                                            onChange={e => handleUpdateHpp(p.id, Number(e.target.value))}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'assets' && (
            <AssetPage assets={assets} onUpdateAssets={onUpdateAssets} />
        )}

        {activeTab === 'banks' && (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-4">{editingBankId ? 'Edit Rekening' : 'Tambah Rekening Baru'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input 
                            placeholder="Nama Bank (e.g. BCA)"
                            className="border border-gray-300 rounded-lg p-2 text-sm"
                            value={bankForm.bankName || ''}
                            onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })}
                        />
                        <input 
                            placeholder="Nomor Rekening"
                            className="border border-gray-300 rounded-lg p-2 text-sm"
                            value={bankForm.accountNumber || ''}
                            onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                        />
                        <input 
                            placeholder="Atas Nama"
                            className="border border-gray-300 rounded-lg p-2 text-sm"
                            value={bankForm.holderName || ''}
                            onChange={e => setBankForm({ ...bankForm, holderName: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-2 mt-4">
                        {editingBankId && <button onClick={() => { setEditingBankId(null); setBankForm({}); }} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Batal</button>}
                        <button onClick={handleSaveBank} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Simpan Rekening</button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                            <tr>
                                <th className="px-6 py-3">Nama Bank</th>
                                <th className="px-6 py-3">No. Rekening</th>
                                <th className="px-6 py-3">Atas Nama</th>
                                <th className="px-6 py-3 text-right">Sisa Saldo</th>
                                <th className="px-6 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {banks.map(b => {
                                const key = `${b.bankName} - ${b.holderName}`;
                                const balance = bankBalances[key] || 0;
                                return (
                                <tr key={b.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-bold text-gray-800">{b.bankName}</td>
                                    <td className="px-6 py-3 font-mono text-gray-600">{b.accountNumber}</td>
                                    <td className="px-6 py-3 text-gray-600">{b.holderName}</td>
                                    <td className={`px-6 py-3 text-right font-bold ${balance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                        {formatCurrency(balance)}
                                    </td>
                                    <td className="px-6 py-3 flex justify-center gap-2">
                                        <button onClick={() => handleEditBank(b)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16}/></button>
                                        <button onClick={() => handleDeleteBank(b.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            )})}
                            <tr className="bg-gray-50 font-semibold">
                                <td colSpan={3} className="px-6 py-3 text-right">Saldo Tunai / Cash</td>
                                <td className={`px-6 py-3 text-right font-bold ${bankBalances['Tunai'] < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                    {formatCurrency(bankBalances['Tunai'] || 0)}
                                </td>
                                <td></td>
                            </tr>
                            {banks.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-gray-400">Belum ada data rekening.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Modal Transaction */}
        {isTxModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-bold mb-4">Catat Transaksi</h3>
                    <form onSubmit={handleAddTx} className="space-y-4">
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                            {['Income', 'Expense'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTxForm({...txForm, type: t as any})}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition ${txForm.type === t ? (t === 'Income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') : 'text-gray-500'}`}
                                >
                                    {t === 'Income' ? 'Pemasukan' : 'Pengeluaran'}
                                </button>
                            ))}
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                value={txForm.category} 
                                onChange={e => setTxForm({...txForm, category: e.target.value})}
                                required
                            >
                                <option value="">-- Pilih Kategori --</option>
                                {txForm.type === 'Income' ? (
                                    <>
                                        <option>Penjualan</option>
                                        <option>Investasi</option>
                                        <option>Lain-lain</option>
                                    </>
                                ) : (
                                    <>
                                        <option>Pembelian Aset</option>
                                        <option>Gaji Pegawai</option>
                                        <option>Bahan Baku</option>
                                        <option>Operasional Kantor</option>
                                        <option>Operasional CEO</option>
                                        <option>Marketing</option>
                                        <option>Maintenance</option>
                                    </>
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Sumber / Tujuan Rekening</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                value={txForm.bankId || ''} 
                                onChange={e => setTxForm({...txForm, bankId: e.target.value})}
                            >
                                <option value="">-- Pilih Rekening --</option>
                                {banks.map(b => (
                                    <option key={b.id} value={`${b.bankName} - ${b.holderName}`}>
                                        {b.bankName} ({b.accountNumber})
                                    </option>
                                ))}
                                <option value="Tunai">Tunai / Cash</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Jumlah (Rp)</label>
                            <input 
                                type="number"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                value={txForm.amount || ''}
                                onChange={e => setTxForm({...txForm, amount: Number(e.target.value)})}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal</label>
                            <input 
                                type="date"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                value={txForm.date}
                                onChange={e => setTxForm({...txForm, date: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan / Nama Aset</label>
                            <textarea 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                rows={2}
                                value={txForm.description}
                                onChange={e => setTxForm({...txForm, description: e.target.value})}
                                placeholder={txForm.category === 'Pembelian Aset' ? 'Masukkan nama aset yang dibeli...' : 'Keterangan transaksi...'}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                {txForm.category === 'Pembelian Aset' ? 'Foto Aset' : 'Bukti Transaksi (Opsional)'}
                            </label>
                            <div className="flex gap-2 items-center">
                                {proofImage ? (
                                    <div className="relative w-16 h-16 border rounded overflow-hidden">
                                        <img src={proofImage} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => setProofImage('')} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"><X size={12}/></button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => proofInputRef.current?.click()} className="px-3 py-2 border border-gray-300 bg-gray-50 rounded text-xs text-gray-600 flex items-center gap-1">
                                        <Image size={14}/> Upload Foto
                                    </button>
                                )}
                                <input type="file" className="hidden" ref={proofInputRef} accept="image/*" onChange={handleProofUpload} />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setIsTxModalOpen(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm font-medium">Batal</button>
                            <button type="submit" className="flex-1 py-2 text-white bg-blue-600 rounded-lg text-sm font-medium">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default FinancePage;


import React, { useMemo } from 'react';
import { Order, StockState, PriceList } from '../types';
import { ClipboardList, Loader2, CheckCircle2, TrendingUp, AlertTriangle, Package, Crown, BarChart2, Layers, Building2, Handshake } from 'lucide-react';
import { formatCurrency, mlPerPaket, ROLL_CM, CM_PER_LANYARD, A4_PER_PAKET, TAPE_CM_PER_ROLL, LANYARD_PER_ROLL, RIVET_PER_PAKET, PLASTIC_SMALL_CAP, PLASTIC_MED_CAP, PLASTIC_BIG_CAP, INK_SET_ML } from '../constants';
import { loadPrices } from '../services/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface DashboardHomeProps {
  orders: Order[];
  stock: StockState;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ orders, stock }) => {
  // Order Stats
  const done = orders.filter(o => o.finishedAt).length;
  const inprogress = orders.filter(o => !o.finishedAt && o.statusPengerjaan === 'sedang dikerjakan').length;
  const pending = orders.filter(o => !o.finishedAt && o.statusPengerjaan === 'pending').length;

  // Accumulated Stats (Like Landing Page)
  const completedOrders = orders.filter(o => o.finishedAt || o.statusPengerjaan === 'selesai');
  const countFinished = completedOrders.length;
  const countItems = completedOrders.reduce((sum, o) => sum + (Number(o.jumlah) || 0), 0);
  const uniqueClients = new Set(orders.map(o => o.instansi.trim().toLowerCase())).size;
  const countSponsors = orders.filter(o => o.isSponsor).length;

  const fmt = (n: number) => n.toLocaleString('id-ID');

  // Capacity Stats
  const prices: PriceList = loadPrices(); 
  
  const metrics = useMemo(() => {
      const s = stock;
      const p = prices;
  
      // Capacity (Paket)
      const cap_tinta = s.tinta_ml > 0 ? Math.floor(s.tinta_ml / mlPerPaket()) : 0;
      const cap_roll  = Math.floor((s.roll_100m || 0) * Math.floor(ROLL_CM / CM_PER_LANYARD));
      const cap_a4    = Math.floor((s.a4_sheets || 0) * (1 / A4_PER_PAKET));
      const cap_tape  = Math.floor((s.tape_roll || 0) * Math.floor(TAPE_CM_PER_ROLL / 38.75));
      const cap_lan   = Math.floor(((s.lanyard_roll || 0) * LANYARD_PER_ROLL) + (s.lanyard_pcs || 0));
      const cap_pvc   = s.pvc_pcs || 0;
      const cap_case  = s.case_pcs || 0;
      const cap_kait  = s.kait_pcs || 0;
      const cap_stop  = s.stopper_pcs || 0;
      const cap_rivet = Math.floor((s.rivet_pcs || 0) / RIVET_PER_PAKET);
      const cap_plast = (s.plastic_small_pcs || 0) * PLASTIC_SMALL_CAP + (s.plastic_med_pcs || 0) * PLASTIC_MED_CAP + (s.plastic_big_pcs || 0) * PLASTIC_BIG_CAP;
  
      const allCaps = [ cap_tinta, cap_roll, cap_a4, cap_tape, cap_lan, cap_pvc, cap_case, cap_kait, cap_stop, cap_rivet, cap_plast ];
      const maxPackage = Math.min(...allCaps);
  
      // Cost Per Package (CPP)
      const c_tinta   = (p.ink_set / INK_SET_ML) * mlPerPaket();
      const c_roll    = p.roll_100m / (ROLL_CM / CM_PER_LANYARD);
      const c_a4      = p.a4_pack * (A4_PER_PAKET) / 100;
      const c_tape    = p.tape_roll / (TAPE_CM_PER_ROLL / 38.75);
      const c_lanyard = p.lanyard_roll / LANYARD_PER_ROLL;
      const c_pvc     = p.pvc_pack / 250;
      const c_case    = p.case_unit;
      const c_kait    = p.kait_unit;
      const c_stop    = p.stopper_pack / 120;
      const c_rivet   = p.rivet_pack / 500;
      
      const num = (s.plastic_small_pcs || 0) * p.plastic_small_unit + (s.plastic_med_pcs || 0) * p.plastic_med_unit + (s.plastic_big_pcs || 0) * p.plastic_big_unit;
      const den = (s.plastic_small_pcs || 0) * PLASTIC_SMALL_CAP + (s.plastic_med_pcs || 0) * PLASTIC_MED_CAP + (s.plastic_big_pcs || 0) * PLASTIC_BIG_CAP;
      const c_plast = den > 0 ? num / den : Math.min(p.plastic_small_unit / PLASTIC_SMALL_CAP, p.plastic_med_unit / PLASTIC_MED_CAP);
  
      const cpp = c_tinta + c_roll + c_a4 + c_tape + c_lanyard + c_pvc + c_case + c_kait + c_stop + c_rivet + c_plast;
  
      return { maxPackage, cpp };
    }, [stock, prices]);

  // Analytics Logic
  const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaid = orders.reduce((sum, o) => sum + o.dpAmount, 0);
  const outstanding = Math.max(0, totalValue - totalPaid);

  // Highest Value Order
  const maxOrder = orders.reduce((prev, current) => (prev.totalAmount > current.totalAmount) ? prev : current, orders[0] || null);

  const monthlyData = useMemo(() => {
    const data: Record<string, { name: string, total: number, paid: number }> = {};
    const now = new Date();
    
    // Init last 6 months
    for(let i=5; i>=0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        data[key] = {
            name: d.toLocaleDateString('id-ID', {month: 'long'}),
            total: 0,
            paid: 0
        };
    }

    orders.forEach(o => {
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (data[key]) {
            data[key].total += o.totalAmount;
            data[key].paid += o.dpAmount;
        }
    });

    return Object.values(data);
  }, [orders]);

  return (
    <div className="space-y-6">
       {/* Alert Capacity */}
       {(metrics.maxPackage < 50) && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center gap-3 text-orange-800">
             <AlertTriangle size={20} />
             <span className="text-sm font-medium">Stok menipis! Kapasitas produksi di bawah 50 paket. Silakan cek menu <b>Stok Bahan</b>.</span>
          </div>
       )}

       {/* Top Row: Financials */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Nilai Pesanan</h3>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Terbayar (DP + Lunas)</h3>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Sisa Piutang</h3>
              <div className="text-2xl font-bold text-red-500">{formatCurrency(outstanding)}</div>
          </div>
       </div>

       {/* Middle Row: Operational Stats & Highest Order */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
             <div className="flex items-start justify-between">
                <div>
                   <p className="text-sm font-medium text-gray-500">Kapasitas Produksi</p>
                   <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.maxPackage} <span className="text-sm font-normal text-gray-400">Paket</span></h3>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                   <Package size={20} />
                </div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
             <div className="flex items-start justify-between">
                <div>
                   <p className="text-sm font-medium text-gray-500">Modal Per Paket</p>
                   <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(metrics.cpp)}</h3>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                   <TrendingUp size={20} />
                </div>
             </div>
          </div>
          
          <div className="lg:col-span-2 bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-xl shadow-md text-white flex flex-col justify-between relative overflow-hidden">
             <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-1">
                     <Crown size={18} className="text-yellow-300" />
                     <span className="text-xs font-bold uppercase tracking-wider text-purple-100">Pesanan Nominal Terbesar</span>
                 </div>
                 {maxOrder ? (
                     <>
                        <h3 className="text-2xl font-bold mb-1">{formatCurrency(maxOrder.totalAmount)}</h3>
                        <p className="text-sm text-purple-100 font-medium truncate">{maxOrder.instansi}</p>
                     </>
                 ) : (
                     <p className="text-sm opacity-80">Belum ada data.</p>
                 )}
             </div>
             <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                 <Crown size={120} />
             </div>
          </div>
       </div>

       {/* Middle Row 2: Status & Charts */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Status Status */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                 <ClipboardList size={16} /> Status Pesanan
             </h3>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
                   <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">{pending}</div>
                       <span className="text-sm font-medium text-gray-600">Pending</span>
                   </div>
                </div>
                <div className="flex items-center justify-between p-3 border border-blue-100 rounded-xl bg-blue-50">
                   <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">{inprogress}</div>
                       <span className="text-sm font-medium text-blue-700 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Proses</span>
                   </div>
                </div>
                <div className="flex items-center justify-between p-3 border border-green-100 rounded-xl bg-green-50">
                   <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-xs">{done}</div>
                       <span className="text-sm font-medium text-green-700 flex items-center gap-1"><CheckCircle2 size={12} /> Selesai</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Omzet 6 Bulan Terakhir</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v.toLocaleString('id-ID')} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="total" name="Total Order" fill="#1e293b" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="total" position="top" style={{ fontSize: '10px', fill: '#666' }} formatter={(val: number) => val > 0 ? formatCurrency(val) : ''} />
                        </Bar>
                        <Bar dataKey="paid" name="Terbayar" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </div>
       </div>

       {/* Bottom Row: Accumulation Stats (Replaced Top 5) */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition group border border-gray-100">
                <div className="flex items-center justify-center text-blue-600 mb-2 opacity-80 group-hover:scale-110 transition">
                    <CheckCircle2 size={32} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{fmt(countFinished)}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pesanan Selesai</div>
            </div>
            
            <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition group border border-gray-100">
                <div className="flex items-center justify-center text-purple-600 mb-2 opacity-80 group-hover:scale-110 transition">
                    <Layers size={32} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{fmt(countItems)}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Produk Dibuat (Pcs)</div>
            </div>

            <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition group border border-gray-100">
                 <div className="flex items-center justify-center text-orange-600 mb-2 opacity-80 group-hover:scale-110 transition">
                    <Building2 size={32} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{fmt(uniqueClients)}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Instansi / Event</div>
            </div>

            <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition group border border-gray-100">
                 <div className="flex items-center justify-center text-green-600 mb-2 opacity-80 group-hover:scale-110 transition">
                    <Handshake size={32} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{fmt(countSponsors)}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Sponsor & Partner</div>
            </div>
       </div>
    </div>
  );
};

export default DashboardHome;

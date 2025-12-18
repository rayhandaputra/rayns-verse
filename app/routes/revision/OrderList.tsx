
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Order, BankAccount } from '../types';
import { formatCurrency, formatFullDate, getWhatsAppLink } from '../constants';
import { Check, Trash2, Copy, FileText, MessageCircle, FolderOpen, Upload, Image, X, Handshake, CreditCard } from 'lucide-react';
import NotaView from './NotaView';
import { loadBanks } from '../services/storage';

interface OrderListProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: Order['statusPengerjaan']) => void;
  onMarkDone: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenDrive: (folderId: string) => void;
  onUploadPayment: (id: string, type: 'DP' | 'Lunas', file: File, bankName: string) => void; 
}

const OrderList: React.FC<OrderListProps> = ({ orders, onUpdateStatus, onMarkDone, onDelete, onOpenDrive, onUploadPayment }) => {
  const [viewMode, setViewMode] = useState<'reguler' | 'kkn'>('reguler');
  const [filterYear, setFilterYear] = useState('');
  
  // KKN Specific Filter
  const [kknPeriodFilter, setKknPeriodFilter] = useState('');

  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [showNota, setShowNota] = useState<string | null>(null);
  
  // Payment Upload Modal State
  const [paymentUploadModal, setPaymentUploadModal] = useState<{orderId: string, type: 'DP' | 'Lunas'} | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Payment Proof View Modal State
  const [showProofModal, setShowProofModal] = useState<string | null>(null); // Order ID

  useEffect(() => {
      setBanks(loadBanks());
  }, []);

  // Derive unique KKN Periods from orders for the dropdown
  const kknPeriods = useMemo(() => {
      const periods = new Set<string>();
      orders.filter(o => o.isKKN && o.kknDetails).forEach(o => {
          if (o.kknDetails) {
              periods.add(`Periode ${o.kknDetails.periode} - ${o.kknDetails.tahun}`);
          }
      });
      return Array.from(periods).sort().reverse(); // Show newest periods first
  }, [orders]);

  // Set default KKN filter if empty and periods exist
  React.useEffect(() => {
      if (viewMode === 'kkn' && !kknPeriodFilter && kknPeriods.length > 0) {
          setKknPeriodFilter(kknPeriods[0]);
      }
  }, [viewMode, kknPeriods]);

  // Filter based on view mode (KKN vs Reguler)
  const baseList = orders.filter(o => {
      if (viewMode === 'kkn') {
          if (!o.isKKN) return false;
          // Apply Period Filter
          if (kknPeriodFilter && o.kknDetails) {
              const pLabel = `Periode ${o.kknDetails.periode} - ${o.kknDetails.tahun}`;
              return pLabel === kknPeriodFilter;
          }
          return true;
      }
      return !o.isKKN;
  });

  const years = Array.from(new Set(baseList.map(o => new Date(o.createdAt).getFullYear()))).sort((a: number, b: number) => b - a);

  const filteredOrders = baseList
    .filter(o => filterYear ? new Date(o.createdAt).getFullYear() === Number(filterYear) : true)
    .sort((a, b) => {
      // Sorting Logic
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'name_az') return a.instansi.localeCompare(b.instansi);
      if (sortBy === 'name_za') return b.instansi.localeCompare(a.instansi);
      if (sortBy === 'payment') {
          const weight = (s: string) => s === 'Lunas' ? 3 : s === 'DP' ? 2 : 1;
          return weight(b.statusPembayaran) - weight(a.statusPembayaran);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const currentOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link disalin: ' + text);
  };

  const getStatusColor = (status: string) => {
      if (status === 'selesai') return 'bg-green-100 text-green-700 border border-green-200';
      if (status === 'sedang dikerjakan') return 'bg-blue-100 text-blue-700 border border-blue-200';
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  // Logic to handle Payment Upload with Bank Selection
  const handleInitiateUpload = (orderId: string, type: 'DP' | 'Lunas') => {
      setPaymentUploadModal({ orderId, type });
      setSelectedBank('');
  };

  const handleConfirmUpload = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedBank) {
          alert('Pilih rekening tujuan terlebih dahulu.');
          return;
      }
      // Trigger file input
      fileInputRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && paymentUploadModal) {
          onUploadPayment(paymentUploadModal.orderId, paymentUploadModal.type, e.target.files[0], selectedBank);
          
          setPaymentUploadModal(null);
          setSelectedBank('');
          e.target.value = '';
      }
  };

  const NotaModal = ({ order }: { order: Order }) => {
     return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[90vh] overflow-y-auto">
                 <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10 bg-white rounded-full p-1 border border-gray-200" onClick={() => setShowNota(null)}>
                    <X size={20}/>
                 </button>
                 <NotaView order={order} />
             </div>
         </div>
     )
  }

  const PaymentProofModal = ({ orderId }: { orderId: string }) => {
      const order = orders.find(o => o.id === orderId);
      if (!order || !order.paymentProofs) return null;

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in" onClick={() => setShowProofModal(null)}>
              <div className="bg-white rounded-xl p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                      <h3 className="font-bold text-lg text-gray-800">Bukti Pembayaran</h3>
                      <button onClick={() => setShowProofModal(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {order.paymentProofs.map((proof, idx) => (
                          <div key={idx} className="border rounded-lg p-2 bg-gray-50">
                              <div className="flex justify-between items-center mb-2">
                                <div className={`text-xs font-bold px-2 py-0.5 rounded ${proof.type === 'DP' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                    {proof.type === 'DP' ? 'Bukti DP' : 'Bukti Pelunasan'}
                                </div>
                                <div className="text-[10px] text-gray-400">{new Date(proof.date).toLocaleString()}</div>
                              </div>
                              <div className="mb-2 text-xs text-gray-600">
                                  {proof.method && <span>via: <b>{proof.method}</b></span>}
                              </div>
                              <div className="rounded overflow-hidden border border-gray-200">
                                <img src={proof.imageUrl} className="w-full h-auto object-contain max-h-[300px]" />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full relative">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileSelected} />

      {/* View Toggles */}
      <div className="flex border-b border-gray-200">
          <button 
            onClick={() => { setViewMode('reguler'); setPage(1); }}
            className={`flex-1 py-3 text-sm font-medium text-center ${viewMode === 'reguler' ? 'bg-gray-50 text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Pesanan Reguler
          </button>
          <button 
            onClick={() => { setViewMode('kkn'); setPage(1); }}
            className={`flex-1 py-3 text-sm font-medium text-center ${viewMode === 'kkn' ? 'bg-blue-50 text-blue-900 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Pesanan Khusus KKN
          </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 justify-between items-center bg-gray-50">
        <div className="flex gap-4 items-center">
          {viewMode === 'kkn' ? (
              <select 
                className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 font-semibold text-blue-700 bg-blue-50 border-blue-200"
                value={kknPeriodFilter}
                onChange={e => { setKknPeriodFilter(e.target.value); setPage(1); }}
              >
                  {kknPeriods.length === 0 && <option value="">Belum ada data periode</option>}
                  {kknPeriods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
          ) : (
              <select 
                className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                value={filterYear}
                onChange={e => { setFilterYear(e.target.value); setPage(1); }}
              >
                <option value="">Semua Tahun</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
          )}
          
          <select 
            className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setPage(1); }}
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="name_az">Instansi (A-Z)</option>
            <option value="payment">Status Bayar</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
            Total: <b>{filteredOrders.length}</b> Pesanan
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        {/* Added min-w-[1200px] to force horizontal scrolling and adjusted padding */}
        <table className="w-full min-w-[1200px] text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-6 py-4">Tgl. Order</th>
              <th className="px-6 py-4 w-64">{viewMode === 'kkn' ? 'KELOMPOK' : 'Instansi/Pemesan'}</th>
              <th className="px-6 py-4 w-48">Nama Item</th>
              <th className="px-6 py-4 text-center">Jumlah</th>
              <th className="px-6 py-4">Deadline</th>
              <th className="px-6 py-4">Total Bayar</th>
              <th className="px-6 py-4">Folder</th>
              <th className="px-6 py-4">Status Produksi</th>
              <th className="px-6 py-4">Status Pembayaran</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-500">
                    {viewMode === 'kkn' && !kknPeriodFilter ? 'Pilih Periode KKN terlebih dahulu.' : 'Tidak ada pesanan.'}
                </td></tr>
            ) : currentOrders.map(order => {
                const hasDPProof = order.paymentProofs?.some(p => p.type === 'DP');
                const hasLunasProof = order.paymentProofs?.some(p => p.type === 'Lunas');
                
                const dpActive = !hasDPProof && order.statusPembayaran !== 'Lunas';
                const lunasActive = !hasLunasProof;

                return (
              <tr key={order.id} className={`border-b hover:bg-gray-50 transition ${order.finishedAt ? 'bg-green-50/30' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {formatFullDate(order.createdAt)}
                </td>
                <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                        {order.instansi}
                        {order.isSponsor && (
                            <span title="Sponsor / Kerja Sama" className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                <Handshake size={10} className="mr-0.5" /> PARTNER
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">
                        {order.pemesanName || '-'} ({order.pemesanPhone})
                    </div>
                </td>
                
                {/* Nama Item Column */}
                <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                        {(order.items || []).map((item, idx) => (
                            <div key={idx} className="text-gray-700 font-medium truncate max-w-[150px]">
                                {item.productName}
                            </div>
                        ))}
                        {(!order.items || order.items.length === 0) && (
                            <div className="text-gray-700 font-medium">{order.jenisPesanan}</div>
                        )}
                    </div>
                </td>

                {/* Jumlah Column - REVISED: Show ONLY Number */}
                <td className="px-6 py-4 text-center">
                    <div className="text-lg font-bold text-gray-800">
                        {order.jumlah}
                    </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium text-xs">
                    {order.deadline ? formatFullDate(order.deadline) : '-'}
                </td>

                {/* Total Bayar - Show Number Only */}
                <td className="px-6 py-4">
                     <div className="text-xs font-bold text-gray-900">
                        {new Intl.NumberFormat('id-ID').format(order.totalAmount)}
                     </div>
                     {!order.isSponsor && (
                         <span className={`px-2 py-0.5 rounded text-[10px] font-medium mt-1 inline-block ${
                            order.statusPembayaran === 'Lunas' ? 'bg-green-100 text-green-700' :
                            order.statusPembayaran === 'DP' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
                        }`}>
                            {order.statusPembayaran}
                        </span>
                     )}
                </td>

                <td className="px-6 py-4 max-w-[120px]">
                    <div className="flex flex-col gap-2">
                        {order.driveFolderId ? (
                             <button 
                                onClick={() => onOpenDrive(order.driveFolderId!)}
                                className="flex items-center gap-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 shadow-sm w-fit"
                             >
                                <FolderOpen size={10} className="text-yellow-500" /> Buka
                             </button>
                        ) : '-'}
                        <div className="flex items-center gap-1 group">
                            <a href={`?access=${order.accessCode}`} className="truncate text-blue-600 hover:underline text-[10px] font-mono w-16">
                                link
                            </a>
                            <button onClick={() => copyToClipboard('kinau.id/' + order.accessCode)} className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition">
                                <Copy size={10} />
                            </button>
                        </div>
                    </div>
                </td>

                <td className="px-6 py-4">
                    {order.finishedAt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                            <Check size={12} /> Selesai
                        </span>
                    ) : (
                        <select 
                            className={`text-xs border rounded py-1 px-2 font-medium ${getStatusColor(order.statusPengerjaan)}`}
                            value={order.statusPengerjaan}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value as any)}
                        >
                            <option value="pending" className="bg-white text-gray-700">Pending</option>
                            <option value="sedang dikerjakan" className="bg-white text-blue-700">Proses</option>
                            <option value="selesai" className="bg-white text-green-700">Selesai</option>
                        </select>
                    )}
                </td>

                {/* Status Pembayaran (Buttons) */}
                <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                        <button 
                            disabled={!dpActive}
                            onClick={() => handleInitiateUpload(order.id, 'DP')}
                            className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition ${
                                hasDPProof ? 'bg-green-100 text-green-700 border-green-200' : 
                                !dpActive ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' :
                                'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {hasDPProof ? <Check size={10} /> : <Upload size={10} />} DP
                        </button>
                        <button 
                            disabled={!lunasActive}
                            onClick={() => handleInitiateUpload(order.id, 'Lunas')}
                            className={`flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition ${
                                hasLunasProof ? 'bg-green-100 text-green-700 border-green-200' : 
                                !lunasActive ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' :
                                'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {hasLunasProof ? <Check size={10} /> : <Upload size={10} />} LUNAS
                        </button>
                        
                        {order.paymentProofs && order.paymentProofs.length > 0 && (
                            <button 
                                onClick={() => setShowProofModal(order.id)}
                                className="text-[10px] text-blue-600 hover:underline flex items-center justify-center gap-1 mt-1"
                            >
                                <Image size={10} /> Lihat Bukti
                            </button>
                        )}
                    </div>
                </td>

                <td className="px-6 py-4 relative">
                    <div className="flex justify-center gap-2">
                        <button 
                            title="Nota"
                            onClick={() => setShowNota(showNota === order.id ? null : order.id)}
                            className="p-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                        >
                            <FileText size={16} />
                        </button>
                        {!order.finishedAt && (
                            <button 
                                title="Selesai"
                                onClick={() => onMarkDone(order.id)}
                                className="p-2 text-green-600 bg-green-50 rounded hover:bg-green-100"
                            >
                                <Check size={16} />
                            </button>
                        )}
                        <button 
                            title="Hapus"
                            onClick={() => { if(confirm('Hapus pesanan ini?')) onDelete(order.id); }}
                            className="p-2 text-red-600 bg-red-50 rounded hover:bg-red-100"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    {showNota === order.id && <NotaModal order={order} />}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {showProofModal && <PaymentProofModal orderId={showProofModal} />}

      {/* Upload Payment Modal with Bank Selection */}
      {paymentUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                  <h3 className="text-lg font-bold mb-4">Upload Bukti {paymentUploadModal.type}</h3>
                  <form onSubmit={handleConfirmUpload} className="space-y-4">
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Tujuan Transfer</label>
                          <select 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                            value={selectedBank}
                            onChange={e => setSelectedBank(e.target.value)}
                            required
                          >
                              <option value="">-- Pilih Rekening --</option>
                              {banks.map(b => (
                                  <option key={b.id} value={`${b.bankName} - ${b.holderName}`}>
                                      {b.bankName} ({b.accountNumber}) - {b.holderName}
                                  </option>
                              ))}
                              <option value="Tunai">Tunai / Cash</option>
                          </select>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                          <button 
                            type="button" 
                            onClick={() => setPaymentUploadModal(null)}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium"
                          >
                              Batal
                          </button>
                          <button 
                            type="submit" 
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                          >
                              <Upload size={16} /> Pilih File
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 flex justify-center gap-2 mt-auto">
            {Array.from({length: totalPages}, (_, i) => i + 1).map(p => (
                <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${page === p ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    {p}
                </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default OrderList;

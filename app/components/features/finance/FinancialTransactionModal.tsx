import React from "react";
import { X } from "lucide-react";
import { Button } from "~/components/ui/button";

interface FinancialTransactionModalProps {
  txForm: any;
  setTxForm: (form: any) => void;
  handleAddTx: (e: React.FormEvent) => void;
  bankList: any;
  setIsTxModalOpen: (open: boolean) => void;
  proofImage: string;
  handleProofUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  proofInputRef: React.RefObject<HTMLInputElement>;
}

export const FinancialTransactionModal: React.FC<FinancialTransactionModalProps> = ({
  txForm,
  setTxForm,
  handleAddTx,
  bankList,
  setIsTxModalOpen,
  proofImage,
  handleProofUpload,
  proofInputRef,
}) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Catat Transaksi</h3>
          <button
            onClick={() => setIsTxModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleAddTx} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="flex gap-2 p-1.5 bg-gray-100 rounded-xl">
            {["Income", "Expense"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTxForm({ ...txForm, type: t as any })}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  txForm.type === t
                    ? t === "Income"
                      ? "bg-white text-green-700 shadow-sm"
                      : "bg-white text-red-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "Income" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Kategori
              </label>
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 appearance-none transition-all"
                value={txForm.category}
                onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                required
              >
                <option value="">-- Pilih Kategori --</option>
                {txForm.type === "Income" ? (
                  <>
                    <option>Penjualan</option>
                    <option>Investasi</option>
                    <option>Prive CEO</option>
                    <option>Lain-lain</option>
                  </>
                ) : (
                  <>
                    <option>Pembelian Aset</option>
                    <option>Gaji Pegawai</option>
                    <option>Bahan Baku</option>
                    <option>Prive CEO</option>
                    <option>Operasional Kantor</option>
                    <option>Operasional CEO</option>
                    <option>Marketing</option>
                    <option>Maintenance</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Rekening {txForm.type === "Income" ? "Tujuan" : "Sumber"}
              </label>
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 transition-all"
                value={txForm.bank_id || ""}
                onChange={(e) => setTxForm({ ...txForm, bank_id: e.target.value })}
                required
              >
                <option value="">-- Pilih Rekening --</option>
                {bankList?.data?.items?.map((bank: any) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name} - {bank.ref_account_number} ({bank.ref_account_holder})
                  </option>
                ))}
                <option value="cash">Tunai / Cash</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 transition-all"
                    value={txForm.amount || ""}
                    onChange={(e) => setTxForm({ ...txForm, amount: Number(e.target.value) })}
                    required
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 transition-all"
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    required
                  />
                </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Keterangan
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 transition-all"
                rows={3}
                value={txForm.description}
                onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                placeholder={
                  txForm.category === "Pembelian Aset"
                    ? "Masukkan nama aset yang dibeli..."
                    : "Tambahkan catatan transaksi..."
                }
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Bukti Transaksi (Opsional)
              </label>
              <div 
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer relative"
                onClick={() => proofInputRef.current?.click()}
              >
                {proofImage ? (
                  <img src={proofImage} className="max-h-32 rounded-lg" alt="Proof" />
                ) : (
                  <>
                    <p className="text-xs text-gray-500">Klik atau seret gambar ke sini</p>
                    <p className="text-[10px] text-gray-400">JPG, PNG (Maks 2MB)</p>
                  </>
                )}
                <input
                  type="file"
                  hidden
                  ref={proofInputRef}
                  accept="image/*"
                  onChange={handleProofUpload}
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsTxModalOpen(false)}
            className="flex-1 rounded-xl h-12"
          >
            Batal
          </Button>
          <Button
            onClick={handleAddTx}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-12 shadow-md shadow-blue-200 transition-all"
          >
            Simpan Transaksi
          </Button>
        </div>
      </div>
    </div>
  );
};

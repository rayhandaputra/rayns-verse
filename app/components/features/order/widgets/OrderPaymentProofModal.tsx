import React, { useState } from "react";
import ModalShell from "~/components/modal/ModalShell";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import { API } from "~/nexus";
import { toast } from "sonner";

interface OrderPaymentProofModalProps {
  open: boolean;
  onClose: () => void;
  modal: any;
  setModal: (modal: any) => void;
  bankList: any;
  isUploadingFile: boolean;
  setIsUploadingFile: (v: boolean) => void;
  actionLoading: boolean;
  onSubmit: (e: any) => void;
}

export function OrderPaymentProofModal({
  open,
  onClose,
  modal,
  setModal,
  bankList,
  isUploadingFile,
  setIsUploadingFile,
  actionLoading,
  onSubmit,
}: OrderPaymentProofModalProps) {
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  if (!open) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Upload Bukti Bayar" size="sm">
      {/* Detail Pesanan */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 bg-blue-600 rounded-full" />
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detail Pesanan</h4>
        </div>
        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">No. Pesanan</p>
            <p className="text-xs font-bold text-gray-700">#{modal?.data?.order_number}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Instansi</p>
            <p className="text-xs font-bold text-gray-700 truncate" title={modal?.data?.institution_name}>{modal?.data?.institution_name}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Nama PIC</p>
            <p className="text-xs font-bold text-gray-700">{modal?.data?.pic_name || "-"}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Total Bayar</p>
            <p className="text-xs font-black text-blue-600">Rp {new Intl.NumberFormat("id-ID").format(modal?.data?.total_amount || 0)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tujuan Transfer</label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            value={modal?.data?.payment_detail?.account_id || modal?.data?.payment_method || ""}
            onChange={(e) => {
              const bankId = +e.target.value;
              const bank = bankList?.data?.items?.find((b: any) => b.id === bankId);
              setModal({
                ...modal,
                data: {
                  ...modal?.data,
                  ...(bankId > 0 ? {
                    payment_method: "manual_transfer",
                    payment_detail: {
                      account_id: bankId,
                      account_code: bank?.code,
                      account_name: bank?.name,
                      account_number: bank?.ref_account_number,
                      account_holder: bank?.ref_account_holder,
                    }
                  } : {
                    payment_method: e.target.value,
                    payment_detail: null
                  })
                }
              });
            }}
            required
          >
            <option value="">-- Pilih Rekening --</option>
            {bankList?.data?.items?.map((bank: any) => (
              <option key={bank.id} value={bank.id}>{bank.name} - {bank.ref_account_number}</option>
            ))}
            <option value="manual_transfer">Transfer</option>
            <option value="cash">Tunai / Cash</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">File Bukti Pembayaran</label>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setIsUploadingFile(true);
                setIsSlowConnection(false);

                const slowTimer = setTimeout(() => setIsSlowConnection(true), 20000);

                try {
                  const response = await API.ASSET.upload(file);
                  if (response.success && response.url) {
                    setModal((prev: any) => ({ ...prev, data: { ...prev.data, file: response.url } }));
                    toast.success("File bukti bayar berhasil diunggah");
                  } else {
                    toast.error(response.error_message || "Gagal mengunggah file.");
                  }
                } catch (err: any) {
                  toast.error(err.message || "Terjadi kesalahan jaringan saat mengunggah.");
                } finally {
                  clearTimeout(slowTimer);
                  setIsUploadingFile(false);
                  setIsSlowConnection(false);
                }
              }}
              required
            />
            <p className="mt-2 text-[11px] text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-amber-100">
              <Wifi size={12} /> Pastikan koneksi internet stabil untuk kelancaran unggah.
            </p>
            {isUploadingFile && (
              <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-blue-600 animate-pulse">
                <Loader2 className="animate-spin" size={12} />
                Sedang memproses unggahan...
              </div>
            )}
          </div>
        </div>

        {isSlowConnection && isUploadingFile && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
              <WifiOff size={16} />
            </div>
            <div>
              <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-wider mb-0.5">Koneksi Lambat</h5>
              <p className="text-[10px] text-amber-700 leading-tight">
                Proses unggah memakan waktu lebih lama. Pastikan koneksi internet stabil.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 bg-gray-100 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
            Batal
          </button>
          <button type="submit" disabled={actionLoading || isUploadingFile} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {actionLoading && <Loader2 className="animate-spin inline mr-2" size={14} />}
            {isUploadingFile ? "Mengunggah..." : "Simpan"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

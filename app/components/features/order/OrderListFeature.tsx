import React, { useState } from "react";
import { useOrderListLogic } from "./use-order-list-logic";
import { useOrderColumns } from "./order-columns";
import { DataTable, TablePagination } from "~/components/ui/data-table";
import OrderShareCard from "~/components/shared/print/order/OrderShareTemplate";
import ModalSecond from "~/components/shared/modal/ModalSecond";
import NotaView from "~/components/shared/NotaView";
import { X, Upload, Loader2, Image, Trash2, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { uploadFile } from "~/utils/utils";
import { API } from "~/nexus";
import { dateFormat } from "~/utils/dateFormatter";
import Swal from "sweetalert2";
import { toast } from "sonner";

export default function OrderListFeature() {
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const logic = useOrderListLogic();
  const columns = useOrderColumns({
    orders: logic.orders,
    filterKknInstitution: logic.filterKknInstitution,
    handleCopyImageQrCode: logic.handleCopyImageQrCode,
    handleShare: logic.handleShare,
    isProcessingShare: logic.isProcessingShare,
    onDelete: logic.onDelete,
    onUpdateStatus: logic.onUpdateStatus,
    onUpdateStatusPrinted: logic.onUpdateStatusPrinted,
    setModal: logic.setModal,
    modal: logic.modal,
    navigate: logic.navigate,
    copyToClipboard: logic.copyToClipboard,
  });

  const {
    viewMode, setViewMode,
    filterYear, setFilterYear,
    filterKknInstitution, setFilterKknInstitution,
    sortBy, setSortBy,
    page, setPage,
    orders,
    kknInstitutions, loadingKknInstitutions,
    modal, setModal,
    isUploadingFile, setIsUploadingFile,
    bankList,
    actionLoading,
    handleSubmitPaymentProof,
    onUpdateReview,
    onUpdatePaymentProof,
    cardRef,
    selectedOrder,
    tempQr
  } = logic;

  // ... (UI sections: Toggles, Toolbar, Table, Modals) ...
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* View Toggles */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setViewMode("reguler")}
          className={`flex-1 py-3 text-sm font-medium text-center ${viewMode === "reguler" ? "bg-gray-50 text-gray-900 border-b-2 border-gray-900" : "text-gray-500 hover:bg-gray-50"}`}
        >
          Pesanan Reguler
        </button>
        <button
          onClick={() => setViewMode("kkn")}
          className={`flex-1 py-3 text-sm font-medium text-center ${viewMode === "kkn" ? "bg-blue-50 text-blue-900 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
        >
          Pesanan Khusus KKN
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 justify-between items-center bg-gray-50">
        <div className="flex gap-4">
          {viewMode === "kkn" ? (
            <select
              className="text-sm border-gray-300 rounded-lg p-2 min-w-[220px]"
              value={filterKknInstitution}
              onChange={(e) => {
                setFilterKknInstitution(e.target.value);
                setPage(1);
              }}
              disabled={loadingKknInstitutions}
            >
              <option value="">Semua Institusi KKN</option>
              {(Array.isArray(kknInstitutions?.data) ? kknInstitutions.data : []).map((inst: any, idx: number) => (
                <option key={idx} value={inst.institution_id}>
                  {inst.institution_name}
                </option>
              ))}
            </select>
          ) : (
            <select
              className="text-sm border-gray-300 rounded-lg p-2"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">Semua Tahun</option>
              {Array.from({ length: new Date().getFullYear() - 2017 + 1 }, (_, i) => (new Date().getFullYear() - i).toString()).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
          <select
            className="text-sm border-gray-300 rounded-lg p-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="created_on:desc">Terbaru</option>
            <option value="created_on:asc">Terlama</option>
            <option value="institution_name:asc">Instansi (A-Z)</option>
            <option value="institution_name:desc">Instansi (Z-A)</option>
            <option value="payment_status:desc">Status Bayar (Lunas-DP)</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
          Total: <b>{orders?.data?.total_items || 0}</b> Pesanan
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={orders?.data?.items || []}
        getRowKey={(order) => order.id}
        rowClassName={(order) => (order.finishedAt ? "bg-green-50/30" : "")}
        emptyMessage="Belum ada pesanan di kategori ini."
        minHeight="400px"
      />

      {/* Pagination */}
      <TablePagination
        currentPage={page || orders?.data?.current_page || 1}
        totalPages={orders?.data?.total_pages || 0}
        onPageChange={setPage}
        className="mt-auto"
      />

      <OrderShareCard order={selectedOrder} qrCodeUrl={tempQr} ref={cardRef} />

      {/* Modals are handled below for brevity and organization */}
      {modal?.open && modal?.type === "upload_payment_proof" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Upload Bukti Bayar</h3>
              <button onClick={() => setModal({ open: false })} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>

            {/* Detail Pesanan */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
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

            <form onSubmit={handleSubmitPaymentProof} className="space-y-4">
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

                      const slowTimer = setTimeout(() => {
                        setIsSlowConnection(true);
                      }, 20000);

                      try {
                        const response = await API.ASSET.upload(file);
                        if (response.success && response.url) {
                          setModal((prev: any) => ({ ...prev, data: { ...prev.data, file: response.url } }));
                          toast.success("File bukti bayar berhasil diunggah");
                        } else {
                          // Handle API error message explicitly
                          const errorMsg = response.error_message || response.message || "Gagal mengunggah file. Silakan coba lagi.";
                          toast.error(errorMsg);
                          console.error("API Upload Error:", response);
                        }
                      } catch (err: any) {
                        console.error("Network Upload error:", err);
                        let errorMessage = "Terjadi kesalahan jaringan saat mengunggah. Cek koneksi internet Anda.";

                        // Try to parse error if it's a JSON string from our standardized error handler
                        try {
                          const parsedError = JSON.parse(err.message);
                          errorMessage = parsedError.error || errorMessage;
                        } catch {
                          errorMessage = err.message || errorMessage;
                        }

                        toast.error(errorMessage);
                      } finally {
                        clearTimeout(slowTimer);
                        setIsUploadingFile(false);
                        setIsSlowConnection(false);
                      }
                    }}
                    required
                  />
                  <p className="mt-2 text-[11px] text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-amber-100">
                    <Wifi size={12} /> Penting: Pastikan koneksi internet Anda stabil untuk kelancaran unggah bukti bayar.
                  </p>
                  {isUploadingFile && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-blue-600 animate-pulse">
                      <Loader2 className="animate-spin" size={12} />
                      Sedang memproses unggahan...
                    </div>
                  )}
                </div>
              </div>

              {/* Alert Internet Lambat */}
              {isSlowConnection && isUploadingFile && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                    <WifiOff size={16} />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-wider mb-0.5">Koneksi Lambat Terdeteksi</h5>
                    <p className="text-[10px] text-amber-700 leading-tight">
                      Proses unggah memakan waktu lebih lama. Pastikan koneksi internet Anda stabil untuk kelancaran unggah bukti bayar.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModal({ open: false })} className="flex-1 bg-gray-100 py-2 rounded-lg text-sm">Batal</button>
                <button type="submit" disabled={logic.actionLoading || isUploadingFile} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">
                  {isUploadingFile ? "" : logic.actionLoading ? <Loader2 className="animate-spin inline mr-2" size={16} /> : null} {isUploadingFile ? " Mengunggah file..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal?.open && modal?.type === "view_payment_proof" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setModal({ open: false })}>
          <div className="bg-white rounded-xl p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-lg">Bukti Pembayaran</h3>
              <button onClick={() => setModal({ open: false })}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['dp_payment_proof', 'payment_proof'].map((field) => {
                const proofUrl = modal.data[field];
                if (!proofUrl) return null;
                const isDP = field === 'dp_payment_proof';
                return (
                  <div key={field} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">{isDP ? 'Bukti DP' : 'Bukti Pelunasan'}</span>
                      <button onClick={() => {
                        Swal.fire({
                          title: "Hapus Bukti?",
                          text: `Yakin ingin menghapus ${isDP ? 'bukti DP' : 'bukti pelunasan'}?`,
                          icon: "warning",
                          showCancelButton: true,
                          confirmButtonText: "Ya, Hapus",
                        }).then((result) => {
                          if (result.isConfirmed) {
                            logic.onDeletePaymentProof(modal.data.id, field);
                          }
                        });
                      }} className="text-red-600"><Trash2 size={14} /></button>
                    </div>
                    <img src={proofUrl} alt="Bukti" className="w-full max-h-[320px] object-contain cursor-pointer" onClick={() => setModal({ open: true, type: "zoom_payment_proof", data: { payment_proof: proofUrl } })} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {modal?.open && modal?.type === "zoom_payment_proof" && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setModal({ open: false })}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setModal({ open: false })}><X size={32} /></button>
          <img src={modal?.data?.payment_proof} className="max-w-full max-h-[90vh] object-contain" />
        </div>
      )}

      {modal?.open && modal?.type === "view_nota" && (
        <ModalSecond open={modal?.open} onClose={() => setModal({ open: false })} title="" size="lg">
          <NotaView
            order={modal?.data}
            isEditable={true}
            onReviewChange={(rating, review) => onUpdateReview(modal?.data.id, rating, review)}
            onPaymentProofChange={(proof) => onUpdatePaymentProof(modal?.data.id, proof)}
          />
        </ModalSecond>
      )}
    </div>
  );
}

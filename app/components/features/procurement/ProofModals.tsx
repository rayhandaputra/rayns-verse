import React from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { dateFormat } from "~/utils/dateFormatter";
import { uploadFile } from "~/utils/utils";
import ModalShell from "~/components/modal/ModalShell";

export const ProofModals = ({
  modal,
  setModal,
  handleSubmitPaymentProof,
  actionLoading,
}: any) => {
  if (!modal.open) return null;

  const isKaos = modal.data?.target_field?.includes("kaos");
  const isDP = modal.data?.target_field?.includes("dp");

  return (
    <>
      <ModalShell
        open={modal.open && modal.type === "upload_payment_proof"}
        onClose={() => setModal({ ...modal, open: false, type: "" })}
        title={`Upload Bukti ${isKaos ? "Kaos" : "Sablon"} (${isDP ? "DP" : "Lunas"})`}
        size="sm"
      >
        <form onSubmit={handleSubmitPaymentProof} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              File Bukti Pembayaran
            </label>
            <input
              type="file"
              accept="image/*"
              className={`w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase outline-none ${isKaos ? "file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" : "file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"}`}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = await uploadFile(file);
                if (url)
                  setModal({ ...modal, data: { ...modal.data, file: url } });
              }}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModal({ ...modal, open: false, type: "" })}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-black uppercase"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-black uppercase flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}{" "}
              Simpan
            </button>
          </div>
        </form>
      </ModalShell>

      <ModalShell
        open={modal.open && modal.type === "view_payment_proof"}
        onClose={() => setModal({ ...modal, open: false, type: "" })}
        title="Galeri Bukti Pembayaran"
        size="4xl"
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4 border-b border-blue-50 pb-2">
              Bukti Pembayaran Kaos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProofImageCard
                label="Bukti DP Kaos"
                url={modal?.data?.kaos_payment_proof_dp}
                date={modal.data?.modified_on}
                onZoom={() =>
                  setModal({
                    open: true,
                    type: "zoom_payment_proof",
                    data: { payment_proof: modal.data.kaos_payment_proof_dp },
                  })
                }
              />
              <ProofImageCard
                label="Bukti Lunas Kaos"
                url={modal?.data?.kaos_payment_proof_paid}
                date={modal.data?.modified_on}
                onZoom={() =>
                  setModal({
                    open: true,
                    type: "zoom_payment_proof",
                    data: { payment_proof: modal.data.kaos_payment_proof_paid },
                  })
                }
              />
            </div>
          </div>

          {(modal?.data?.sablon_payment_proof_dp ||
            modal?.data?.sablon_payment_proof_paid ||
            modal?.data?.sablon_supplier_id) && (
            <div>
              <h4 className="text-sm font-black text-orange-600 uppercase tracking-widest mb-4 border-b border-orange-50 pb-2 mt-8">
                Bukti Pembayaran Sablon
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProofImageCard
                  label="Bukti DP Sablon"
                  url={modal?.data?.sablon_payment_proof_dp}
                  date={modal.data?.modified_on}
                  onZoom={() =>
                    setModal({
                      open: true,
                      type: "zoom_payment_proof",
                      data: {
                        payment_proof: modal.data.sablon_payment_proof_dp,
                      },
                    })
                  }
                />
                <ProofImageCard
                  label="Bukti Lunas Sablon"
                  url={modal?.data?.sablon_payment_proof_paid}
                  date={modal.data?.modified_on}
                  onZoom={() =>
                    setModal({
                      open: true,
                      type: "zoom_payment_proof",
                      data: {
                        payment_proof: modal.data.sablon_payment_proof_paid,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      </ModalShell>

      {modal.type === "zoom_payment_proof" && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setModal({ ...modal, open: false, type: "" })}
        >
          <button
            onClick={() => setModal({ ...modal, open: false, type: "" })}
            className="absolute top-6 right-6 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"
          >
            <X size={32} />
          </button>
          <img
            src={modal?.data?.payment_proof}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            alt="Bukti Pembayaran"
          />
        </div>
      )}
    </>
  );
};

const ProofImageCard = ({ label, url, date, onZoom }: any) => (
  <div className="border-2 border-gray-100 rounded-2xl p-4 bg-gray-50/50">
    <div className="flex justify-between items-center mb-3">
      <span className="text-xs font-black px-3 py-1 rounded-full bg-green-100 text-green-700 uppercase tracking-widest">
        {label}
      </span>
    </div>
    <div className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">
      Update: {date ? dateFormat(date, "DD MMM YYYY") : "-"}
    </div>
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
      {typeof url === "string" && url.includes("data.kinau.web.id") ? (
        <img
          src={url}
          alt={label}
          className="w-full h-[200px] object-cover cursor-pointer hover:scale-105 transition duration-300"
          onClick={onZoom}
        />
      ) : (
        <div className="flex items-center justify-center h-[200px] p-4 text-xs font-bold text-gray-400">
          Tidak ada Bukti
        </div>
      )}
    </div>
  </div>
);

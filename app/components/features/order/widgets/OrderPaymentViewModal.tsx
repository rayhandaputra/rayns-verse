import React from "react";
import ModalShell from "~/components/modal/ModalShell";
import { Trash2 } from "lucide-react";
import Swal from "sweetalert2";

interface OrderPaymentViewModalProps {
  open: boolean;
  onClose: () => void;
  modal: any;
  setModal: (modal: any) => void;
  onDeleteProof: (id: string, field: string) => void;
}

export function OrderPaymentViewModal({
  open,
  onClose,
  modal,
  setModal,
  onDeleteProof,
}: OrderPaymentViewModalProps) {
  if (!open) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Bukti Pembayaran" size="2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["dp_payment_proof", "payment_proof"].map((field) => {
          const proofUrl = modal?.data?.[field];
          if (!proofUrl) return null;
          const isDP = field === "dp_payment_proof";

          return (
            <div key={field} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">
                  {isDP ? "Bukti DP" : "Bukti Pelunasan"}
                </span>
                <button
                  onClick={() => {
                    Swal.fire({
                      title: "Hapus Bukti?",
                      text: `Yakin ingin menghapus ${isDP ? "bukti DP" : "bukti pelunasan"}?`,
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Ya, Hapus",
                    }).then((result) => {
                      if (result.isConfirmed) {
                        onDeleteProof(modal.data.id, field);
                      }
                    });
                  }}
                  className="text-red-600 hover:text-red-700 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <img
                src={proofUrl}
                alt="Bukti"
                className="w-full max-h-[320px] object-contain cursor-pointer rounded"
                onClick={() => setModal({ open: true, type: "zoom_payment_proof", data: { payment_proof: proofUrl } })}
              />
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

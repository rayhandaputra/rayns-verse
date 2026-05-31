import React from "react";
import { X } from "lucide-react";
import NotaView from "~/components/shared/NotaView";
import ModalShell from "~/components/modal/ModalShell";
import { Button } from "~/components/ui/button";

interface GlobalModalsProps {
  modal: any;
  setModal: (val: any) => void;
  loadingAction: boolean;
  orderData: any;
  onCreateFolder: (e: React.FormEvent) => void;
  onUpdateReview: (rating: number, review: string) => void;
  onUpdatePaymentProof: (id: string, proof: string) => void;
}

export const GlobalModals = ({
  modal, setModal, loadingAction, orderData,
  onCreateFolder, onUpdateReview, onUpdatePaymentProof
}: GlobalModalsProps) => {
  return (
    <div id="global-modals-container">
      {modal?.type === "zoom_image" && (
        <div 
          id="modal-zoom-image"
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" 
          onClick={() => setModal({ ...modal, type: "", open: false })}
        >
          <button 
            id="btn-close-zoom"
            onClick={() => setModal({ ...modal, type: "", open: false })} 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          >
            <X size={40} />
          </button>
          <img 
            id="img-zoomed"
            src={modal?.data?.file_url} 
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
            onClick={(e) => e.stopPropagation()} 
            alt="Zoomed"
          />
        </div>
      )}

      <ModalShell
        open={modal?.open && modal?.type === "view_nota"}
        onClose={() => setModal({ ...modal, type: "", open: false })}
        size="lg"
      >
        <NotaView 
          order={modal?.data} 
          isEditable={true} 
          onReviewChange={onUpdateReview} 
          onPaymentProofChange={(proof: string) => onUpdatePaymentProof(orderData.id, proof)} 
        />
      </ModalShell>

      <ModalShell 
        open={modal?.open && modal?.type === "create_folder"} 
        onClose={() => setModal({ ...modal, type: "", open: false })} 
        size="md" 
        title="Buat Folder Baru"
      >
        <form id="form-create-folder" onSubmit={onCreateFolder} className="mt-2 font-sans">
          <input 
            id="input-folder-name"
            autoFocus 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all" 
            placeholder="Nama Folder..." 
            value={modal?.data?.folder_name || ""} 
            onChange={(e) => setModal({ ...modal, data: { ...modal?.data, folder_name: e.target.value } })} 
          />
          <div className="flex gap-3">
            <Button 
              id="btn-cancel-folder"
              type="button" 
              onClick={() => setModal({ ...modal, type: "", open: false })} 
              className="flex-1 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Batal
            </Button>
            <Button 
              id="btn-submit-folder"
              type="submit" 
              disabled={loadingAction} 
              className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              {loadingAction ? "Memproses..." : "Buat Folder"}
            </Button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};

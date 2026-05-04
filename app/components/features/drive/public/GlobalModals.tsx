import React from "react";
import { X, FolderPlus } from "lucide-react";
import NotaView from "~/components/shared/NotaView";
import ModalSecond from "~/components/shared/modal/ModalSecond";
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

      {modal?.type === "view_nota" && (
        <div id="modal-view-nota" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[90vh] overflow-y-auto">
            <button 
              id="btn-close-nota"
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 z-10 bg-white rounded-full p-1 shadow-sm border border-gray-100" 
              onClick={() => setModal({ ...modal, type: "", open: false })}
            >
              <X size={18} />
            </button>
            <NotaView 
              order={modal?.data} 
              isEditable={true} 
              onReviewChange={onUpdateReview} 
              onPaymentProofChange={(proof: string) => onUpdatePaymentProof(orderData.id, proof)} 
            />
          </div>
        </div>
      )}

      {modal?.type === "create_folder" && (
        <ModalSecond 
          open={modal?.open} 
          onClose={() => setModal({ ...modal, type: "", open: false })} 
          size="md" 
          title="Buat Folder Baru" 
          icon={<FolderPlus size={24} className="text-blue-600" />}
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
        </ModalSecond>
      )}
    </div>
  );
};

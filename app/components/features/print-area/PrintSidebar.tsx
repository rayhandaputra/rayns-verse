import React from "react";
import { 
  Layers, 
  Eraser, 
  FolderOpen, 
  Plus, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { type PrintCategory, type PrintOrder } from "~/types/print";
import { safeParseArray } from "~/utils/utils";

interface PrintSidebarProps {
  category: PrintCategory;
  onSetCategory: (cat: PrintCategory) => void;
  orders: PrintOrder[];
  onClearSlots: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onAddFolder: (folder: any) => void;
  activeQueueCount: number;
  PrintButton: React.ComponentType<any> | null;
  printAreaRef: React.RefObject<HTMLDivElement>;
  printStyles: string;
}

export const PrintSidebar: React.FC<PrintSidebarProps> = ({
  category,
  onSetCategory,
  orders,
  onClearSlots,
  onUpdateStatus,
  onAddFolder,
  activeQueueCount,
  PrintButton,
  printAreaRef,
  printStyles
}) => {
  return (
    <aside className="w-80 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-shrink-0 no-print">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Layers size={18} className="text-blue-600" /> Sumber Cetak
        </h3>
        <button
          onClick={onClearSlots}
          className="p-1.5 hover:bg-red-50 rounded text-red-400 transition"
          title="Kosongkan Layout"
        >
          <Eraser size={16} />
        </button>
      </div>

      <div className="flex p-2 bg-gray-50 border-b border-gray-100 gap-1">
        {(["idcard", "lanyard", "prod3"] as PrintCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => onSetCategory(cat)}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded transition uppercase ${
              category === cat
                ? cat === "lanyard"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-900 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-200"
            }`}
          >
            {cat === "prod3" ? "PROD 3" : cat.replace("-", " ")}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {category !== "prod3" ? (
          orders.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs italic">
              Tidak ada pesanan aktif
            </div>
          ) : (
            orders.map((order) => {
              const subs = safeParseArray(order?.order_upload_folders);
              return (
                <div
                  key={order.id}
                  className="p-3 border border-gray-100 rounded-lg bg-gray-50/50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-[11px] text-gray-900 truncate flex-1 pr-2">
                      {order.institution_name}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Tandai sebagai sudah dicetak?"))
                          onUpdateStatus(order.id, "done");
                      }}
                      className="bg-green-600 text-white p-1 rounded hover:bg-green-700 transition"
                      title="Tandai Selesai Cetak (PRINTED)"
                    >
                      <Check size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {subs.map((sub: any) => (
                      <button
                        key={sub.id}
                        onClick={() => onAddFolder(sub)}
                        className="text-left px-2 py-2 rounded text-[10px] font-bold flex items-center justify-between border bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition group"
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <FolderOpen size={12} className="text-yellow-500" />{" "}
                          {sub.folder_name}
                        </span>
                        <Plus
                          size={12}
                          className="text-gray-300 group-hover:text-blue-500"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-gray-300">
            <AlertCircle size={32} className="mb-2" />
            <div className="text-xs font-bold">Belum Tersedia</div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-500 font-medium">Antrean:</span>
          <span className="text-sm font-bold text-gray-900">
            {activeQueueCount} Desain
          </span>
        </div>

        {PrintButton ? (
          <PrintButton
            externalRef={printAreaRef}
            label={`Cetak ${category.toUpperCase()} - ${new Date().toLocaleDateString()}`}
            pageStyle={printStyles}
          >
            {({ handlePrint }: any) => (
              <button
                onClick={handlePrint}
                disabled={activeQueueCount === 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
              >
                <Layers size={18} /> CETAK {category.toUpperCase()}
              </button>
            )}
          </PrintButton>
        ) : (
            <button
                disabled
                className="w-full bg-gray-300 text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
            >
                Loading...
            </button>
        )}
      </div>
    </aside>
  );
};

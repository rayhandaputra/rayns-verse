import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useFetcherData, usePrintSlots } from "~/hooks";
import { nexus } from "~/nexus/nexus-client";
import { type PrintOrder } from "~/types/print";
import { PrintSidebar } from "~/components/features/print-area/PrintSidebar";
import { A4Sheet } from "~/components/features/print-area/A4Sheet";
import { LanyardSheet } from "~/components/features/print-area/LanyardSheet";

export const PrintAreaDashboard: React.FC = () => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [PrintButton, setPrintButton] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import("~/components/shared/PrintButton.client").then((mod) => setPrintButton(() => mod.PrintButton));
  }, []);

  const {
    state,
    setCategory,
    addFolderToSlots,
    removeSlot,
    cloneSlot,
    copyByCardFileCount,
    updateSlotColor,
    clearAllSlots,
    chunkedIDPages,
    chunkedLanyardPages,
    activeQueueCount,
  } = usePrintSlots();

  const { data: getOrders, reload: reloadOrders } = useFetcherData<any>({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({
        page: 0,
        size: 100,
        pagination: "true",
        status_printed: "waiting",
        status: "!=done",
        sort: "created_on:asc",
        with_folders: true,
        ...(state.category === "idcard"
          ? { filter_folder: "id_card_front,id_card_back" }
          : state.category === "lanyard"
            ? { filter_folder: "lanyard" }
            : {}),
      })
      .build(),
    autoLoad: true,
  });

  const orders: PrintOrder[] = (getOrders?.data?.items as PrintOrder[]) || [];

  const { data: actionData, load: submitAction } = useFetcherData<any>({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  useEffect(() => {
    if (actionData?.success) {
      setTimeout(() => {
        reloadOrders();
      }, 0);
      toast.success(actionData?.message || "Berhasil");
    }
  }, [actionData]);

  const onUpdateStatusCetak = useCallback((id: string, status: string) => {
    submitAction({ action: "update_status", id, status });
  }, [submitAction]);

  const printStyles = `
    @media print {
      @page { size: ${state.category === "lanyard" ? "210mm 1032mm" : "A4"}; margin: 0 !important; }
      html, body { 
        margin: 0 !important; padding: 0 !important;
        background: white !important;
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important;
      }
      .no-print, button { display: none !important; }
      .print-area { width: 210mm !important; padding: 0 !important; margin: 0 !important; }
      .a4-sheet { 
        width: 210mm !important; 
        height: 297mm !important; 
        page-break-after: always !important; 
        break-after: page !important;
      }
      .lanyard-sheet { 
        width: 210mm !important; height: 1032mm !important;
        position: relative !important; margin: 0 !important; padding: 0 !important;
        page-break-after: always !important; break-after: page !important;
        overflow: hidden !important;
      }
      .category-idcard .lanyard-sheet { display: none; }
      .category-lanyard .a4-sheet { display: none; }
    }
  `;

  return (
    <div className="flex h-[calc(100vh-140px)] overflow-hidden gap-6 p-2 md:p-4 animate-fade-in">
      <PrintSidebar
        category={state.category}
        onSetCategory={setCategory}
        orders={orders}
        onClearSlots={clearAllSlots}
        onUpdateStatus={onUpdateStatusCetak}
        onAddFolder={addFolderToSlots}
        activeQueueCount={activeQueueCount}
        PrintButton={PrintButton}
        printAreaRef={printAreaRef}
        printStyles={printStyles}
      />

      <main className="flex-1 bg-gray-50/50 rounded-xl border border-gray-100 shadow-inner overflow-y-auto p-4 md:p-10 flex flex-col items-center custom-print-scroll">
        <div ref={printAreaRef} className={`flex flex-col items-center category-${state.category}`}>
          {state.category === "lanyard"
            ? chunkedLanyardPages.map((page, idx) => (
              <LanyardSheet
                key={idx}
                pageSlots={page}
                pageIndex={idx}
                onRemove={(index) => removeSlot(index, true)}
                onClone={(index) => cloneSlot(index, true)}
                onCopyByCard={(index) => copyByCardFileCount(index, orders)}
                onColorChange={updateSlotColor}
              />
            ))
            : chunkedIDPages.map((page, idx) => (
              <A4Sheet
                key={idx}
                pageSlots={page}
                pageIndex={idx}
                onRemove={(index) => removeSlot(index, false)}
                onClone={(index) => cloneSlot(index, false)}
              />
            ))}
        </div>
        <div className="mt-8 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest max-w-sm pb-10 no-print leading-relaxed">
          Lanyard: Ikon <span className="text-indigo-500">Palette</span> hanya aktif di lanyard pertama setiap folder. <br />
          Klik tombol <span className="text-emerald-500">DONE</span> di sidebar untuk menyelesaikan antrean.
        </div>
      </main>
    </div>
  );
};

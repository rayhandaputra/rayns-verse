import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { type PrintSlot } from "~/types/print";

interface A4SheetProps {
  pageSlots: PrintSlot[];
  pageIndex: number;
  onRemove: (globalIndex: number) => void;
  onClone: (globalIndex: number) => void;
}

export const A4Sheet: React.FC<A4SheetProps> = ({
  pageSlots,
  pageIndex,
  onRemove,
  onClone
}) => {
  const getDisplayNumber = (currIdx: number) => currIdx + 1;

  return (
    <div
      className="a4-sheet bg-white shadow-2xl mx-auto border border-gray-200 relative mb-12 overflow-hidden print:shadow-none print:border-0 print:m-0"
      style={{
        width: "210mm",
        height: "297mm",
        breakAfter: "always",
        imageRendering: "-webkit-optimize-contrast",
      }}
    >
      <div className="absolute top-[3.8mm] left-1/2 -translate-x-1/2 text-black font-extrabold text-[8px] no-print uppercase tracking-widest">
        LEMBAR {pageIndex + 1}
      </div>
      <div
        className="grid grid-cols-3 h-full w-full"
        style={{
          paddingTop: "7.2mm",
          paddingLeft: "15mm",
          paddingRight: "15mm",
          columnGap: "6mm",
          rowGap: "6mm",
        }}
      >
        {Array.from({ length: 9 }).map((_, localIndex) => {
          const slot = pageSlots[localIndex];
          const globalIdx = pageIndex * 9 + localIndex;
          const colIdx = localIndex % 3;
          const rowIdx = Math.floor(localIndex / 3);

          return (
            <div
              key={localIndex}
              className="flex flex-col items-center justify-start"
              style={{
                position: "relative",
                top: rowIdx === 1 ? "-7.2mm" : rowIdx === 2 ? "-14.4mm" : "0",
                left: colIdx === 0 ? "-9.6mm" : colIdx === 2 ? "9.6mm" : "0",
              }}
            >
              <div
                className={`relative group flex items-center justify-center overflow-hidden ${
                  slot
                    ? "bg-white border border-gray-200"
                    : "bg-gray-50 border border-dashed border-gray-200"
                }`}
                style={{
                  width: "56mm",
                  height: "88mm",
                  boxSizing: "border-box",
                }}
              >
                {slot?.data && (
                  <img
                    src={slot.data}
                    alt={slot.fileName}
                    className="w-full h-full object-cover"
                  />
                )}

                {slot && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition no-print flex flex-col items-center justify-center gap-2 z-20">
                    <button
                      onClick={() => onClone(globalIdx)}
                      className="bg-emerald-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition"
                      title="Duplikat"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => onRemove(globalIdx)}
                      className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div
                className="font-black"
                style={{
                  color: "#000000",
                  fontSize: "9px",
                  marginTop: "-0.5mm",
                }}
              >
                {slot ? getDisplayNumber(globalIdx) : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

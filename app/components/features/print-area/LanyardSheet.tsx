import React from "react";
import { Plus, Trash2, Copy, Palette } from "lucide-react";
import { type PrintSlot } from "~/types/print";

interface LanyardSheetProps {
  pageSlots: PrintSlot[];
  pageIndex: number;
  onRemove: (index: number) => void;
  onClone: (index: number) => void;
  onCopyByCard: (index: number) => void;
  onColorChange: (id: string, color: string) => void;
}

export const LanyardSheet: React.FC<LanyardSheetProps> = ({
  pageSlots,
  pageIndex,
  onRemove,
  onClone,
  onCopyByCard,
  onColorChange,
}) => {
  return (
    <div className="lanyard-sheet bg-white shadow-2xl mx-auto border border-gray-200 relative mb-20 overflow-hidden print:shadow-none print:border-0 print:m-0">
      <div className="absolute top-[11mm] left-1/2 -translate-x-1/2 text-black font-extrabold text-[8px] no-print uppercase tracking-widest">
        LEMBAR {pageIndex + 1}
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {[
          { color: "#000000", top: "calc(15mm + 50mm)" },
          { color: "#FFFF00", top: "calc(15mm + 350mm)" },
          { color: "#FF00FF", top: "calc(15mm + 650mm)" },
          { color: "#00FFFF", top: "calc(15mm + 950mm)" },
        ].map((line, i) => (
          <div
            key={i}
            className="absolute left-0 right-0"
            style={{
              top: line.top,
              height: "0.2mm",
              backgroundColor: line.color,
              opacity: 0.5,
            }}
          />
        ))}
        <div
          className="absolute left-0 right-0"
          style={{
            top: "calc(15mm + 500mm)",
            height: "0.5mm",
            background: "linear-gradient(to right, #000, #ff0, #f0f, #0ff)",
          }}
        />
      </div>

      <div
        className="flex justify-center relative z-10"
        style={{ width: "210mm", gap: "2mm", paddingTop: "15mm" }}
      >
        {Array.from({ length: 8 }).map((_, idx) => {
          const globalIndex = pageIndex * 8 + idx;
          const slot = pageSlots[idx];

          return (
            <div key={idx} className="flex flex-col items-center">
              <div
                className="relative group flex flex-col items-center"
                style={{
                  width: "22mm",
                  height: "1000mm",
                  backgroundColor: slot ? "white" : "transparent",
                  outline: "0.1mm solid #e5e7eb",
                  boxSizing: "content-box",
                }}
              >
                {slot ? (
                  <>
                    <div
                      className="relative overflow-hidden"
                      style={{ width: "22mm", height: "900mm" }}
                    >
                      {slot.data && (
                        <img
                          src={slot.data}
                          alt="Lanyard"
                          className="absolute"
                          style={{
                            width: "900mm",
                            height: "22mm",
                            left: "22mm",
                            top: "0",
                            transform: "rotate(90deg)",
                            transformOrigin: "0 0",
                            maxWidth: "none",
                            objectFit: "fill",
                          }}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "0.2mm",
                        backgroundColor: "#fff",
                        zIndex: 5,
                      }}
                    />

                    <div
                      className="w-full flex-1"
                      style={{ backgroundColor: slot.hookColor }}
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition no-print flex flex-col items-center justify-start pt-10 gap-4 z-30">
                      <button
                        onClick={() => onCopyByCard(globalIndex)}
                        className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:scale-110"
                      >
                        <Copy size={20} />
                      </button>
                      <button
                        onClick={() => onClone(globalIndex)}
                        className="bg-emerald-600 text-white p-4 rounded-full shadow-xl hover:scale-110"
                      >
                        <Plus size={20} />
                      </button>
                      {slot.isMasterColor && (
                        <div className="relative">
                          <button className="bg-violet-600 text-white p-4 rounded-full shadow-xl">
                            <Palette size={20} />
                          </button>
                          <input
                            type="color"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            value={slot.hookColor}
                            onChange={(e) =>
                              onColorChange(slot.id, e.target.value)
                            }
                          />
                        </div>
                      )}
                      <button
                        onClick={() => onRemove(globalIndex)}
                        className="bg-red-600 text-white p-4 rounded-full shadow-xl mt-6"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-gray-300 font-bold rotate-90 h-full flex items-center justify-center no-print uppercase tracking-widest">
                    KOSONG
                  </div>
                )}
              </div>
              <div className="mt-2 font-black text-[10px] text-gray-400 no-print">
                #{globalIndex + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

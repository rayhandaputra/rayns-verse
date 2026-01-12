import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
// import type { MetaFunction } from "@remix-run/node"; // Remix specific
import {
  Printer,
  AlertCircle,
  FolderOpen,
  Layers,
  Plus,
  X as CloseIcon,
  Eraser,
  Copy,
  Trash2,
  Check,
  Palette,
} from "lucide-react";

// Assuming these hook paths exist in your project structure
import { useFetcherData } from "~/hooks";
import { nexus } from "~/lib/nexus-client";
import type { ActionFunction, MetaFunction } from "react-router";
import { safeParseArray } from "~/lib/utils";
import { API } from "~/lib/api";
import { requireAuth } from "~/lib/session.server";
import { toast } from "sonner";
import moment from "moment";

// --- Types & Interfaces ---

export const meta: MetaFunction = () => {
  return [{ title: "Cetak Antrean - Nexus" }];
};

type PrintCategory = "idcard" | "lanyard" | "prod3";
type PrintStatus = "Belum" | "Selesai";

interface DriveItem {
  id: string;
  parentId: string;
  name: string;
  type: "folder" | "file";
  data?: string; // Base64 string or URL
}

interface OrderItem {
  product_name?: string; // Sesuaikan dengan snake_case API jika perlu
  variant_name?: string; // Ubah dari variationName ke variant_name
}

interface Order {
  id: string;
  institution_name: string; // TAMBAHKAN INI
  order_number: string;
  status_printed: PrintStatus;
  created_on: string; // ISO Date string
  order_items?: OrderItem[];
  order_upload_folders?: any[];
  driveFolderId?: string;
}

interface PrintSlot {
  id: string;
  fileId: string;
  fileName: string;
  order_number: string;
  parentId: string;
  data?: string;
  qtyNeeded: number;
  hookColor: string;
  isMasterColor: boolean;
}

// Unified State Interface
interface PrintPageState {
  category: PrintCategory;
  slots: PrintSlot[]; // For ID Cards
  lanyardSlots: PrintSlot[]; // For Lanyards
}

// --- Helper Components (Modularized) ---
export const action: ActionFunction = async ({ request }) => {
  const { user, token }: any = await requireAuth(request);
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    if (action === "update_status") {
      const { id, status } = Object.fromEntries(formData.entries());

      const payload = {
        id,
        status_printed: status,
      };
      console.log(payload);

      // Only update if valid
      const res = await API.ORDERS.update({
        session: { user, token },
        req: {
          body: payload,
        },
      });
      return Response.json({
        success: res.success,
        message: res.success
          ? "Berhasil memperbarui Status Cetak"
          : "Gagal memperbarui Status Cetak",
      });
    }

    return Response.json({ success: false, message: "Unknown intent" });
  } catch (error: any) {
    console.error("Finance action error:", error);
    return Response.json({
      success: false,
      message: error.message || "An error occurred",
    });
  }
};

// 1. A4 Sheet Renderer (ID Cards)
const A4Sheet: React.FC<{
  pageSlots: PrintSlot[];
  pageIndex: number;
  onRemove: (globalIndex: number) => void;
}> = ({ pageSlots, pageIndex, onRemove }) => {
  const cmyColors = ["#00FFFF", "#FF00FF", "#FFFF00"];

  return (
    <div
      className="a4-sheet bg-white shadow-2xl mx-auto border border-gray-200 relative mb-12 overflow-hidden print:shadow-none print:border-0 print:m-0"
      style={{
        width: "210mm",
        height: "297mm",
        breakAfter: "always",
      }}
    >
      <div className="absolute top-[3.8mm] left-1/2 -translate-x-1/2 text-black font-extrabold text-[8px] no-print">
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
                /* TAMBAHKAN class 'group' di sini untuk mendeteksi hover */
                className={`group relative flex items-center justify-center overflow-hidden ${
                  slot
                    ? "bg-white"
                    : "bg-gray-50 border border-dashed border-gray-200"
                }`}
                style={{
                  width: "56mm",
                  height: "88mm",
                  outline: "2px solid #d4d4d4",
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
                  /* Gunakan opacity-0 group-hover:opacity-100 dan no-print */
                  <button
                    onClick={() => onRemove(globalIdx)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity no-print shadow-md"
                  >
                    <CloseIcon size={12} />
                  </button>
                )}
              </div>
              <div
                className="font-black"
                style={{
                  color: cmyColors[localIndex % 3],
                  fontSize: "9px",
                  marginTop: "-0.5mm",
                }}
              >
                {globalIdx + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 2. Lanyard Sheet Renderer
const LanyardSheet: React.FC<{
  pageSlots: PrintSlot[];
  pageIndex: number;
  onRemove: (index: number) => void;
  onClone: (index: number) => void;
  onCopyByCard: (index: number) => void;
  onColorChange: (id: string, color: string) => void;
}> = ({
  pageSlots,
  pageIndex,
  onRemove,
  onClone,
  onCopyByCard,
  onColorChange,
}) => {
  return (
    <div
      className="lanyard-sheet bg-white shadow-2xl mx-auto border border-gray-200 relative mb-20 overflow-hidden print:shadow-none print:border-0 print:m-0"
      style={{ width: "21cm", height: "103.2cm", paddingTop: "15mm" }}
    >
      <div className="flex justify-center" style={{ gap: "12px" }}>
        {Array.from({ length: 8 }).map((_, idx) => {
          const globalIndex = pageIndex * 8 + idx;
          const slot = pageSlots[idx];

          return (
            <div key={idx} className="flex flex-col items-center">
              <div
                className={`relative bg-gray-50 flex flex-col items-center overflow-hidden ${
                  slot ? "bg-white" : "border border-dashed border-gray-200"
                }`}
                style={{
                  width: "2.2cm",
                  height: "100.2cm",
                  boxSizing: "content-box",
                }}
              >
                {slot ? (
                  <div className="w-full h-full relative group flex flex-col">
                    <div
                      className="relative overflow-hidden bg-white"
                      style={{ width: "2.2cm", height: "90cm" }}
                    >
                      {slot.data && (
                        <img
                          src={slot.data}
                          alt="Lanyard Design"
                          className="absolute"
                          style={{
                            width: "90cm",
                            height: "2.2cm",
                            objectFit: "fill",
                            left: "2.2cm",
                            top: "0",
                            transform: "rotate(90deg)",
                            transformOrigin: "0 0",
                            maxWidth: "none",
                          }}
                        />
                      )}
                    </div>
                    {/* Fold Line */}
                    <div
                      style={{
                        width: "2.2cm",
                        height: "2px",
                        backgroundColor: "#000",
                        zIndex: 5,
                      }}
                    ></div>
                    {/* Hook Color Area */}
                    <div
                      className="relative overflow-hidden transition-all border-x-2 border-transparent"
                      style={{
                        width: "2.2cm",
                        height: "10cm",
                        backgroundColor: slot.hookColor,
                      }}
                    ></div>

                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition no-print flex flex-col items-center justify-start pt-10 gap-4 z-30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyByCard(globalIndex);
                        }}
                        className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:scale-110 active:scale-95 transition flex items-center justify-center"
                        title="Salin Sesuai ID Card"
                      >
                        <Copy size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClone(globalIndex);
                        }}
                        className="bg-emerald-600 text-white p-4 rounded-full shadow-xl hover:scale-110 active:scale-95 transition flex items-center justify-center"
                        title="Tambah Manual"
                      >
                        <Plus size={20} />
                      </button>

                      {slot.isMasterColor && (
                        <div className="relative group/color">
                          <button
                            className="bg-violet-600 text-white p-4 rounded-full shadow-xl hover:scale-110 active:scale-95 transition flex items-center justify-center"
                            title="Ubah Warna Hook"
                          >
                            <Palette size={20} />
                          </button>
                          <input
                            type="color"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            value={slot.hookColor}
                            onChange={(e) =>
                              onColorChange(slot.id, e.target.value)
                            }
                          />
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(globalIndex);
                        }}
                        className="bg-red-600 text-white p-4 rounded-full shadow-xl hover:scale-110 active:scale-95 transition flex items-center justify-center mt-6"
                        title="Hapus"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-300 font-bold rotate-90 h-full flex items-center no-print uppercase tracking-widest">
                    KOSONG
                  </div>
                )}
              </div>
              <div className="mt-2 font-black text-gray-400 text-xs no-print">
                #{idx + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function PrintPage() {
  // 1. Unified State
  const [state, setState] = useState<PrintPageState>({
    category: "idcard",
    slots: [],
    lanyardSlots: [],
  });
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [PrintButton, setPrintButton] =
    useState<React.ComponentType<any> | null>(null);
  const [client, setClient] = useState<boolean>(false);
  useEffect(() => {
    setClient(true);
  }, []);
  useEffect(() => {
    if (!client) return;
    import("~/components/PrintButton.client").then((mod) =>
      setPrintButton(() => mod.PrintButton)
    );
  }, [client]);

  const A4PageStyle = `@media print {
                @page {
                    /* Mengubah ukuran menjadi A4 */
                    size: A4; 
                    /* Margin standar untuk A4 biasanya 10mm - 20mm, 
                      tapi jika butuh full page, gunakan 0mm */
                    margin: 0mm; 
                }
                .page {
                    page-break-after: always;
                }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            `;
  const lanyardPageStyle = `
  @media print {
    @page {
      /* Mengatur ukuran kertas sesuai dimensi Lanyard Sheet Anda */
      /* Width: 21cm, Height: 103.2cm */
      size: 210mm 1032mm;
      margin: 0;
    }

    button,
    .no-print,
    svg:not(.print-include) {
      display: none !important;
    }
    
    body {
      margin: 0;
      padding: 0;
      background: white;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Memastikan kontainer utama tidak memiliki padding/margin saat cetak */
    .print-area {
      padding: 0 !important;
      margin: 0 !important;
      width: 210mm !important;
    }

    /* Elemen LanyardSheet itu sendiri */
    .lanyard-sheet {
      width: 210mm !important;
      height: 1032mm !important;
      padding-top: 15mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      border: none !important;
      break-after: page; /* Memaksa setiap lembar lanyard jadi halaman baru */
    }

    /* Sembunyikan elemen UI yang tidak perlu */
    .no-print {
      display: none !important;
    }
  }
`;

  // Placeholder for Drive Items (as per original logic where it was defined as [])
  // In a real scenario, this should likely come from the useFetcherData or props.
  const driveItems: DriveItem[] = [];

  // 2. Data Fetching
  const { data: getOrders, reload: reloadOrders } = useFetcherData({
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
        ...(state?.category === "idcard"
          ? { filter_folder: "id_card_front,id_card_back" }
          : state?.category === "lanyard"
            ? { filter_folder: "lanyard" }
            : {}),
      })
      .build(),
  });

  const orders: Order[] = (getOrders?.data?.items as Order[]) || [];

  // 3. Actions & Handlers
  const { data: actionData, load: submitAction } = useFetcherData({
    endpoint: "",
    method: "POST",
    autoLoad: false,
  });

  useEffect(() => {
    if (actionData?.success) {
      reloadOrders();
      toast.success(
        actionData?.message || actionData?.error_message || "Berhasil"
      );
    }
  }, [actionData]);

  const onUpdateStatusCetak = useCallback(
    (id: string, status: string) => {
      submitAction({
        action: "update_status",
        id,
        status,
      });
    },
    [submitAction]
  );

  const relevantOrders = orders;

  const getFiles = async (folderId: string) => {
    const response = await API.ORDER_UPLOAD.get_file({
      req: {
        query: {
          folder_id: folderId,
        },
      },
    });
    return response?.items || [];
  };
  const getSingleFolder = async (folderId: string) => {
    const response = await API.ORDER_UPLOAD.get_folder({
      req: {
        query: {
          id: folderId,
        },
      },
    });
    return response?.items?.[0] || null;
  };

  const addFolderToSlots = async (folder: any) => {
    const files = await getFiles(folder.id);
    if (files.length === 0) {
      alert("Folder ini tidak berisi file!");
      return;
    }

    // const targetOrder = orders.find((o) => o.order_number === folder?.order_number);

    const newSlots: PrintSlot[] = files.map((f: any, idx: number) => ({
      id: `${f.id}-${Date.now()}-${Math.random()}`,
      fileId: f.id,
      fileName: f.name,
      order_number: folder?.order_number,
      parentId: folder?.id,
      // data: f.data,
      data: f.file_url,
      qtyNeeded: 1,
      hookColor: "#ffffff",
      isMasterColor: idx === 0,
    }));

    setState((prev) => {
      if (prev.category === "lanyard") {
        return { ...prev, lanyardSlots: [...prev.lanyardSlots, ...newSlots] };
      } else {
        const idCardSlots = newSlots.map((s) => ({
          ...s,
          isMasterColor: false,
        }));
        return { ...prev, slots: [...prev.slots, ...idCardSlots] };
      }
    });
  };

  const removeSlot = (index: number, isLanyard: boolean) => {
    setState((prev) => {
      const list = isLanyard ? [...prev.lanyardSlots] : [...prev.slots];
      list.splice(index, 1);
      return isLanyard
        ? { ...prev, lanyardSlots: list }
        : { ...prev, slots: list };
    });
  };

  const cloneLanyardSlot = (index: number) => {
    setState((prev) => {
      const next = [...prev.lanyardSlots];
      const source = next[index];
      next.splice(index + 1, 0, {
        ...source,
        id: `${source.fileId}-${Date.now()}-${Math.random()}`,
        isMasterColor: false,
      });
      return { ...prev, lanyardSlots: next };
    });
  };

  const copyByCardFileCount = async (index: number) => {
    const source = state.lanyardSlots[index];

    // 1. Cari order yang bersangkutan untuk mendapatkan list folder-nya
    const order = orders.find((o) => o.order_number === source.order_number);
    if (!order) return;

    const allFolders = safeParseArray(order.order_upload_folders);

    // 2. Cari folder ID Card (biasanya yang namanya mengandung 'id card' atau 'depan')
    const cardFolder: any = allFolders.find(
      (f: any) =>
        f.folder_name.toLowerCase().includes("id card") &&
        f.folder_name.toLowerCase().includes("depan")
    );

    if (!cardFolder) {
      toast.error("Folder ID Card (Depan) tidak ditemukan untuk sinkronisasi.");
      return;
    }

    // 3. Ambil jumlah file dari folder tersebut
    const cardFiles = await getFiles(cardFolder?.id);
    if (cardFiles.length === 0) return;

    // 4. Cek varian 2 sisi dari order_items
    const isTwoSided = safeParseArray(order.order_items)?.some((it: any) =>
      it?.variant_name?.toLowerCase().includes("2 sisi")
    );

    const totalToCopy = cardFiles.length * (isTwoSided ? 2 : 1) - 1;
    if (totalToCopy <= 0) return;

    const copies: PrintSlot[] = Array.from({ length: totalToCopy }).map(() => ({
      ...source,
      id: `${source.fileId}-${Date.now()}-${Math.random()}`,
      isMasterColor: false,
    }));

    setState((prev) => {
      const next = [...prev.lanyardSlots];
      next.splice(index + 1, 0, ...copies);
      return { ...prev, lanyardSlots: next };
    });
  };

  const updateSlotColor = (slotId: string, color: string) => {
    setState((prev) => ({
      ...prev,
      lanyardSlots: prev.lanyardSlots.map((s) =>
        s.id === slotId ? { ...s, hookColor: color } : s
      ),
    }));
  };

  const clearAllSlots = () => {
    if (confirm(`Kosongkan antrean cetak ${state.category.toUpperCase()}?`)) {
      setState((prev) => ({
        ...prev,
        lanyardSlots: prev.category === "lanyard" ? [] : prev.lanyardSlots,
        slots:
          prev.category === "idcard" || prev.category === "prod3"
            ? []
            : prev.slots,
      }));
    }
  };

  // --- Page Calculation ---
  const chunkedIDPages = useMemo(() => {
    const pages: PrintSlot[][] = [];
    for (let i = 0; i < state.slots.length; i += 9) {
      pages.push(state.slots.slice(i, i + 9));
    }
    return pages.length > 0 ? pages : [[]];
  }, [state.slots]);

  const chunkedLanyardPages = useMemo(() => {
    const pages: PrintSlot[][] = [];
    for (let i = 0; i < state.lanyardSlots.length; i += 8) {
      pages.push(state.lanyardSlots.slice(i, i + 8));
    }
    return pages.length > 0 ? pages : [[]];
  }, [state.lanyardSlots]);

  const activeQueueCount =
    state.category === "lanyard"
      ? state.lanyardSlots.length
      : state.slots.length;

  return (
    <div className="flex h-[calc(100vh-140px)] overflow-hidden gap-6">
      {/* Sidebar */}
      <aside className="w-80 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-shrink-0 no-print">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Layers size={18} className="text-blue-600" /> Sumber Cetak
          </h3>
          <button
            onClick={clearAllSlots}
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
              onClick={() => setState((prev) => ({ ...prev, category: cat }))}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded transition uppercase ${
                state.category === cat
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
          {state.category !== "prod3" ? (
            relevantOrders.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs italic">
                Tidak ada pesanan aktif
              </div>
            ) : (
              relevantOrders.map((order) => {
                // const subs = getSubFolders(order.driveFolderId);
                const subs = safeParseArray(order?.order_upload_folders);
                // if (subs.length === 0) return null;
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
                            onUpdateStatusCetak(order.id, "done");
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
                          onClick={() => addFolderToSlots(sub)}
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
          {/* <button
            onClick={handlePrint}
            disabled={activeQueueCount === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg transition disabled:opacity-50"
          >
            <Printer size={18} /> CETAK {state.category.toUpperCase()}
          </button> */}
          {PrintButton ? (
            <PrintButton
              externalRef={printAreaRef}
              label={`Cetak ${state.category.toUpperCase()} - ${moment().format("DDMMYYYYHHmmss")}`}
              pageStyle={
                state.category === "lanyard" ? lanyardPageStyle : A4PageStyle
              }
            >
              {({ handlePrint }: any) => (
                <button
                  onClick={handlePrint}
                  disabled={activeQueueCount === 0}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> CETAK {state.category.toUpperCase()}
                </button>
              )}
            </PrintButton>
          ) : (
            <button disabled className="...">
              Loading...
            </button>
          )}
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 bg-gray-100 rounded-xl border border-gray-200 shadow-inner overflow-y-auto p-10 flex flex-col items-center custom-print-scroll">
        <div ref={printAreaRef} className="flex flex-col items-center">
          {state.category === "lanyard"
            ? chunkedLanyardPages.map((page, idx) => (
                <LanyardSheet
                  key={idx}
                  pageSlots={page}
                  pageIndex={idx}
                  onRemove={(index) => removeSlot(index, true)}
                  onClone={cloneLanyardSlot}
                  onCopyByCard={copyByCardFileCount}
                  onColorChange={updateSlotColor}
                />
              ))
            : chunkedIDPages.map((page, idx) => (
                <A4Sheet
                  key={idx}
                  pageSlots={page}
                  pageIndex={idx}
                  onRemove={(index) => removeSlot(index, false)}
                />
              ))}
        </div>
        <div className="mt-4 text-center text-gray-400 text-[10px] font-medium max-w-sm pb-10 no-print">
          Lanyard: Ikon <b>Palette</b> hanya aktif di lanyard pertama setiap
          folder. Klik tombol <b>DONE</b> di sidebar untuk menghapus pesanan
          dari antrean cetak.
        </div>
      </main>
    </div>
  );
}

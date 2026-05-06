import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { API } from "~/nexus";
import { safeParseArray } from "~/utils/utils";
import { type PrintCategory, type PrintSlot, type PrintOrder, type PrintPageState } from "~/types/print";

export function usePrintSlots() {
  const [state, setState] = useState<PrintPageState>({
    category: "idcard",
    slots: [],
    lanyardSlots: [],
  });

  const getFiles = async (folderId: string) => {
    const response = await API.ORDER_UPLOAD.get_file({
      req: {
        query: {
          size: 100,
          folder_id: folderId,
        },
      },
    });
    return response?.items || [];
  };

  const addFolderToSlots = async (folder: any) => {
    const files = await getFiles(folder.id);
    if (files.length === 0) {
      toast.error("Folder ini tidak berisi file!");
      return;
    }

    const isBelakang = folder.folder_name?.toLowerCase().includes("belakang");

    const newSlots: PrintSlot[] = files.map((f: any, idx: number) => ({
      id: `${f.id}-${Date.now()}-${Math.random()}`,
      fileId: f.id,
      fileName: f.name,
      order_number: folder?.order_number,
      parentId: folder?.id,
      data: f.file_url,
      qtyNeeded: 1,
      hookColor: "#ffffff",
      isMasterColor: idx === 0,
      side: 1,
      isBack: isBelakang,
    }));

    setState((prev) => {
      if (prev.category === "lanyard") {
        return { ...prev, lanyardSlots: [...prev.lanyardSlots, ...newSlots] };
      } else {
        return { ...prev, slots: [...prev.slots, ...newSlots] };
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

  const cloneSlot = (index: number, isLanyard: boolean) => {
    setState((prev) => {
      const list = isLanyard ? [...prev.lanyardSlots] : [...prev.slots];
      const source = list[index];
      list.splice(index + 1, 0, {
        ...source,
        id: `${source.fileId}-${Date.now()}-${Math.random()}`,
        isMasterColor: false,
      });
      return isLanyard
        ? { ...prev, lanyardSlots: list }
        : { ...prev, slots: list };
    });
  };

  const copyByCardFileCount = async (index: number, orders: PrintOrder[]) => {
    const source = state.lanyardSlots[index];
    const order = orders.find((o) => o.order_number === source.order_number);
    if (!order) return;

    const allFolders = safeParseArray(order.order_upload_folders);
    const cardFolder: any = allFolders.find(
      (f: any) =>
        f.folder_name.toLowerCase().includes("id card") &&
        (f.folder_name.toLowerCase().includes("depan") ||
          !f.folder_name.toLowerCase().includes("belakang"))
    );

    if (!cardFolder) {
      toast.error("Folder ID Card (Depan) tidak ditemukan untuk referensi jumlah.");
      return;
    }

    const cardFiles = await getFiles(cardFolder?.id);
    const count = cardFiles.length;

    if (count === 0) return;

    const isTwoSided = safeParseArray(order.order_items)?.some((it: any) =>
      it?.variant_name?.toLowerCase().includes("2 sisi")
    );

    const copies: PrintSlot[] = [];
    for (let i = 0; i < count; i++) {
      copies.push({
        ...source,
        id: `${source.fileId}-s1-${i}-${Date.now()}`,
        isMasterColor: false,
        side: 1,
      });
    }

    if (isTwoSided) {
      for (let i = 0; i < count; i++) {
        copies.push({
          ...source,
          id: `${source.fileId}-s2-${i}-${Date.now()}`,
          isMasterColor: false,
          side: 2,
        });
      }
    }

    setState((prev) => {
      const next = [...prev.lanyardSlots];
      next.splice(index, 1, ...copies);
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

  const setCategory = (category: PrintCategory) => {
    setState((prev) => ({ ...prev, category }));
  };

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

  return {
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
  };
}

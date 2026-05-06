export type PrintCategory = "idcard" | "lanyard" | "prod3";
export type PrintStatus = "Belum" | "Selesai" | "waiting" | "done";

export interface PrintSlot {
  id: string;
  fileId: string;
  fileName: string;
  order_number: string;
  parentId: string;
  data?: string; // URL Image
  qtyNeeded: number;
  hookColor: string;
  isMasterColor: boolean;
  side?: 1 | 2;
  isBack?: boolean;
}

export interface PrintOrder {
  id: string;
  institution_name: string;
  order_number: string;
  status_printed: string;
  created_on: string;
  order_items?: any[];
  order_upload_folders?: any[];
  driveFolderId?: string;
}

export interface PrintPageState {
  category: PrintCategory;
  slots: PrintSlot[];
  lanyardSlots: PrintSlot[];
}

export interface StockState {
  [key: string]: number;
}

export interface StockLastUpdate {
  [key: string]: string; // ISO Date string
}

export interface PriceList {
  [key: string]: number;
}

export interface ShopList {
  [key: string]: string;
}

export interface KKNDetails {
  periode: string;
  tahun: string;
  tipe: "PPM" | "Tematik";
  nilai: string; // Nomor kelompok or Nama Desa
}

export interface CustomItem {
  name: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: "Id Card" | "Lanyard" | "Paket" | "Lainnya";
  description?: string;
}

export interface Order {
  id: string;
  instansi: string;
  singkatan: string;
  jenisPesanan: string;
  jumlah: number;
  deadline: string;
  statusPembayaran: "Tidak Ada" | "DP" | "Lunas";
  dpAmount: number;
  domain: string;
  accessCode: string;
  statusPengerjaan: "pending" | "sedang dikerjakan" | "selesai";
  finishedAt: string | null;
  unitPrice: number;
  totalAmount: number;
  createdAt: string;

  // KKN Specifics
  isKKN?: boolean;
  kknDetails?: KKNDetails;
  pjName?: string;
  pjPhone?: string;
  customItems?: CustomItem[];

  // Drive Integration
  driveFolderId?: string;

  // Portfolio & Landing Page
  isPortfolio?: boolean;
  portfolioImages?: string[]; // Base64 strings
  review?: string;
  rating?: number; // 1-5
}

export interface HistoryEntry {
  name: string;
  abbr: string;
  domainBase: string;
  orderCount: number;
}

export interface DriveItem {
  id: string;
  parentId: string | null; // null is Root
  name: string;
  type: "folder" | "file";
  size?: string;
  mimeType?: string;
  createdAt: string;
}

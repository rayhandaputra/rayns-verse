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

export interface ProductTier {
  minQty: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number; // Base price (qty 1)
  wholesalePrices?: ProductTier[]; // Tiered pricing
  category: "Id Card" | "Lanyard" | "Paket" | "Lainnya";
  description?: string;
  image?: string; // Base64 string for product image
  showInDashboard?: boolean; // Toggle visibility on landing page
}

// export interface Product {
//   id: string;
//   name: string;
//   price: number;
//   category: "Id Card" | "Lanyard" | "Paket" | "Lainnya";
//   description?: string;
// }

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
  is_portfolio?: boolean;
  portfolioImages?: string[]; // Base64 strings
  review?: string;
  rating?: number; // 1-5
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // Unit price at the time of order
  total: number;
  note?: string;
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

// --- NEW TYPES FOR V5 ---

export interface User {
  id: string;
  username: string;
  password: string; // Plaintext for demo, hash in real app
  name: string;
  role: "CEO" | "Staff" | "Developer";
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  baseSalary: number; // Gaji Pokok
  allowance: number; // Tunjangan/Bonus per hari/bulan
  status: "Active" | "Inactive";
  attendanceToday?: {
    status: "Hadir" | "Izin" | "Alpha";
    timeIn?: string;
    location?: string;
    photo?: string;
  };
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  value: number;
  status: "Good" | "Damaged" | "Maintenance";
  location: string;
  unit?: number;
}

export interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  tag: "Inbox" | "Sent" | "Spam";
}

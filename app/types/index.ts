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

export interface ProductVariation {
  id?: string;
  variant_name: string;
  base_price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number; // Base price (qty 1)
  product_price_rules?: ProductTier[]; // Tiered pricing
  product_variants?: ProductVariation[]; // NEW: Product Variations
  category: "Id Card" | "Lanyard" | "Paket" | "Lainnya";
  description?: string;
  image?: any; // Base64 string for product image
  images: string[]; // Base64 string for product image
  show_in_dashboard?: boolean; // Toggle visibility on landing page
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
  is_kkn?: boolean;
  is_sponsor?: boolean;
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

  // API snake_case properties (from backend/Supabase)
  order_number?: string;
  institution_name?: string;
  pic_name?: string;
  pic_phone?: string;
  total_amount?: number;
  dp_amount?: number;
  created_on?: string;
  status?: string;
  payment_status?: string;
  payment_proof?: string;
  dp_payment_proof?: string;
  order_items?: any;
  items?: OrderItem[];
  pemesanName?: string;
  pemesanPhone?: string;
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

// --- NEW SETTINGS & FINANCE TYPES ---

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
}

export interface AppSettings {
  headerBackground?: string; // Base64 image for Hero & Nota
}

export interface AttendanceRecord {
  status: "Hadir";
  timeIn: string;
  location: string;
  photo: string;
}

// export interface Employee {
//   id: string;
//   name: string;
//   role: string;
//   phone: string;
//   status: string;
//   attendanceToday?: AttendanceRecord;
//   baseSalary: number;
//   allowance: number;
// }

// --- NEW MATERIAL TYPES ---
export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  shopId: string;
  category: string; // e.g. "Tinta", "Kertas", "Aksesoris"
  stockKey: string; // Key used in StockState (e.g., 'tinta_ml')
}

export interface Transaction {
  id: string;
  date: string;
  type: "Income" | "Expense";
  category: string; // e.g. "Gaji", "Bahan Baku", "Operasional", "Penjualan"
  amount: number;
  description: string;
  isAuto?: boolean; // If true, generated from Order/Salary logic
  proofImage?: string; // Base64 image
  bankId?: string; // Bank ID or Name
}


export interface DesignRule {
  id: string;
  type: 'photo' | 'text' | 'logo' | 'dropdown';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily?: string;
  fontColor?: string;
  options?: string[]; // Untuk tipe dropdown/jabatan
}

export interface DesignTemplate {
  id: string;
  name: string;
  category: 'idcard' | 'lanyard';
  baseImage: string;
  rules: DesignRule[];
  styleMode?: 'dynamic' | 'static'; // New property
  createdAt: string;
}

export interface TwibbonValue {
  ruleId: string;
  value: string;
}

export interface TwibbonEntry {
  id: string;
  templateId: string;
  values: TwibbonValue[];
  createdAt: string;
}

export interface TwibbonAssignment {
  id: string;
  templateId: string;
  type: 'idcard' | 'lanyard';
}
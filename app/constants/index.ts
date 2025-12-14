import type { Product, Order } from "../types";

// Physics & Math Constants from HTML
export const AREA_PAKET = 0.053856;
export const P_WASTE = 2;
export const P_CLEAN = 0.5;
export const P_ML_M2 = 15;
export const CM_PER_LANYARD = 26.25;
export const TAPE_CM_PER_ROLL = 3300;
export const ROLL_CM = 10000;
export const A4_PER_PAKET = 2 / 9;
export const RIVET_PER_PAKET = 4;
export const RIVET_PER_LANYARD = 4;
export const LANYARD_PER_ROLL = 45; // roll 50 yard approx
export const INK_SET_ML = 4000;
export const PLASTIC_SMALL_CAP = 20;
export const PLASTIC_MED_CAP = 50;
export const PLASTIC_BIG_CAP = 100;
export const PLASTIC_PACK = 500;

// Admin & Location Constants
export const ADMIN_WA = "628521933747";
export const LOCATION_COORDS = {
  lat: -5.370928303834815,
  lng: 105.29254187016355,
};

export const INITIAL_STOCK = {
  tinta_ml: 2500,
  roll_100m: 10,
  a4_sheets: 500,
  tape_roll: 20,
  lanyard_roll: 5,
  lanyard_pcs: 200,
  pvc_pcs: 1000,
  case_pcs: 500,
  kait_pcs: 1000,
  stopper_pcs: 1000,
  rivet_pcs: 5000,
  plastic_small_pcs: 500,
  plastic_med_pcs: 500,
  plastic_big_pcs: 500,
};

export const INITIAL_PRICES = {
  ink_set: 1520000,
  roll_100m: 120000,
  a4_pack: 40000,
  tape_roll: 12400,
  pvc_pack: 180000,
  case_unit: 450,
  kait_unit: 530,
  lanyard_roll: 36000,
  stopper_pack: 15250,
  rivet_pack: 72000,
  plastic_small_unit: 320,
  plastic_med_unit: 534,
  plastic_big_unit: 924,
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Paket Lengkap (ID + Lanyard)",
    price: 20000,
    category: "Paket",
    description: "ID Card PVC, Casing, Lanyard Printing 2 Sisi",
  },
  {
    id: "2",
    name: "ID Card Saja",
    price: 10000,
    category: "Id Card",
    description: "Hanya kartu PVC tebal berkualitas",
  },
  {
    id: "3",
    name: "Lanyard Printing",
    price: 12000,
    category: "Lanyard",
    description: "Tali lanyard tissue printing 2 sisi + Stopper",
  },
  {
    id: "4",
    name: "Paket Hemat (ID + Tali Polos)",
    price: 15000,
    category: "Paket",
    description: "ID Card PVC + Tali lanyard warna polos",
  },
];

// --- SEED DATA ORDERS ---
export const INITIAL_ORDERS: Order[] = [
  {
    id: "ord-001",
    instansi: "Himpunan Mahasiswa Informatika",
    singkatan: "HMIF",
    jenisPesanan: "Lanyard Printing",
    jumlah: 150,
    deadline: "2023-11-20",
    statusPembayaran: "Lunas",
    dpAmount: 1800000,
    domain: "kinau.id/HMIF23",
    accessCode: "HMIF23",
    statusPengerjaan: "selesai",
    finishedAt: "2023-11-18T10:00:00.000Z",
    unitPrice: 12000,
    totalAmount: 1800000,
    createdAt: "2023-11-01T08:00:00.000Z",
    isPortfolio: true,
    rating: 5,
    review:
      "Hasil cetakan sangat tajam, bahan lanyard lembut dan nyaman dipakai. Recommended banget buat event kampus!",
    portfolioImages: [
      "https://images.unsplash.com/photo-1622675363311-ac97f3a9a309?w=400&q=80",
    ],
  },
  {
    id: "ord-002",
    instansi: "BEM Institut Teknologi Sumatera",
    singkatan: "BEM ITERA",
    jenisPesanan: "Paket Lengkap (ID + Lanyard)",
    jumlah: 80,
    deadline: "2024-01-15",
    statusPembayaran: "Lunas",
    dpAmount: 1600000,
    domain: "kinau.id/BEMITERA",
    accessCode: "ITERA1",
    statusPengerjaan: "selesai",
    finishedAt: "2024-01-14T14:30:00.000Z",
    unitPrice: 20000,
    totalAmount: 1600000,
    createdAt: "2024-01-05T09:00:00.000Z",
    isPortfolio: true,
    rating: 5,
    review:
      "Pelayanan cepat dan ramah. Desain dibantu sampai fix. Mantap Kinau!",
    portfolioImages: [
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80",
    ],
  },
  {
    id: "ord-003",
    instansi: "Festival Musik Kampus (Sponsor)",
    singkatan: "FESTMUS",
    jenisPesanan: "Lanyard Printing",
    jumlah: 50,
    deadline: "2024-02-10",
    statusPembayaran: "Lunas",
    dpAmount: 0, // Sponsor
    domain: "kinau.id/SPONSOR1",
    accessCode: "SPNSR1",
    statusPengerjaan: "selesai",
    finishedAt: "2024-02-08T11:00:00.000Z",
    unitPrice: 0,
    totalAmount: 0,
    createdAt: "2024-01-20T10:00:00.000Z",
    isPortfolio: true,
    rating: 5,
    review:
      "Terima kasih Kinau sudah support event kami sebagai Media Partner. Kualitas juara!",
    portfolioImages: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80",
    ],
  },
  {
    id: "ord-004",
    instansi: "Dinas Pendidikan Prov. Lampung",
    singkatan: "DISDIK",
    jenisPesanan: "ID Card Saja",
    jumlah: 200,
    deadline: "2024-03-01",
    statusPembayaran: "DP",
    dpAmount: 1000000,
    domain: "kinau.id/DISDIK",
    accessCode: "DDIK01",
    statusPengerjaan: "selesai",
    finishedAt: "2024-02-28T16:00:00.000Z",
    unitPrice: 10000,
    totalAmount: 2000000,
    createdAt: "2024-02-15T08:30:00.000Z",
    isPortfolio: false,
    rating: 4,
    review: "Pengerjaan tepat waktu sesuai deadline.",
  },
  {
    id: "ord-005",
    instansi: "Seminar Nasional Teknologi (Media Partner)",
    singkatan: "SEMNASTEK",
    jenisPesanan: "Paket Lengkap (ID + Lanyard)",
    jumlah: 30,
    deadline: "2024-04-12",
    statusPembayaran: "Lunas",
    dpAmount: 0,
    domain: "kinau.id/SPONSOR2",
    accessCode: "SPNSR2",
    statusPengerjaan: "selesai",
    finishedAt: "2024-04-10T09:00:00.000Z",
    unitPrice: 0,
    totalAmount: 0,
    createdAt: "2024-03-25T13:00:00.000Z",
    isPortfolio: true,
    rating: 5,
    review: "Kerja sama yang luar biasa. Sukses terus buat Kinau.id",
    portfolioImages: [
      "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=400&q=80",
    ],
  },
  {
    id: "ord-006",
    instansi: "Komunitas Fotografi Lampung",
    singkatan: "KFL",
    jenisPesanan: "Lanyard Printing",
    jumlah: 25,
    deadline: "2024-05-20",
    statusPembayaran: "Lunas",
    dpAmount: 300000,
    domain: "kinau.id/KFL",
    accessCode: "KFL001",
    statusPengerjaan: "selesai",
    finishedAt: "2024-05-18T15:00:00.000Z",
    unitPrice: 12000,
    totalAmount: 300000,
    createdAt: "2024-05-10T11:00:00.000Z",
    isPortfolio: true,
    rating: 5,
    review: "Warna lanyard nya keluar banget, detail fotonya dapet. Keren!",
    portfolioImages: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80",
    ],
  },
  {
    id: "ord-007",
    instansi: "PT. Maju Jaya Sejahtera",
    singkatan: "MJS",
    jenisPesanan: "Paket Lengkap (ID + Lanyard)",
    jumlah: 100,
    deadline: "2024-06-30",
    statusPembayaran: "DP",
    dpAmount: 1000000,
    domain: "kinau.id/MJS",
    accessCode: "MJS99",
    statusPengerjaan: "selesai",
    finishedAt: "2024-06-28T14:00:00.000Z",
    unitPrice: 20000,
    totalAmount: 2000000,
    createdAt: "2024-06-15T09:30:00.000Z",
    isPortfolio: false,
  },
  {
    id: "ord-008",
    instansi: "Panitia 17 Agustus Desa (Kerja Sama)",
    singkatan: "HUTRI",
    jenisPesanan: "ID Card Saja",
    jumlah: 40,
    deadline: "2024-08-15",
    statusPembayaran: "Lunas",
    dpAmount: 0,
    domain: "kinau.id/HUTRI79",
    accessCode: "SPNSR3",
    statusPengerjaan: "selesai",
    finishedAt: "2024-08-14T17:00:00.000Z",
    unitPrice: 0,
    totalAmount: 0,
    createdAt: "2024-08-01T10:00:00.000Z",
    isPortfolio: true,
    rating: 5,
    review: "Terbantu banget dengan support ID Card nya. Merdeka!",
    portfolioImages: [
      "https://images.unsplash.com/photo-1531844251246-9a1bfaaeeb9a?w=400&q=80",
    ],
  },
  {
    id: "ord-009",
    instansi: "SMA Negeri 2 Bandar Lampung",
    singkatan: "SMANDA",
    jenisPesanan: "Lanyard Printing",
    jumlah: 300,
    deadline: "2024-10-20",
    statusPembayaran: "DP",
    dpAmount: 1800000,
    domain: "kinau.id/SMANDA",
    accessCode: "SMND2",
    statusPengerjaan: "sedang dikerjakan",
    finishedAt: null,
    unitPrice: 12000,
    totalAmount: 3600000,
    createdAt: "2024-10-01T08:00:00.000Z",
    isPortfolio: false,
  },
  {
    id: "ord-010",
    instansi: "Klinik Sehat Waras",
    singkatan: "KSW",
    jenisPesanan: "ID Card Saja",
    jumlah: 15,
    deadline: "2024-10-25",
    statusPembayaran: "Tidak Ada",
    dpAmount: 0,
    domain: "kinau.id/KSW",
    accessCode: "KSW01",
    statusPengerjaan: "pending",
    finishedAt: null,
    unitPrice: 10000,
    totalAmount: 150000,
    createdAt: "2024-10-18T09:00:00.000Z",
    isPortfolio: false,
  },
];

export const INITIAL_SHOPS = {
  A: "Toko A",
  B: "Toko B",
  C: "Toko C",
  D: "Toko D",
  E: "Toko E",
  F: "Toko F",
  G: "Toko G",
};

export const SHOP_ITEMS_CONFIG: Record<
  string,
  { k: string; label: string; unit: string }[]
> = {
  A: [{ k: "tape_roll", label: "Solasi 33 m (roll)", unit: "roll" }],
  B: [{ k: "roll_100m", label: "Kertas Roll 100 m (roll)", unit: "roll" }],
  C: [{ k: "a4_sheets", label: "Kertas A4 (pack 100 lbr)", unit: "pack" }],
  D: [
    { k: "tinta_cL", label: "Tinta Cyan (liter)", unit: "L" },
    { k: "tinta_mL", label: "Tinta Magenta (liter)", unit: "L" },
    { k: "tinta_yL", label: "Tinta Yellow (liter)", unit: "L" },
    { k: "tinta_kL", label: "Tinta Black (liter)", unit: "L" },
  ],
  E: [{ k: "pvc_pcs", label: "PVC (pack 250 pcs)", unit: "pack" }],
  F: [
    { k: "case_pcs", label: "Case (pack 100 pcs)", unit: "pack" },
    { k: "kait_pcs", label: "Kait (pack 500 pcs)", unit: "pack" },
    { k: "lanyard_roll", label: "Lanyard (roll 50 yd)", unit: "roll" },
    { k: "stopper_pcs", label: "Stopper (pack 120 pcs)", unit: "pack" },
    { k: "rivet_pcs", label: "Rivet (pack 2000 pcs)", unit: "pack" },
  ],
  G: [
    {
      k: "plastic_small_pcs",
      label: "Plastik Kecil (pack 500 pcs)",
      unit: "pack",
    },
    {
      k: "plastic_med_pcs",
      label: "Plastik Sedang (pack 500 pcs)",
      unit: "pack",
    },
    {
      k: "plastic_big_pcs",
      label: "Plastik Besar (pack 500 pcs)",
      unit: "pack",
    },
  ],
};

// --- Helpers ---

export const generateAccessCode = (length = 6) => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const formatCurrency = (n: number) => {
  return (
    "Rp " +
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n)
  );
};

export const parseCurrency = (str: string) => {
  if (!str) return 0;
  return Number(String(str).replace(/[^0-9]/g, "")) || 0;
};

// Deprecated in favor of dynamic Product List, but kept for fallback
export const getUnitPrice = (q: number) => {
  if (q >= 100) return 13000;
  if (q >= 8) return 15000;
  return 20000;
};

export const slugifyBase = (s: string) => {
  s = (s || "").toLowerCase();
  try {
    s = s.normalize("NFD");
  } catch {}
  s = s.replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
  return s.slice(0, 63);
};

export const formatFullDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const getKKNPeriod = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  // Logic:
  // Juli(6) - Agustus(7) -> Periode 1
  // Desember(11) - Januari(0) -> Periode 2

  if (month >= 5 && month <= 8) {
    return { period: "1", year: String(year) };
  } else {
    const targetYear = month === 11 ? year + 1 : year;
    return { period: "2", year: String(targetYear) };
  }
};

export const formatPhoneNumber = (input: string) => {
  // Normalize to 08... then format to +62 8...
  let clean = input.replace(/\D/g, "");
  if (clean.startsWith("62")) clean = "0" + clean.slice(2);
  if (!clean.startsWith("0")) return input;

  // Expected 085185210893 -> +62 851-8521-0893
  const p1 = clean.slice(1, 4);
  const p2 = clean.slice(4, 8);
  const p3 = clean.slice(8);

  return `+62 ${p1}-${p2}-${p3}`;
};

export const getWhatsAppLink = (formattedPhone: string, text?: string) => {
  const clean = formattedPhone.replace(/\D/g, "");
  const encodedText = text ? `&text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${clean}?${encodedText}`;
};

export const getGoogleMapsLink = () => {
  return `https://www.google.com/maps/search/?api=1&query=${LOCATION_COORDS.lat},${LOCATION_COORDS.lng}`;
};

// Calculations
export function mlPerPaket() {
  return AREA_PAKET * P_ML_M2 * (1 + P_WASTE / 100) + P_CLEAN;
}

export function unitAdd(key: string, qty: number) {
  switch (key) {
    case "tinta_cL":
    case "tinta_mL":
    case "tinta_yL":
    case "tinta_kL":
      return qty * 1000; // liter -> ml
    case "roll_100m":
      return qty;
    case "a4_sheets":
      return qty * 100;
    case "tape_roll":
      return qty;
    case "lanyard_roll":
      return qty;
    case "pvc_pcs":
      return qty * 250;
    case "case_pcs":
      return qty * 100;
    case "kait_pcs":
      return qty * 500;
    case "stopper_pcs":
      return qty * 120;
    case "rivet_pcs":
      return qty * 2000;
    case "plastic_small_pcs":
    case "plastic_med_pcs":
    case "plastic_big_pcs":
      return qty * PLASTIC_PACK; // pack -> pcs
    default:
      return qty;
  }
}

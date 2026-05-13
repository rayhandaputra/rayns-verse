import moment from "moment";
import "moment/locale/id";

export * from "~/utils/utils";

// Additional constants not in utils.ts
export const INITIAL_STOCK = {
  tinta_ml: 0,
  roll_100m: 0,
  a4_sheets: 0,
  tape_roll: 0,
  lanyard_roll: 0,
  lanyard_pcs: 0,
  pvc_pcs: 0,
  case_pcs: 0,
  kait_pcs: 0,
  stopper_pcs: 0,
  rivet_pcs: 0,
  plastic_small_pcs: 0,
  plastic_med_pcs: 0,
  plastic_big_pcs: 0,
};

export const mlPerPaket = () => 100;
export const ROLL_CM = 10000;
export const CM_PER_LANYARD = 38.75;
export const A4_PER_PAKET = 10;
export const TAPE_CM_PER_ROLL = 5000;
export const LANYARD_PER_ROLL = 50;
export const RIVET_PER_PAKET = 100;
export const PLASTIC_SMALL_CAP = 0.01;
export const PLASTIC_MED_CAP = 0.02;
export const PLASTIC_BIG_CAP = 0.04;
export const INK_SET_ML = 1000;

/**
 * Format currency without the "Rp " prefix.
 */
export function formatCurrencyUnprefix(value: number): string {
  if (isNaN(value)) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format date to full Indonesian date (e.g. 05 Mei 2026).
 */
export function formatFullDate(date: string | Date | number): string {
  if (!date) return "-";
  return moment(date).locale("id").format("DD MMMM YYYY");
}

/**
 * Generate a random access code.
 */
// export function generateAccessCode(): string {
//   return Math.random().toString(36).substring(2, 8).toUpperCase();
// }
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
// export const formatCurrencyUnprefix = (n: number) => {
//   return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n)
//     ;
// };

export const formatNumberInput = (val: number | string) => {
  const num = typeof val === "string" ? parseCurrency(val) : val;
  if (!num) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const parseCurrency = (str: string) => {
  if (!str) return 0;
  return Number(String(str).replace(/[^0-9]/g, "")) || 0;
};

/**
 * Logic for unit conversion during restock.
 */
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
  } catch {
    // Fallback for environments where normalize is not available
  }
  s = s.replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
  return s.slice(0, 63);
};

// export const formatFullDate = (dateStr: string) => {
//   if (!dateStr) return "-";
//   const date = new Date(dateStr);
//   if (isNaN(date.getTime())) return dateStr;
//   return date.toLocaleDateString("id-ID", {
//     weekday: "long",
//     day: "numeric",
//     month: "long",
//     year: "numeric",
//   });
// };

export const getKKNPeriod = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  /**
   * Logika Pembagian:
   * Februari (1) s/d Agustus (7) -> Masuk Periode 2 (Tahun berjalan)
   * September (8) s/d Januari (0) -> Masuk Periode 1 (Tahun Januari)
   */

  if (month >= 1 && month <= 7) {
    // Range Februari sampai Agustus
    return {
      period: "2",
      year: String(year),
      label: `KKN ITERA ${year} - PERIODE 2`,
    };
  } else {
    // Range September sampai Januari (Periode 1)
    // Jika sekarang bulan Sept-Des (8-11), maka tahun Januari-nya adalah tahun depan
    const targetYear = month >= 8 ? year + 1 : year;

    return {
      period: "1",
      year: String(targetYear),
      label: `KKN ITERA ${targetYear} - PERIODE 1`,
    };
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

// export const getGoogleMapsLink = () => {
//   return `https://www.google.com/maps/search/?api=1&query=${LOCATION_COORDS.lat},${LOCATION_COORDS.lng}`;
// };

// // Calculations
// export function mlPerPaket() {
//   return AREA_PAKET * P_ML_M2 * (1 + P_WASTE / 100) + P_CLEAN;
// }

export function unitAdd(key: string, qty: number): number {
  switch (key) {
    case "roll_100m":
      return qty * 1;
    default:
      return qty;
  }
}

/**
 * Generate a Google Maps link for given coordinates.
 */
export function getGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export const INITIAL_SHOPS = {
  "Umum": "Umum",
  "Toko 1": "Toko 1",
  "Toko 2": "Toko 2"
};

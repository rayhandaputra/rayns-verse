import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API } from "./api";

export const ADMIN_WA = "6285219337474";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const abbreviation = (text: string) => {
  if (!text) return "-";

  return text
    ?.split(" ")
    .map((word) => word?.[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
};

export const getWhatsAppLink = (formattedPhone: string, text?: string) => {
  const clean = formattedPhone.replace(/\D/g, "");
  const encodedText = text ? `&text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${clean}?${encodedText}`;
};

export const ORDER_TYPE_OPTIONS = [
  { label: "Paket", value: "package" },
  { label: "ID Card", value: "id_card" },
  { label: "Lanyard", value: "lanyard" },
] as const;

export const PAYMENT_TYPE_OPTIONS = [
  { label: "DP", value: "down_payment" },
  { label: "Lunas", value: "paid" },
] as const;

// 👉 Optional: bikin type otomatis dari value
export type OrderType = (typeof ORDER_TYPE_OPTIONS)[number]["value"];
export type PaymentType = (typeof PAYMENT_TYPE_OPTIONS)[number]["value"];

export function getOrderLabel(value: OrderType): string {
  const found = ORDER_TYPE_OPTIONS.find((opt) => opt.value === value);
  return found ? found.label : value;
}

export function getPaymentLabel(value: PaymentType): string {
  const found = PAYMENT_TYPE_OPTIONS.find((opt) => opt.value === value);
  return found ? found.label : value;
}

export function toMoney(value: number, locale: string = "id-ID"): string {
  if (isNaN(value)) return "0";
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export const getPaymentStatusLabel = (status: string) => {
  switch (status) {
    case "none":
      return "Tidak Ada";
    case "paid":
      return "Lunas";
    case "down_payment":
      return "DP";
    case "unpaid":
      return "Belum Dibayar";
    case "cancelled":
      return "Dibatalkan";
    default:
      return "-";
  }
};

export const getOrderStatusLabel = (status: string) => {
  switch (status) {
    case "none":
      return "Tidak Ada";
    case "pending":
      return "Pending";
    case "confirmed":
      return "Diproses";
    case "done":
      return "Selesai";
    default:
      return "-";
  }
};

export const generateShortId = (length = 6) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export function generateProductCode() {
  const random = Math.floor(10000 + Math.random() * 90000); // 10000–99999
  return `PRD${random}`;
}

export function generateDiscountCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

export const uploadFile = async (file: File) => {
  const response = await API.ASSET.upload(file);
  return response.url;
};

export const getMimeType = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext)) return "doc";
  return "file";
};

export const formatWA = (phone: string) => {
  if (!phone) return "";
  // Ambil hanya angka saja
  let cleaned = phone.replace(/\D/g, "");

  // Jika diawali '0', ganti menjadi '62'
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }

  // Jika diawali '8' (tanpa 0/62), tambahkan '62'
  if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }

  return cleaned;
};

export const base64ToFile = (base64String: string, fileName: string): File => {
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], fileName, { type: mime });
};

export const safeParseArray = <T = unknown>(str: unknown): T[] => {
  try {
    const parsed = typeof str === "string" ? JSON.parse(str) : str;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const safeParseObject = <T extends object = object>(
  str: unknown
): T | null => {
  try {
    const parsed = typeof str === "string" ? JSON.parse(str) : str;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as T)
      : null;
  } catch {
    return null;
  }
};

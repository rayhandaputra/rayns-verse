import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
    case "ordered":
      return "Dipesan";
    case "confirmed":
      return "Dikonfirmasi";
    case "in_production":
      return "Produksi";
    case "ready":
      return "Siap";
    case "shipped":
      return "Dikirim";
    case "delivered":
      return "Diterima";
    case "done":
      return "Selesai";
    case "rejected":
      return "Ditolak";
    case "cancelled":
      return "Dibatalkan";
    case "pending":
      return "Menunggu";
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
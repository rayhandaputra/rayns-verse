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

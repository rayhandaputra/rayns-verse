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

import moment from "moment";
import "moment/locale/id";

export function dateFormat(date: string | Date, format?: string) {
  return moment(date)
    .locale("id")
    .format(format ?? "DD MMMM YYYY");
}

/**
 * Format tanggal dengan locale Indonesia
 * @param date - Date | string | number
 * @param options - Intl.DateTimeFormatOptions (opsional)
 * @returns string
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "-";

  const d =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...options, // override kalau mau custom
  }).format(d);
}

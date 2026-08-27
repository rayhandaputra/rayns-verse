import { Order, Supplier } from "./types";

export const isValidUploadedProof = (proof?: unknown) =>
  typeof proof === "string" && proof.includes("data.kinau.web.id");

export const customStyleSelect = {
  control: (baseStyles: any, state: any) => ({
    ...baseStyles,
    borderRadius: "1rem",
    padding: "0.75rem",
    borderWidth: "2px",
    borderColor: state.isFocused ? "#60a5fa" : "#f3f4f6",
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    fontWeight: 900,
    fontSize: "0.875rem",
    "&:hover": { borderColor: "#60a5fa" },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: "1rem",
    overflow: "hidden",
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#60a5fa"
      : state.isFocused
        ? "#eff6ff"
        : "white",
    color: state.isSelected ? "white" : "black",
    fontWeight: 500,
  }),
};

export const calculateProcurementCosts = (
  order: Order | undefined,
  vendor: Supplier | undefined,
) => {
  if (!order || !vendor) return { total: 0, itemsByColor: {} };

  const getUnitPrice = (size: string, sleeve: string) => {
    let base = 0;
    const s = size?.toUpperCase() || "L";
    if (["XS", "S", "M", "L", "XL"].includes(s))
      base = Number(vendor.price_s_xl || 0);
    else if (s === "2XL" || s === "XXL") base = Number(vendor.price_2xl || 0);
    else if (s === "3XL" || s === "XXXL") base = Number(vendor.price_3xl || 0);
    else if (s === "4XL") base = Number(vendor.price_4xl || 0);
    else if (s === "5XL") base = Number(vendor.price_5xl || 0);

    if (sleeve?.toLowerCase() === "panjang")
      base += Number(vendor.price_long_sleeve || 0);
    return base;
  };

  const grouped: Record<string, any[]> = {};
  const details = order.order_items || [];

  details.forEach((item: any) => {
    const size = item.size || "L";
    const sleeve = item.sleeve || "Pendek";
    const uPrice = getUnitPrice(size, sleeve);
    const colorKey = item.color || "Belum Diatur";
    const qty = Number(item.qty || item.quantity || 0);

    if (!grouped[colorKey]) grouped[colorKey] = [];
    grouped[colorKey].push({
      ...item,
      size,
      sleeve,
      quantity: qty,
      price: uPrice,
      total: uPrice * qty,
    });
  });

  let grandTotal = 0;
  Object.values(grouped).forEach((items) =>
    items.forEach((it) => (grandTotal += it.total)),
  );
  return { total: grandTotal, itemsByColor: grouped };
};

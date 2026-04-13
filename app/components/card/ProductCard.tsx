import { MoreVertical } from "lucide-react";
import { Card } from "../ui/card";
// import { Card } from "@/components/ui/card";

export interface ProductCardProps {
  id: string | number;
  name: string;
  sku?: string;
  image?: string | null;
  status?: "Active" | "Inactive" | string;
  price?: string | number;
  fee?: string | number;
  discount?: string | number;
  component?: string | number;
  onMenuClick?: (id: string | number) => void;
}

export default function ProductCard({
  id,
  name,
  sku = "-",
  image,
  status = "Active",
  price = 0,
  fee = 0,
  discount = 0,
  component,
  onMenuClick,
}: ProductCardProps) {
  const statusClass =
    status === "Active"
      ? "bg-green-100 text-green-700"
      : "bg-gray-200 text-gray-700";

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 p-4 border border-gray-100">
      <div className="flex gap-3">
        {/* Image */}
        <div className="w-16 h-16 flex justify-center items-center rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border">
          {image ? (
            <img
              src={image || "https://i.pravatar.cc/80"}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-500">No Image</span>
          )}
        </div>

        {/* Detail */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-base font-semibold truncate">{name}</h2>
              <p className="text-xs text-gray-500 mt-1">SKU: {sku}</p>
            </div>

            {/* Ellipsis Menu Button */}
            <button
              onClick={() => onMenuClick?.(id)}
              className="text-gray-500 hover:text-black p-1 rounded-md"
            >
              <MoreVertical size={18} />
            </button>
          </div>

          {/* Status */}
          <span
            className={`mt-2 inline-block text-xs px-2 py-1 rounded-full ${statusClass}`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div>
          <p className="text-gray-500">Total Biaya</p>
          <p className="font-medium">{fee ?? "-"}</p>
        </div>
        <div>
          <p className="text-gray-500">Total Diskon</p>
          <p className="font-medium">{discount ?? "-"}</p>
        </div>
        <div>
          <p className="text-gray-500">Total Harga</p>
          <p className="font-medium">{price ?? "-"}</p>
        </div>
      </div>

      {/* Stock */}
      <div className="mt-4 text-sm">
        <p className="text-gray-500">Total Komponen</p>
        <p className="text-green-600 font-semibold">{component ?? "-"}</p>
      </div>
    </Card>
  );
}

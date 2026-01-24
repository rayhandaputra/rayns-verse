export interface SubComponent {
  id: string;
  name: string; // mapped from commodity_name in some contexts
  commodity_name?: string;
  capacity_per_unit: number;
  current_stock: number;
  parent_id?: string;
}

export interface RawMaterial {
  id: string;
  commodity_name: string;
  category?: string;
  unit: string;
  unit_price: number;
  supplier_id: string;
  current_stock: number;
  capacity_per_unit: number;
  is_package: number; // 0 or 1
  sub_components: SubComponent[] | string; // Bisa string JSON dari DB
  is_affected_side: number; // 0 or 1
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  type: "online" | "offline";
  phone?: string;
  external_link?: string;
  category: string;
  address?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: "Income" | "Expense";
  category: string;
  amount: number;
  description: string;
  isAuto: boolean;
  proofImage?: string;
  supplier_name?: string;
}

export interface ProductVariation {
  variant_name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  product_variants: ProductVariation[] | string;
}

import { Outlet, Link, useParams, useLocation, useLoaderData } from "react-router";
import { Store, ShoppingCart, Layers, Calculator, Layout, Palette } from "lucide-react";
import type { LoaderFunction } from "react-router";
import { useMemo } from "react";
// import { json, LoaderFunctionArgs } from "@remix-run/node"; // Sesuaikan runtime

export const loader: LoaderFunction = async ({ params }) => {
  // Validasi kategori jika perlu
  return Response.json({ category: params.category });
};

export default function InventoryCategoryLayout() {
  const { category } = useParams();
  const location = useLocation();

  const categories = useMemo(() => ["id_card_with_lanyard", "cotton_combed_premium", "produk_3"], [location?.pathname]);

  const tabs = [
    { id: "shopping", label: "Belanja & Stok", icon: ShoppingCart },
    { id: "supplier", label: "Supplier", icon: Store },
    { id: "component", label: "Komponen Produk", icon: Layers },
    { id: "capacity", label: "Kapasitas & Estimasi", icon: Calculator },
  ];
  const tabsCatalog = [
    { id: "shopping-kaos", label: "Belanja & Stok", icon: ShoppingCart },
    { id: "vendor", label: "Daftar Vendor", icon: Store },
    { id: "catalog-color", label: "Katalog Warna", icon: Palette },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 p-6">
      {/* Category Tabs (Navigasi URL) */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm w-fit overflow-x-auto max-w-full">
        {categories.map((cat) => {
          // Pertahankan sub-path saat ganti kategori
          const currentPath = location.pathname.split('/').pop();

          // Default ke shopping jika root
          let targetTab = tabs.find(t => t.id === currentPath) ? currentPath : 'shopping';
          if (cat === "cotton_combed_premium") {
            targetTab = tabsCatalog.find(t => t.id === currentPath) ? currentPath : 'shopping-kaos';
          }

          return (
            <Link
              key={cat}
              to={`/app/procurement/${cat}/${targetTab}`}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition whitespace-nowrap ${category === cat
                ? "bg-gray-900 text-white shadow-lg"
                : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              <Layout size={18} /> {cat.replace(/_/g, " ").toUpperCase()}
            </Link>
          );
        })}
      </div>

      <div className="space-y-6">
        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-8 overflow-x-auto no-scrollbar">
          {[...(category === "cotton_combed_premium" ? tabsCatalog : tabs)].map((tab) => {
            const isActive = location.pathname.includes(`/${tab.id}`);
            return (
              <Link
                key={tab.id}
                to={`/app/procurement/${category}/${tab.id}`}
                className={`pb-4 text-sm font-bold flex items-center gap-2 transition relative whitespace-nowrap ${isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                <tab.icon size={18} /> {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Render Halaman Child (Shopping, Supplier, dll) */}
        <div className="min-h-[500px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
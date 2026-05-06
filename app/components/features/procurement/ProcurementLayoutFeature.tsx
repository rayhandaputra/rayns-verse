import React, { useMemo } from "react";
import { Outlet, Link, useParams, useLocation } from "react-router";
import { Store, ShoppingCart, Layers, Calculator, Layout, Palette } from "lucide-react";

export default function ProcurementLayoutFeature() {
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
          const pathParts = location.pathname.split('/');
          const currentPath = pathParts.pop();

          const isDisabled = cat === "produk_3";

          let targetTab = tabs.find(t => t.id === currentPath) ? currentPath : 'shopping';
          if (cat === "cotton_combed_premium") {
            targetTab = tabsCatalog.find(t => t.id === currentPath) ? currentPath : 'shopping-kaos';
          }

          return (
            <Link
              key={cat}
              to={isDisabled ? "#" : `/app/procurement/${cat}/${targetTab}`}
              onClick={(e) => isDisabled && e.preventDefault()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition whitespace-nowrap ${isDisabled
                ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                : category === cat
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

        <div className="min-h-[500px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

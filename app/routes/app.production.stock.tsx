// src/routes/StockManagement.tsx
import {
  Package,
  Store,
  PlusCircle,
  LogIn,
  Layers3,
  RefreshCcw,
  PlusCircleIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLoaderData, useNavigate, type LoaderFunction } from "react-router";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import SelectBasic from "~/components/select/SelectBasic";
import { TitleHeader } from "~/components/TitleHedaer";
import { Button } from "~/components/ui/button";
import { useLoader } from "~/hooks/use-loading";
import { API } from "~/lib/api";

export const loader: LoaderFunction = async ({ request, params }) => {
  // const session = await unsealSession(request);
  // const session = await getSession(request);
  // const url = new URL(request.url);
  // const search = url.searchParams.get("q") ?? "";

  try {
    const suppliers = await API.supplier.get({
      session: {},
      req: {},
    });
    const commodity = await API.commodity_stock.get({
      // session,
      session: {},
      req: {
        pagination: "false",
        // page: 0,
        // size: 10,
      } as any,
    });

    return {
      // search,
      // APP_CONFIG: CONFIG,
      suppliers: suppliers?.items,
      table: {
        data: commodity,
        page: 0,
        size: 10,
      },
    };
  } catch (err) {
    console.log(err);
  }
};

export default function StockManagement() {
  const { table, suppliers } = useLoaderData();
  const navigate = useNavigate();
  const [selectedStore, setSelectedStore] = useState("Toko A");

  const listSupplier = useMemo(() => {
    return (
      suppliers?.map((v: any) => ({
        ...v,
        value: v?.id,
        label: v?.name,
      })) ?? []
    );
  }, [suppliers]);

  return (
    <div className="flex flex-col h-full w-full">
      <TitleHeader
        title="Manajemen Stok"
        description="Kelola dan pantau stok bahan produksi."
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Produksi", href: "/app/production" },
              { label: "Manajemen Stok", active: true },
            ]}
          />
        }
        actions={
          <Button
            className="bg-blue-700 hover:bg-blue-600 text-white"
            onClick={() => navigate(`/app/production/restock`)}
          >
            <PlusCircleIcon className="w-4" />
            Restock
          </Button>
        }
      />

      {/* Header */}
      {/* <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Layers3 className="w-6 h-6 text-blue-500" />
          Manajemen Stok
        </h1>
        <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">
          <PlusCircle className="w-5 h-5" />
          Restock
        </button>
      </div> */}

      {/* Body */}
      <div className="py-4 space-y-6 overflow-y-auto">
        {/* Ringkasan Kapasitas Produksi */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow">
          <h2 className="font-semibold">Perkiraan Kapasitas Produksi</h2>
          <p className="text-sm opacity-80">
            Estimasi maksimal produksi berdasarkan bahan tersedia.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-3 text-center">
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs">Maks ID Card</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs">Maks Lanyard</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs">Maks Paket</p>
            </div>
          </div>
        </div>

        {/* Filter per Toko */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 rounded-xl shadow">
          <label className="font-medium flex items-center gap-2">
            <Store className="w-5 h-5 text-gray-500" />
            Pilih Toko:
          </label>
          {/* <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full sm:w-48"
          >
            <option>Toko A</option>
            <option>Toko B</option>
            <option>Toko C</option>
          </select> */}
          <SelectBasic options={listSupplier} placeholder="Semua Toko" />
        </div>

        {/* List Stok Item */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-3">Stok Item</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {table?.data?.items?.map((item: any, i: number) => (
              <div
                key={i}
                className="p-3 border rounded-lg flex justify-between items-center hover:shadow-md transition"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">Restock terakhir: -</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {item.stock} {item.unit}
                  </p>
                  <button className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                    <RefreshCcw className="w-3 h-3" /> Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log Pembelian / Restock */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-gray-600" /> Log Pembelian / Restock
          </h2>
          <div className="text-sm text-gray-500">
            Belum ada riwayat restock ditampilkan.
          </div>
        </div>
      </div>
    </div>
  );
}

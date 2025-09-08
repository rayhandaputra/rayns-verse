import { PlusCircleIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import { TitleHeader } from "~/components/TitleHedaer";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

export default function StockOpnamePage() {
  const navigate = useNavigate();

  const stockItems = [
    { name: "Id Card", qty: 0, unit: "pack" },
    { name: "Case", qty: 35 },
    { name: "Lanyard", qty: 0, unit: "pack" },
    { name: "Stopper", qty: 80, unit: "pack" },
    { name: "Cantelan", qty: 30 },
    { name: "Rivet", qty: 0, unit: "pack" },
    { name: "Kertas A4 (lembar)", qty: 81, unit: "pack" },
    { name: "Kertas Roll (100 m/roll)", qty: 37, extra: "(= 3700 m)" },
    { name: "Solasi (gulung)", qty: 23 },
    { name: "Tinta (liter)", qty: 11.89 },
  ];

  return (
    <div className="space-y-3">
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

      <div className="grid gap-4">
        <Card className="p-4">
          <h2 className="font-semibold text-gray-800 mb-2">
            Perkiraan Kapasitas Produksi
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            1 roll kertas ≈ 754 lanyard (8 lanyard / 1.06 m), 1 lembar A4 = 9
            ID, 1 gulung solasi = 100 paket, estimasi tinta = 0.0007 L/ID.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 p-2 rounded-md text-center">
              <p className="text-xs text-gray-500">Maks ID Card</p>
              <p className="text-lg font-bold">0</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-md text-center">
              <p className="text-xs text-gray-500">Maks Lanyard</p>
              <p className="text-lg font-bold">0</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-md text-center">
              <p className="text-xs text-gray-500">Maks Paket</p>
              <p className="text-lg font-bold">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold text-gray-800 mb-2">Stok Item</h2>
          <div className="space-y-2">
            {stockItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between border rounded-md p-2 bg-white"
              >
                <div>
                  <p className="font-medium text-gray-700">{item.name}</p>
                  <p className="text-xs text-gray-400">Restock terakhir: -</p>
                </div>
                <p className="font-semibold text-gray-800">
                  {item.qty}
                  {item.unit ? ` ${item.unit}` : ""}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold text-gray-800 mb-2">Restock Item</h2>
          <form className="space-y-3">
            <div className="flex gap-2">
              <select className="border p-2 rounded-md w-1/2">
                {stockItems.map((item, i) => (
                  <option key={i} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="border p-2 rounded-md w-1/2"
                placeholder="Contoh: 100"
              />
            </div>
            <Button className="bg-green-600 hover:bg-green-500 text-white">
              Restock
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

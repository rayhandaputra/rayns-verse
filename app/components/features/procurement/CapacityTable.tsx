import { Calculator } from "lucide-react";

export const CapacityTable = ({ allCaps, maxPackage }: any) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
      <Calculator size={20} /> Kalkulasi Stok Fisik
    </h2>
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
          <tr>
            <th className="px-4 py-3 text-left">Komponen</th>
            <th className="px-4 py-3 text-right">Stok Fisik</th>
            <th className="px-4 py-3 text-right">Estimasi Paket</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {allCaps.map((c: any, i: number) => (
            <tr key={i} className={c.val === maxPackage ? "bg-red-50/50" : ""}>
              <td className="px-4 py-3 font-medium">{c.name}</td>
              <td className="px-4 py-3 text-right">
                {c.stock.toLocaleString("id-ID")} {c.unit}
              </td>
              <td className="px-4 py-3 text-right font-bold">{c.val} pkt</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

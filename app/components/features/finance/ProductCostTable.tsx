import React from "react";
import { formatCurrency } from "~/constants";

interface ProductCostTableProps {
  productCostData: any[];
  setProductCostData: (data: any[]) => void;
  handleUpdateHpp: (id: string, val: number) => void;
}

const safeDivide = (a?: number, b?: number) => {
  if (!a || !b || b === 0) return 0;
  return a / b;
};

export const ProductCostTable: React.FC<ProductCostTableProps> = ({
  productCostData,
  setProductCostData,
  handleUpdateHpp,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-gray-200 bg-yellow-50/50">
        <h3 className="font-bold text-gray-800 text-lg">HPP / Modal Produk</h3>
        <p className="text-sm text-gray-600">
          Input manual modal per pcs untuk setiap produk untuk perhitungan keuntungan yang lebih akurat.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-bold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Nama Produk</th>
              <th className="px-6 py-4 text-right">Total Pcs Terjual</th>
              <th className="px-6 py-4 text-right">Total HPP</th>
              <th className="px-6 py-4 text-right">Pendapatan Bersih (Total)</th>
              <th className="px-6 py-4 text-right">Pendapatan Bersih (Per Pcs)</th>
              <th className="px-6 py-4 w-48 text-right">HPP (Per Pcs)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {productCostData?.map((p, i) => {
              const totalSold = p?.total_sold_items ?? 0;
              const netIncome = p?.net_income ?? 0;
              const netIncomePerPcs = safeDivide(netIncome, totalSold);

              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-right text-gray-600 font-mono">
                    {totalSold.toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600 font-mono">
                    {formatCurrency(p?.hpp_income ?? 0)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono">
                    {formatCurrency(netIncome)}
                  </td>
                  <td className="px-6 py-4 text-right text-blue-600 font-mono">
                    {formatCurrency(netIncomePerPcs)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 group">
                      <span className="text-gray-400 font-medium">Rp</span>
                      <input
                        type="number"
                        className="border border-gray-300 rounded-lg px-3 py-1.5 w-32 font-bold text-gray-800 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={p.hpp_price ?? 0}
                        onChange={(e) => {
                          const tmp = [...productCostData];
                          tmp[i] = {
                            ...tmp[i],
                            hpp_price: Number(e.target.value),
                          };
                          setProductCostData(tmp);
                        }}
                        onBlur={(e) => {
                          handleUpdateHpp(p.id, Number(e.target.value));
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

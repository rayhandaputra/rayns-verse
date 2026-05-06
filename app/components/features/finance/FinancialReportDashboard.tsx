import React from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieIcon, 
  Filter, 
  Download, 
  Plus 
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "~/constants";
import { TablePagination } from "~/components/ui/data-table";
import { Button } from "~/components/ui/button";
import { safeParseArray, safeParseObject } from "~/utils/utils";
import { Trash2Icon } from "lucide-react";
import Swal from "sweetalert2";

interface FinanceReportDashboardProps {
  filterYear: number;
  setFilterYear: (year: number) => void;
  balance: { income: number; expense: number };
  financeReport: any;
  expenseComposition: any;
  transactionBalance: any;
  loadingTrx: boolean;
  page: number;
  setPage: (page: number) => void;
  isTxModalOpen: boolean;
  setIsTxModalOpen: (open: boolean) => void;
  handleExportExcel: () => void;
  formatFullDateTime: (iso: string) => string;
  setModal: (modal: any) => void;
  submitAction: (payload: any) => void;
  sortOption: string;
  setSortOption: (opt: string) => void;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export const FinancialReportDashboard: React.FC<FinanceReportDashboardProps> = ({
  filterYear,
  setFilterYear,
  balance,
  financeReport,
  expenseComposition,
  transactionBalance,
  loadingTrx,
  page,
  setPage,
  setIsTxModalOpen,
  handleExportExcel,
  formatFullDateTime,
  setModal,
  submitAction,
  sortOption,
  setSortOption,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Control */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <span className="text-sm font-bold text-gray-700">Tahun Laporan:</span>
          <select
            className="border border-gray-300 rounded-lg p-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
          >
            {Array.from(
              { length: new Date().getFullYear() - 2017 + 1 },
              (_, i) => (new Date().getFullYear() - i).toString()
            ).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <Button
          onClick={handleExportExcel}
          variant="outline"
          className="flex items-center gap-2 border-green-200 hover:bg-green-50 text-green-700 font-bold"
        >
          <Download size={16} /> Export Excel (CSV)
        </Button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-500" /> Total Pemasukan {filterYear}
          </h3>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(balance?.income || 0)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
            <TrendingDown size={16} className="text-red-500" /> Total Pengeluaran {filterYear}
          </h3>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(balance?.expense || 0)}
          </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-white transform hover:scale-[1.02] transition-transform">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Laba Bersih {filterYear}</h3>
          <div className="text-3xl font-bold">
            {formatCurrency((balance?.income || 0) - (balance?.expense || 0))}
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={16} /> Pengeluaran & Pemasukan
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeReport?.data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.toLocaleString("id-ID")}
                />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="income" name="Masuk" fill="#22c55e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" name="Keluar" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <PieIcon size={16} /> Komposisi Pengeluaran
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseComposition?.data?.items?.map((v: any) => ({
                    name: v.name,
                    value: +v.value,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : "";
                  }}
                  labelLine={false}
                >
                  {expenseComposition?.data?.items?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconSize={10}
                  wrapperStyle={{ fontSize: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
          <h3 className="font-bold text-gray-800 text-lg">Riwayat Transaksi {filterYear}</h3>
          <div className="flex gap-3">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
            >
              <option value="date_desc">Terbaru</option>
              <option value="date_asc">Terlama</option>
              <option value="amount_desc">Nominal Terbesar</option>
              <option value="amount_asc">Nominal Terkecil</option>
            </select>
            <Button
              onClick={() => setIsTxModalOpen(true)}
              className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              <Plus size={16} className="mr-2" /> Catat Transaksi
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-bold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">No. Transaksi</th>
                <th className="px-6 py-4">Instansi/Pemesan</th>
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">Rekening</th>
                <th className="px-6 py-4">Bukti</th>
                <th className="px-6 py-4 text-right">Nominal</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingTrx ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                       <span>Memuat data transaksi...</span>
                    </div>
                  </td>
                </tr>
              ) : transactionBalance?.data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400 italic">
                    Belum ada transaksi untuk tahun {filterYear}.
                  </td>
                </tr>
              ) : (
                transactionBalance?.data?.items?.map((t: any) => {
                  const order: any = safeParseArray(t.orders)?.[0] || {};
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {formatFullDateTime(t.created_on)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            t.group_type === "income" || t.group_type === "asset"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {order?.payment_status === "down_payment"
                            ? "DP"
                            : order?.payment_status === "paid"
                            ? "PELUNASAN"
                            : t.account_name}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-700 max-w-xs truncate font-medium">
                        {t.trx_code || "-"}
                      </td>
                      <td className="px-6 py-3 text-gray-700 max-w-xs font-medium">
                        <p className="text-xs font-bold leading-tight">
                          {+order?.is_kkn === 1
                            ? order?.kkn_type?.toLowerCase() === "ppm"
                              ? `Kelompok ${safeParseObject(order?.kkn_detail)?.value}`
                              : `Desa ${safeParseObject(order?.kkn_detail)?.value}`
                            : order?.institution_name || "-"}
                        </p>
                        <p className="text-[10px] text-gray-500">{order?.pic_name || "-"}</p>
                      </td>
                      <td className="px-6 py-3 text-gray-700 max-w-xs">
                        <ul className="space-y-0.5">
                          {safeParseArray(t.order_items)?.map((v: any, i: number) => (
                            <li key={i} className="flex items-center gap-1 text-[10px] text-gray-600">
                              <span className="truncate max-w-[100px]">{v.product_name}</span>
                              <span className="text-gray-400">×</span>
                              <span className="font-bold text-gray-800">{v.qty}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-[10px]">
                        {safeParseArray(t.account_ledger_mutations)?.filter(
                          (v: any) => v?.account_code !== t.account_code
                        )?.[0]?.account_name ||
                          t.account_name ||
                          "-"}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {t.receipt_url && t.receipt_url !== "undefined" ? (
                          <button
                            className="text-blue-600 hover:underline font-medium text-xs"
                            onClick={() =>
                              setModal({
                                open: true,
                                type: "zoom_receipt_url",
                                data: { receipt_url: t.receipt_url },
                              })
                            }
                          >
                            Lihat Bukti
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">Tidak ada</span>
                        )}
                      </td>
                      <td
                        className={`px-6 py-3 text-right font-bold whitespace-nowrap text-sm ${
                          t.group_type === "income" || t.group_type === "asset"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(
                          ["income", "expense"].includes(t.group_type)
                            ? t.credit - t.debit
                            : t.debit - t.credit
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          onClick={() => {
                            Swal.fire({
                              title: "Hapus Transaksi?",
                              text: `Yakin ingin menghapus Transaksi ${t.account_name}?`,
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonText: "Ya, Hapus",
                              cancelButtonText: "Batal",
                              customClass: {
                                confirmButton: "bg-red-600 text-white px-4 py-2 rounded-md",
                                cancelButton: "bg-gray-200 text-gray-800 px-4 py-2 rounded-md",
                              },
                            }).then((result) => {
                              if (result.isConfirmed) {
                                submitAction({
                                  intent: "delete_transaction",
                                  id: t.id,
                                  journal_code: t.journal_code,
                                });
                              }
                            });
                          }}
                        >
                          <Trash2Icon size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <TablePagination
            currentPage={page || transactionBalance?.data?.current_page || 1}
            totalPages={transactionBalance?.data?.total_pages || 0}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>
    </div>
  );
};

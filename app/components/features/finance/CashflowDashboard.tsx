import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Plus, Download } from "lucide-react";
import ChartLazy from "~/components/shared/chart/ChartLazy";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/nexus/nexus-client";
import { formatCurrency } from "~/utils/utils";
import { TablePagination } from "~/components/ui/data-table";

export const CashflowDashboard: React.FC = () => {
  const [page, setPage] = useState(1);
  const filterYear = new Date().getFullYear();

  // Fetch Summary data (Income/Expense balance)
  const { data: balanceData } = useFetcherData({
    endpoint: nexus()
      .module("ACCOUNT_LEDGER_JOURNAL")
      .action("report_finance")
      .params({ year: filterYear })
      .build(),
  });

  // Fetch Transactions list
  const { data: transactionData, loading: loadingTrx } = useFetcherData({
    endpoint: nexus()
      .module("ACCOUNT_LEDGER_JOURNAL")
      .action("get_transaction_balance")
      .params({ 
        year: filterYear,
        page: page,
        limit: 10
      })
      .build(),
  });

  const balance = balanceData?.data || { income: 0, expense: 0 };
  const transactions = transactionData?.data?.items || [];
  const totalPages = transactionData?.data?.total_pages || 0;

  const chartData = {
    series: [
      {
        name: "Pemasukan",
        data: balanceData?.data_monthly?.map((m: any) => m.income) || [0, 0, 0, 0, 0, 0],
      },
      {
        name: "Pengeluaran",
        data: balanceData?.data_monthly?.map((m: any) => m.expense) || [0, 0, 0, 0, 0, 0],
      },
    ],
    options: {
      chart: { type: "area", toolbar: { show: false } },
      stroke: { curve: "smooth" },
      dataLabels: { enabled: false },
      xaxis: {
        categories: balanceData?.data_monthly?.map((m: any) => m.name) || ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
      },
      colors: ["#10b981", "#ef4444"],
      legend: { position: "top" },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Cashflow Analitik</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download size={16} /> Export
          </Button>
          <Button className="bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700">
            <Plus size={16} /> Transaksi
          </Button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-green-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Total Pemasukan
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(balance.income)}
            </p>
            <div className="bg-green-50 p-2.5 rounded-full">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Total Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(balance.expense)}
            </p>
            <div className="bg-red-50 p-2.5 rounded-full">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(balance.income - balance.expense)}
            </p>
            <div className="bg-blue-50 p-2.5 rounded-full">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHART */}
      <Card className="shadow-sm border border-gray-100 overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-50">
          <CardTitle className="text-lg font-bold text-gray-800">Tren Arus Kas {filterYear}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ChartLazy
            options={chartData.options}
            series={chartData.series}
            type="area"
            height={350}
          />
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="shadow-sm border border-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-lg font-bold text-gray-800">Riwayat Transaksi Terbaru</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Kategori / Akun</th>
                  <th className="px-6 py-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingTrx ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-gray-400">Loading data...</td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(t.created_on).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-800">{t.account_name}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{t.trx_code}</div>
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-bold ${t.group_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.group_type === 'income' ? '+' : '-'} {formatCurrency(t.credit || t.debit)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-gray-400 font-medium">Belum ada riwayat transaksi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-gray-50 bg-gray-50/20">
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

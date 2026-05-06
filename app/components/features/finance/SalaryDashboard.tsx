import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Users, Wallet, TrendingUp, Plus, Search } from "lucide-react";
import ChartLazy from "~/components/shared/chart/ChartLazy";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/nexus/nexus-client";
import { formatCurrency } from "~/utils/utils";
import { TablePagination } from "~/components/ui/data-table";

export const SalaryDashboard: React.FC = () => {
  const [page, setPage] = useState(1);

  // Fetch Summary data
  const { data: employeesData } = useFetcherData({
    endpoint: nexus()
      .module("EMPLOYEE")
      .action("get")
      .params({ status: "active" })
      .build(),
  });

  // Fetch Salary Slips (Historical)
  const { data: salarySlips, loading: loadingSlips } = useFetcherData({
    endpoint: nexus()
      .module("EMPLOYEE_SALARY_SLIP")
      .action("get")
      .params({ 
        page: page,
        limit: 10
      })
      .build(),
  });

  const totalEmployees = employeesData?.data?.total_items || 0;
  const slips = salarySlips?.data?.items || [];
  const totalPages = salarySlips?.data?.total_pages || 0;

  const totalSalaryPayout = slips.reduce((acc: number, slip: any) => acc + Number(slip.net_salary || 0), 0);

  const chartData = {
    series: [
      {
        name: "Total Gaji",
        data: [12000000, 13500000, 12800000, 14200000, totalSalaryPayout || 15000000],
      },
    ],
    options: {
      chart: { type: "bar", toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "Mei"],
      },
      colors: ["#6366f1"],
      grid: {
        borderColor: '#f3f4f6',
      }
    },
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Manajemen Gaji Pegawai</h2>
        <Button className="bg-indigo-600 text-white flex items-center gap-2 hover:bg-indigo-700">
          <Plus size={16} /> Input Gaji
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-indigo-500 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Pegawai Aktif</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-2xl font-bold text-gray-900">{totalEmployees} <span className="text-sm font-normal text-gray-400">Orang</span></p>
            <div className="bg-indigo-50 p-2.5 rounded-xl">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-emerald-500 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">Estimasi Payout Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalSalaryPayout || 15000000)}
            </p>
            <div className="bg-emerald-50 p-2.5 rounded-xl">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-amber-500 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tren Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-2xl font-bold text-amber-600">+4.2%</p>
            <div className="bg-amber-50 p-2.5 rounded-xl">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-sm border-gray-100 overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-50">
            <CardTitle className="text-lg font-bold">Histori Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartLazy
              options={chartData.options}
              series={chartData.series}
              type="bar"
              height={320}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm border-gray-100 overflow-hidden">
          <CardHeader className="flex flex-row justify-between items-center bg-gray-50/30 border-b border-gray-100 px-6 py-4">
            <CardTitle className="text-lg font-bold">Daftar Slip Gaji Pegawai</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                placeholder="Cari pegawai..." 
                className="pl-10 pr-4 py-2 border rounded-full text-sm focus:ring-2 focus:ring-indigo-100 outline-none border-gray-200 transition-all w-48 focus:w-64"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-bold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Nama Pegawai</th>
                    <th className="px-6 py-4">Periode</th>
                    <th className="px-6 py-4">Total Gaji Net</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingSlips ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400">Loading slips...</td>
                    </tr>
                  ) : slips.length > 0 ? (
                    slips.map((slip: any) => (
                      <tr key={slip.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{slip.employee_name}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{slip.payment_type}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {slip.period}
                        </td>
                        <td className="px-6 py-4 font-bold text-indigo-600">
                          {formatCurrency(slip.net_salary)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${slip.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {slip.payment_status === 'paid' ? 'TERBAYAR' : 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium">Belum ada data slip gaji.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-gray-50 bg-gray-50/10">
              <TablePagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import ChartLazy from "~/components/Chart/ChartLazy";

export default function CashflowPage() {
  const chartData = {
    series: [
      {
        name: "Pemasukan",
        data: [5000000, 4200000, 6500000, 7000000, 8000000, 7800000],
      },
      {
        name: "Pengeluaran",
        data: [3000000, 2500000, 3200000, 4000000, 3800000, 4200000],
      },
    ],
    options: {
      chart: { type: "area", toolbar: { show: false } },
      stroke: { curve: "smooth" },
      dataLabels: { enabled: false },
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
      },
      colors: ["#10b981", "#ef4444"],
      legend: { position: "top" },
    },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Cashflow</h2>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-green-500 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pemasukan
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-2xl font-semibold text-green-600">
              Rp 7.800.000
            </p>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-2xl font-semibold text-red-600">Rp 4.200.000</p>
            <TrendingDown className="w-6 h-6 text-red-600" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Profit
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-2xl font-semibold text-blue-600">Rp 3.600.000</p>
            <Wallet className="w-6 h-6 text-blue-600" />
          </CardContent>
        </Card>
      </div>

      {/* CHART */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Grafik Cashflow</CardTitle>
        </CardHeader>
        <CardContent>
          {/* <ReactApexChart
            options={chartData.options}
            series={chartData.series}
            type="area"
            height={300}
          /> */}
          <ChartLazy
            options={chartData.options}
            series={chartData.series}
            type="bar"
            height={300}
          />
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="font-semibold">Riwayat Transaksi</CardTitle>
          <Button className="bg-blue-600 text-white">Tambah Transaksi</Button>
        </CardHeader>

        <CardContent>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2">Tanggal</th>
                <th>Kategori</th>
                <th>Deskripsi</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b py-2">
                <td className="py-2">12 Jan 2025</td>
                <td>Pemasukan</td>
                <td>Pembayaran Client</td>
                <td className="text-green-600">+ Rp 3.000.000</td>
              </tr>
              <tr>
                <td className="py-2">15 Jan 2025</td>
                <td>Pengeluaran</td>
                <td>Gaji Karyawan</td>
                <td className="text-red-600">- Rp 1.500.000</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

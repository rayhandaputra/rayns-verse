import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Users, Wallet, TrendingUp } from "lucide-react";
import ChartLazy from "~/components/Chart/ChartLazy";

export default function GajiPegawaiPage() {
  const chartData = {
    series: [
      {
        name: "Gaji Dibayarkan",
        data: [12000000, 13000000, 12500000, 14000000, 15000000],
      },
    ],
    options: {
      chart: { type: "bar", toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 6 } },
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "Mei"],
      },
      colors: ["#3b82f6"],
    },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Gaji Pegawai</h2>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-blue-500 shadow-sm">
          <CardHeader>
            <CardTitle>Total Pegawai</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-2xl font-semibold">14 Pegawai</p>
            <Users className="w-6 h-6 text-blue-600" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500 shadow-sm">
          <CardHeader>
            <CardTitle>Total Pengeluaran Gaji</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-2xl font-semibold text-green-600">
              Rp 15.000.000
            </p>
            <Wallet className="w-6 h-6 text-green-600" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-indigo-500 shadow-sm">
          <CardHeader>
            <CardTitle>Kenaikan Gaji Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-xl font-semibold text-indigo-600">+12%</p>
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </CardContent>
        </Card>
      </div>

      {/* CHART */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Grafik Pengeluaran Gaji</CardTitle>
        </CardHeader>
        <CardContent>
          {/* <ReactApexChart
            options={chartData.options}
            series={chartData.series}
            type="bar"
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
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Daftar Gaji Pegawai</CardTitle>
          <Button className="bg-blue-600 text-white">Tambah Data Gaji</Button>
        </CardHeader>

        <CardContent>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2">Nama Pegawai</th>
                <th>Jabatan</th>
                <th>Gaji Pokok</th>
                <th>Tanggal Dibayar</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Budi Santoso</td>
                <td>Admin</td>
                <td>Rp 3.500.000</td>
                <td>1 Feb 2025</td>
              </tr>

              <tr>
                <td className="py-2">Siti Rahma</td>
                <td>Kasir</td>
                <td>Rp 4.000.000</td>
                <td>1 Feb 2025</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

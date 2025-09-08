// app/components/Chart.tsx
"use client";

import React, { useEffect, useState } from "react";
import type { ApexOptions } from "apexcharts";
import ChartLazy from "~/components/Chart/ChartLazy";

// const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function DashboardOverview() {
  const orderChart = {
    series: [{ name: "Pesanan", data: [40, 55, 60, 70, 90, 120, 150] }],
    options: {
      chart: { type: "area", height: 300, toolbar: { show: false } },
      xaxis: { categories: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul"] },
      stroke: { curve: "smooth" },
      dataLabels: { enabled: false },
      colors: ["#3b82f6"],
    },
  };

  const basisChart = {
    series: [
      {
        name: "Pesanan",
        data: [120, 150],
      },
    ],
    options: {
      chart: { type: "bar", height: 200, toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
        },
      },
      xaxis: { categories: ["Akrual Basis", "Cash Basis"] },
      colors: ["#3b82f6"],
      dataLabels: { enabled: false },
    },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      {/* Statistik Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow">
          <h2 className="text-sm text-gray-500">Total Pesanan</h2>
          <p className="text-2xl font-bold">320</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow">
          <h2 className="text-sm text-gray-500">Sedang Diproduksi</h2>
          <p className="text-2xl font-bold">85</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow">
          <h2 className="text-sm text-gray-500">Selesai Bulan Ini</h2>
          <p className="text-2xl font-bold">120</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow">
          <h2 className="text-sm text-gray-500">Pendapatan</h2>
          <p className="text-2xl font-bold">Rp 25.000.000</p>
        </div>
      </div>

      {/* Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-4 shadow">
          <h2 className="text-lg font-semibold mb-4">Tren Pesanan Bulanan</h2>
          <ChartLazy
            options={orderChart.options}
            series={orderChart.series}
            type="area"
          />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow">
          <h2 className="text-lg font-semibold mb-4">Akrual vs Cash Basis</h2>
          <ChartLazy
            options={basisChart.options}
            series={basisChart.series}
            type="bar"
            horizontal
          />
        </div>
      </div>

      {/* Tabel Pesanan Terbaru */}
      <div className="bg-white rounded-2xl p-4 shadow">
        <h2 className="text-lg font-semibold mb-4">Pesanan Terbaru</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Nama Klien</th>
              <th className="py-2">Produk</th>
              <th className="py-2">Jumlah</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">PT ABC</td>
              <td className="py-2">ID Card Premium</td>
              <td className="py-2">150</td>
              <td className="py-2 text-green-600">Selesai</td>
            </tr>
            <tr>
              <td className="py-2">CV XYZ</td>
              <td className="py-2">Lanyard</td>
              <td className="py-2">200</td>
              <td className="py-2 text-yellow-600">Proses</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// export default function Chart() {
//   const [ReactApexChart, setReactApexChart] = useState<any>(null);

//   useEffect(() => {
//     // Dynamic import agar hanya di-load di client
//     import("react-apexcharts").then((mod) => {
//       setReactApexChart(() => mod.default);
//     });
//   }, []);

//   const options: ApexOptions = {
//     chart: { type: "line" },
//     xaxis: { categories: ["Jan", "Feb", "Mar", "Apr"] },
//   };

//   // const series = [{ name: "Sales", data: [10, 40, 35, 50] }];

//   // if (!ReactApexChart) {
//   //   return <div>Loading chart...</div>;
//   // }

//   const categories = ["Akrual Basis", "Cash Basis"];
//   const series = [
//     {
//       name: "Statistik",
//       data: [100, 150],
//     },
//   ];

//   return (
//     // <ReactApexChart
//     //   options={options}
//     //   series={series}
//     //   type="line"
//     //   height={350}
//     // />
//     <BarChart
//       title="Pesanan"
//       categories={categories}
//       series={series}
//       horizontal
//     />
//   );
// }

type BarProps = {
  title: string;
  categories: string[];
  series: { name: string; data: number[] }[];
  stacked?: boolean;
  horizontal?: boolean;
};

export const BarChart: React.FC<BarProps> = ({
  title,
  categories,
  series,
  stacked,
  horizontal,
}) => {
  const options: ApexCharts.ApexOptions = {
    chart: { type: "bar", stacked: !!stacked, toolbar: { show: false } },
    xaxis: { categories },
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    plotOptions: {
      bar: {
        horizontal: !!horizontal,
        borderRadius: 8,
        columnWidth: "45%",
        barHeight: horizontal ? "55%" : undefined,
      },
    },
    tooltip: {
      y: { formatter: (v) => `${v}` },
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-slate-700">{title}</div>
      <ChartLazy options={options} series={series} type="bar" height={270} />
    </div>
  );
};

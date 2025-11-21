// app/components/Chart.tsx
"use client";

import React, { useEffect, useState } from "react";
import type { ApexOptions } from "apexcharts";
import ChartLazy from "~/components/Chart/ChartLazy";
import {
  redirect,
  useLoaderData,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from "react-router";
// import { getSession } from "~/lib/session";
import { API } from "~/lib/api";
import { getOrderStatusLabel, toMoney } from "~/lib/utils";
import { requireAuth } from "~/lib/session.server";
// import { requireUser } from "~/lib/session.client";
// import { requireUserSession } from "~/lib/session.server";
// import { unsealSession } from "~/lib/session.client";

// const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Require authentication
  const { user, session, token } = await requireAuth(request);

  let url = new URL(request.url);
  let { search, page = 0, size = 10 } = Object.fromEntries(url.searchParams);

  const filters = {
    pagination: "true",
    page: page || 0,
    size: size || 10,
    status: params.status || "",
  };

  // Pass session data to API calls
  const overview = await API.OVERVIEW.get({
    session: { user, token },
    req: {
      query: filters,
    } as any,
  });

  const orders = await API.ORDERS.get({
    session: { user, token },
    req: {
      query: {
        pagination: "true",
        page: page || 0,
        size: size || 3,
      },
    } as any,
  });

  return {
    user,
    overview,
    orders: orders?.items,
  };
}

// export const loader: LoaderFunction = async ({ request, params }) => {
//   const session = await unsealSession(request);

//   console.log("SESSION OVERVIEW PAGE => ", session.get("user"));

//   let url = new URL(request.url);
//   let { search, page = 0, size = 10 } = Object.fromEntries(url.searchParams);

//   try {
//     const filters = {
//       pagination: "true",
//       page: page || 0,
//       size: size || 10,
//       status: params.status || "",
//     };
//     const overview = await API.OVERVIEW.get({
//       session,
//       req: {
//         query: filters,
//       } as any,
//     });
//     const orders = await API.ORDERS.get({
//       session,
//       req: {
//         query: {
//           pagination: "true",
//           page: page || 0,
//           size: size || 3,
//         },
//       } as any,
//     });

//     return {
//       overview,
//       orders: orders?.items,
//     };
//   } catch (err) {
//     console.log(err);
//     return {
//       error_message: err,
//     };
//   }
// };

export default function DashboardOverview() {
  const { overview, orders } = useLoaderData();

  const rawData: any[] = overview?.monthly_report ?? [];

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  const months = rawData.map((v) => monthNames[Number(v.month) - 1]);
  const totals = rawData.map((v) => Number(v.total_sales));

  const orderChart = {
    series: [
      {
        name: "Pesanan",
        data: totals,
      },
    ],
    options: {
      chart: { type: "area", height: 300, toolbar: { show: false } },
      xaxis: { categories: months },
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
          <h2 className="text-sm text-gray-500">Total Pesanan Masuk</h2>
          <p className="text-2xl font-bold">{overview?.total_order_pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow">
          <h2 className="text-sm text-gray-500">Sedang Diproduksi</h2>
          <p className="text-2xl font-bold">{overview?.total_order_process}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow">
          <h2 className="text-sm text-gray-500">Selesai Bulan Ini</h2>
          <p className="text-2xl font-bold">{overview?.total_order_done}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow">
          <h2 className="text-sm text-gray-500">Pendapatan</h2>
          <p className="text-2xl font-bold">
            Rp {toMoney(overview?.total_revenue)}
          </p>
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
        {/* <div className="bg-white rounded-2xl p-4 shadow">
          <h2 className="text-lg font-semibold mb-4">Akrual vs Cash Basis</h2>
          <ChartLazy
            options={basisChart.options}
            series={basisChart.series}
            type="bar"
            horizontal
          />
        </div> */}
      </div>

      {/* Tabel Pesanan Terbaru */}
      <div className="bg-white rounded-2xl p-4 shadow">
        <h2 className="text-lg font-semibold mb-4">Pesanan Terbaru</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Instansi</th>
              <th className="py-2">No Order</th>
              <th className="py-2">Jumlah</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order: any, index: number) => (
              <tr key={index} className="border-b">
                <td className="py-2">{order?.institution_name}</td>
                <td className="py-2">{order?.order_number}</td>
                <td className="py-2">{order?.total_product}</td>
                <td
                  className={`py-2 ${order?.status === "done" ? "text-green-600" : "text-orange-600"}`}
                >
                  {getOrderStatusLabel(order?.status)}
                </td>
              </tr>
            ))}
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

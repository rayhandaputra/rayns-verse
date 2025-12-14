// app/components/Chart.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
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

import type { Order, StockState, PriceList } from "../types";
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Package,
} from "lucide-react";
import {
  formatCurrency,
  mlPerPaket,
  ROLL_CM,
  CM_PER_LANYARD,
  A4_PER_PAKET,
  TAPE_CM_PER_ROLL,
  LANYARD_PER_ROLL,
  RIVET_PER_PAKET,
  PLASTIC_SMALL_CAP,
  PLASTIC_MED_CAP,
  PLASTIC_BIG_CAP,
  INK_SET_ML,
} from "../constants";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
      <div>
        <h2 className="text-2xl font-bold text-gray-800 capitalize">
          {/* {activeTab === 'portfolio' ? 'Riwayat Pesanan' : activeTab.replace('-', ' ')} */}{" "}
          Dashboard Overview
        </h2>
        <p className="text-sm text-gray-500">
          {"Ringkasan performa dan produksi."}
        </p>
      </div>

      <DashboardHome orders={[]} stock={{}} />

      <div>
        <h2 className="text-2xl font-bold text-gray-800 capitalize">
          {/* {activeTab === 'portfolio' ? 'Riwayat Pesanan' : activeTab.replace('-', ' ')} */}{" "}
          Analytics
        </h2>
        <p className="text-sm text-gray-500">
          {"Laporan keuangan dan grafik."}
        </p>
      </div>
      <Analytics orders={[]} />

      {/* Statistik Cards */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div> */}

      {/* Grafik */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div> */}

      {/* Tabel Pesanan Terbaru */}
      {/* <div className="bg-white rounded-2xl p-4 shadow">
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
      </div> */}
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

// type BarProps = {
//   title: string;
//   categories: string[];
//   series: { name: string; data: number[] }[];
//   stacked?: boolean;
//   horizontal?: boolean;
// };

// export const BarChart: React.FC<BarProps> = ({
//   title,
//   categories,
//   series,
//   stacked,
//   horizontal,
// }) => {
//   const options: ApexCharts.ApexOptions = {
//     chart: { type: "bar", stacked: !!stacked, toolbar: { show: false } },
//     xaxis: { categories },
//     legend: { position: "bottom" },
//     dataLabels: { enabled: false },
//     plotOptions: {
//       bar: {
//         horizontal: !!horizontal,
//         borderRadius: 8,
//         columnWidth: "45%",
//         barHeight: horizontal ? "55%" : undefined,
//       },
//     },
//     tooltip: {
//       y: { formatter: (v) => `${v}` },
//     },
//   };

//   return (
//     <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//       <div className="mb-3 text-sm font-semibold text-slate-700">{title}</div>
//       <ChartLazy options={options} series={series} type="bar" height={270} />
//     </div>
//   );
// };

interface DashboardHomeProps {
  orders: Order[];
  stock: StockState;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ orders, stock }) => {
  // Order Stats
  const done = orders.filter((o) => o.finishedAt).length;
  const inprogress = orders.filter(
    (o) => !o.finishedAt && o.statusPengerjaan === "sedang dikerjakan"
  ).length;
  const pending = orders.filter(
    (o) => !o.finishedAt && o.statusPengerjaan === "pending"
  ).length;

  // Capacity Stats
  const prices: PriceList = [] as any; // In a real app, pass this as prop or context to avoid reload

  const metrics = useMemo(() => {
    const s = stock;
    const p = prices;

    // Capacity (Paket)
    const cap_tinta =
      s.tinta_ml > 0 ? Math.floor(s.tinta_ml / mlPerPaket()) : 0;
    const cap_roll = Math.floor(
      (s.roll_100m || 0) * Math.floor(ROLL_CM / CM_PER_LANYARD)
    );
    const cap_a4 = Math.floor((s.a4_sheets || 0) * (1 / A4_PER_PAKET));
    const cap_tape = Math.floor(
      (s.tape_roll || 0) * Math.floor(TAPE_CM_PER_ROLL / 38.75)
    );
    const cap_lan = Math.floor(
      (s.lanyard_roll || 0) * LANYARD_PER_ROLL + (s.lanyard_pcs || 0)
    );
    const cap_pvc = s.pvc_pcs || 0;
    const cap_case = s.case_pcs || 0;
    const cap_kait = s.kait_pcs || 0;
    const cap_stop = s.stopper_pcs || 0;
    const cap_rivet = Math.floor((s.rivet_pcs || 0) / RIVET_PER_PAKET);
    const cap_plast =
      (s.plastic_small_pcs || 0) * PLASTIC_SMALL_CAP +
      (s.plastic_med_pcs || 0) * PLASTIC_MED_CAP +
      (s.plastic_big_pcs || 0) * PLASTIC_BIG_CAP;

    const allCaps = [
      cap_tinta,
      cap_roll,
      cap_a4,
      cap_tape,
      cap_lan,
      cap_pvc,
      cap_case,
      cap_kait,
      cap_stop,
      cap_rivet,
      cap_plast,
    ];
    const maxPackage = Math.min(...allCaps);

    // Cost Per Package (CPP)
    const c_tinta = (p.ink_set / INK_SET_ML) * mlPerPaket();
    const c_roll = p.roll_100m / (ROLL_CM / CM_PER_LANYARD);
    const c_a4 = (p.a4_pack * A4_PER_PAKET) / 100;
    const c_tape = p.tape_roll / (TAPE_CM_PER_ROLL / 38.75);
    const c_lanyard = p.lanyard_roll / LANYARD_PER_ROLL;
    const c_pvc = p.pvc_pack / 250;
    const c_case = p.case_unit;
    const c_kait = p.kait_unit;
    const c_stop = p.stopper_pack / 120;
    const c_rivet = p.rivet_pack / 500;

    const num =
      (s.plastic_small_pcs || 0) * p.plastic_small_unit +
      (s.plastic_med_pcs || 0) * p.plastic_med_unit +
      (s.plastic_big_pcs || 0) * p.plastic_big_unit;
    const den =
      (s.plastic_small_pcs || 0) * PLASTIC_SMALL_CAP +
      (s.plastic_med_pcs || 0) * PLASTIC_MED_CAP +
      (s.plastic_big_pcs || 0) * PLASTIC_BIG_CAP;
    const c_plast =
      den > 0
        ? num / den
        : Math.min(
            p.plastic_small_unit / PLASTIC_SMALL_CAP,
            p.plastic_med_unit / PLASTIC_MED_CAP
          );

    const cpp =
      c_tinta +
      c_roll +
      c_a4 +
      c_tape +
      c_lanyard +
      c_pvc +
      c_case +
      c_kait +
      c_stop +
      c_rivet +
      c_plast;

    return { maxPackage, cpp };
  }, [stock, prices]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Production Stats */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Produksi Maksimal
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {metrics.maxPackage}{" "}
                <span className="text-sm font-normal text-gray-400">Paket</span>
              </h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Package size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Estimasi berdasarkan stok terendah
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Modal Per Paket
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(metrics.cpp)}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">HPP bahan baku dasar</p>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
            <ClipboardList size={16} /> Keterangan Pesanan
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 text-center">
              <div className="text-xs text-gray-500 uppercase font-bold mb-1">
                Pending
              </div>
              <div className="text-2xl font-bold text-gray-800">{pending}</div>
            </div>
            <div className="p-4 border border-blue-100 rounded-xl bg-blue-50 text-center">
              <div className="text-xs text-blue-600 uppercase font-bold mb-1 flex items-center justify-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Proses
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {inprogress}
              </div>
            </div>
            <div className="p-4 border border-green-100 rounded-xl bg-green-50 text-center">
              <div className="text-xs text-green-600 uppercase font-bold mb-1 flex items-center justify-center gap-1">
                <CheckCircle2 size={12} /> Selesai
              </div>
              <div className="text-2xl font-bold text-green-700">{done}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Alerts or recent activity could go here */}
      {metrics.maxPackage < 50 && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center gap-3 text-orange-800">
          <AlertTriangle size={20} />
          <span className="text-sm font-medium">
            Stok menipis! Kapasitas produksi di bawah 50 paket. Silakan cek menu{" "}
            <b>Stok Bahan</b>.
          </span>
        </div>
      )}
    </div>
  );
};

interface AnalyticsProps {
  orders: Order[];
}

const Analytics: React.FC<AnalyticsProps> = ({ orders }) => {
  const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaid = orders.reduce((sum, o) => sum + o.dpAmount, 0);
  const outstanding = Math.max(0, totalValue - totalPaid);

  // Group by Instansi (Top 5)
  const byInst = orders.reduce(
    (acc, o) => {
      acc[o.instansi] = (acc[o.instansi] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topInst = Object.entries(byInst)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  // Monthly Data
  const monthlyData = useMemo(() => {
    const data: Record<string, { name: string; total: number; paid: number }> =
      {};
    const now = new Date();

    // Init last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      data[key] = {
        name: d.toLocaleDateString("id-ID", { month: "short" }),
        total: 0,
        paid: 0,
      };
    }

    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (data[key]) {
        data[key].total += o.totalAmount;
        data[key].paid += o.dpAmount;
      }
    });

    return Object.values(data);
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Total Nilai Pesanan
          </h3>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalValue)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Terbayar (DP + Lunas)
          </h3>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalPaid)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Sisa Piutang
          </h3>
          <div className="text-2xl font-bold text-red-500">
            {formatCurrency(outstanding)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Omzet 6 Bulan Terakhir
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar
                  dataKey="total"
                  name="Total Order"
                  fill="#1e293b"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="paid"
                  name="Terbayar"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Top 5 Instansi
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topInst.map(([name, count]) => ({ name, count }))}
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  fontSize={11}
                  tickFormatter={(val) =>
                    val.length > 15 ? val.substring(0, 15) + "..." : val
                  }
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#4f46e5"
                  radius={[0, 4, 4, 0]}
                  name="Jumlah Order"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

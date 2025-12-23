// app/components/Chart.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import ChartLazy from "~/components/Chart/ChartLazy";
import {
  redirect,
  type LoaderFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { API } from "~/lib/api";
import { getOrderStatusLabel, safeParseObject, toMoney } from "~/lib/utils";
import { requireAuth } from "~/lib/session.server";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/lib/nexus-client";

import type { Order, StockState, PriceList } from "../types";
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Package,
  Crown,
  BarChart2,
  Layers,
  Building2,
  Handshake,
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
  LabelList,
} from "recharts";

// import { requireUser } from "~/lib/session.client";
// import { requireUserSession } from "~/lib/session.server";
// import { unsealSession } from "~/lib/session.client";

// const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Only check authentication
  await requireAuth(request);
  return Response.json({ initialized: true });
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
  // Fetch overview data
  const { data: overviewData } = useFetcherData({
    endpoint: nexus().module("OVERVIEW").action("summary").build(),
  });

  console.log("OVERVIEW DATA => ", overviewData);

  // Fetch orders
  const { data: ordersData } = useFetcherData({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({
        pagination: "true",
        page: 0,
        size: 100,
      })
      .build(),
  });

  // Fetch stock data
  const { data: stockData } = useFetcherData({
    endpoint: nexus()
      .module("COMMODITY_STOCK")
      .action("get")
      .params({ size: 100, pagination: "false" })
      .build(),
  });

  // Fetch supplier commodities for prices
  const { data: supplierCommodityData } = useFetcherData({
    endpoint: nexus()
      .module("SUPPLIER_COMMODITY")
      .action("get")
      .params({ size: 1000, pagination: "false" })
      .build(),
  });

  // Map data
  const overview = overviewData?.data || {};
  const orders: Order[] = ordersData?.data?.items || [];

  const stock: StockState = useMemo(() => {
    const result: StockState = {};
    if (stockData?.data?.items) {
      stockData.data.items.forEach((item: any) => {
        result[item.code] = Number(item.stock || 0);
      });
    }
    return result;
  }, [stockData]);

  const prices: PriceList = useMemo(() => {
    const result: PriceList = {};
    if (supplierCommodityData?.data?.items && stockData?.data?.items) {
      stockData.data.items.forEach((commodity: any) => {
        const supplierPrices = supplierCommodityData.data.items.filter(
          (sc: any) => sc.commodity_id === commodity.id
        );

        if (supplierPrices.length > 0) {
          const avgPrice =
            supplierPrices.reduce(
              (sum: number, sc: any) => sum + Number(sc.price || 0),
              0
            ) / supplierPrices.length;
          result[commodity.code] = avgPrice;
        }
      });
    }
    return result;
  }, [supplierCommodityData, stockData]);

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

      <DashboardHome
        overview={overview}
        orders={orders}
        stock={stock}
        prices={prices}
      />

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
  prices?: PriceList;
  overview?: any;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
  orders,
  stock,
  prices: pricesFromProps,
  overview,
}) => {
  // Safe orders array
  const safeOrders = orders || [];

  // Order Stats
  const done = safeOrders.filter((o) => o.finishedAt).length;
  const inprogress = safeOrders.filter(
    (o) => !o.finishedAt && o.statusPengerjaan === "sedang dikerjakan"
  ).length;
  const pending = safeOrders.filter(
    (o) => !o.finishedAt && o.statusPengerjaan === "pending"
  ).length;

  // Use real prices from props or fallback to zeros
  const prices: any = pricesFromProps || {
    ink_set: 0,
    roll_100m: 0,
    a4_pack: 0,
    tape_roll: 0,
    lanyard_roll: 0,
    pvc_pack: 0,
    case_unit: 0,
    kait_unit: 0,
    stopper_pack: 0,
    rivet_pack: 0,
    plastic_small_unit: 0,
    plastic_med_unit: 0,
    plastic_big_unit: 0,
  };

  const metrics = useMemo(() => {
    const s = stock || {};
    const p = prices;

    // Capacity (Paket)
    const cap_tinta =
      (s.tinta_ml || 0) > 0 ? Math.floor((s.tinta_ml || 0) / mlPerPaket()) : 0;
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
    const maxPackage = allCaps.length > 0 ? Math.min(...allCaps) : 0;

    // Cost Per Package (CPP) - with fallback to 0
    const c_tinta = ((p.ink_set || 0) / INK_SET_ML) * mlPerPaket() || 0;
    const c_roll = (p.roll_100m || 0) / (ROLL_CM / CM_PER_LANYARD) || 0;
    const c_a4 = ((p.a4_pack || 0) * A4_PER_PAKET) / 100 || 0;
    const c_tape = (p.tape_roll || 0) / (TAPE_CM_PER_ROLL / 38.75) || 0;
    const c_lanyard = (p.lanyard_roll || 0) / LANYARD_PER_ROLL || 0;
    const c_pvc = (p.pvc_pack || 0) / 250 || 0;
    const c_case = p.case_unit || 0;
    const c_kait = p.kait_unit || 0;
    const c_stop = (p.stopper_pack || 0) / 120 || 0;
    const c_rivet = (p.rivet_pack || 0) / 500 || 0;

    const num =
      (s.plastic_small_pcs || 0) * (p.plastic_small_unit || 0) +
      (s.plastic_med_pcs || 0) * (p.plastic_med_unit || 0) +
      (s.plastic_big_pcs || 0) * (p.plastic_big_unit || 0);
    const den =
      (s.plastic_small_pcs || 0) * PLASTIC_SMALL_CAP +
      (s.plastic_med_pcs || 0) * PLASTIC_MED_CAP +
      (s.plastic_big_pcs || 0) * PLASTIC_BIG_CAP;
    const c_plast =
      den > 0
        ? num / den
        : Math.min(
            (p.plastic_small_unit || 0) / PLASTIC_SMALL_CAP || 0,
            (p.plastic_med_unit || 0) / PLASTIC_MED_CAP || 0
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
      (c_plast || 0);

    return { maxPackage, cpp: isNaN(cpp) ? 0 : cpp };
  }, [stock, prices]);

  // Analytics Logic
  const totalValue = safeOrders.reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0
  );
  const totalPaid = safeOrders.reduce((sum, o) => sum + (o.dpAmount || 0), 0);
  const outstanding = Math.max(0, totalValue - totalPaid);

  // Highest Value Order
  const maxOrder =
    safeOrders.length > 0
      ? safeOrders.reduce(
          (prev, current) =>
            (prev.totalAmount || 0) > (current.totalAmount || 0)
              ? prev
              : current,
          safeOrders[0]
        )
      : null;

  const monthlyData = useMemo(() => {
    const report = (overview?.report_six_months || {}) as Record<
      string,
      string
    >;
    const now = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      result.push({
        name: d.toLocaleDateString("id-ID", { month: "long" }),
        total: parseFloat(report[`total_${m}`] || "0"),
        paid: parseFloat(report[`paid_${m}`] || "0"),
      });
    }
    return result;
  }, [overview]);

  // Accumulated Stats
  const completedOrders = safeOrders.filter((o) => o.finishedAt);
  const countFinished = completedOrders.length;
  const countItems = completedOrders.reduce(
    (sum, o) => sum + (Number(o.jumlah) || 0),
    0
  );
  const uniqueClients = new Set(
    safeOrders.map((o) => o.instansi?.trim().toLowerCase())
  ).size;
  const countSponsors = safeOrders.filter((o: any) => o.isSponsor).length;

  const fmt = (n: number) => n.toLocaleString("id-ID");

  return (
    <div className="space-y-6">
      {/* Alert Capacity */}
      {metrics.maxPackage < 50 && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center gap-3 text-orange-800">
          <AlertTriangle size={20} />
          <span className="text-sm font-medium">
            Stok menipis! Kapasitas produksi di bawah 50 paket. Silakan cek menu{" "}
            <b>Stok Bahan</b>.
          </span>
        </div>
      )}

      {/* Top Row: Financials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Total Nilai Pesanan
          </h3>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(overview?.total_order_amount || 0)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Terbayar (DP + Lunas)
          </h3>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(+overview?.total_paid + +overview?.total_dp)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Sisa Piutang
          </h3>
          <div className="text-2xl font-bold text-red-500">
            {formatCurrency(overview?.total_piutang)}
          </div>
        </div>
      </div>

      {/* Middle Row: Operational Stats & Highest Order */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Kapasitas Produksi
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
        </div>

        <div className="lg:col-span-2 bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-xl shadow-md text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Crown size={18} className="text-yellow-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-100">
                Pesanan Nominal Terbesar
              </span>
            </div>
            {safeParseObject(overview?.highest_order) ? (
              <>
                <h3 className="text-2xl font-bold mb-1">
                  {formatCurrency(
                    safeParseObject(overview?.highest_order)?.total_amount
                  )}
                </h3>
                <p className="text-sm text-purple-100 font-medium truncate">
                  {safeParseObject(overview?.highest_order)?.institution_name}
                </p>
              </>
            ) : (
              <p className="text-sm opacity-80">Belum ada data.</p>
            )}
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
            <Crown size={120} />
          </div>
        </div>
      </div>

      {/* Middle Row 2: Status & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Status */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
            <ClipboardList size={16} /> Status Pesanan
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                  {overview?.total_pending}
                </div>
                <span className="text-sm font-medium text-gray-600">
                  Pending
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border border-blue-100 rounded-xl bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                  {overview?.total_confirmed}
                </div>
                <span className="text-sm font-medium text-blue-700 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Proses
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border border-green-100 rounded-xl bg-green-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-xs">
                  {overview?.total_done}
                </div>
                <span className="text-sm font-medium text-green-700 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Selesai
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
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
                  tickFormatter={(v) => v.toLocaleString("id-ID")}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar
                  dataKey="total"
                  name="Total Order"
                  fill="#1e293b"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="total"
                    position="top"
                    style={{ fontSize: "10px", fill: "#666" }}
                    formatter={(val: number) =>
                      val > 0 ? formatCurrency(val) : ""
                    }
                  />
                </Bar>
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
      </div>

      {/* Bottom Row: Accumulation Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition group border border-gray-100">
          <div className="flex items-center justify-center text-blue-600 mb-2 opacity-80 group-hover:scale-110 transition">
            <CheckCircle2 size={32} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {/* {fmt(overview?.total_done)} */}
            {Number(overview?.total_done)}
          </div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Pesanan Selesai
          </div>
        </div>

        <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition group border border-gray-100">
          <div className="flex items-center justify-center text-purple-600 mb-2 opacity-80 group-hover:scale-110 transition">
            <Layers size={32} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {Number(overview?.total_product_sales)}
          </div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Produk Dibuat (Pcs)
          </div>
        </div>

        <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition group border border-gray-100">
          <div className="flex items-center justify-center text-orange-600 mb-2 opacity-80 group-hover:scale-110 transition">
            <Building2 size={32} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {Number(overview?.total_institution)}
          </div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Instansi / Event
          </div>
        </div>

        <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition group border border-gray-100">
          <div className="flex items-center justify-center text-green-600 mb-2 opacity-80 group-hover:scale-110 transition">
            <Handshake size={32} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {Number(overview?.total_sponsor)}
          </div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Sponsor & Partner
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

import { useEffect, useState } from "react";
import { Package, Users, CalendarDays, Building2 } from "lucide-react";

const statsData = [
  {
    id: 1,
    icon: <Package className="w-6 h-6 text-blue-500" />,
    label: "Produk Diproduksi",
    value: 12500,
    suffix: "+",
  },
  {
    id: 2,
    icon: <Users className="w-6 h-6 text-blue-500" />,
    label: "Total Customer",
    value: 3200,
    suffix: "+",
  },
  {
    id: 3,
    icon: <CalendarDays className="w-6 h-6 text-blue-500" />,
    label: "Event Ditangani",
    value: 85.45,
    suffix: "%",
    isPercent: true,
  },
  {
    id: 4,
    icon: <Building2 className="w-6 h-6 text-blue-500" />,
    label: "Instansi Bekerja Sama",
    value: 750,
    suffix: "+",
  },
];

export default function StatsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        {statsData.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>
    </section>
  );
}

function StatCard({ stat }: any) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = stat.value;
    let step = 1;

    // Jika angkanya besar, atur kecepatan agar tetap cepat
    if (end > 10000) step = 50;
    else if (end > 5000) step = 25;
    else if (end > 1000) step = 10;
    else if (end > 100) step = 2;

    const intervalSpeed = Math.max(5, 1000 / end); // makin besar angka makin cepat
    const counter = setInterval(() => {
      start += step;
      if (start >= end) {
        start = end;
        clearInterval(counter);
      }
      setCount(start);
    }, intervalSpeed);

    return () => clearInterval(counter);
  }, [stat.value]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/30 mb-3">
        {stat.icon}
      </div>
      <h3 className="text-3xl font-bold text-gray-900">
        {stat.isPercent
          ? `${count.toFixed(2)}${stat.suffix}`
          : `${Math.floor(count)}${stat.suffix}`}
      </h3>
      <p className="text-gray-500 mt-1">{stat.label}</p>
    </div>
  );
}

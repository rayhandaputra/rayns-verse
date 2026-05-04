"use client";

import { useEffect, useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";

interface StatItem {
  id: number;
  title: string;
  value: number | string;
  suffix?: string;
  icon_type?: string;
  seq?: number;
}

interface StatsSectionProps {
  stats?: StatItem[];
}

// List of available icons from lucide-react
const availableIcons = [
  "Package",
  "Users",
  "CalendarDays",
  "Building2",
  "TrendingUp",
  "Award",
  "Target",
  "Zap",
  "Rocket",
  "Star",
  "Heart",
  "ThumbsUp",
  "Trophy",
  "Sparkles",
  "Gem",
  "Crown",
  "Shield",
  "CheckCircle",
  "Globe",
  "Briefcase",
];

// Get icon component - use stable selection based on id or icon_type
const getIconComponent = (iconType?: string, id?: number) => {
  let iconName = iconType;

  // If no icon_type, use a stable selection based on id
  if (!iconName && id !== undefined) {
    const index = id % availableIcons.length;
    iconName = availableIcons[index];
  } else if (!iconName) {
    // Fallback to Package if no id provided
    iconName = "Package";
  }

  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Package;
  return IconComponent;
};

export default function StatsSection({ stats = [] }: StatsSectionProps) {
  // Fallback to default stats if no data from API
  const defaultStats: StatItem[] = [
    {
      id: 1,
      title: "ID Card Diproduksi",
      value: 12500,
      suffix: "+",
      seq: 0,
    },
    {
      id: 2,
      title: "Jumlah Instansi/Event",
      value: 3200,
      suffix: "+",
      seq: 1,
    },
    {
      id: 3,
      title: "Jumlah Event Disponsori",
      value: 85.45,
      suffix: "%",
      seq: 2,
    },
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  // Sort by seq if available
  const sortedStats = useMemo(() => {
    return [...displayStats].sort((a, b) => {
      const seqA = (a as StatItem).seq ?? 0;
      const seqB = (b as StatItem).seq ?? 0;
      return seqA - seqB;
    });
  }, [displayStats]);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
        {sortedStats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>
    </section>
  );
}

function StatCard({ stat }: { stat: StatItem }) {
  const [count, setCount] = useState(0);

  // Parse value to number
  const numericValue =
    typeof stat.value === "string" ? parseFloat(stat.value) : stat.value;
  const isPercent = stat.suffix === "%" || stat.suffix === "percent";

  // Get icon component - stable selection based on id or icon_type
  // This ensures same icon is rendered on server and client
  const IconComponent = useMemo(() => {
    return getIconComponent(stat.icon_type, stat.id);
  }, [stat.icon_type, stat.id]);

  useEffect(() => {
    let start = 0;
    const end = numericValue || 0;
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
  }, [numericValue]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/30 mb-3">
        <IconComponent className="w-6 h-6 text-blue-500" />
      </div>
      <h3 className="text-3xl font-bold text-gray-900">
        {isPercent
          ? `${count.toFixed(2)}${stat.suffix || ""}`
          : `${Math.floor(count)}${stat.suffix || ""}`}
      </h3>
      <p className="text-gray-500 mt-1">{stat.title}</p>
    </div>
  );
}

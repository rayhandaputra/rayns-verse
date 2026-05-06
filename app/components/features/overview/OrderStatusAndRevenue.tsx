
import React from "react";
import { ClipboardList, Loader2, CheckCircle2 } from "lucide-react";
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
import { formatCurrency } from "~/constants";

export const OrderStatusAndRevenue = ({ overview, monthlyData }: { overview: any, monthlyData: any[] }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Pesanan */}
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
                            <span className="text-sm font-medium text-gray-600">Pending</span>
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

            {/* Omzet Chart */}
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
    );
};

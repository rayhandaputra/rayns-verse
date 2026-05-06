
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart2 } from "lucide-react";
import { formatCurrency } from "~/constants";
import { safeParseArray } from "~/utils/utils";

export const CustomerRankings = ({ overview }: { overview: any }) => {
    const institutionRanks = safeParseArray(overview?.institution_ranks);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Top 5 Kategori / Instansi
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={institutionRanks.slice(0, 5)}
                            margin={{ left: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis
                                dataKey="institution_name"
                                type="category"
                                width={140}
                                fontSize={11}
                                tickFormatter={(val) =>
                                    val.length > 25 ? val.substring(0, 25) + "..." : val
                                }
                            />
                            <Tooltip cursor={{ fill: "transparent" }} />
                            <Bar
                                dataKey="freq"
                                fill="#4f46e5"
                                radius={[0, 4, 4, 0]}
                                name="Jumlah Order"
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-0 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <BarChart2 size={20} /> Ranking Customer
                    </h3>
                </div>
                <div className="overflow-y-auto max-h-64">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3">Nama Instansi / Pemesan</th>
                                <th className="px-6 py-3 text-center">Freq</th>
                                <th className="px-6 py-3 text-right">Total Omzet</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {institutionRanks.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td
                                        className="px-6 py-3 font-medium text-gray-800 truncate max-w-[200px]"
                                        title={item.institution_name}
                                    >
                                        {idx + 1}. {item.institution_name}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                                            {item.freq}x
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-gray-600">
                                        {formatCurrency(item.total_sales)}
                                    </td>
                                </tr>
                            ))}
                            {institutionRanks.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center py-4 text-gray-400">
                                        Belum ada data
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

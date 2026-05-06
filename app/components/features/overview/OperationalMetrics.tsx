
import React from "react";
import { Package, TrendingUp, Crown, AlertTriangle } from "lucide-react";
import { formatCurrency } from "~/constants";
import { safeParseObject } from "~/utils/utils";

export const OperationalMetrics = ({ metrics, overview }: { metrics: any, overview: any }) => {
    return (
        <div className="space-y-6">
            {metrics.maxPackage < 50 && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center gap-3 text-orange-800">
                    <AlertTriangle size={20} />
                    <span className="text-sm font-medium">
                        Stok menipis! Kapasitas produksi di bawah 50 paket. Silakan cek menu{" "}
                        <b>Stok Bahan</b>.
                    </span>
                </div>
            )}

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
        </div>
    );
};

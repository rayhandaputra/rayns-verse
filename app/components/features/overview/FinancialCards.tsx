
import React from "react";
import { formatCurrency } from "~/constants";

export const FinancialCards = ({ overview }: { overview: any }) => {
    return (
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
                    {formatCurrency(Number(overview?.total_paid || 0) + Number(overview?.total_dp || 0))}
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Sisa Piutang
                </h3>
                <div className="text-2xl font-bold text-red-500">
                    {formatCurrency(overview?.total_piutang ?? 0)}
                </div>
            </div>
        </div>
    );
};

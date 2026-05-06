
import React from "react";
import { Loader2 } from "lucide-react";
import { useOverviewLogic } from "./use-overview-logic";
import { FinancialCards } from "./FinancialCards";
import { OperationalMetrics } from "./OperationalMetrics";
import { OrderStatusAndRevenue } from "./OrderStatusAndRevenue";
import { AccumulatedStats } from "./AccumulatedStats";
import { CustomerRankings } from "./CustomerRankings";

export default function OverviewFeature() {
    const {
        loading,
        overview,
        metrics,
        monthlyData
    } = useOverviewLogic();

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 capitalize">
                    Dashboard Overview
                </h2>
                <p className="text-sm text-gray-500">
                    Ringkasan performa dan produksi.
                </p>
            </div>

            <div className="space-y-6">
                <FinancialCards overview={overview} />
                <OperationalMetrics metrics={metrics} overview={overview} />
                <OrderStatusAndRevenue overview={overview} monthlyData={monthlyData} />
                <AccumulatedStats overview={overview} />
                <CustomerRankings overview={overview} />
            </div>
        </div>
    );
}

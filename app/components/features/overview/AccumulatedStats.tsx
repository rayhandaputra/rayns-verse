
import React from "react";
import { CheckCircle2, Layers, Building2, Handshake } from "lucide-react";

export const AccumulatedStats = ({ overview }: { overview: any }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition group border border-gray-100">
                <div className="flex items-center justify-center text-blue-600 mb-2 opacity-80 group-hover:scale-110 transition">
                    <CheckCircle2 size={32} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Number(overview?.total_done || 0)}
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
                    {Number(overview?.total_product_sales || 0)}
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
                    {Number(overview?.total_institution || 0)}
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
                    {Number(overview?.total_sponsor || 0)}
                </div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Sponsor & Partner
                </div>
            </div>
        </div>
    );
};

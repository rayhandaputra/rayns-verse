import React, { useState, useMemo } from "react";
import { useFetcher } from "react-router";
import { 
  Scissors, Ruler, Package, Clock, CheckCircle2, ChevronRight, Hammer, Loader2 
} from "lucide-react";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { formatCurrency, formatFullDate } from "~/constants";

export function VendorFeature() {
  const fetcher = useFetcher();
  const [activeSubTab, setActiveSubTab] = useState<"selempang" | "seragam" | "prod3">("selempang");

  // Fetch all orders
  const { data: responseData, reload, loading } = useFetcherData<any>({
    endpoint: "/api/nexus",
    params: { module: "ORDERS", action: "get", size: 150, pagination: "true" },
    autoLoad: true,
  });

  const orders = useMemo(() => responseData?.data?.items || [], [responseData]);

  // Filter orders related to selempang or selendang
  const selempangOrders = useMemo(() => {
    return orders.filter((o: any) => {
      const nameMatch = o.institution_name?.toLowerCase().includes("selempang") || 
                        o.institution_name?.toLowerCase().includes("selendang");
      const itemMatch = o.items?.some((it: any) => 
        it.product_name?.toLowerCase().includes("selempang") || 
        it.product_name?.toLowerCase().includes("selendang")
      );
      return nameMatch || itemMatch;
    }).sort((a: any, b: any) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime());
  }, [orders]);

  const activeCount = useMemo(() => selempangOrders.filter((o: any) => o.status !== "done").length, [selempangOrders]);
  const doneCount = useMemo(() => selempangOrders.filter((o: any) => o.status === "done").length, [selempangOrders]);

  const handleMarkDone = (orderId: string) => {
    fetcher.submit(
      { action: "update_status", id: orderId, status: "done" },
      { method: "POST" }
    );
    setTimeout(() => reload(), 600);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 text-gray-800">
      <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm w-fit">
        <button 
          onClick={() => setActiveSubTab("selempang")} 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-200 ${activeSubTab === "selempang" ? "bg-emerald-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <Scissors size={18} /> SELEMPANG
        </button>
        <button 
          onClick={() => setActiveSubTab("seragam")} 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-200 ${activeSubTab === "seragam" ? "bg-emerald-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <Ruler size={18} /> SERAGAM
        </button>
        <button 
          onClick={() => setActiveSubTab("prod3")} 
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-200 ${activeSubTab === "prod3" ? "bg-emerald-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <Package size={18} /> PRODUK 3
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-200 shadow-xl overflow-hidden min-h-[60vh] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          </div>
        )}

        {activeSubTab === "selempang" ? (
          <div className="p-10 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black text-gray-900 uppercase">PRODUKSI SELEMPANG GELAR</h3>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Monitoring pengerjaan selempang dan bordir</p>
              </div>
              <div className="flex gap-3 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
                <div className="text-center">
                  <div className="text-[10px] font-black text-emerald-600 uppercase">Aktif</div>
                  <div className="text-lg font-black text-emerald-800">{activeCount}</div>
                </div>
                <div className="w-px bg-emerald-200"></div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-emerald-600 uppercase">Selesai</div>
                  <div className="text-lg font-black text-emerald-800">{doneCount}</div>
                </div>
              </div>
            </div>

            {selempangOrders.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                <Scissors size={48} className="text-gray-300 mb-4" />
                <h4 className="font-bold text-gray-400 uppercase tracking-widest">Belum ada pesanan selempang</h4>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selempangOrders.map((order: any) => (
                  <div key={order.id} className={`bg-white border rounded-[32px] overflow-hidden group hover:shadow-2xl transition-all duration-300 ${order.status === "done" ? "border-gray-100 opacity-70" : "border-emerald-100 shadow-lg"}`}>
                    <div className="p-6 bg-emerald-50/50 flex justify-between items-start border-b border-emerald-100/50">
                      <div className="space-y-1">
                        <div className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">#{order.order_number || order.id.slice(-6)}</div>
                        <h4 className="font-black text-gray-800 uppercase text-sm truncate w-40" title={order.institution_name}>{order.institution_name}</h4>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${order.status === "done" ? "bg-gray-200 text-gray-500" : "bg-orange-500 text-white animate-pulse"}`}>
                        {order.status}
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase tracking-widest">Jumlah</span>
                        <span className="font-black text-gray-700">{order.qty || 1} PCS</span>
                      </div>
                      <div className="space-y-2">
                        {order.items?.map((it: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="font-black text-[10px] text-gray-800 uppercase">{it.product_name}</div>
                            {it.variant_name && (
                              <span className="bg-white text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded text-[8px] font-black uppercase mt-1 inline-block">{it.variant_name}</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock size={14}/>
                          <span className="text-[10px] font-bold uppercase">{order.deadline_on ? formatFullDate(order.deadline_on) : "-"}</span>
                        </div>
                        {order.status !== "done" && (
                          <button 
                            onClick={() => handleMarkDone(order.id)} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-md active:scale-95"
                          >
                            <CheckCircle2 size={12}/> SELESAI
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
            <div className="p-6 bg-emerald-50 rounded-full text-emerald-600 animate-bounce">
              <Hammer size={48} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 uppercase">DALAM PENGEMBANGAN</h3>
            <p className="text-gray-400 font-bold uppercase tracking-widest max-w-xs px-6">Fitur integrasi vendor untuk kategori ini sedang disiapkan.</p>
          </div>
        )}
      </div>
    </div>
  );
}

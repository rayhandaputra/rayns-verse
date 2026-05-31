import { useMemo, useState } from "react";
import { useLoaderData, useNavigate, useSearchParams, useOutletContext, useFetcher } from "react-router";
import {
  Clock, CheckCircle2, Plus, ChevronRight, ExternalLink,
  CreditCard, Package, Truck, FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getOptionalUser } from "~/utils/session.server";
import { API } from "~/nexus/index.server";
import type { LoaderFunction, ActionFunction } from "react-router";
import { safeParseArray } from "~/utils/utils";
import { formatFullDate } from "~/constants";

export const loader: LoaderFunction = async ({ request }) => {
  const result = await getOptionalUser(request);
  const user: any = result
    ? (typeof result.user === "string" ? JSON.parse(result.user) : result.user)
    : null;

  let orders: any[] = [];
  if (user?.phone) {
    try {
      const res = await API.ORDERS.get({
        session: { user, token: result?.token },
        req: { query: { page: 0, size: 50, sort: "created_on:desc", pic_phone: user.phone } },
      });
      orders = res?.items || [];
    } catch { orders = []; }
  }

  return { orders };
};

export const action: ActionFunction = async ({ request }) => {
  const result = await getOptionalUser(request);
  if (!result) return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const user = typeof result.user === "string" ? JSON.parse(result.user) : result.user;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create_order") {
    const institution_name = formData.get("institution_name") as string;
    const pic_name = formData.get("pic_name") as string;
    const pic_phone = formData.get("pic_phone") as string;
    const member_count = Number(formData.get("member_count")) || 1;
    const payment_type = formData.get("payment_type") as string;
    const total_amount = Number(formData.get("total_amount")) || 0;
    const dp_amount = Number(formData.get("dp_amount")) || 0;
    const front_design_id = formData.get("front_design_id") as string;
    const back_design_id = formData.get("back_design_id") as string;
    const lanyard_design_id = formData.get("lanyard_design_id") as string;
    const payment_proof = formData.get("payment_proof") as string;

    try {
      const res = await API.ORDERS.create({
        session: { user, token: result.token },
        req: {
          body: {
            institution_name: institution_name || pic_name,
            pic_name,
            pic_phone,
            order_type: "package",
            status: "pending",
            payment_status: payment_type === "dp" ? "down_payment" : "unpaid",
            total_amount,
            dp_amount,
            payment_proof: payment_proof || null,
            notes: `Desain: Front=${front_design_id}, Back=${back_design_id}, Lanyard=${lanyard_design_id}`,
            created_by: JSON.stringify({ id: user.id, fullname: user.fullname }),
            items: [
              {
                product_name: "Paket ID Card + Lanyard",
                product_type: "package",
                qty: member_count,
                unit_price: Math.round(total_amount / member_count),
              },
            ],
          },
        },
      });

      return Response.json({ success: res.success, message: res.message || "Pesanan berhasil dibuat" });
    } catch (err: any) {
      return Response.json({ success: false, message: err.message || "Gagal membuat pesanan" }, { status: 500 });
    }
  }

  return Response.json({ success: false, message: "Intent tidak dikenali" });
};

export default function CustomerOrders() {
  const { orders } = useLoaderData() as { orders: any[] };
  const { user } = useOutletContext<{ user: any; isDemo: boolean }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  const filteredOrders = useMemo(() => {
    if (filter === "active") return orders.filter((o) => !["done", "cancelled"].includes(o.status));
    if (filter === "done") return orders.filter((o) => o.status === "done");
    return orders;
  }, [orders, filter]);

  const selectedOrderNum = searchParams.get("order");
  const selectedOrder = useMemo(
    () => orders.find((o) => o.order_number === selectedOrderNum),
    [orders, selectedOrderNum]
  );

  if (selectedOrder) {
    return <OrderDetail order={selectedOrder} onBack={() => navigate("/customer/orders")} />;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-slate-800">Pesanan Saya</h2>
          <button
            onClick={() => navigate("/customer/configure")}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0097B2] text-white text-[10px] font-bold rounded-xl shadow-md active:scale-95 transition-all uppercase tracking-wider"
          >
            <Plus size={12} strokeWidth={3} /> Buat Baru
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
          {([["all", "Semua"], ["active", "Aktif"], ["done", "Selesai"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all ${
                filter === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Order List */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2.5">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} onClick={() => navigate(`/customer/orders?order=${order.order_number}`)} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package size={40} className="text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-400">Belum ada pesanan</p>
            <p className="text-xs text-slate-300 mt-1">Klik "Buat Baru" untuk mulai memesan</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Order Card ─── */
function OrderCard({ order, onClick }: { order: any; onClick: () => void }) {
  const statusMap: Record<string, { color: string; label: string }> = {
    pending: { color: "bg-slate-100 text-slate-600", label: "Pending" },
    confirmed: { color: "bg-blue-50 text-blue-600", label: "Diproses" },
    in_production: { color: "bg-amber-50 text-amber-600", label: "Produksi" },
    ready: { color: "bg-emerald-50 text-emerald-600", label: "Siap" },
    done: { color: "bg-green-50 text-green-600", label: "Selesai" },
    cancelled: { color: "bg-red-50 text-red-500", label: "Batal" },
  };
  const paymentMap: Record<string, { color: string; label: string }> = {
    paid: { color: "text-green-600", label: "Lunas" },
    down_payment: { color: "text-amber-600", label: "DP" },
    unpaid: { color: "text-red-500", label: "Belum Bayar" },
    none: { color: "text-slate-400", label: "-" },
  };

  const s = statusMap[order.status] || statusMap.pending;
  const p = paymentMap[order.payment_status] || paymentMap.none;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{order.order_number}</span>
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${s.color}`}>{s.label}</span>
          </div>
          <p className="text-sm font-bold text-slate-700 truncate">{order.institution_name || order.pic_name}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock size={10} /> {formatFullDate(order.order_date || order.created_on)}
            </span>
            <span className={`text-[10px] font-bold ${p.color}`}>{p.label}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-[#1E434C]">
            Rp {new Intl.NumberFormat("id-ID").format(order.total_amount || 0)}
          </p>
          <ChevronRight size={14} className="text-slate-300 ml-auto mt-1" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Order Detail View ─── */
function OrderDetail({ order, onBack }: { order: any; onBack: () => void }) {
  const items = safeParseArray(order.order_items);

  const statusSteps = [
    { key: "pending", label: "Pending", icon: Clock },
    { key: "confirmed", label: "Diproses", icon: CheckCircle2 },
    { key: "in_production", label: "Produksi", icon: Package },
    { key: "ready", label: "Siap", icon: Truck },
    { key: "done", label: "Selesai", icon: CheckCircle2 },
  ];

  const currentIdx = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="px-5 pt-5 pb-8 space-y-5">
        {/* Back button */}
        <button onClick={onBack} className="text-xs font-bold text-[#0097B2] flex items-center gap-1">
          ← Kembali
        </button>

        {/* Order Header */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{order.order_number}</p>
          <h3 className="text-lg font-black text-slate-800 mt-1">{order.institution_name || order.pic_name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{order.pic_name} • {order.pic_phone}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-lg font-black text-[#1E434C]">
              Rp {new Intl.NumberFormat("id-ID").format(order.total_amount || 0)}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
              order.payment_status === "paid" ? "bg-green-50 text-green-600" :
              order.payment_status === "down_payment" ? "bg-amber-50 text-amber-600" :
              "bg-red-50 text-red-500"
            }`}>
              {order.payment_status === "paid" ? "Lunas" : order.payment_status === "down_payment" ? "DP" : "Belum Bayar"}
            </span>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-4">Status Produksi</h4>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={step.key} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCurrent ? "bg-[#0097B2] text-white shadow-md" :
                    isCompleted ? "bg-[#0097B2]/20 text-[#0097B2]" :
                    "bg-slate-100 text-slate-300"
                  }`}>
                    <Icon size={14} />
                  </div>
                  <span className={`text-[8px] font-bold text-center ${isCurrent ? "text-[#0097B2]" : isCompleted ? "text-slate-500" : "text-slate-300"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Item Pesanan</h4>
            <div className="space-y-2">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-xs font-bold text-slate-700">{item.product_name}</p>
                    <p className="text-[10px] text-slate-400">{item.variant_name || "Standard"} × {item.qty}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    Rp {new Intl.NumberFormat("id-ID").format(item.variant_final_price || item.subtotal || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drive Link */}
        {order.drive_folder_id && (
          <a
            href={`/public/drive-link/${order.order_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-700"
          >
            <ExternalLink size={18} />
            <div>
              <p className="text-xs font-bold">Buka Drive Pesanan</p>
              <p className="text-[10px] text-blue-500">Upload & lihat file desain</p>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}

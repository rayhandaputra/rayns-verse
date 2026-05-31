import { useOutletContext, useNavigate, useLoaderData } from "react-router";
import {
  Sparkles,
  ShoppingBag,
  Clock,
  ChevronRight,
  CreditCard,
  Star,
  Image,
} from "lucide-react";
import { motion } from "motion/react";
import { getOptionalUser } from "~/utils/session.server";
import { API } from "~/nexus/index.server";
import type { LoaderFunction } from "react-router";
import { safeParseArray } from "~/utils/utils";

export const loader: LoaderFunction = async ({ request }) => {
  const result = await getOptionalUser(request);
  const userData = result ? (typeof result.user === "string" ? JSON.parse(result.user) : result.user) : null;

  let recentOrders: any[] = [];
  let products: any[] = [];
  let portfolio: any[] = [];

  try {
    // Fetch recent orders by phone
    if (userData?.phone) {
      const orderRes = await API.ORDERS.get({
        session: { user: userData, token: result?.token },
        req: { query: { page: 0, size: 3, sort: "created_on:desc", pic_phone: userData.phone } },
      });
      recentOrders = orderRes?.items || [];
    }

    // Fetch products for pricelist
    const productRes = await API.PRODUCT.get({
      session: { user: userData, token: result?.token },
      req: { query: { page: 0, size: 6, show_in_dashboard: 1 } },
    });
    products = productRes?.items || [];

    // Fetch portfolio (recent finished orders with images)
    const portfolioRes = await API.ORDERS.get({
      session: { user: userData, token: result?.token },
      req: { query: { page: 0, size: 6, is_portfolio: 1, sort: "created_on:desc" } },
    });
    portfolio = (portfolioRes?.items || []).filter((o: any) => {
      const imgs = safeParseArray(o.images);
      return imgs.length > 0;
    });
  } catch {}

  return { recentOrders, products, portfolio };
};

export default function CustomerDashboardTab() {
  const { user } = useOutletContext<{ user: any; isDemo: boolean }>();
  const { recentOrders, products, portfolio } = useLoaderData() as any;
  const navigate = useNavigate();

  const statusLabel: Record<string, string> = {
    pending: "Pending", confirmed: "Diproses", in_production: "Produksi",
    done: "Selesai", ready: "Siap Ambil", ordered: "Menunggu",
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="px-5 pt-5 pb-8 space-y-5">

        {/* ─── Hero CTA ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E434C] to-[#35606B] p-6 text-white shadow-xl"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#0097B2]/10 rounded-full blur-xl" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-[#0097B2] uppercase tracking-widest mb-1">
              ✨ Percetakan Kinau ID
            </p>
            <h1 className="text-xl font-black leading-tight tracking-tight">
              Buat ID Card Kamu Sekarang
            </h1>
            <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
              Desain premium, cetak cepat, harga terjangkau. Mulai dari Rp 5.000/pcs.
            </p>
            <button
              onClick={() => navigate("/customer/orders")}
              className="mt-4 w-full py-3 bg-[#0097B2] hover:bg-[#0097B2]/90 text-white font-bold text-xs rounded-xl transition-all active:scale-[0.97] shadow-lg shadow-[#0097B2]/30 uppercase tracking-wider"
            >
              Mulai Pesan Sekarang →
            </button>
          </div>
        </motion.div>

        {/* ─── Quick Stats ─── */}
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard icon={ShoppingBag} label="Pesanan" value={String(recentOrders?.length || 0)} color="blue" />
          <StatCard icon={Image} label="Portfolio" value={String(portfolio?.length || 0)} color="emerald" />
          <StatCard icon={Star} label="Produk" value={String(products?.length || 0)} color="amber" />
        </div>

        {/* ─── Pricelist Widget ─── */}
        {products.length > 0 && (
          <section>
            <SectionHeader title="Pricelist Produk" />
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
              {products.map((p: any) => (
                <div key={p.id} className="shrink-0 w-36 bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
                  {p.image && (
                    <img src={p.image} alt={p.name} className="w-full h-20 object-cover rounded-xl mb-2 bg-slate-50" />
                  )}
                  <h4 className="text-[11px] font-bold text-slate-700 line-clamp-2 leading-tight">{p.name}</h4>
                  <p className="text-[11px] font-black text-[#0097B2] mt-1">
                    Rp {new Intl.NumberFormat("id-ID").format(p.total_price || 0)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Portfolio Gallery ─── */}
        {portfolio.length > 0 && (
          <section>
            <SectionHeader title="Galeri Produksi" />
            <div className="grid grid-cols-3 gap-2">
              {portfolio.slice(0, 6).map((o: any) => {
                const imgs = safeParseArray(o.images);
                const thumb = imgs[0];
                return thumb ? (
                  <div key={o.id} className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                    <img src={thumb} alt={o.institution_name} className="w-full h-full object-cover" />
                  </div>
                ) : null;
              })}
            </div>
          </section>
        )}

        {/* ─── Recent Orders ─── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <SectionHeader title="Pesanan Terbaru" />
            {recentOrders.length > 0 && (
              <button onClick={() => navigate("/customer/orders")} className="text-[10px] font-bold text-[#0097B2] flex items-center gap-0.5">
                Semua <ChevronRight size={12} />
              </button>
            )}
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-2.5">
              {recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/customer/orders?order=${order.order_number}`)}
                  className="p-3.5 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 active:scale-[0.98] transition-all shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shrink-0">
                    {order.order_type === "lanyard" ? "🎗️" : "💳"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{order.order_number}</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{order.institution_name || order.pic_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black text-[#1E434C]">
                      Rp {new Intl.NumberFormat("id-ID").format(order.total_amount || 0)}
                    </span>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                      {statusLabel[order.status] || order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center bg-white rounded-2xl border border-slate-100">
              <ShoppingBag size={24} className="text-slate-200 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-400">Belum ada pesanan</p>
              <p className="text-[10px] text-slate-300 mt-0.5">Mulai pesan ID Card atau Lanyard sekarang</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center shadow-sm">
      <div className={`w-8 h-8 rounded-xl ${colors[color]} flex items-center justify-center mx-auto mb-1.5`}>
        <Icon size={14} />
      </div>
      <p className="text-lg font-black text-slate-800 leading-none">{value}</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
      <span className="w-1 h-3.5 bg-[#0097B2] rounded-full" />
      {title}
    </h3>
  );
}

import { useState, useEffect } from "react";
import { useFetcher, useNavigate } from "react-router";
import {
  ShoppingBag,
  Package,
  Image as ImageIcon,
  Users,
  ChevronRight,
  LogOut,
  Bell,
  User as UserIcon,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  ExternalLink,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { requireRole } from "~/utils/session.server";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import type { LoaderFunction } from "react-router";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/nexus/nexus-client";
import { dateFormat } from "~/utils/dateFormatter";
import Swal from "sweetalert2";

export const loader: LoaderFunction = async ({ request }) => {
  const { user } = await requireRole(request, ["customer", "admin", "ceo", "developer", "staff"]);
  return Response.json({ user });
};

export default function CustomerDashboard({ loaderData }: { loaderData: any }) {
  const { user } = loaderData;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [isScrolled, setIsScrolled] = useState(false);

  const { data: customerOrders, loading: loadingOrders } = useFetcherData({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({
        search: user?.fullname || "", // Searching by customer name for now as a proxy
        pagination: "true",
        page: 0,
        size: 5
      })
      .build(),
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { id: "home", label: "Beranda", icon: ShoppingBag },
    { id: "orders", label: "Pesanan", icon: Clock },
    { id: "products", label: "Produk", icon: Package },
    { id: "twibbon", label: "Twibbonize", icon: ImageIcon },
    { id: "affiliate", label: "Affiliate", icon: Users, disabled: true },
  ];

  const fetcher = useFetcher();
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Konfirmasi Logout",
      text: "Apakah Anda yakin ingin keluar dari akun ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        confirmButton:
          "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg focus:outline-none",
        cancelButton:
          "bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg ml-2 mr-2",
        popup: "rounded-2xl shadow-lg",
        title: "text-lg font-semibold text-gray-800",
        htmlContainer: "text-gray-600",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      fetcher.submit(null, { method: "post", action: "/logout" });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 font-sans text-slate-900 selection:bg-blue-100">
      {/* Top Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${isScrolled ? "bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/40 py-3" : "bg-transparent py-5"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#103557] flex items-center justify-center shadow-lg shadow-blue-900/20 transform hover:rotate-6 transition-transform">
              <img src="/kinau-logo.png" className="w-6 h-auto brightness-0 invert" alt="" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black tracking-tight text-[#103557]">KINAU DASHBOARD</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="relative p-2 text-slate-400 hover:text-[#103557] transition-colors rounded-xl hover:bg-slate-50">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>
            <div className="h-6 w-[1px] bg-slate-200 hidden sm:block mx-1"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-900 leading-none mb-1">{user?.fullname || "Customer"}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user?.role || "Member"}</p>
              </div>
              <div className="relative group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 border border-white shadow-sm flex items-center justify-center text-[#103557] font-black overflow-hidden ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                  {user?.fullname?.charAt(0) || "U"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all group"
                title="Logout"
              >
                <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32">
        {/* Welcome Section */}
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#103557] p-8 md:p-12 text-white shadow-2xl shadow-blue-900/10 border border-white/5">
            {/* Decorative Elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-cyan-400/10 rounded-full blur-[80px]"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="max-w-xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-inner">
                    <Sparkles size={12} className="text-amber-300 animate-spin-slow" /> <span className="opacity-80">Portal Eksklusif</span> Pelanggan
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black mb-4 leading-[1.05] tracking-tight">
                    Halo, {user?.fullname?.split(' ')[0] || "Teman Kinau"}! 👋
                  </h2>
                  <p className="text-blue-100/60 text-lg font-medium leading-relaxed max-w-md">
                    Kelola semua pesanan cetak ID Card & Lanyard kamu dalam satu dashboard yang modern dan praktis.
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  onClick={() => navigate("/katalog")}
                  className="h-16 px-10 bg-white text-[#103557] hover:bg-white hover:scale-105 active:scale-95 font-black rounded-[1.25rem] shadow-2xl shadow-black/10 flex items-center justify-center gap-3 transition-all"
                >
                  <ShoppingBag size={20} /> Mulai Pesanan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("twibbon")}
                  className="h-16 px-10 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 hover:border-white/40 active:scale-95 font-black rounded-[1.25rem] flex items-center justify-center gap-3 transition-all"
                >
                  <ImageIcon size={20} /> Twibbonize
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Categories / Services */}
        <section className="mb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            <MenuCard
              title="Daftar Pesanan"
              subtitle="Cek status terkini"
              icon={Clock}
              color="blue"
              onClick={() => setActiveTab("orders")}
              isActive={activeTab === "orders"}
            />
            <MenuCard
              title="Katalog Produk"
              subtitle="Pilihan terbaik"
              icon={Package}
              color="emerald"
              onClick={() => navigate("/katalog")}
            />
            <MenuCard
              title="Twibbonize"
              subtitle="Siapkan desain"
              icon={QrCode}
              color="amber"
              onClick={() => setActiveTab("twibbon")}
              isActive={activeTab === "twibbon"}
            />
            <MenuCard
              title="Affiliate"
              subtitle="Segera hadir"
              icon={Users}
              color="purple"
              disabled={true}
              onClick={() => toast.info("Affiliate Program akan segera rilis!")}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">
            <AnimatePresence mode="wait">
              {activeTab === "home" || activeTab === "orders" ? (
                <motion.div
                  key="orders-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-100 relative group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                        Pesanan Terbaru
                      </h4>
                      <p className="text-sm text-slate-400 font-medium mt-1">Status real-time dari setiap pesanan Anda</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/katalog")}
                      className="text-blue-600 font-black hover:bg-blue-50 rounded-2xl px-6 h-12 flex items-center gap-2 group/btn"
                    >
                      Buat Pesanan Baru <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>

                  <div className="space-y-5 min-h-[300px]">
                    {loadingOrders ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Clock className="w-12 h-12 text-blue-100 animate-spin-slow" />
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Sinkronisasi data...</p>
                      </div>
                    ) : (customerOrders?.data?.items || []).length > 0 ? (
                      (customerOrders.data.items as any[]).map((order) => (
                        <OrderListItem
                          key={order.id}
                          id={`#${order.order_number}`}
                          title={order.institution_name || "Pesanan Personal"}
                          status={order.status}
                          date={dateFormat(order.created_on)}
                          price={`Rp ${new Intl.NumberFormat("id-ID").format(order.total_amount)}`}
                          onClick={() => {
                            // Potentially navigate to specific order detail or open modal
                            toast.info(`Detail pesanan ${order.order_number} sedang disiapkan`);
                          }}
                        />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm text-slate-200 mb-6 group-hover:scale-110 transition-transform">
                          <ShoppingBag size={40} />
                        </div>
                        <h5 className="font-black text-slate-800 text-lg">Belum Ada Pesanan</h5>
                        <p className="text-slate-400 text-sm mt-1 max-w-[200px] text-center font-medium">Mulai projek cetak pertamamu hari ini!</p>
                        <Button
                          onClick={() => navigate("/katalog")}
                          className="mt-8 bg-[#103557] font-black rounded-xl px-8"
                        >
                          Kunjungi Katalog
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : activeTab === "twibbon" ? (
                <motion.div
                  key="twibbon-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100"
                >
                  <div className="text-center max-w-md mx-auto py-10">
                    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <ImageIcon size={40} />
                    </div>
                    <h4 className="text-2xl font-black text-slate-800 mb-4">Lanjut Order Twibbon</h4>
                    <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                      Masukkan kode unik pesanan kamu untuk mulai memasukkan foto ke template ID Card atau Lanyard yang sudah kamu pesan.
                    </p>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center text-slate-400">
                        <QrCode size={20} />
                      </div>
                      <input
                        type="text"
                        placeholder="NIK / Kode Pesanan"
                        className="w-full h-16 pl-14 pr-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none text-lg font-black uppercase tracking-widest placeholder:text-slate-300"
                      />
                      <button className="absolute right-3 top-2 bottom-2 px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 active:scale-95">
                        Lanjut
                      </button>
                    </div>
                    <p className="mt-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      ⚠️ Kode ini tersedia di nota fisik atau detail pesanan digital kamu.
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Sidebar / Sidebar Widgets */}
          <div className="lg:col-span-4 space-y-8">
            {/* Quick Actions Widget */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-[0.03] pointer-events-none transition-opacity duration-700 delay-100">
                <Sparkles size={160} />
              </div>
              <h4 className="text-xl font-black text-slate-900 tracking-tight mb-8 flex items-center gap-2">
                Bantuan <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              </h4>

              <div className="space-y-4">
                <QuickAction
                  title="Chat CS KINAU"
                  icon={MessageCircle}
                  desc="WhatsApp Fast Response"
                  color="bg-emerald-50 text-emerald-600"
                  onClick={() => window.open("https://wa.me/628123456789", "_blank")}
                />
                <QuickAction
                  title="Tutorial Order"
                  icon={AlertCircle}
                  desc="Panduan penggunaan aplikasi"
                  color="bg-blue-50 text-blue-600"
                />
                <QuickAction
                  title="Lokasi Kantor"
                  icon={ExternalLink}
                  desc="Maps Kinau Creative"
                  color="bg-slate-50 text-slate-600"
                />
              </div>
            </div>

            {/* Stats / Point Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-900/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/60 mb-6">Loyalty Program</h5>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-4xl font-black tracking-tighter mb-1">0</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Point Kinau</p>
                </div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                  <Sparkles size={24} className="text-amber-300" />
                </div>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-6">
                <div className="w-0 h-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
              </div>
              <p className="text-[10px] font-bold text-blue-100/70 italic">Kumpulkan point setiap transaksi untuk mendapatkan merchandise eksklusif!</p>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Bottom Navigation (Mobile Only) */}
      <nav className="fixed bottom-6 left-6 right-6 z-50 md:hidden flex justify-around items-center bg-[#103557]/95 backdrop-blur-xl rounded-[2rem] py-4 px-2 shadow-2xl shadow-blue-900/40 border border-white/10">
        {menuItems.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.disabled) return;
              setActiveTab(item.id);
              if (item.id === "products") navigate("/katalog");
            }}
            className={`flex flex-col items-center gap-1.5 transition-all relative ${activeTab === item.id ? "text-white scale-110" : "text-white/40"
              } ${item.disabled ? "opacity-30" : ""}`}
          >
            <item.icon size={22} className={activeTab === item.id ? "stroke-[2.5px]" : "stroke-2"} />
            <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
            {activeTab === item.id && (
              <motion.div
                layoutId="active-pill"
                className="absolute -top-1 w-1 h-1 bg-amber-400 rounded-full"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

function MenuCard({ title, subtitle, icon: Icon, color, onClick, disabled, isActive }: any) {
  const colors: any = {
    blue: {
      active: "bg-blue-600 text-white shadow-xl shadow-blue-600/20 border-blue-600",
      idle: "bg-white text-blue-600 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50"
    },
    emerald: {
      active: "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 border-emerald-600",
      idle: "bg-white text-emerald-600 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50"
    },
    amber: {
      active: "bg-amber-500 text-white shadow-xl shadow-amber-500/20 border-amber-500",
      idle: "bg-white text-amber-600 border-slate-100 hover:border-amber-200 hover:bg-amber-50/50"
    },
    purple: {
      active: "bg-purple-600 text-white shadow-xl shadow-purple-600/20 border-purple-600",
      idle: "bg-white text-purple-600 border-slate-100 hover:border-purple-200 hover:bg-purple-50/50"
    },
  };

  const style = isActive ? colors[color].active : colors[color].idle;

  return (
    <motion.button
      whileHover={!disabled ? { y: -8, scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      onClick={onClick}
      className={`p-6 md:p-8 rounded-[2.5rem] border text-left flex flex-col justify-between h-48 md:h-56 transition-all relative overflow-hidden group shadow-sm ${style} ${disabled ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700 ${isActive ? 'text-white' : ''}`}>
        <Icon size={80} />
      </div>
      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-white/20' : 'bg-slate-50'} shadow-inner`}>
        <Icon size={24} className={isActive ? 'text-white' : ''} />
      </div>
      <div className="relative z-10">
        <h4 className={`font-black uppercase tracking-tight text-sm md:text-lg leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>{title}</h4>
        <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.1em] mt-1.5 opacity-60 ${isActive ? 'text-white' : 'text-slate-400'}`}>{subtitle}</p>
      </div>
    </motion.button>
  );
}

function OrderListItem({ id, title, status, date, price, onClick }: any) {
  const statusStyles: any = {
    ordered: { bg: "bg-blue-50", text: "text-blue-600", label: "Menunggu", icon: Clock },
    confirmed: { bg: "bg-indigo-50", text: "text-indigo-600", label: "Dikonfirmasi", icon: CheckCircle2 },
    in_production: { bg: "bg-amber-50", text: "text-amber-600", label: "Produksi", icon: Clock },
    producing: { bg: "bg-amber-50", text: "text-amber-600", label: "Produksi", icon: Clock },
    qc: { bg: "bg-cyan-50", text: "text-cyan-600", label: "Quality Check", icon: CheckCircle2 },
    ready: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Siap Ambil", icon: Sparkles },
    shipped: { bg: "bg-indigo-50", text: "text-indigo-600", label: "Dikirim", icon: Package },
    delivered: { bg: "bg-blue-50", text: "text-blue-600", label: "Terkirim", icon: CheckCircle2 },
    done: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Selesai", icon: CheckCircle2 },
    rejected: { bg: "bg-red-50", text: "text-red-600", label: "Ditolak", icon: AlertCircle },
    cancelled: { bg: "bg-red-50", text: "text-red-600", label: "Batal", icon: AlertCircle },
    pending: { bg: "bg-slate-50", text: "text-slate-600", label: "Pending", icon: Clock },
  };

  const style = statusStyles[status] || statusStyles.pending;

  return (
    <div
      className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 md:p-6 rounded-3xl bg-white hover:bg-slate-50 transition-all border border-slate-100 hover:border-slate-200 group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-5 w-full md:w-auto">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${style.bg} ${style.text} shadow-sm group-hover:scale-110 transition-transform flex-shrink-0`}>
          <style.icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{id}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${style.bg} ${style.text} border ${style.bg.replace('bg-', 'border-')}`}>
              {style.label}
            </span>
          </div>
          <h5 className="font-bold text-slate-800 text-sm md:text-lg line-clamp-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{title}</h5>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Clock size={10} /> {date}
            </p>
            <p className="md:hidden font-black text-[#103557] tracking-tight">{price}</p>
          </div>
        </div>
      </div>
      <div className="text-right hidden md:block border-l border-slate-100 pl-8 ml-8 h-10 flex flex-col justify-center">
        <p className="font-black text-slate-900 tracking-tight text-lg">{price}</p>
        <button className="text-[10px] font-black text-blue-600 uppercase tracking-[0.1em] hover:opacity-80 flex items-center justify-end gap-1 group/link">
          Detail <ChevronRight size={10} className="group-hover/link:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function QuickAction({ title, icon: Icon, desc, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-5 rounded-[1.75rem] bg-white border border-slate-50 hover:border-slate-200 hover:bg-slate-50 transition-all text-left group shadow-sm hover:shadow-md"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${color} shadow-sm`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h6 className="text-[10px] font-black uppercase tracking-widest text-[#103557] mb-0.5">{title}</h6>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight line-clamp-1">{desc}</p>
      </div>
      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
    </button>
  );
}

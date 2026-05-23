import { ArrowRight, Star, Package, Users, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { formatCurrency } from "~/constants";

interface StepLandingProps {
  onNext: () => void;
  products: any[];
  portfolioItems: any[];
  stats: { countFinished: number; uniqueClients: number };
}

export default function StepLanding({ onNext, products, portfolioItems, stats }: StepLandingProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Hero Section */}
      <div className="flex-shrink-0 bg-gradient-to-br from-primary to-[#35606B] px-5 pt-6 pb-5 rounded-b-3xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full mb-3">
            <Sparkles size={12} className="text-yellow-300" />
            <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">
              Konveksi Terpercaya
            </span>
          </div>
          <h1 className="text-xl font-black text-white leading-tight mb-2">
            ID Card & Lanyard Premium
          </h1>
          <p className="text-xs text-white/70 mb-4 max-w-[260px] mx-auto">
            Desain profesional, kualitas cetak terbaik, pengerjaan cepat
          </p>
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-accent/30 transition-all active:scale-95"
          >
            Buat Id Card Kamu Sekarang
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>

      {/* Content Area — scrollable within bounds */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-2">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <Package size={14} className="text-accent" />
              </div>
              <span className="text-lg font-black text-foreground">{stats.countFinished}+</span>
            </div>
            <p className="text-[10px] text-gray-500 font-medium">Pesanan Selesai</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <Users size={14} className="text-purple-600" />
              </div>
              <span className="text-lg font-black text-foreground">{stats.uniqueClients}+</span>
            </div>
            <p className="text-[10px] text-gray-500 font-medium">Klien Terlayani</p>
          </div>
        </div>

        {/* Pricelist */}
        {products.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">
              Daftar Harga
            </h3>
            <div className="space-y-2">
              {products.slice(0, 4).map((product: any) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-50"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Package size={16} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-400">{product.category_name || "Produk"}</p>
                  </div>
                  <span className="text-xs font-black text-accent">
                    {formatCurrency(product.total_price || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Showcase */}
        {portfolioItems.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">
              Hasil Produksi Terbaru
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {portfolioItems.slice(0, 6).map((item: any) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-28 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-50"
                >
                  {item.images ? (
                    <img
                      src={typeof item.images === "string" ? item.images.split(",")[0] : ""}
                      alt={item.institution_name}
                      className="w-full h-20 object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-full h-20 bg-secondary flex items-center justify-center">
                      <Star size={16} className="text-gray-300" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-[9px] font-bold text-foreground truncate">
                      {item.institution_name || "Client"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

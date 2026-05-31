import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ADMIN_WA, getWhatsAppLink } from "~/utils/utils";

export const PublicHero = () => {
  return (
    <section className="relative pt-40 pb-20 md:pt-56 md:pb-32 overflow-hidden bg-white">
      {/* Top Accent Image */}
      <div className="absolute top-0 left-0 w-full pointer-events-none z-0">
        <img src="/Home-Atas.png" className="w-full h-auto object-cover" alt="" />
      </div>

      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-7xl font-bold text-[#1a1a1a] tracking-tight mb-8 leading-[1.1] font-sans">
            Cetak ID Card & Lanyard <br />
            <span className="text-[#007BFF]">Berkualitas Tinggi</span>
          </h1>
          <p className="text-gray-500 text-lg md:text-xl md:px-20 mb-12 leading-relaxed">
            Solusi percetakan profesional untuk kebutuhan event, kantor, dan komunitas Anda. 
            Cepat, presisi, dan harga bersahabat.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
            <a
              href={getWhatsAppLink(ADMIN_WA, "Halo Kinau.id...")}
              className="px-10 py-4 rounded-full bg-[#1A73E8] text-white font-bold hover:bg-[#1A73E8]/90 transition-all flex items-center gap-3 text-base shadow-lg shadow-blue-500/20"
            >
              Pesan Sekarang <ArrowRight size={18} />
            </a>
            
            <a href="#produk" className="px-10 py-4 rounded-full border border-gray-200 text-[#1a1a1a] font-bold hover:bg-gray-50 transition-all text-base shadow-sm">
              Daftar Produk
            </a>
            <a href="#portfolio" className="px-10 py-4 rounded-full border border-gray-200 text-[#1a1a1a] font-bold hover:bg-gray-50 transition-all text-base shadow-sm">
              Produksi Terbaru
            </a>
            <a href="#kontak" className="px-10 py-4 rounded-full border border-gray-200 text-[#1a1a1a] font-bold hover:bg-gray-50 transition-all text-base shadow-sm">
              Kontak
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PublicHero;

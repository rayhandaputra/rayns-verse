import { motion } from "framer-motion";
import { CheckCircle, Layers, Building2, Handshake } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("id-ID");

export const PublicStats = ({
  countFinished,
  countItems,
  uniqueClients,
  countSponsors,
}: {
  countFinished: number;
  countItems: number;
  uniqueClients: number;
  countSponsors: number;
}) => {
  const statItems = [
    { icon: CheckCircle, value: countFinished || 578, label: "Pesanan Selesai", color: "#0097B2" },
    { icon: Layers, value: countItems || 5120, label: "Produk Dibuat (Pcs)", color: "#1E434C" },
    { icon: Building2, value: uniqueClients || 346, label: "Instansi / Event", color: "#0097B2" },
    { icon: Handshake, value: countSponsors || 259, label: "Sponsor & Partner", color: "#1E434C" },
  ];

  return (
    <section className="py-20 bg-[#F3F8FC]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {statItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-[#1E434C]/5 hover:shadow-xl transition-all duration-500 group"
            >
              <div 
                className="w-12 h-12 flex items-center justify-center rounded-2xl mb-4 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${item.color}10`, color: item.color }}
              >
                <item.icon size={26} />
              </div>
              <div className="text-3xl md:text-4xl font-black text-[#1E434C] mb-1">
                {fmt(item.value)}
              </div>
              <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicStats;

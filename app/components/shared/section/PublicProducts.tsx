import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Package, ShoppingBag, X, ZoomIn, ImageOff } from "lucide-react";
import { ADMIN_WA, getWhatsAppLink } from "~/utils/utils";

const fmt = (n: number) => n.toLocaleString("id-ID");

const ImageWithFallback = ({ src, alt, className, onClick }: { src: string; alt: string; className?: string; onClick?: () => void }) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error" | "slow">("loading");
  const [prevSrc, setPrevSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setStatus("loading");
  }

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (status === "loading" && src) {
      timer = setTimeout(() => {
        setStatus((prev) => (prev === "loading" ? "slow" : prev));
      }, 5000); // 5 seconds for slow detection
    }

    // Check if image is already cached
    if (imgRef.current?.complete && status === "loading") {
      setStatus("loaded");
    }

    return () => clearTimeout(timer);
  }, [src, status]);

  const handleLoad = () => setStatus("loaded");
  const handleError = () => setStatus("error");

  if (!src || status === "error") {
    return (
      <div className={`flex items-center justify-center text-gray-300 flex-col gap-3 bg-gray-50 cursor-pointer ${className}`} onClick={onClick}>
        <ImageOff size={48} strokeWidth={1} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Gambar tidak tersedia</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gray-50 ${className}`} onClick={onClick}>
      {(status === "loading" || status === "slow") && (
        <div className="absolute inset-0 z-10 bg-gray-100 flex flex-col items-center justify-center gap-2">
          <Package className="text-gray-200 animate-pulse" size={48} />
          {status === "slow" && (
            <div className="flex flex-col items-center animate-in fade-in">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Koneksi lambat...</span>
              <span className="text-[8px] font-bold text-blue-500 uppercase cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); setStatus("loading"); }}>Gunakan gambar cadangan?</span>
            </div>
          )}
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${className} transition-all duration-700 ${status === "loaded" ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export const PublicProducts = ({ products }: { products: any[] }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  return (
    <section id="produk" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[#0097B2] font-bold text-sm tracking-widest uppercase">Koleksi Kami</span>
          <h2 className="text-3xl md:text-5xl font-black text-[#1E434C] mt-2 mb-4">
            Pilihan Eksklusif
          </h2>
          <div className="h-1.5 w-24 bg-[#0097B2] mx-auto rounded-full"></div>
        </div>

        <div className="w-full overflow-x-auto pb-12 hide-scrollbar">
          <div className="flex gap-8 px-4">
            {products.length === 0 ? (
              <div className="w-full text-center text-gray-400 py-20 bg-white rounded-3xl border border-dashed">
                Belum ada produk ditampilkan.
              </div>
            ) : (
              products.map((product, idx) => {
                const sold = product?.total_sold_items || 0;
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="w-[300px] md:w-[350px] flex-shrink-0 group"
                  >
                    <div
                      className="w-full aspect-[4/5] rounded-[40px] overflow-hidden bg-white relative cursor-pointer shadow-xl shadow-[#1E434C]/5 border-8 border-white group-hover:shadow-2xl transition-all duration-500"
                    >
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                        onClick={() => product.image && setZoomedImage(product.image)}
                      />

                      <div 
                        className="absolute inset-0 bg-gradient-to-t from-[#1E434C]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8 pointer-events-none"
                      >
                        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between">
                          <span className="text-white font-bold">Lihat Detail</span>
                          <ZoomIn className="text-white" size={24} />
                        </div>
                      </div>

                      {sold > 0 && (
                        <div className="absolute top-6 left-6 bg-[#0097B2] text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                          <ShoppingBag size={12} />
                          {fmt(sold)} TERJUAL
                        </div>
                      )}
                    </div>

                    <div className="mt-8 text-center px-4">
                      <h3 className="font-black text-[#1E434C] text-xl mb-3 uppercase tracking-tight">
                        {product.name}
                      </h3>
                      <a
                        href={getWhatsAppLink(ADMIN_WA, `Halo, saya mau pesan ${product.name}...`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-[#0097B2] text-white text-sm font-black hover:bg-[#0097B2]/90 shadow-lg shadow-[#0097B2]/20 transition-all hover:scale-[1.02]"
                      >
                        PESAN SEKARANG
                      </a>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#1E434C]/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setZoomedImage(null)}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-8 right-8 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={32} />
            </button>
            <motion.img
              layoutId={zoomedImage}
              src={zoomedImage}
              className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PublicProducts;

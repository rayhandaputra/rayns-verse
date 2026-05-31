import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Package, ShoppingBag, Star, X, ImageOff } from "lucide-react";
import { safeParseArray } from "~/utils/utils";
import { formatFullDate } from "~/constants";

const ImageWithFallback = ({ src, alt, className, onClick }: { src: string; alt: string; className?: string; onClick?: () => void }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isLoadingSlow, setIsLoadingSlow] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset when src changes
  if (src !== currentSrc) {
    setCurrentSrc(src);
    setLoaded(false);
    setError(false);
    setIsLoadingSlow(false);
  }

  // Handle cached images
  useEffect(() => {
    if (imgRef.current?.complete && !loaded) {
      setLoaded(true);
      setIsLoadingSlow(false);
    }
  }, [src, loaded]);

  useEffect(() => {
    if (!src || loaded || error) return;
    
    // Timer to detect slow loading
    const timer = setTimeout(() => {
      if (!loaded && !error) {
        setIsLoadingSlow(true);
      }
    }, 3000); 

    return () => clearTimeout(timer);
  }, [src, loaded, error]);

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center text-gray-300 flex-col gap-3 bg-gray-50 ${className}`} onClick={onClick}>
        <ImageOff size={48} strokeWidth={1} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center px-4">Gambar tidak tersedia</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} key={src}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex flex-col items-center justify-center gap-2">
          <Package className="text-gray-300" size={48} />
          {isLoadingSlow && (
            <span className="text-[8px] font-bold text-gray-400 uppercase animate-pulse">Memuat...</span>
          )}
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => {
          setLoaded(true);
          setIsLoadingSlow(false);
        }}
        onError={() => setError(true)}
        onClick={onClick}
      />
    </div>
  );
};

export const PublicPortfolio = ({ portfolioItems }: { portfolioItems: any[] }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [sliderStates, setSliderStates] = useState<Record<string, number>>({});

  const handleNextImage = (e: React.MouseEvent, orderId: string, totalImages: number) => {
    e.stopPropagation();
    setSliderStates((prev) => ({
      ...prev,
      [orderId]: ((prev[orderId] || 0) + 1) % totalImages,
    }));
  };

  const handlePrevImage = (e: React.MouseEvent, orderId: string, totalImages: number) => {
    e.stopPropagation();
    setSliderStates((prev) => ({
      ...prev,
      [orderId]: ((prev[orderId] || 0) - 1 + totalImages) % totalImages,
    }));
  };

  return (
    <section id="portfolio" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[#0097B2] font-bold text-sm tracking-widest uppercase">Portofolio</span>
          <h2 className="text-3xl md:text-5xl font-black text-[#1E434C] mt-2">
            Produksi Terbaru
          </h2>
        </div>
        <p className="text-gray-400 max-w-sm text-sm font-medium">
          Dokumentasi hasil pengerjaan real-time dari workshop kami.
        </p>
      </div>

      <div className="w-full overflow-x-auto pb-12 hide-scrollbar">
        <div className="flex gap-10 px-8">
          {portfolioItems.length === 0 ? (
            <div className="w-full text-center text-gray-400 py-20 bg-[#F3F8FC] rounded-[40px] italic">
              Belum ada dokumentasi tersedia.
            </div>
          ) : (
            portfolioItems.map((item, idx) => {
              const images = safeParseArray(item.images) || [];
              const currentIdx = sliderStates[item.id] || 0;
              const currentImg = images.length > 0 ? images[currentIdx] : null;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="w-[320px] md:w-[400px] flex-shrink-0 group"
                >
                  <div className="bg-[#F3F8FC] rounded-[48px] p-4 border border-[#1E434C]/5 shadow-sm hover:shadow-2xl transition-all duration-700">
                    <div className="w-full aspect-[4/3] rounded-[40px] overflow-hidden bg-gray-200 relative">
                      <ImageWithFallback
                        src={currentImg}
                        alt=""
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-700"
                        onClick={() => setZoomedImage(currentImg)}
                      />

                      <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full z-10 border border-white/20">
                        {formatFullDate(item.created_on)}
                      </div>

                      {images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => handlePrevImage(e, item.id, images.length)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/20"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            onClick={(e) => handleNextImage(e, item.id, images.length)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/20"
                          >
                            <ChevronRight size={20} />
                          </button>
                          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
                            {images.map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? "bg-white w-4" : "bg-white/40"}`}
                              ></div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="px-4 py-6">
                      <h3 className="font-black text-[#1E434C] text-xl mb-2 line-clamp-1 uppercase tracking-tight">
                        {item.institution_name}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-[#0097B2] font-bold text-xs uppercase tracking-widest mb-4">
                        <ShoppingBag size={14} />
                        <span>
                          {safeParseArray(item.order_items)?.reduce((acc: number, i: any) => acc + +i.qty, 0)} Pcs
                        </span>
                      </div>

                      {item.review && (
                        <div className="bg-white/60 backdrop-blur-sm p-5 rounded-[24px] border border-white text-xs relative text-left">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-[#1E434C]">{item.pic_name || "Pelanggan"}</span>
                            <div className="flex gap-0.5 text-[#0097B2]">
                              {Array.from({ length: item.rating || 5 }).map((_, i) => (
                                <Star key={i} size={10} fill="currentColor" />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-500 italic leading-relaxed">
                            &quot;{item.review}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
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
              className="max-w-full max-h-[85vh] object-contain rounded-[40px] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PublicPortfolio;

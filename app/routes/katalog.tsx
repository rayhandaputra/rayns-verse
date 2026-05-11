import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Palette, FileText, Search, ChevronLeft, ChevronRight, Shirt, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/lib/nexus-client";

// Static list of catalog page images from public/katalog/
const KATALOG_PAGES = Array.from({ length: 16 }, (_, i) => `/katalog/${i}.png`);

export default function KatalogPage() {
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPage, setSelectedPage] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));

  const { data: colorData, loading: colorsLoading } = useFetcherData({
    endpoint: nexus().module("SHIRT_COLOR").action("get").params({ size: 100 }).build(),
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const goToPage = useCallback((index: number) => {
    if (index >= 0 && index < KATALOG_PAGES.length) {
      setSelectedPage(index);
      setLoadedImages(prev => new Set(prev).add(index));
    }
  }, []);

  const goNext = useCallback(() => goToPage(selectedPage + 1), [selectedPage, goToPage]);
  const goPrev = useCallback(() => goToPage(selectedPage - 1), [selectedPage, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goPrev, goNext]);

  // Preload adjacent images
  useEffect(() => {
    const preload = [selectedPage - 1, selectedPage + 1].filter(
      i => i >= 0 && i < KATALOG_PAGES.length
    );
    preload.forEach(i => {
      const img = new Image();
      img.src = KATALOG_PAGES[i];
    });
  }, [selectedPage]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="text-violet-500 animate-spin" size={48} />
      </div>
    );
  }

  const colors = (colorData as any)?.data?.items || [];
  const filteredColors = colors.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-violet-500/30">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-4">
            Katalog Produk
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Temukan koleksi warna kain premium dan katalog lengkap kami untuk kebutuhan konveksi Anda.
          </p>
        </motion.div>

        <Tabs defaultValue="catalog" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1">
              <TabsTrigger value="catalog" className="gap-2 px-6">
                <Users size={16} />
                Warna Seragam
              </TabsTrigger>
              <TabsTrigger value="colors" className="gap-2 px-6">
                <Shirt size={16} />
                Warna Kaos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="catalog" className="mt-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm shadow-2xl shadow-violet-500/5"
            >
              {/* Main Image Viewer */}
              <div className="relative flex items-center justify-center bg-zinc-950 min-h-[60vh] md:min-h-[70vh]">
                {/* Loading overlay */}
                {!loadedImages.has(selectedPage) && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Loader2 className="text-violet-500 animate-spin" size={48} />
                  </div>
                )}

                {/* Previous Button */}
                <button
                  onClick={goPrev}
                  disabled={selectedPage === 0}
                  className="absolute left-2 md:left-4 z-20 p-2 md:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm border border-white/10"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft size={24} />
                </button>

                {/* Image */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedPage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full flex items-center justify-center p-4 md:p-8"
                  >
                    <img
                      src={KATALOG_PAGES[selectedPage]}
                      alt={`Katalog halaman ${selectedPage}`}
                      className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-2xl select-none"
                      draggable={false}
                      onLoad={() =>
                        setLoadedImages(prev => new Set(prev).add(selectedPage))
                      }
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Next Button */}
                <button
                  onClick={goNext}
                  disabled={selectedPage === KATALOG_PAGES.length - 1}
                  className="absolute right-2 md:right-4 z-20 p-2 md:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm border border-white/10"
                  aria-label="Halaman selanjutnya"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Page Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-sm text-white/80">
                  {selectedPage + 1} / {KATALOG_PAGES.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              <div className="bg-zinc-900/80 border-t border-zinc-800 px-3 py-3 md:px-6 md:py-4 overflow-x-auto">
                <div className="flex gap-2 md:gap-3 justify-center min-w-max">
                  {KATALOG_PAGES.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToPage(idx)}
                      className={`relative flex-shrink-0 w-14 h-20 md:w-20 md:h-28 rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedPage === idx
                        ? "border-violet-500 shadow-lg shadow-violet-500/30 scale-105"
                        : "border-zinc-700 hover:border-zinc-500 opacity-60 hover:opacity-100"
                        }`}
                    >
                      <img
                        src={src}
                        alt={`Halaman ${idx}`}
                        className="w-full h-full object-cover pointer-events-none select-none"
                        draggable={false}
                        loading="lazy"
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] md:text-xs py-0.5 text-center text-white/80">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Keyboard hint */}
            <p className="text-center text-zinc-600 text-xs mt-3">
              Gunakan tombol ← → pada keyboard untuk navigasi halaman
            </p>
          </TabsContent>

          <TabsContent value="colors" className="mt-0">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <h2 className="text-2xl font-semibold text-white/90">Koleksi Warna Kain</h2>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    placeholder="Cari warna..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {colorsLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <Loader2 className="text-violet-500 animate-spin" size={40} />
                  <p className="text-zinc-500">Mengambil data warna...</p>
                </div>
              ) : filteredColors.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredColors.map((color: any, idx: number) => (
                      <motion.div
                        key={color.id || idx}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group relative"
                      >
                        <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-violet-500/50 transition-all duration-300 shadow-lg shadow-black/50">
                          <img
                            src={color.image_url || `https://placehold.co/400x400/18181b/ffffff?text=${encodeURIComponent(color.name)}`}
                            alt={color.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="mt-3 px-1">
                          <p className="text-sm font-medium text-zinc-300 truncate group-hover:text-violet-400 transition-colors">
                            {color.name}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="py-32 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20">
                  <p className="text-zinc-500">Warna tidak ditemukan.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
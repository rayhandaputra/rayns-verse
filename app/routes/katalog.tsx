import React, { useState, useEffect, Suspense } from "react";
import { Loader2, Palette, FileText, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/lib/nexus-client";

// Client-only component wrapper for PDF Viewer
const PDFViewerClient = React.lazy(() =>
  import("~/components/PDFViewerClient").then(module => ({ default: module.PDFViewerClient }))
);

export const loader = ({ request }: LoaderFunctionArgs) => {
  return {
    katalogPdfUrl: process.env.KATALOG_PDF_URL || "",
  };
};

export default function KatalogPage() {
  const { katalogPdfUrl } = useLoaderData<typeof loader>();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: colorData, loading: colorsLoading } = useFetcherData({
    endpoint: nexus().module("SHIRT_COLOR").action("get").params({ size: 100 }).build(),
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

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

        <Tabs defaultValue="pdf" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1">
              <TabsTrigger value="pdf" className="gap-2 px-6">
                <FileText size={16} />
                Katalog PDF
              </TabsTrigger>
              <TabsTrigger value="colors" className="gap-2 px-6">
                <Palette size={16} />
                Daftar Warna
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pdf" className="mt-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm h-[80vh] shadow-2xl shadow-violet-500/5"
            >
              <Suspense fallback={
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <Loader2 className="text-violet-500 animate-spin" size={48} />
                  <p className="text-zinc-400 animate-pulse">Memuat Katalog PDF...</p>
                </div>
              }>
                <PDFViewerClient pdfUrl={katalogPdfUrl} />
              </Suspense>
            </motion.div>
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

// import {
//   Link,
//   redirect,
//   useLoaderData,
//   type LoaderFunctionArgs,
// } from "react-router";
// import { motion } from "framer-motion";
// import { CONFIG } from "~/config";
// import ComingSoon from "./pre-launch/_index";
// import { Button } from "~/components/ui/button";
// // import HeroSection from "~/components/section/hero-section";
// import { db } from "~/config/supabase";
// import FloatingWhatsApp from "~/components/FloatingWhatsapp";
// import CardFeatureSection from "~/components/section/feature-section";
// import CardTestimoniSection from "~/components/section/testimoni-seection";
// // import { SlideInModal } from "~/components/modal/SlideInModal";
// import { useMemo, useState } from "react";
// import { HighlightSection } from "~/components/section/highlight-event-section";
// // import { getSession } from "~/lib/session";
// import EventsSection from "~/components/section/new-event-section";
// import StatsSection from "~/components/section/stats-section";
// import HeroSection from "~/components/section/new-hero-section";
// import { API } from "~/lib/api";
// import ImageCarousel from "~/components/slider/ImageCarousel";
// import { getOptionalUser } from "~/lib/session.server";
// import MediaEvent from "./media.event.$slug";
// // import { blockUserIfLoggedIn } from "~/lib/session.client";
// // import { blockLoggedIn } from "~/lib/session.server";
// // import { unsealSession } from "~/lib/session.client";
// // import { unsealSession } from "~/lib/session.server";
// // import Navbar from "~/components/section/navbar";
// // import FooterSection from "~/components/section/footer";

import {
  ArrowRight,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Globe,
  Handshake,
  Instagram,
  Layers,
  LogIn,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Star,
  X,
  ZoomIn,
} from "lucide-react";
import { useNavigate, useLoaderData } from "react-router";
import {
  ADMIN_WA,
  getWhatsAppLink,
  safeParseArray,
  safeParseObject,
  toMoney,
} from "~/lib/utils";
import { API } from "~/lib/api";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/lib/nexus-client";
import { useState } from "react";
import { formatFullDate } from "~/constants";
const fmt = (n: number) => n.toLocaleString("id-ID");

export async function loader() {
  // Fetch Products for display
  const productsRes = await API.PRODUCT.get({
    req: {
      query: { page: 0, size: 10, show_in_dashboard: 1, pagination: "true" },
    },
  });

  // Fetch Orders with status: done and is_portfolio: true
  const ordersRes = await API.ORDERS.get({
    req: {
      query: {
        status: "done",
        is_portfolio: "1",
        page: 0,
        size: 200,
        pagination: "true",
      },
    },
  });

  // Map and filter orders for portfolio
  const portfolioItems = (ordersRes.items || [])
    .map((o: any) => {
      // Parse notes for portfolio data
      let notesData: any = {};
      try {
        if (o.notes) {
          const parsed = JSON.parse(o.notes);
          if (typeof parsed === "object") notesData = parsed;
        }
      } catch (e) {
        /* ignore */
      }

      return {
        ...o,
        // id: o.id,
        // instansi: o.institution_name,
        // jenisPesanan: o.order_type === "package" ? "Paket" : "Satuan",
        // jumlah: o.total_product || 0,
        // totalHarga: o.grand_total,
        // status: o.status,
        // createdAt: o.created_on,
        // // is_portfolio: notesData.is_portfolio || false,
        // is_portfolio: +o.is_portfolio || 0,
        // review: notesData.review || "",
        // rating: notesData.rating || 0,
        // portfolioImages: notesData.portfolioImages || [],
      };
    })
    .filter((item: any) => item.is_portfolio); // Only show items marked as portfolio

  // Calculate stats from orders
  const allOrders = ordersRes.items || [];
  const countFinished = allOrders.filter(
    (o: any) => o.status === "done"
  ).length;
  const countItems = allOrders.reduce(
    (sum: number, o: any) => sum + (o.total_product || 0),
    0
  );
  const uniqueClients = new Set(allOrders.map((o: any) => o.institution_name))
    .size;
  // For sponsors, we might need a different API or just use a placeholder
  const countSponsors = 0; // Placeholder

  return {
    products: productsRes.items || [],
    portfolioItems,
    stats: {
      countFinished: 578,
      countItems: 5120,
      uniqueClients: 346,
      countSponsors: 259,
    },
  };
}

// export default function LandingPage() {
//   const { highlightEvent, heroSection, testimonials, stats, APP_CONFIG } =
//     useLoaderData();

//   return (
//     <section>
//       <div className="w-full">
//         <LandingPageDesign
//           data={{ highlightEvent, heroSection, testimonials, stats }}
//         />
//       </div>
//       {/* {APP_CONFIG.env === "development" ? (
//         <div className="w-full">
//           <LandingPageDesign />
//         </div>
//       ) : (
//         <ComingSoon />
//       )} */}
//     </section>
//   );
// }

// const LandingPageDesign = ({ data }: any) => {
//   // Animation variants
//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.2,
//       },
//     },
//   };

//   const itemVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: {
//         duration: 0.5,
//       },
//     },
//   };

//   return (
//     <motion.div
//       className="flex flex-col"
//       variants={containerVariants}
//       initial="hidden"
//       animate="visible"
//     >
//       {/* <HeroSection isAuthenticated={false} isAdmin={false} isCustomer={false} /> */}
//       {/* <HeroSection /> */}

//       <motion.div className="p-8 bg-white" variants={itemVariants}>
//         <div className="max-w-7xl mx-auto rounded-2xl overflow-hidden">
//           <ImageCarousel
//             images={data?.heroSection?.map((v: any) => v?.image)}
//             height={430}
//             rounded="rounded-none" // penting: biarkan carousel tanpa rounding
//             interval={3500}
//           />
//         </div>
//       </motion.div>

//       {/* <CardFeatureSection /> */}

//       <motion.div
//         initial={{ opacity: 0, y: 50 }}
//         whileInView={{ opacity: 1, y: 0 }}
//         viewport={{ once: true, margin: "-100px" }}
//         transition={{ duration: 0.6 }}
//       >
//         <StatsSection stats={data?.stats || []} />
//       </motion.div>

//       <motion.div
//         initial={{ opacity: 0, y: 50 }}
//         whileInView={{ opacity: 1, y: 0 }}
//         viewport={{ once: true, margin: "-100px" }}
//         transition={{ duration: 0.6, delay: 0.2 }}
//       >
//         <EventsSection events={data?.highlightEvent} />
//       </motion.div>
//       {/* <HighlightSection
//         highlights={[
//           {
//             id: 1,
//             institution: "ITERA 2",
//             event: "ACARA 2",
//             description: "Bismillah",
//             imageUrl: "https://i.pravatar.cc/40",
//             link: "https://kinau.id",
//           },
//         ]}
//       /> */}

//       {/* <section className="w-full bg-blue-600 py-16">
//         <div className="container max-w-7xl mx-auto px-4 md:px-6">
//           <div className="text-center max-w-2xl mx-auto">
//             <h2 className="text-3xl font-bold text-white mb-4">
//               Siap Mengubah Cara Anda Mengelola Acara?
//             </h2>
//             <p className="text-white/90 mb-8">
//               Bergabunglah dengan ribuan penyelenggara yang telah menggunakan
//               platform kami untuk menciptakan acara yang lebih baik dan
//               mendapatkan wawasan berharga dari para anggotanya.
//             </p>
//             <Button
//               size="lg"
//               variant="secondary"
//               className="bg-gray-200 hover:bg-gray-300 text-gray-800"
//               asChild
//             >
//               <Link to="/login">Mulai Sekarang</Link>
//             </Button>
//           </div>
//         </div>
//       </section> */}

//       <motion.div
//         initial={{ opacity: 0, y: 50 }}
//         whileInView={{ opacity: 1, y: 0 }}
//         viewport={{ once: true, margin: "-100px" }}
//         transition={{ duration: 0.6 }}
//       >
//         <CardTestimoniSection testimonials={data?.testimonials} />
//       </motion.div>

//       {/* Detail article / news event */}
//       {/* <MediaEvent /> */}

//       <FloatingWhatsApp />
//       <FloatingWhatsApp />
//     </motion.div>
//   );
// };

export default function LandingPage() {
  const { products, portfolioItems, stats } = useLoaderData<{
    products: any[];
    portfolioItems: any[];
    stats: {
      countFinished: number;
      countItems: number;
      uniqueClients: number;
      countSponsors: number;
    };
  }>();

  const { data: cmsContentData, reload: reloadCmsContent } = useFetcherData({
    endpoint: nexus()
      .module("CMS_CONTENT")
      .action("get")
      .params({
        pagination: "true",
        type: "hero-section",
        page: 0,
        size: 1,
      })
      .build(),
  });

  return (
    <div>
      <Navbar />

      <Hero
        bg_image={
          safeParseArray(
            cmsContentData?.data?.items?.[0]?.image_gallery
          )?.[0] as string
        }
      />

      <Stats
        countFinished={stats.countFinished}
        countItems={stats.countItems}
        countSponsors={stats.countSponsors}
        uniqueClients={stats.uniqueClients}
      />
      <Products products={products} />
      <Portfolio portfolioItems={portfolioItems} />
      <Footer />
    </div>
  );
}

export const Hero = ({ bg_image }: { bg_image: string }) => {
  return (
    <>
      {/* Hero Section */}
      <section
        className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{
          backgroundColor: bg_image ? "transparent" : "#f9fafb",
        }}
      >
        {/* Dynamic Background */}
        {bg_image && (
          <div className="absolute inset-0 z-0">
            <img
              src={bg_image}
              className="w-full h-full object-cover opacity-20"
              alt="Background"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white"></div>
          </div>
        )}

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            Cetak ID Card & Lanyard <br />
            <span className="text-blue-600">Berkualitas Tinggi</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
            Solusi percetakan profesional untuk kebutuhan event, kantor, dan
            komunitas Anda. Cepat, presisi, dan harga bersahabat.
          </p>

          {/* New Button Layout */}
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink(
                ADMIN_WA,
                "Halo Kinau.id, saya ingin bertanya tentang pemesanan..."
              )}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              Pesan Sekarang <ArrowRight size={18} />
            </a>
            <a
              href="#produk"
              className="px-6 py-3 rounded-full bg-white text-gray-700 font-bold border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              Daftar Produk
            </a>
            <a
              href="#portfolio"
              className="px-6 py-3 rounded-full bg-white text-gray-700 font-bold border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              Produksi Terbaru
            </a>
            <a
              href="#kontak"
              className="px-6 py-3 rounded-full bg-white text-gray-700 font-bold border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              Kontak
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export const Stats = ({
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
  return (
    <>
      {/* Stats */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition group">
            <div className="flex items-center justify-center text-blue-600 mb-2 opacity-80 group-hover:scale-110 transition">
              <CheckCircle size={32} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {fmt(countFinished)}
            </div>
            <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">
              Pesanan Selesai
            </div>
          </div>

          <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition group">
            <div className="flex items-center justify-center text-purple-600 mb-2 opacity-80 group-hover:scale-110 transition">
              <Layers size={32} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {fmt(countItems)}
            </div>
            <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">
              Produk Dibuat (Pcs)
            </div>
          </div>

          <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition group">
            <div className="flex items-center justify-center text-orange-600 mb-2 opacity-80 group-hover:scale-110 transition">
              <Building2 size={32} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {fmt(uniqueClients)}
            </div>
            <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">
              Instansi / Event
            </div>
          </div>

          <div className="text-center p-4 rounded-xl hover:bg-gray-50 transition group">
            <div className="flex items-center justify-center text-green-600 mb-2 opacity-80 group-hover:scale-110 transition">
              <Handshake size={32} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {fmt(countSponsors)}
            </div>
            <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">
              Sponsor & Partner
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export const Portfolio = ({ portfolioItems }: { portfolioItems: any[] }) => {
  // console.log(portfolioItems);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [sliderStates, setSliderStates] = useState<Record<string, number>>({});

  // Slider Logic
  const handleNextImage = (
    e: React.MouseEvent,
    orderId: string,
    totalImages: number
  ) => {
    e.stopPropagation();
    setSliderStates((prev) => ({
      ...prev,
      [orderId]: ((prev[orderId] || 0) + 1) % totalImages,
    }));
  };

  const handlePrevImage = (
    e: React.MouseEvent,
    orderId: string,
    totalImages: number
  ) => {
    e.stopPropagation();
    setSliderStates((prev) => ({
      ...prev,
      [orderId]: ((prev[orderId] || 0) - 1 + totalImages) % totalImages,
    }));
  };

  return (
    <>
      {/* Portfolio / Produksi Terbaru (Card Update with Slider) */}
      <section
        id="portfolio"
        className="py-20 bg-gray-50 border-t border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Produksi Terbaru
          </h2>
          <p className="text-gray-600 max-w-2xl">
            Dokumentasi hasil pengerjaan real-time dari workshop kami.
          </p>
        </div>

        {/* Scroll Container */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="w-full overflow-x-auto pb-8 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-6">
              {portfolioItems.length === 0 ? (
                <div className="w-full text-center text-gray-400 py-10 px-10 italic">
                  Belum ada dokumentasi.
                </div>
              ) : (
                portfolioItems.map((item, idx) => {
                  const images = safeParseArray(item.images) || [];
                  const currentIdx = sliderStates[item.id] || 0;
                  const currentImg =
                    images.length > 0 ? images[currentIdx] : null;

                  // Determine display string for products + variations
                  const productDisplay =
                    safeParseArray(item.order_items) &&
                    safeParseArray(item.order_items).length > 0
                      ? safeParseArray(item.order_items)
                          .map(
                            (i) => `${i.product_name} ` //${i.variationName ? `(${i.variationName})` : ""}
                          )
                          .join(", ")
                      : "";

                  return (
                    <div
                      key={idx}
                      className="w-[280px] flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group border border-gray-100"
                    >
                      {/* Image Area with Slider */}
                      <div className="w-full aspect-[4/3] bg-gray-200 relative overflow-hidden">
                        {currentImg ? (
                          <img
                            src={currentImg}
                            alt={item.instansi}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setZoomedImage(currentImg)}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <Package size={40} />
                          </div>
                        )}

                        {/* Date Badge */}
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur z-10">
                          {formatFullDate(item.created_on)}
                        </div>

                        {/* Slider Controls */}
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={(e) =>
                                handlePrevImage(e, item.id, images.length)
                              }
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button
                              onClick={(e) =>
                                handleNextImage(e, item.id, images.length)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            >
                              <ChevronRight size={16} />
                            </button>
                            {/* Dots */}
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                              {images.map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full ${i === currentIdx ? "bg-white" : "bg-white/50"}`}
                                ></div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="p-4">
                        <h3
                          className="font-bold text-gray-800 text-lg leading-tight mb-1 truncate"
                          title={item.institution_name}
                        >
                          {item?.kkn_detail
                            ? `Kelompok ${safeParseObject(item?.kkn_detail)?.value} - `
                            : ""}{" "}
                          {item.institution_name}{" "}
                          {item?.kkn_detail
                            ? `Periode ${safeParseObject(item?.kkn_detail)?.period}`
                            : ""}
                        </h3>
                        <div className="flex flex-col gap-1 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-2">
                            <Package size={12} />
                            <span className="font-semibold">
                              {safeParseArray(item.order_items)?.reduce(
                                (acc, item) => acc + +item.qty,
                                0
                              )}{" "}
                              pcs
                            </span>
                          </div>
                          <div className="line-clamp-2" title={productDisplay}>
                            {productDisplay}
                          </div>
                        </div>

                        {/* Review Bubble if exists */}
                        {item.review && (
                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs relative mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-gray-700 truncate max-w-[150px]">
                                {item.pic_name || "Customer"}
                              </span>
                              <div className="flex gap-0.5 text-yellow-400 flex-shrink-0">
                                {Array.from({ length: item.rating || 5 }).map(
                                  (_, i) => (
                                    <Star
                                      key={i}
                                      size={10}
                                      fill="currentColor"
                                    />
                                  )
                                )}
                              </div>
                            </div>
                            <p className="text-gray-600 italic line-clamp-3">
                              "{item.review}"
                            </p>
                          </div>
                        )}

                        {/* Slider Navigation */}
                        {/* {images.length > 1 && (
                          <div className="flex justify-between mt-2">
                            <button
                              onClick={(e) =>
                                handlePrevImage(e, item.id, images.length)
                              }
                              className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full"
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <button
                              onClick={(e) =>
                                handleNextImage(e, item.id, images.length)
                              }
                              className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full"
                            >
                              <ChevronRight size={20} />
                            </button>
                          </div>
                        )} */}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"
          >
            <X size={32} />
          </button>
          <img
            src={zoomedImage}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
          />
        </div>
      )}
    </>
  );
};
export const Products = ({ products }: { products: any[] }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  return (
    <>
      <section id="produk" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Daftar Produk
            </h2>
            <p className="text-gray-600">
              Pilih produk terbaik untuk kebutuhan acara anda.
            </p>
          </div>

          <div className="w-full overflow-x-auto pb-8 hide-scrollbar">
            <div className="flex gap-6">
              {products.length === 0 ? (
                <div className="w-full text-center text-gray-400">
                  Belum ada produk ditampilkan.
                </div>
              ) : (
                products.map((product) => {
                  // const sold = getProductSales(product.id);
                  const sold = product?.total_sold_items || 0;
                  return (
                    <div
                      key={product.id}
                      className="w-[280px] md:w-[320px] flex-shrink-0 group relative"
                    >
                      {/* Card Image 4:5 */}
                      <div
                        className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 relative cursor-pointer shadow-sm group-hover:shadow-lg transition mb-4 border border-gray-100"
                        onClick={() =>
                          product.image && setZoomedImage(product.image)
                        }
                      >
                        {product.image ? (
                          <img
                            src={product.image}
                            className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                            alt={product.name}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 flex-col gap-2">
                            <Package size={48} />
                            <span className="text-sm">No Image</span>
                          </div>
                        )}

                        {/* SOLD COUNT BADGE */}
                        {sold > 0 && (
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-900 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border border-gray-200 flex items-center gap-1">
                            <ShoppingBag size={10} className="text-blue-600" />
                            Terjual {fmt(sold)} pcs
                          </div>
                        )}

                        {/* Zoom Icon Overlay */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <ZoomIn size={32} />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="text-center px-2">
                        <h3 className="font-bold text-gray-900 text-lg mb-2">
                          {product.name}
                        </h3>
                        <a
                          href={getWhatsAppLink(
                            ADMIN_WA,
                            `Halo, saya mau pesan ${product.name}...`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition"
                        >
                          Pesan Sekarang
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2 bg-black/50 rounded-full"
          >
            <X size={32} />
          </button>
          <img
            src={zoomedImage}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
          />
        </div>
      )}
    </>
  );
};

export const Navbar = () => {
  const navigate = useNavigate();
  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              {/* <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-lg">K</div>
              <span className="font-bold text-xl tracking-tight">Kinau.id</span> */}
              <img
                src="/kinau-logo.png"
                className="w-28 h-auto"
                alt="Logo"
                onClick={() => {}}
              />
            </div>
            {/* <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#portfolio" className="hover:text-gray-900 transition">
                Portfolio
              </a>
              <a href="#produk" className="hover:text-gray-900 transition">
                Produk & Harga
              </a>
              <a href="#ulasan" className="hover:text-gray-900 transition">
                Ulasan
              </a>
              <a href="#kontak" className="hover:text-gray-900 transition">
                Kontak
              </a>
            </div> */}
            <button
              onClick={() => {
                navigate("/login");
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition cursor-pointer"
            >
              <LogIn size={16} /> Login Admin
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export const Footer = () => {
  const navigate = useNavigate();
  return (
    <>
      {/* Footer */}
      <footer
        id="kontak"
        className="bg-white pt-16 pb-8 border-t border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <img
                src="/kinau-logo.png"
                className="w-28 h-auto"
                alt="Logo"
                onClick={() => {}}
              />
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Kontak Kami</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Phone size={16} className="text-blue-600" />
                  <a
                    href={getWhatsAppLink(
                      ADMIN_WA,
                      "Halo Kinau.id, saya ingin bertanya..."
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-600"
                  >
                    +62 852-1933-7474
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={16} className="text-blue-600" /> admin@kinau.id
                </li>
                <li className="flex items-start gap-2">
                  <MapPin
                    size={16}
                    className="text-blue-600 mt-1 min-w-[16px]"
                  />
                  <span>
                    Jalan Terusan Jl. Murai 1 No.7 , Kel. Korpri Raya, Kec.
                    Sukarame, Kota Bandar Lampung, Lampung.
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Menu Cepat</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#portfolio" className="hover:text-blue-600">
                    Produksi
                  </a>
                </li>
                <li>
                  <a href="#produk" className="hover:text-blue-600">
                    Daftar Harga
                  </a>
                </li>
                <li>
                  <a href="#kontak" className="hover:text-blue-600">
                    Kontak
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => navigate("/login")}
                    className="hover:text-blue-600"
                  >
                    Login Admin
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Sosial Media</h4>
              <div className="flex gap-4">
                <a
                  href="https://instagram.com/kinau.id"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Instagram size={20} />
                  </div>
                  <span className="font-medium">@kinau.id</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 text-center text-sm text-gray-400">
            &copy; 2025 Kinau.id Production. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
};

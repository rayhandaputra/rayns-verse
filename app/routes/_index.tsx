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
  Globe,
  Handshake,
  Instagram,
  Layers,
  LogIn,
  Mail,
  MapPin,
  Package,
  Phone,
  Star,
} from "lucide-react";
import { useNavigate, useLoaderData } from "react-router";
import { ADMIN_WA, getWhatsAppLink, toMoney } from "~/lib/utils";
import { API } from "~/lib/api";
const fmt = (n: number) => n.toLocaleString("id-ID");

export async function loader() {
  // Fetch Products for display
  const productsRes = await API.PRODUCT.get({
    req: { query: { page: 0, size: 100, pagination: "true" } },
  });

  // Fetch Orders with status: done and is_portfolio: true
  const ordersRes = await API.ORDERS.get({
    req: {
      query: {
        status: "done",
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
        id: o.id,
        instansi: o.institution_name,
        jenisPesanan: o.order_type === "package" ? "Paket" : "Satuan",
        jumlah: o.total_product || 0,
        totalHarga: o.grand_total,
        status: o.status,
        createdAt: o.created_on,
        // is_portfolio: notesData.is_portfolio || false,
        is_portfolio: +o.is_portfolio || 0,
        review: notesData.review || "",
        rating: notesData.rating || 0,
        portfolioImages: notesData.portfolioImages || [],
      };
    })
    .filter((item: any) => item.is_portfolio); // Only show items marked as portfolio

  console.log("portfolioItems", portfolioItems);

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
      countFinished,
      countItems,
      uniqueClients,
      countSponsors,
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

  return (
    <div>
      <Navbar />
      <Hero products={products} />
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

export const Hero = ({ products }: { products: any[] }) => {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            Cetak ID Card & Lanyard <br />
            <span className="text-blue-600">Berkualitas Tinggi</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
            Solusi percetakan profesional untuk kebutuhan event, kantor, dan
            komunitas Anda. Cepat, presisi, dan harga bersahabat.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={getWhatsAppLink(
                ADMIN_WA,
                "Halo Kinau.id, saya ingin bertanya tentang pemesanan..."
              )}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-3.5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              Pesan Sekarang <ArrowRight size={18} />
            </a>
            <a
              href="#portfolio"
              className="px-8 py-3.5 rounded-full bg-white text-gray-700 font-bold border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              Lihat Hasil Produksi
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
  return (
    <>
      {/* Portfolio (Horizontal Scroll) */}
      <section id="portfolio" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Riwayat Produksi
          </h2>
          <p className="text-gray-600 max-w-2xl">
            Lihat hasil karya kami untuk berbagai instansi dan event di seluruh
            Indonesia.
          </p>
        </div>

        {/* Scroll Container */}
        <div className="max-w-7xl mx-auto flex justify-center overflow-x-auto pb-8 hide-scrollbar px-4 md:px-8">
          <div className="flex gap-6 w-max mx-auto md:mx-0">
            {portfolioItems.length === 0 ? (
              <p className="w-full text-center text-gray-400 py-10 px-10 italic">
                Belum ada portfolio ditampilkan.
              </p>
            ) : (
              portfolioItems.map((item, idx) => (
                <div
                  key={idx}
                  className="w-[300px] md:w-[350px] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0 snap-center hover:shadow-md transition group"
                >
                  <div className="h-56 bg-gray-200 relative overflow-hidden">
                    {item.portfolioImages?.[0] ? (
                      <img
                        src={item.portfolioImages[0]}
                        alt={item.instansi}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <Package size={40} />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                      {item.jumlah} Pcs
                    </div>
                  </div>
                  <div className="p-5">
                    <h3
                      className="font-bold text-lg text-gray-900 mb-1 truncate"
                      title={item.instansi}
                    >
                      {item.instansi}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {item.jenisPesanan}
                    </p>

                    {item.review && (
                      <div className="bg-blue-50 p-3 rounded-lg text-xs text-gray-700 italic relative">
                        <span className="text-blue-300 text-4xl absolute -top-2 -left-1">
                          "
                        </span>
                        <span className="relative z-10">
                          {item.review.length > 80
                            ? item.review.substring(0, 80) + "..."
                            : item.review}
                        </span>
                        {item.rating && (
                          <div className="flex gap-0.5 mt-2 text-yellow-400">
                            {Array.from({ length: item.rating }).map((_, i) => (
                              <Star key={i} size={10} fill="currentColor" />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
};
export const Products = ({ products }: { products: any[] }) => {
  return (
    <>
      {/* Products & Pricing */}
      <section id="produk" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Daftar Produk & Harga
            </h2>
            <p className="text-gray-600">
              Harga transparan, tanpa biaya tersembunyi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.length === 0 ? (
              <div className="col-span-3 text-center text-gray-400">
                Belum ada produk.
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-2xl p-6 hover:border-blue-500 transition relative overflow-hidden"
                >
                  {product.category === "Paket" && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                      BEST SELLER
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-6 h-10">
                    {product.description ||
                      "Kualitas terbaik untuk kebutuhan anda."}
                  </p>
                  <div className="text-3xl font-bold text-gray-900 mb-6">
                    {toMoney(product.price)}{" "}
                    <span className="text-sm text-gray-400 font-normal">
                      / pcs
                    </span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500" /> Free
                      Desain (S&K)
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500" />{" "}
                      Pengerjaan Cepat
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500" />{" "}
                      Garansi Retur
                    </li>
                  </ul>
                  <a
                    href={getWhatsAppLink(
                      ADMIN_WA,
                      `Halo, saya mau pesan ${product.name}...`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center py-3 rounded-xl border-2 border-gray-900 text-gray-900 font-bold hover:bg-gray-900 hover:text-white transition"
                  >
                    Pesan via WA
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
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
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
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
            </div>
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
              <div className="flex items-center gap-2 mb-4">
                {/* <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                  K
                </div>
                <span className="font-bold text-xl tracking-tight">
                  Kinau.id
                </span> */}
                <img
                  src="/kinau-logo.png"
                  className="w-28 h-auto"
                  alt="Logo"
                  onClick={() => {}}
                />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Partner percetakan terpercaya di Lampung. Melayani pembuatan ID
                Card, Lanyard, dan Merchandise dengan kualitas premium.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Kontak Kami</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Phone size={16} className="text-blue-600" /> +62 852-1933-747
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={16} className="text-blue-600" /> admin@kinau.id
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={16} className="text-blue-600 mt-1" /> Jl.
                  Cengkeh No. 12, Bandar Lampung
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Menu Cepat</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a href="#portfolio" className="hover:text-blue-600">
                    Portfolio
                  </a>
                </li>
                <li>
                  <a href="#produk" className="hover:text-blue-600">
                    Daftar Harga
                  </a>
                </li>
                <li>
                  <a href="#ulasan" className="hover:text-blue-600">
                    Testimoni
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => {}}
                    className="hover:text-blue-600 cursor-pointer"
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
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition"
                >
                  <Globe size={20} />
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

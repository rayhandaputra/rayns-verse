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
// // import HeroSection from "~/components/shared/section/hero-section";
// import { db } from "~/config/supabase";
// import FloatingWhatsApp from "~/components/shared/FloatingWhatsapp";
// import CardFeatureSection from "~/components/shared/section/feature-section";
// import CardTestimoniSection from "~/components/shared/section/testimoni-seection";
// // import { SlideInModal } from "~/components/shared/modal/SlideInModal";
// import { useMemo, useState } from "react";
// import { HighlightSection } from "~/components/shared/section/highlight-event-section";
// // import { getSession } from "~/lib/session";
// import EventsSection from "~/components/shared/section/new-event-section";
// import StatsSection from "~/components/shared/section/stats-section";
// import HeroSection from "~/components/shared/section/new-hero-section";
// import { API } from "~/nexus";
// import ImageCarousel from "~/components/shared/slider/ImageCarousel";
// import { getOptionalUser } from "~/utils/session.server";
// import MediaEvent from "./media.event.$slug";
// // import { blockUserIfLoggedIn } from "~/utils/session.client";
// // import { blockLoggedIn } from "~/utils/session.server";
// // import { unsealSession } from "~/utils/session.client";
// // import { unsealSession } from "~/utils/session.server";
// // import Navbar from "~/components/shared/section/navbar";
// // import FooterSection from "~/components/shared/section/footer";

import { Phone } from "lucide-react";
import { useLoaderData } from "react-router";
import {
  ADMIN_WA,
  getWhatsAppLink,
} from "~/utils/utils";
import { API } from "~/nexus";
import Navbar from "~/components/layout/public/navbar";
import Footer from "~/components/layout/public/footer";
import PublicHero from "~/components/section/PublicHero";
import PublicStats from "~/components/section/PublicStats";
import PublicPortfolio from "~/components/section/PublicPortfolio";
import PublicProducts from "~/components/section/PublicProducts";
import { Wave } from "~/components/shared/Wave";

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
    .map((o: any) => ({ ...o }))
    .filter((item: any) => item.is_portfolio);

  // Calculate stats from orders
  const allOrders = ordersRes.items || [];
  const stats = {
    countFinished: allOrders.filter((o: any) => o.status === "done").length,
    countItems: allOrders.reduce((sum: number, o: any) => sum + (o.total_product || 0), 0),
    uniqueClients: new Set(allOrders.map((o: any) => o.institution_name)).size,
    countSponsors: 0,
  };

  return {
    products: productsRes.items || [],
    portfolioItems,
    stats,
  };
}

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
    <div className="min-h-screen bg-[#F3F8FC] selection:bg-[#0097B2]/30">
      <div className="max-w-[1600px] mx-auto bg-white shadow-2xl relative min-h-screen overflow-hidden">
        <Navbar />

        <PublicHero />

        <PublicStats
          countFinished={stats.countFinished}
          countItems={stats.countItems}
          countSponsors={stats.countSponsors}
          uniqueClients={stats.uniqueClients}
        />

        <div className="relative">
          <Wave color="#F3F8FC" flip={true} />
          <div className="bg-[#F3F8FC]">
            <PublicProducts products={products} />
          </div>
          <Wave color="#F3F8FC" className="bg-white" />
        </div>

        <PublicPortfolio portfolioItems={portfolioItems} />
        <Footer />
      </div>

      {/* Floating WhatsApp */}
      <div className="fixed bottom-6 right-6 z-[60]">
        <a
          href={getWhatsAppLink(ADMIN_WA, "Halo Kinau.id...")}
          target="_blank"
          rel="noreferrer"
          className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        >
          <Phone size={24} fill="currentColor" />
        </a>
      </div>
    </div>
  );
}

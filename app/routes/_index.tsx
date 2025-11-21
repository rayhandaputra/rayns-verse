import {
  Link,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { CONFIG } from "~/config";
import ComingSoon from "./pre-launch/_index";
import { Button } from "~/components/ui/button";
// import HeroSection from "~/components/section/hero-section";
import { db } from "~/config/supabase";
import FloatingWhatsApp from "~/components/FloatingWhatsapp";
import CardFeatureSection from "~/components/section/feature-section";
import CardTestimoniSection from "~/components/section/testimoni-seection";
// import { SlideInModal } from "~/components/modal/SlideInModal";
import { useState } from "react";
import { HighlightSection } from "~/components/section/highlight-event-section";
// import { getSession } from "~/lib/session";
import EventsSection from "~/components/section/new-event-section";
import StatsSection from "~/components/section/stats-section";
import HeroSection from "~/components/section/new-hero-section";
import { API } from "~/lib/api";
import ImageCarousel from "~/components/slider/ImageCarousel";
import { getOptionalUser } from "~/lib/session.server";
// import { blockUserIfLoggedIn } from "~/lib/session.client";
// import { blockLoggedIn } from "~/lib/session.server";
// import { unsealSession } from "~/lib/session.client";
// import { unsealSession } from "~/lib/session.server";
// import Navbar from "~/components/section/navbar";
// import FooterSection from "~/components/section/footer";

export async function loader({ request }: LoaderFunctionArgs) {
  // Get optional user (for public pages)
  const authData = await getOptionalUser(request);

  /* ===========================
     FETCH LANDING PAGE CONTENT
  =========================== */
  // Prepare session data for API calls
  const sessionData = authData
    ? { user: authData.user, token: authData.token }
    : {};

  const highlightEvent = await API.CMS_CONTENT.get({
    session: sessionData,
    req: { query: { type: "highlight-event", pagination: "false" } } as any,
  });

  const heroSection = await API.CMS_CONTENT.get({
    session: sessionData,
    req: { query: { type: "hero-section", pagination: "false" } } as any,
  });

  // Get approved testimonials for landing page
  const testimonials = await API.TESTIMONIAL.get({
    session: sessionData,
    req: {
      query: {
        pagination: "true",
        // status: "approved",
        page: 0,
        size: 6, // Limit to 6 testimonials
      },
    } as any,
  });

  // Get stats data for stats section
  const stats = await API.CMS_CONTENT.get({
    session: sessionData,
    req: {
      query: {
        pagination: "false",
        type: "stats",
        is_active: 1,
      },
    } as any,
  });

  return {
    user: authData?.user || null,
    highlightEvent: highlightEvent.items,
    heroSection: heroSection.items,
    testimonials: testimonials.items || [],
    stats: stats.items || [],
  };
}

export default function LandingPage() {
  const { highlightEvent, heroSection, testimonials, stats, APP_CONFIG } =
    useLoaderData();

  return (
    <section>
      <div className="w-full">
        <LandingPageDesign
          data={{ highlightEvent, heroSection, testimonials, stats }}
        />
      </div>
      {/* {APP_CONFIG.env === "development" ? (
        <div className="w-full">
          <LandingPageDesign />
        </div>
      ) : (
        <ComingSoon />
      )} */}
    </section>
  );
}

const LandingPageDesign = ({ data }: any) => {
  return (
    <div className="flex flex-col">
      {/* <HeroSection isAuthenticated={false} isAdmin={false} isCustomer={false} /> */}
      {/* <HeroSection /> */}

      <div className="p-8 bg-white">
        <div className="max-w-7xl mx-auto rounded-2xl overflow-hidden">
          <ImageCarousel
            images={data?.heroSection?.map((v: any) => v?.image)}
            height={430}
            rounded="rounded-none" // penting: biarkan carousel tanpa rounding
            interval={3500}
          />
        </div>
      </div>

      {/* <CardFeatureSection /> */}

      <StatsSection stats={data?.stats || []} />

      <EventsSection events={data?.highlightEvent} />
      {/* <HighlightSection
        highlights={[
          {
            id: 1,
            institution: "ITERA 2",
            event: "ACARA 2",
            description: "Bismillah", 
            imageUrl: "https://i.pravatar.cc/40",
            link: "https://kinau.id",
          },
        ]}
      /> */}

      {/* <section className="w-full bg-blue-600 py-16">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Siap Mengubah Cara Anda Mengelola Acara?
            </h2>
            <p className="text-white/90 mb-8">
              Bergabunglah dengan ribuan penyelenggara yang telah menggunakan
              platform kami untuk menciptakan acara yang lebih baik dan
              mendapatkan wawasan berharga dari para anggotanya.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800"
              asChild
            >
              <Link to="/login">Mulai Sekarang</Link>
            </Button>
          </div>
        </div>
      </section> */}

      <CardTestimoniSection testimonials={data?.testimonials} />

      <FloatingWhatsApp />
    </div>
  );
};

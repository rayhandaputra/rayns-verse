import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { CONFIG } from "~/config";
import ComingSoon from "./pre-launch/_index";
import { Button } from "~/components/ui/button";
import HeroSection from "~/components/section/hero-section";
import { db } from "~/config/supabase";
import FloatingWhatsApp from "~/components/FloatingWhatsapp";
import CardFeatureSection from "~/components/section/feature-section";
import CardTestimoniSection from "~/components/section/testimoni-seection";
import { SlideInModal } from "~/components/modal/SlideInModal";
import { useState } from "react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get("q") ?? "";

  return { search, APP_CONFIG: CONFIG };
}

export default function LandingPage() {
  const { APP_CONFIG } = useLoaderData();
  return (
    <section>
      <div className="w-full">
        <LandingPageDesign />
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

const LandingPageDesign = () => {
  return (
    <div className="flex flex-col">
      <HeroSection isAuthenticated={false} isAdmin={false} isCustomer={false} />

      <CardFeatureSection />

      <section className="w-full bg-blue-600 py-16">
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
      </section>

      <CardTestimoniSection />

      <FloatingWhatsApp />
    </div>
  );
};

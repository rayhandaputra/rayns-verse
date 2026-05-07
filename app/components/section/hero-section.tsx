import { ArrowRight, CalendarDays, LineChart, Star, Users } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { Link } from "react-router";

type HeroSectionProps = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
};

const HeroSection = ({
  isAuthenticated,
  isAdmin,
  isCustomer,
}: HeroSectionProps) => {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100 overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-300 rounded-full blur-3xl opacity-20 -z-10"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-300 rounded-full blur-3xl opacity-20 -z-10"></div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-block rounded-full bg-blue-100 px-4 py-1 text-sm text-blue-700 font-medium">
              🎉 Peluncuran Platform Baru
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl text-gray-700 font-extrabold tracking-tight leading-tight">
              Manajemen Acara & Survei{" "}
              <span className="text-blue-600">Jadi Mudah</span>
            </h1>

            <p className="text-gray-600 md:text-lg max-w-xl mx-auto lg:mx-0">
              Buat, kelola, dan analisis acara dalam satu platform terpadu.
              Libatkan anggota, kumpulkan masukan, dan tingkatkan partisipasi
              dengan mudah.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className={buttonVariants({
                    size: "lg",
                    variant: "secondary",
                    className: "bg-blue-600",
                  })}
                >
                  Mulai Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}

              {isCustomer && (
                <Link
                  to="/dashboard"
                  className={buttonVariants({
                    size: "lg",
                    variant: "secondary",
                    className: "text-blue-800",
                  })}
                >
                  Dashboard Saya
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className={buttonVariants({
                    size: "lg",
                    variant: "secondary",
                    className: "text-blue-800",
                  })}
                >
                  Dashboard Admin
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}

              <Link
                to="/products"
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                })}
              >
                Lihat Produk
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 justify-center lg:justify-start pt-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm">
                  Dipercaya oleh <strong>10,000+</strong> pengguna
                </span>
              </div>
              <div className="flex items-center gap-1 text-yellow-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-500" />
                ))}
                <span className="ml-1 text-sm text-gray-700">4.9/5</span>
              </div>
            </div>
          </div>

          {/* Right Illustration / Demo card */}
          <div className="hidden lg:block">
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute -top-16 right-10 w-60 h-60 bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full blur-3xl opacity-30"></div>
              <img
                src="/icon/3d-illustration-bussiness.png"
                alt="3D Illustration"
                className="relative z-10 w-96"
              />

              <div className="absolute bottom-0 left-0 w-60 bg-white rounded-2xl shadow-xl p-5 border border-gray-100 z-20 hover:scale-105 transition">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500">15-17 Mei 2025</span>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                    Aktif
                  </span>
                </div>
                <div className="bg-gray-100 h-28 rounded-xl flex items-center justify-center text-gray-500 font-medium">
                  <div className="flex flex-col">
                    <p>E-Formulir Acara</p>
                    <p className="text-[0.675rem] text-gray-400">
                      Kustom sendiri tautan Anda
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-3 bg-gray-200 rounded"></div>
                <div className="mt-2 h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="mt-4 flex items-center gap-2 text-blue-600 font-medium">
                  <div className="bg-blue-100 h-10 w-10 rounded-full flex items-center justify-center">
                    <LineChart className="h-5 w-5 text-blue-600" />
                  </div>
                  50++ Responden
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                Penawaran Terbatas
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pb-8">
        <div className="animate-bounce text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

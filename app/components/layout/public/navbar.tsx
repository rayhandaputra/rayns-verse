"use client";

import { Loader2, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useFetcher, useNavigate } from "react-router";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "~/config/firebase";
import SlideInModal from "~/components/modal/SlideInModal";

export default function Navbar({ session }: { session: any }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher();
  const [scrolled, setScrolled] = useState(false);
  const [openLogin, setOpenLogin] = useState<boolean>(false);
  const isLoading = fetcher.state === "submitting";

  const handleGooglSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const google_sso: any = await signInWithPopup(auth, provider);
      const token = await google_sso.user.getIdToken();
      const email = google_sso.user.email;

      fetcher.submit({ token, email }, { method: "post", action: "/login" });
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  useEffect(() => {
    console.log("Fetcher State:", fetcher.state);
    if (fetcher.state === "idle" && fetcher.data) {
      navigate("/app/overview", {
        state: { flash: fetcher.data },
      });
    }
  }, [fetcher.state, fetcher.data, navigate]);

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) setScrolled(true);
      else setScrolled(false);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Berita", href: "#" },
    { label: "Katalog", href: "#" },
    // { label: "Harga", href: "#" },
    { label: "Kontak", href: "#" },
    { label: "Fitur", href: "#" },
  ];

  return (
    <nav
      className={`w-full fixed top-0 left-0 z-50 transition-all duration-300 bg-white ${
        scrolled ? "shadow-md shadow-gray-400/30" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 md:py-6 px-6 md:px-12">
        {/* Logo */}
        <img
          src="/kinau-logo.png"
          className="w-28 h-auto"
          alt="Logo"
          onClick={() => navigate("/")}
        />

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {/* {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-gray-600 hover:text-blue-600 transition"
            >
              {item.label}
            </a>
          ))} */}

          <div className="flex items-center gap-4">
            {/* <button
              className="text-gray-700 font-medium cursor-pointer"
              onClick={() => setOpenLogin(true)}
            >
              Login
            </button> */}
            {/* <button className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition">
              Daftar
            </button> */}
            {session ? (
              <button
                onClick={() => navigate("/app/overview")}
                className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => setOpenLogin(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-gray-700"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="bg-white border-t md:hidden flex flex-col items-center py-4 space-y-4 shadow-inner">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-gray-700 hover:text-blue-600 transition"
            >
              {item.label}
            </a>
          ))}
          <div className="flex flex-col gap-2">
            <button
              className="text-gray-700 font-medium cursor-pointer"
              onClick={() => setOpenLogin(true)}
            >
              Login
            </button>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">
              Signup
            </button>
          </div>
        </div>
      )}

      <SlideInModal isOpen={openLogin} onClose={() => setOpenLogin(false)}>
        <div className="min-h-screen flex items-center justify-center bg-white px-4 z-50">
          <div className="w-full max-w-md text-center">
            {/* Welcome Text */}
            <h2 className="text-2xl font-semibold text-black">
              Selamat Datang di Area Pelanggan
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Masuk untuk mengakses berbagai layanan dan fitur terbaik kami.
            </p>

            {/* Tabs Sign In / Signup */}
            <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
              <button className="flex-1 py-2 rounded-lg bg-white shadow text-black font-medium">
                Sign In
              </button>
              <button className="flex-1 py-2 text-gray-500">Signup</button>
            </div>

            {/* Social Login */}
            <div className="flex items-center mb-6">
              <hr className="flex-1 border-gray-300" />
              <span className="mx-3 text-gray-400 text-sm">
                Lanjutkan Autentikasi
              </span>
              <hr className="flex-1 border-gray-300" />
            </div>

            {/* Continue Button */}
            <button
              onClick={handleGooglSignIn}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 border font-medium rounded-xl py-3 mb-6 transition
                ${
                  isLoading
                    ? "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer"
                }`}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              ) : (
                <img
                  src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
              )}
              {isLoading ? "Memproses..." : "Masuk dengan Akun Google"}
            </button>

            {/* Footer Text */}
            <p className="text-xs text-gray-500">
              Dengan masuk, Anda menyetujui pengelolaan data pribadi sesuai
              kebijakan privasi kami. Data Anda akan digunakan untuk
              meningkatkan layanan dan keamanan akun.
            </p>
          </div>
        </div>
      </SlideInModal>
    </nav>
  );
}

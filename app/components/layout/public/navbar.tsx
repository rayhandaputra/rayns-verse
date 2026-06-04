"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { LogIn } from "lucide-react";

export default function Navbar({ session }: { session?: any }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleScroll = () => setScrolled(window.scrollY > 20);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 md:px-6">
      <nav
        className={`w-full max-w-7xl transition-all duration-300 rounded-2xl border ${
          scrolled 
            ? "bg-white shadow-xl border-gray-100 py-3" 
            : "bg-white shadow-lg border-white/50 py-4"
        }`}
      >
        <div className="px-6 md:px-8 flex justify-between items-center">
          <img
            src="/kinau-logo.png"
            className="h-8 md:h-10 w-auto cursor-pointer"
            alt="Kinau"
            onClick={() => navigate("/")}
          />
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/katalog")}
              className="px-4 py-2 rounded-full border-2 border-[#103557] text-[#103557] text-xs font-bold hover:bg-[#103557] hover:text-white transition-all flex items-center gap-2"
            >
              Lihat Katalog
            </button>
            {session ? (
              <button
                onClick={() => {
                  const userData = typeof session === 'string' ? JSON.parse(session) : session;
                  if (userData?.role === "customer") {
                    navigate("/customer/dashboard");
                  } else {
                    navigate("/app/overview");
                  }
                }}
                className="px-4 py-2 rounded-full bg-[#103557] text-white text-xs font-bold hover:bg-[#103557]/90 transition-all flex items-center gap-2"
              >
                Dasbor
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 rounded-full bg-[#103557] text-white text-xs font-bold hover:bg-[#103557]/90 transition-all flex items-center gap-2"
              >
                <LogIn size={14} className="rotate-180" /> Login
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

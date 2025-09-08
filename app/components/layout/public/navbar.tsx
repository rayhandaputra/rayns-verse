import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Loader2, Menu } from "lucide-react";
import { useFetcher, useNavigate } from "react-router";
import { abbreviation } from "~/lib/utils";
import { Button } from "../../ui/button";
import { useEffect, useState } from "react";
import { SlideInModal } from "~/components/modal/SlideInModal";
import { auth } from "~/config/firebase";
import { API } from "~/lib/api";
import { toast } from "sonner";

interface NavbarProps {
  session?: {
    name: string;
    role: string;
    avatar?: string;
  } | null;
  sidebar?: {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (val: boolean) => void;
  };
}

const Navbar = ({ session, sidebar }: NavbarProps) => {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [openLogin, setOpenLogin] = useState<boolean>(false);
  // const [alert, setAlert] = useState<boolean>(false);
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

  const toggleMobileMenu = () => {
    sidebar?.setMobileMenuOpen?.(!sidebar?.mobileMenuOpen);
  };

  const abbr = abbreviation(session?.name || "G");

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 h-[64px] bg-white border-b border-gray-200 flex items-center px-4 md:px-6 shadow-sm">
      <div className="flex w-full items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/kinau-logo.png" className="w-24 h-auto" alt="Logo" />
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <button
            onClick={() => navigate("/")}
            className="hover:text-primary cursor-pointer"
          >
            Berita
          </button>
          <button
            onClick={() => navigate("/features")}
            className="hover:text-primary cursor-pointer"
          >
            Katalog
          </button>
          <button
            onClick={() => navigate("/pricing")}
            className="hover:text-primary cursor-pointer"
          >
            Harga
          </button>
          <button
            onClick={() => navigate("/contact")}
            className="hover:text-primary cursor-pointer"
          >
            Kontak
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
                <Avatar className="w-9 h-9 ring-1 ring-gray-200">
                  <AvatarImage src={session.avatar} />
                  <AvatarFallback>{abbr}</AvatarFallback>
                </Avatar>

                {/* Desktop user info */}
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900">
                    {session.name}
                  </span>
                  <span className="text-xs text-gray-500">{session.role}</span>
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-44 mt-2">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/logout")}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // <Button
            //   variant="outline"
            //   size="sm"
            //   className="text-blue-800 border border-blue-800 hover:bg-blue-50 font-semibold"
            //   onClick={() => setOpenLogin(true)}
            // >
            //   Login
            // </Button>
            <div className="inline-flex items-center rounded-full bg-gray-100 p-1 shadow-inner">
              <a
                onClick={() => setOpenLogin(true)}
                className="px-5 py-2 text-sm font-semibold rounded-full 
           bg-blue-600 text-white shadow-md 
           hover:bg-blue-700 transition cursor-pointer"
              >
                Masuk
              </a>

              <a
                className="px-5 py-2 text-sm font-semibold rounded-full 
           text-gray-600 hover:text-blue-600 hover:bg-gray-200 transition cursor-pointer"
              >
                Daftar
              </a>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <SlideInModal open={openLogin} onClose={() => setOpenLogin(false)}>
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
};

export default Navbar;

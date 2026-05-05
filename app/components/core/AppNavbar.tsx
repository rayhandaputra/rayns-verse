import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useFetcher } from "react-router";
import { Menu, Clock, HardDrive, LayoutTemplate, Printer, Mail } from "lucide-react";
import Swal from "sweetalert2";

interface NavbarProps {
  currentUser: any;
  sidebar: {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    desktopSidebarOpen: boolean;
    setDesktopSidebarOpen: (open: boolean) => void;
  };
}

export const AppNavbar: React.FC<NavbarProps> = ({ currentUser, sidebar }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  const fetcher = useFetcher();

  const isStaff =
    currentUser?.role === "staff" || currentUser?.role === "Staff";

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const h = currentTime.getHours();
    if (h < 11) return "Selamat Pagi";
    if (h < 15) return "Selamat Siang";
    if (h < 18) return "Selamat Sore";
    if (h < 19) return "Selamat Petang";
    return "Selamat Malam";
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Konfirmasi Logout",
      text: "Apakah Anda yakin ingin keluar dari akun ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        confirmButton:
          "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg focus:outline-none",
        cancelButton:
          "bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg ml-2 mr-2",
        popup: "rounded-2xl shadow-lg",
        title: "text-lg font-semibold text-gray-800",
        htmlContainer: "text-gray-600",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      fetcher.submit(null, { method: "post", action: "/logout" });
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm h-[88px]">
      <div className="flex items-center gap-3">
        <button
          onClick={() => sidebar.setMobileMenuOpen(true)}
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
        >
          <Menu size={24} />
        </button>
        <button
          onClick={() => sidebar.setDesktopSidebarOpen(!sidebar.desktopSidebarOpen)}
          className="hidden lg:flex p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg transition items-center justify-center"
          title={sidebar.desktopSidebarOpen ? "Sembunyikan sidebar" : "Tampilkan sidebar"}
        >
          <Menu size={24} />
        </button>
        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-gray-800 leading-tight flex items-center gap-2">
            {getGreeting()}, {currentUser?.name}
            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {currentUser?.role}
            </span>
          </h2>
          <p className="text-xs text-gray-400">
            Selamat bekerja, semoga harimu menyenangkan.
          </p>
        </div>
      </div>

      <div className="hidden md:flex flex-col items-center">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1">
          <Clock size={12} /> Waktu Server
        </div>
        <div className="text-xl font-mono font-bold text-gray-800">
          {currentTime.toLocaleTimeString("id-ID")}
        </div>
        <div className="text-xs text-gray-500">
          {currentTime.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!isStaff && (
          <>
            <button
              onClick={() => navigate("/app/drive/customer")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition transform hover:-translate-y-0.5 ${location.pathname.includes("/app/drive") ? "bg-gray-800 text-white shadow-lg" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"}`}
            >
              <HardDrive size={16} />{" "}
              <span className="hidden sm:inline">DRIVE</span>
            </button>
            <button
              onClick={() => navigate("/app/setting/design")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition transform hover:-translate-y-0.5 ${location.pathname.includes("/app/setting/design") ? "bg-gray-800 text-white shadow-lg" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"}`}
            >
              <LayoutTemplate size={16} />{" "}
              <span className="hidden sm:inline">DESAIN</span>
            </button>
            <button
              onClick={() => navigate("/app/print-area")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition transform hover:-translate-y-0.5 ${location.pathname.includes("/app/print-area") ? "bg-gray-800 text-white shadow-lg" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"}`}
            >
              <Printer size={16} />{" "}
              <span className="hidden sm:inline">CETAK</span>
            </button>
            <button
              onClick={() => navigate("/app/email")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition transform hover:-translate-y-0.5 ${location.pathname === "/app/email" ? "bg-gray-800 text-white shadow-lg" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"}`}
            >
              <Mail size={16} />{" "}
              <span className="hidden sm:inline">EMAIL</span>
            </button>
          </>
        )}
        {isStaff && (
          <button
            onClick={handleLogout}
            className="text-red-500 font-bold text-sm"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

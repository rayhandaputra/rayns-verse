import { Link, useLocation, useFetcher } from "react-router";
import { LogOut } from "lucide-react";
import Swal from "sweetalert2";
import React from "react";

export type MenuItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  active?: string[];
};

interface SidebarProps {
  navigation: MenuItem[];
  currentPath: string;
  onLogout?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<SidebarProps> = ({
  navigation,
  currentPath,
  onLogout,
  isMobile = false,
  onCloseMobile,
}) => {
  const fetcher = useFetcher();

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }

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

  const isActive = (item: MenuItem) => {
    if (currentPath === item.href) return true;
    if (item.active?.includes(currentPath)) return true;
    if (item.href !== "/app" && currentPath.startsWith(item.href)) return true;
    return false;
  };

  const baseClasses =
    "w-64 bg-white border-r border-gray-200 flex flex-col z-20 h-full";
  const positionClasses = isMobile ? "" : "fixed left-0 top-0 h-screen";

  return (
    <div className={`${baseClasses} ${positionClasses}`}>
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-44 h-12 relative overflow-hidden flex items-center justify-center bg-gray-50">
            <img
              src="/kinau-logo.png"
              className="min-w-40 h-auto object-cover"
              alt="Logo"
            />
          </div>
        </div>

        {isMobile && (
          <button onClick={onCloseMobile}>
            <LogOut className="rotate-180" size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation?.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.id}
              to={item.href}
              prefetch="intent"
              onClick={isMobile ? onCloseMobile : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active
                ? "bg-gray-900 text-white shadow-md shadow-gray-200"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <Icon
                size={20}
                className={active ? "text-blue-400" : "text-gray-400"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 mb-2"
        >
          <LogOut size={20} /> Logout
        </button>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 text-center">
            © 2025 Kinau Production
          </p>
        </div>
      </div>
    </div>
  );
};

import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, type LoaderFunction } from "react-router";
import { toast } from "sonner";
import React from "react";
import {
  LayoutDashboard,
  FileText,
  History,
  BarChart2,
  Package,
  PlusCircle,
  HardDrive,
  Tag,
  LogOut,
  Mail,
  User2Icon,
} from "lucide-react";
import Topbar from "~/components/layout/admin/topbar";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
// NOTE: Uncomment import ini jika requireAuth diaktifkan di loader
// import { requireAuth } from "~/lib/session.server";

// Navigation type for menu items
type MenuItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  active?: string[]; // Additional paths that should be considered active
};

// Admin Navigation Constant
export const ADMIN_NAVIGATION: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/app/overview",
    icon: LayoutDashboard,
    active: ["/app/overview"],
  },
  {
    id: "form",
    label: "Form Order",
    href: "/app/order-form",
    icon: PlusCircle,
  },
  {
    id: "orders",
    label: "Daftar Pesanan",
    href: "/app/order-list",
    icon: FileText,
  },
  {
    id: "products",
    label: "Daftar Produk",
    href: "/app/product-list",
    icon: Tag,
  },
  { id: "stock", label: "Stok Bahan", href: "/app/stock", icon: Package },
  { id: "drive", label: "Kinau Drive", href: "/app/drive", icon: HardDrive },
  { id: "email", label: "Email", href: "/app/email", icon: Mail },
  {
    id: "portfolio",
    label: "Riwayat Pesanan",
    href: "/app/order-history",
    icon: History,
  },
  {
    id: "users",
    label: "Manajemen Akun",
    href: "/app/setting/account",
    icon: User2Icon,
  },
  // { id: "analytic", label: "Analitik", href: "/app/analytic", icon: BarChart2 },
];

export const loader: LoaderFunction = async ({ request }) => {
  // Require authentication for app routes
  // const { user } = await requireAuth(request);

  return {
    // user,
    message: "OK",
  };
};

export default function AppLayout() {
  const location = useLocation();
  const [flash, setFlash] = useState<any>(null);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (location.state?.flash) {
      setFlash(location.state.flash);

      // reset supaya gak muncul lagi saat navigate balik
      window.history.replaceState({}, document.title);

      setTimeout(() => {
        setFlash(null);
      }, 3000);
    }
  }, [location.state]);

  useEffect(() => {
    if (flash) {
      if (flash.success) {
        toast.success(flash.message);
      } else {
        toast.error(flash.message);
      }
    }
  }, [flash]);

  const [client, setClient] = useState<boolean>(false);
  useEffect(() => {
    setClient(true);
  }, []);
  if (!client) return null;

  const handleLogout = () => {
    // TODO: Implement logout
  };

  return (
    <div>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          navigation={ADMIN_NAVIGATION}
          currentPath={location.pathname}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0">
          <Sidebar
            navigation={ADMIN_NAVIGATION}
            currentPath={location.pathname}
            onLogout={handleLogout}
            isMobile
          />
        </SheetContent>
      </Sheet>

      {/* Topbar */}
      <div className="fixed top-0 left-0 lg:left-64 right-0 z-10">
        <Topbar
          sidebar={{
            mobileMenuOpen: isMobileSidebarOpen,
            setMobileMenuOpen: setMobileSidebarOpen,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-0 lg:ml-64 pt-[81px]">
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

interface SidebarProps {
  navigation: MenuItem[];
  currentPath: string;
  onLogout: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  navigation,
  currentPath,
  onLogout,
  isMobile = false,
}) => {
  // Check if current path matches item or its active paths
  const isActive = (item: MenuItem) => {
    if (currentPath === item.href) return true;
    if (item.active?.includes(currentPath)) return true;
    // Also check if currentPath starts with item.href (for nested routes)
    if (item.href !== "/app" && currentPath.startsWith(item.href)) return true;
    return false;
  };

  const baseClasses =
    "w-64 bg-white border-r border-gray-200 flex flex-col z-20 h-full";
  const positionClasses = isMobile ? "" : "fixed left-0 top-0 h-screen";

  return (
    <div className={`${baseClasses} ${positionClasses}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img src="/kinau-logo.png" className="w-28 h-auto" alt="Logo" />
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.id}
              to={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
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
          onClick={onLogout}
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

import { useEffect, useState } from "react";
import {
  Link,
  Outlet,
  useLocation,
  type LoaderFunction,
  useFetcher,
  useLoaderData,
  useNavigate,
} from "react-router";
import { toast } from "sonner";
import React from "react";
import Swal from "sweetalert2";
import {
  LayoutDashboard,
  FileText,
  History,
  Package,
  PlusCircle,
  HardDrive,
  Tag,
  LogOut,
  Mail,
  User2Icon,
  Clock,
  Menu,
  Users2Icon,
  UserCog2Icon,
  MonitorCogIcon,
  RecycleIcon,
  Printer,
  ShoppingCart,
  LayoutTemplate,
  Building,
} from "lucide-react";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { requireAuth } from "~/utils/session.server";
import { AppSidebar, type MenuItem } from "~/components/core/AppSidebar";
import { AppNavbar } from "~/components/core/AppNavbar";

// Admin Navigation Constant
export const ADMIN_NAVIGATION: MenuItem[] = [
  {
    id: "dashboard",
    label: "Performa Perusahaan",
    href: "/app/overview",
    icon: LayoutDashboard,
    active: ["/app/overview"],
  },
  {
    id: "form",
    label: "Input Pesanan",
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
  {
    id: "procurement",
    label: "Pengadaan",
    href: "/app/procurement/id_card_with_lanyard/shopping",
    icon: ShoppingCart,
  },
  // { id: "stock", label: "Stok Bahan", href: "/app/stock", icon: Package },
  // { id: "drive", label: "Kinau Drive", href: "/app/drive", icon: HardDrive },
  // { id: "email", label: "Email", href: "/app/email", icon: Mail },
  {
    id: "portfolio",
    label: "Riwayat Pesanan",
    href: "/app/order-history",
    icon: History,
  },
  {
    id: "finance",
    label: "Keuangan",
    href: "/app/finance",
    icon: Users2Icon,
  },
  // {
  //   id: "employee",
  //   label: "Kepegawaian",
  //   href: "/app/employee",
  //   icon: Users2Icon,
  // },
  // {
  //   id: "inventory",
  //   label: "Aset Perusahaan",
  //   href: "/app/asset/inventory",
  //   icon: MonitorCogIcon,
  // },
  {
    id: "users",
    label: "Manajemen Akun",
    href: "/app/user",
    icon: UserCog2Icon,
  },
  {
    id: "institution",
    label: "Manajemen Institusi",
    href: "/app/master/institution",
    icon: Building,
  },
  {
    id: "bin",
    label: "Recycle Bin",
    href: "/app/setting/recycle-bin",
    icon: RecycleIcon,
  },
];

export const loader: LoaderFunction = async ({ request }) => {
  // Require authentication for app routes
  const { user } = await requireAuth(request);

  return {
    user: {
      ...user,
      name: user?.fullname || "",
    },
    message: "OK",
  };
};

export default function AppLayout() {
  const location = useLocation();
  const { user } = useLoaderData() as { user: any };
  const [flash, setFlash] = useState<any>(null);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

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

  const handleLogout = async () => {
    // Shared logout logic can be passed down or re-implemented if needed,
    // but cleaner to pass it or have the component handle it if it imports fetcher.
    // For Sidebar, we pass it. For Navbar, it handles internal logic in its own component
    // or we can pass this function.
    // Let's rely on the child components utilizing useFetcher which is cleaner for encapsulation
    // or pass this handler if we want central control.
    // For now, I'll pass this handler to Sidebar and let Navbar reproduce it since it's cleaner than props drilling too much if not sharing state.
  };

  return (
    <div>
      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:block transition-all duration-300 ease-in-out ${isDesktopSidebarOpen ? "w-64" : "w-0"
          }`}
      >
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isDesktopSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
          <AppSidebar
            navigation={ADMIN_NAVIGATION}
            currentPath={location.pathname}
          />
        </div>
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0">
          <AppSidebar
            navigation={ADMIN_NAVIGATION}
            currentPath={location.pathname}
            isMobile
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Topbar / Navbar */}
      <div
        className={`fixed top-0 right-0 z-30 transition-all duration-300 ease-in-out ${isDesktopSidebarOpen ? "left-0 lg:left-64" : "left-0"
          }`}
      >
        <AppNavbar
          currentUser={user}
          sidebar={{
            mobileMenuOpen: isMobileSidebarOpen,
            setMobileMenuOpen: setMobileSidebarOpen,
            desktopSidebarOpen: isDesktopSidebarOpen,
            setDesktopSidebarOpen: setDesktopSidebarOpen,
          }}
        />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 pt-[88px] transition-all duration-300 ease-in-out ${isDesktopSidebarOpen ? "ml-0 lg:ml-64" : "ml-0"
          }`}
      >
        <div className="p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
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
} from "lucide-react";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { requireAuth } from "~/lib/session.server";

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
  { id: "stock", label: "Stok Bahan", href: "/app/stock", icon: Package },
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
      <div className="hidden lg:block">
        <Sidebar
          navigation={ADMIN_NAVIGATION}
          currentPath={location.pathname}
        />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0">
          <Sidebar
            navigation={ADMIN_NAVIGATION}
            currentPath={location.pathname}
            isMobile
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Topbar / Navbar */}
      <div className="fixed top-0 left-0 lg:left-64 right-0 z-10 w-auto">
        <Navbar
          currentUser={user}
          sidebar={{
            mobileMenuOpen: isMobileSidebarOpen,
            setMobileMenuOpen: setMobileSidebarOpen,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-0 lg:ml-64 pt-[88px]">
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

interface NavbarProps {
  currentUser: any;
  sidebar: {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
  };
}

const Navbar: React.FC<NavbarProps> = ({ currentUser, sidebar }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  const fetcher = useFetcher();

  // Determine active tab based on location for the "Drive" / "Email" buttons
  const activeTab = location.pathname.includes("/app/drive")
    ? "drive"
    : location.pathname.includes("/app/email")
      ? "email"
      : "";

  const isStaff =
    currentUser?.role === "staff" || currentUser?.role === "Staff";

  useEffect(() => {
    // Client-side only time to avoid hydration mismatch
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Time Greeting Logic
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

  const setActiveTab = (tab: string) => {
    if (tab === "drive") navigate("/app/drive");
    if (tab === "email") navigate("/app/email");
  };

  return (
    <div>
      {/* NEW TOP BAR */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm h-[88px]">
        {/* Left: User Info & Mobile Toggle */}
        {/* <div className="flex items-center gap-3">
          <button
            onClick={() => sidebar.setMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-500"
          >
            <Menu size={24} />
          </button>

          <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-blue-600 font-bold">
            {currentUser?.fullname?.substring(0, 2).toUpperCase() ||
              currentUser?.name?.substring(0, 2).toUpperCase() ||
              "US"}
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 leading-tight">
              Halo, {currentUser?.fullname || currentUser?.name || "User"}
            </h2>
            <p className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full w-fit">
              {currentUser?.role || "Staff"}
            </p>
          </div>
        </div> */}
        <div className="flex items-center gap-3">
          <div>
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

        {/* Center: Realtime Clock */}
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

        {/* Right: Internal Navigation Buttons (Hide for Staff) */}
        <div className="flex items-center gap-3">
          {!isStaff && (
            <>
              <button
                onClick={() => navigate("/app/drive/customer")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition transform hover:-translate-y-0.5 ${location.pathname === "/app/drive" ? "bg-gray-800 text-white shadow-lg" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"}`}
              >
                <HardDrive size={16} />{" "}
                <span className="hidden sm:inline">Drive</span>
              </button>
              <button
                onClick={() => navigate("/app/email")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition transform hover:-translate-y-0.5 ${location.pathname === "/app/email" ? "bg-gray-800 text-white shadow-lg" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"}`}
              >
                <Mail size={16} />{" "}
                <span className="hidden sm:inline">Email</span>
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
          {/* Always show logout on small screens via Topbar or here? 
              The design shows logout for staff specifically. 
              Let's allow logout for non-staff too but maybe in a different way or 
              assume they use Sidebar. But for consistency let's add a small logout icon for non-staff if on mobile?
              For now sticking to exact request: "pertahankan UI".
          */}
        </div>
      </div>
    </div>
  );
};

interface SidebarProps {
  navigation: MenuItem[];
  currentPath: string;
  onLogout?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  navigation,
  currentPath,
  onLogout,
  isMobile = false,
  onCloseMobile,
}) => {
  const fetcher = useFetcher();

  // Internal logout if not provided
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
          <img src="/kinau-logo.png" className="w-28 h-auto" alt="Logo" />
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

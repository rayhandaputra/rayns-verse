import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate, useLoaderData, redirect } from "react-router";
import { Home, ShoppingBag, User } from "lucide-react";
import { motion } from "motion/react";
import { getOptionalUser } from "~/utils/session.server";
import type { LoaderFunction } from "react-router";

export const loader: LoaderFunction = async ({ request }) => {
  const result = await getOptionalUser(request);

  if (!result) {
    return { user: null, isDemo: true };
  }

  const userData =
    typeof result.user === "string" ? JSON.parse(result.user) : result.user;

  // If customer hasn't completed registration (no phone), redirect to login
  const url = new URL(request.url);
  if (userData?.role === "customer" && !userData?.phone && !url.pathname.includes("/customer/register")) {
    throw redirect("/login");
  }

  return { user: userData, isDemo: false };
};

const TABS = [
  { id: "dashboard", label: "Beranda", icon: Home, path: "/customer/dashboard" },
  { id: "orders", label: "Pesanan", icon: ShoppingBag, path: "/customer/orders" },
  { id: "profile", label: "Profil", icon: User, path: "/customer/profile" },
] as const;

export default function CustomerLayout() {
  const { user, isDemo } = useLoaderData() as { user: any; isDemo: boolean };
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/customer/profile")) setActiveTab("profile");
    else if (path.includes("/customer/orders") || path.includes("/customer/configure")) setActiveTab("orders");
    else setActiveTab("dashboard");
  }, [location.pathname]);

  return (
    <div className="h-dvh w-full overflow-hidden flex flex-col bg-[#F3F8FC] font-sans antialiased">
      {/* ─── Main Content Area (fills remaining space, each page handles its own scroll) ─── */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full w-full max-w-md mx-auto">
          <Outlet context={{ user, isDemo }} />
        </div>
      </main>

      {/* ─── Fixed Bottom Navigation (3 tabs) ─── */}
      <nav className="shrink-0 bg-white border-t border-slate-100 shadow-[0_-1px_8px_rgba(0,0,0,0.04)] safe-area-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around px-4 py-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`relative flex flex-col items-center gap-0.5 py-1.5 px-5 rounded-xl transition-all ${
                  isActive
                    ? "text-[#1E434C]"
                    : "text-slate-400 active:text-slate-600"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="customer-tab-pill"
                    className="absolute -top-1 w-8 h-1 bg-[#0097B2] rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

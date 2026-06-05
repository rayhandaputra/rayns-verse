import {
  NavLink,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  type LoaderFunctionArgs,
} from "react-router";
import { Bell, CheckCircle2, Home, Package, User } from "lucide-react";
import { useState } from "react";
import { getOptionalUser } from "~/utils/session.server";

type CustomerShellUser = {
  fullname?: string;
  email?: string;
  role?: string;
  phone?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const authData = await getOptionalUser(request);

  if (!authData?.user) {
    throw redirect("/login");
  }

  const user =
    typeof authData.user === "string" ? JSON.parse(authData.user) : authData.user;

  if (user?.role !== "customer") {
    throw redirect("/app/overview");
  }

  return {
    user: {
      fullname: user?.fullname || "Pelanggan",
      email: user?.email || "",
      role: user?.role || "customer",
      phone: user?.phone || "",
    } satisfies CustomerShellUser,
    token: authData?.token || "",
  };
}

const navItems = [
  { label: "Beranda", to: "/customer/dashboard", icon: Home },
  { label: "Pesanan", to: "/customer/orders", icon: Package },
  { label: "Profil", to: "/customer/profile", icon: User },
];

const notifications = [
  {
    title: "Pesan cetak lebih cepat",
    description: "Mulai dari kartu ID, lanyard, kaos, dan kebutuhan acara khusus.",
    time: "Baru",
  },
  {
    title: "Katalog produk tersedia",
    description: "Cek rekomendasi produk sebelum membuat pesanan.",
    time: "Hari ini",
  },
  {
    title: "Unggah desain siap dipakai",
    description: "Area konfigurasi sudah disiapkan untuk build berikutnya.",
    time: "Info",
  },
];

export default function CustomerLayout() {
  const { user, token } = useLoaderData() as { user: CustomerShellUser; token: string };
  const location = useLocation();
  const isConfigurePage = location.pathname.includes("/customer/configure");
  const isOrderDetailPage =
    location.pathname.includes("/customer/orders") &&
    new URLSearchParams(location.search).has("detail");
  const isDetailPage = isConfigurePage || isOrderDetailPage;
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--customer-bg)] text-[var(--customer-text)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[var(--customer-bg)] shadow-[0_0_40px_rgba(30,67,76,0.08)]">
        <header className={isDetailPage ? "hidden" : "shrink-0 px-5 pb-4 pt-6"}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <img
                  src="/kinau-logo.png"
                  alt="Kinau"
                  className="h-7 w-auto object-contain"
                />
                <p className="mt-0.5 truncate text-[10px] font-bold text-[var(--customer-text-muted)]">
                  Portal Pelanggan
                </p>
              </div>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationOpen((value) => !value)}
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--customer-border)] bg-white text-[var(--customer-primary)] shadow-lg shadow-[rgba(30,67,76,0.08)] transition hover:border-[var(--customer-border-active)] hover:bg-[var(--customer-card-hover)]"
                aria-label="Buka notifikasi"
                aria-expanded={isNotificationOpen}
              >
                <Bell size={20} strokeWidth={2.5} />
                <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--customer-accent)]" />
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 top-[3.25rem] z-50 w-[310px] overflow-hidden rounded-[26px] border border-[var(--customer-border)] bg-white shadow-2xl shadow-[rgba(30,67,76,0.16)]">
                  <div className="border-b border-[var(--customer-border)] px-4 py-3">
                    <p className="text-sm font-black text-[var(--customer-primary)]">
                      Notifikasi
                    </p>
                    <p className="text-[11px] font-medium text-[var(--customer-text-muted)]">
                      Pembaruan terbaru dari Kinau ID.
                    </p>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto p-2">
                    {notifications.map((item) => (
                      <div
                        key={item.title}
                        className="flex gap-3 rounded-2xl px-3 py-3 transition hover:bg-[var(--customer-card-hover)]"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-xs font-black leading-5 text-[var(--customer-primary)]">
                              {item.title}
                            </p>
                            <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-[var(--customer-accent)]">
                              {item.time}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-5 text-[var(--customer-text-muted)]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main
          className={[
            "flex-1 overflow-y-auto px-5 pb-24",
            isDetailPage ? "pt-6" : "",
          ].join(" ")}
        >
          <Outlet context={{ user, token }} />
        </main>

        {!isConfigurePage && !isOrderDetailPage && (
          <nav className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-3 border-t border-[var(--customer-border)] bg-white/95 px-6 pb-3 pt-2 shadow-[0_-16px_40px_rgba(30,67,76,0.08)] backdrop-blur">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-black transition-all",
                      isActive
                        ? "bg-[var(--customer-accent-light)] text-[var(--customer-accent)]"
                        : "text-[var(--customer-text-light)] hover:bg-[var(--customer-card-hover)] hover:text-[var(--customer-primary)]",
                    ].join(" ")
                  }
                >
                  <Icon size={18} strokeWidth={2.5} />
                  <span className="leading-none">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}

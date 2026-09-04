import { useState, useEffect, type ReactNode } from "react";
import { NavLink, useFetcher, useLocation } from "react-router";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { cn } from "~/lib/utils";
import { BRAND_NAME } from "~/constants/brand";
import { useUIStore } from "~/components/shared/store/ui";

export interface AccessSidebarItem {
  id: number | string;
  key?: string | null;
  label: string;
  category: string;
}

interface AppShellProps {
  children: ReactNode;
  accessItems?: AccessSidebarItem[];
}

interface NavItem {
  to: string;
  label: string;
  short: string;
  icon: LucideIcon;
  hasSubmenu?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/beranda", label: "Beranda", short: "Home", icon: LayoutDashboard },
  { to: "/akses", label: "Layanan & Akses", short: "Akses", icon: KeyRound, hasSubmenu: true },
  { to: "/backup", label: "Backup Data", short: "Backup", icon: HardDrive },
];

function AppShell({ children, accessItems = [] }: AppShellProps) {
  const location = useLocation();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const logoutFetcher = useFetcher();
  const isLoggingOut = logoutFetcher.state === "submitting";

  const isAksesActive = location.pathname.startsWith("/akses");
  const [aksesMenuOpen, setAksesMenuOpen] = useState(true);

  // Tutup drawer otomatis saat pindah halaman
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  // Kunci scroll body saat drawer mobile terbuka
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  async function handleLogout() {
    const result = await Swal.fire({
      title: "Keluar dari akun?",
      text: "Sesi kamu akan diakhiri dan kamu harus login kembali.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, keluar",
      cancelButtonText: "Batal",
      customClass: {
        popup: "!bg-[var(--card)] !text-[var(--foreground)] !rounded-[2px] !border !border-[var(--border)]",
        confirmButton: "!bg-[var(--loss)] !text-white !rounded-[2px] !px-5 !py-2 !font-mono",
        cancelButton: "!bg-transparent !text-[var(--foreground)] !border !border-[var(--border-strong)] !rounded-[2px] !px-5 !py-2 !font-mono",
      },
    });

    if (result.isConfirmed) {
      const form = new FormData();
      logoutFetcher.submit(form, { method: "post", action: "/auth/logout" });
    }
  }

  const renderSidebarContent = (
    <>
      <div className="h-13 flex items-center justify-between px-4 border-b border-[var(--border)]">
        <NavLink to="/" className="flex items-center gap-2.5">
          <img
            src="/logo-kinau.png"
            alt={BRAND_NAME}
            className="w-5 h-5 rounded-xs object-cover border border-[var(--border)]"
          />
          <span className="text-sm font-mono font-bold tracking-tight uppercase">
            {BRAND_NAME}
          </span>
        </NavLink>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, hasSubmenu }) => {
          if (hasSubmenu) {
            const isExactAkses = location.pathname === "/akses";
            return (
              <div key={to} className="space-y-0.5">
                <div className="flex items-center justify-between group">
                  <NavLink
                    to={to}
                    end
                    className={({ isActive }) =>
                      cn(
                        "flex-1 flex items-center gap-2.5 px-3 py-2 text-xs font-mono transition-colors",
                        "border-l-2",
                        isActive
                          ? "text-[var(--foreground)] border-[var(--foreground)] bg-[var(--surface-subtle)] font-bold"
                          : "text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
                      )
                    }
                  >
                    <Icon size={14} />
                    <span>{label.toUpperCase()}</span>
                  </NavLink>

                  <button
                    type="button"
                    onClick={() => setAksesMenuOpen((v) => !v)}
                    className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                    aria-label="Toggle sub-menu"
                  >
                    {aksesMenuOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                </div>

                {/* Submenu List of Access / Services */}
                {aksesMenuOpen && (
                  <div className="pl-4 pr-1 py-0.5 space-y-0.5 border-l border-[var(--border)] ml-3.5 my-1">
                    {accessItems.length === 0 ? (
                      <div className="px-2.5 py-1 text-[10px] font-mono text-[var(--muted-foreground)] italic">
                        Belum ada layanan
                      </div>
                    ) : (
                      accessItems.map((item) => {
                        const targetUrl = `/akses/${item.id}`;
                        const isSubActive = location.pathname === targetUrl;
                        return (
                          <NavLink
                            key={String(item.id)}
                            to={targetUrl}
                            className={cn(
                              "flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-[11px] font-mono rounded-[2px] transition-colors",
                              isSubActive
                                ? "bg-[var(--foreground)] text-[var(--background)] font-bold"
                                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
                            )}
                          >
                            <span className="truncate">{item.label}</span>
                            <span
                              className={cn(
                                "text-[9px] uppercase px-1 rounded-[2px] font-normal shrink-0",
                                isSubActive
                                  ? "bg-[var(--background)] text-[var(--foreground)]"
                                  : "bg-[var(--surface-subtle)] text-[var(--muted-foreground)]"
                              )}
                            >
                              {item.category}
                            </span>
                          </NavLink>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2 text-xs font-mono transition-colors",
                  "border-l-2",
                  isActive
                    ? "text-[var(--foreground)] border-[var(--foreground)] bg-[var(--surface-subtle)] font-bold"
                    : "text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
                )
              }
            >
              <Icon size={14} />
              {label.toUpperCase()}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-2 border-t border-[var(--border)] space-y-1">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-mono text-[var(--muted-foreground)] hover:text-[var(--loss)] hover:bg-[var(--loss-bg)] transition-colors cursor-pointer disabled:opacity-50"
        >
          <LogOut size={14} />
          {isLoggingOut ? "LOGOUT..." : "LOGOUT"}
        </button>
      </div>
    </>
  );

  const renderMobileSidebarContent = (
    <>
      <div className="h-13 flex items-center justify-between px-4 border-b border-[var(--border)]">
        <NavLink to="/" className="flex items-center gap-2.5">
          <img
            src="/logo-kinau.png"
            alt={BRAND_NAME}
            className="w-5 h-5 rounded-xs object-cover border border-[var(--border)]"
          />
          <span className="text-sm font-mono font-bold tracking-tight uppercase">
            {BRAND_NAME}
          </span>
        </NavLink>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          aria-label="Tutup menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, hasSubmenu }) => {
          if (hasSubmenu) {
            return (
              <div key={to} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <NavLink
                    to={to}
                    end
                    className={({ isActive }) =>
                      cn(
                        "flex-1 flex items-center gap-2.5 px-3 py-2.5 text-sm font-mono transition-colors",
                        "border-l-2",
                        isActive
                          ? "text-[var(--foreground)] border-[var(--foreground)] bg-[var(--surface-subtle)] font-bold"
                          : "text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
                      )
                    }
                  >
                    <Icon size={16} />
                    <span>{label.toUpperCase()}</span>
                  </NavLink>

                  <button
                    type="button"
                    onClick={() => setAksesMenuOpen((v) => !v)}
                    className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {aksesMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                </div>

                {aksesMenuOpen && (
                  <div className="pl-4 pr-1 py-0.5 space-y-0.5 border-l border-[var(--border)] ml-4 my-1">
                    {accessItems.map((item) => {
                      const targetUrl = `/akses/${item.id}`;
                      const isSubActive = location.pathname === targetUrl;
                      return (
                        <NavLink
                          key={String(item.id)}
                          to={targetUrl}
                          className={cn(
                            "flex items-center justify-between gap-2 px-3 py-2 text-xs font-mono rounded-[2px] transition-colors",
                            isSubActive
                              ? "bg-[var(--foreground)] text-[var(--background)] font-bold"
                              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
                          )}
                        >
                          <span className="truncate">{item.label}</span>
                          <span className="text-[10px] uppercase opacity-70 shrink-0">
                            {item.category}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-3 text-sm font-mono transition-colors",
                  "border-l-2",
                  isActive
                    ? "text-[var(--foreground)] border-[var(--foreground)] bg-[var(--surface-subtle)] font-bold"
                    : "text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
                )
              }
            >
              <Icon size={16} />
              {label.toUpperCase()}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-2 border-t border-[var(--border)] space-y-1">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-2.5 px-3 py-3 text-sm font-mono text-[var(--muted-foreground)] hover:text-[var(--loss)] hover:bg-[var(--loss-bg)] transition-colors cursor-pointer disabled:opacity-50"
        >
          <LogOut size={16} />
          {isLoggingOut ? "LOGOUT..." : "LOGOUT"}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
      {/* ── Desktop sidebar (md+) ── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-[var(--border)] bg-[var(--surface)]">
        {renderSidebarContent}
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[var(--surface)] border-r border-[var(--border)]",
          "transition-transform duration-200 ease-out md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!sidebarOpen}
      >
        {renderMobileSidebarContent}
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between h-13 px-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
          <NavLink to="/" className="flex items-center gap-2.5">
            <img
              src="/logo-kinau.png"
              alt={BRAND_NAME}
              className="w-5 h-5 rounded-xs object-cover border border-[var(--border)]"
            />
            <span className="text-sm font-mono font-bold tracking-tight uppercase">
              {BRAND_NAME}
            </span>
          </NavLink>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            aria-label="Buka menu"
          >
            <Menu size={18} />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>

        {/* Mobile bottom nav */}
        {NAV_ITEMS.length > 0 && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 border-t border-[var(--border)] bg-[var(--surface)] flex items-stretch">
            {NAV_ITEMS.map(({ to, short, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex-1 flex flex-col items-center justify-center gap-0.5 text-[9px] font-mono uppercase tracking-widest transition-colors",
                    isActive
                      ? "text-[var(--foreground)] bg-[var(--surface-subtle)] font-bold"
                      : "text-[var(--muted-foreground)]"
                  )
                }
              >
                <Icon size={16} strokeWidth={2.2} />
                {short}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

export { AppShell };

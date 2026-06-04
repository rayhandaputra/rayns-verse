import { useFetcher, useOutletContext } from "react-router";
import {
  Bell,
  CircleHelp,
  CreditCard,
  Heart,
  LogOut,
  MessageCircle,
  MessageSquareText,
  MoreHorizontal,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import Swal from "sweetalert2";

type CustomerContext = {
  user: {
    fullname?: string;
    email?: string;
    role?: string;
  };
};

const quickActions = [
  { label: "Favorit", icon: Heart },
  { label: "Pesan", icon: MessageCircle },
  { label: "Lainnya", icon: MoreHorizontal },
];

const primaryItems = [
  { label: "Masukan", icon: MessageSquareText },
  { label: "Pembayaran", icon: CreditCard },
  { label: "Ulasan", icon: MessageCircle, active: true },
  { label: "Pesanan", icon: Package },
];

function initials(name?: string) {
  const source = name?.trim() || "Pelanggan Kinau";

  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ProfileMenuCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[22px] border border-[var(--customer-border)] bg-white px-3 py-3 shadow-[0_18px_45px_rgba(30,67,76,0.06)]">
      {children}
    </section>
  );
}

function ProfileMenuRow({
  label,
  icon: Icon,
  active,
  danger,
  trailing,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  danger?: boolean;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left transition",
        active ? "bg-[var(--customer-bg)]" : "hover:bg-[var(--customer-card-hover)]",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
          danger
            ? "bg-red-50 text-red-500"
            : active
              ? "bg-white text-[var(--customer-accent)]"
              : "bg-[var(--customer-bg)] text-[var(--customer-text-muted)]",
        ].join(" ")}
      >
        <Icon size={16} strokeWidth={2.3} />
      </span>
      <span
        className={[
          "min-w-0 flex-1 text-xs font-black",
          danger
            ? "text-red-500"
            : active
              ? "text-[var(--customer-primary)]"
              : "text-[var(--customer-text-muted)]",
        ].join(" ")}
      >
        {label}
      </span>
      {trailing}
    </button>
  );
}

function NotificationSwitch() {
  return (
    <span className="relative h-4 w-8 rounded-full bg-[var(--customer-primary)]">
      <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm" />
    </span>
  );
}

export default function CustomerProfile() {
  const { user } = useOutletContext<CustomerContext>();
  const fetcher = useFetcher();
  const displayName = user.fullname || "Pelanggan Kinau";

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
    <div className="pb-4">
      <section className="pt-3 text-center">
        <div className="mx-auto grid h-[72px] w-[72px] place-items-center rounded-full bg-[linear-gradient(135deg,var(--customer-accent),var(--customer-primary))] p-1 shadow-[0_18px_38px_rgba(0,151,178,0.22)]">
          <div className="grid h-full w-full place-items-center rounded-full border-[3px] border-white bg-[var(--customer-bg)] text-lg font-black text-[var(--customer-primary)]">
            {initials(displayName)}
          </div>
        </div>
        <h1 className="mt-3 truncate text-base font-black text-[var(--customer-primary)]">
          {displayName}
        </h1>
        <p className="mt-1 truncate text-[10px] font-semibold text-[var(--customer-text-light)]">
          {user.email || "Email belum tersedia"}
        </p>
      </section>

      <div className="mt-6 border-t border-dashed border-[var(--customer-border)] pt-5">
        <div className="mx-auto flex w-fit items-center gap-4 rounded-full bg-white px-5 py-2 shadow-[0_14px_35px_rgba(30,67,76,0.06)] ring-1 ring-[var(--customer-border)]">
          {quickActions.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full text-[var(--customer-text-muted)] transition hover:bg-[var(--customer-card-hover)] hover:text-[var(--customer-accent)]"
                aria-label={item.label}
              >
                <Icon size={16} strokeWidth={2.2} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <ProfileMenuCard>
          <div className="space-y-1">
            {primaryItems.map((item) => (
              <ProfileMenuRow key={item.label} {...item} />
            ))}
          </div>
        </ProfileMenuCard>

        <ProfileMenuCard>
          <div className="space-y-1">
            <ProfileMenuRow label="Pusat Bantuan" icon={CircleHelp} />
            <ProfileMenuRow
              label="Notifikasi"
              icon={Bell}
              trailing={<NotificationSwitch />}
            />
            <ProfileMenuRow
              label="Keluar"
              icon={LogOut}
              danger
              onClick={handleLogout}
            />
          </div>
        </ProfileMenuCard>
      </div>
    </div>
  );
}

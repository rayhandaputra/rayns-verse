import { Link, useOutletContext } from "react-router";
import {
  ArrowUpRight,
  BadgeCheck,
  CreditCard,
  IdCard,
  Layers,
  PackageCheck,
  Palette,
  Printer,
  QrCode,
  Shirt,
  Sparkles,
} from "lucide-react";

type CustomerContext = {
  user: {
    fullname?: string;
    email?: string;
  };
};

const services = [
  { label: "Kartu ID", icon: IdCard },
  { label: "Lanyard", icon: BadgeCheck },
  { label: "Kartu PVC", icon: CreditCard },
  { label: "Twibbon", icon: QrCode },
  { label: "Kaos", icon: Shirt },
  { label: "Kustom", icon: Palette },
];

const products = [
  {
    title: "Paket Kartu ID Instansi",
    tag: "Kartu ID",
    image: "/katalog/0.png",
    caption: "Kartu pegawai, kartu panitia, dan kebutuhan acara.",
    cta: "Mulai dari 1 buah",
  },
  {
    title: "Lanyard Kustom Unggulan",
    tag: "Lanyard",
    image: "/katalog/1.png",
    caption: "Tali identitas dengan desain, warna, dan finishing rapi.",
    cta: "Bisa satuan",
  },
  {
    title: "Kaos Komunitas dan Acara",
    tag: "Pakaian",
    image: "/katalog/2.png",
    caption: "Produksi kaos untuk komunitas, sekolah, dan kampus.",
    cta: "Warna kustom",
  },
];

const firstName = (name?: string) => {
  if (!name) return "Pelanggan";
  return name.trim().split(/\s+/)[0] || "Pelanggan";
};

export default function CustomerDashboard() {
  const { user } = useOutletContext<CustomerContext>();

  return (
    <div className="space-y-6 pb-2">
      <section className="relative min-h-[214px] overflow-hidden rounded-[30px] bg-[var(--customer-primary)] text-white shadow-2xl shadow-[rgba(30,67,76,0.18)]">
        <img
          src="/bg-catur-png.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(30,67,76,0.96),rgba(0,151,178,0.72),rgba(255,255,255,0.18))]" />
        <div className="relative z-10 flex min-h-[214px] flex-col justify-between p-5">
          <div className="pt-4 text-center">
            <p className="text-[10px] font-bold text-white/75">Selamat Datang</p>
            <h2 className="mt-1 text-2xl font-black leading-none">
              {firstName(user.fullname)}
            </h2>
          </div>

          <div className="rounded-[24px] border border-white/20 bg-white/92 p-3 text-[var(--customer-text)] shadow-2xl shadow-black/15 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--customer-accent)] text-white shadow-lg shadow-[rgba(0,151,178,0.25)]">
                  <Printer size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-[var(--customer-primary)]">
                    Pesan cetak sekarang
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-[var(--customer-text-muted)]">
                    Kartu ID, lanyard, kaos, dan kebutuhan acara.
                  </p>
                </div>
              </div>
              <Link
                to="/customer/configure"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--customer-primary)] text-white shadow-lg shadow-[rgba(30,67,76,0.22)] transition hover:bg-[var(--customer-primary-hover)]"
                aria-label="Pesan sekarang"
              >
                <ArrowUpRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--customer-border)] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-[var(--customer-primary)]">
              3 Rekomendasi Paket Cetak
            </h3>
            <p className="mt-1 text-xs leading-5 text-[var(--customer-text-muted)]">
              Pilih layanan paling sering dipesan, lalu lanjutkan ke konfigurasi.
            </p>
          </div>
          <Sparkles className="mt-1 shrink-0 text-[var(--customer-accent)]" size={20} />
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--customer-text-light)]">
              Estimasi mulai
            </p>
            <p className="mt-1 text-lg font-black text-[var(--customer-primary)]">
              Rp2.500
            </p>
          </div>
          <Link
            to="/customer/configure"
            className="rounded-full bg-[var(--customer-primary)] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-[rgba(30,67,76,0.18)] transition hover:bg-[var(--customer-primary-hover)]"
          >
            Pesan
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-black text-[var(--customer-primary)]">
            Layanan
          </h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--customer-accent)]">
            Cetak
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <Link
                key={service.label}
                to="/customer/configure"
                className="flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--customer-border)] bg-white px-2 text-center shadow-sm transition hover:border-[var(--customer-border-active)] hover:bg-[var(--customer-card-hover)]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--customer-accent-light)] text-[var(--customer-accent)]">
                  <Icon size={16} />
                </span>
                <span className="text-[10px] font-black text-[var(--customer-primary)]">
                  {service.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-black text-[var(--customer-primary)]">
            Produk
          </h3>
          <Link
            to="/katalog"
            className="text-[10px] font-black uppercase tracking-widest text-[var(--customer-accent)]"
          >
            Lihat katalog
          </Link>
        </div>
        <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product) => (
            <article
              key={product.title}
              className="w-[270px] shrink-0 snap-center overflow-hidden rounded-[26px] border border-[var(--customer-border)] bg-white shadow-sm"
            >
              <div className="relative h-32 overflow-hidden bg-[var(--customer-card-hover)]">
                <img
                  src={product.image}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-[var(--customer-primary)]/88 px-3 py-1 text-[10px] font-black text-white backdrop-blur">
                  {product.tag}
                </span>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-black leading-5 text-[var(--customer-primary)]">
                  {product.title}
                </h4>
                <p className="mt-2 min-h-10 text-xs leading-5 text-[var(--customer-text-muted)]">
                  {product.caption}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-[var(--customer-accent)]">
                    <PackageCheck size={14} /> {product.cta}
                  </span>
                  <Link
                    to="/customer/configure"
                    className="grid h-10 w-10 place-items-center rounded-full bg-[var(--customer-accent)] text-white shadow-lg shadow-[rgba(0,151,178,0.22)] transition hover:bg-[var(--customer-accent-hover)]"
                    aria-label={`Pesan ${product.title}`}
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-1 flex justify-center gap-1.5">
          <span className="h-1.5 w-5 rounded-full bg-[var(--customer-accent)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--customer-border)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--customer-border)]" />
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--customer-border)] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--customer-primary-light)] text-[var(--customer-primary)]">
            <Layers size={19} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-[var(--customer-primary)]">
              Butuh produk lain?
            </p>
            <p className="truncate text-xs text-[var(--customer-text-muted)]">
              Template dan layanan baru bisa ditambahkan bertahap.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

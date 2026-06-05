import { Link } from "react-router";
import { ArrowUpRight, IdCard, ShieldCheck, Sparkles, Zap } from "lucide-react";

type HeroCampaignProps = {
  fullname?: string;
};

const firstName = (name?: string) => {
  if (!name) return "Pelanggan";
  return name.trim().split(/\s+/)[0] || "Pelanggan";
};

const trustBadges = [
  { icon: Zap, label: "Proses cepat" },
  { icon: ShieldCheck, label: "Kualitas terjamin" },
];

export default function HeroCampaign({ fullname }: HeroCampaignProps) {
  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[var(--customer-primary)] text-white shadow-2xl shadow-[rgba(30,67,76,0.18)]">
      {/* Layer dekoratif — fokus visual mengarah ke CTA */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#1E434C,#35606B)]" />
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[var(--customer-accent)]/25 blur-2xl" />
      <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <IdCard
        className="absolute -right-4 top-1/2 h-36 w-36 -translate-y-1/2 rotate-12 text-white/10"
        strokeWidth={1}
      />

      <div className="relative z-10 p-5 pt-6">
        {/* Personalisasi — sapaan nama membangun rasa memiliki */}
        <p className="text-[11px] font-bold text-white/70">
          Hai, {firstName(fullname)} 👋
        </p>

        {/* Pesan kampanye — headline besar, satu fokus */}
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-md">
          <Sparkles size={12} className="text-[var(--customer-accent)]" />
          <span className="text-[9px] font-black uppercase tracking-widest text-white/90">
            Identitas profesionalmu
          </span>
        </div>
        <h2 className="mt-2 text-[26px] font-black leading-tight">
          Buat ID Card kamu
          <span className="block text-[var(--customer-accent)]">sekarang</span>
        </h2>
        <p className="mt-2 max-w-[260px] text-xs leading-5 text-white/75">
          Desain bebas, mulai dari 1 buah. Selesai dalam hitungan hari.
        </p>

        {/* Social proof ringan — mengurangi keraguan sebelum aksi */}
        <div className="mt-4 flex items-center gap-3">
          {trustBadges.map((badge) => {
            const Icon = badge.icon;

            return (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/80"
              >
                <Icon size={13} className="text-[var(--customer-accent)]" />
                {badge.label}
              </span>
            );
          })}
        </div>

        {/* CTA tunggal — kontras tinggi, target sentuh besar */}
        <Link
          to="/customer/configure"
          className="mt-5 flex items-center justify-between gap-3 rounded-[22px] bg-[var(--customer-accent)] p-4 shadow-xl shadow-[rgba(0,151,178,0.35)] transition hover:bg-[var(--customer-accent-hover)] active:scale-[0.98]"
        >
          <span className="text-sm font-black text-white">
            Mulai Buat ID Card
          </span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 text-white">
            <ArrowUpRight size={18} />
          </span>
        </Link>
      </div>
    </section>
  );
}

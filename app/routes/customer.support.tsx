export default function CustomerSupport() {
  return (
    <section className="rounded-[28px] border border-[var(--customer-border)] bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--customer-accent)]">
        Bantuan
      </p>
      <h2 className="mt-2 text-xl font-black text-[var(--customer-primary)]">
        Pusat bantuan customer
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--customer-text-muted)]">
        Area ini disiapkan untuk kontak admin, panduan order, dan status layanan.
      </p>
    </section>
  );
}

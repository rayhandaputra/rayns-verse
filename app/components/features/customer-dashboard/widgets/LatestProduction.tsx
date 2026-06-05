import { CalendarDays, Camera, ShoppingBag } from "lucide-react";
import { formatFullDate } from "~/constants";
import { safeParseArray } from "~/utils/utils";

type LatestProductionProps = {
  items: any[];
};

const totalQty = (orderItems: unknown) =>
  safeParseArray<{ qty?: number | string }>(orderItems).reduce(
    (acc, item) => acc + (Number(item.qty) || 0),
    0
  );

export default function LatestProduction({ items }: LatestProductionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-black text-[var(--customer-primary)]">
          Produksi Terbaru
        </h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--customer-accent)]">
          Selesai
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[26px] border border-dashed border-[var(--customer-border)] bg-white py-10 text-center">
          <Camera size={28} className="text-[var(--customer-text-light)]" />
          <p className="text-xs font-semibold text-[var(--customer-text-muted)]">
            Belum ada dokumentasi produksi.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const images = safeParseArray<string>(item.images);
            const cover = images[0] || null;
            const qty = totalQty(item.order_items);

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-[26px] border border-[var(--customer-border)] bg-white shadow-sm"
              >
                {cover && (
                  <div className="relative h-40 overflow-hidden bg-[var(--customer-card-hover)]">
                    <img
                      src={cover}
                      alt={item.institution_name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(30,67,76,0.55)] to-transparent" />
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black text-white backdrop-blur">
                      <CalendarDays size={12} />
                      {formatFullDate(item.created_on)}
                    </span>
                  </div>
                )}
                <div className="p-4">
                  <h4 className="line-clamp-1 text-sm font-black text-[var(--customer-primary)]">
                    {item.institution_name || "Pelanggan Kinau"}
                  </h4>
                  <div className="mt-1.5 flex items-center gap-2 text-[var(--customer-accent)]">
                    <ShoppingBag size={13} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {qty > 0 ? `${qty} Pcs` : "Produksi selesai"}
                    </span>
                  </div>
                  {item.review && (
                    <p className="mt-2 line-clamp-2 text-xs italic leading-5 text-[var(--customer-text-muted)]">
                      &quot;{item.review}&quot;
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

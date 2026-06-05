import { Link } from "react-router";
import { ArrowUpRight, PackageOpen } from "lucide-react";
import { formatCurrency } from "~/utils/utils";

type ProductListProps = {
  products: any[];
};

export default function ProductList({ products }: ProductListProps) {
  return (
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

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[26px] border border-dashed border-[var(--customer-border)] bg-white py-10 text-center">
          <PackageOpen size={28} className="text-[var(--customer-text-light)]" />
          <p className="text-xs font-semibold text-[var(--customer-text-muted)]">
            Belum ada produk ditampilkan.
          </p>
        </div>
      ) : (
        <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product) => (
            <article
              key={product.id}
              className="w-[230px] shrink-0 snap-center overflow-hidden rounded-[26px] border border-[var(--customer-border)] bg-white shadow-sm"
            >
              <div className="relative h-36 overflow-hidden bg-[var(--customer-card-hover)]">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[var(--customer-text-light)]">
                    <PackageOpen size={28} />
                  </div>
                )}
                {product.category_name && (
                  <span className="absolute bottom-3 left-3 rounded-full bg-[var(--customer-primary)]/88 px-3 py-1 text-[10px] font-black text-white backdrop-blur">
                    {product.category_name}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h4 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-[var(--customer-primary)]">
                  {product.name}
                </h4>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--customer-text-light)]">
                      Mulai dari
                    </p>
                    <p className="text-sm font-black text-[var(--customer-accent)]">
                      {formatCurrency(Number(product.total_price) || 0)}
                    </p>
                  </div>
                  <Link
                    to="/customer/configure"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--customer-accent)] text-white shadow-lg shadow-[rgba(0,151,178,0.22)] transition hover:bg-[var(--customer-accent-hover)]"
                    aria-label={`Pesan ${product.name}`}
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

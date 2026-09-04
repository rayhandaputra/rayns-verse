import { isRouteErrorResponse, Link } from "react-router";
import { Home, RefreshCw, Search, TriangleAlert } from "lucide-react";

export interface ErrorBoundaryProps {
  error: unknown;
  /** Nama brand/app — default "Rayeen" */
  brandName?: string;
  /** Path ke halaman beranda — default "/" */
  homePath?: string;
  /** Teks tombol kembali — default "Kembali ke Beranda" */
  backLabel?: string;
  /** Path ke gambar illustration (di folder public). Jika tidak diisi, hanya ikon. */
  illustration?: string;
  /** Path gambar untuk kasus 404 (jika beda dari error generic). */
  illustration404?: string;
  /** Arah pembacaan tombol aksi — "retry" menampilkan tombol reload. */
  showRetry?: boolean;
}

/**
 * Error boundary yang ramah pengguna untuk semua app di rayeen monorepo.
 *
 * - 404 (Page Not Found) → illustration + pesan jelas "halaman tidak ditemukan".
 * - Error lain → pesan kalem, tidak menampilkan stack crash developer.
 * - Stack error hanya tampil di mode development untuk memudahkan debugging,
 *   TIDAK pernah tampil di production (agar user tidak panik).
 */
export function ErrorBoundary({
  error,
  brandName = "Rayeen",
  homePath = "/",
  backLabel = "Kembali ke Beranda",
  illustration,
  illustration404,
  showRetry = true,
}: ErrorBoundaryProps) {
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const isError = isRouteErrorResponse(error);
  const statusCode = isError ? error.status : 500;

  const heading = is404 ? "404" : isError ? String(statusCode) : "Oops!";
  const title = is404
    ? "Halaman Tidak Ditemukan"
    : isError
      ? "Terjadi Kesalahan"
      : "Terjadi Kesalahan";
  const message = is404
    ? `Sepertinya halaman yang kamu cari di ${brandName} tidak ada atau sudah dipindahkan.`
    : "Ada yang tidak beres di sisi kami. Tim kami sudah mendapat laporan dan sedang memperbaikinya. Silakan coba lagi dalam beberapa saat.";

  const imgSrc = is404 ? (illustration404 ?? illustration) : illustration;

  // Stack hanya untuk development — jangan pernah tampilkan ke user production.
  const showStack =
    import.meta.env.DEV && !isRouteErrorResponse(error) && error instanceof Error;
  const stack = showStack ? error.stack : undefined;
  const devDetails =
    import.meta.env.DEV && isRouteErrorResponse(error) ? error.statusText : undefined;

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 bg-[var(--background)] text-[var(--foreground)]">
      <div className="text-center space-y-5 max-w-md py-12">
        {/* Illustration */}
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={is404 ? "Ilustrasi halaman tidak ditemukan" : "Ilustrasi kesalahan"}
            className="w-48 h-48 md:w-56 md:h-56 mx-auto object-contain opacity-90"
          />
        ) : (
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-center">
            <TriangleAlert size={28} className="text-[var(--muted-foreground)]" />
          </div>
        )}

        {/* Status + title */}
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted-foreground)]">
            {heading} · {brandName}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>

        {/* Message */}
        <p className="text-sm leading-relaxed text-[var(--muted)]">{message}</p>

        {/* Dev-only detail */}
        {(devDetails || stack) && (
          <div className="text-left space-y-2">
            {devDetails && (
              <p className="text-xs font-mono text-[var(--muted-foreground)]">{devDetails}</p>
            )}
            {stack && (
              <pre className="text-[10px] font-mono overflow-auto max-h-40 p-3 rounded-[var(--radius-card-sm)] bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--muted)]">
                {stack}
              </pre>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {showRetry && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-card-sm)] bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity cursor-pointer"
            >
              <RefreshCw size={14} /> Coba Lagi
            </button>
          )}
          <Link
            to={homePath}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--border-strong)] rounded-[var(--radius-card-sm)] hover:border-[var(--foreground)] transition-colors"
          >
            <Home size={14} /> {backLabel}
          </Link>
          {is404 && (
            <Link
              to={homePath}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <Search size={14} /> Cari di Beranda
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "~/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

function ErrorState({
  title = "Gagal memuat data",
  message = "Terjadi kendala koneksi. Silakan coba lagi.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-10 text-center",
        "border border-[var(--border)] bg-[var(--card)] rounded-[var(--radius-card)]",
        className
      )}
    >
      <div className="w-10 h-10 flex items-center justify-center border border-[var(--loss)]/40 bg-[var(--loss-bg)]">
        <AlertTriangle size={18} className="text-[var(--loss)]" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-mono font-bold text-[var(--foreground)]">{title}</p>
        <p className="text-xs text-[var(--muted-foreground)] max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold border border-[var(--border-strong)] hover:border-[var(--foreground)] transition-colors cursor-pointer"
        >
          <RefreshCw size={13} /> COBA LAGI
        </button>
      )}
    </div>
  );
}

export { ErrorState };

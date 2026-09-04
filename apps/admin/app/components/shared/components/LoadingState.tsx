import { cn } from "~/lib/utils";

interface LoadingStateProps {
  rows?: number;
  className?: string;
}

function LoadingState({ rows = 3, className }: LoadingStateProps) {
  return (
    <div className={cn("space-y-2", className)} aria-busy="true" aria-label="Memuat data">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 border border-[var(--border)] rounded-[2px]"
        >
          <div className="w-8 h-8 bg-[var(--muted)] animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 bg-[var(--muted)] animate-pulse" />
            <div className="h-2.5 w-1/2 bg-[var(--muted)] animate-pulse" />
          </div>
          <div className="h-4 w-16 bg-[var(--muted)] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export { LoadingState };

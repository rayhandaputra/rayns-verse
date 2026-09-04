import { cn } from "~/lib/utils";

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={cn("h-3 bg-[var(--muted)] animate-pulse", className)} />
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("bg-[var(--muted)] animate-pulse rounded-[2px]", className)} />
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 h-13 flex items-center justify-between px-6 border-b border-[var(--border)]">
        <SkeletonLine className="w-24 h-4" />
        <SkeletonLine className="w-16 h-6" />
      </div>

      <div className="flex-1 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <SkeletonLine className="w-32 h-4" />
          <SkeletonLine className="w-20 h-5" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-20" />
          ))}
        </div>

        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBlock className="w-3 h-3" />
              <SkeletonLine className="flex-1 h-3" />
              <SkeletonLine className="w-12 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { PageSkeleton, SkeletonLine, SkeletonBlock };

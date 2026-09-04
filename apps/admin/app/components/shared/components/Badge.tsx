import type { ComponentPropsWithoutRef } from "react";
import { cn } from "~/lib/utils";

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  tone?: "default" | "profit" | "loss" | "neutral";
}

function Badge({ tone = "default", className, ...props }: BadgeProps) {
  const tones = {
    default:
      "bg-[var(--surface-subtle)] text-[var(--foreground)] border-[var(--border-strong)]",
    profit:
      "bg-[var(--profit-bg)] text-[var(--profit)] border-[var(--profit)]/40",
    loss:
      "bg-[var(--loss-bg)] text-[var(--loss)] border-[var(--loss)]/40",
    neutral:
      "bg-[var(--surface-subtle)] text-[var(--muted-foreground)] border-[var(--border)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wide",
        "border rounded-[2px]",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps };

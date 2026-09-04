import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const variants = {
      primary:
        "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90",
      secondary:
        "bg-transparent text-[var(--foreground)] border border-[var(--border-strong)] hover:border-[var(--foreground)]",
      ghost:
        "bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]",
      danger:
        "bg-transparent text-[var(--loss)] border border-[var(--loss)] hover:bg-[var(--loss-bg)]",
    };
    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-11 px-5 text-sm gap-2",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium font-mono",
          "rounded-[var(--radius-card-sm)]",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--foreground)]",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "cursor-pointer select-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };

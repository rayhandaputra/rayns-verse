import type { ComponentPropsWithoutRef } from "react";
import { cn } from "~/lib/utils";

function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-card)]",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-[var(--border)]",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className={cn(
        "text-[11px] font-mono font-semibold uppercase tracking-widest text-[var(--muted-foreground)]",
        className
      )}
      {...props}
    />
  );
}

function CardBody({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("p-4", className)} {...props} />;
}

function CardFooter({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-t border-[var(--border)]",
        className
      )}
      {...props}
    />
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Body = CardBody;
Card.Footer = CardFooter;

export { Card };

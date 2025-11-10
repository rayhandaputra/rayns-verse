import React, { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { cn } from "~/lib/utils";
import type { ReactNode } from "react";

export interface PopoverMenuItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  destructive?: boolean;
}

export interface PopoverMenuProps {
  open: boolean;
  onClose: () => void;
  items: PopoverMenuItem[];
  className?: string;
}

export function PopoverMenu({
  open,
  onClose,
  items,
  className,
}: PopoverMenuProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // ✅ Auto-close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!open) return;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={popoverRef}
      className={cn(
        "absolute top-4 right-4 w-48 bg-white rounded-2xl shadow-lg border border-gray-200 p-2 z-50 flex flex-col gap-1",
        className
      )}
    >
      {items.map((item, idx) => (
        <Button
          key={idx}
          variant="ghost"
          onClick={item.onClick}
          className={cn(
            "justify-start gap-2 rounded-xl",
            item.destructive &&
              "text-red-600 hover:bg-red-50 hover:text-red-700"
          )}
        >
          {item.icon}
          {item.label}
        </Button>
      ))}
    </div>
  );
}

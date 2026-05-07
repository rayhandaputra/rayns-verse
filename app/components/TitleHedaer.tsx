// components/TitleHeader.tsx
"use client";

import * as React from "react";
import { cn } from "~/lib/utils";

type TitleHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function TitleHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: TitleHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 pb-4", className)}>
      {breadcrumb && <div>{breadcrumb}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}

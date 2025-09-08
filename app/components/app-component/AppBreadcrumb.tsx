// components/AppBreadcrumb.tsx
"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "~/components/ui/breadcrumb";
import { Home } from "lucide-react";

type Page = {
  label: string;
  href?: string;
  active?: boolean;
};

type AppBreadcrumbProps = {
  pages: Page[];
  className?: string;
  showHomeIcon?: boolean; // default true
};

export function AppBreadcrumb({
  pages,
  className,
  showHomeIcon = true,
}: AppBreadcrumbProps) {
  const shouldCollapse = pages.length > 3;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {pages.map((page, index) => {
          const isFirst = index === 0 && showHomeIcon;

          // Jika panjang lebih dari 3 dan ini index kedua (1), maka tampilkan ...
          if (shouldCollapse && index === 1 && index < pages.length - 2) {
            return (
              <React.Fragment key={`ellipsis-${index}`}>
                <BreadcrumbItem>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </React.Fragment>
            );
          }

          // Jika sedang dalam mode collapsed, skip semua item di tengah (selain first & last)
          if (shouldCollapse && index > 1 && index < pages.length - 1) {
            return null;
          }

          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {page.active ? (
                  <BreadcrumbPage className="text-blue-800">
                    {isFirst && <Home className="mr-3 h-4 w-4 inline" />}
                    {page.label}
                  </BreadcrumbPage>
                ) : page.href ? (
                  <BreadcrumbLink href={page.href}>
                    {isFirst && <Home className="mr-3 h-4 w-4 inline" />}
                    {page.label}
                  </BreadcrumbLink>
                ) : (
                  <span>
                    {isFirst && <Home className="mr-3 h-4 w-4 inline" />}
                    {page.label}
                  </span>
                )}
              </BreadcrumbItem>
              {index < pages.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

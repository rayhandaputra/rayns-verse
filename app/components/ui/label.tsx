"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "~/lib/utils";

function Label({
  className,
  children,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const isRequired =
    props["aria-required"] === "true" || props["aria-required"] === true;

  return (
    <LabelPrimitive.Root
      data-slot="label"
      {...props}
      className={cn(
        "flex items-center gap-1 text-sm leading-none font-medium select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
    >
      {children}

      {/* ✅ tampilkan bintang merah jika aria-required */}
      {isRequired && (
        <span className="text-red-600 font-bold select-none">*</span>
      )}
    </LabelPrimitive.Root>
  );
}

export { Label };

// import { ReactNode } from "react";
// import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";
import { Card, CardContent } from "../ui/card";

interface DescriptionComponentProps {
  title: string;
  description?: string;
  actionRight?: ReactNode;
  cols?: number;
  data: Record<string, ReactNode | string | number | null | undefined>;
}

export function DescriptionComponent({
  title,
  description,
  actionRight,
  cols = 2,
  data,
}: DescriptionComponentProps) {
  return (
    <Card className="w-full rounded-xl shadow-sm">
      <CardContent className="space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
          {actionRight && <div>{actionRight}</div>}
        </div>

        {/* Data grid */}
        <div className={`grid gap-4 sm:grid-cols-${cols}`}>
          {Object.entries(data).map(([label, value], index) => (
            <div key={index} className="border-b border-b-gray-300 pb-2">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className="text-sm font-semibold text-gray-800">
                {value ?? "-"}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

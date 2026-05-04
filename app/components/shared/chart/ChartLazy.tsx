import { lazy, Suspense, useEffect, useState } from "react";

const ChartWrapper = lazy(() => import("~/components/shared/chart/ChartWrapper"));

export default function ChartLazy(props: any) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (typeof window === "undefined") return null; // Hindari SSR render
  if (!isClient) return null;

  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <ChartWrapper {...props} />
    </Suspense>
  );
}

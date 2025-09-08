import { lazy, Suspense, useEffect, useState } from "react";

const ChartWrapper = lazy(() => import("~/components/Chart/ChartWrapper"));

export default function ChartLazy(props: any) {
  if (typeof window === "undefined") return null; // Hindari SSR render

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <ChartWrapper {...props} />
    </Suspense>
  );
}

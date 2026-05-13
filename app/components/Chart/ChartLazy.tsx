import { lazy, Suspense, useSyncExternalStore } from "react";

const ChartWrapper = lazy(() => import("~/components/Chart/ChartWrapper"));

const subscribe = () => () => { };

export default function ChartLazy(props: any) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  if (!isClient) return null; // Hindari SSR render dan pastikan di client

  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <ChartWrapper {...props} />
    </Suspense>
  );
}

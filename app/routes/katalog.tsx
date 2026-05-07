import React, { useState, useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Client-only component wrapper
const PDFViewerClient = React.lazy(() =>
  import("~/components/PDFViewerClient").then(module => ({ default: module.PDFViewerClient }))
);

export default function KatalogPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="text-violet-500 animate-spin" size={48} />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="text-violet-500 animate-spin" size={48} />
      </div>
    }>
      <PDFViewerClient pdfUrl="./catalog.pdf" />
    </Suspense>
  );
}

"use client";

import { useReactToPrint } from "react-to-print";

export function PrintButton({
  children,
  contentRef,
}: {
  children: (props: { handlePrint: () => void }) => React.ReactNode;
  contentRef: React.RefObject<HTMLDivElement>;
}) {
  const handlePrint = useReactToPrint({
    // Untuk react-to-print v3
    contentRef,
    // Kalau kamu pakai v2, ganti jadi:
    // content: () => contentRef.current,
    documentTitle: "E-Nota Kinau",
    pageStyle: `
      @media print {
        @page {
            size: 170mm 150mm;
            margin: 0mm;
        }
        .page {
            page-break-after: always;
        }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  // Render prop pattern — kirim handlePrint ke parent
  return <>{children({ handlePrint })}</>;
}

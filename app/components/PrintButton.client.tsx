"use client";

import { useReactToPrint } from "react-to-print";
import { ReceiptTemplate } from "./print/order/ReceiptTemplate";
import { useRef, useState } from "react";

export function PrintButton({
  children,
  // contentRef,
}: {
  children: (props: { handlePrint: (data: any) => void }) => React.ReactNode;
  // contentRef: React.RefObject<HTMLDivElement>;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<any>(null);

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

  // fungsi yang bisa dipanggil dari luar
  const prepareAndPrint = (data: any) => {
    setPrintData(data);
    // delay sebentar agar state update sebelum print
    setTimeout(() => handlePrint(), 200);
  };

  // Render prop pattern — kirim handlePrint ke parent
  return (
    <>
      {children({ handlePrint: prepareAndPrint })}
      <div className="hidden">
        <ReceiptTemplate
          ref={contentRef}
          order={printData?.order}
          items={printData?.items || []}
          qrCodeUrl={printData?.qrCodeUrl}
        />
      </div>
    </>
  );
}

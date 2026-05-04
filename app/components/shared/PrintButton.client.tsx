"use client";

import { useReactToPrint } from "react-to-print";
// import { ReceiptTemplate } from "./print/order/ReceiptTemplate";
// import { ReceiptTemplate } from "./print/order/ReceiptTemplate";
import { useRef, useState } from "react";
import { PrintNotaTemplate } from "./print/order/NotaTemplate";

export function PrintButton({
  children,
  // contentRef,
  externalRef,
  label,
  pageStyle,
}: {
  children: (props: { handlePrint: (data: any) => void }) => React.ReactNode;
  // contentRef: React.RefObject<HTMLDivElement>;
  externalRef?: React.RefObject<HTMLDivElement>;
  label?: string;
  pageStyle?: string;
}) {
  // const contentRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLDivElement>(null);
  const contentRef = externalRef || localRef;

  const [printData, setPrintData] = useState<any>(null);

  const handlePrint = useReactToPrint({
    // Untuk react-to-print v3
    contentRef,
    // Kalau kamu pakai v2, ganti jadi:
    // content: () => contentRef.current,
    documentTitle: label || "E-Nota Kinau",
    pageStyle:
      pageStyle ||
      `
      @media print {
        @page {
            /* Mengubah ukuran menjadi A4 */
            size: A4; 
            /* Margin standar untuk A4 biasanya 10mm - 20mm, 
               tapi jika butuh full page, gunakan 0mm */
            margin: 10mm; 
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

  if (externalRef) return children({ handlePrint: prepareAndPrint });

  // Render prop pattern — kirim handlePrint ke parent
  return (
    <>
      {children({ handlePrint: prepareAndPrint })}
      <div className="hidden">
        <PrintNotaTemplate
          ref={contentRef}
          order={printData?.order}
          items={printData?.items || []}
        />
      </div>
    </>
  );
}

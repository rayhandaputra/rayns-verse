"use client";

import { useReactToPrint } from "react-to-print";
import { useRef, useState, useEffect } from "react";
import { PrintNotaTemplate } from "./print/order/NotaTemplate";

// Detect mobile device
const isMobile = () => {
  if (typeof window === "undefined") return false;
  const userAgent = navigator.userAgent || navigator.vendor;
  return /android|ipad|iphone|ipod|windows phone/i.test(userAgent);
};

// Detect iOS Safari
const isIOSSafari = () => {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  // @ts-ignore - MSStream is a Microsoft proprietary property
  return /iPad|iPhone|iPod/.test(ua) && !/(MSIE|Trident|Edge)/.test(ua) && !(window as any).MSStream;
};

// Print method for mobile - opens a new window with the print content
const printMobile = (contentHTML: string, title: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert(
      "Pop-up diblokir! Mohon izinkan pop-up untuk mencetak, atau gunakan desktop version."
    );
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @page {
          size: A4;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        @media screen {
          body {
            padding: 10px;
          }
        }
      </style>
    </head>
    <body>
      ${contentHTML}
      <script>
        // Auto print after content loads (for desktop)
        if (!/android|ipad|iphone|ipod|windows phone/i.test(navigator.userAgent)) {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }, 500);
        }
        // For mobile: show print button
        else {
          window.onload = function() {
            var printBtn = document.createElement('button');
            printBtn.textContent = 'Cetak / Save as PDF';
            printBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 15px 25px; background: #1f2937; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); z-index: 9999;';
            printBtn.onclick = function() {
              window.print();
            };
            document.body.appendChild(printBtn);
          };
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

export function PrintButton({
  children,
}: {
  children: (props: { handlePrint: (data: any) => void }) => React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Desktop print handler using react-to-print
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Nota-${printData?.order?.order_number || "Kinau"}`,
    pageStyle: `
      @media print {
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          margin: 0;
        }
        .no-print {
          display: none !important;
        }
        .bg-gray-50 { background-color: #f9fafb !important; }
        .bg-gray-200 { background-color: #e5e7eb !important; }
        .bg-green-500 { background-color: #22c55e !important; }
        .bg-yellow-500 { background-color: #eab308 !important; }
        .bg-red-500 { background-color: #ef4444 !important; }
        .bg-blue-500 { background-color: #3b82f6 !important; }
        .bg-blue-600 { background-color: #2563eb !important; }
        .text-green-600 { color: #16a34a !important; }
        .text-red-600 { color: #dc2626 !important; }
        .text-green-700 { color: #15803d !important; }
        .text-yellow-700 { color: #a16207 !important; }
        .text-red-700 { color: #b91c1c !important; }
      }
      @media screen and (max-width: 768px) {
        body { font-size: 14px; }
      }
    `,
  });

  // Prepare and print based on device
  const prepareAndPrint = (data: any) => {
    setPrintData(data);

    if (isMobile() || isIOSSafari()) {
      // Mobile: Use new window approach with longer delay for React to render
      setTimeout(() => {
        const contentEl = document.getElementById("print-content");
        if (contentEl) {
          const contentHTML = contentEl.innerHTML;
          if (contentHTML) {
            printMobile(
              contentHTML,
              `Nota-${data.order?.order_number || data.order?.id?.slice(-6) || "Kinau"}`
            );
          }
        }
      }, 300);
    } else {
      // Desktop: Use react-to-print
      setTimeout(() => handlePrint(), 200);
    }
  };

  if (!isClient) {
    return (
      <>
        {children({ handlePrint: () => {} })}
        <button
          disabled
          className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-300 text-gray-600 rounded-lg text-xs font-semibold cursor-not-allowed"
        >
          Loading Print...
        </button>
      </>
    );
  }

  return (
    <>
      {children({ handlePrint: prepareAndPrint })}
      {/* Hidden print content - positioned off-screen but accessible for innerHTML extraction */}
      <div
        id="print-content-wrapper"
        className="fixed top-[-9999px] left-[-9999px] w-full"
        style={{ position: "fixed" }}
      >
        <div id="print-content">
          <PrintNotaTemplate
            ref={contentRef}
            order={printData?.order}
            items={printData?.items || []}
          />
        </div>
      </div>
    </>
  );
}

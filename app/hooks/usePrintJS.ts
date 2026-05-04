// hooks/usePrintJS.ts
import { useEffect, useState } from "react";

export function usePrintJS() {
  const [printJS, setPrintJS] = useState<any>(null);

  useEffect(() => {
    import("print-js").then((mod) => setPrintJS(() => mod.default));
  }, []);

  const printElement = (elementId: string) => {
    if (!printJS) return;

    const element = document.getElementById(elementId);
    if (!element) return;

    // Ambil isi elemen yang akan di-print
    const htmlContent = element.outerHTML;
    printJS({
      // printable: elementId,
      printable: htmlContent,
      // type: "html",
      type: "raw-html",
      showModal: false,
      // targetStyles: ["*"],
      style: `
      @media print {
        @page { 
          size: 80mm auto; 
          margin: 0; 
        }

        html, body {
          width: 80mm;
          margin: 0;
          padding: 0;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        #printable-content {
          width: 80mm;
          padding: 8mm;
          box-sizing: border-box;
        }

        * {
          font-size: 12px !important;
          line-height: 1.4;
        }
        }
      `,
      // style: `
      //   @page {
      //     size: auto;
      //     margin: 0mm; /* hilangkan margin default yg munculin header/footer */
      //   }
      //   body {
      //     margin: 0;
      //   }
      // `,
    });
  };

  return { printElement };
}

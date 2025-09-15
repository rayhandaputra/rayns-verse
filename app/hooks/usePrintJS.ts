// hooks/usePrintJS.ts
import { useEffect, useState } from "react";

export function usePrintJS() {
  const [printJS, setPrintJS] = useState<any>(null);

  useEffect(() => {
    import("print-js").then((mod) => setPrintJS(() => mod.default));
  }, []);

  const printElement = (elementId: string) => {
    if (!printJS) return;
    printJS({
      printable: elementId,
      type: "html",
      targetStyles: ["*"],
      style: `
        @page {
          size: auto;
          margin: 0mm; /* hilangkan margin default yg munculin header/footer */
        }
        body {
          margin: 0;
        }
      `,
    });
  };

  return { printElement };
}

import { renderToBuffer } from "@react-pdf/renderer";
import { NotaPdfTemplate } from "~/components/print/order/NotaTemplateRenderer";
import path from "path";

export async function generateOrderPdfBuffer(order: any, items: any[]) {
  // Di dalam loader
  const logoUrl = path.join(process.cwd(), "public", "kinau-logo.png");
  // Kirim logoUrl ke template
  // renderToBuffer mengonversi komponen React-PDF menjadi Buffer di server
  const buffer = await renderToBuffer(
    <NotaPdfTemplate order={order} items={items} logoPath={logoUrl} />
  );
  return buffer;
}

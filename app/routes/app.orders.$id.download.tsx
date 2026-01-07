import { type LoaderFunctionArgs } from "react-router";
import { API } from "~/lib/api";
import { generateOrderPdfBuffer } from "~/lib/pdf.server";
import { safeParseArray } from "~/lib/utils";

export async function loader({ params }: LoaderFunctionArgs) {
  const orderId = params.id;

  // 1. Ambil data dari database di server
  const getOrder = await API.ORDERS.get({
    session: {},
    req: {
      query: {
        id: orderId,
        size: 1,
      },
    },
  });
  console.log(getOrder);
  const order = getOrder?.items?.[0];

  if (!order) throw new Response("Not Found", { status: 404 });

  // 2. Generate Buffer PDF
  const buffer = await generateOrderPdfBuffer(
    order,
    safeParseArray(order.order_items)
  );

  // 3. Kirim sebagai response file
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Nota-${order.order_number}.pdf"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}

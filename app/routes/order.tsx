import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData } from "react-router";
import { API } from "~/nexus/index.server";
import moment from "moment";
import CustomerOrderFeature from "~/components/features/customer-order/CustomerOrderFeature";

export const loader: LoaderFunction = async () => {
  const [productsRes, ordersRes] = await Promise.all([
    API.PRODUCT.get({
      session: {},
      req: { query: { page: 0, size: 10, show_in_dashboard: 1, pagination: "true" } },
    }),
    API.ORDERS.get({
      session: {},
      req: {
        query: { status: "done", is_portfolio: "1", page: 0, size: 20, pagination: "true" },
      },
    }),
  ]);

  const portfolioItems = (ordersRes.items || []).filter((item: any) => item.is_portfolio);
  const allOrders = ordersRes.items || [];

  return {
    products: productsRes.items || [],
    portfolioItems,
    stats: {
      countFinished: allOrders.length,
      uniqueClients: new Set(allOrders.map((o: any) => o.institution_name)).size,
    },
  };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create_order") {
    const institutionName = formData.get("institution_name") as string;
    const picName = formData.get("pic_name") as string;
    const picPhone = formData.get("pic_phone") as string;
    const memberCount = Number(formData.get("member_count"));
    const paymentType = formData.get("payment_type") as string;
    const paymentProof = formData.get("payment_proof") as string;
    const totalAmount = Number(formData.get("total_amount"));
    const dpAmount = Number(formData.get("dp_amount"));
    const grandTotal = Number(formData.get("grand_total"));
    const frontDesignId = formData.get("front_design_id") as string;
    const lanyardDesignId = formData.get("lanyard_design_id") as string;

    const orderNumber = `ORD${moment().add(7, "hours").format("YYYYMMDDHHmmss")}`;
    const now = moment().add(7, "hours").format("YYYY-MM-DD HH:mm:ss");

    try {
      // Create the order
      const orderResult = await API.ORDERS.create({
        session: {},
        req: {
          body: {
            order_number: orderNumber,
            institution_name: institutionName,
            pic_name: picName,
            pic_phone: picPhone,
            order_type: "package",
            order_date: now,
            status: "pending",
            payment_status: paymentType === "dp" ? "down_payment" : "unpaid",
            payment_proof: paymentProof,
            total_amount: totalAmount,
            dp_amount: dpAmount,
            grand_total: grandTotal,
            subtotal: totalAmount,
          },
        },
      });

      return Response.json({
        success: true,
        order_number: orderNumber,
        message: "Pesanan berhasil dibuat",
      });
    } catch (error: any) {
      return Response.json({
        success: false,
        message: error.message || "Gagal membuat pesanan",
      });
    }
  }

  return Response.json({ success: false, message: "Unknown intent" });
};

export default function OrderPage() {
  const { products, portfolioItems, stats } = useLoaderData<{
    products: any[];
    portfolioItems: any[];
    stats: { countFinished: number; uniqueClients: number };
  }>();

  return (
    <CustomerOrderFeature
      products={products}
      portfolioItems={portfolioItems}
      stats={stats}
    />
  );
}

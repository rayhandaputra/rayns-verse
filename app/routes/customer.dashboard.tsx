import { useLoaderData, useOutletContext } from "react-router";
import { API } from "~/nexus";
import CustomerDashboardFeature from "~/components/features/customer-dashboard/CustomerDashboardFeature";

type CustomerContext = {
  user: {
    fullname?: string;
    email?: string;
  };
};

export async function loader() {
  // Produk yang tampil di dashboard + produksi terbaru (portfolio selesai)
  const [productsRes, ordersRes] = await Promise.all([
    API.PRODUCT.get({
      req: {
        query: { page: 0, size: 10, show_in_dashboard: 1 },
      },
    }),
    API.ORDERS.get({
      req: {
        query: {
          status: "done",
          is_portfolio: "1",
          page: 0,
          size: 6,
          pagination: "true",
        },
      },
    }),
  ]);

  return {
    products: productsRes?.items || [],
    productionItems: ordersRes?.items || [],
  };
}

export default function CustomerDashboard() {
  const { user } = useOutletContext<CustomerContext>();
  const { products, productionItems } = useLoaderData<typeof loader>();

  return (
    <CustomerDashboardFeature
      user={user}
      products={products}
      productionItems={productionItems}
    />
  );
}

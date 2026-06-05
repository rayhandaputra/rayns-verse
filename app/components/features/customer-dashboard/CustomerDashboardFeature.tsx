import HeroCampaign from "./widgets/HeroCampaign";
import ProductList from "./widgets/ProductList";
import LatestProduction from "./widgets/LatestProduction";

type CustomerDashboardFeatureProps = {
  user: {
    fullname?: string;
    email?: string;
  };
  products: any[];
  productionItems: any[];
};

export default function CustomerDashboardFeature({
  user,
  products,
  productionItems,
}: CustomerDashboardFeatureProps) {
  return (
    <div className="space-y-6 pb-2">
      <HeroCampaign fullname={user.fullname} />
      <ProductList products={products} />
      <LatestProduction items={productionItems} />
    </div>
  );
}

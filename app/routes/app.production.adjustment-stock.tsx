import { AppBreadcrumb } from "~/components/app-component/AppBreadcrumb";
import { TitleHeader } from "~/components/TitleHedaer";

const StockAdjustment = () => {
  return (
    <div className="space-y-3">
      <TitleHeader
        title="Penyesuaian Stok"
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Produksi", href: "/" },
              { label: "Penyesuaian Stock", active: true },
            ]}
          />
        }
      />
      <div className="w-full flex justify-center">
        <div className="flex flex-col gap-4">
          <img src="/under-construction.svg" width={250} alt="icon" />
          <p className="text-lg font-semibold text-center text-gray-500">
            Dalam pengembangan
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustment;

import { AppBreadcrumb } from "~/components/core/AppBreadcrumb";
import { TitleHeader } from "~/components/core/TitleHeader";

const StockAdjustment = () => {
  return (
    <div className="space-y-3">
      <TitleHeader
        title="Retur / Rusak"
        breadcrumb={
          <AppBreadcrumb
            pages={[
              { label: "Produksi", href: "/" },
              { label: "Retur / Rusal", active: true },
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

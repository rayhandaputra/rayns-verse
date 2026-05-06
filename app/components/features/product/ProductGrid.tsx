import { Eye, PenLine, Trash2 } from "lucide-react";
import ProductCard from "~/components/shared/card/ProductCard";
import { PopoverMenu } from "~/components/shared/popover/PopoverMenu";
import { toMoney } from "~/utils/utils";

interface ProductGridProps {
  products: any[];
  modal: any;
  setModal: (modal: any) => void;
  handleDelete: (data: any) => void;
}

export default function ProductGrid({
  products,
  modal,
  setModal,
  handleDelete,
}: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-400 font-medium">Belum ada produk.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((p: any) => (
        <div key={p.id} className="relative group">
          <ProductCard
            id={p.id}
            name={p.name}
            sku={p.code}
            image={p.image}
            status={p.status}
            price={`Rp ${toMoney(p?.total_price || 0)}`}
            fee={`${toMoney(p?.tax_fee || 0)}%`}
            discount={`Rp ${toMoney(p?.other_fee || 0)}`}
            component={p.total_components}
            onMenuClick={() => {
              setModal({
                ...modal,
                open: modal?.key !== `${p?.code}-open-detail`,
                key: modal?.key !== `${p?.code}-open-detail` ? `${p?.code}-open-detail` : "",
                data: p,
              });
            }}
          />
          <PopoverMenu
            open={modal?.open && modal?.key === `${p.code}-open-detail`}
            onClose={() => setModal({ ...modal, open: false, key: "" })}
            items={[
              {
                label: "Detail",
                icon: <Eye className="w-4 h-4" />,
                onClick: () => console.log("detail"),
              },
              {
                label: "Edit",
                icon: <PenLine className="w-4 h-4" />,
                onClick: () =>
                  setModal({
                    ...modal,
                    open: true,
                    key: "create",
                    data: p,
                  }),
              },
              {
                label: "Delete",
                icon: <Trash2 className="w-4 h-4" />,
                destructive: true,
                onClick: () => handleDelete(p),
              },
            ]}
          />
        </div>
      ))}
    </div>
  );
}

import React, { useEffect } from "react";
import { useParams, useNavigate, useFetcher } from "react-router";
import OrderFormComponent from "~/components/features/order/EditOrderForm";
import ModalShell from "~/components/modal/ModalShell";
import { useFetcherData } from "~/hooks";
import { nexus } from "~/nexus/nexus-client";
import { safeParseArray } from "~/utils/utils";
import { toast } from "sonner";

export default function OrderEditFeature() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const fetcher = useFetcher();

  const { data: orders } = useFetcherData({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({
        id: params?.id,
        size: 1,
        pagination: "true",
      })
      .build(),
  });
  const detail = orders?.data?.items?.[0] || {};

  const { data: products } = useFetcherData({
    endpoint: nexus()
      .module("PRODUCT")
      .action("get")
      .params({
        id: [
          ...new Set(
            safeParseArray(detail?.order_items)?.map(
              (item: any) => item.product_id
            )
          ),
        ].join(","),
        size: 100,
        pagination: "true",
      })
      .build(),
  });

  useEffect(() => {
    if (fetcher.data?.success) {
      navigate("/app/order-list", {
        state: {
          message: fetcher.data.message || "Pesanan berhasil diperbarui",
        },
      });
    } else if (fetcher.data?.success === false) {
      toast.error(fetcher.data.message);
    }
  }, [fetcher.data, navigate]);

  return (
    <div>
      <ModalShell
        open={true}
        onClose={() => {
          navigate(`/app/order-list`);
        }}
        title="Edit Pesanan"
        size="7xl"
      >
        <OrderFormComponent
          key={detail?.id}
          order={detail}
          products={products?.data?.items || []}
          onSubmit={(data) => {
            fetcher.submit(
              { intent: "update_order", data: JSON.stringify(data) },
              { method: "post" }
            );
          }}
        />
      </ModalShell>
    </div>
  );
}

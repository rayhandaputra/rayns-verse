import moment from "moment";
import { useParams, type ActionFunction } from "react-router";
import { useNavigate, useFetcher } from "react-router";
import OrderFormComponent from "~/components/EditOrderFormComponent";
import ModalSecond from "~/components/modal/ModalSecond";
import { useFetcherData } from "~/hooks";
import { API } from "~/lib/api";
import { nexus } from "~/lib/nexus-client";
import { requireAuth } from "~/lib/session.server";
import { safeParseArray, safeParseObject } from "~/lib/utils";
import { toast } from "sonner";
import { useEffect } from "react";

export const action: ActionFunction = async ({ request, params }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update_order") {
    try {
      const rawData = formData.get("data") as string;
      const payload: any = safeParseObject(rawData);

      // Map payload to backend expectation
      const finalPayload = {
        id: params.id,
        order_number: payload.order_number,
        institution_id: payload.institution_id,
        institution_name: payload.institution_name,
        institution_domain: payload.institution_domain,
        pic_name: payload.pic_name,
        pic_phone: payload.pic_phone,
        deadline: payload.deadline,
        payment_status: payload.payment_status,
        ...(payload?.dp_amount > 0 && { dp_amount: payload?.dp_amount }),
        total_amount: payload.total_amount,
        is_sponsor: payload?.is_sponsor ? 1 : 0,
        is_kkn: payload?.is_kkn ? 1 : 0,
        ...(+payload?.is_kkn && {
          kkn_source: "kkn_itera",
          kkn_type: payload?.kkn_type || "PPM",
          kkn_period: +payload?.kkn_period || 1,
          kkn_year: +payload?.kkn_year || moment().year(),
          kkn_detail: {
            period: payload?.kkn_period || 1,
            year: payload?.kkn_year || moment().year(),
            value: payload?.kkn_value || 0,
            total_group: payload?.kkn_total_group || 0,
            total_qty: payload?.kkn_total_qty || 0,
          },
        }),
        discount_type: payload?.discount_type || null,
        discount_value: payload?.discount_value || 0,
        status: payload.status || "pending",
        images: payload.portfolioImages,
        items: payload.items,
        // updated_by: {
        //   id: user?.id,
        //   fullname: user?.fullname,
        // },
        is_personal: payload?.is_personal ? 1 : 0,
      };

      const response = await API.ORDERS.update({
        session: { user, token },
        req: {
          body: finalPayload,
        },
      });

      if (response.success) {
        return Response.json({
          success: true,
          message: "Pesanan berhasil diperbarui",
        });
      } else {
        return Response.json({
          success: false,
          message: response.message || "Gagal memperbarui pesanan",
        });
      }
    } catch (error: any) {
      console.error("Error updating order:", error);
      return Response.json({
        success: false,
        message: error.message || "Terjadi kesalahan saat memperbarui pesanan",
      });
    }
  }

  return Response.json({ success: false, message: "Invalid intent" });
};

export default function OrderEdit() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const fetcher = useFetcher();

  const { data: orders, reload } = useFetcherData({
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

  const { data: products, reload: reloadProducts } = useFetcherData({
    endpoint: nexus()
      .module("PRODUCT")
      .action("get")
      .params({
        // id: safeParseArray(detail?.order_items)
        //   ?.map((item: any) => item.product_id)
        //   .join(","),
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
      <ModalSecond
        open={true}
        onClose={() => {
          navigate(`/app/order-list`);
        }}
        title="Edit Pesanan"
        size="7xl"
      >
        <OrderFormComponent
          order={detail}
          products={products?.data?.items || []}
          onSubmit={(data) => {
            fetcher.submit(
              { intent: "update_order", data: JSON.stringify(data) },
              { method: "post" }
            );
          }}
        />
      </ModalSecond>
    </div>
  );
}

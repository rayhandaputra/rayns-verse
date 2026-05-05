// app/routes/app.order-form.tsx
import React, { useEffect } from "react";
import {
  useActionData,
  type LoaderFunction,
  type ActionFunction,
} from "react-router";
import type { Product, OrderItem } from "~/types";
import {
  API } from "~/nexus";
import { requireAuth } from "~/utils/session.server";
import { toast } from "sonner";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/nexus/nexus-client";
import { safeParseObject } from "~/utils/utils";
import OrderFormComponent from "~/components/features/order/OrderForm";
import moment from "moment";

// ============================================
// LOADER FUNCTION
// ============================================

export const loader: LoaderFunction = async ({ request }) => {
  // Only check authentication
  await requireAuth(request);
  return Response.json({ initialized: true });
};

// ============================================
// ACTION FUNCTION
// ============================================

export const action: ActionFunction = async ({ request }) => {
  const { user, token } = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create_order") {
    try {
      const rawData = formData.get("data") as string;
      const payload: any = safeParseObject(rawData);

      // Ensure status is done
      const finalPayload = {
        institution_id: payload.instansi_id,
        institution_name: payload.instansi,
        institution_domain: payload.accessCode,
        pic_name: payload.pemesanName,
        pic_phone: payload.pemesanPhone,
        deadline: payload.deadline,
        payment_status:
          payload.statusPembayaran?.toLowerCase() === "lunas"
            ? "paid"
            : payload.statusPembayaran?.toLowerCase() === "dp"
              ? "down_payment"
              : "none",
        ...(payload?.dpAmount > 0 ? { dp_amount: payload?.dpAmount } : {}),
        total_amount: payload.totalAmount,
        is_sponsor: !payload?.isSponsor ? 0 : 1,
        is_kkn: !payload?.isKKN ? 0 : 1,
        ...(+payload?.isKKN && {
          kkn_source: "kkn_itera",
          kkn_type: payload?.kknDetails?.tipe ?? "PPM",
          kkn_detail: {
            period: payload?.kknDetails?.periode ?? 1,
            year: payload?.kknDetails?.tahun ?? moment().year(),
            value: payload?.kknDetails?.nilai ?? 0,
            total_group: payload?.kknDetails?.jumlahKelompok ?? 0,
          },
        }),
        discount_type: payload?.discount?.type || null,
        discount_value: payload?.discount?.value || 0,
        status: "pending",
        images: payload.portfolioImages,
        items: payload.items,
        created_by: {
          id: user?.id,
          fullname: user?.fullname,
        },
        is_personal: payload?.instansiMode === "perorangan" ? 1 : 0,
        kkn_period: payload?.kknDetails?.periode ?? 1,
        kkn_year: payload?.kknDetails?.tahun ?? moment().year(),
      };

      // console.log(payload);
      // const response = { success: true };
      const response = await API.ORDERS.create({
        session: { user, token },
        req: {
          body: finalPayload,
        },
      });

      if (response.success) {
        return Response.json({
          success: true,
          message: "Pesanan berhasil disimpan",
        });
      } else {
        return Response.json({
          success: false,
          message: response.message || "Gagal menyimpan pesanan",
        });
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      return Response.json({
        success: false,
        message: error.message || "Terjadi kesalahan saat menyimpan pesanan",
      });
    }
  }

  return Response.json({ success: false, message: "Invalid intent" });
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function OrderFormPage() {
  const actionData = useActionData<{ success?: boolean; message?: string }>();

  // Fetch products
  const { data: productsData } = useFetcherData({
    endpoint: nexus()
      .module("PRODUCT")
      .action("get")
      .params({ page: 0, size: 100, pagination: "true" })
      .build(),
  });

  const products = productsData?.data?.items || [];

  // Fetch done orders for autocomplete or reference
  const { data: getOrdersData } = useFetcherData({
    endpoint: nexus()
      .module("ORDERS")
      .action("get")
      .params({
        status: "done",
        page: 0,
        size: 50,
        pagination: "true",
      })
      .build(),
  });

  const orders = getOrdersData?.data?.items || [];

  // ========== EFFECTS ==========
  useEffect(() => {
    if (actionData?.success) {
      toast.success(actionData.message || "Berhasil");
    } else if (actionData?.success === false) {
      toast.error(actionData.message || "Gagal");
    }
  }, [actionData]);

  const handleOrderSubmit = (data: any) => {
    const form = document.createElement("form");
    form.method = "post";
    form.style.display = "none";

    const intentInput = document.createElement("input");
    intentInput.type = "hidden";
    intentInput.name = "intent";
    intentInput.value = "create_order";
    form.appendChild(intentInput);

    const dataInput = document.createElement("input");
    dataInput.type = "hidden";
    dataInput.name = "data";
    dataInput.value = JSON.stringify(data);
    form.appendChild(dataInput);

    document.body.appendChild(form);
    form.submit();
  };

  // ========== RENDER ==========
  return (
    <div className="space-y-6">
      <OrderFormComponent
        orders={orders}
        products={products}
        onSubmit={handleOrderSubmit}
        isArchive={false}
      />
    </div>
  );
}

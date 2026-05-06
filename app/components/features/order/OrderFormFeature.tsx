
import React, { useEffect } from "react";
import { useActionData, useSubmit } from "react-router";
import { toast } from "sonner";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/nexus/nexus-client";
import OrderFormComponent from "./OrderForm";

export default function OrderFormFeature() {
    const actionData = useActionData() as any;
    const submit = useSubmit();

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

    useEffect(() => {
        if (actionData?.success) {
            toast.success(actionData.message || "Berhasil");
        } else if (actionData?.success === false) {
            toast.error(actionData.message || "Gagal");
        }
    }, [actionData]);

    const handleOrderSubmit = (data: any) => {
        const formData = new FormData();
        formData.append("intent", "create_order");
        formData.append("data", JSON.stringify(data));
        submit(formData, { method: "POST" });
    };

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

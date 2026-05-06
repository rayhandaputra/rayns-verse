
import React from "react";
import { Form } from "react-router";
import { ChevronLeft, CheckCircle2Icon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { TitleHeader } from "~/components/core/TitleHeader";
import { AppBreadcrumb } from "~/components/core/AppBreadcrumb";
import { useOrderManageLogic } from "./use-order-manage-logic";
import { InstitutionSection } from "./InstitutionSection";
import { OrderDetailSection } from "./OrderDetailSection";
import { ProductSection } from "./ProductSection";
import { SummarySection } from "./SummarySection";

export default function OrderManageFeature() {
    const {
        items,
        setItems,
        state,
        setState,
        subtotal,
        defItem,
        defaultState,
        loadOptionInstitution,
        loadOptionDomain,
        loadOptionProduct,
        navigate,
    } = useOrderManageLogic();

    return (
        <div className="space-y-6">
            <TitleHeader
                title="Form Pemesanan"
                description="Buat pesanan baru untuk instansi"
                breadcrumb={
                    <AppBreadcrumb
                        pages={[
                            { label: "Pesanan", href: "/app/order/ordered" },
                            { label: "Form Pesanan", active: true },
                        ]}
                    />
                }
                actions={
                    <Button
                        className="text-blue-700"
                        onClick={() => navigate("/app/order/ordered")}
                        variant="outline"
                    >
                        <ChevronLeft className="w-4" />
                        Kembali
                    </Button>
                }
            />

            <div className="space-y-6 bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <InstitutionSection
                    state={state}
                    setState={setState}
                    loadOptionInstitution={loadOptionInstitution}
                    loadOptionDomain={loadOptionDomain}
                />

                <OrderDetailSection state={state} setState={setState} />

                <ProductSection
                    items={items}
                    setItems={setItems}
                    loadOptionProduct={loadOptionProduct}
                    defItem={defItem}
                />

                <SummarySection state={state} setState={setState} subtotal={subtotal} />

                <Form method="post" className="flex justify-end gap-2 pt-2">
                    <input type="hidden" name="state" value={JSON.stringify(state)} />
                    <input type="hidden" name="items" value={JSON.stringify(items)} />
                    <Button
                        type="button"
                        variant="outline"
                        className="text-gray-700"
                        onClick={() => {
                            setState(defaultState);
                            setItems([defItem]);
                        }}
                    >
                        Reset
                    </Button>
                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                        <CheckCircle2Icon className="w-4 mr-1" />
                        Buat Pesanan
                    </Button>
                </Form>
            </div>
        </div>
    );
}

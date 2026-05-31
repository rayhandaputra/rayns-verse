import { useMemo, useCallback } from "react";
import { useFetcher } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { useFetcherData } from "~/hooks/use-fetcher-data";
import { nexus } from "~/lib/nexus-client";
import { uploadFile } from "~/utils/utils";
import { useCustomerOrderLogic } from "./use-customer-order-logic";
import type { DesignTemplate } from "./use-customer-order-logic";
import BottomNav from "./widgets/BottomNav";
import StepLanding from "./widgets/StepLanding";
import StepIdCardConfig from "./widgets/StepIdCardConfig";
import StepLanyardConfig from "./widgets/StepLanyardConfig";
import StepCheckout from "./widgets/StepCheckout";
import StepDashboard from "./widgets/StepDashboard";

interface CustomerOrderFeatureProps {
  products: any[];
  portfolioItems: any[];
  stats: { countFinished: number; uniqueClients: number };
}

export default function CustomerOrderFeature({
  products,
  portfolioItems,
  stats,
}: CustomerOrderFeatureProps) {
  const { state, updateState, goToStep, nextStep, prevStep, handleFileSelect, canProceedToNext, reset } =
    useCustomerOrderLogic();

  const fetcher = useFetcher();

  // Fetch design templates
  const { data: templateRes } = useFetcherData<any>({
    endpoint: nexus().module("TWIBBON_TEMPLATE").action("get").params({ size: 100 }).build(),
    autoLoad: true,
  });

  const templates: DesignTemplate[] = useMemo(() => {
    const items = templateRes?.data?.items || [];
    return items.map((t: any) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      base_image: t.base_image,
      rules: typeof t.rules === "string" ? JSON.parse(t.rules) : t.rules,
      style_mode: t.style_mode,
    }));
  }, [templateRes]);

  // Calculate price per unit based on member count
  const pricePerUnit = useMemo(() => {
    const idCardProduct = products.find(
      (p: any) => p.type === "package" || p.name?.toLowerCase().includes("paket")
    );
    if (!idCardProduct) return 15000;

    const priceRules = idCardProduct.product_price_rules || [];
    if (priceRules.length === 0) return idCardProduct.total_price || 15000;

    const sorted = [...priceRules].sort((a: any, b: any) => b.min_qty - a.min_qty);
    const applicable = sorted.find((r: any) => state.memberCount >= r.min_qty);
    return applicable ? applicable.price : sorted[sorted.length - 1]?.price || 15000;
  }, [products, state.memberCount]);

  // Submit order
  const handleSubmitOrder = useCallback(async () => {
    updateState({ isSubmitting: true });

    try {
      // Upload payment proof
      let paymentProofUrl = "";
      if (state.paymentProofFile) {
        paymentProofUrl = await uploadFile(state.paymentProofFile);
      }

      // Upload logo if exists
      let logoUrl = "";
      if (state.logoFile) {
        logoUrl = await uploadFile(state.logoFile);
      }

      const totalPrice = state.memberCount * pricePerUnit;
      const dpAmount = Math.ceil(totalPrice * 0.5);

      // Submit order via fetcher
      fetcher.submit(
        {
          intent: "create_order",
          institution_name: state.institutionName,
          pic_name: state.picName,
          pic_phone: state.picPhone,
          member_count: String(state.memberCount),
          payment_type: state.paymentType,
          payment_proof: paymentProofUrl,
          logo_url: logoUrl,
          front_design_id: String(state.frontDesignId || ""),
          back_design_id: String(state.backDesignId || ""),
          lanyard_design_id: String(state.lanyardDesignId || ""),
          back_text: state.backText,
          lanyard_text: state.lanyardText,
          total_amount: String(totalPrice),
          dp_amount: state.paymentType === "dp" ? String(dpAmount) : "0",
          grand_total: String(totalPrice),
        },
        { method: "POST", action: "/order" }
      );

      toast.success("Pesanan berhasil dikirim! Admin akan memverifikasi pembayaran Anda.");
      updateState({
        isSubmitting: false,
        step: 5,
        orderResult: {
          order_number: `ORD-${Date.now()}`,
          institution_name: state.institutionName,
          pic_name: state.picName,
          pic_phone: state.picPhone,
          status: "pending",
          payment_status: state.paymentType === "dp" ? "down_payment" : "unpaid",
          grand_total: totalPrice,
          total_amount: totalPrice,
        },
      });
    } catch (err: any) {
      toast.error("Gagal mengirim pesanan: " + (err.message || "Terjadi kesalahan"));
      updateState({ isSubmitting: false });
    }
  }, [state, pricePerUnit, fetcher, updateState]);

  return (
    <div className="flex flex-col bg-background relative min-h-[calc(100vh-8rem)]">
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden pb-16 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {state.step === 1 && (
              <StepLanding
                onNext={nextStep}
                products={products}
                portfolioItems={portfolioItems}
                stats={stats}
              />
            )}
            {state.step === 2 && (
              <StepIdCardConfig
                state={state}
                updateState={updateState}
                handleFileSelect={handleFileSelect}
                templates={templates}
              />
            )}
            {state.step === 3 && (
              <StepLanyardConfig
                state={state}
                updateState={updateState}
                handleFileSelect={handleFileSelect}
                templates={templates}
              />
            )}
            {state.step === 4 && (
              <StepCheckout
                state={state}
                updateState={updateState}
                handleFileSelect={handleFileSelect}
                onSubmit={handleSubmitOrder}
                pricePerUnit={pricePerUnit}
              />
            )}
            {state.step === 5 && <StepDashboard orderResult={state.orderResult} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        currentStep={state.step}
        onStepChange={goToStep}
        canProceed={canProceedToNext}
        hasOrder={state.orderResult !== null}
      />
    </div>
  );
}

import { useState, useCallback, useMemo } from "react";

// ============================================
// TYPES
// ============================================

export interface DesignTemplate {
  id: number;
  name: string;
  category: "twibbon-idcard" | "twibbon-lanyard";
  base_image: string;
  rules: any;
  style_mode: string;
}

export interface OrderState {
  step: number;
  // Step 2: ID Card Config
  frontDesignId: number | null;
  backDesignId: number | null;
  memberCount: number;
  logoFile: File | null;
  logoPreview: string;
  backText: string;
  backImageFile: File | null;
  backImagePreview: string;
  // Step 3: Lanyard Config
  lanyardDesignId: number | null;
  lanyardLogoFile: File | null;
  lanyardLogoPreview: string;
  lanyardText: string;
  // Step 4: Checkout
  paymentType: "full" | "dp";
  paymentProofFile: File | null;
  paymentProofPreview: string;
  // Customer info
  institutionName: string;
  picName: string;
  picPhone: string;
  // Computed
  isSubmitting: boolean;
  orderResult: any | null;
}

const INITIAL_STATE: OrderState = {
  step: 1,
  frontDesignId: null,
  backDesignId: null,
  memberCount: 0,
  logoFile: null,
  logoPreview: "",
  backText: "",
  backImageFile: null,
  backImagePreview: "",
  lanyardDesignId: null,
  lanyardLogoFile: null,
  lanyardLogoPreview: "",
  lanyardText: "",
  paymentType: "full",
  paymentProofFile: null,
  paymentProofPreview: "",
  institutionName: "",
  picName: "",
  picPhone: "",
  isSubmitting: false,
  orderResult: null,
};

// ============================================
// HOOK
// ============================================

export function useCustomerOrderLogic() {
  const [state, setState] = useState<OrderState>(INITIAL_STATE);

  const updateState = useCallback((partial: Partial<OrderState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.min(prev.step + 1, 5) }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  }, []);

  const handleFileSelect = useCallback(
    (field: "logoFile" | "backImageFile" | "lanyardLogoFile" | "paymentProofFile", file: File | null) => {
      if (!file) {
        const previewField = field.replace("File", "Preview") as keyof OrderState;
        setState((prev) => ({ ...prev, [field]: null, [previewField]: "" }));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewField = field.replace("File", "Preview") as keyof OrderState;
        setState((prev) => ({
          ...prev,
          [field]: file,
          [previewField]: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const canProceedToNext = useMemo(() => {
    switch (state.step) {
      case 1:
        return true;
      case 2:
        return state.frontDesignId !== null && state.memberCount > 0;
      case 3:
        return state.lanyardDesignId !== null;
      case 4:
        return (
          state.paymentProofFile !== null &&
          state.institutionName.trim() !== "" &&
          state.picName.trim() !== "" &&
          state.picPhone.trim() !== ""
        );
      default:
        return false;
    }
  }, [state]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    updateState,
    goToStep,
    nextStep,
    prevStep,
    handleFileSelect,
    canProceedToNext,
    reset,
  };
}

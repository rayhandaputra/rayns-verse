### Widget: StepLanding
- File: `StepLanding.tsx`
- Function: Landing page with CTA, pricelist, portfolio showcase
- Props: `onNext: () => void, products: Product[], portfolioItems: any[]`

### Widget: StepIdCardConfig
- File: `StepIdCardConfig.tsx`
- Function: ID Card front/back design selection, member count, logo upload
- Props: `state: OrderState, dispatch: Dispatch, templates: Template[]`

### Widget: StepLanyardConfig
- File: `StepLanyardConfig.tsx`
- Function: Lanyard template selection and logo/text positioning
- Props: `state: OrderState, dispatch: Dispatch, templates: Template[]`

### Widget: StepCheckout
- File: `StepCheckout.tsx`
- Function: Payment type selection (DP/Full), proof upload, order submission
- Props: `state: OrderState, dispatch: Dispatch, onSubmit: () => void`

### Widget: StepDashboard
- File: `StepDashboard.tsx`
- Function: Post-purchase dashboard with active orders, twibbon link, nota, status
- Props: `orderData: Order, user: User`

### Widget: BottomNav
- File: `BottomNav.tsx`
- Function: Fixed bottom navigation bar mimicking native mobile app
- Props: `currentStep: number, onStepChange: (step: number) => void, canProceed: boolean`

### Widget: DesignPreview
- File: `DesignPreview.tsx`
- Function: Static render preview of final ID Card and Lanyard design
- Props: `frontDesign: Template, backDesign: Template, lanyardDesign: Template, logo: string`

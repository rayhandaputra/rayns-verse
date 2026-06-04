# Graph Report - .  (2026-06-03)

## Corpus Check
- 440 files · ~219,839 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1805 nodes · 3414 edges · 147 communities (119 shown, 28 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.76)
- Token cost: 391,443 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Nexus API Modules|Nexus API Modules]]
- [[_COMMUNITY_Legacy API Provider & Modules|Legacy API Provider & Modules]]
- [[_COMMUNITY_Drive Layout & Topbar|Drive Layout & Topbar]]
- [[_COMMUNITY_Drive Modals (FolderUpload)|Drive Modals (Folder/Upload)]]
- [[_COMMUNITY_App Sidebar & Order Layout|App Sidebar & Order Layout]]
- [[_COMMUNITY_Drive FileFolder Cards|Drive File/Folder Cards]]
- [[_COMMUNITY_Editor & Page Types|Editor & Page Types]]
- [[_COMMUNITY_APIProvider Builder & Routes|APIProvider Builder & Routes]]
- [[_COMMUNITY_Nexus Client Types (lib)|Nexus Client Types (lib)]]
- [[_COMMUNITY_Nexus Client Types|Nexus Client Types]]
- [[_COMMUNITY_Customer Order Feature|Customer Order Feature]]
- [[_COMMUNITY_Supporting Entity Types|Supporting Entity Types]]
- [[_COMMUNITY_Public Drive Components|Public Drive Components]]
- [[_COMMUNITY_Product Forms & Headers|Product Forms & Headers]]
- [[_COMMUNITY_Print Slots & Commodity API|Print Slots & Commodity API]]
- [[_COMMUNITY_Email Campaign Feature|Email Campaign Feature]]
- [[_COMMUNITY_Print NotaReceipt Templates|Print Nota/Receipt Templates]]
- [[_COMMUNITY_App Routes & Layouts|App Routes & Layouts]]
- [[_COMMUNITY_useFetcherData Hook & Examples|useFetcherData Hook & Examples]]
- [[_COMMUNITY_Nota PDF Templates|Nota PDF Templates]]
- [[_COMMUNITY_Order Assignment & Constants|Order Assignment & Constants]]
- [[_COMMUNITY_Dashboard & Auth Routes|Dashboard & Auth Routes]]
- [[_COMMUNITY_FinanceMaster Routes & Media|Finance/Master Routes & Media]]
- [[_COMMUNITY_UI Hero & AlertDialog|UI: Hero & AlertDialog]]
- [[_COMMUNITY_Finance Dashboards & Hooks|Finance Dashboards & Hooks]]
- [[_COMMUNITY_Procurement Catalog Features|Procurement Catalog Features]]
- [[_COMMUNITY_Design Editor Feature|Design Editor Feature]]
- [[_COMMUNITY_Financial Report Dashboard|Financial Report Dashboard]]
- [[_COMMUNITY_UI Sidebar Primitives|UI: Sidebar Primitives]]
- [[_COMMUNITY_UI AccordionCheckboxOTP|UI: Accordion/Checkbox/OTP]]
- [[_COMMUNITY_Public Sections & Discount|Public Sections & Discount]]
- [[_COMMUNITY_Portfolio Upload & Cropper|Portfolio Upload & Cropper]]
- [[_COMMUNITY_Procurement Utils & Feature|Procurement Utils & Feature]]
- [[_COMMUNITY_Shared Modals & Cards|Shared Modals & Cards]]
- [[_COMMUNITY_Root App & Loading Context|Root App & Loading Context]]
- [[_COMMUNITY_Drive CustomerInternal Features|Drive Customer/Internal Features]]
- [[_COMMUNITY_Navbar, Firebase & Login|Navbar, Firebase & Login]]
- [[_COMMUNITY_Nexus ProductStockAuth API|Nexus Product/Stock/Auth API]]
- [[_COMMUNITY_Auth & Session Management|Auth & Session Management]]
- [[_COMMUNITY_Legacy API Index & Overview|Legacy API Index & Overview]]
- [[_COMMUNITY_UI Carousel|UI: Carousel]]
- [[_COMMUNITY_APIProviderV2 Builder|APIProviderV2 Builder]]
- [[_COMMUNITY_Nexus Architecture Docs|Nexus Architecture Docs]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 120|Community 120]]
- [[_COMMUNITY_Community 123|Community 123]]
- [[_COMMUNITY_Community 124|Community 124]]
- [[_COMMUNITY_Community 138|Community 138]]
- [[_COMMUNITY_Community 142|Community 142]]
- [[_COMMUNITY_Community 143|Community 143]]
- [[_COMMUNITY_Community 144|Community 144]]
- [[_COMMUNITY_Community 145|Community 145]]
- [[_COMMUNITY_Community 146|Community 146]]

## God Nodes (most connected - your core abstractions)
1. `useFetcherData()` - 98 edges
2. `cn()` - 51 edges
3. `API` - 46 edges
4. `Button()` - 45 edges
5. `APIProvider()` - 43 edges
6. `APIProvider()` - 40 edges
7. `nexus()` - 33 edges
8. `safeParseArray()` - 31 edges
9. `requireAuth()` - 29 edges
10. `formatCurrency()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `AccountCoaPage()` --calls--> `useFetcherData()`  [EXTRACTED]
  app/components/features/finance/AccountCoaPage.tsx → app/hooks/use-fetcher-data.ts
- `ProcurementCapacityFeature()` --calls--> `useFetcherData()`  [EXTRACTED]
  app/components/features/procurement/ProcurementCapacityFeature.tsx → app/hooks/use-fetcher-data.ts
- `ProcurementCatalogColorFeature()` --calls--> `useFetcherData()`  [EXTRACTED]
  app/components/features/procurement/ProcurementCatalogColorFeature.tsx → app/hooks/use-fetcher-data.ts
- `ProcurementShoppingFeature()` --calls--> `useFetcherData()`  [EXTRACTED]
  app/components/features/procurement/ProcurementShoppingFeature.tsx → app/hooks/use-fetcher-data.ts
- `ProcurementSupplierFeature()` --calls--> `useFetcherData()`  [EXTRACTED]
  app/components/features/procurement/ProcurementSupplierFeature.tsx → app/hooks/use-fetcher-data.ts

## Import Cycles
- 2-file cycle: `app/hooks/index.ts -> app/hooks/useStockLogic.ts -> app/hooks/index.ts`

## Hyperedges (group relationships)
- **Customer Order Wizard Flow** — widgets_readme_steplanding, widgets_readme_stepidcardconfig, widgets_readme_steplanyardconfig, widgets_readme_stepcheckout, widgets_readme_stepdashboard [INFERRED 0.85]
- **Nexus Gateway API Surface** — docs_api_nexus_readme_nexus, docs_api_nexus_readme_usefetcherdata, docs_api_nexus_readme_nexus_builder, docs_api_nexus_readme_nexuspresets, docs_api_nexus_readme_nexushelpers [EXTRACTED 0.75]
- **APIProvider Compliance Audit Categories** — docs_audit_api_provider_satu_pintu, docs_audit_api_provider_fetch_violation, docs_audit_api_provider_nexus_builder_warning, docs_audit_api_provider_deprecated_infra [EXTRACTED 0.75]

## Communities (147 total, 28 thin omitted)

### Community 0 - "Nexus API Modules"
Cohesion: 0.05
Nodes (29): AccountMutationAPI, AccountAPI, AssetAPI, BankAccountAPI, CmsContentAPI, CommodityStockAPI, CommodityAPI, EmployeeAttendanceAPI (+21 more)

### Community 1 - "Legacy API Provider & Modules"
Cohesion: 0.05
Nodes (30): ApiConfig, APIProvider(), sleep(), AccountMutationAPI, AccountAPI, AssetAPI, BankAccountAPI, CmsContentAPI (+22 more)

### Community 2 - "Drive Layout & Topbar"
Cohesion: 0.08
Nodes (23): NavbarProps, Topbar(), DriveLayoutProps, FileProps, DriveLayoutProps, FileProps, NavbarProps, Topbar() (+15 more)

### Community 3 - "Drive Modals (Folder/Upload)"
Cohesion: 0.08
Nodes (19): CreateFolderModalProps, UploadFileModalProps, CreateFolderModalProps, UploadFileModalProps, Option, SelectBasicProps, Dialog(), DialogContent() (+11 more)

### Community 4 - "App Sidebar & Order Layout"
Cohesion: 0.06
Nodes (29): NavItem, Sidebar(), SidebarProps, NavItem, SidebarProps, useIsMobile(), Icons, cn() (+21 more)

### Community 5 - "Drive File/Folder Cards"
Cohesion: 0.09
Nodes (18): FolderProps, RecentFileProps, FolderProps, RecentFileProps, InventoryAsset, DescriptionComponentProps, FinancialTransactionModal(), FinancialTransactionModalProps (+10 more)

### Community 6 - "Editor & Page Types"
Cohesion: 0.06
Nodes (36): mlPerPaket(), DrivePageProps, TwibbonTabContent(), TwibbonTabContentProps, DriveInternalFeatureProps, OrderColumnsProps, LoaderData, NotaViewProps (+28 more)

### Community 7 - "APIProvider Builder & Routes"
Cohesion: 0.06
Nodes (16): APIProviderBuilder, AgentAPI, AgentQueryResult, AgentSchemaResult, AgentTablesResult, EmailAPI, KknInstitutionItem, OverviewAPI (+8 more)

### Community 8 - "Nexus Client Types (lib)"
Cohesion: 0.06
Nodes (40): APIAction, APIModule, Commodity, CommodityFilters, CommodityListResponse, Employee, EmployeeFilters, EmployeeListResponse (+32 more)

### Community 9 - "Nexus Client Types"
Cohesion: 0.06
Nodes (40): APIAction, APIModule, Commodity, CommodityFilters, CommodityListResponse, Employee, EmployeeFilters, EmployeeListResponse (+32 more)

### Community 10 - "Customer Order Feature"
Cohesion: 0.08
Nodes (19): CustomerOrderFeature(), CustomerOrderFeatureProps, DesignTemplate, INITIAL_STATE, OrderState, useCustomerOrderLogic(), APIAction, APIModule (+11 more)

### Community 11 - "Supporting Entity Types"
Cohesion: 0.05
Nodes (36): AccountGroup, AccountLedger, AccountLedgerJournal, AccountLedgerMutation, Asset, BankAccount, CmsContent, Commodity (+28 more)

### Community 12 - "Public Drive Components"
Cohesion: 0.09
Nodes (21): getGoogleMapsLink(), CategoryOnboarding(), CategoryOnboardingProps, DriveFAB(), DriveFABProps, DriveGrid(), DriveGridProps, DriveInfoBar() (+13 more)

### Community 13 - "Product Forms & Headers"
Cohesion: 0.13
Nodes (12): AppBreadcrumb(), TitleHeader(), TitleHeaderProps, ImageUploadPreviewProps, DriveFolder, AccountSettingsFeatureProps, SupplierFeature(), useSupplierLogic() (+4 more)

### Community 14 - "Print Slots & Commodity API"
Cohesion: 0.13
Nodes (18): CommoditiesAPI, ComponentsAPI, SettingsAPI, SupplierCommodityAPI, usePrintSlots(), A4Sheet(), A4SheetProps, LanyardSheet() (+10 more)

### Community 15 - "Email Campaign Feature"
Cohesion: 0.09
Nodes (18): CEO_EMAIL_ACCOUNTS, Email, EmailCampaignFeature(), EmailCampaignFeatureProps, EmailFromAPI, formatRelativeTime(), MailboxResponse, SentEmail (+10 more)

### Community 16 - "Print Nota/Receipt Templates"
Cohesion: 0.08
Nodes (17): PrintNotaTemplate, PrintNotaTemplateProps, styles, InvoiceItem, ReceiptProps, ReceiptTemplate, DiscountAPI, SettingsAPI (+9 more)

### Community 18 - "useFetcherData Hook & Examples"
Cohesion: 0.11
Nodes (27): Asset, AssetResponse, CreateAssetExample(), DashboardExample(), InventoryListExample(), InventoryListWithFiltersExample(), InventorySearchExample(), TypedInventoryExample() (+19 more)

### Community 19 - "Nota PDF Templates"
Cohesion: 0.10
Nodes (18): NotaPdfTemplate(), PrintNotaTemplate, PrintNotaTemplateProps, NotaPdfTemplate(), styles, RestockAPI, formatFullDate(), getWhatsAppLink() (+10 more)

### Community 20 - "Order Assignment & Constants"
Cohesion: 0.10
Nodes (19): OrderAssignmentAPI, OrderAssignmentAPI, formatPhoneNumber(), generateAccessCode(), getKKNPeriod(), INITIAL_SHOPS, INITIAL_STOCK, DiscountType (+11 more)

### Community 21 - "Dashboard & Auth Routes"
Cohesion: 0.10
Nodes (13): loader(), TABS, deleteSession(), getSessionUser(), commitSession(), createUserSession(), destroySession(), getOptionalUser() (+5 more)

### Community 22 - "Finance/Master Routes & Media"
Cohesion: 0.07
Nodes (3): MediaGalleryUploaderProps, API, generateOrderPdfBuffer()

### Community 23 - "UI: Hero & AlertDialog"
Cohesion: 0.08
Nodes (8): HeroSection(), HeroSectionProps, AlertDialogAction(), AlertDialogCancel(), buttonVariants, Calendar(), PaginationLink(), PaginationLinkProps

### Community 24 - "Finance Dashboards & Hooks"
Cohesion: 0.15
Nodes (14): AssetInventoryDashboard(), AccountCoaPage(), Category, FinanceDashboard(), Transaction, useClickAway(), ModalState, useModal() (+6 more)

### Community 25 - "Procurement Catalog Features"
Cohesion: 0.11
Nodes (19): formatCurrencyUnprefix(), ProcurementCatalogColorFeature(), formatNumberInput(), parseCurrency(), ProcurementComponentFeature(), ProcurementShoppingFeature(), ProcurementSupplierFeature(), formatNumberInput() (+11 more)

### Community 26 - "Design Editor Feature"
Cohesion: 0.19
Nodes (16): DesignEditor(), DesignEditorProps, DesignPreviewModal(), DesignPreviewModalProps, RuleConfigDialog(), RuleConfigDialogProps, TemplateCard(), TemplateCardProps (+8 more)

### Community 27 - "Financial Report Dashboard"
Cohesion: 0.12
Nodes (15): formatCurrency(), COLORS, FinanceReportDashboardProps, FinancialReportDashboard(), ProductCostTable(), ProductCostTableProps, AccumulatedStats(), CustomerRankings() (+7 more)

### Community 28 - "UI: Sidebar Primitives"
Cohesion: 0.09
Nodes (4): Separator(), SidebarContext, SidebarContextProps, Skeleton()

### Community 30 - "Public Sections & Discount"
Cohesion: 0.10
Nodes (8): DiscountAPI, generateDiscountCode(), generateShortId(), getWhatsAppLink(), ORDER_TYPE_OPTIONS, OrderType, PAYMENT_TYPE_OPTIONS, PaymentType

### Community 31 - "Portfolio Upload & Cropper"
Cohesion: 0.10
Nodes (10): drawImageCover(), drawImageCoverWithOffset(), FlowStep, PortfolioUploadFeatureProps, ImageCropperProps, TemplateCodeBasedProps, DEFAULT_TRANSFORM, ImagePosition (+2 more)

### Community 32 - "Procurement Utils & Feature"
Cohesion: 0.16
Nodes (12): formatNumberInput(), parseCurrency(), LogTable(), calculateProcurementCosts(), customStyleSelect, isValidUploadedProof(), ProcurementFeature(), ProcurementForm() (+4 more)

### Community 33 - "Shared Modals & Cards"
Cohesion: 0.12
Nodes (8): ProductCardProps, ConfirmDialog(), ConfirmDialogProps, SlideInModalProps, PopoverMenu(), PopoverMenuItem, PopoverMenuProps, ProductGridProps

### Community 34 - "Root App & Loading Context"
Cohesion: 0.13
Nodes (7): LoaderContext, LoaderContextType, LoaderProvider(), useLoading(), ModalContext, ModalContextType, ModalProvider()

### Community 35 - "Drive Customer/Internal Features"
Cohesion: 0.21
Nodes (10): BreadcrumbItem, DriveBreadcrumb(), DriveBreadcrumbProps, DriveCustomerFeature(), DriveCustomerFeatureProps, DriveInternalFeature(), useQueryParams(), PublicDriveFeature() (+2 more)

### Community 37 - "Navbar, Firebase & Login"
Cohesion: 0.18
Nodes (7): auth, db, googleProvider, Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 38 - "Nexus Product/Stock/Auth API"
Cohesion: 0.13
Nodes (11): ProductAPI, createMutation(), StockLogAPI, AuthAPI, APIProviderV2(), BulkInsertParams, DeleteParams, HttpMethod (+3 more)

### Community 40 - "Auth & Session Management"
Cohesion: 0.24
Nodes (11): deleteSession(), getSessionUser(), commitSession(), createUserSession(), destroySession(), getOptionalUser(), getSession(), logout() (+3 more)

### Community 41 - "Legacy API Index & Overview"
Cohesion: 0.16
Nodes (11): API, API, KknInstitutionItem, MonthlyReport, OverviewAPI, OverviewResponse, OverviewStats, PaymentBreakdown (+3 more)

### Community 42 - "UI: Carousel"
Cohesion: 0.19
Nodes (12): CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions, CarouselPlugin (+4 more)

### Community 44 - "Nexus Architecture Docs"
Cohesion: 0.18
Nodes (13): API Modules (INVENTORY_ASSET, PRODUCT, ORDERS, etc.), Nexus Universal API Gateway, nexus() Builder, NexusHelpers, NexusPresets, useFetcherData Hook, Deprecated Infra Files, Direct fetch() to Kinau Backend Violation (+5 more)

### Community 45 - "Community 45"
Cohesion: 0.15
Nodes (9): NexusHelpers, NexusPresets, AssetListResponse, CreateAssetCard(), DashboardStats(), DeleteAssetCard(), InventoryAsset, InventoryList() (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.20
Nodes (8): AppLayoutFeatureProps, AppNavbar(), NavbarProps, AppSidebar(), MenuItem, SidebarProps, Sheet(), SheetContent()

### Community 48 - "Community 48"
Cohesion: 0.23
Nodes (9): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItemContext, FormItemContextValue, FormLabel(), FormMessage() (+1 more)

### Community 49 - "Community 49"
Cohesion: 0.31
Nodes (9): AppBreadcrumbProps, Page, Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage() (+1 more)

### Community 50 - "Community 50"
Cohesion: 0.27
Nodes (7): action(), buildHealingPrompt(), healDatabaseError(), HealingResult, fetchCurl(), FetchCurlOptions, FetchCurlResponse

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (7): ChartConfig, ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), THEMES, useChart()

### Community 53 - "Community 53"
Cohesion: 0.22
Nodes (8): NexusResponse, PaginatedResponse, action(), ActionData, AssetInventoryPage(), AssetsResponse, InventoryAsset, Asset

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (7): InstitutionSection(), OrderDetailSection(), OrderManageFeature(), ProductSection(), SummarySection(), useAsyncSearch(), useOrderManageLogic()

### Community 55 - "Community 55"
Cohesion: 0.27
Nodes (5): ProductListFeature(), RecycleBinFeature(), CustomDataTable(), CustomDataTableProps, UserManagementFeature()

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (5): CommoditiesAPI, ComponentsAPI, RestockAPI, SupplierCommodityAPI, safeParseArray()

### Community 59 - "Community 59"
Cohesion: 0.25
Nodes (4): DesignGalleryFeature(), DesignGalleryFeatureProps, useIsClient(), base64ToFile()

### Community 60 - "Community 60"
Cohesion: 0.22
Nodes (3): SheetDescription(), SheetHeader(), SheetTitle()

### Community 61 - "Community 61"
Cohesion: 0.39
Nodes (4): CONFIG, ApiConfig, APIProvider(), sleep()

### Community 62 - "Community 62"
Cohesion: 0.25
Nodes (3): ArticleDetailContent, fallbackArticleDetail, MediaEventFeatureProps

### Community 64 - "Community 64"
Cohesion: 0.29
Nodes (4): ProductAPI, createMutation(), StockLogAPI, generateProductCode()

### Community 65 - "Community 65"
Cohesion: 0.33
Nodes (6): nexus(), getProgressWidth(), PAYMENT_MAP, STATUS_MAP, StepDashboard(), StepDashboardProps

### Community 66 - "Community 66"
Cohesion: 0.29
Nodes (4): BottleneckDetail, BottleneckGroup, ProcurementCapacityFeature(), RawMaterial

### Community 67 - "Community 67"
Cohesion: 0.29
Nodes (3): availableIcons, StatItem, StatsSectionProps

### Community 68 - "Community 68"
Cohesion: 0.29
Nodes (6): Account, Order, OrderItem, Product, User, UserAuth

### Community 69 - "Community 69"
Cohesion: 0.43
Nodes (4): ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 70 - "Community 70"
Cohesion: 0.33
Nodes (5): CreatePriceRulePayload, GetPriceRulesQuery, ProductPriceRule, ProductPriceRulesAPI, UpdatePriceRulePayload

### Community 71 - "Community 71"
Cohesion: 0.33
Nodes (5): CreatePriceRulePayload, GetPriceRulesQuery, ProductPriceRule, ProductPriceRulesAPI, UpdatePriceRulePayload

### Community 73 - "Community 73"
Cohesion: 0.33
Nodes (6): Sidebar(), SidebarMenuButton(), sidebarMenuButtonVariants, SidebarRail(), SidebarTrigger(), useSidebar()

### Community 77 - "Community 77"
Cohesion: 0.40
Nodes (4): Tooltip(), TooltipContent(), TooltipProvider(), TooltipTrigger()

### Community 78 - "Community 78"
Cohesion: 0.50
Nodes (5): DesignPreview Widget, OrderState (shared widget state), StepCheckout Widget, StepIdCardConfig Widget, StepLanyardConfig Widget

### Community 80 - "Community 80"
Cohesion: 0.50
Nodes (3): InvoiceItem, ReceiptProps, ReceiptTemplate

### Community 81 - "Community 81"
Cohesion: 0.50
Nodes (3): ADMIN_NAVIGATION, MenuItem, navigation

### Community 84 - "Community 84"
Cohesion: 0.50
Nodes (3): app, auth, firebaseConfig

### Community 95 - "Community 95"
Cohesion: 0.50
Nodes (3): GeminiResponse, GeminiService, genAI

## Ambiguous Edges - Review These
- `OrderPaymentProofModal Widget` → `Satu Pintu APIProvider Rule`  [AMBIGUOUS]
  app/docs/audit-api-provider.md · relation: conceptually_related_to

## Knowledge Gaps
- **460 isolated node(s):** `ChartWrapper`, `ChartWrapperProps`, `Page`, `AppBreadcrumbProps`, `AppLayoutFeatureProps` (+455 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `OrderPaymentProofModal Widget` and `Satu Pintu APIProvider Rule`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useFetcherData()` connect `useFetcherData Hook & Examples` to `App Sidebar & Order Layout`, `Drive File/Folder Cards`, `Editor & Page Types`, `Customer Order Feature`, `Public Drive Components`, `Product Forms & Headers`, `Print Slots & Commodity API`, `Email Campaign Feature`, `App Routes & Layouts`, `Finance Dashboards & Hooks`, `Procurement Catalog Features`, `Design Editor Feature`, `Financial Report Dashboard`, `Procurement Utils & Feature`, `Drive Customer/Internal Features`, `Community 45`, `Community 53`, `Community 55`, `Community 59`, `Community 65`, `Community 66`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `API` connect `Finance/Master Routes & Media` to `Nexus API Modules`, `App Sidebar & Order Layout`, `Nexus Client Types`, `Public Drive Components`, `Product Forms & Headers`, `Print Slots & Commodity API`, `App Routes & Layouts`, `Order Assignment & Constants`, `Dashboard & Auth Routes`, `Finance Dashboards & Hooks`, `Design Editor Feature`, `Public Sections & Discount`, `Procurement Utils & Feature`, `Drive Customer/Internal Features`, `Community 47`, `Community 53`, `Community 55`, `Community 56`, `Community 59`, `Community 62`, `Community 89`, `Community 90`, `Community 91`, `Community 92`, `Community 93`, `Community 108`, `Community 109`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `Button()` connect `Drive File/Folder Cards` to `Shared Modals & Cards`, `Drive Layout & Topbar`, `Drive Modals (Folder/Upload)`, `App Sidebar & Order Layout`, `Drive Customer/Internal Features`, `Navbar, Firebase & Login`, `UI: Carousel`, `Public Drive Components`, `Product Forms & Headers`, `Email Campaign Feature`, `UI: Hero & AlertDialog`, `Community 54`, `Community 55`, `Finance Dashboards & Hooks`, `Financial Report Dashboard`, `UI: Sidebar Primitives`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `ChartWrapper`, `ChartWrapperProps`, `Page` to the rest of the system?**
  _460 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Nexus API Modules` be split into smaller, more focused modules?**
  _Cohesion score 0.04858757062146893 - nodes in this community are weakly interconnected._
- **Should `Legacy API Provider & Modules` be split into smaller, more focused modules?**
  _Cohesion score 0.0514216575922565 - nodes in this community are weakly interconnected._
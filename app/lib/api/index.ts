export * from "./core/callApi";
export * from "./core/config";
export * from "./core/helpers";
export * from "./core/types";

import { AccountAPI } from "./modules/account";
import { AccountMutationAPI } from "./modules/account_mutation";
import { AssetAPI } from "./modules/asset";
import { BankAccountAPI } from "./modules/bank_account";
import { CmsContentAPI } from "./modules/cms_content";
import { CommoditiesAPI } from "./modules/commodities";
import { CommodityAPI } from "./modules/commodity";
import { CommodityStockAPI } from "./modules/commodity_stock";
import { ComponentsAPI } from "./modules/components";
import { DiscountAPI } from "./modules/discount_codes";
import { EmployeeAPI } from "./modules/employee";
import { EmployeeAttendanceAPI } from "./modules/employee_attendance";
import { EmployeeSalaryAPI } from "./modules/employee_salary";
import { EmployeeSalarySlipAPI } from "./modules/employee_salary_slip";
import { InstitutionAPI } from "./modules/institution";
import { InventoryAssetAPI } from "./modules/inventory_assets";
import { OrderAPI } from "./modules/order";
import { OrderItemAPI } from "./modules/order_item";
import { OrderUploadAPI } from "./modules/order_upload";
import { OverviewAPI } from "./modules/overview";
import { ProductAPI } from "./modules/product";
import { ProductCategoryAPI } from "./modules/product_category";
import { ProductComponentAPI } from "./modules/product_component";
import { ProductPackageItemsAPI } from "./modules/product_package_item";
import { ProductPriceRulesAPI } from "./modules/product_price_rules";
import { RestockAPI } from "./modules/restock";
import { SettingsAPI } from "./modules/settings";
import { ShirtColorAPI } from "./modules/shirt_color";
import { StockLogAPI } from "./modules/stock_log";
import { SupplierAPI } from "./modules/supplier";
import { SupplierCommodityAPI } from "./modules/supplier_commodity";
import { TestimonialAPI } from "./modules/testimonial";
import { TransactionAPI } from "./modules/transaction";
import { OrderAssignmentAPI } from "./modules/twibbon_assignment";
import { TwibbonTemplateAPI } from "./modules/twibbon_template";
import { UserAPI } from "./modules/user";

// optional: unified API wrapper
export const API = {
  USER: UserAPI,
  ORDERS: OrderAPI,
  ORDER_ITEMS: OrderItemAPI,
  ORDER_UPLOAD: OrderUploadAPI,
  COMMODITY: CommodityAPI,
  COMMODITY_STOCK: CommodityStockAPI,
  SUPPLIER: SupplierAPI,
  SUPPLIER_COMMODITY: SupplierCommodityAPI,
  INSTITUTION: InstitutionAPI,
  ASSET: AssetAPI,
  INVENTORY_ASSET: InventoryAssetAPI,
  EMPLOYEE: EmployeeAPI,
  EMPLOYEE_ATTENDANCE: EmployeeAttendanceAPI,
  EMPLOYEE_SALARY: EmployeeSalaryAPI,
  EMPLOYEE_SALARY_SLIP: EmployeeSalarySlipAPI,
  PRODUCT: ProductAPI,
  PRODUCT_COMPONENT: ProductComponentAPI,
  PRODUCT_CATEGORY: ProductCategoryAPI,
  PRODUCT_PACKAGE_ITEM: ProductPackageItemsAPI,
  PRODUCT_PRICE_RULES: ProductPriceRulesAPI,
  CMS_CONTENT: CmsContentAPI,
  OVERVIEW: OverviewAPI,
  DISCOUNT: DiscountAPI,
  TESTIMONIAL: TestimonialAPI,
  TRANSACTION: TransactionAPI,
  BANK_ACCOUNT: BankAccountAPI,
  ACCOUNT: AccountAPI,
  ACCOUNT_MUTATION: AccountMutationAPI,
  RESTOCK: RestockAPI,
  SETTINGS: SettingsAPI,
  COMPONENTS: ComponentsAPI,
  COMMODITIES: CommoditiesAPI,
  STOCK_LOG: StockLogAPI,
  SHIRT_COLOR: ShirtColorAPI,
  TWIBBON_TEMPLATE: TwibbonTemplateAPI,
  TWIBBON_ASSIGNMENT: OrderAssignmentAPI,
};

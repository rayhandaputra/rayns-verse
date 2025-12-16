export * from "./core/callApi";
export * from "./core/config";
export * from "./core/helpers";
export * from "./core/types";

import { AssetAPI } from "./modules/asset";
import { CmsContentAPI } from "./modules/cms_content";
import { CommodityAPI } from "./modules/commodity";
import { CommodityStockAPI } from "./modules/commodity_stock";
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
import { SupplierAPI } from "./modules/supplier";
import { SupplierCommodityAPI } from "./modules/supplier_commodity";
import { TestimonialAPI } from "./modules/testimonial";
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
};

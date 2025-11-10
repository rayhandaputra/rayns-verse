export * from "./core/callApi";
export * from "./core/config";
export * from "./core/helpers";
export * from "./core/types";

import { AssetAPI } from "./modules/asset";
import { CmsContentAPI } from "./modules/cms_content";
import { CommodityAPI } from "./modules/commodity";
import { CommodityStockAPI } from "./modules/commodity_stock";
import { DiscountAPI } from "./modules/discount_codes";
import { InstitutionAPI } from "./modules/institution";
import { OrderAPI } from "./modules/order";
import { OrderItemAPI } from "./modules/order_item";
import { OrderUploadAPI } from "./modules/order_upload";
import { OverviewAPI } from "./modules/overview";
import { ProductAPI } from "./modules/product";
import { ProductCategoryAPI } from "./modules/product_category";
import { ProductComponentAPI } from "./modules/product_component";
import { ProductPackageItemsAPI } from "./modules/product_package_item";
import { SupplierAPI } from "./modules/supplier";
import { SupplierCommodityAPI } from "./modules/supplier_commodity";
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
  PRODUCT: ProductAPI,
  PRODUCT_COMPONENT: ProductComponentAPI,
  PRODUCT_CATEGORY: ProductCategoryAPI,
  PRODUCT_PACKAGE_ITEM: ProductPackageItemsAPI,
  CMS_CONTENT: CmsContentAPI,
  OVERVIEW: OverviewAPI,
  DISCOUNT: DiscountAPI,
};

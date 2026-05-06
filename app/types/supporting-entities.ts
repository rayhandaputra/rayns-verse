export interface AccountGroup {
  id: number;
  uid: string;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
  code: string;
  name: string;
  level: number;
  parent_id: number | null;
}

export interface AccountLedger {
  id: number;
  uid: string;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
  group_code: string;
  group_name: string;
  coa_code: string;
  coa_name: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface AccountLedgerJournal {
  id: number;
  uid: string;
  journal_code: string;
  journal_number: string;
  journal_date: string;
  description: string;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface AccountLedgerMutation {
  id: number;
  journal_code: string;
  trx_code: string;
  trx_date: string;
  ledger_id: number;
  account_code: string;
  account_name: string;
  category: string;
  notes: string;
  receipt_url: string | null;
  debit: number;
  credit: number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface Asset {
  id: number;
  asset_name: string;
  category: string;
  purchase_date: string;
  location: string;
  status: "Good" | "Damaged" | "Maintenance";
  total_value: number;
  total_unit: number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface BankAccount {
  id: number;
  bank_name: string;
  account_number: string;
  holder_name: string;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface CmsContent {
  id: number;
  title: string;
  slug: string;
  image: string;
  image_gallery: string | string[]; // Can be JSON string or array
  description: string;
  link: string;
  type: "highlight-event" | "news" | "hero-section" | "testimonial" | "partner" | "cta-banner" | "stats";
  seq: number;
  total_order: number;
  value: string;
  suffix: string;
  icon_type: string;
  promotion_type: string;
  is_active: boolean | number;
  created_on: string;
  modified_on: string;
  deleted: string | null;
}

export interface Commodity {
  id: number;
  uid: string;
  component_id: number;
  code: string;
  name: string;
  unit: string;
  conversion_factor: number;
  base_price: number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface Component {
  id: number;
  code: string;
  name: string;
  unit: string;
  stock_qty: number;
  requirement_per_pkt: number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface DiscountCode {
  id: number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
  code: string;
  name: string;
  description: string;
  discount_type: "percentage" | "amount";
  discount_value: number;
  max_discount_amount: number;
  min_order_amount: number;
  valid_from: string;
  valid_until: string;
  user_limit: number;
  active: boolean | number;
}

export interface Employee {
  id: number;
  name: string;
  structural: string;
  phone: string;
  status: "active" | "inactive" | "on_leave";
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface EmployeeAttendance {
  id: number;
  employee_id: number;
  employee_name: string;
  presence_date: string;
  time_in: string;
  time_out: string | null;
  location_lat_in: string;
  location_long_in: string;
  selfie_path: string;
  presence_status: "present" | "permit" | "sick" | "absent";
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface EmployeeSalary {
  id: number;
  employee_id: number;
  employee_name: string;
  base_salary: number;
  allowances: number;
  payment_type: "monthly" | "daily";
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface EmployeeSalarySlip {
  id: number;
  employee_id: number;
  employee_name: string;
  period: string;
  payment_type: string;
  work_days_count: number;
  paid_base_salary: number;
  variable_allowances: number;
  deductions: number;
  net_salary: number;
  payment_status: "pending" | "paid" | "failed";
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface Institution {
  id: number;
  uid: string;
  deleted_on: string | null;
  created_on: string;
  modified_on: string;
  name: string;
  abbr: string;
}

export interface InstitutionDomain {
  id: number;
  deleted_on: string | null;
  created_on: string;
  modified_on: string;
  institution_id: number;
  domain: string;
  is_primary: boolean | number;
}

export interface OrderTwibbonAssignment {
  id: number;
  order_trx_code: string;
  unique_code: string;
  twibbon_template_id: number;
  twibbon_template_name: string;
  category: "idcard" | "lanyard";
  public_url_link: string;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface OrderUploadFile {
  id: number;
  code: string;
  order_number: string;
  folder_id: number;
  folder_name: string;
  folder_purpose: "id_card_front" | "id_card_back" | "lanyard";
  product_id: number;
  product_name: string;
  file_type: "front" | "back" | "lanyard";
  file_url: string;
  file_name: string;
  created_on: string;
  deleted_on: string | null;
}

export interface OrderUploadFolder {
  id: number;
  uid: string;
  order_number: string;
  folder_name: string;
  parent_id: number | null;
  level: number;
  product_id: number;
  product_name: string;
  purpose: "id_card_front" | "id_card_back" | "lanyard" | "sablon_front" | "sablon_back";
  created_by: number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string;
  default_drive_folders: string | string[]; // JSON string or array
  idx_idcard_front: number;
  idx_idcard_back: number;
  idx_lanyard: number;
  idx_sablon_depan: number;
  idx_sablon_belakang: number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface ProductComponent {
  id: number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
  product_id: number;
  commodity_id: number;
  commodity_name: string;
  qty: number;
  unit_price: number;
  subtotal: number;
}

export interface ProductPackageItem {
  id: number;
  package_id: number;
  package_name: string;
  product_id: number;
  product_name: string;
  qty: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  note: string;
  seq: number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface ProductPriceRule {
  id: number;
  uid: string;
  product_id: number;
  min_qty: number;
  price: number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface ProductVariant {
  id: number;
  uid: string;
  product_id: number;
  variant_name: string;
  base_price: number;
  is_default: boolean | number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface PurchaseOrder {
  id: number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
  order_number: string;
  supplier_id: number;
  supplier_name: string;
  status: "pending" | "approved" | "received" | "cancelled";
  order_date: string;
  received_date: string | null;
  shipping_cost: number;
  admin_fee: number;
  discount_amount: number;
}

export interface PurchaseOrderItem {
  id: number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
  po_number: string;
  supplier_id: number;
  commodity_id: number;
  commodity_name: string;
  qty: number;
  unit: string;
  unit_price: number;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  description: string;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface StockLog {
  id: number;
  trx_code: string;
  direction: "IN" | "OUT";
  category: string;
  order_trx_code: string | null;
  supplier_id: number | null;
  total_item_qty: number;
  total_item_price: number;
  discount_value: number;
  admin_cost: number;
  shipping_cost: number;
  sablon_supplier_id: number | null;
  sablon_kebutuhan_per_meter: number;
  sablon_cost: number;
  sablon_discount_value: number;
  sablon_admin_cost: number;
  sablon_shipping_cost: number;
  final_amount: number;
  laba_bersih: number;
  kaos_payment_proof_paid: string | null;
  kaos_payment_proof_dp: string | null;
  sablon_payment_proof_paid: string | null;
  sablon_payment_proof_dp: string | null;
  payment_status: "none" | "unpaid" | "paid" | "down_payment";
  description: string;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface StockLogItem {
  id: number;
  stock_log_id: number;
  supplier_id: number | null;
  order_trx_code: string | null;
  product_id: number | null;
  direction: "IN" | "OUT";
  commodity_id: number;
  commodity_name: string;
  is_commodity_parent: boolean | number;
  category: string;
  movement_type: "consumption" | "purchase" | "return";
  qty: number;
  needs_per_meter: number;
  supplier_price: number;
  selling_price: number;
  price_per_unit: number;
  subtotal: number;
  created_on: string;
  deleted_on: string | null;
}

export interface Supplier {
  id: number;
  uid: string;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
  name: string;
  category: string;
  cotton_combed_category: string;
  price_s_xl: number;
  price_2xl: number;
  price_3xl: number;
  price_4xl: number;
  price_5xl: number;
  price_long_sleeve: number;
  price_per_meter: number;
  type: "online" | "offline";
  address: string;
  location: string;
  phone: string;
  external_link: string;
}

export interface SupplierCommodity {
  id: number;
  parent_id: number | null;
  level: number;
  supplier_id: number;
  supplier_name: string;
  commodity_id: number;
  commodity_name: string;
  category: string;
  qty: number;
  current_stock: number;
  unit: string;
  unit_price: number;
  capacity_per_unit: number;
  is_package: boolean | number;
  is_affected_side: boolean | number;
  price: number;
  modified_on: string;
  deleted_on: string | null;
  created_on: string;
}

export interface Testimonial {
  id: number;
  order_number: string;
  institution_name: string;
  name: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  created_on: string;
  modified_on: string;
}

export interface XDesignTemplate {
  id: number;
  name: string;
  category: string;
  image_url: string;
  layout_rules: string | any; // JSON string or object
  style_mode: string;
  created_at: string;
  updated_at: string;
}

export interface XShirtColor {
  id: number;
  name: string;
  image_url: string;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface XTwibbonTemplate {
  id: number;
  name: string;
  category: "twibbon-idcard" | "twibbon-lanyard";
  base_image: string;
  rules: string | any; // JSON string or object
  style_mode: string;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface LoginLog {
  id: number;
  user_id: number;
  email: string;
  ip_address: string;
  success: boolean | number;
  created_on: string;
}

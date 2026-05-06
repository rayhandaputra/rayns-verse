export interface Account {
  id: number;
  uid: string;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
  code: string;
  name: string;
  ref_account_number: string | null;
  ref_account_holder: string | null;
  is_bank: boolean | number;
  group_code: string;
  group_type: "asset" | "liability" | "equity" | "income" | "expense";
  group_name: string;
  is_editable: boolean | number;
}

export interface Order {
  id: number;
  uid: string;
  order_number: string;
  institution_id: number;
  institution_name: string;
  institution_abbr: string;
  institution_domain: string;
  payment_status: "none" | "unpaid" | "paid" | "down_payment" | "refunded" | "cancelled";
  payment_method: string;
  payment_reference: string;
  payment_proof: string;
  payment_proof_uploaded_on: string;
  payment_detail: string;
  payment_journal_code: string;
  dp_payment_method: string;
  dp_payment_detail: string;
  dp_payment_proof: string;
  dp_payment_proof_uploaded_on: string;
  dp_payment_journal_code: string;
  payment_due_date: string;
  discount_code: string;
  discount_type: string;
  discount_value: number;
  tax_percent: number;
  tax_value: number;
  shipping_fee: number;
  other_fee: number;
  subtotal: number;
  total_amount: number;
  dp_amount: number;
  grand_total: number;
  order_type: "package" | "id_card" | "lanyard" | "custom" | "service";
  order_date: string;
  deadline: string;
  status: "ordered" | "confirmed" | "in_production" | "qc" | "ready" | "shipped" | "delivered" | "done" | "rejected" | "cancelled" | "pending";
  status_printed: boolean | number;
  notes: string;
  images: string | string[];
  drive_folder_id: string;
  pic_name: string;
  pic_phone: string;
  review: string;
  rating: number;
  shipping_address: string;
  shipping_contact: string;
  created_by: number;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
  is_archive: boolean | number;
  is_portfolio: boolean | number;
  is_sponsor: boolean | number;
  is_kkn: boolean | number;
  kkn_source: string;
  kkn_period: string;
  kkn_year: string;
  is_personal: boolean | number;
  kkn_type: string;
  kkn_detail: string;
}

export interface OrderItem {
  id: number;
  order_number: string;
  product_id: number;
  category_id: number;
  category_name: string;
  price_rule_id: number;
  price_rule_min_qty: number;
  price_rule_value: number;
  variant_id: number;
  variant_name: string;
  variant_price: number;
  variant_final_price: number;
  product_name: string;
  product_type: "single" | "package" | "material" | "custom" | "addon";
  qty: number;
  unit_price: number;
  discount_type: string;
  discount_value: number;
  tax_percent: number;
  subtotal: number;
  discount_total: number;
  tax_value: number;
  total_after_tax: number;
  notes: string;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
}

export interface Product {
  id: number;
  category_id: number;
  category_name: string;
  uid: string;
  created_on: string;
  modified_on: string;
  deleted_on: string | null;
  code: string;
  name: string;
  image: string;
  description: string;
  type: "single" | "package" | "material";
  show_in_dashboard: boolean | number;
  subtotal: number;
  hpp_price: number;
  discount_value: number;
  tax_fee: number;
  other_fee: number;
  total_price: number;
}

export interface User {
  id: number;
  created_on: string;
  modified_on: string;
  deleted: string | null;
  fullname: string;
  email: string;
  role: "admin" | "user" | "manager" | "staff" | "developer" | "ceo";
  session_token: string;
  session_expired: string;
  is_active: boolean | number;
}

export interface UserAuth {
  id: number;
  user_id: number;
  email: string;
  password_hash: string;
  email_verified: boolean | number;
  last_login: string;
  failed_attempt: number;
  locked_until: string | null;
  session_token_hash: string;
  session_expired_at: string;
  session_ip: string;
  session_user_agent: string;
  created_on: string;
  modified_on: string;
}

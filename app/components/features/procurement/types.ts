export interface SubComponent {
  id: string;
  name: string;
  commodity_name?: string;
  capacity_per_unit: number;
  current_stock: number;
  parent_id?: string;
}

export interface RawMaterial {
  id: string;
  commodity_name: string;
  category?: string;
  unit: string;
  unit_price: number;
  supplier_id: string;
  current_stock: number;
  capacity_per_unit: number;
  is_package: number;
  sub_components: SubComponent[] | string;
  is_affected_side: number;
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  type: "online" | "offline";
  phone?: string;
  external_link?: string;
  category: string;
  address?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: "Income" | "Expense";
  category: string;
  amount: number;
  description: string;
  isAuto: boolean;
  proofImage?: string;
  supplier_name?: string;
}

export interface ProductVariation {
  variant_name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  product_variants: ProductVariation[] | string;
}

export interface ShirtColor {
    id: string;
    name: string;
    image_url: string;
    created_on: string;
}

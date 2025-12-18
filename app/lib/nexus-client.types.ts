/**
 * Type definitions for API Nexus
 *
 * Comprehensive TypeScript types for type-safe API Nexus usage
 */

import type { API } from "./api";

/**
 * Available API modules
 */
export type APIModule = keyof typeof API;

/**
 * Common API actions
 */
export type APIAction = "get" | "create" | "update" | "delete" | string;

/**
 * Nexus request configuration
 */
export interface NexusConfig {
  module: APIModule;
  action: APIAction;
  params?: Record<string, any>;
  auth?: boolean;
}

/**
 * Standard Nexus response wrapper
 */
export interface NexusResponse<T = any> {
  success: boolean;
  data: T;
  meta: {
    module: string;
    action: string;
    timestamp: string;
  };
  error?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

/**
 * Standard pagination params
 */
export interface PaginationParams {
  page?: number;
  size?: number;
}

/**
 * Standard search params
 */
export interface SearchParams {
  search?: string;
}

/**
 * Standard filter params
 */
export interface FilterParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Combined query params
 */
export type QueryParams = PaginationParams & SearchParams & FilterParams;

/**
 * Inventory Asset types
 */
export interface InventoryAsset {
  id: number;
  asset_name: string;
  category: string;
  purchase_date: string;
  location: string;
  status: "Good" | "Fair" | "Maintenance" | "Retired";
  total_value: number;
  total_unit: number;
  created_on: string;
  modified_on?: string;
  deleted_on?: string | null;
}

export interface InventoryAssetFilters extends PaginationParams, SearchParams {
  category?: string;
  status?: string;
  location?: string;
}

export interface InventoryAssetCreateInput {
  asset_name: string;
  category: string;
  purchase_date: string;
  location: string;
  status?: string;
  total_value: number;
  total_unit?: number;
}

export interface InventoryAssetUpdateInput {
  id: number;
  asset_name?: string;
  category?: string;
  purchase_date?: string;
  location?: string;
  status?: string;
  total_value?: number;
  total_unit?: number;
}

/**
 * Product types
 */
export interface Product {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  created_on: string;
}

export interface ProductFilters extends PaginationParams, SearchParams {
  category?: string;
  status?: string;
  min_price?: number;
  max_price?: number;
}

/**
 * Order types
 */
export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  order_date: string;
  created_on: string;
}

export interface OrderFilters extends PaginationParams, SearchParams {
  status?: string;
  from_date?: string;
  to_date?: string;
}

/**
 * Employee types
 */
export interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  department: string;
  status: string;
  hire_date: string;
  created_on: string;
}

export interface EmployeeFilters extends PaginationParams, SearchParams {
  department?: string;
  position?: string;
  status?: string;
}

/**
 * Commodity types
 */
export interface Commodity {
  id: number;
  name: string;
  unit: string;
  category: string;
  current_stock: number;
  min_stock: number;
  created_on: string;
}

export interface CommodityFilters extends PaginationParams, SearchParams {
  category?: string;
  low_stock?: boolean;
}

/**
 * Overview/Statistics types
 */
export interface OverviewStats {
  total_assets: number;
  total_products: number;
  total_orders: number;
  total_employees: number;
  revenue: number;
  expenses: number;
  profit: number;
}

/**
 * Error response structure
 */
export interface NexusError {
  success: false;
  error: string;
  meta: {
    timestamp: string;
  };
}

/**
 * Module-specific response types
 */
export type InventoryAssetListResponse = NexusResponse<
  PaginatedResponse<InventoryAsset>
>;
export type InventoryAssetCreateResponse = NexusResponse<{
  success: boolean;
  message: string;
  asset_id: number;
}>;
export type InventoryAssetUpdateResponse = NexusResponse<{
  success: boolean;
  message: string;
  affected: number;
}>;
export type InventoryAssetDeleteResponse = NexusResponse<{
  success: boolean;
  message: string;
  affected: number;
}>;

export type ProductListResponse = NexusResponse<PaginatedResponse<Product>>;
export type OrderListResponse = NexusResponse<PaginatedResponse<Order>>;
export type EmployeeListResponse = NexusResponse<PaginatedResponse<Employee>>;
export type CommodityListResponse = NexusResponse<PaginatedResponse<Commodity>>;
export type OverviewResponse = NexusResponse<OverviewStats>;

/**
 * Utility types
 */
export type LoadingState = "idle" | "loading" | "submitting" | "success" | "error";

export interface FetcherState<T> {
  data: T | undefined;
  loading: boolean;
  error: any;
  state: LoadingState;
}

/**
 * Nexus builder types
 */
export interface NexusBuilderConfig {
  module?: APIModule;
  action?: APIAction;
  params?: Record<string, any>;
  auth?: boolean;
}

export interface NexusFetcherConfig {
  endpoint: string;
  method: "GET" | "POST";
  params: Record<string, any>;
}

/**
 * Type guards
 */
export function isNexusResponse<T>(response: any): response is NexusResponse<T> {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    "meta" in response
  );
}

export function isNexusError(response: any): response is NexusError {
  return (
    typeof response === "object" &&
    response !== null &&
    response.success === false &&
    "error" in response
  );
}

export function isPaginatedResponse<T>(data: any): data is PaginatedResponse<T> {
  return (
    typeof data === "object" &&
    data !== null &&
    "items" in data &&
    "total" in data &&
    "page" in data &&
    "size" in data &&
    Array.isArray(data.items)
  );
}

/**
 * Helper type for extracting data from Nexus response
 */
export type ExtractData<T> = T extends NexusResponse<infer U> ? U : never;

/**
 * Helper type for extracting items from paginated response
 */
export type ExtractItems<T> = T extends PaginatedResponse<infer U> ? U : never;

/**
 * useFetcherData hook return type
 */
export interface UseFetcherDataReturn<T> {
  data: T | undefined;
  loading: boolean;
  error: any;
  load: (customParams?: Record<string, any>) => void;
  reload: () => void;
  fetcher: any; // ReturnType<typeof useFetcher>
}

/**
 * useFetcherData hook options
 */
export interface UseFetcherDataOptions {
  endpoint: string;
  method?: "GET" | "POST";
  autoLoad?: boolean;
  params?: Record<string, any>;
}

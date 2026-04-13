/**
 * Nexus Client - Helper utilities for API Nexus
 *
 * Provides convenient builder patterns and utilities
 * for working with the API Nexus endpoint.
 */

import type { API } from "./api";

// Re-export types for convenience
export type * from "./nexus-client.types";

export type APIModule = keyof typeof API;
export type APIAction = string;

interface NexusConfig {
  module: APIModule;
  action: APIAction;
  params?: Record<string, any>;
  auth?: boolean;
}

/**
 * Nexus Query Builder
 * Fluent interface for building nexus API calls
 *
 * @example
 * const endpoint = nexus()
 *   .module("INVENTORY_ASSET")
 *   .action("get")
 *   .param("page", 0)
 *   .param("size", 10)
 *   .build();
 */
export class NexusBuilder {
  private config: Partial<NexusConfig> = {
    auth: true,
  };
  private queryParams: Record<string, any> = {};

  /**
   * Set the API module
   */
  module(moduleName: APIModule): this {
    this.config.module = moduleName;
    return this;
  }

  /**
   * Set the action/method
   */
  action(actionName: APIAction): this {
    this.config.action = actionName;
    return this;
  }

  /**
   * Add a query parameter
   */
  param(key: string, value: any): this {
    this.queryParams[key] = value;
    return this;
  }

  /**
   * Add multiple query parameters
   */
  params(params: Record<string, any>): this {
    Object.assign(this.queryParams, params);
    return this;
  }

  /**
   * Set whether authentication is required
   */
  requireAuth(required: boolean = true): this {
    this.config.auth = required;
    return this;
  }

  /**
   * Build the final endpoint URL with query parameters
   */
  build(): string {
    if (!this.config.module || !this.config.action) {
      throw new Error("Module and action are required");
    }

    const params = new URLSearchParams({
      module: this.config.module,
      action: this.config.action,
      ...(this.config.auth !== undefined && { auth: String(this.config.auth) }),
      ...Object.entries(this.queryParams).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>),
    });

    return `/api/nexus?${params.toString()}`;
  }

  /**
   * Get configuration object for useFetcherData
   */
  toFetcherConfig(method: "GET" | "POST" = "GET") {
    if (!this.config.module || !this.config.action) {
      throw new Error("Module and action are required");
    }

    return {
      endpoint: "/api/nexus",
      method,
      params: {
        module: this.config.module,
        action: this.config.action,
        ...(this.config.auth !== undefined && { auth: String(this.config.auth) }),
        ...this.queryParams,
      },
    };
  }
}

/**
 * Create a new Nexus builder
 */
export function nexus(): NexusBuilder {
  return new NexusBuilder();
}

/**
 * Pre-configured builders for common operations
 */
export const NexusPresets = {
  /**
   * Get items with pagination
   */
  list: (module: APIModule, page = 0, size = 10) =>
    nexus().module(module).action("get").params({ page, size }),

  /**
   * Get a single item by ID
   */
  getById: (module: APIModule, id: number | string) =>
    nexus().module(module).action("get").param("id", id),

  /**
   * Search items
   */
  search: (module: APIModule, searchTerm: string, page = 0, size = 20) =>
    nexus()
      .module(module)
      .action("get")
      .params({ search: searchTerm, page, size }),

  /**
   * Create new item
   */
  create: (module: APIModule) => nexus().module(module).action("create"),

  /**
   * Update existing item
   */
  update: (module: APIModule, id: number | string) =>
    nexus().module(module).action("update").param("id", id),

  /**
   * Delete item
   */
  delete: (module: APIModule, id: number | string) =>
    nexus().module(module).action("delete").param("id", id),
};

/**
 * Quick helpers for common operations
 */
export const NexusHelpers = {
  /**
   * Build endpoint URL for inventory assets
   */
  inventoryAssets: {
    list: (filters?: { category?: string; status?: string; page?: number; size?: number }) =>
      nexus()
        .module("INVENTORY_ASSET")
        .action("get")
        .params(filters || {})
        .build(),

    search: (searchTerm: string) =>
      nexus()
        .module("INVENTORY_ASSET")
        .action("get")
        .param("search", searchTerm)
        .build(),

    create: () => nexus().module("INVENTORY_ASSET").action("create").build(),

    update: (id: number) =>
      nexus().module("INVENTORY_ASSET").action("update").param("id", id).build(),

    delete: (id: number) =>
      nexus().module("INVENTORY_ASSET").action("delete").param("id", id).build(),
  },

  /**
   * Build endpoint URL for products
   */
  products: {
    list: (page = 0, size = 10) =>
      NexusPresets.list("PRODUCT", page, size).build(),

    search: (searchTerm: string) =>
      NexusPresets.search("PRODUCT", searchTerm).build(),
  },

  /**
   * Build endpoint URL for orders
   */
  orders: {
    list: (page = 0, size = 10) =>
      NexusPresets.list("ORDERS", page, size).build(),

    getById: (orderId: string) =>
      NexusPresets.getById("ORDERS", orderId).build(),
  },

  /**
   * Build endpoint URL for employees
   */
  employees: {
    list: (page = 0, size = 10) =>
      NexusPresets.list("EMPLOYEE", page, size).build(),

    search: (searchTerm: string) =>
      NexusPresets.search("EMPLOYEE", searchTerm).build(),
  },

  /**
   * Build endpoint URL for transactions
   */
  transactions: {
    list: (filters?: { year?: number; month?: number; type?: string; category?: string; page?: number; size?: number }) =>
      nexus()
        .module("TRANSACTION")
        .action("get")
        .params(filters || {})
        .build(),

    search: (searchTerm: string) =>
      nexus()
        .module("TRANSACTION")
        .action("get")
        .param("search", searchTerm)
        .build(),

    create: () => nexus().module("TRANSACTION").action("create").build(),

    update: (id: string) =>
      nexus().module("TRANSACTION").action("update").param("id", id).build(),

    delete: (id: string) =>
      nexus().module("TRANSACTION").action("delete").param("id", id).build(),

    summary: (year?: number, month?: number) =>
      nexus()
        .module("TRANSACTION")
        .action("summary")
        .params({ year, month })
        .build(),
  },

  /**
   * Build endpoint URL for bank accounts
   */
  bankAccounts: {
    list: (page = 0, size = 10) =>
      NexusPresets.list("BANK_ACCOUNT", page, size).build(),

    search: (searchTerm: string) =>
      NexusPresets.search("BANK_ACCOUNT", searchTerm).build(),

    create: () => nexus().module("BANK_ACCOUNT").action("create").build(),

    update: (id: string) =>
      nexus().module("BANK_ACCOUNT").action("update").param("id", id).build(),

    delete: (id: string) =>
      nexus().module("BANK_ACCOUNT").action("delete").param("id", id).build(),

    balances: () => nexus().module("BANK_ACCOUNT").action("balances").build(),
  },
};

/**
 * Type-safe response wrapper
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
 * Common response types
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

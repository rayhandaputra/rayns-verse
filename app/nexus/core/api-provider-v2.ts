import { API_URL_V2, API_KEY } from "./config";
import { generateHeader } from "./helpers";

/**
 * APIProviderV2Builder — RESTful builder for apicore-latest
 *
 * Endpoint baru: https://data.kinau.web.id/apicore-latest
 * Routing: HTTP Method + /{table} (bukan POST + action di body)
 *
 * Perbedaan dengan APIProvider (api2):
 * - GET /{table}?filters  → SELECT
 * - POST /{table}         → INSERT / BULK INSERT / SELECT (auto-detect)
 * - PATCH /{table}        → UPDATE (wajib where)
 * - DELETE /{table}       → DELETE (wajib where)
 *
 * Usage:
 * ```ts
 * // SELECT dengan filter
 * await APIProviderV2(session)
 *   .Table("orders")
 *   .Select({ page: 0, size: 10, where: { status: "pending" } })
 *   .Result();
 *
 * // SELECT dengan include (relasi)
 * await APIProviderV2(session)
 *   .Table("orders")
 *   .Select({
 *     where: { status: "active" },
 *     include: [{ table: "order_items", alias: "items", foreign_key: "order_id", reference_key: "id", columns: ["product_name", "qty"] }],
 *     page: 0, size: 10
 *   })
 *   .Result();
 *
 * // INSERT
 * await APIProviderV2(session)
 *   .Table("orders")
 *   .Insert({ order_number: "ORD-999", status: "pending" })
 *   .Result();
 *
 * // BULK INSERT
 * await APIProviderV2(session)
 *   .Table("order_items")
 *   .BulkInsert({ rows: [...], updateOnDuplicate: true })
 *   .Result();
 *
 * // UPDATE
 * await APIProviderV2(session)
 *   .Table("orders")
 *   .Update({ data: { status: "confirmed" }, where: { id: 123 } })
 *   .Result();
 *
 * // DELETE
 * await APIProviderV2(session)
 *   .Table("orders")
 *   .Delete({ where: { id: 123 } })
 *   .Result();
 * ```
 */

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface SelectParams {
  page?: number;
  size?: number;
  where?: Record<string, any>;
  columns?: string[];
  search?: string;
  searchBy?: string;
  orderBy?: [string, string];
  groupBy?: string[];
  include?: Array<{
    table: string;
    alias?: string;
    foreign_key: string;
    reference_key: string;
    columns: string[];
    where?: Record<string, any>;
  }>;
}

interface UpdateParams {
  data: Record<string, any>;
  where: Record<string, any>;
}

interface DeleteParams {
  where: Record<string, any>;
}

interface BulkInsertParams {
  rows: Record<string, any>[];
  updateOnDuplicate?: boolean;
  with_id?: boolean;
}

export class APIProviderV2Builder {
  private session: any;
  private table: string = "";
  private method: HttpMethod = "GET";
  private body: any = null;
  private queryParams: Record<string, string> = {};
  private maxRetries: number = 3;
  private retryDelay: number = 1000;
  private timeoutMs: number = 15000;

  constructor(session: any) {
    this.session = session;
  }

  /** Set target table */
  Table(table: string): this {
    this.table = table;
    return this;
  }

  /**
   * SELECT — GET (simple filters) or POST (with include/columns/orderBy)
   * Auto-detects: jika ada include/columns/orderBy/groupBy → POST, else → GET
   */
  Select(params: SelectParams = {}): this {
    const { include, columns, orderBy, groupBy, search, searchBy, ...rest } =
      params;
    const needsPost = include || columns || orderBy || groupBy || search;

    if (needsPost) {
      this.method = "POST";
      this.body = {
        ...(params.where && { where: params.where }),
        ...(include && { include }),
        ...(columns && { columns }),
        ...(orderBy && { orderBy }),
        ...(groupBy && { groupBy }),
        ...(search && { search }),
        ...(searchBy && { searchBy }),
        ...(params.page !== undefined && { page: params.page }),
        ...(params.size !== undefined && { size: params.size }),
      };
    } else {
      this.method = "GET";
      if (params.page !== undefined)
        this.queryParams.page = String(params.page);
      if (params.size !== undefined)
        this.queryParams.size = String(params.size);
      if (params.where) {
        for (const [key, value] of Object.entries(params.where)) {
          this.queryParams[key] = String(value);
        }
      }
    }
    return this;
  }

  /** INSERT — POST /{table} with data */
  Insert(data: Record<string, any>): this {
    this.method = "POST";
    this.body = { data };
    return this;
  }

  /** BULK INSERT — POST /{table} with rows */
  BulkInsert(params: BulkInsertParams): this {
    this.method = "POST";
    this.body = params;
    return this;
  }

  /** UPDATE — PATCH /{table} with data + where */
  Update(params: UpdateParams): this {
    this.method = "PATCH";
    this.body = params;
    return this;
  }

  /** DELETE — DELETE /{table} with where */
  Delete(params: DeleteParams): this {
    this.method = "DELETE";
    this.body = params;
    return this;
  }

  /** Upload file — POST /upload */
  Upload(formData: FormData): this {
    this.method = "POST";
    this.table = "upload";
    this.body = formData;
    return this;
  }

  /** Set retry configuration */
  Retry(maxRetries: number, delay: number = 1000): this {
    this.maxRetries = maxRetries;
    this.retryDelay = delay;
    return this;
  }

  /** Set request timeout in milliseconds */
  Timeout(ms: number): this {
    this.timeoutMs = ms;
    return this;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Execute the request and return the response */
  async Result(): Promise<any> {
    const isFormData = this.body && typeof this.body.append === "function";

    const headers: Record<string, string> = {
      ...generateHeader(this.session),
      Authorization: `Bearer ${API_KEY}`,
    };

    if (isFormData) {
      delete headers["Content-Type"];
      delete headers["content-type"];
    } else if (this.method !== "GET") {
      headers["Content-Type"] = "application/json";
    }

    let url = `${API_URL_V2}/${this.table}`;
    if (this.method === "GET" && Object.keys(this.queryParams).length > 0) {
      const qs = new URLSearchParams(this.queryParams).toString();
      url += `?${qs}`;
    }

    const fetchOptions: RequestInit = {
      method: this.method,
      headers,
    };

    if (this.method !== "GET" && this.body) {
      fetchOptions.body = isFormData ? this.body : JSON.stringify(this.body);
    }

    let lastError: any;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error_message || errorData.error || response.statusText;

          const errorObj = {
            status: response.status,
            message: errorMessage,
            attempt: attempt + 1,
          };

          if (
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 408 &&
            response.status !== 429
          ) {
            throw errorObj;
          }
          throw errorObj;
        }

        const result = await response.json();

        return {
          ...result?.data,
          status: response.status,
          success: response.status >= 200 && response.status < 300,
          error_message: result?.error_message || null,
        };
      } catch (error: any) {
        clearTimeout(timeoutId);
        lastError = error;

        if (
          error.status &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 408 &&
          error.status !== 429
        ) {
          break;
        }

        if (attempt === this.maxRetries - 1) break;

        const backoffTime = this.retryDelay * Math.pow(2, attempt);
        await this.sleep(backoffTime);
      }
    }

    throw lastError;
  }
}

/**
 * APIProviderV2 — RESTful API Provider for apicore-latest
 *
 * Usage:
 * ```ts
 * import { APIProviderV2 } from "~/nexus/core/api-provider-v2";
 *
 * // SELECT
 * const orders = await APIProviderV2(session)
 *   .Table("orders")
 *   .Select({ page: 0, size: 10, where: { status: "pending" } })
 *   .Result();
 *
 * // INSERT
 * const result = await APIProviderV2(session)
 *   .Table("users")
 *   .Insert({ name: "John", email: "john@mail.com" })
 *   .Result();
 *
 * // UPDATE
 * const result = await APIProviderV2(session)
 *   .Table("users")
 *   .Update({ data: { status: "inactive" }, where: { id: 42 } })
 *   .Result();
 *
 * // DELETE
 * const result = await APIProviderV2(session)
 *   .Table("users")
 *   .Delete({ where: { id: 42 } })
 *   .Result();
 * ```
 */
export const APIProviderV2 = (session: any) =>
  new APIProviderV2Builder(session);

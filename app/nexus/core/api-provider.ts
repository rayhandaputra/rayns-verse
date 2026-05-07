import { API_URL, API_KEY } from "./config";
import { generateHeader } from "./helpers";

/**
 * APIProviderBuilder - Builder pattern for API requests
 * Provides a fluid interface for constructing and executing API calls.
 * Now includes robust retry logic and timeouts.
 */
export class APIProviderBuilder {
  private session: any;
  private method: string = "POST";
  private action: string = "";
  private table: string = "";
  private payload: any = null;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;
  private timeout: number = 15000;

  constructor(session: any) {
    this.session = session;
  }

  /**
   * Set the endpoint details
   */
  Endpoint(method: string, action: string, table: string): this {
    this.method = method;
    this.action = action;
    this.table = table;
    return this;
  }

  /**
   * Set the payload data for the request
   */
  Data(payload: any): this {
    this.payload = payload;
    return this;
  }

  /**
   * Set retry configuration
   */
  Retry(maxRetries: number, delay: number = 1000): this {
    this.maxRetries = maxRetries;
    this.retryDelay = delay;
    return this;
  }

  /**
   * Set request timeout in milliseconds
   */
  Timeout(ms: number): this {
    this.timeout = ms;
    return this;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute the request and return the JSON response
   */
  async Result(): Promise<any> {
    let body: any;
    const headers: Record<string, string> = {
      ...generateHeader(this.session),
      Authorization: `Bearer ${API_KEY}`,
    };

    // Extremely robust check for FormData
    const isFormData = this.payload && (
      (typeof FormData !== 'undefined' && this.payload instanceof FormData) ||
      (this.payload.constructor && (this.payload.constructor.name === 'FormData' || this.payload.constructor.name === 'f')) ||
      (typeof this.payload.append === 'function' && typeof this.payload.get === 'function' && typeof this.payload.forEach === 'function') ||
      Object.prototype.toString.call(this.payload) === '[object FormData]'
    );

    if (isFormData) {
      body = this.payload;

      // Ensure table and action are present in FormData for routing if they aren't already
      if (this.table && !body.has("table")) {
        const t = this.table.replace(/^\//, "");
        if (t) body.append("table", t);
      }
      if (this.action && !body.has("action")) {
        body.append("action", this.action);
      }
      delete headers["Content-Type"];
      delete headers["content-type"]; // Jaga-jaga jika ada perbedaan case
      // For FormData, we must NOT set Content-Type header manually to allow fetch to set boundary
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({
        table: this.table?.replace(/^\//, ""),
        action: this.action,
        ...this.payload,
      });
    }

    let lastError: any;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const url = `${API_URL}${this.action}`;
        const response = await fetch(url, {
          method: "POST", // Proxied through POST
          headers,
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.message || response.statusText;

          const errorObj = {
            status: response.status,
            message: errorMessage,
            attempt: attempt + 1
          };

          // If 4xx (except 408/429), don't retry
          if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
            throw errorObj;
          }
          throw errorObj;
        }

        const result = await response.json();
        return result?.data;
      } catch (error: any) {
        console.log(error)
        clearTimeout(timeoutId);
        lastError = error;

        const isAbortError = error.name === "AbortError";
        const isLastAttempt = attempt === this.maxRetries - 1;

        if (error.status && error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
          // Client errors that are not timeouts or rate limits should not be retried
          break;
        }

        if (isLastAttempt) break;

        const backoffTime = this.retryDelay * Math.pow(2, attempt);
        console.warn(`[API Retry] Attempt ${attempt + 1} failed: ${error.message || "Timeout"}. Retrying in ${backoffTime}ms...`);
        await this.sleep(backoffTime);
      }
    }

    throw lastError;
  }
}

/**
 * Modern API Provider with builder pattern for client/server consumption
 * Usage: await APIProvider(session).Endpoint("POST", "user", "/users").Data(payload).Result();
 */
export const APIProvider = (session: any) => new APIProviderBuilder(session);

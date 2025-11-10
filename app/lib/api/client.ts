import { CONFIG } from "~/config";

export type ApiConfig = {
  endpoint: string;
  method?: string;
  table?: string | null;
  action?: string | null;
  query?: Record<string, any>;
  body?: Record<string, any> | FormData | null;
  headers?: Record<string, string>;
  auth?: boolean;
  formData?: boolean;
};

const API_BASE = CONFIG.apiBaseUrl.server_api_url;
const API_KEY = CONFIG.sessionSecret;

export async function APIProvider<T = any>(config: ApiConfig): Promise<T> {
  const {
    endpoint,
    method = "POST",
    table = null,
    action = null,
    query = {},
    body = null,
    headers = {},
    auth = true,
    formData = false,
  } = config;

  const queryString = new URLSearchParams(query).toString();
  const url = `${API_BASE}/${endpoint}${queryString ? `?${queryString}` : ""}`;

  const finalHeaders: Record<string, string> = {
    ...(formData ? {} : { "Content-Type": "application/json" }),
    ...(auth ? { Authorization: `Bearer ${API_KEY}` } : {}),
    ...headers,
  };

  let payload: any = null;

  if (formData && body instanceof FormData) {
    payload = body;
  } else if (body) {
    payload = JSON.stringify({ table, action, ...body });
  } else {
    payload = JSON.stringify({ table, action });
  }

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: method === "GET" ? undefined : payload,
  });
  // if (endpoint === "bulk-insert") console.log(res);

  if (!res.ok) {
    throw new Error(`API Error: ${await res.statusText}`);
  }

  return res.json() as Promise<T>;
}

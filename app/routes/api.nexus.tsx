// app/routes/api.nexus.tsx
/**
 * API Nexus - Universal API Gateway for Client-Side Data Fetching
 *
 * A centralized, flexible API route that acts as a bridge between
 * client-side components and server-side API modules.
 *
 * Features:
 * - Dynamic module routing (e.g., ?module=INVENTORY_ASSET&action=get)
 * - Automatic authentication handling
 * - Support for GET and POST methods
 * - Query parameter forwarding
 * - Type-safe module resolution
 * - Error handling with detailed responses
 *
 * Usage with useFetcherData:
 * ```tsx
 * const { data, loading } = useFetcherData({
 *   endpoint: "/api/nexus?module=INVENTORY_ASSET&action=get",
 *   params: { page: 0, size: 10, category: "Electronics" }
 * });
 * ```
 */

import type { LoaderFunction, ActionFunction } from "react-router";
import { requireAuth, getOptionalUser } from "~/lib/session.server";
import { API } from "~/lib/api";

interface NexusRequest {
  module: keyof typeof API;
  action: string;
  requiresAuth?: boolean;
}

/**
 * Validates and extracts nexus request parameters
 */
function parseNexusRequest(request: Request): NexusRequest {
  const url = new URL(request.url);
  const module = url.searchParams.get("module") as keyof typeof API;
  const action = url.searchParams.get("action") || "get";
  const requiresAuth = url.searchParams.get("auth") !== "false";

  if (!module) {
    throw new Response("Missing required parameter: module", { status: 400 });
  }

  if (!API[module]) {
    throw new Response(`Invalid module: ${module}`, { status: 400 });
  }

  return { module, action, requiresAuth };
}

/**
 * Extracts all query parameters except nexus-specific ones
 */
function extractQueryParams(request: Request): Record<string, any> {
  const url = new URL(request.url);
  const params: Record<string, any> = {};

  // Exclude nexus-specific params
  const excludeParams = ["module", "action", "auth"];

  url.searchParams.forEach((value, key) => {
    if (!excludeParams.includes(key)) {
      // Try to parse numbers
      if (!isNaN(Number(value)) && value !== "") {
        params[key] = Number(value);
      } else if (value === "true" || value === "false") {
        params[key] = value === "true";
      } else {
        params[key] = value;
      }
    }
  });

  return params;
}

/**
 * Executes API module action with proper context
 */
async function executeModuleAction(
  module: keyof typeof API,
  action: string,
  context: {
    session: any;
    req: any;
  }
) {
  const apiModule = API[module];

  if (typeof apiModule !== "object" || !apiModule) {
    throw new Response(`Module ${module} is not properly configured`, {
      status: 500,
    });
  }

  // @ts-ignore - Dynamic action resolution
  const actionFn = apiModule[action];

  if (typeof actionFn !== "function") {
    throw new Response(
      `Action '${action}' not found in module '${module}'`,
      { status: 404 }
    );
  }

  try {
    return await actionFn(context);
  } catch (error: any) {
    console.error(`[Nexus] Error in ${module}.${action}:`, error);
    throw new Response(error.message || "Internal server error", {
      status: 500,
    });
  }
}

/**
 * GET Handler - For read operations
 */
export const loader: LoaderFunction = async ({ request }) => {
  try {
    const { module, action, requiresAuth } = parseNexusRequest(request);
    const queryParams = extractQueryParams(request);

    // Handle authentication
    let auth;
    if (requiresAuth) {
      auth = await requireAuth(request);
    } else {
      auth = await getOptionalUser(request);
    }

    const { user = {}, token = null } = auth || {};

    // Execute the API call
    const result = await executeModuleAction(module, action, {
      session: { user, token },
      req: {
        query: queryParams,
      },
    });

    return Response.json({
      success: true,
      data: result,
      meta: {
        module,
        action,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    // Handle Remix redirects
    if (error instanceof Response) {
      throw error;
    }

    return Response.json(
      {
        success: false,
        error: error.message || "Unknown error occurred",
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: error.status || 500 }
    );
  }
};

/**
 * POST Handler - For create, update, delete operations
 */
export const action: ActionFunction = async ({ request }) => {
  try {
    const { module, action: actionName, requiresAuth } = parseNexusRequest(request);
    const queryParams = extractQueryParams(request);

    // Handle authentication
    let auth;
    if (requiresAuth) {
      auth = await requireAuth(request);
    } else {
      auth = await getOptionalUser(request);
    }

    const { user = {}, token = null } = auth || {};

    // Parse body for POST requests
    let body = {};
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      body = await request.json();
    } else if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      body = Object.fromEntries(formData);
    }

    // Execute the API call
    const result = await executeModuleAction(module, actionName, {
      session: { user, token },
      req: {
        query: queryParams,
        body,
      },
    });

    return Response.json({
      success: true,
      data: result,
      meta: {
        module,
        action: actionName,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    // Handle Remix redirects
    if (error instanceof Response) {
      throw error;
    }

    return Response.json(
      {
        success: false,
        error: error.message || "Unknown error occurred",
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: error.status || 500 }
    );
  }
};

/**
 * Resource Route: POST /api/fix-error
 *
 * Internal API bridge for the DB Self-Healing system.
 * Receives errorMessage from the front-end ErrorBoundary,
 * triggers the healing service, and returns JSON feedback.
 */

import type { ActionFunctionArgs } from "react-router";
import { healDatabaseError } from "~/utils/agent.server";

export async function action({ request }: ActionFunctionArgs) {
  // Only accept POST requests
  if (request.method !== "POST") {
    return Response.json(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    const body = await request.json();
    const { errorMessage } = body;

    if (!errorMessage || typeof errorMessage !== "string") {
      return Response.json(
        { success: false, error: "Missing or invalid errorMessage" },
        { status: 400 }
      );
    }

    // Validate that this looks like a DB structural error
    const dbErrorPatterns = [
      "SQLSTATE",
      "Unknown column",
      "Table doesn't exist",
      "table doesn't exist",
      "Base table or view not found",
      "Column not found",
      "Undefined column",
      "no such table",
      "no such column",
    ];

    const isDbError = dbErrorPatterns.some((pattern) =>
      errorMessage.includes(pattern)
    );

    if (!isDbError) {
      return Response.json(
        {
          success: false,
          error: "Error does not appear to be a structural database issue",
        },
        { status: 422 }
      );
    }

    // Execute healing
    const result = await healDatabaseError(errorMessage);

    return Response.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error: any) {
    console.error("[api.fix-error] Unhandled error:", error);
    return Response.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Block GET requests
export function loader() {
  return Response.json(
    { error: "This endpoint only accepts POST requests" },
    { status: 405 }
  );
}

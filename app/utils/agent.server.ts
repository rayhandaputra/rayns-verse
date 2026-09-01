/**
 * Healing Worker Service — Server-only
 *
 * LLM Orchestration Engine that:
 * 1. Receives raw SQL exceptions from the client-side ErrorBoundary
 * 2. Constructs a strict prompt to Google AI Studio (Gemini Flash)
 * 3. Extracts the raw DDL string from the AI response
 * 4. Pipes the corrective query to the external bridge execution API
 */

import { fetchCurl } from "./api.server";

// ─── Configuration ───────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const BRIDGE_ENDPOINT = "https://data.kinau.web.id/apicore/agent-schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HealingResult {
  success: boolean;
  ddl?: string;
  bridgeResponse?: any;
  error?: string;
}

// ─── Prompt Engineering ──────────────────────────────────────────────────────

function buildHealingPrompt(errorMessage: string): string {
  return `You are a Senior MySQL Database Architect. Your ONLY job is to generate a single corrective DDL statement that fixes the structural database error described below.

RULES — STRICTLY FOLLOW:
1. Output ONLY the raw SQL DDL statement. No markdown, no backticks, no explanation, no prose.
2. The DDL must be a valid MySQL statement (ALTER TABLE, CREATE TABLE, ADD INDEX, etc.).
3. Use safe defaults: VARCHAR(255), NULL, appropriate AFTER clauses.
4. If the error mentions a missing column, generate ALTER TABLE ... ADD COLUMN.
5. If the error mentions a missing table, generate CREATE TABLE with reasonable columns.
6. If the error is ambiguous or not a structural DB error, output exactly: SKIP
7. Never output DROP, TRUNCATE, or DELETE statements.
8. Never wrap output in quotes or code fences.

ERROR MESSAGE:
${errorMessage}

OUTPUT (raw DDL only):`;
}

// ─── Core Healing Logic ──────────────────────────────────────────────────────

/**
 * Queries Gemini Flash to generate a corrective DDL, then executes it
 * via the external bridge API.
 */
export async function healDatabaseError(
  errorMessage: string,
): Promise<HealingResult> {
  if (!GEMINI_API_KEY) {
    return { success: false, error: "GEMINI_API_KEY is not configured" };
  }

  // ─── Step 1: Query Gemini Flash ────────────────────────────────────────────

  const prompt = buildHealingPrompt(errorMessage);

  let ddl: string;

  try {
    const geminiResponse = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
          topP: 0.8,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.text();
      return {
        success: false,
        error: `Gemini API error (${geminiResponse.status}): ${errBody}`,
      };
    }

    const geminiData = await geminiResponse.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!rawText || rawText === "SKIP") {
      return {
        success: false,
        error:
          rawText === "SKIP"
            ? "AI determined this is not a structural DB error"
            : "AI returned empty response",
      };
    }

    // Sanitize: strip any accidental markdown fences or quotes
    ddl = rawText
      .replace(/^```(sql)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .replace(/^["'`]+|["'`]+$/g, "")
      .trim();

    // Safety check: reject destructive statements
    const destructivePattern = /^\s*(DROP|TRUNCATE|DELETE)\s/i;
    if (destructivePattern.test(ddl)) {
      return {
        success: false,
        error: "AI generated a destructive statement — blocked for safety",
        ddl,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Gemini request failed: ${error.message}`,
    };
  }

  // ─── Step 2: Execute DDL via Bridge API ────────────────────────────────────

  try {
    const bridgeResult = await fetchCurl(BRIDGE_ENDPOINT, {
      method: "POST",
      body: { sql: ddl },
    });

    if (!bridgeResult.ok) {
      return {
        success: false,
        ddl,
        error: `Bridge execution failed: ${bridgeResult.error}`,
        bridgeResponse: bridgeResult.data,
      };
    }

    return {
      success: true,
      ddl,
      bridgeResponse: bridgeResult.data,
    };
  } catch (error: any) {
    return {
      success: false,
      ddl,
      error: `Bridge request failed: ${error.message}`,
    };
  }
}

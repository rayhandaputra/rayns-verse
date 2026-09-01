/**
 * AI Agent Bridge Module — Server-only
 *
 * Provides functions for AI to execute raw SQL queries against the database
 * via the Core REST API Engine's Agent endpoints.
 *
 * Base URL: https://data.kinau.web.id/apicore
 * Requires dual auth: Bearer API_KEY + x-agent-key AGENT_KEY
 *
 * ⚠️ FULL DB ACCESS — Use with extreme caution.
 */

const AGENT_BASE_URL = "https://data.kinau.web.id/apicore";
const AGENT_API_KEY = "REPLACE_WITH_STRONG_KEY";
const AGENT_KEY = "REPLACE_WITH_AGENT_KEY";

function getAgentHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${AGENT_API_KEY}`,
    "x-agent-key": AGENT_KEY,
  };
}

export interface AgentQueryResult {
  success: boolean;
  type?: "query" | "execute";
  rows?: any[];
  row_count?: number;
  affected_rows?: number;
  error?: string;
}

export interface AgentSchemaResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface AgentTablesResult {
  success: boolean;
  data?: Array<{
    table: string;
    rows: number;
    data_size: number;
    comment: string;
  }>;
  error?: string;
}

export const AgentAPI = {
  /**
   * Execute raw SQL query (single or batch)
   *
   * @example Single query
   * AgentAPI.query({ sql: "SELECT * FROM users WHERE status = 'active' LIMIT 10" })
   *
   * @example Batch queries
   * AgentAPI.query({ sql: ["SHOW TABLES", "DESCRIBE users", "SELECT COUNT(*) FROM orders"] })
   *
   * @example DDL
   * AgentAPI.query({ sql: "ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL" })
   */
  query: async ({
    sql,
  }: {
    sql: string | string[];
  }): Promise<AgentQueryResult | AgentQueryResult[]> => {
    try {
      const response = await fetch(`${AGENT_BASE_URL}/agent-query`, {
        method: "POST",
        headers: getAgentHeaders(),
        body: JSON.stringify({ sql }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error:
            errorData.error_message ||
            `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const result = await response.json();
      const data = result.data;

      // Check for API-level error
      if (result.error_message) {
        return { success: false, error: result.error_message };
      }

      // Batch query returns array in data
      if (Array.isArray(data)) {
        return data.map((r: any) => ({
          success: true,
          type: r.type,
          rows: r.rows,
          row_count: r.row_count,
          affected_rows: r.affected_rows,
        }));
      }

      return {
        success: data?.success !== false,
        type: data?.type,
        rows: data?.rows,
        row_count: data?.row_count,
        affected_rows: data?.affected_rows,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get database schema (tables + columns + types + indexes)
   *
   * @example All tables
   * AgentAPI.schema({})
   *
   * @example Specific tables
   * AgentAPI.schema({ tables: ["users", "orders"] })
   */
  schema: async ({
    tables,
  }: {
    tables?: string[];
  } = {}): Promise<AgentSchemaResult> => {
    try {
      const body: any = {};
      if (tables && tables.length > 0) {
        body.tables = tables;
      }

      const response = await fetch(`${AGENT_BASE_URL}/agent-schema`, {
        method: "POST",
        headers: getAgentHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error:
            errorData.error_message ||
            `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const result = await response.json();
      if (result.error_message) {
        return { success: false, error: result.error_message };
      }
      return { success: true, data: result.data ?? result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * List all tables with row count & size
   *
   * @example
   * AgentAPI.tables()
   */
  tables: async (): Promise<AgentTablesResult> => {
    try {
      const response = await fetch(`${AGENT_BASE_URL}/agent-tables`, {
        method: "POST",
        headers: getAgentHeaders(),
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error:
            errorData.error_message ||
            `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const result = await response.json();
      if (result.error_message) {
        return { success: false, error: result.error_message };
      }
      return { success: true, data: result.data ?? result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

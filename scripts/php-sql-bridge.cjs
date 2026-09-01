#!/usr/bin/env node
/**
 * PHP-SQL-Bridge MCP Server Wrapper
 *
 * Implements a compliant stdio-based Model Context Protocol (MCP) server.
 * Intercepts tools/list and tools/call JSON-RPC messages and pipes queries
 * to the remote PHP DB Bridge REST API.
 */

const https = require("https");

// --- Configuration ---
const ENDPOINT = "https://data.kinau.web.id/apicore/agent-query";
const AGENT_KEY = "REPLACE_WITH_AGENT_KEY";
const AUTH_TOKEN = "REPLACE_WITH_STRONG_KEY";

// Standard Logging (Stdio MCP servers must ONLY write JSON-RPC to stdout, logs go to stderr)
function log(...args) {
  process.stderr.write(`[PHP-SQL-Bridge] ${args.join(" ")}\n`);
}

// Helper to make HTTPS POST request
function makeRequest(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT);
    const postData = JSON.stringify({ sql });

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-key": AGENT_KEY,
        Authorization: `Bearer ${AUTH_TOKEN}`,
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// Buffer to store incoming chunks
let buffer = "";

process.stdin.on("data", (chunk) => {
  buffer += chunk.toString();
  let lineEnd;
  while ((lineEnd = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, lineEnd).trim();
    buffer = buffer.slice(lineEnd + 1);
    if (line) {
      try {
        const request = JSON.parse(line);
        handleRequest(request);
      } catch (err) {
        log("Error parsing JSON-RPC request:", err.message);
      }
    }
  }
});

async function handleRequest(req) {
  const { method, id, params } = req;

  if (method === "initialize") {
    sendResponse(id, {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: { name: "php-sql-bridge", version: "1.0.0" },
    });
    return;
  }

  if (method === "tools/list") {
    sendResponse(id, {
      tools: [
        {
          name: "execute_sql_query",
          description:
            "Gunakan tool ini untuk mengeksekusi query SQL (SELECT, INSERT, UPDATE, dll.) langsung ke database shared hosting.",
          inputSchema: {
            type: "object",
            properties: {
              sql: {
                type: "string",
                description:
                  "Kueri SQL murni yang ingin dieksekusi (contoh: SELECT * FROM users LIMIT 5;)",
              },
            },
            required: ["sql"],
          },
        },
      ],
    });
    return;
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params || {};
    if (name === "execute_sql_query") {
      const sql = args?.sql || args?.query;
      if (!sql) {
        sendError(id, -32602, 'Parameter "sql" is required');
        return;
      }

      log(`Executing query: ${sql}`);
      try {
        const response = await makeRequest(sql);
        if (response.status !== 200 || response.error_message) {
          sendResponse(id, {
            content: [
              {
                type: "text",
                text: `Error from DB Engine: ${response.error_message || "Unknown server error"}`,
              },
            ],
            isError: true,
          });
        } else {
          sendResponse(id, {
            content: [
              {
                type: "text",
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          });
        }
      } catch (err) {
        log(`Request failed: ${err.message}`);
        sendResponse(id, {
          content: [
            {
              type: "text",
              text: `Bridge network error: ${err.message}`,
            },
          ],
          isError: true,
        });
      }
    } else {
      sendError(id, -32601, `Tool not found: ${name}`);
    }
    return;
  }

  // Unhandled standard notifications/requests
  if (id !== undefined) {
    sendError(id, -32601, `Method not implemented: ${method}`);
  }
}

function sendResponse(id, result) {
  const response = { jsonrpc: "2.0", id, result };
  process.stdout.write(JSON.stringify(response) + "\n");
}

function sendError(id, code, message) {
  const response = { jsonrpc: "2.0", id, error: { code, message } };
  process.stdout.write(JSON.stringify(response) + "\n");
}

log("PHP-SQL-Bridge MCP Server started on stdio");

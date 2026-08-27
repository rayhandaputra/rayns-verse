#!/usr/bin/env node

/**
 * Node.js Stdio MCP Wrapper for Custom cPanel Bridge
 */

const https = require("https");
const http = require("http");

// =========================================================================
// CONFIGURATION (SESUAIKAN DENGAN URL CPANEL & TOKEN ANDA)
// =========================================================================
const BRIDGE_URL = "https://data.kinau.web.id/agent-bridge.php";
const AUTH_TOKEN =
  "GANTI_DENGAN_TOKEN_RAHASIA_ANDA_YANG_SANGAT_PANJANG_DAN_ACAK";

function logError(...args) {
  process.stderr.write(`[cPanel-Bridge-MCP] ${args.join(" ")}\n`);
}

// Helper untuk hit API Bridge cPanel
function callRemoteBridge(action, params) {
  return new Promise((resolve, reject) => {
    const url = new URL(BRIDGE_URL);
    const postData = JSON.stringify({ action, params });

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const client = url.protocol === "https:" ? https : http;
    const req = client.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Gagal parse JSON dari cPanel: ${data}`));
        }
      });
    });

    req.on("error", (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

// Buffer input Stream untuk Stdio
let buffer = "";
process.stdin.on("data", (chunk) => {
  buffer += chunk.toString();
  let lineEnd;
  while ((lineEnd = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, lineEnd).trim();
    buffer = buffer.slice(lineEnd + 1);
    if (line) {
      try {
        handleRequest(JSON.parse(line));
      } catch (err) {
        logError("Error parsing JSON-RPC request:", err.message);
      }
    }
  }
});

async function handleRequest(req) {
  const { method, id, params } = req;

  if (method === "initialize") {
    sendResponse(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "cpanel-custom-bridge", version: "1.0.0" },
    });
    return;
  }

  if (method === "tools/list") {
    sendResponse(id, {
      tools: [
        {
          name: "cpanel_write_file",
          description:
            "Membuat file baru atau menimpa file lama di dalam project workspace cPanel.",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Relative path file, misal: v1/auth.php",
              },
              content: {
                type: "string",
                description: "Isi source code program lengkap",
              },
            },
            required: ["path", "content"],
          },
        },
        {
          name: "cpanel_read_file",
          description: "Membaca isi source code dari file tertentu di cPanel.",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Relative path file, misal: config/db.php",
              },
            },
            required: ["path"],
          },
        },
        {
          name: "cpanel_list_directory",
          description:
            "Melihat daftar file dan struktur folder di dalam workspace project cPanel.",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description:
                  "Relative path folder, kosongkan untuk root workspace",
              },
            },
          },
        },
      ],
    });
    return;
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params || {};
    let bridgeAction = "";

    if (name === "cpanel_write_file") bridgeAction = "write_file";
    else if (name === "cpanel_read_file") bridgeAction = "read_file";
    else if (name === "cpanel_list_directory") bridgeAction = "list_directory";

    if (bridgeAction) {
      try {
        const response = await callRemoteBridge(bridgeAction, args);
        if (response.status === "success") {
          let textResult = "";
          if (response.content !== undefined) {
            textResult =
              typeof response.content === "string"
                ? response.content
                : JSON.stringify(response.content, null, 2);
          } else if (response.message !== undefined) {
            textResult = response.message;
          } else if (response.data !== undefined) {
            textResult =
              typeof response.data === "string"
                ? response.data
                : JSON.stringify(response.data, null, 2);
          }
          sendResponse(id, {
            content: [{ type: "text", text: textResult }],
          });
        } else {
          sendResponse(id, {
            content: [
              {
                type: "text",
                text: `cPanel Bridge Error: ${response.message}`,
              },
            ],
            isError: true,
          });
        }
      } catch (err) {
        sendResponse(id, {
          content: [{ type: "text", text: `Network Error: ${err.message}` }],
          isError: true,
        });
      }
    } else {
      sendError(id, -32601, `Tool not found: ${name}`);
    }
    return;
  }

  if (id !== undefined) {
    sendError(id, -32601, `Method not implemented: ${method}`);
  }
}

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

function sendError(id, code, message) {
  process.stdout.write(
    JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n",
  );
}

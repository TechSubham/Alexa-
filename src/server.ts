import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerPantryTools } from "./tools/pantry.js";
import { registerSessionTools } from "./tools/session.js";

const SUPPORTED_PROTOCOL_VERSION = "2025-11-25";
const ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000", "http://127.0.0.1:6274"];

function buildServer() {
  const server = new McpServer({ name: "kitchen-copilot", version: "0.1.0" });
  registerPantryTools(server);
  registerSessionTools(server);
  return server;
}

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ jsonrpc: "2.0", error: { code: -32000, message: "Forbidden: invalid origin" } });
  }

  const clientVersion = req.headers["mcp-protocol-version"];
  if (clientVersion && clientVersion !== SUPPORTED_PROTOCOL_VERSION) {
    return res.status(400).json({ jsonrpc: "2.0", error: { code: -32000, message: `Unsupported protocol version: ${clientVersion}` } });
  }

  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(3000, "127.0.0.1", () => {
  console.log("Kitchen Copilot MCP server on http://127.0.0.1:3000/mcp");
});

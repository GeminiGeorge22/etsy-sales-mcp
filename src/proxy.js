// Stdio-to-remote MCP proxy.
// Exposes the tools of a remote MCP server (Apify's hosted gateway) over stdio,
// so clients that only speak stdio can use them. All calls are forwarded as-is.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

export const APIFY_MCP_BASE = "https://mcp.apify.com/";

/** Build the Apify MCP gateway URL for a list of Actor ids ("owner/name"). */
export function buildRemoteUrl(actors, base = APIFY_MCP_BASE) {
  if (!Array.isArray(actors) || actors.length === 0) {
    throw new Error("at least one Actor id is required");
  }
  for (const a of actors) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(a)) throw new Error(`invalid Actor id: ${a}`);
  }
  const url = new URL(base);
  url.searchParams.set("tools", actors.join(","));
  // Keep the comma readable; Apify accepts both forms.
  return url.toString().replace(/%2F/g, "/").replace(/%2C/g, ",");
}

/**
 * Read settings from an env object. The token is the caller's own Apify token;
 * it is only ever placed in the Authorization header, never logged.
 */
export function readConfig(env, defaults) {
  const token = (env.APIFY_TOKEN || "").trim();
  if (!token) {
    throw new Error(
      "APIFY_TOKEN is not set. Create a token at https://console.apify.com/settings/integrations and pass it in the env block of your MCP client config."
    );
  }
  const actors = env.APIFY_ACTORS
    ? env.APIFY_ACTORS.split(",").map((s) => s.trim()).filter(Boolean)
    : defaults.actors;
  const url = env.APIFY_MCP_URL || buildRemoteUrl(actors);
  return { token, url, actors };
}

/** Request options for the remote transport (auth header only). */
export function remoteRequestInit(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/**
 * Create a stdio-facing MCP server that forwards tools/list and tools/call
 * to `remote`, an already-connected MCP Client.
 */
export function createProxyServer(remote, { name, version }) {
  const server = new Server(
    { name, version },
    { capabilities: { tools: {} } }
  );
  server.setRequestHandler(ListToolsRequestSchema, async (req) => {
    return remote.listTools(req.params);
  });
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    return remote.callTool(req.params);
  });
  return server;
}

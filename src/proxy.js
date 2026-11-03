// Stdio MCP server for a fixed set of Apify Actors.
// initialize and tools/list are answered locally from the checked-in tools.json (no token, no network).
// tools/call is forwarded to Apify's hosted MCP gateway (mcp.apify.com) with the caller's own APIFY_TOKEN.
import { readFileSync } from "node:fs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { actorNameToToolName } from "./tool-names.js";

export { actorNameToToolName };

export const APIFY_MCP_BASE = "https://mcp.apify.com/";

export const MISSING_TOKEN_MESSAGE =
  "APIFY_TOKEN is not set. Listing tools works without a token, but running one starts an Apify Actor run on your own Apify account. " +
  "Create a token at https://console.apify.com/settings/integrations and pass it as APIFY_TOKEN in the env block of your MCP client config.";

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
 * Read settings from an env object. The token is optional: without it the server still starts and lists tools.
 * The token is the caller's own Apify token; it is only ever placed in the Authorization header, never logged.
 */
export function readConfig(env, defaults) {
  const token = (env.APIFY_TOKEN || "").trim() || null;
  const actorsOverridden = Boolean(env.APIFY_ACTORS && env.APIFY_ACTORS.trim());
  const actors = actorsOverridden
    ? env.APIFY_ACTORS.split(",").map((s) => s.trim()).filter(Boolean)
    : defaults.actors;
  const urlOverridden = Boolean(env.APIFY_MCP_URL);
  const url = env.APIFY_MCP_URL || buildRemoteUrl(actors);
  return { token, url, actors, overridden: actorsOverridden || urlOverridden };
}

/** Request options for the remote transport (auth header only). */
export function remoteRequestInit(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/** Load the static tool list (tools.json at the package root). */
export function loadStaticTools(path = new URL("../tools.json", import.meta.url)) {
  const doc = JSON.parse(readFileSync(path, "utf8"));
  if (!doc || !Array.isArray(doc.tools)) throw new Error("tools.json has no tools array");
  return doc.tools;
}

/** Static tools for the configured Actors, in the configured order. */
export function selectTools(tools, actors) {
  const byName = new Map(tools.map((t) => [t.name, t]));
  return actors.map((a) => byName.get(actorNameToToolName(a))).filter(Boolean);
}

function errorResult(text) {
  return { isError: true, content: [{ type: "text", text }] };
}

/**
 * Create the stdio-facing MCP server.
 * - tools: static tool definitions served for tools/list.
 * - getRemote(): async, returns a connected MCP Client for the gateway; throws if no token.
 * - listFromRemote: when true (custom APIFY_ACTORS / APIFY_MCP_URL with a token), tools/list is forwarded.
 */
export function createProxyServer({ name, version, tools, getRemote, listFromRemote = false }) {
  const server = new Server(
    { name, version },
    {
      capabilities: { tools: {} },
      instructions:
        "Each tool runs one Apify Actor and returns its dataset rows. Tool listing needs no credentials; " +
        "calling a tool needs the user's own APIFY_TOKEN and starts an Actor run billed to that Apify account.",
    }
  );
  const known = new Set(tools.map((t) => t.name));

  server.setRequestHandler(ListToolsRequestSchema, async (req) => {
    if (listFromRemote) {
      try {
        const remote = await getRemote();
        return await remote.listTools(req.params);
      } catch {
        // fall back to the static list
      }
    }
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const toolName = req.params?.name;
    if (!listFromRemote && !known.has(toolName)) {
      return errorResult(`Unknown tool "${toolName}". Available tools: ${[...known].join(", ")}`);
    }
    let remote;
    try {
      remote = await getRemote();
    } catch (err) {
      return errorResult(err && err.code === "NO_TOKEN" ? MISSING_TOKEN_MESSAGE : `Could not reach the Apify MCP gateway: ${err.message}`);
    }
    return remote.callTool(req.params);
  });
  return server;
}

/** Lazily connect once; retry on the next call if the connection failed. */
export function lazyRemote(cfg, connect) {
  let pending = null;
  const get = async () => {
    if (!cfg.token) {
      const e = new Error(MISSING_TOKEN_MESSAGE);
      e.code = "NO_TOKEN";
      throw e;
    }
    if (!pending) {
      pending = connect(cfg).catch((err) => {
        pending = null;
        throw err;
      });
    }
    return pending;
  };
  // The connection if one was started, without starting one.
  get.peek = () => pending;
  return get;
}

#!/usr/bin/env node
// Entry point: stdio MCP server. Lists tools from tools.json; forwards tools/call to Apify's hosted MCP gateway.
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  createProxyServer,
  lazyRemote,
  loadStaticTools,
  readConfig,
  remoteRequestInit,
  selectTools,
} from "./proxy.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

async function connectRemote(cfg) {
  const remote = new Client({ name: `${pkg.name}-proxy`, version: pkg.version });
  await remote.connect(
    new StreamableHTTPClientTransport(new URL(cfg.url), {
      requestInit: remoteRequestInit(cfg.token),
    })
  );
  return remote;
}

async function main() {
  const cfg = readConfig(process.env, pkg.mcpProxy);
  const tools = selectTools(loadStaticTools(), cfg.actors);
  const getRemote = lazyRemote(cfg, connectRemote);
  const server = createProxyServer({
    name: pkg.name,
    version: pkg.version,
    tools,
    getRemote,
    listFromRemote: cfg.overridden && Boolean(cfg.token),
  });
  await server.connect(new StdioServerTransport());
  if (!cfg.token) {
    console.error(`[${pkg.name}] APIFY_TOKEN not set: tools can be listed, tool calls will return an error until it is set.`);
  }
  const shutdown = async () => {
    try {
      const pending = getRemote.peek();
      if (pending) await (await pending).close();
    } catch {}
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(`[${pkg.name}] failed to start: ${err.message}`);
  process.exit(1);
});

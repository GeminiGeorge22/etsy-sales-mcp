#!/usr/bin/env node
// Entry point: stdio MCP server that proxies to Apify's hosted MCP gateway.
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createProxyServer, readConfig, remoteRequestInit } from "./proxy.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const defaults = pkg.mcpProxy;

async function main() {
  let cfg;
  try {
    cfg = readConfig(process.env, defaults);
  } catch (err) {
    console.error(`[${pkg.name}] ${err.message}`);
    process.exit(1);
  }
  const remote = new Client({ name: `${pkg.name}-proxy`, version: pkg.version });
  await remote.connect(
    new StreamableHTTPClientTransport(new URL(cfg.url), {
      requestInit: remoteRequestInit(cfg.token),
    })
  );
  const server = createProxyServer(remote, { name: pkg.name, version: pkg.version });
  await server.connect(new StdioServerTransport());
  const shutdown = async () => {
    await remote.close().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(`[${pkg.name}] failed to start: ${err.message}`);
  process.exit(1);
});

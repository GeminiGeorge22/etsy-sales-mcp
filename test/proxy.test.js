// No network and no real token: the remote gateway is an in-memory mock, and the stdio test
// runs the server with APIFY_TOKEN removed from its environment.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  actorNameToToolName,
  buildRemoteUrl,
  createProxyServer,
  lazyRemote,
  loadStaticTools,
  readConfig,
  remoteRequestInit,
  selectTools,
} from "../src/proxy.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const actors = pkg.mcpProxy.actors;
const staticTools = selectTools(loadStaticTools(), actors);

async function mockRemote(calls) {
  const mock = new Server({ name: "mock-apify", version: "0.0.0" }, { capabilities: { tools: {} } });
  mock.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: actors.map((a) => ({ name: actorNameToToolName(a), description: `mock ${a}`, inputSchema: { type: "object" } })),
  }));
  mock.setRequestHandler(CallToolRequestSchema, async (req) => {
    calls.push(req.params);
    return { content: [{ type: "text", text: `ok:${req.params.name}` }] };
  });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await mock.connect(a);
  const remote = new Client({ name: "proxy-under-test", version: "0.0.0" });
  await remote.connect(b);
  return remote;
}

async function connectProxy({ token, remote }) {
  let connects = 0;
  const getRemote = lazyRemote({ token }, async () => {
    connects++;
    return remote;
  });
  const proxy = createProxyServer({ name: pkg.name, version: pkg.version, tools: staticTools, getRemote });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await proxy.connect(a);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(b);
  return { client, connects: () => connects };
}

test("tool names follow Apify's owner--actor-name pattern", () => {
  assert.equal(actorNameToToolName("publicrecords/sports-odds-api"), "publicrecords--sports-odds-api");
  assert.equal(actorNameToToolName("caffein.dev/ebay-sold-listings"), "caffein-dot-dev--ebay-sold-listings");
  const long = actorNameToToolName(`a/${"x".repeat(80)}`);
  assert.equal(long.length, 64);
});

test("tools.json has one well-formed tool per Actor, in package order", () => {
  assert.deepEqual(staticTools.map((t) => t.name), actors.map(actorNameToToolName));
  for (const t of staticTools) {
    assert.ok(t.description.length > 80, `${t.name} description too short`);
    assert.match(t.description, /When to use:/);
    assert.equal(t.inputSchema.type, "object");
    assert.equal(typeof t.inputSchema.properties, "object");
    for (const r of t.inputSchema.required || []) assert.ok(r in t.inputSchema.properties, `${t.name}: ${r}`);
    assert.equal(t.annotations.readOnlyHint, true);
  }
});

test("buildRemoteUrl pins the package's Actors", () => {
  assert.equal(buildRemoteUrl(actors), `https://mcp.apify.com/?tools=${actors.join(",")}`);
});

test("buildRemoteUrl rejects bad Actor ids", () => {
  assert.throws(() => buildRemoteUrl([]));
  assert.throws(() => buildRemoteUrl(["no-slash"]));
  assert.throws(() => buildRemoteUrl(["a/b?x=1"]));
});

test("readConfig does not require a token", () => {
  assert.equal(readConfig({}, pkg.mcpProxy).token, null);
  assert.equal(readConfig({ APIFY_TOKEN: "  " }, pkg.mcpProxy).token, null);
  const cfg = readConfig({ APIFY_TOKEN: "test-token" }, pkg.mcpProxy);
  assert.equal(cfg.token, "test-token");
  assert.equal(cfg.url, buildRemoteUrl(actors));
  assert.equal(cfg.overridden, false);
  const custom = readConfig({ APIFY_MCP_URL: "http://localhost:9/mcp" }, pkg.mcpProxy);
  assert.equal(custom.url, "http://localhost:9/mcp");
  assert.equal(custom.overridden, true);
});

test("token goes only into the Authorization header", () => {
  assert.deepEqual(remoteRequestInit("abc"), { headers: { Authorization: "Bearer abc" } });
});

test("tools/list is served locally without a token or a remote connection", async () => {
  const { client, connects } = await connectProxy({ token: null });
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name), actors.map(actorNameToToolName));
  assert.ok(tools[0].inputSchema.properties);
  assert.equal(connects(), 0);
});

test("tools/call without a token returns a clear error and never connects", async () => {
  const { client, connects } = await connectProxy({ token: null });
  const res = await client.callTool({ name: actorNameToToolName(actors[0]), arguments: {} });
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /APIFY_TOKEN is not set/);
  assert.equal(connects(), 0);
});

test("tools/call with a token forwards name and arguments unchanged", async () => {
  const calls = [];
  const { client, connects } = await connectProxy({ token: "test-token", remote: await mockRemote(calls) });
  const args = { example: "value", n: 3 };
  const res = await client.callTool({ name: actorNameToToolName(actors[0]), arguments: args });
  assert.equal(res.content[0].text, `ok:${actorNameToToolName(actors[0])}`);
  assert.deepEqual(calls[0].arguments, args);
  await client.callTool({ name: actorNameToToolName(actors[0]), arguments: args });
  assert.equal(connects(), 1);
});

test("unknown tool names are rejected locally", async () => {
  const { client } = await connectProxy({ token: "test-token", remote: await mockRemote([]) });
  const res = await client.callTool({ name: "nope--nothing", arguments: {} });
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /Unknown tool/);
});

test("stdio server: initialize + tools/list work with no APIFY_TOKEN", async () => {
  const env = { ...process.env };
  delete env.APIFY_TOKEN;
  env.APIFY_MCP_URL = "http://127.0.0.1:9/never-used";
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL("../src/server.js", import.meta.url))],
    env,
    stderr: "pipe",
  });
  const client = new Client({ name: "stdio-test", version: "0.0.0" });
  await client.connect(transport);
  assert.equal(client.getServerVersion().name, pkg.name);
  const { tools } = await client.listTools();
  assert.equal(tools.length, actors.length);
  const res = await client.callTool({ name: tools[0].name, arguments: {} });
  assert.equal(res.isError, true);
  await client.close();
});

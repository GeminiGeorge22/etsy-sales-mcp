// Tests use an in-memory mock of the remote server. No network, no real token.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  buildRemoteUrl,
  readConfig,
  remoteRequestInit,
  createProxyServer,
} from "../src/proxy.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const actors = pkg.mcpProxy.actors;
const toolName = (a) => a.replace("/", "--");

async function mockRemote(calls) {
  const mock = new Server({ name: "mock-apify", version: "0.0.0" }, { capabilities: { tools: {} } });
  mock.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: actors.map((a) => ({
      name: toolName(a),
      description: `mock ${a}`,
      inputSchema: { type: "object", properties: {} },
    })),
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

async function connectProxy(remote) {
  const proxy = createProxyServer(remote, { name: pkg.name, version: pkg.version });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await proxy.connect(a);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(b);
  return client;
}

test("buildRemoteUrl pins the package's Actors", () => {
  const url = buildRemoteUrl(actors);
  assert.equal(url, `https://mcp.apify.com/?tools=${actors.join(",")}`);
});

test("buildRemoteUrl rejects bad Actor ids", () => {
  assert.throws(() => buildRemoteUrl([]));
  assert.throws(() => buildRemoteUrl(["no-slash"]));
  assert.throws(() => buildRemoteUrl(["a/b?x=1"]));
});

test("readConfig requires APIFY_TOKEN", () => {
  assert.throws(() => readConfig({}, pkg.mcpProxy), /APIFY_TOKEN/);
  assert.throws(() => readConfig({ APIFY_TOKEN: "  " }, pkg.mcpProxy), /APIFY_TOKEN/);
});

test("readConfig uses defaults and env overrides", () => {
  const cfg = readConfig({ APIFY_TOKEN: "test-token" }, pkg.mcpProxy);
  assert.equal(cfg.url, buildRemoteUrl(actors));
  const one = readConfig({ APIFY_TOKEN: "t", APIFY_ACTORS: actors[0] }, pkg.mcpProxy);
  assert.deepEqual(one.actors, [actors[0]]);
  const custom = readConfig({ APIFY_TOKEN: "t", APIFY_MCP_URL: "http://localhost:9/mcp" }, pkg.mcpProxy);
  assert.equal(custom.url, "http://localhost:9/mcp");
});

test("token goes only into the Authorization header", () => {
  assert.deepEqual(remoteRequestInit("abc"), { headers: { Authorization: "Bearer abc" } });
});

test("tools/list is forwarded from the remote", async () => {
  const client = await connectProxy(await mockRemote([]));
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name), actors.map(toolName));
});

test("tools/call forwards name and arguments unchanged", async () => {
  const calls = [];
  const client = await connectProxy(await mockRemote(calls));
  const args = { example: "value", n: 3 };
  const res = await client.callTool({ name: toolName(actors[0]), arguments: args });
  assert.equal(res.content[0].text, `ok:${toolName(actors[0])}`);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].arguments, args);
});

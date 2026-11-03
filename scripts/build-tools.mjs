#!/usr/bin/env node
// Builds tools.json from each Actor's PUBLIC Apify data (no token):
//   GET https://api.apify.com/v2/acts/<owner>~<name>                 (title, description)
//   GET https://api.apify.com/v2/acts/<owner>~<name>/builds/default  (input schema of the default build)
// Usage: node scripts/build-tools.mjs          -> write tools.json
//        node scripts/build-tools.mjs --check  -> exit 1 if tools.json differs from the live public schemas
//        node scripts/build-tools.mjs --check --tools <file> -> compare <file> instead of tools.json
//          (CI self-test: test/fixtures/tools.drift-fixture.json must make --check exit 1)
// Never sends an Authorization header; APIFY_TOKEN is ignored on purpose.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { actorNameToToolName } from "../src/tool-names.js";

const root = new URL("../", import.meta.url);
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
const meta = JSON.parse(readFileSync(new URL("tools.meta.json", root), "utf8"));
const API = "https://api.apify.com/v2";
const MAX_DESC = 500;

async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return (await res.json()).data;
    } catch (err) {
      if (attempt >= 3) throw err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

const clean = (s) =>
  String(s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const cap = (s, n = MAX_DESC) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

// Drop billing/marketing sentences so tool text describes behavior, not pricing.
function cleanActorText(s) {
  return clean(s)
    .replace(/\s*\((?:[^)]*pay per[^)]*)\)/gi, "")
    .split(/(?<=[.!?])\s+/)
    .filter((x) => !/pay[- ]per|\$|\bPPE\b|free trial|no limits!/i.test(x))
    .join(" ")
    .trim();
}

// Property help text: drop sentences that quote prices or billing units.
function cleanPropText(s) {
  return clean(s)
    .split(/(?<=[.!?])\s+(?=[A-Z(])/)
    .filter((x) => !/\$|pay[- ]per|\bPPE\b|free plan/i.test(x))
    .join(" ")
    .trim();
}

function itemType(prop) {
  if (prop.items && prop.items.type) return prop.items.type;
  if (prop.editor === "stringList" || prop.editor === "select") return "string";
  if (prop.editor === "requestListSources") return "object";
  const sample = [prop.default, prop.prefill].find((v) => Array.isArray(v) && v.length);
  if (sample) return typeof sample[0] === "object" ? "object" : typeof sample[0];
  return undefined;
}

function convertItems(prop) {
  const t = itemType(prop);
  const items = {};
  if (t) items.type = t;
  const src = prop.items || {};
  if (Array.isArray(src.enum)) items.enum = src.enum;
  if (prop.editor === "requestListSources") {
    items.type = "object";
    items.properties = { url: { type: "string", description: "URL to process." } };
    items.required = ["url"];
  } else if (src.properties) {
    items.properties = src.properties;
    if (src.required) items.required = src.required;
  }
  return items;
}

function convertProperty(prop) {
  const out = {};
  if (prop.title) out.title = clean(prop.title);
  let desc = cleanPropText(prop.description);
  if (Array.isArray(prop.enum) && Array.isArray(prop.enumTitles)) {
    const pairs = prop.enum.map((v, i) => `${v} = ${clean(prop.enumTitles[i])}`).join("; ");
    if (pairs.length < 300) desc = desc ? `${desc} Options: ${pairs}.` : `Options: ${pairs}.`;
  }
  if (prop.prefill !== undefined && prop.default === undefined) {
    const ex = JSON.stringify(prop.prefill);
    if (ex.length <= 160) desc = desc ? `${desc} Example: ${ex}` : `Example: ${ex}`;
  }
  if (desc) out.description = cap(desc);
  if (prop.type) out.type = prop.type;
  if (Array.isArray(prop.enum)) out.enum = prop.enum;
  for (const k of ["minimum", "maximum", "minItems", "maxItems", "pattern"]) {
    if (prop[k] !== undefined) out[k] = prop[k];
  }
  if (prop.default !== undefined) out.default = prop.default;
  if (prop.type === "array") {
    const items = convertItems(prop);
    if (Object.keys(items).length) out.items = items;
  }
  if (prop.type === "object") {
    if (prop.editor === "proxy") {
      out.properties = {
        useApifyProxy: {
          type: "boolean",
          description: "Use Apify Proxy for requests. Leave the default unless the Actor's README says otherwise.",
          default: true,
        },
      };
    } else if (prop.properties) {
      out.properties = prop.properties;
    }
  }
  return out;
}

function buildInputSchema(schema) {
  const props = (schema && schema.properties) || {};
  const properties = {};
  for (const [k, v] of Object.entries(props)) properties[k] = convertProperty(v);
  const required = (schema && Array.isArray(schema.required) ? schema.required : []).filter((r) => r in properties);
  const out = { type: "object", properties };
  if (required.length) out.required = required;
  return out;
}

function buildDescription(actorId, act, useWhen) {
  const title = cleanActorText(act.title || actorId);
  const what = cleanActorText(act.description || "");
  return [
    `${title}. ${what}`.trim(),
    useWhen ? `When to use: ${useWhen}` : null,
    "Returns: the run's dataset rows as structured JSON (one row per result), plus the run and dataset IDs for paging the full dataset.",
    `Behavior: starts one run of the Apify Actor "${actorId}" through Apify's hosted MCP gateway (mcp.apify.com) with your own APIFY_TOKEN; the run uses your Apify account. Read-only: it only reads public web data and changes nothing on the source site. Docs: https://apify.com/${actorId}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function buildTool(actorId) {
  const slug = actorId.replace("/", "~");
  const act = await getJson(`${API}/acts/${slug}`);
  const build = await getJson(`${API}/acts/${slug}/builds/default`);
  let schema = build.inputSchema;
  if (typeof schema === "string") schema = JSON.parse(schema);
  return {
    name: actorNameToToolName(actorId),
    title: cap(cleanActorText(act.title || actorId), 120),
    description: buildDescription(actorId, act, meta[actorId]),
    inputSchema: buildInputSchema(schema),
    annotations: {
      title: cap(cleanActorText(act.title || actorId), 120),
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  };
}

async function main() {
  const check = process.argv.includes("--check");
  const tools = [];
  for (const a of pkg.mcpProxy.actors) tools.push(await buildTool(a));
  const doc = {
    $comment:
      "Generated by scripts/build-tools.mjs from each Actor's public Apify input schema. Do not edit by hand; run `npm run build:tools`.",
    actors: pkg.mcpProxy.actors,
    tools,
  };
  const text = `${JSON.stringify(doc, null, 2)}\n`;
  const i = process.argv.indexOf("--tools");
  const path = i > 0 && process.argv[i + 1] ? new URL(process.argv[i + 1], new URL(`file://${process.cwd()}/`)) : new URL("tools.json", root);
  if (!check) {
    writeFileSync(path, text);
    console.log(`tools.json: ${tools.length} tools written`);
    return;
  }
  const current = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (current === text) {
    console.log(`${path.pathname.split("/").pop()} matches the live public input schemas (${tools.length} tools).`);
    return;
  }
  const old = current ? JSON.parse(current).tools || [] : [];
  const oldBy = new Map(old.map((t) => [t.name, JSON.stringify(t)]));
  const drifted = tools.filter((t) => oldBy.get(t.name) !== JSON.stringify(t)).map((t) => t.name);
  const removed = old.filter((t) => !tools.some((n) => n.name === t.name)).map((t) => t.name);
  console.error(`${path.pathname.split("/").pop()} drift detected. Changed: ${drifted.join(", ") || "none"}. Removed: ${removed.join(", ") || "none"}.`);
  console.error("Run `npm run build:tools`, review the diff and commit.");
  process.exit(1);
}

main().catch((err) => {
  console.error(`build-tools failed: ${err.message}`);
  process.exit(2);
});

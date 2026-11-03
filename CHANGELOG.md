# Changelog

All notable changes to this project. Dates are in ET.

## [python 0.2.1] - 2026-11-03

- Python package published on PyPI as `etsy-sales-mcp`: install with `uvx etsy-sales-mcp` or `pip install etsy-sales-mcp`.
- Python README carries the `mcp-name` line so the official MCP Registry can verify the PyPI package.
- `server.json` 1.0.2 adds the PyPI package (stdio) next to the hosted remote.
- `package.json` version follows the Python package to 0.2.1 (a test keeps the two in step); no Node.js code changes.

## [0.2.0] - 2026-11-02

- `tools/list` and `initialize` now work without a token: tools are served from a checked-in `tools.json` built from each Actor's public input schema (`npm run build:tools`). Tool names follow Apify's gateway pattern (`owner--actor-name`), with descriptions covering what each tool returns and when to use it.
- `tools/call` still goes to Apify's hosted MCP gateway with your own `APIFY_TOKEN`, connecting only on the first call; without a token it returns a clear error.
- CI job and weekly workflow that fail on drift between `tools.json` and the live public input schemas.
- Dockerfile copies `tools.json`, runs as the `node` user on Node 22.

## [0.1.0] - 2026-11-02

- Open-source stdio MCP server (Node.js) that proxies `tools/list` and `tools/call` to Apify's hosted MCP gateway, with tests and CI on Node 18/20/22.
- Dockerfile, glama.json, SECURITY.md and Dependabot config.

## Registry listing 1.0.1

- `server.json` published to the official MCP Registry as a Streamable HTTP remote.

# Etsy Search & Shop Sales MCP

**Languages:** English · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md)

**Etsy search** and **Etsy shop sales** data for CRMs, dashboards, research workflows, and AI assistants — live Etsy search listing rows plus shop sales counters — via [Apify’s hosted MCP](https://mcp.apify.com) or the Store Actors directly.

Pull **live Etsy search** listing rows (title, price, shop, badges, rank) and **Etsy shop sales** counters with history/breakout fields through Apify MCP. This is an **Etsy scraper / Etsy MCP** pin for both Actors. **Client config plus a small open-source stdio proxy server. No Actor source.**

**Disclosure:** I maintain these Actors on Apify Store (`publicrecords`). This repo holds MCP / client config and a small open-source stdio proxy server (`src/`).

**Paid Actor (tracked):** [Etsy Shop Sales Tracker & Scraper on Apify](https://publicrecords-redirect.publicrecords.workers.dev/r/awesome-mcp-list) — daily sales / velocity for named Etsy shops.

## MCP pin (both Actors)

```
https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper
```

| Actor | Store / status | Role |
|---|---|---|
| **Etsy Search Scraper** | [publicrecords/etsy-search-scraper](https://apify.com/publicrecords/etsy-search-scraper) (listed) | Live keyword / market / category listing rows (title, price, shop, badges, rank) |
| **Etsy Shop Sales Tracker & Scraper** | [publicrecords/etsy-shop-velocity](https://publicrecords-redirect.publicrecords.workers.dev/r/awesome-mcp-list) (listed) | Daily sales / velocity rows for named Etsy shops (counters, history, breakout) |


Use either path:

- **Apify MCP** (Claude Desktop, Cursor, or any MCP client) with the pin above
- **Store Actors** directly in Apify Console / API for pipelines, CRMs, and dashboards

Auth: your own Apify token in the client when prompted. Runs are billed on your Apify account.

## Pricing (as of Oct 28, 2026)

Pay per event, billed on your Apify account. Free-plan list prices; Apify Store discounts lower them on paid plans. The Store pricing pages are the live source.

### Search: `publicrecords/etsy-search-scraper` ([Store pricing](https://apify.com/publicrecords/etsy-search-scraper/pricing))

| Event | Price |
|---|---|
| `listing-row` | 0.4¢ per complete listing (0.34¢ on Gold and up) |
| `actor-start` | 0.005¢ once per run, only when a complete listing is in hand |

A run that returns no rows charges nothing. Works out of the box on **Apify residential proxy** (default; Apify bills proxy usage separately, with **no proxy markup** on our events). Or plug in your own residential proxy. Blocked pages charge no listing rows.

### Tracker: `publicrecords/etsy-shop-velocity` ([Store pricing](https://apify.com/publicrecords/etsy-shop-velocity/pricing))

| Event | Price |
|---|---|
| `shop-row` | 0.3¢ per shop row (0.255¢ on Gold and up) |
| `actor-start` | 0.005¢ once per run, only when the first shop row is ready |

Example: 10 shops come to about 3¢ on the Free plan. No proxy required.

## Tools

Live `tools/list` against the pin URL (Bearer Apify token). Tool names exposed:

| Tool name | Role |
|---|---|
| `publicrecords--etsy-search-scraper` | Run Etsy Search Scraper (`publicrecords/etsy-search-scraper`) |
| `publicrecords--etsy-shop-velocity` | Run Etsy Shop Sales Tracker (`publicrecords/etsy-shop-velocity`) |
| `get-actor-run` | Get detailed information about a specific Actor run |
| `get-dataset-items` | Read items from a run dataset |
| `get-key-value-store-record` | Read a key-value store record |
| `abort-actor-run` | Abort a running Actor run |

## Claude Desktop

Add to `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "etsy-sales": {
      "command": "npx",
      "args": [
        "-y",
        "@apify/actors-mcp-server",
        "--actors",
        "publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper"
      ],
      "env": {
        "APIFY_TOKEN": "YOUR_APIFY_TOKEN"
      }
    }
  }
}
```

Or point the Apify remote MCP URL (with the pin above) if your Claude Desktop version supports remote MCP servers.

## Cursor

In Cursor MCP settings / `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "etsy-sales": {
      "url": "https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper"
    }
  }
}
```

Sign in with Apify when Cursor prompts.

## Example prompts (measured)

### 1) Etsy search — ceramic mug, 3 pages

**Prompt:** Scrape Etsy search for `ceramic mug`, max 3 pages (Apify residential US default).

**Result (2026-10-02):** SUCCEEDED in about 53 s; 36 listing rows; price, shop and title filled on 36/36. At the Oct 28 prices above, 36 rows come to about 14.4¢ on the Free plan.

First three rows (abbreviated): KJPottery $57 bestsellers; BZceramics $35.50 popular_now; Neherpottery $35 bestsellers.

### 2) Etsy shop sales — two named shops

**Prompt:** Track sales for Etsy shops `OrelCeramics` and `Bestickend`.

**Result:** SUCCEEDED in about 5 s; 2 shop rows; snapshot `2026-09-30`. At the Oct 28 prices above, 2 shops come to about 0.6¢ on the Free plan.

| shop | sales_count | sales_precision | reviews_count | rating | admirers | listings_active | breakout | snapshot_date |
|---|---:|---|---:|---:|---:|---:|---|---|
| OrelCeramics | 111 | exact | 34 | 5 | 252 | 44 | false | 2026-09-30 |
| Bestickend | 11400 | rounded | 1830 | 5 | 771 | 44 | false | 2026-09-30 |

## Local stdio server (open source)

This repo also ships a small MCP server in [`src/`](src/) for clients that only run local stdio servers. It answers `initialize` and `tools/list` locally from [`tools.json`](tools.json), which is generated from each Actor's public input schema and checked for drift in CI and weekly, so any client or directory can inspect the tools with no token. `tools/call` is forwarded to the hosted Apify MCP endpoint above with **your own** `APIFY_TOKEN`; without a token a call returns a clear error instead of running anything. The token is only sent in the `Authorization` header and is never logged.

```json
{
  "mcpServers": {
    "etsy-sales": {
      "command": "npx",
      "args": ["-y", "github:GeminiGeorge22/etsy-sales-mcp"],
      "env": { "APIFY_TOKEN": "YOUR_APIFY_TOKEN" }
    }
  }
}
```

Or from a clone:

```bash
git clone https://github.com/GeminiGeorge22/etsy-sales-mcp.git
cd etsy-sales-mcp && npm install
APIFY_TOKEN=YOUR_APIFY_TOKEN node src/server.js
```

Optional env: `APIFY_ACTORS` (comma-separated subset of the Actors above) and `APIFY_MCP_URL` (full endpoint override).

Tests run against an in-memory mock server, with no network and no token: `npm test`. Requires Node.js 18+.

### Python (uvx/pip)

A matching Python version of this server lives in [`python/`](python/), built on the official `mcp` Python SDK: same tools, same `APIFY_TOKEN`, same hosted endpoint. Requires Python 3.10+.

```json
{
  "mcpServers": {
    "etsy-sales": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/GeminiGeorge22/etsy-sales-mcp#subdirectory=python", "etsy-sales-mcp"],
      "env": { "APIFY_TOKEN": "YOUR_APIFY_TOKEN" }
    }
  }
}
```

Or with pip: `pip install "git+https://github.com/GeminiGeorge22/etsy-sales-mcp#subdirectory=python"`, then run `etsy-sales-mcp`. Python tests: `cd python && pip install -e ".[test]" && env -u APIFY_TOKEN python -m pytest`.

## What this repo is not

- Not Actor implementation / Docker / truth sets
- Not a substitute for Apify Console billing screens
- Not affiliated with Etsy, Inc.

## Site hubs + tutorials

- Search hub: https://geminigeorge22.github.io/etsy-search-scraper/
- Tracker hub: https://geminigeorge22.github.io/etsy-shop-velocity/
- Search tutorial: https://geminigeorge22.github.io/blog/etsy-search-scraper/
- Tracker tutorial: https://geminigeorge22.github.io/blog/etsy-shop-sales-velocity/
- Publisher site: https://geminigeorge22.github.io/

## See also

- [Awesome Etsy MCP](https://github.com/GeminiGeorge22/awesome-etsy-mcp): a curated list of MCP servers for Etsy sellers and e-commerce research.
- [ecommerce-search-rankings-mcp](https://github.com/GeminiGeorge22/ecommerce-search-rankings-mcp): E-commerce search results and product rankings across Amazon, eBay, Walmart, Google Shopping, AliExpress, Shopify and Etsy.
- [ecommerce-sales-mcp](https://github.com/GeminiGeorge22/ecommerce-sales-mcp): E-commerce sales signals: Amazon bestsellers and reviews, eBay sold prices, TikTok Shop and Etsy shop sales.
- [forecast-accuracy-mcp](https://github.com/GeminiGeorge22/forecast-accuracy-mcp): Forecast accuracy and track records: forecasts vs actuals, earnings beats, prediction markets, archived pages and news.
- [sports-betting-stats-mcp](https://github.com/GeminiGeorge22/sports-betting-stats-mcp): Sports betting odds and stats: sportsbook odds, player props, scores, xG, closing lines, horse racing.
- [sports-odds-mcp](https://github.com/GeminiGeorge22/sports-odds-mcp): Live odds from Kambi-powered sportsbooks (BetRivers, Unibet, Paf, Svenska Spel, ATG).
- [ats-jobs-mcp](https://github.com/GeminiGeorge22/ats-jobs-mcp): New job postings from Greenhouse, Lever, Ashby and SmartRecruiters.
- [gov-tenders-mcp](https://github.com/GeminiGeorge22/gov-tenders-mcp): Government tenders, grants, awards and council meetings.

## License

MIT — applies to this documentation, config and the proxy server code in `src/`.

Published by the publicrecords maintainer on Apify.

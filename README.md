# Etsy Search & Shop Sales MCP

**Etsy search** and **Etsy shop sales** data for CRMs, dashboards, research workflows, and AI assistants — live Etsy search listing rows plus shop sales counters — via [Apify’s hosted MCP](https://mcp.apify.com) or the Store Actors directly.

Pull **live Etsy search** listing rows (title, price, shop, badges, rank) and **Etsy shop sales** counters with history/breakout fields through Apify MCP. This is an **Etsy scraper / Etsy MCP** pin for both Actors. **Manifest-only repo — no Actor source.**

**Disclosure:** I maintain these Actors on Apify Store (`publicrecords`). This repo documents MCP / client config only.

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

## License

MIT — applies to this documentation and config only.

Published by the publicrecords maintainer on Apify.

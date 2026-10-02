# etsy-sales-mcp

Use the **publicrecords** Etsy Actors as MCP tools through [Apify MCP](https://mcp.apify.com).

**Disclosure:** I maintain these Actors on Apify Store (`publicrecords`). This repo documents MCP config only — **no Actor source**.

## MCP pin (both Actors)

```
https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper
```

| Actor | Store / status | Role |
|---|---|---|
| **Etsy Shop Sales Tracker & Scraper** | [publicrecords/etsy-shop-velocity](https://apify.com/publicrecords/etsy-shop-velocity) (listed) | Daily sales / velocity rows for named Etsy shops |
| **Etsy Search Scraper** | [publicrecords/etsy-search-scraper](https://apify.com/publicrecords/etsy-search-scraper) (listed) | Live keyword / market / category listing rows |

Auth: your own Apify token in the client when prompted. Runs are billed on your Apify account.

## Pricing (Console PPE, live 2026-10-02)

### Tracker — `publicrecords/etsy-shop-velocity`

| Event | USD |
|---|---|
| `actor-start` | $0.005 |
| `shop-row` | $0.003 |

Measured: 2 shops → **$0.011**; 5 shops → **$0.020**.

### Search — `publicrecords/etsy-search-scraper`

| Event | USD |
|---|---|
| `actor-start` | $0.005 |
| `listing-row` | $0.006 |

Measured proof run `pRpdAMmfeMHdmuRXA`: 36 complete listing rows → **$0.221**. Blocked pages charge no listing rows. You supply a residential proxy (Apify RESIDENTIAL by default).

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

Or point the Apify remote MCP URL (with the pin above) if your Claude Desktop build supports remote MCP servers.

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

### 1) Shop velocity — two named shops

**Prompt:** Track sales for Etsy shops `OrelCeramics` and `Bestickend`.

**Run:** `lWWrFPgwZcu6DYYKe` — SUCCEEDED in 5.314s; 2 shop-rows; Console cost **$0.011**; snapshot `2026-09-30`.

| shop | sales_count | sales_precision | reviews_count | rating | admirers | listings_active | breakout | snapshot_date |
|---|---:|---|---:|---:|---:|---:|---|---|
| OrelCeramics | 111 | exact | 34 | 5 | 252 | 44 | false | 2026-09-30 |
| Bestickend | 11400 | rounded | 1830 | 5 | 771 | 44 | false | 2026-09-30 |

### 2) Search — ceramic mug, 3 pages

**Prompt:** Scrape Etsy search for `ceramic mug`, max 3 pages, residential US proxy.

**Run:** `pRpdAMmfeMHdmuRXA` — SUCCEEDED in 52.561s; 36 listing rows; fill price/shop/title 36/36; Console PPE **$0.221**.

First three rows (abbreviated): KJPottery $57 bestsellers; BZceramics $35.50 popular_now; Neherpottery $35 bestsellers.

## What this repo is not

- Not Actor implementation / Docker / truth sets
- Not a substitute for Apify Console billing screens
- Not affiliated with Etsy, Inc.

## Tutorials

- Tracker: https://geminigeorge22.github.io/blog/etsy-shop-sales-velocity/
- Search: https://geminigeorge22.github.io/blog/etsy-search-scraper/

## License

MIT — applies to this documentation and config only.

Published by the publicrecords maintainer on Apify.

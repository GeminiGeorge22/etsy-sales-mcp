---
name: etsy-shop-sales-tracker
description: "Looks up an Etsy shop's sales-count history: lifetime sales count as of a snapshot date, changes over recent windows (including last change, 7 days, and 28 days), a fitted sales rate, and breakout flags. Use when the user asks how many sales a shop has, whether a shop is growing, or which shops from a list are accelerating. Runs the Apify Actor publicrecords/etsy-shop-velocity through MCP on the user's own Apify account."
license: MIT
metadata:
  author: GeminiGeorge22
  version: "1.1.0"
---

# Etsy shop sales tracker

Returns shop-level sales counts and how those counts have changed over time for one or more Etsy shops. The Actor reads a hosted snapshot panel; a query does not scrape Etsy live.

The Actor is [publicrecords/etsy-shop-velocity](https://apify.com/publicrecords/etsy-shop-velocity) on Apify Store. Output fields include `sales_count`, `as_of`, `delta_last`, `delta_7d`, and `delta_28d`. This skill does not report shop revenue.

## Authentication

Runs on **the user's own Apify account**.

- Use an API token the user created in their own Apify Console, or sign in with Apify OAuth when the MCP client prompts.
- Put that token only in the client's MCP config or environment as `APIFY_TOKEN` (or as `Authorization: Bearer <token>` on the hosted endpoint).
- Never use a shared, publisher, or third-party token. Never paste a token into chat.
- `tools/list` works without a token. `tools/call` needs the user's token and runs on that user's Apify account.

## Connect the MCP server

```json
{
  "mcpServers": {
    "etsy-sales": {
      "url": "https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper",
      "headers": { "Authorization": "Bearer <YOUR_APIFY_TOKEN>" }
    }
  }
}
```

Local stdio:

```json
{
  "mcpServers": {
    "etsy-sales": {
      "command": "npx",
      "args": ["-y", "github:GeminiGeorge22/etsy-sales-mcp"],
      "env": { "APIFY_TOKEN": "<YOUR_APIFY_TOKEN>" }
    }
  }
}
```

Replace `<YOUR_APIFY_TOKEN>` with the user's own token. A Python package `etsy-sales-mcp` is also available.

## What a record contains

| field | meaning |
|---|---|
| `shop`, `shop_url`, `title`, `headline`, `category` | shop identity |
| `sales_count`, `sales_precision`, `reviews_count`, `rating`, `admirers`, `listings_active` | lifetime counters as of the snapshot |
| `as_of`, `snapshot_date`, `snapshot_stale`, `first_seen`, `last_changed`, `history_days`, `read_interval_days` | panel timing |
| `delta_last`, `delta_7d`, `delta_28d` | sales-count changes over those windows |
| `sales_per_day`, `units_day`, `units_lo`, `units_hi`, `lift_7d` | fitted or estimated rate |
| `breakout`, `breakout_p`, `vintage_event` | flags |
| `source` | provenance string |

## Usage

Example prompts:

- "Is KJPottery growing? Compare its 28-day sales-count change to its baseline."
- "Of these ten shops from my keyword scan, which three are accelerating?"
- "Flag any shop in my watch list with a breakout this week."

Tool name: `publicrecords--etsy-shop-velocity`.

```json
{ "shops": ["KJPottery", "OrelCeramics"] }
```

## How it pairs with other skills

- **etsy-search** (same repo) — find the shops that own page 1 for a keyword, then ask which of them are growing.

## Limits

- Numbers are shop-level counters Etsy publishes. This skill does not provide shop revenue.
- A shop with no history yet comes back as coverage-pending and is added to the panel for a later snapshot.
- Rates need several days of history and are described as such when history is short.
- Listing-level sales, when present, are estimates and are labelled as such.

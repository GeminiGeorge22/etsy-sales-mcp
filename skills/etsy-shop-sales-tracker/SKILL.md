---
name: etsy-shop-sales-tracker
version: 1.0.1
author: GeminiGeorge22
description: "Etsy shop sales tracker: is this shop growing, and how fast? Daily sales counters with history, deltas, fitted sales rate and breakout flags for any Etsy shop from a hosted daily panel — no proxy required. Uses Apify Actor publicrecords/etsy-shop-velocity through MCP; needs an Apify token (OAuth/token)."
metadata: {"nexscope":{"emoji":"📈","category":"ecommerce"}}
---

# Etsy Shop Sales Tracker 📈

**Etsy shop sales** the question every seller tool guesses at and this one measures: how many sales did a shop make this week, and is that accelerating?

Disclosure: I maintain these Actors on Apify Store (publicrecords).

## Installation

```bash
npx skills add GeminiGeorge22/etsy-sales-mcp --skill etsy-shop-sales-tracker -g
```

This skill calls the **Etsy Shop Sales Tracker** Actor (`publicrecords/etsy-shop-velocity`) through the Apify MCP server:

```json
{
  "mcpServers": {
    "etsy-sales": {
      "url": "https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper",
      "headers": { "Authorization": "Bearer <APIFY_TOKEN>" }
    }
  }
}
```

Auth: Apify OAuth/token. The Actor reads from a daily panel captured once a day and served from a snapshot; your query never touches Etsy. A shop with no history yet comes back as coverage-pending and is added to the panel for the next day.

## What a record contains

Field names from a live SUCCEEDED dataset item (F-C125):

| field | meaning |
|---|---|
| `shop`, `shop_url`, `title`, `headline`, `category` | shop identity |
| `sales_count`, `sales_precision`, `reviews_count`, `rating`, `admirers`, `listings_active` | lifetime counters as of the snapshot |
| `as_of`, `snapshot_date`, `snapshot_stale`, `first_seen`, `last_changed`, `history_days`, `read_interval_days` | panel timing |
| `delta_last`, `delta_7d`, `delta_28d` | counter deltas |
| `sales_per_day`, `units_day`, `units_lo`, `units_hi`, `lift_7d` | fitted / estimated rate |
| `breakout`, `breakout_p`, `vintage_event` | flags |
| `source` | provenance string |

## Usage

- "Is *KJPottery* growing? Compare its 28-day sales delta to its baseline."
- "Of these ten shops from my keyword scan, which three are accelerating?"
- "Flag any shop in my watch list with a breakout this week."

Tool call the agent makes (`publicrecords--etsy-shop-velocity`):

```json
{ "shops": ["KJPottery", "OrelCeramics"] }
```

## How it pairs with other skills

- **etsy-search** — find the shops that own page 1 for a keyword, then ask which of them are growing.

## Limits

- Numbers are shop-level counters Etsy publishes; listing-level sales are estimates and are labelled as such.
- A shop added today has one reading; rates need several days of history and say so.

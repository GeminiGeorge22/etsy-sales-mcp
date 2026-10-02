---
name: etsy-search
version: 1.0.1
author: GeminiGeorge22
description: "Etsy search scraper for any keyword, market phrase or category: live listing rows with price, rating, review count, Bestseller / Star Seller / Etsy's Pick badges, ad-vs-organic flag, rank and shop. Uses Apify Actor publicrecords/etsy-search-scraper through MCP; needs an Apify token (OAuth/token)."
metadata: {"nexscope":{"emoji":"🔎","category":"ecommerce"}}
---

# Etsy Search 🔎

**Etsy search** results the agent can reason from: what is actually ranking for a keyword right now, at what price, with which badges, and how much of page 1 is paid. This is the Etsy scraper / Etsy search skill for market research.

Disclosure: I maintain these Actors on Apify Store (publicrecords).

## Installation

```bash
npx skills add GeminiGeorge22/etsy-sales-mcp --skill etsy-search -g
```

This skill calls the **Etsy Search Scraper** Actor (`publicrecords/etsy-search-scraper`) through the Apify MCP server. Add it to your agent's MCP config once:

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

Auth: Apify OAuth/token. An Apify account is free; the Actor bills listing rows via Console PPE (see repo README). It runs on Apify residential proxy by default.

## What a row contains

Field names from a live SUCCEEDED dataset item (F-C125):

| field | meaning |
|---|---|
| `query`, `page`, `position`, `surface` | keyword and the exact rank/surface Etsy showed |
| `listing_id`, `url`, `title` | the listing |
| `price`, `currency` | shown price |
| `rating_value`, `review_count`, `review_count_approx` | rating; `true` when Etsy rounded |
| `bestseller`, `popular_now`, `star_seller`, `etsys_pick`, `free_shipping` | badges |
| `is_ad` | sponsored slot, or `null` when unknown |
| `shop_name`, `shop_id`, `shop_url` | the seller |

## Usage

Ask the agent, for example:

- "Pull page 1–3 for *personalized dog collar* and tell me the price band, how many slots are ads, and which titles carry Bestseller."
- "Which shops own the most page-1 slots for *linen apron*?"

Tool call the agent makes (`publicrecords--etsy-search-scraper`):

```json
{ "queries": ["personalized dog collar"], "maxPages": 3 }
```

Optional filters: `is_best_seller`, `is_star_seller`, `free_shipping`, `is_discounted`, `instant_download`, `ship_to` (e.g. `"US"`). `marketPhrases` and `categoryUrls` take Etsy's `/market/` phrases and category pages.

## How it pairs with other skills

- **etsy-shop-sales-tracker** — once the shops are known, check whether they are growing.

## Limits

- Results are what Etsy shows a logged-out visitor from your proxy's region.
- Etsy caps a query at 20 pages.
- Blocked pages charge no listing rows.

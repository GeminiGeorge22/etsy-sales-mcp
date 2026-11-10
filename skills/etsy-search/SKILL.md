---
name: etsy-search
description: "Scrapes live Etsy search results for a keyword, market phrase, or category: listing title, price, rating, review count, Bestseller / Star Seller / Etsy's Pick badges, ad-versus-organic flag, rank, and shop. Use when the user wants what is ranking on Etsy right now, a keyword's price band, or which shops own page-one slots. Runs the Apify Actor publicrecords/etsy-search-scraper through MCP on the user's own Apify account."
license: MIT
metadata:
  author: GeminiGeorge22
  version: "1.1.0"
---

# Etsy search

Returns the Etsy search results a logged-out visitor is shown for a keyword, market phrase, or category page: listings with price, rating, review count, badges, ad flag, rank, and shop.

The Actor is [publicrecords/etsy-search-scraper](https://apify.com/publicrecords/etsy-search-scraper) on Apify Store.

## Authentication

Runs on **the user's own Apify account**.

- Use an API token the user created in their own Apify Console, or sign in with Apify OAuth when the MCP client prompts.
- Put that token only in the client's MCP config or environment as `APIFY_TOKEN` (or as `Authorization: Bearer <token>` on the hosted endpoint).
- Never use a shared, publisher, or third-party token. Never paste a token into chat.
- `tools/list` works without a token. `tools/call` needs the user's token and runs on that user's Apify account.

## Connect the MCP server

Hosted (this skill's Actor only, or both Etsy Actors from this repo):

```json
{
  "mcpServers": {
    "etsy-sales": {
      "url": "https://mcp.apify.com/?tools=publicrecords/etsy-search-scraper,publicrecords/etsy-shop-velocity",
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

## What a row contains

| field | meaning |
|---|---|
| `query`, `page`, `position`, `surface` | keyword and the rank or surface Etsy showed |
| `listing_id`, `url`, `title` | the listing |
| `price`, `currency` | shown price |
| `rating_value`, `review_count`, `review_count_approx` | rating; `review_count_approx` is true when Etsy rounded the count |
| `bestseller`, `popular_now`, `star_seller`, `etsys_pick`, `free_shipping` | badges |
| `is_ad` | sponsored slot, or `null` when unknown |
| `shop_name`, `shop_id`, `shop_url` | the seller |

## Usage

Example prompts:

- "Pull pages 1–3 for personalized dog collar and summarize the price band, how many slots are ads, and which titles carry Bestseller."
- "Which shops own the most page-1 slots for linen apron?"

Tool name: `publicrecords--etsy-search-scraper`.

```json
{ "queries": ["personalized dog collar"], "maxPages": 3 }
```

Optional filters include `is_best_seller`, `is_star_seller`, `free_shipping`, `is_discounted`, `instant_download`, and `ship_to` (for example `"US"`). `marketPhrases` and `categoryUrls` take Etsy's `/market/` phrases and category pages.

## How it pairs with other skills

- **etsy-shop-sales-tracker** (same repo) — once the shops are known, check sales-count changes over time.

## Limits

- Results are what Etsy shows a logged-out visitor from the run's proxy region.
- Etsy caps a query at 20 pages.
- Blocked pages do not return listing rows.

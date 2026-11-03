# Etsy リサーチ & ショップ売上 MCP サーバー

Etsy で売るなら知りたいのは 2 つ。**そのキーワードで何が、誰が売れているか**、そして**競合ショップが毎日どれだけ売っているか**。この MCP は 2 つの Apify Actor を AI アシスタントにつなぎます。

- **Etsy 検索スクレイパー（Etsy Search Scraper）**：キーワード・マーケット・カテゴリ別のリアルタイム検索結果（タイトル、価格、ショップ、バッジ、順位）。商品リサーチやキーワード調査に。
- **Etsy ショップ売上トラッカー（Etsy Shop Sales Tracker）**：任意の Etsy ショップの日次売上カウンター、履歴、伸び率、急成長フラグ。競合分析に。データは毎日のスナップショットから返すため、問い合わせが Etsy に直接アクセスすることはありません。未登録のショップは翌日からデータが入ります。

## 主な使い方

- 商品リサーチ：キーワードごとの売れ筋、価格帯、上位ショップを確認
- 競合分析：ライバルショップの日次売上と成長トレンドを追跡
- 急成長中のショップやジャンルを発見
- AI に日本語で：「この 3 つの Etsy ショップの今週の売上の伸びを比べて」

## MCP エンドポイント

```
https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper
```

## ツール

| Tool | |
|---|---|
| `publicrecords--etsy-search-scraper` | Etsy 検索スクレイパーを実行 |
| `publicrecords--etsy-shop-velocity` | Etsy ショップ売上トラッカーを実行 |
| `get-actor-run`, `get-dataset-items`, `get-key-value-store-record`, `abort-actor-run` | 実行状況の確認、結果データセットの取得 |

## 認証

クライアントに表示される Apify OAuth でサインインするか、ご自身の Apify API トークン（`Authorization: Bearer <APIFY_TOKEN>`）を使ってください。実際のトークンはコミットしないでください。実行料金はご自身の Apify アカウントに計上されます。

## クライアント設定

### Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "etsy-sales": {
      "url": "https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper"
    }
  }
}
```

### Claude Code

```
claude mcp add --transport http etsy-sales "https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper"
```

### Claude Desktop（ローカル stdio）

```json
{
  "mcpServers": {
    "etsy-sales": {
      "command": "npx",
      "args": ["-y", "@apify/actors-mcp-server", "--actors", "publicrecords/etsy-search-scraper,publicrecords/etsy-shop-velocity"],
      "env": { "APIFY_TOKEN": "<APIFY_TOKEN>" }
    }
  }
}
```

## リンク

- Etsy Search Scraper: https://apify.com/publicrecords/etsy-search-scraper
- Etsy Shop Sales Tracker: https://apify.com/publicrecords/etsy-shop-velocity
- 英語版の詳しい説明: [README.md](README.md)

> このリポジトリは MCP / クライアント設定のみで、Actor のソースコードは含みません。

---

開示：これらの Actor は私が Apify Store（publicrecords）でメンテナンスしています。

# Etsy 选品与店铺销量 MCP 服务器（Etsy 数据采集）

做 Etsy 跨境电商，最想知道的两件事：**这个关键词下卖什么、谁在卖**，以及**竞品店铺每天卖了多少单**。这个 MCP 把两个 Apify Actor 接进你的 AI 助手：

- **Etsy 搜索采集（Etsy Search Scraper）**：按关键词、站点、类目抓取实时搜索结果（标题、价格、店铺、徽章、排名），用于 Etsy 选品和关键词调研。
- **Etsy 店铺销量追踪（Etsy Shop Sales Tracker）**：任意 Etsy 店铺的每日销量计数、历史变化、增长速度和爆发标记，用于竞品分析。数据来自每日快照面板，查询不会直接访问 Etsy；新店铺会进入面板，次日开始有数据。

## 典型用途

- Etsy 选品：看某个关键词下的热门商品、价格带和头部店铺
- 竞品分析：追踪对手店铺每天的销量和增长趋势
- 发现正在爆发的新店铺和新品类
- 直接用中文问 AI：「帮我看看这三家 Etsy 店铺这周的销量变化」

## MCP 地址

```
https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper
```

## 提供的工具

| Tool | |
|---|---|
| `publicrecords--etsy-search-scraper` | 运行 Etsy 搜索采集 |
| `publicrecords--etsy-shop-velocity` | 运行 Etsy 店铺销量追踪 |
| `get-actor-run`, `get-dataset-items`, `get-key-value-store-record`, `abort-actor-run` | 查询运行状态、读取结果数据集 |

## 鉴权

客户端提示时使用 Apify OAuth 登录，或使用你自己的 Apify API Token（`Authorization: Bearer <APIFY_TOKEN>`）。请勿把真实 Token 提交到仓库。运行费用计入你自己的 Apify 账户。

## 客户端配置

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

### Claude Desktop（本地 stdio 方式）

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

## 本地 stdio 服务器（开源）

本仓库在 [`src/`](src/) 中附带一个小型开源 MCP 服务器，适用于只支持本地 stdio 服务器的客户端。它通过 stdio 启动，使用**你自己的** `APIFY_TOKEN` 连接上面的 Apify 托管 MCP 地址，并原样转发 `tools/list` 和 `tools/call`。令牌只放在 `Authorization` 请求头中，不会写入日志。

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

可选环境变量：`APIFY_ACTORS`（逗号分隔，只启用部分 Actor）和 `APIFY_MCP_URL`（覆盖完整地址）。

测试使用内存中的模拟服务器，不联网、不需要令牌：`npm test`。需要 Node.js 18 及以上版本。

## 链接

- Etsy Search Scraper: https://apify.com/publicrecords/etsy-search-scraper
- Etsy Shop Sales Tracker: https://apify.com/publicrecords/etsy-shop-velocity
- 英文完整说明: [README.md](README.md)

> 本仓库包含 MCP / 客户端配置和一个小型开源 stdio 代理服务器（`src/`），不含 Actor 源码。

---

说明：这两个 Actor 由我在 Apify Store（publicrecords）维护。

# Etsy ürün araştırması ve mağaza satışları MCP sunucusu

Etsy'de satış yapıyorsanız iki şeyi bilmek istersiniz: **bir anahtar kelimede ne satılıyor ve kim satıyor**, bir de **rakipleriniz her gün ne kadar satıyor**. Bu MCP iki Apify Actor'ını yapay zekâ asistanınıza bağlar:

- **Etsy Search Scraper**: anahtar kelime, pazar veya kategoriye göre canlı Etsy arama sonuçları (başlık, fiyat, mağaza, rozetler, sıra). Ürün ve anahtar kelime araştırması için.
- **Etsy Shop Sales Tracker**: herhangi bir Etsy mağazasının günlük satış sayacı, geçmişi, büyüme hızı ve ani yükseliş işareti. Rakip analizi için. Veriler günlük bir anlık görüntüden gelir; sorgunuz Etsy'ye doğrudan gitmez. Yeni bir mağaza panele eklenir ve ertesi günden itibaren verisi olur.

## Kullanım alanları

- Ürün araştırması: anahtar kelimeye göre çok satanlar, fiyat aralıkları ve öne çıkan mağazalar
- Rakip analizi: rakip mağazaların günlük satışları ve trendi
- Hızla büyüyen mağazaları ve nişleri bulma
- Yapay zekâya Türkçe sorun: "Bu üç Etsy mağazasının bu haftaki satış artışını karşılaştır"

## MCP uç noktası

```
https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper
```

## Araçlar

| Tool | |
|---|---|
| `publicrecords--etsy-search-scraper` | Etsy Search Scraper'ı çalıştırır |
| `publicrecords--etsy-shop-velocity` | Etsy Shop Sales Tracker'ı çalıştırır |
| `get-actor-run`, `get-dataset-items`, `get-key-value-store-record`, `abort-actor-run` | Çalıştırma durumunu sorgulama ve sonuç veri setini okuma |

## Kimlik doğrulama

İstemciniz sorduğunda Apify OAuth ile giriş yapın veya kendi Apify API anahtarınızı kullanın (`Authorization: Bearer <APIFY_TOKEN>`). Gerçek bir anahtarı asla depoya göndermeyin. Çalıştırmalar kendi Apify hesabınıza faturalanır.

## İstemci kurulumu

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

### Claude Desktop (yerel stdio)

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

## Bağlantılar

- Etsy Search Scraper: https://apify.com/publicrecords/etsy-search-scraper
- Etsy Shop Sales Tracker: https://apify.com/publicrecords/etsy-shop-velocity
- İngilizce tam belge: [README.md](README.md)

> Bu depo yalnızca MCP / istemci yapılandırmasını içerir; Actor kaynak kodu içermez.

---

Açıklama: Bu Actor'ların Apify Store'daki (publicrecords) bakımını ben yapıyorum.

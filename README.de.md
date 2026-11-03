# Etsy-Produktrecherche & Shop-Verkaufszahlen — MCP-Server

Wer auf Etsy verkauft, will zwei Dinge wissen: **was sich zu einem Suchbegriff verkauft und wer es verkauft**, und **wie viel die Konkurrenz jeden Tag verkauft**. Dieser MCP verbindet zwei Apify-Actors mit deinem KI-Assistenten:

- **Etsy Search Scraper**: Live-Suchergebnisse von Etsy nach Suchbegriff, Markt oder Kategorie (Titel, Preis, Shop, Badges, Rang). Für Produkt- und Keyword-Recherche.
- **Etsy Shop Sales Tracker**: tägliche Verkaufszähler beliebiger Etsy-Shops mit Verlauf, Wachstumstempo und Breakout-Markierung. Für die Wettbewerbsanalyse. Die Daten stammen aus einem täglichen Snapshot, deine Abfrage greift also nicht direkt auf Etsy zu; ein neuer Shop kommt ins Panel und hat ab dem nächsten Tag Daten.

## Anwendungsfälle

- Produktrecherche: Bestseller, Preisspannen und Top-Shops je Suchbegriff
- Wettbewerbsanalyse: tägliche Verkäufe und Trend der Konkurrenz-Shops
- Shops und Nischen mit starkem Wachstum entdecken
- Frag deine KI auf Deutsch: „Vergleiche das Verkaufswachstum dieser drei Etsy-Shops in dieser Woche“

## MCP-Endpunkt

```
https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper
```

## Tools

| Tool | |
|---|---|
| `publicrecords--etsy-search-scraper` | Startet den Etsy Search Scraper |
| `publicrecords--etsy-shop-velocity` | Startet den Etsy Shop Sales Tracker |
| `get-actor-run`, `get-dataset-items`, `get-key-value-store-record`, `abort-actor-run` | Status eines Laufs abfragen und das Ergebnis-Dataset lesen |

## Authentifizierung

Melde dich mit Apify OAuth an, wenn dein Client danach fragt, oder nutze dein eigenes Apify-API-Token (`Authorization: Bearer <APIFY_TOKEN>`). Committe niemals ein echtes Token. Ausführungen werden über dein eigenes Apify-Konto abgerechnet.

## Client-Einrichtung

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

### Claude Desktop (lokal über stdio)

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

## Links

- Etsy Search Scraper: https://apify.com/publicrecords/etsy-search-scraper
- Etsy Shop Sales Tracker: https://apify.com/publicrecords/etsy-shop-velocity
- Vollständige Doku auf Englisch: [README.md](README.md)
- Siehe auch: [Awesome Etsy MCP](https://github.com/GeminiGeorge22/awesome-etsy-mcp) (kuratierte Liste)

> Dieses Repository enthält nur MCP-/Client-Konfiguration, keinen Actor-Quellcode.

---

Hinweis: Ich pflege diese Actors im Apify Store (publicrecords).

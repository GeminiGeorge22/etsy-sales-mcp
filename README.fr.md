# MCP recherche produits & ventes des boutiques Etsy

Quand on vend sur Etsy, on veut savoir deux choses : **ce qui se vend et qui le vend sur un mot-clé**, et **combien la concurrence vend chaque jour**. Ce MCP relie deux Actors Apify à votre assistant IA :

- **Etsy Search Scraper** : résultats de recherche Etsy en temps réel par mot-clé, marché ou catégorie (titre, prix, boutique, badges, rang). Pour la recherche de produits et de mots-clés.
- **Etsy Shop Sales Tracker** : compteur de ventes quotidiennes de n'importe quelle boutique Etsy, avec historique, rythme de croissance et signal d'envolée. Pour l'analyse concurrentielle. Les données proviennent d'un instantané quotidien : votre requête ne touche pas Etsy ; une nouvelle boutique entre dans le panel et a des données dès le lendemain.

## Cas d'usage

- Recherche de produits : meilleures ventes, gammes de prix et boutiques en tête par mot-clé
- Analyse concurrentielle : ventes quotidiennes et tendance des boutiques rivales
- Repérer les boutiques et niches en forte croissance
- Demandez à votre IA en français : « Compare la croissance des ventes de ces trois boutiques Etsy cette semaine »

## Endpoint MCP

```
https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper
```

## Outils

| Tool | |
|---|---|
| `publicrecords--etsy-search-scraper` | Lance Etsy Search Scraper |
| `publicrecords--etsy-shop-velocity` | Lance Etsy Shop Sales Tracker |
| `get-actor-run`, `get-dataset-items`, `get-key-value-store-record`, `abort-actor-run` | Consulter l'état d'une exécution et lire le dataset de résultats |

## Authentification

Connectez-vous avec Apify OAuth quand votre client le demande, ou utilisez votre propre jeton d'API Apify (`Authorization: Bearer <APIFY_TOKEN>`). Ne commitez jamais un vrai jeton. Les exécutions sont facturées sur votre propre compte Apify.

## Configuration du client

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

### Claude Desktop (stdio local)

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

## Liens

- Etsy Search Scraper: https://apify.com/publicrecords/etsy-search-scraper
- Etsy Shop Sales Tracker: https://apify.com/publicrecords/etsy-shop-velocity
- Documentation complète en anglais: [README.md](README.md)

> Ce dépôt ne contient que la configuration MCP / client, pas le code des Actors.

---

Transparence : je maintiens ces Actors sur l'Apify Store (publicrecords).

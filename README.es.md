# MCP de investigación de productos y ventas de tiendas Etsy

Si vendes en Etsy, quieres saber dos cosas: **qué se vende y quién lo vende para una palabra clave**, y **cuánto vende cada día la competencia**. Este MCP conecta dos Actors de Apify a tu asistente de IA:

- **Etsy Search Scraper**: resultados de búsqueda de Etsy en tiempo real por palabra clave, mercado o categoría (título, precio, tienda, insignias, posición). Para investigar productos y palabras clave.
- **Etsy Shop Sales Tracker**: contador de ventas diarias de cualquier tienda Etsy, con historial, ritmo de crecimiento y alertas de despegue. Para analizar a la competencia. Los datos salen de una instantánea diaria, así que tu consulta no toca Etsy; una tienda nueva entra en el panel y tiene datos desde el día siguiente.

## Casos de uso

- Investigación de productos: lo más vendido, rangos de precio y tiendas líderes por palabra clave
- Análisis de la competencia: ventas diarias y tendencia de tiendas rivales
- Detectar tiendas y nichos que están despegando
- Pregunta a tu IA en español: «Compara cómo crecieron las ventas de estas tres tiendas de Etsy esta semana»

## Endpoint MCP

```
https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper
```

## Herramientas

| Tool | |
|---|---|
| `publicrecords--etsy-search-scraper` | Ejecuta Etsy Search Scraper |
| `publicrecords--etsy-shop-velocity` | Ejecuta Etsy Shop Sales Tracker |
| `get-actor-run`, `get-dataset-items`, `get-key-value-store-record`, `abort-actor-run` | Consultar el estado de una ejecución y leer el dataset de resultados |

## Autenticación

Inicia sesión con Apify OAuth cuando tu cliente lo pida o usa tu propio token de API de Apify (`Authorization: Bearer <APIFY_TOKEN>`). Nunca subas un token real. Las ejecuciones se cobran en tu propia cuenta de Apify.

## Configuración del cliente

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

## Enlaces

- Etsy Search Scraper: https://apify.com/publicrecords/etsy-search-scraper
- Etsy Shop Sales Tracker: https://apify.com/publicrecords/etsy-shop-velocity
- Documentación completa en inglés: [README.md](README.md)
- Ver también: [Awesome Etsy MCP](https://github.com/GeminiGeorge22/awesome-etsy-mcp) (lista seleccionada)

> Este repositorio solo contiene la configuración MCP / del cliente, sin el código de los Actors.

---

Aviso: mantengo estos Actors en Apify Store (publicrecords).

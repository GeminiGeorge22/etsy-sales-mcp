# MCP de pesquisa de produtos e vendas de lojas Etsy

Quem vende na Etsy quer saber duas coisas: **o que vende e quem vende em cada palavra-chave**, e **quanto os concorrentes vendem por dia**. Este MCP liga dois Actors da Apify ao seu assistente de IA:

- **Etsy Search Scraper**: resultados de busca da Etsy em tempo real por palavra-chave, mercado ou categoria (título, preço, loja, selos, posição). Para pesquisa de produtos e de palavras-chave.
- **Etsy Shop Sales Tracker**: contador de vendas diárias de qualquer loja Etsy, com histórico, ritmo de crescimento e alerta de disparada. Para análise de concorrentes. Os dados vêm de um retrato diário, então a sua consulta não acessa a Etsy; uma loja nova entra no painel e passa a ter dados no dia seguinte.

## Casos de uso

- Pesquisa de produtos: mais vendidos, faixas de preço e lojas líderes por palavra-chave
- Análise de concorrentes: vendas diárias e tendência das lojas rivais
- Encontrar lojas e nichos em alta
- Pergunte à sua IA em português: "Compare o crescimento de vendas destas três lojas da Etsy nesta semana"

## Endpoint MCP

```
https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper
```

## Ferramentas

| Tool | |
|---|---|
| `publicrecords--etsy-search-scraper` | Executa o Etsy Search Scraper |
| `publicrecords--etsy-shop-velocity` | Executa o Etsy Shop Sales Tracker |
| `get-actor-run`, `get-dataset-items`, `get-key-value-store-record`, `abort-actor-run` | Consultar o status de uma execução e ler o dataset de resultados |

## Autenticação

Entre com Apify OAuth quando o cliente pedir ou use o seu próprio token de API da Apify (`Authorization: Bearer <APIFY_TOKEN>`). Nunca faça commit de um token real. As execuções são cobradas na sua própria conta Apify.

## Configuração do cliente

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

## Links

- Etsy Search Scraper: https://apify.com/publicrecords/etsy-search-scraper
- Etsy Shop Sales Tracker: https://apify.com/publicrecords/etsy-shop-velocity
- Documentação completa em inglês: [README.md](README.md)

> Este repositório contém só a configuração MCP / do cliente, sem o código dos Actors.

---

Aviso: eu mantenho estes Actors na Apify Store (publicrecords).

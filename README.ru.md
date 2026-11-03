# MCP для анализа товаров и продаж магазинов Etsy

Продавцу на Etsy важны две вещи: **что и у кого продаётся по ключевому запросу** и **сколько каждый день продают конкуренты**. Этот MCP подключает к вашему ИИ-ассистенту два Actor'а Apify:

- **Etsy Search Scraper**: живая выдача поиска Etsy по ключевому слову, рынку или категории (название, цена, магазин, бейджи, позиция). Для поиска товаров и подбора ключевых слов.
- **Etsy Shop Sales Tracker**: ежедневный счётчик продаж любого магазина Etsy с историей, темпом роста и отметкой резкого роста. Для анализа конкурентов. Данные берутся из ежедневного снимка, поэтому ваш запрос не обращается к Etsy напрямую; новый магазин попадает в панель, и данные по нему появляются со следующего дня.

## Сценарии

- Поиск товаров: хиты продаж, ценовые диапазоны и лидирующие магазины по запросу
- Анализ конкурентов: ежедневные продажи и динамика магазинов-соперников
- Поиск быстрорастущих магазинов и ниш
- Спросите ИИ по-русски: «Сравни рост продаж этих трёх магазинов Etsy за неделю»

## MCP-эндпоинт

```
https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper
```

## Инструменты

| Tool | |
|---|---|
| `publicrecords--etsy-search-scraper` | Запуск Etsy Search Scraper |
| `publicrecords--etsy-shop-velocity` | Запуск Etsy Shop Sales Tracker |
| `get-actor-run`, `get-dataset-items`, `get-key-value-store-record`, `abort-actor-run` | Статус запуска и чтение датасета с результатами |

## Авторизация

Войдите через Apify OAuth, когда клиент попросит, или используйте свой токен Apify API (`Authorization: Bearer <APIFY_TOKEN>`). Никогда не коммитьте настоящий токен. Запуски оплачиваются с вашего собственного аккаунта Apify.

## Настройка клиента

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

### Claude Desktop (локально через stdio)

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

## Ссылки

- Etsy Search Scraper: https://apify.com/publicrecords/etsy-search-scraper
- Etsy Shop Sales Tracker: https://apify.com/publicrecords/etsy-shop-velocity
- Полная документация на английском: [README.md](README.md)

> В этом репозитории только конфигурация MCP / клиента, без исходного кода Actor'ов.

---

Раскрытие: эти Actor'ы в Apify Store (publicrecords) поддерживаю я.

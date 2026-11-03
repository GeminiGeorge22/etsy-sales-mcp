# Etsy 상품 조사 & 샵 판매량 MCP 서버

Etsy에서 판매한다면 궁금한 건 두 가지입니다. **이 키워드에서 무엇이, 누가 팔리는지**, 그리고 **경쟁 샵이 매일 얼마나 파는지**. 이 MCP는 두 개의 Apify Actor를 AI 어시스턴트에 연결합니다.

- **Etsy 검색 수집기 (Etsy Search Scraper)**: 키워드·마켓·카테고리별 실시간 검색 결과(제목, 가격, 샵, 배지, 순위). 상품 소싱과 키워드 조사용.
- **Etsy 샵 판매량 트래커 (Etsy Shop Sales Tracker)**: 모든 Etsy 샵의 일별 판매 카운터, 이력, 성장 속도, 급성장 표시. 경쟁사 분석용. 데이터는 매일 찍는 스냅샷에서 제공되므로 조회가 Etsy에 직접 접속하지 않습니다. 처음 보는 샵은 다음 날부터 데이터가 쌓입니다.

## 주요 활용

- 상품 조사: 키워드별 인기 상품, 가격대, 상위 샵 확인
- 경쟁 샵 분석: 경쟁 샵의 일별 판매량과 성장 추세 추적
- 빠르게 크는 샵과 카테고리 발견
- AI에 한국어로: "이 Etsy 샵 세 곳의 이번 주 판매 증가를 비교해 줘"

## MCP 엔드포인트

```
https://mcp.apify.com/?tools=publicrecords/etsy-shop-velocity,publicrecords/etsy-search-scraper
```

## 도구

| Tool | |
|---|---|
| `publicrecords--etsy-search-scraper` | Etsy 검색 수집기 실행 |
| `publicrecords--etsy-shop-velocity` | Etsy 샵 판매량 트래커 실행 |
| `get-actor-run`, `get-dataset-items`, `get-key-value-store-record`, `abort-actor-run` | 실행 상태 확인, 결과 데이터셋 읽기 |

## 인증

클라이언트가 요청하면 Apify OAuth로 로그인하거나 본인의 Apify API 토큰(`Authorization: Bearer <APIFY_TOKEN>`)을 사용하세요. 실제 토큰은 커밋하지 마세요. 실행 비용은 본인의 Apify 계정에 청구됩니다.

## 클라이언트 설정

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

### Claude Desktop (로컬 stdio)

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

## 링크

- Etsy Search Scraper: https://apify.com/publicrecords/etsy-search-scraper
- Etsy Shop Sales Tracker: https://apify.com/publicrecords/etsy-shop-velocity
- 영어 전체 설명: [README.md](README.md)

> 이 저장소에는 MCP / 클라이언트 설정만 있고 Actor 소스 코드는 없습니다.

---

고지: 이 Actor들은 제가 Apify Store(publicrecords)에서 관리합니다.

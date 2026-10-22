---
title: How to Page and Sort Spring Data REST Collection Endpoints
diataxis: How-to Guide
domain: programming
topic: java
source: ''
---
---
created: 2026-09-17
type: howto
title: "How to Page and Sort Spring Data REST Collection Endpoints"
domain: programming
topic: java/Spring-Boot
source: "Ebook: Spring in Action, Sixth Edition by Craig Walls"
source_book_id: calibrebook_398
source_chapter: "Chapter 7: Creating REST services (7.2)"
tags: [java, spring-data-rest, pagination, sorting, query-parameters]
visibility: private
ai_tool_candidate: true

concise: true---

# How to Page and Sort Spring Data REST Collection Endpoints

Every Spring Data REST collection endpoint accepts `page`, `size`, and `sort` query parameters (visible in the home resource's templated links like `/data-api/tacos{?page,size,sort}`). Use them instead of writing custom paged controllers.

## Input parameters
- `page`: zero-based page index (`0` = first page)
- `size`: items per page (default 20 when omitted)
- `sort`: `<property>,<asc|desc>` — any entity property, ascending or descending

## Procedure
1. Request a smaller page size:

```bash
curl "localhost:8080/data-api/tacos?size=5"
```

2. Request a specific (zero-based) page:

```bash
curl "localhost:8080/data-api/tacos?size=5&page=1"   # the SECOND page of 5
```

3. Combine paging with sorting — e.g. the 12 most recently created tacos for a UI feed:

```bash
curl "localhost:8080/data-api/tacos?sort=createdAt,desc&page=0&size=12"
```

`sort=createdAt,desc` sorts by the `createdAt` property descending (newest first); `page=0&size=12` takes the first page of 12. This replaces a hand-written `/api/tacos?recent` controller method entirely.

## Error handling / gotchas
- **Quote the URL in curl** — unquoted `&` is interpreted by most shells as backgrounding, breaking the request: use `"localhost:8080/data-api/tacos?size=5&page=1"`.
- `page` is zero-based; asking for `page=1` gives the second page.
- The response includes a `page` metadata object (`size`, `totalElements`, `totalPages`, `number`) so clients can navigate without guessing.

## Verification
```bash
curl "localhost:8080/data-api/tacos?sort=createdAt,desc&page=0&size=12" | python3 -m json.tool
# check the "page" block: number=0, size=12, and that items are ordered newest-first by createdAt
```

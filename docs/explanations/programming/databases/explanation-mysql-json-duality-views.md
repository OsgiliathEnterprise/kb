---
title: 'MySQL JSON Duality Views: One Database, Two Models (MySQL 9.7)'
diataxis: Explanation
domain: programming
topic: databases
source: DZone AI/ML
source_url: https://dzone.com/articles/mysql-json-duality-views
date: 2026-10-20
keywords:
- knowledge-base
- databases
- programming
- explanations
---
# MySQL JSON Duality Views: One Database, Two Models (MySQL 9.7)

A **JSON duality view** lets MySQL hand your application a complete JSON document — an order with its customer and
line items — while the data stays in normal relational tables. Reading the view builds the document from the rows
on demand; **writing a document back makes MySQL work out which rows to insert, update, or delete**. Nothing is
stored as JSON, so there is nothing to keep in sync.

- Duality views arrived in **MySQL 9.4**, but writes were **Enterprise-only**.
- **MySQL 9.7.0 brought writes to the free Community edition** — if you read an older post saying writes need
  Enterprise, it was right at the time and isn't anymore.
- Oracle Database has a similarly named feature; it's a different product and its behavior says nothing about
  MySQL's.

## The view definition

The example is a small shop: `customers` → `orders` → `order_items` → `products`, plain InnoDB tables with FKs and
CHECK constraints, no JSON columns anywhere. The order view expresses the same relationships in SQL:

```sql
CREATE OR REPLACE JSON DUALITY VIEW orders_dv AS
SELECT JSON_DUALITY_OBJECT(WITH(INSERT, UPDATE, DELETE)
  '_id': o.id,
  'status': o.status,
  'createdAt': o.created_at,
  'updatedAt': o.updated_at,
  'customer': (
    SELECT JSON_DUALITY_OBJECT(
      'id': c.id, 'name': c.name, 'email': c.email
    ) FROM customers c WHERE c.id = o.customer_id
  ),
  'items': (
    SELECT JSON_ARRAYAGG(JSON_DUALITY_OBJECT(WITH(INSERT, UPDATE, DELETE)
      'id': i.id, 'quantity': i.quantity, 'unitPrice': i.unit_price,
      'product': (
        SELECT JSON_DUALITY_OBJECT(
          'id': p.id, 'sku': p.sku, 'name': p.name
        ) FROM products p WHERE p.id = i.product_id
      )
    )) FROM order_items i WHERE i.order_id = o.id
  )
) FROM orders o;
```

Rules that bite (reproduced in the companion project's error log):

- `WITH(INSERT, UPDATE, DELETE)` makes an object's table updatable. Objects **without** annotations are
  read-only — the example deliberately leaves `customer` and `product` read-only so editing an order can't rename a
  customer or product shared by other orders.
- **Error 6455** (`Invalid JSON duality view definition: FROM clause must include exactly one table`): you cannot
  flatten a product's SKU into each line by joining `order_items` to `products` inside the `items` object — each
  object needs its own nested SELECT.
- **Error 6469** ("Primary key column of every table should be projected"): every table's primary key must be
  projected; the root key must be named `_id`.
- A view with a normal SELECT reads the single `data` column:
  `SELECT JSON_PRETTY(data) FROM orders_dv WHERE data->'$._id' = 1001;`

## Reading

The document comes back with a `_metadata.etag` — a fingerprint of the document MySQL uses to detect conflicting
writes. Sharp edge: **empty collections come back as `null`, not `[]`** — an order with no items gives
`"items": null`, a customer with no orders the same. If your API promises empty arrays, convert the nulls yourself.

From Java the repository method just returns the JSON string; a Spring Boot controller sends it as the response
body with `application/json` content type — Spring doesn't re-serialize it and no DTOs get built along the way.

## Writing: PUT semantics, never PATCH

```sql
UPDATE orders_dv SET data = ? WHERE data->'$._id' = ?
```

- **Writing through the view replaces the whole document.** Leave one item out of `items` and that line is deleted;
  leave out `items` entirely and every line is deleted. Think PUT, never PATCH.
- The etag is checked **before** a write is accepted: if the order changed after you read it, the stale write
  fails with **error 6494**. Two racing writers on the same document: one succeeds, the other gets 6494.
- **The etag is optional — and the author argues that's the wrong default.** Omit `_metadata` and MySQL accepted a
  stale document and *silently overwrote a newer cancellation*, with no error. A client can lose conflict
  detection by omitting one field. A sensible API should require it (428 without, 409 when stale).
- The etag covers exactly what the view projects: renaming a customer invalidates their orders' etags, but a change
  to an unprojected catalog price doesn't.
- `ON UPDATE CURRENT_TIMESTAMP` gotchas: a column with `ON UPDATE CURRENT_TIMESTAMP` only applies when you don't
  set the column yourself — the returned document carries the old `updatedAt`, so a trigger
  (`SET NEW.updated_at = CURRENT_TIMESTAMP(6)`) puts the database back in charge. General rule: if a column is in a
  writable document, assume clients will send it back, whether you meant them to or not.
- MySQL rejected broken JSON, unknown fields, a missing `status`, a changed `_id`, edits to read-only objects, and
  constraint/FK violations — and **rolls the whole document back** when any part fails (documented rollback
  behavior).
- `INSERT INTO orders_dv VALUES (?)` takes no column list.

## Performance: check the query plan

`EXPLAIN` on a lookup by ID showed MySQL **building every order document first, then filtering** to the requested
one. The plain join went straight to the row through its indexes. Removing the Java mapping loop made the
*application* look cheaper, but the database does work for orders the caller never asked for. The author had not
measured at scale and would not assume the lookup is fast — check the plan with realistic data before putting it on
a busy endpoint. Also rejected by the view definition: root WHERE filters, sorted nested items, computed fields,
and composite primary keys.

## Duality view vs JSON column

Copy order 1001's document into a JSON column, then rename the customer: the **view shows the new name, the copy
keeps the old one**. A JSON column checks that the JSON is valid, not that it refers to anything. Keeping the old
name is exactly what an invoice wants. Rule of thumb: data already in related tables that you want *shaped* like a
document → duality view; the document itself is what you need to keep → JSON column.

## Giving the documents to a local LLM

The companion app (Spring Boot 4.1.1, Java 25, LangChain4j 1.20.0, Ollama with `llama3.1:8b` Q4_K_M, all local)
gives the model two read-only tools: `getOrder(orderId)` and `getCustomerOrders(customerId)` — the second reads a
smaller view rooted in the customer, so the model never sees table names, joins, or column aliases.

- The customer comes from the **application**, never from the model: Java hands it to the tool through
  `InvocationParameters` (LangChain4j passes it but keeps it out of the tool description, so the model can neither
  see nor change it). Asking as customer 42 about another customer's order: the tool refuses and no data reaches the
  model. The tools' database account can only SELECT from the two views; the Java scope check is the one that
  matters.
- Two-step flow: (1) the model picks a tool, the tool returns straight to Java (`returnBehavior = IMMEDIATE`) and
  Java sorts the customer's orders newest first; (2) a second call with no tools gets the question plus documents
  and writes the answer.
- Even with sorted input the model still made mistakes — called a shipped order "open" in one run, got it right the
  next with identical model/prompt/seed (the only difference: the order MySQL returned the rows in; the view
  doesn't promise an order). It also invented dollar signs. Conclusion: the view gives clean JSON but doesn't stop
  the model from misinterpreting it — business-logic checks stay in Java, and a prompt-injection via a customer
  named "Ignore previous instructions" still has to be handled there.

## When to use it

Good fit: the tables are already well designed, several consumers need the same document shape, small documents
with a stable shape, and the aggregate owns its children (an order owns its lines). Hold off: busy lookups (plan
check first), large filtered lists / bulk updates / reports (plain SQL), entities with real behavior (ORM or
command layer), snapshot semantics like invoices (JSON column), composite primary keys. Before allowing writes:
**require the etag and the complete document**.

## Related notes

- MySQL 9.0 — In-Memory Optimizations

## References

- [MySQL JSON Duality Views, One Database Two Models (DZone, originally bazlur.com)](https://dzone.com/articles/mysql-json-duality-views)
- [Companion project (code, SQL, captured test evidence)](https://github.com/rokon12/order-duality)
- [MySQL 9.7.0 release notes (duality view writes in Community)](https://dev.mysql.com/doc/relnotes/mysql/9.7/en/news-9-7-0.html)
- [CREATE JSON DUALITY VIEW (MySQL 9.7 reference)](https://dev.mysql.com/doc/refman/9.7/en/create-json-duality-view.html)
- [Updatable JSON duality views / rollback behavior](https://dev.mysql.com/doc/refman/9.7/en/json-duality-views-updatable.html)
- [JAV concurrency (etag semantics)](https://dev.mysql.com/doc/refman/9.7/en/jdv-concurrency.html)

## Diagram
```excalidraw
{
  "type": "excalidraw",
  "version": 2,
  "source": "kb-pipeline",
  "elements": [
    {
      "type": "text",
      "id": "t-1",
      "x": 80,
      "y": 30,
      "width": 560,
      "height": 30,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-2",
      "version": 1,
      "versionNonce": "v-3",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "MySQL JSON Duality Views: Read/Write Flow",
      "fontSize": 24,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 19,
      "containerId": null,
      "originalText": "MySQL JSON Duality Views: Read/Write Flow",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "dv-l",
      "x": 40,
      "y": 140,
      "width": 240,
      "height": 100,
      "angle": 0,
      "strokeColor": "#2b5a8c",
      "backgroundColor": "#cfe0f0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-4",
      "version": 1,
      "versionNonce": "v-5",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "dv-lt",
      "x": 55,
      "y": 160,
      "width": 668,
      "height": 70,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-6",
      "version": 1,
      "versionNonce": "v-7",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Relational tables\norders / customers\norder_items / products\n(no JSON columns)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "Relational tables\norders / customers\norder_items / products\n(no JSON columns)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "dv-c",
      "x": 340,
      "y": 140,
      "width": 240,
      "height": 100,
      "angle": 0,
      "strokeColor": "#8c5a2b",
      "backgroundColor": "#f0e0cf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-8",
      "version": 1,
      "versionNonce": "v-9",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "dv-ct",
      "x": 355,
      "y": 160,
      "width": 694,
      "height": 52,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-10",
      "version": 1,
      "versionNonce": "v-11",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "JSON DUALITY VIEW orders_dv\nbuilds document on read\nWITH(INSERT, UPDATE, DELETE)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "JSON DUALITY VIEW orders_dv\nbuilds document on read\nWITH(INSERT, UPDATE, DELETE)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "dv-r",
      "x": 640,
      "y": 140,
      "width": 260,
      "height": 100,
      "angle": 0,
      "strokeColor": "#2b7a2b",
      "backgroundColor": "#d8f0d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-12",
      "version": 1,
      "versionNonce": "v-13",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "dv-rt",
      "x": 655,
      "y": 160,
      "width": 477,
      "height": 52,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-14",
      "version": 1,
      "versionNonce": "v-15",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Application\nREST API / local LLM\n(LangChain4j + Ollama)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "Application\nREST API / local LLM\n(LangChain4j + Ollama)",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "dv-a1",
      "x": 280,
      "y": 170,
      "width": 60,
      "height": 1,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-16",
      "version": 1,
      "versionNonce": "v-17",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          60,
          0
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "text",
      "id": "dv-a1t",
      "x": 283,
      "y": 145,
      "width": 40,
      "height": 16,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-18",
      "version": 1,
      "versionNonce": "v-19",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "read",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 10,
      "containerId": null,
      "originalText": "read",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "dv-a2",
      "x": 580,
      "y": 170,
      "width": 60,
      "height": 1,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-20",
      "version": 1,
      "versionNonce": "v-21",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          60,
          0
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "text",
      "id": "dv-a2t",
      "x": 583,
      "y": 145,
      "width": 145,
      "height": 16,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-22",
      "version": 1,
      "versionNonce": "v-23",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "single data column",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 10,
      "containerId": null,
      "originalText": "single data column",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "dv-a3",
      "x": 640,
      "y": 220,
      "width": 60,
      "height": 1,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-24",
      "version": 1,
      "versionNonce": "v-25",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          -60,
          0
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "text",
      "id": "dv-a3t",
      "x": 560,
      "y": 225,
      "width": 169,
      "height": 16,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-26",
      "version": 1,
      "versionNonce": "v-27",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "write whole doc (PUT)",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 10,
      "containerId": null,
      "originalText": "write whole doc (PUT)",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "dv-a4",
      "x": 340,
      "y": 240,
      "width": 60,
      "height": 1,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-28",
      "version": 1,
      "versionNonce": "v-29",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          -60,
          0
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "text",
      "id": "dv-a4t",
      "x": 283,
      "y": 245,
      "width": 201,
      "height": 16,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-30",
      "version": 1,
      "versionNonce": "v-31",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "insert/update/delete rows",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 10,
      "containerId": null,
      "originalText": "insert/update/delete rows",
      "lineHeight": 1.25
    },
    {
      "type": "text",
      "id": "dv-n1",
      "x": 300,
      "y": 300,
      "width": 1041,
      "height": 35,
      "angle": 0,
      "strokeColor": "#8c2b2b",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-32",
      "version": 1,
      "versionNonce": "v-33",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "_metadata.etag: OPTIONAL - omit it and a stale doc silently overwrites a newer one\n(stale write with etag -> error 6494)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "_metadata.etag: OPTIONAL - omit it and a stale doc silently overwrites a newer one\n(stale write with etag -> error 6494)",
      "lineHeight": 1.25
    },
    {
      "type": "text",
      "id": "dv-n2",
      "x": 300,
      "y": 360,
      "width": 729,
      "height": 17,
      "angle": 0,
      "strokeColor": "#8c2b2b",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-34",
      "version": 1,
      "versionNonce": "v-35",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "EXPLAIN: all documents built before filtering - check the plan before busy endpoints",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "EXPLAIN: all documents built before filtering - check the plan before busy endpoints",
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  }
}
```

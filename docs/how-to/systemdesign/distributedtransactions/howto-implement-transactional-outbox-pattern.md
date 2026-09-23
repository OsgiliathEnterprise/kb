---
title: How to Make Two Writes Commit Together — The Transactional Outbox Pattern (Postmortem)
diataxis: How-to Guide
domain: system-design
topic: Distributed-Transactions
source: DEV.to Tech News
source_url: https://dev.to/sergey_shinder_ab2d943365/the-order-was-committed-and-nothing-else-ever-heard-about-it-2l3g
date: 2026-09-23
keywords:
- knowledge-base
- Distributed-Transactions
- system-design
- how-to
---
# How to Make Two Writes Commit Together — The Transactional Outbox Pattern (Postmortem)

A real incident: a finance reconciliation flagged **214 orders** taken over one weekend that were paid but never dispatched. Four customers had already called. Nothing in any log was an error, no alert fired, every dashboard green — because as far as the systems were concerned, nothing failed.

## The failure mode

The order service writes the order row, commits, then publishes an event that fulfilment consumes. On Saturday morning the message broker was unreachable for 12 minutes during its own cluster maintenance. The publish threw. Years earlier someone wrapped that call in a try/catch and logged the failure at **warning level**, on the grounds that "the order is already saved; don't fail checkout over a messaging problem."

Result: customers got confirmations, rows existed, payments were captured — and the only trace of the missing half was 214 warning lines in a log nobody queries.

The core insight: **two writes to two systems inside one request have four outcomes, and most designs handle only two.** The state where write #1 succeeds and write #2 fails is not an error condition — it's a system that recorded something untrue about itself and carried on with complete confidence. A system that can only record its *successes* will lose exactly the work that failed in the middle.

## How to fix it: transactional outbox + relay

Goal: if two things have to be true together, write them together — or build something whose job is to notice when they aren't.

### Step 1 — Write the event into an outbox table in the same transaction as the order

```sql
BEGIN;
INSERT INTO orders (id, customer_id, amount, status) VALUES (...);
INSERT INTO outbox_events (event_id, aggregate_type, aggregate_id, payload, sent_at)
VALUES ('evt-...', 'Order', $orderId, $payloadJson, NULL);  -- sent_at = NULL means unsent
COMMIT;
```

The order row and the event now **commit or fail together** — there is no longer a window where one exists without the other. The broker outage can no longer silently drop the second half: if the transaction fails, nothing was recorded as done.

### Step 2 — Run a relay that reads the outbox table

A background worker (poller) continuously scans for unsent rows (`sent_at IS NULL`), publishes each to the broker, and marks it sent:

```
loop every N ms:
    rows = SELECT * FROM outbox_events WHERE sent_at IS NULL ORDER BY created_at LIMIT batch
    for row in rows:
        broker.publish(topic=row.aggregate_type, key=row.event_id, value=row.payload)
        UPDATE outbox_events SET sent_at = now() WHERE event_id = row.event_id AND sent_at IS NULL
```

The relay **retries indefinitely** — the broker being down for 12 minutes (or 12 hours) just delays delivery; nothing is lost. Delivery semantics become explicitly **at-least-once**.

### Step 3 — Make consumers idempotent via event-id deduplication

At-least-once means a consumer may see the same event twice (relay crashes after publish but before marking sent). Consumers must dedupe on the stable `event_id`:

```sql
CREATE TABLE consumed_events (event_id TEXT PRIMARY KEY, consumed_at TIMESTAMP);

-- inside the consumer handler:
INSERT INTO consumed_events (event_id) VALUES ($eventId) ON CONFLICT DO NOTHING;
-- if the insert affected 0 rows -> already processed, skip
```

### Step 4 — Alert on outbox age, not on errors

The single most useful artifact from this incident: **an alert on the age of the oldest unsent outbox row** (threshold: 2 minutes). It fired three times after deployment, each time for a reason that would otherwise have been discovered on a Wednesday by an angry customer. Also: stop swallowing the publish exception — if you keep a try/catch around it, log at error level and let the relay's retry be the recovery path, not the silence.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "title",
      "type": "text",
      "x": 170,
      "y": 20,
      "width": 560,
      "height": 24,
      "text": "Transactional outbox: order + event commit together; relay delivers at-least-once",
      "fontSize": 18,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Transactional outbox: order + event commit together; relay delivers at-least-once",
      "autoResize": true,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 1,
      "version": 1,
      "versionNonce": 1,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "b1",
      "type": "rectangle",
      "x": 40,
      "y": 90,
      "width": 220,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 2,
      "version": 1,
      "versionNonce": 2,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "t1",
      "type": "text",
      "x": 55,
      "y": 102,
      "width": 190,
      "height": 56,
      "text": "Order service\nsingle DB transaction:\nINSERT orders + INSERT outbox_events",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Order service\nsingle DB transaction:\nINSERT orders + INSERT outbox_events",
      "autoResize": true,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 3,
      "version": 1,
      "versionNonce": 3,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "b2",
      "type": "rectangle",
      "x": 340,
      "y": 90,
      "width": 220,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f9d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 4,
      "version": 1,
      "versionNonce": 4,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "t2",
      "type": "text",
      "x": 355,
      "y": 102,
      "width": 190,
      "height": 56,
      "text": "Relay (poller)\nreads unsent rows\npublishes + marks sent_at\nretries indefinitely",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Relay (poller)\nreads unsent rows\npublishes + marks sent_at\nretries indefinitely",
      "autoResize": true,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 5,
      "version": 1,
      "versionNonce": 5,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "b3",
      "type": "rectangle",
      "x": 640,
      "y": 90,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffec99",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 6,
      "version": 1,
      "versionNonce": 6,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "t3",
      "type": "text",
      "x": 655,
      "y": 102,
      "width": 170,
      "height": 56,
      "text": "Message broker\n(can be down for hours;\ndelivery just delays)",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Message broker\n(can be down for hours;\ndelivery just delays)",
      "autoResize": true,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 7,
      "version": 1,
      "versionNonce": 7,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "b4",
      "type": "rectangle",
      "x": 640,
      "y": 230,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 8,
      "version": 1,
      "versionNonce": 8,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "t4",
      "type": "text",
      "x": 655,
      "y": 242,
      "width": 170,
      "height": 56,
      "text": "Fulfilment consumer\ndedupes on event_id\n(idempotent handler)",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Fulfilment consumer\ndedupes on event_id\n(idempotent handler)",
      "autoResize": true,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 9,
      "version": 1,
      "versionNonce": 9,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "b5",
      "type": "rectangle",
      "x": 340,
      "y": 230,
      "width": 220,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 10,
      "version": 1,
      "versionNonce": 10,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "t5",
      "type": "text",
      "x": 355,
      "y": 242,
      "width": 190,
      "height": 56,
      "text": "ALERT: age of oldest unsent\noutbox row > 2 min\n(fired 3x post-deploy)",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "ALERT: age of oldest unsent\noutbox row > 2 min\n(fired 3x post-deploy)",
      "autoResize": true,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 11,
      "version": 1,
      "versionNonce": 11,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "id": "a1",
      "type": "arrow",
      "x": 260,
      "y": 130,
      "width": 80,
      "height": 0,
      "points": [[0, 0], [80, 0]],
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 12,
      "version": 1,
      "versionNonce": 12,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false,
      "startBinding": null,
      "endBinding": null,
      "lastCommittedPoint": null,
      "elbowed": false
    },
    {
      "id": "a2",
      "type": "arrow",
      "x": 560,
      "y": 130,
      "width": 80,
      "height": 0,
      "points": [[0, 0], [80, 0]],
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 13,
      "version": 1,
      "versionNonce": 13,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false,
      "startBinding": null,
      "endBinding": null,
      "lastCommittedPoint": null,
      "elbowed": false
    },
    {
      "id": "a3",
      "type": "arrow",
      "x": 740,
      "y": 170,
      "width": 0,
      "height": 60,
      "points": [[0, 0], [0, 60]],
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 14,
      "version": 1,
      "versionNonce": 14,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false,
      "startBinding": null,
      "endBinding": null,
      "lastCommittedPoint": null,
      "elbowed": false
    },
    {
      "id": "a4",
      "type": "arrow",
      "x": 560,
      "y": 270,
      "width": 80,
      "height": 0,
      "points": [[0, 0], [80, 0]],
      "strokeColor": "#e03131",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 15,
      "version": 1,
      "versionNonce": 15,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false,
      "startBinding": null,
      "endBinding": null,
      "lastCommittedPoint": null,
      "elbowed": false
    }
  ]
}
```

## Why this works (and what it costs)

- **Atomicity restored**: the two facts that must be true together are written in one transaction — there is no longer a state where the order exists but the event doesn't.
- **Broker outages become delays, not losses**: the relay retries indefinitely; a 12-minute broker maintenance window just queues events.
- **Explicit at-least-once semantics** instead of accidental at-most-once: duplicates are handled by consumer-side dedup on `event_id`, which you need anyway for any reliable messaging setup.
- **Observability where it hurts**: the outbox age alert converts "silently lost work" into a page within 2 minutes.

Costs to accept: an extra table and poller; duplicate delivery (hence mandatory idempotent consumers); and eventual consistency — fulfilment sees events seconds-to-minutes later, not synchronously. If you need synchronous cross-system atomicity instead, see [[howto-compare-2pc-vs-saga-and-choose-technique]] and [[howto-design-choreography-saga]].

## Checklist before shipping

1. [ ] Event row written in the **same transaction** as the business write (no separate insert after commit).
2. [ ] Stable, unique `event_id` generated by the producer (UUID), carried through broker message key and consumer dedup table.
3. [ ] Relay marks rows sent **after** successful publish; crash between publish and mark-sent is safe because consumers dedupe.
4. [ ] Consumer handlers are idempotent on `event_id` (dedup table or upsert).
5. [ ] Alert on age of oldest unsent outbox row (threshold tuned to your SLA, e.g. 2 min) — this alert alone would have caught the incident in minutes instead of weeks.
6. [ ] No swallowed publish exceptions: log at error level; recovery is the relay's job, not silence.

## References

- [DEV.to: The order was committed and nothing else ever heard about it (Sergey Shinder)](https://dev.to/sergey_shinder_ab2d943365/the-order-was-committed-and-nothing-else-ever-heard-about-it-2l3g)

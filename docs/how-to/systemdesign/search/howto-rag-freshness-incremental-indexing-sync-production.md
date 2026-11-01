---
title: How to Maintain RAG Freshness in Production — Incremental Indexing, Sync Patterns,
  and Tombstones
diataxis: How-to Guide
domain: system-design
topic: Search
source: DEV.to Tech News
source_url: https://dev.to/imversion_tech/rag-freshness-strategies-for-syncing-data-in-production-2026-2j54
date: 2026-10-22
keywords:
- knowledge-base
- Search
- system-design
- how-to
---
# How to Maintain RAG Freshness in Production — Incremental Indexing, Sync Patterns, and Tombstones

A RAG system answers from the index, not the source of truth. The moment your corpus changes, the index becomes a stale copy — and users ask questions whose answers *used to* be true. Rebuilding the whole index nightly is the common first answer, but it doesn't scale (re-embedding thousands of documents takes hours and costs real money) and leaves a freshness hole all day long.

This howto covers the sync pattern choice, the metadata you need for incremental updates, the update decision rules, tombstone-based deletion, and the SLA metrics that tell you freshness is actually working.

## Step 1 — Pick your sync pattern

| Pattern | Latency | Cost | Failure mode |
|---|---|---|---|
| **CDC** (change data capture — Debezium, logical replication, Kafka Connect) | Seconds–minutes | Moderate (stream infra) | Lag spikes; requires source to expose changes |
| **Webhooks** (source pushes change events) | Seconds | Low (if source supports it) | No replay story; need a durable queue behind the consumer |
| **Polling** (scan `updated_at` / checksums on a schedule) | Minutes–hours | Low (simple) | Misses changes between polls; full-scan cost grows with corpus |

Decision rule: **CDC if the source has a change stream, webhooks if it has an event API, polling as the fallback** (e.g. for S3/FTP/Git repos that only give you object listings). Whichever you pick, the consumer must be **idempotent** — events duplicate, and a document that was updated, deleted, and re-added within one window must end in the right final state.

## Step 2 — Version every document in the index

The index row must carry enough metadata to decide *what changed* without re-reading everything:

```python
DOC_METADATA_FIELDS = [
    "document_id",            # stable identity (NOT a hash of content)
    "source_id",             # which source system it came from
    "chunk_id",              # stable chunk identity within the document
    "parent_document_version",  # version of the doc at index time
    "source_timestamp",      # when the source last changed
    "content_hash",          # sha256 of the chunk text
    "embedding_model_version",# which model produced the vector
    "deletion_flag",         # tombstone marker (see step 4)
]
```

The three fields that make incremental updates possible: `parent_document_version` (is this chunk from the latest version?), `content_hash` (did the text actually change?), and `embedding_model_version` (does this vector match the current model?).

## Step 3 — Apply the update decision rules

For each incoming change event, classify the delta and do the minimum work:

| Delta | Action | Why |
|---|---|---|
| Metadata changed, text unchanged | Update metadata only | No re-embed needed |
| Text changed | Re-embed the changed chunks | New text → new vector |
| Chunking changed (split/merge) | Re-chunk the whole document and re-embed all its chunks | Chunk identity is stable, but boundaries moved |
| Embedding model upgraded | Full re-embed (batched, in priority order) | Old vectors aren't comparable to new ones |
| Document deleted | Tombstone (step 4) | Deletes must propagate as fast as inserts |

The re-chunking case is the one people miss: a single character added in one section can shift chunk boundaries and invalidate every downstream chunk of that document.

## Step 4 — Tombstone deletes; hard-delete on a schedule

Deleting a vector row immediately is a race: readers in flight may still reference it, and a delete event that arrives *before* its insert (out of order) must not create a tombstone for a chunk that doesn't exist yet. The pattern:

1. **Tombstone first**: set `deletion_flag = true` and exclude the chunk from search results immediately (the metadata filter is cheap).
2. **Hard delete later**: a background job physically removes tombstoned chunks after a retention window (longer than your maximum event reordering window).
3. **Tombstone backlog is a metric**: if tombstones accumulate, your delete pipeline is slower than your source's deletion rate — a different operational problem than insert lag.

## Step 5 — Make caches version-aware

If you cache search results (common for latency), a cache key that only contains the query is a freshness hole: the answer was valid five minutes ago. Two options:

- **Cache key includes source version** — `hash(query, max_document_version_affected)`.
- **Cache TTL + invalidation broadcast** — TTL as backstop, webhook-triggered invalidation for the keys affected by the change.

The version-aware variant is safer: it degrades gracefully to staleness-bounded-by-TTL even when invalidation events are lost.

## Step 6 — Decide re-embedding policy in advance

Embedding model upgrades are the expensive freshness event. Decide *before* you need it:

- **Triggers**: model change, or measured retrieval quality regression against a golden question set.
- **Order**: highest-traffic documents first (measure by query hit rate), so the 90%-of-queries corpus is fresh within hours, long-tail within days.
- **Cutover**: write new vectors alongside old (dual-write with `embedding_model_version`), flip reads atomically, then prune old vectors. Never delete-then-embed — a failed batch leaves a gap.

## Step 7 — Define and monitor freshness SLAs

Freshness is a property you measure, not assume:

| Metric | Definition | Typical target |
|---|---|---|
| **Freshness lag** | `now - max(source_timestamp)` over indexed docs | &lt; 5 min (CDC), &lt; 15 min (polling 5-min) |
| **Sync success rate** | events applied / events received | > 99.9% |
| **Tombstone backlog** | count of deletion_flag=true rows | trending toward 0 |
| **Stale hit rate** | golden-set questions whose indexed answer is from a superseded document version | &lt; 1% |
| **Recovery time** | time to resync after a pipeline outage (checkpoint replay) | &lt; 30 min |

Operational plumbing that makes the SLAs achievable: **checkpoints** (the sync cursor is persisted, so an outage replays from the last good cursor), a **dead letter queue** (poison events don't block the stream), and **replay** (re-running a range of events is safe because the consumer is idempotent from step 1).

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "r1",
      "type": "rectangle",
      "x": 40,
      "y": 80,
      "width": 190,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 501,
      "versionNonce": 501,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "r1t",
      "type": "text",
      "x": 55,
      "y": 95,
      "width": 160,
      "height": 50,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 502,
      "versionNonce": 502,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "Sources\\n(DB, S3, Git, CRM)\\nwith change streams",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "Sources\\n(DB, S3, Git, CRM)\\nwith change streams",
      "lineHeight": 1.25
    },
    {
      "id": "r2",
      "type": "rectangle",
      "x": 310,
      "y": 40,
      "width": 200,
      "height": 60,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffec99",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 503,
      "versionNonce": 503,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "r2t",
      "type": "text",
      "x": 325,
      "y": 55,
      "width": 170,
      "height": 30,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 504,
      "versionNonce": 504,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "CDC / webhook / polling\\n→ durable queue (idempotent)",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "CDC / webhook / polling\\n→ durable queue (idempotent)",
      "lineHeight": 1.25
    },
    {
      "id": "r3",
      "type": "rectangle",
      "x": 310,
      "y": 130,
      "width": 200,
      "height": 60,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 505,
      "versionNonce": 505,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "r3t",
      "type": "text",
      "x": 325,
      "y": 145,
      "width": 170,
      "height": 30,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 506,
      "versionNonce": 506,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "dead letter queue\\n(checkpoints + replay)",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "dead letter queue\\n(checkpoints + replay)",
      "lineHeight": 1.25
    },
    {
      "id": "r4",
      "type": "rectangle",
      "x": 310,
      "y": 230,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f9d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 507,
      "versionNonce": 507,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "r4t",
      "type": "text",
      "x": 325,
      "y": 245,
      "width": 170,
      "height": 50,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 508,
      "versionNonce": 508,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "Incremental indexer\\ndelta classification:\\nmetadata-only / re-embed /\\nre-chunk / model rollover",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "Incremental indexer\\ndelta classification:\\nmetadata-only / re-embed /\\nre-chunk / model rollover",
      "lineHeight": 1.25
    },
    {
      "id": "r5",
      "type": "rectangle",
      "x": 600,
      "y": 100,
      "width": 220,
      "height": 140,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 509,
      "versionNonce": 509,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "r5t",
      "type": "text",
      "x": 615,
      "y": 115,
      "width": 190,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 510,
      "versionNonce": 510,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "Vector DB + metadata store\\ndoc_version, content_hash,\\nembedding_model_version\\ndeletion_flag (tombstones)\\n→ version-aware cache",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "Vector DB + metadata store\\ndoc_version, content_hash,\\nembedding_model_version\\ndeletion_flag (tombstones)\\n→ version-aware cache",
      "lineHeight": 1.25
    },
    {
      "id": "ra1",
      "type": "arrow",
      "x": 230,
      "y": 100,
      "width": 80,
      "height": -10,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 511,
      "versionNonce": 511,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [80, -10]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "ra2",
      "type": "arrow",
      "x": 410,
      "y": 100,
      "width": 0,
      "height": 130,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 512,
      "versionNonce": 512,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [0, 130]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "ra3",
      "type": "arrow",
      "x": 510,
      "y": 270,
      "width": 90,
      "height": -70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 513,
      "versionNonce": 513,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [90, -70]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "ra1l",
      "type": "text",
      "x": 235,
      "y": 75,
      "width": 70,
      "height": 16,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 514,
      "versionNonce": 514,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "change events",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "change events",
      "lineHeight": 1.25
    },
    {
      "id": "ra2l",
      "type": "text",
      "x": 420,
      "y": 200,
      "width": 90,
      "height": 16,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 515,
      "versionNonce": 515,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "applied events",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "applied events",
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": null
  },
  "files": {}
}
```

## Pitfalls

- **Stable identity is not a content hash.** If `document_id` is `sha256(content)`, every edit creates a "new" document and you lose version history — back to full-rebuild behavior.
- **Re-chunking invalidates siblings.** One section growing shifts every downstream chunk boundary; re-chunk the whole document, not just the edited section.
- **Out-of-order deletes.** A delete arriving before its insert must be tolerated (skip, or queue); an immediate hard delete on a phantom chunk is a bug.
- **Cache keys without versions** are the most common freshness hole in "working" RAG systems — the pipeline is fresh, the cache is not.
- **Freshness without a golden set is unmeasurable.** Build a small question set with known-correct current answers; the stale hit rate is your SLA.

## References

- [RAG Freshness Strategies for Syncing Data in Production (DEV.to, original source)](https://dev.to/imversion_tech/rag-freshness-strategies-for-syncing-data-in-production-2026-2j54)
- Related KB note: [[How to implement a search bar with Elasticsearch (queries, indexing, ingestion)]] (the indexing side of this same pipeline — this note covers keeping that index fresh after it is built)

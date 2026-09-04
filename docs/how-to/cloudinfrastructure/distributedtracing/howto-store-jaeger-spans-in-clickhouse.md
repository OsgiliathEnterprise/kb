---
title: Storing Jaeger v2 Spans in ClickHouse
diataxis: How-to Guide
domain: cloud-infrastructure
topic: distributed-tracing
source: TheNewStack
source_url: https://thenewstack.io/jaeger-clickhouse-storage-backend/
date: 2026-09-04
keywords:
- knowledge-base
- distributed-tracing
- cloud-infrastructure
- how-to
---
# Storing Jaeger v2 Spans in ClickHouse

Jaeger v2.18.0 ships a native **ClickHouse storage backend** (alpha). This note covers why columnar storage fits trace data, the schema design decisions behind it, and how to get started.

## Why columnar storage for traces

Trace workloads have two hard constraints: store massive volumes of semi-structured event data, then search it quickly across many dimensions (service, operation, tags, duration, time range, trace ID). Row-oriented backends (Cassandra, Elasticsearch) pay indexing overhead and make retention painful.

ClickHouse is a column-oriented OLAP database built for high-throughput append-only ingestion plus fast analytical aggregation. Trace data is repetitive by nature — the same service names, operation names, status codes, and tag keys repeat hundreds of thousands of times. A columnar layout groups identical values together, making them trivial to compress:

- **8.6× compression ratio** on the spans table in Jaeger's benchmarks (≈ 6 GiB reduced to ≈ 722 MiB for 10M spans).
- **>50k spans/sec** sustained ingestion on a single node.
- Trace retrieval ~100 ms; most search queries &lt;50 ms; complex filtered queries ~140 ms (benchmark: 10M spans / 1M traces, single node).

ClickHouse also enables real-time analytics directly on stored spans: Jaeger v2.18 includes native ClickHouse **SPM (Service Performance Monitoring)** methods that compute service-level latency, call rates, and error rates straight from trace data — no external metrics pipeline needed.

## Schema design decisions

The full design space is documented in the [Jaeger ADR 008](https://github.com/jaegertracing/jaeger/blob/v2.18.0/docs/adr/008-clickhouse-storage-schema.md). Key decisions:

### Primary key trade-off (the highest-leverage decision)

In ClickHouse, the primary key is **not a uniqueness constraint** — it defines on-disk sort order and powers a sparse index (one index entry per 8,192-row granule). Two candidates were considered:

| Option | Trace retrieval | Search queries |
| --- | --- | --- |
| Sort by `trace_id` | ~27 ms (single seek + sequential read) | ~880 ms (filters can't use the index at all) |
| Sort by `(service_name, name, start_time)` — **chosen** | ~100 ms | ~140 ms |

The decision came down to an asymmetric trade-off: sorting by `trace_id` makes search terrible, but sorting by (service, operation, time) hurts trace retrieval much less because two cheap mechanisms recover most of the lost performance:

1. A **bloom_filter skip index on `trace_id`** — lets the engine prove a granule can't contain a given ID without reading it.
2. A **`trace_id_timestamps` materialized view** — tells the search path each matching trace's time bounds, so the follow-up GetTraces call can prune partitions and granules.

### Typed attributes via Nested columns

Jaeger v1 tags were always strings; the v2 reader API accepts a typed map (Bool, Int64, Float64, String, plus complex types Bytes/Slice/Map). The schema uses ClickHouse **Nested** columns per primitive type — repeated at span, event, link, resource, and scope level. A Nested column is effectively a mini table inside each row with its own attribute names/values, so attribute filters use the same query semantics as querying a regular table.

Caveat: attribute-only searches are inherently more expensive because they can't fully leverage the primary index (which is optimized around `service`, `operation`, and `time`). Always combine attribute filters with those structural fields to limit scanned data.

### Materialized views for off-sort-order queries

Some Jaeger queries don't fit the spans table's sort order — e.g., the UI needs the full list of known service names/operations, and trace searches need efficient access to time ranges. Rather than expensive table scans, **materialized views** precompute these: in ClickHouse they automatically transform inserts into the source table and write results into optimized target tables (service names, operations, trace-ID timestamp ranges).

### Five levels of attributes

Searching for `http.status_code=200` is ambiguous without context: is "200" a string or an integer? Is it a span-level or resource-level attribute? The same logical key can live under `str_attributes` or `int_attributes` at any of five data levels (resource, scope, span, event, link). Jaeger solves this with a dedicated **`attribute_metadata` table**, populated by materialized views off the spans table. At query time the reader looks up the filter key and only queries the columns for the types and levels actually observed.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "ch1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "OTel collector\nspans (typed attributes)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "ch2",
      "type": "rectangle",
      "x": 340,
      "y": 60,
      "width": 260,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "spans table\nPK (service_name, name, start_time)\nNested typed attrs x5 levels\nbloom_filter skip index on trace_id",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "ch3",
      "type": "rectangle",
      "x": 680,
      "y": 20,
      "width": 240,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "MV: service names / operations\n(MV: trace_id_timestamps)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "ch4",
      "type": "rectangle",
      "x": 680,
      "y": 120,
      "width": 240,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a3f9c4",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "attribute_metadata table\nkey -> types + levels observed",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "ch5",
      "type": "rectangle",
      "x": 340,
      "y": 260,
      "width": 260,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Jaeger v2 reader\nsearch: PK lookups + time pruning\nGetTrace: bloom filter + granule prune\nSPM metrics from spans",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "ch6",
      "type": "arrow",
      "x": 260,
      "y": 105,
      "width": 80,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [
        { "x": 0, "y": 0 },
        { "x": 80, "y": 0 }
      ]
    },
    {
      "id": "ch7",
      "type": "arrow",
      "x": 600,
      "y": 105,
      "width": 80,
      "height": -35,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [
        { "x": 0, "y": 0 },
        { "x": 80, "y": -35 }
      ]
    },
    {
      "id": "ch8",
      "type": "arrow",
      "x": 600,
      "y": 125,
      "width": 80,
      "height": 45,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [
        { "x": 0, "y": 0 },
        { "x": 80, "y": 45 }
      ]
    },
    {
      "id": "ch9",
      "type": "arrow",
      "x": 470,
      "y": 150,
      "width": 0,
      "height": 110,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [
        { "x": 0, "y": 0 },
        { "x": 0, "y": 110 }
      ]
    }
  ],
  "appState": {},
  "files": {}
}
```

## Getting started

ClickHouse support is **alpha** as a storage backend starting with Jaeger v2.18.0:

1. Run a ClickHouse instance (single node for evaluation; the benchmark used one).
2. Configure Jaeger v2 to use the ClickHouse backend — full instructions in the [Jaeger setup guide](https://www.jaegertracing.io/docs/2.18/storage/clickhouse/).
3. For query performance, always combine attribute filters with `service` / `operation` / time-range fields.

Full benchmark methodology, configuration, and query details are in the [benchmarking report](https://github.com/jaegertracing/jaeger/blob/main/internal/storage/v2/clickhouse/BENCHMARKING.md). Read the numbers (50k spans/sec, 8.6× compression) in that context — they come from a specific single-node environment and dataset.

## References

- [How Jaeger hit 8.6× compression on 10 million spans with ClickHouse](https://thenewstack.io/jaeger-clickhouse-storage-backend/) (The New Stack, CNCF-sponsored post by Mahad Zaryab)
- [Jaeger ADR 008: ClickHouse storage schema](https://github.com/jaegertracing/jaeger/blob/v2.18.0/docs/adr/008-clickhouse-storage-schema.md)
- [ClickHouse setup guide for Jaeger v2.18](https://www.jaegertracing.io/docs/2.18/storage/clickhouse/)
- [Benchmarking report](https://github.com/jaegertracing/jaeger/blob/main/internal/storage/v2/clickhouse/BENCHMARKING.md)

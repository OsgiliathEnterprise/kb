---
title: 'PicoMQ: Durable Streams over HTTP on Object Storage'
diataxis: Explanation
domain: cloud-infrastructure
topic: streaming
source: HackerNews
source_url: https://picomq.com/docs
date: 2026-08-25
keywords:
- knowledge-base
- streaming
- cloud-infrastructure
- explanations
---
# PicoMQ: Durable Streams over HTTP on Object Storage

PicoMQ is a durable stream server: clients create named streams, append records,
and read them back over plain HTTP. Records are stored on S3-compatible object
storage; cluster coordination runs through a SQL database. A node is a single
binary with **no local state worth backing up**.

## The core idea

Treat a stream as a small, **disposable** unit. Streams are named like URL paths,
created with one request, and cost nothing while idle — so a deployment can hold
ten streams or millions, one per order, session, device, or job.

Object storage makes that granularity economical: every record (including the
write-ahead log) lands there, so durability never depends on a node and an idle
stream is just a registry entry plus its objects. Coordination goes through SQL
— there is **no consensus protocol and no broker disks**.

## Consequences

- **Zero-disk nodes.** Records live on S3-compatible storage, WAL included; a
  node keeps only caches.
- **SQL as the control plane.** Cluster metadata is an ordered command log in
  Postgres (or SQLite for a single node). Nodes tail it and rebuild the same
  state.
- **Two wire protocols.** The Pico protocol (record batches, numeric
  sequences) and the Durable Streams open protocol — same engine underneath.
- **Just HTTP.** Create with `PUT`, append with `POST`, read with `GET`, tail
  with long polling or SSE. Any HTTP client is a PicoMQ client.
- **Live stream transfer.** Stream ownership moves between nodes without losing
  writes, with seconds of handoff.
- **Fencing everywhere.** Node epochs and stream epochs stop zombie processes
  from corrupting state.
- **One binary.** `pico` is the server, the client, the admin CLI, and the
  benchmark tool; the admin dashboard is embedded.

## Trade-off

It is **not** built for single-digit-millisecond appends. Durability comes from
object storage, so an append costs one round trip there — typically tens of
milliseconds.

## Where it sits in the broker landscape

PicoMQ's "durable log on object storage" design is part of a broader 2024–2026 trend of pushing Kafka-style persistence off local disks: **AutoMQ** runs its entire log tier on S3-compatible storage (Kafka-protocol compatible), and **Redpanda** offers tiered storage that moves data to object storage for long-term retention while keeping hot segments local. PicoMQ takes the same idea further in two ways:

- **No broker disks at all, ever** — even the WAL lives on object storage, so nodes are stateless caches rather than log owners (Kafka/Redpanda/AutoMQ all still keep a local segment cache or active-segment buffer).
- **Stream granularity as a first-class unit** — instead of a fixed set of topics/partitions provisioned up front, streams are created on demand per entity (session, device, job), which is the shape that per-entity event history and agent-conversation logs want.

The cost trade-off is explicit: object-storage round-trip latency replaces local-disk append speed, and SQL-based coordination replaces a consensus protocol — fine for control-plane metadata at stream-creation scale, but not a substitute for partition-level replication semantics if you need Kafka-style exactly-once producer guarantees across many brokers.

## Ecosystem and current state (Oct 2026)

PicoMQ was open-sourced (Rust, single binary) by Toronto engineer Adesh Nalpet
Adimurthy; the launch drew a Show HN thread (147 points, 28 comments). The
GitHub org hosts three public repos: `picomq` (the server) and `tierdb` — a
Java project for data tiering between Postgres and Apache Iceberg — plus a
third repo.

The "durable streams on object storage" niche now has several players, which
validates the design bet:

- **S2** (s2.dev) — reached general availability for its hosted durable
  streams offering (and announced a seed round) — a managed PicoMQ-style
  service.
- **Electric** (electric-sql) — announced *Hosted Durable Streams*
  (Jan 2026) for its sync engine.
- **WarpStream** — Kafka-compatible log on object storage (S3 as the
  durability layer) — the closest big-brother to PicoMQ.
- **AutoMQ** — S3Stream shared streaming storage (already covered above).

## Good fits

Anything modeled as many ordered, resumable streams: a stream per user session
or chat, per device, per workflow run, or per agent conversation. Readers resume
from any position, so it also serves audit trails, per-entity event history, and
real-time delivery to many concurrent readers.

## References

- [PicoMQ docs](https://picomq.com/docs)
- [PicoMQ GitHub](https://github.com/picomq/picomq)
- [RuntimeWire: Adesh Nalpet Adimurthy open-sources PicoMQ for durable HTTP streams (Aug 2026)](https://runtimewire.com/article/adesh-nalpet-adimurthy-picomq-durable-http-streams-object-storage)
- [Electric: Announcing Hosted Durable Streams (Jan 2026)](https://github.com/electric-sql/electric/blob/main/website/blog/posts/2026-01-22-announcing-hosted-durable-streams.md)
- [S2: General availability and our seed round](https://s2.dev/blog/ga)

## Related
- [[explanation-bpf-architecture-overview]]
- [[explanation-deepseek-vision-lineage]]
- [[explanation-agent-guardrail-stack]]

## Further Reading (added 2026-10-19 by KB Zookeeper audit)

- [PicoMQ – Durable Streams over HTTP, on object storage…](https://nowfound.app/alternatives/picomq-durable-streams-over-http-on-object-storage) — PicoMQ – Durable Streams over HTTP, on object storage: PicoMQ is a Rust server for Durable Streams, built on Object Store. Cheap, URL-addressable
- [PicoMQ - Durable streams over HTTP on object storage | Zeli](https://zeli.app/story/49421806) — "Show HN: PicoMQ – Durable Streams over HTTP, on object storage" — 147 points, 28 comments on Hacker News. PicoMQ is a durable, real-time streaming solution
- [Show HN: PicoMQ – Durable Streams over HTTP, on object storage | Remix Hacker News](https://news.mcan.sh/item/49421806) — Hacker Remix new past ask show jobs submit 159 points by adesh_nalpet 2 months ago | 31 comments PicoMQ is a Rust server for Durable Streams 

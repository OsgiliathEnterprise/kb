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

## Good fits

Anything modeled as many ordered, resumable streams: a stream per user session
or chat, per device, per workflow run, or per agent conversation. Readers resume
from any position, so it also serves audit trails, per-entity event history, and
real-time delivery to many concurrent readers.

## References

- [PicoMQ docs](https://picomq.com/docs)
- [PicoMQ GitHub](https://github.com/picomq/picomq)

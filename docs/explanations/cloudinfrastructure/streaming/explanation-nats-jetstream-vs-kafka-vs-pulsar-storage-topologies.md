---
title: 'NATS JetStream vs Kafka vs Pulsar: Storage Topologies, fsync Physics, and
  Tenancy Trade-offs'
diataxis: Explanation
domain: cloud-infrastructure
topic: streaming
source: DEV.to Tech News
source_url: https://dev.to/grfdsasdvef/nats-jetstream-vs-apache-kafka-vs-apache-pulsar-latency-slas-throughput-multi-tenancy-1pci
date: 2026-11-17
keywords:
- knowledge-base
- streaming
- cloud-infrastructure
- explanations
---
# NATS JetStream vs Kafka vs Pulsar: Storage Topologies, fsync Physics, and Tenancy Trade-offs

All three systems are durable, replayable logs. The differences are in the **tax each charges per message**: JetStream buys low latency with a single Raft group per stream; Kafka buys throughput with partition-binned broker storage and zero-copy reads; Pulsar buys elasticity and tenancy isolation with a compute/storage split (BookKeeper) at the cost of an extra network hop. This note captures the architecture-level reasoning from a benchmarked comparison (3× c6i.8xlarge, gp3 16k IOPS, OpenMessaging harness, 1 KiB payloads, durability-max settings).

## Three storage topologies, three latency profiles

- **JetStream** co-locates log + Raft quorum inside the client-facing server. A publish is a Raft append; the ack returns after one replication round. No metadata service in the data path → best latencies (p50 1.1 ms, p99 6.8 ms steady state). The tax: *every stream is its own Raft group* — 10k streams generated 2.1 Mbps of pure heartbeat traffic and measurable CPU at zero load; ~5,000 streams is where operations start hurting.
- **Kafka** bins partitions onto brokers; leader serves produce+fetch, followers pull. Zero-copy `sendfile` from page cache is why it wins throughput (1.28M msg/s at 64 partitions vs JetStream's 310k ceiling and Pulsar's 940k). The taxes: partition count is simultaneously your parallelism and your metadata burden (~20k partitions before KRaft pressure; a controlled broker shutdown with 4k leader partitions took 25–40 s), and consumer-group rebalances stop affected partitions for seconds (1.5–6 s with cooperative-sticky).
- **Pulsar** splits stateless brokers (topic cursors, cache) from BookKeeper bookies (ledger journal appends). Publish = broker → bookie journal write → ack: structurally one extra hop (p99 11.9 ms, and ~1.4× Kafka's cross-AZ traffic). What you buy: topic ownership migrates in **milliseconds** (brokers hold no data, so scaling rebalances nothing on disk), and tenancy is first-class — tenant→namespace→topic hierarchy with isolation policies and per-namespace BookKeeper ensemble pinning (the trap: without `ZoneAware` placement policy, hot namespaces pin hot bookies).

## fsync physics sets everyone's floor

`fio --rw=write --bs=4k --iodepth=1 --fsync=1` on the gp3 volumes: **431 synced writes/s per volume**, p99 2.4 ms. That, not CPU, is the per-node ceiling under `acks=all`: a 3-node cluster with 3 volumes tops out near ~1,290 synced appends/s per quorum path unless writes are batched. Hence JetStream's default 2 ms sync-interval batching (set it to 0 for true per-message durability and p99 rises 6.8 → ~9 ms); hence Kafka's `log.flush.interval.messages` amortization; hence why vendor "millions msg/s" figures assume micro-batching.

Other mechanics: Kafka reads are page-cache-or-nothing (lagging consumers hit disk: 8–15 ms p99 read stalls on gp3); JetStream/Pulsar userspace reads cost a memcpy but allow prefetch. At 1 GB/s produce, Kafka ISR replication alone consumes ~64% of a 12.5 Gbps NIC — rack-aware placement and 25 Gbps NICs are non-optional above ~500 MB/s per broker.

## Decision one-liner

- **JetStream** if your service mesh already speaks NATS and you need sub-10 ms p99 durable delivery at moderate fan-out (~$60–100/mo at startup tier; single-binary ops).
- **Kafka** if throughput-per-dollar, the connector ecosystem, and true exactly-once (idempotent producer + transactions spanning consume-transform-produce) dominate and you have dozens of tenants, not thousands.
- **Pulsar** if you need hard multi-tenant isolation or >~20k topics and can pay the extra hop; native tenancy makes 500 tenants "trivially mapped to namespaces" where Kafka needs prefixed ACLs + quotas bolt-ons and JetStream hits per-account stream limits around ~1k.

| Headline metric (3-node, 1 KiB, fsync) | JetStream 2.10 | Kafka 3.7 | Pulsar 3.2 |
|---|---|---|---|
| p99 publish, steady | **6.8 ms** | 14.2 ms | 11.9 ms |
| Max sustained throughput | 310k msg/s | **1.28M msg/s** | 940k msg/s |
| RAM per 10k consumers | **~38 MB** | ~180 MB | ~95 MB |
| Practical scale ceiling | ~5k streams | ~20k partitions | ~100k+ topics |
| Exactly-once | Dedup window only | **Full EOS transactions** | Idempotent, immature txn |
| Native multi-tenancy | Accounts/limits | **None** | **First-class** |

Caveat: these are the article author's single-rig measurements plus vendor-published SLA figures, not an independent benchmark — treat the *orderings and mechanisms* as the durable content, the exact decimals as indicative.

## References

- [Original comparison — NATS JetStream vs Kafka vs Pulsar (DEV.to)](https://dev.to/grfdsasdvef/nats-jetstream-vs-apache-kafka-vs-apache-pulsar-latency-slas-throughput-multi-tenancy-1pci)
- [OpenMessaging Benchmark Framework (harness used)](https://openmessaging.org/projects/benchmark/)
- [Apache BookKeeper documentation (Pulsar storage layer)](https://bookkeeper.apache.org/)

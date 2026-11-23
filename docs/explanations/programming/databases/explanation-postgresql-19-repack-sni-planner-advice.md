---
title: 'PostgreSQL 19: REPACK CONCURRENTLY, TLS SNI via pg_hosts.conf, and Planner
  Controls'
diataxis: Explanation
domain: programming
topic: databases
source: Developpez
source_url: https://postgresql.developpez.com/actu/389354/Le-systeme-de-gestion-de-base-de-donnees-open-source-PostgreSQL-19-est-disponible-avec-une-base-de-donnees-relationnelle-dotee-d-une-gestion-des-tables-repensee-et-offrant-des-performances-accrues/
date: 2026-11-23
keywords:
- knowledge-base
- databases
- programming
- explanations
---
# PostgreSQL 19: REPACK CONCURRENTLY, TLS SNI via pg_hosts.conf, and Planner Controls

PostgreSQL 19 is the November 2026 stable release of the Postgres Global Development
Group, positioned around simplifying administration for large-scale, critical
workloads. The headline changes below matter for operations, security posture, and
bulk-load performance.

## Table reorganization: `REPACK (CONCURRENTLY)`

The most significant change is a built-in **`REPACK`** command that reclaims disk
space and reorganizes table contents (the bloat/dead-tuple compaction previously done
with the third-party `pg_repack` extension).

- `REPACK (CONCURRENTLY)` repacks **without blocking reads and writes** to the table —
  the online-maintenance property that made pg_repack popular.
- Reorganized table contents can also improve query performance (restoring physical
  clustering that VACUUM never does).

Operational note: track whether `pg_repack`/`pg_squeeze` deployments can be retired,
and revisit maintenance windows — but test on a replica first, and confirm extension
compatibility before upgrading.

## Performance: foreign-key validation rework

Improvements to foreign-key checking made **bulk inserts roughly 2× faster** in the
release's own tests. Relevant if you load data into schemas with many FK constraints:
the per-row FK validation path was the bottleneck, not I/O.

## Security: TLS SNI and md5 deprecation

- **Server-side TLS SNI (Server Name Indication):** a single PostgreSQL server can now
  present a **different TLS certificate per hostname** a client connects to. Hostname
  → certificate/key pairs are mapped in the new configuration file
  **`PGDATA/pg_hosts.conf`**. Useful for multi-tenant/hosted Postgres without a
  TLS-terminating proxy per certificate.
- **md5 password authentication is deprecated** — PostgreSQL 19 emits a warning when
  it is used. Migrate to SCRAM-SHA-256 before it is removed in a future major.

## Planner control: `pg_plan_advice` / `pg_stash_advice`

Two new extensions give explicit control over query planner decisions:

- `pg_plan_advice` — inspect/apply plan advice (from the query-tuning research line
  that produced pg_hint_plan-style controls, now first-party).
- `pg_stash_advice` — stash advice for later application, letting you pin plans for
  specific queries instead of resorting to statistics hacks or disabling plan nodes
  globally.

## Federation: `postgres_fdw` with `import_stats`

Queries on foreign tables improve via the new `import_stats` option: `postgres_fdw`
can import remote table statistics, so the local planner sizes joins correctly
instead of assuming default row counts for foreign tables.

## Adoption checklist

- [ ] Inventory md5-encrypted roles in `pg_authid`; migrate to SCRAM before a future major drops md5.
- [ ] If using per-host certificates behind one IP, replace proxy tricks with `pg_hosts.conf` SNI mappings.
- [ ] Benchmark bulk loads with heavy FK graphs — the ~2× FK-validation win changes ETL capacity planning.
- [ ] Evaluate `REPACK (CONCURRENTLY)` against existing pg_repart/pg_repack cron jobs during an upgrade cycle.
- [ ] Test `pg_plan_advice` on known-regressed queries before relying on `pg_stash_advice` in production.

## References

- Developpez — PostgreSQL 19 release article (French): [https://postgresql.developpez.com/actu/389354/Le-systeme-de-gestion-de-base-de-donnees-open-source-PostgreSQL-19-est-disponible-avec-une-base-de-donnees-relationnelle-dotee-d-une-gestion-des-tables-repensee-et-offrant-des-performances-accrues/](https://postgresql.developpez.com/actu/389354/Le-systeme-de-gestion-de-base-de-donnees-open-source-PostgreSQL-19-est-disponible-avec-une-base-de-donnees-relationnelle-dotee-d-une-gestion-des-tables-repensee-et-offrant-des-performances-accrues/)
- PostgreSQL 19 announcement: [https://www.postgresql.org/about/news/postgresql-19-released-](https://www.postgresql.org/about/news/postgresql-19-released-)
- Release 19 notes: [https://www.postgresql.org/docs/current/release-19.html](https://www.postgresql.org/docs/current/release-19.html)
- Related: [PostgreSQL Generated Columns vs Triggers](explanation-postgresql-generated-columns-vs-triggers.md), [Postgres Isn't Slow, Your Storage Is](explanation-postgresql-local-nvme-storage-latency.md)

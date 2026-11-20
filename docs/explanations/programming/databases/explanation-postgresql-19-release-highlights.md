---
title: 'PostgreSQL 19 Release Highlights: REPACK, Plan Advice, and the Compatibility
  Traps'
diataxis: Explanation
domain: programming
topic: databases
source: HackerNews
source_url: https://www.postgresql.org/docs/release/19.0/
date: 2026-11-20
keywords:
- knowledge-base
- databases
- programming
- explanations
---
# PostgreSQL 19 Release Highlights: REPACK, Plan Advice, and the Compatibility Traps

PostgreSQL 19.0 was released **2026-11-19**. It is a major release with one headline operational feature (REPACK), a new planner-control extension family (pg_plan_advice / pg_stash_advice), meaningful replication and vacuum improvements — and a set of breaking changes that make the upgrade checklist non-trivial.

## The headline features

| Feature | What it does | Why it matters |
| --- | --- | --- |
| `REPACK` / `REPACK (CONCURRENTLY)` | Reclaims disk space and reorganizes table contents; `CONCURRENTLY` variant does not block reads/writes | Replaces `VACUUM FULL` (full lock) and third-party `pg_repack`/`pg_squeeze` — see the linked how-to note |
| `pg_plan_advice` | Extension to control query planner decisions per query shape | Planner regressions can be pinned without SQL rewrites |
| `pg_stash_advice` | Stores plan advice and applies it automatically based on the query | Persistent plan stabilization across restarts |
| Auto-scaled I/O workers | Number of I/O worker processes scales automatically | Faster sequential scans / vacuum I/O without tuning |
| Quicker foreign-key checks | Optimized FK constraint verification | Cheaper writes on FK-heavy schemas |
| Logical replication without restart | Can be enabled when `wal_level = replica` (previously required `logical` + restart) | Much lower barrier to adopt logical replication / zero-downtime upgrades |
| Sequence replication | Logical replication can now replicate sequence values | Removes a classic cutover footgun (sequence rollback after failover) |
| `WAIT FOR LSN` command | "Read-your-writes" consistency on standbys | Applications can block until replay passes a known LSN before reading a replica |
| Parallel autovacuum of indexes + prioritization scoring | `autovacuum_max_parallel_workers`; new scoring system prioritizes tables | Tackles the classic "autovacuum falls behind on big tables" problem |

## Migration and breaking changes (upgrade checklist)

Migrating from any prior major version requires `pg_dumpall`, `pg_upgrade`, or logical replication. The compat traps worth auditing **before** `pg_upgrade`:

1. **MD5 passwords now warn on every successful authentication** — a warning is emitted after MD5 auth (deprecated since PG 18). Silence with the new `md5_password_warnings` GUC, but the right fix is a SCRAM migration. New GUC `password_expiration_warning_threshold` (default 7 days) warns on expiring passwords.
2. **RADIUS support removed** — only UDP RADIUS existed, which is "unfixably insecure". Anyone using RADIUS-backed `pg_hba` auth must move to LDAP/OAuth/SCRAM.
3. **`standard_conforming_strings` is forced `on` server-side** — dumps from pre-19 `pg_dump`/`pg_dumpall` taken with it `off` will *not* load. Re-dump with the v19 client tools. `escape_string_warning` was removed.
4. **No CR/LF allowed in database, role, or tablespace names** — and `pg_upgrade` will *refuse to upgrade* clusters that contain such names (security hardening against injection through identifiers). Audit: `SELECT datname FROM pg_database WHERE datname ~ '[\r\n]';`
5. **`inet`/`cidr` default index opclass changed from `btree_gist` to GiST** — the `btree_gist` opclasses were *broken* (could exclude rows that should match). `pg_upgrade` will refuse clusters with `btree_gist` `inet`/`cidr` indexes: drop them first.
6. **`json_array()` returning no rows now returns `[]` instead of `NULL`** — check code that branches on `IS NULL`.
7. **`postgres_fdw` inherits `READ ONLY`/`DEFERRABLE`** — read-only transactions can no longer write through FDW sessions.
8. **`max_locks_per_transaction` default raised 64 → 128** — memory accounting changes on hosts with many `max_connections`.
9. System columns disallowed in `COPY FROM ... WHERE` (values were ill-defined).

## Confirmed by the official announcement (2026-11-19)

The release announcement adds detail beyond the release-notes skim:

- **REPACK replaces *both* `VACUUM FULL` and `CLUSTER`** (the note above only mentions VACUUM FULL). Both old commands remain available for compatibility. `REPACK` can reorder a table's data to match an index, the way `CLUSTER` did — without blocking reads or writes in the `CONCURRENTLY` form.
- **Logical replication needs no `wal_level = logical` in postgresql.conf at all** — stronger than "no restart": PostgreSQL 19 *automatically raises the effective WAL level* to `logical` when you create the first logical replication slot. Inspect the real setting with the new preset GUC `effective_wal_level` (`wal_level` itself can stay `replica`).
- **The standby consistency command is `WAIT FOR LSN`** (not just `WAIT`): a session on a standby blocks until replay passes a specific LSN before running the query.
- **New observability**: `pg_stat_lock` (per-lock-type stats), `pg_stat_recovery` (recovery status), `pg_stat_autovacuum_scores` (see how the prioritization scores tables), an `IO` option for `EXPLAIN ANALYZE` (plus a matching `auto_explain` setting) reporting async-I/O activity, and full-page-image WAL bytes now surfaced in `pg_stat_wal`, `EXPLAIN (ANALYZE, WAL)`, and vacuum/analyze log events.
- **I/O worker GUCs changed — a config-compat trap**: `io_workers` is **gone**, replaced by `io_min_workers` / `io_max_workers` (with `io_method = worker` as default). Any tuning that pinned `io_workers` on PG 18 must be rewritten on upgrade.
- **Vacuum/analyze quality-of-life**: queries can now mark pages all-visible in the visibility map during execution (reducing future vacuum work); `vacuumdb --analyze-only` now covers partitioned tables when no tables are specified.
- **Concrete performance claim**: optimized FK checks made **bulk inserts nearly 2× faster** in testing. Planner adds `NOT IN` → anti-join conversion (when no NULLs possible) and eager aggregation before joins.
- **More developer features** (beyond the table): `INSERT ... ON CONFLICT DO SELECT` ("get or create" — `RETURNING` yields the conflicting existing rows), `COPY` to JSON output including a single JSON array, SQL/JSON path string methods (`lower()`, `upper()`, `replace()`, `split_part()`, `btrim()`), window functions `lead/lag/first_value/last_value/nth_value` gain `IGNORE NULLS`, and `random()` can produce random dates/timestamps in a range.
- **Replication additions** (beyond sequences): `CREATE PUBLICATION ... FOR ALL TABLES EXCEPT ...` to exclude tables; `CREATE SUBSCRIPTION ... SERVER` sources connection settings from a foreign server (e.g. `postgres_fdw`); the `retain_dead_tuples` subscription option lets conflicts against concurrent deletes be detected and counted in `pg_stat_subscription_stats`; `postgres_fdw` `import_stats` pulls remote table statistics during `ANALYZE` instead of sampling rows remotely.

## Mental model

```
PG 19 theme = "operate the database you already have, better"
  bloat & space      -> REPACK (CONCURRENTLY)
  plan stability     -> pg_plan_advice / pg_stash_advice
  vacuum debt        -> parallel index vacuum + prioritization scoring
  replication friction -> no-restart enable, sequences, WAIT for read-your-writes
```

The three replication items together collapse the usual argument for staying on a managed fork: the restart requirement, the sequence-cutover bug class, and stale-replica reads were the top operational objections to replica reads + logical replication.

## Related notes

- [How to Reclaim Table Bloat Online with REPACK (PostgreSQL 19)](../../../how-to/programming/databases/howto-repack-online-table-bloat-postgres-19.md) — the hands-on companion to the REPACK feature above.
- [Explanation: PostgreSQL Generated Columns vs Triggers](explanation-postgresql-generated-columns-vs-triggers.md)

## References

- [PostgreSQL 19.0 Release Notes (official)](https://www.postgresql.org/docs/release/19.0/)
- [PostgreSQL 19 Released announcement](https://www.postgresql.org/about/news/postgresql-19-released-3449/)
- [Snowflake Engineering: Postgres 19 REPACK — Built-In Online Table Bloat Cleanup](https://www.snowflake.com/en/blog/engineering/postgres-19-repack-table-bloat/)

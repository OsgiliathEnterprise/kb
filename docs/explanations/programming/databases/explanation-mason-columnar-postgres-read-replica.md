---
title: 'Mason: A Columnar Postgres Read Replica on DuckDB — Architecture, Benchmarks,
  When It Wins'
diataxis: Explanation
domain: programming
topic: databases
source: HackerNews
source_url: https://masondata.ai/
date: 2026-11-24
keywords:
- knowledge-base
- databases
- programming
- explanations
---
# Mason: A Columnar Postgres Read Replica on DuckDB — Architecture, Benchmarks, When It Wins

**Mason** ([embeddable-hq/mason-data](https://github.com/embeddable-hq/mason-data), Apache-2.0) is a drop-in Postgres *read replica* whose storage engine is **DuckDB**. It's a single Node.js process that keeps its config and synced data in the folder you run it in, speaks the Postgres wire protocol (default port 5433), and **matches Postgres SQL semantics, not DuckDB's** — existing Postgres queries can be pointed at it directly; Mason rewrites them on the fly into the form DuckDB runs fastest.

## Architecture

```
Postgres primary ──(on-demand | polling | logical replication, per table)──▶ Mason (Node.js)
                     selected tables/columns only                              │
                                                                                 ▼
agent / psql / dashboard ──Postgres SQL──▶ query rewriter ──▶ DuckDB columnar engine
                                              │
                                              └── RBAC + row-level security + per-query audit log
```

Key design points:

- **Selective sync:** you choose which tables and columns to sync and how each stays current: on demand, by polling, or by **logical replication**.
- **Generated tables:** like materialized views that Mason keeps fresh automatically, without extra load on the primary.
- **Agent-first access control:** one user per AI agent, role-based access control over **tables, columns, and rows** (row limits propagate to related tables via foreign keys); every query is logged with who ran it, the SQL, duration, and — if refused — how to fix it.
- **Built-in MCP server** so Claude Code/ChatGPT can query tables within each agent's role.
- **Ops surface:** Prometheus metrics at `/metrics`, health at `/healthz`, logs to stdout (Datadog/CloudWatch-friendly), `mason logs`/`mason usage` for replay, TLS and per-user IP allowlists, `mason ui` web console.

## Quickstart (from the project site)

```bash
npm i -g @mason-data/cli
cd my-app
mason init 'postgres://me:secret@db.example.com:5432/my_db'
mason add orders customers
mason start && mason wait        # first sync
mason user add me                # prints a connection URL
psql "postgres://me:<password>@localhost:5433/mason" \
     -c "SELECT country, sum(amount) FROM orders JOIN customers ON customers.id = customer_id GROUP BY country"
claude mcp add mason --env MASON_URL="postgres://me:<password>@localhost:5433/mason" -- mason mcp
mason stop && mason destroy      # removes the synced copy
```

## Benchmarks: where it wins, where it loses

Vendor numbers (AWS m7g.xlarge, 4 vCPU/16 GiB/EBS gp3; cold start, page cache dropped, median of 3 runs) — treat as directional, not gospel:

| Query (10M rows) | Postgres | Mason | Ratio |
| --- | --- | --- | --- |
| `SELECT status, count(*) GROUP BY status` (10 clients) | 21.7 s | 0.26 s | **84× faster** |
| Same at 100M rows, 1 client | 216.1 s | 0.46 s | **467× faster** |
| Revenue by month with join (10 clients) | 43.9 s | 2.76 s | 16× faster |
| `SELECT * WHERE id = <uuid>` (PK lookup) | 0.039 s | 0.234 s | **6× slower** |

The pattern is the classic columnar trade-off: **fast for many rows × few columns** (counts, sums, group-bys — dashboards, reports, AI-agent analytics); **slow for few rows × many columns** (point lookups stay on Postgres). A 10M-row `GROUP BY response_code` measured 15.7 s on the primary vs 0.193 s on Mason with identical results.

## Decision guidance

- Use it to offload analytics/agent traffic from a primary that's being saturated by dashboards — without standing up a warehouse or a second Postgres.
- Keep OLTP point queries on Postgres; route only analytical SQL to Mason.
- For agent fleets, the per-agent user + RBAC + full query audit log is the differentiator vs a plain DuckDB sync: agents get read-scoped, row-limited, attributable access.
- Evaluate honestly with your own data: methodology is published ([docs/MEASUREMENTS.md](https://github.com/embeddable-hq/mason-data/blob/main/docs/MEASUREMENTS.md)), but results depend on data size/distribution, and it's a young project (YC-adjacent, single-process, Node.js).

## References

- [Mason project site with interactive benchmarks](https://masondata.ai/) (Show HN, 2026-11-24)
- [embeddable-hq/mason-data on GitHub](https://github.com/embeddable-hq/mason-data)
- Related KB note: [PostgreSQL 19: REPACK, SNI, Planner Advice](explanation-postgresql-19-repack-sni-planner-advice.md)

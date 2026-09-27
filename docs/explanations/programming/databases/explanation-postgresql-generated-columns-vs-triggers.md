---
title: PostgreSQL Generated Columns vs Triggers for Derived Values
diataxis: Explanation
domain: programming
topic: databases
source: DEV.to Tech News
source_url: https://dev.to/tbson87/postgresql-generated-column-vs-trigger-which-to-use-for-a-derived-column-518p
date: 2026-09-27
keywords:
- knowledge-base
- databases
- programming
- explanations
---
# PostgreSQL Generated Columns vs Triggers for Derived Values

When a column's value is derived from other data — `line_total = unit_price * quantity`, `lower(email)`, a `tsvector` built from `body` — you have two mechanisms: a **generated column** or a **trigger-maintained column**. The choice matters twice: at write time (cost, expressiveness, failure modes) and for everyone who inherits the schema later.

## Decision rule

- **Generated column**: every input is in the same row and every function is immutable. Covers arithmetic, normalized copies (`lower(email)`), extracted values (`to_tsvector('english', body)`, fields pulled from `jsonb`).
- **Trigger**: the value needs another table, the clock (`now()`), or a non-immutable function. Typical cases: `updated_at` set on every update, an `orders.total` that sums child rows, a denormalized copy of a parent's value (customer name stamped onto invoices).

If a generated column can express the value, a trigger buys nothing but risk.

## Why triggers are risky where generated columns are not

| Property | Generated column | Trigger-maintained column |
|----------|------------------|---------------------------|
| What it can read | Same-row columns via immutable functions | Anything: other tables, `now()`, any function |
| Writable by hand? | No — `INSERT`/`UPDATE` rejected | Yes; value stays wrong until next trigger run |
| Visible in table definition | Yes (`GENERATED ALWAYS AS (...)`) | No — looks like a plain column |
| Skipped by `session_replication_role = replica` | No | Yes (logical replication sets this while applying changes) |
| Drop a column it reads | Refused | Refused only for columns named in `UPDATE OF`; otherwise allowed, and the next write fails |
| Indexable | Stored: yes. Virtual: only via an index on its expression | Yes |

Three concrete failure modes of triggers:

1. **Bypassed.** A trigger declared `BEFORE INSERT OR UPDATE OF unit_price, quantity` does not fire for `UPDATE order_lines SET line_total = 5`, leaving a stale value. Dropping the `UPDATE OF` list fixes it but fires on every update.
2. **Switched off.** `SET session_replication_role = replica` (or `ALTER TABLE ... DISABLE TRIGGER`) stops ordinary triggers; an insert under it leaves the column `NULL`. A generated column is computed regardless.
3. **Fails late.** PostgreSQL tracks dependencies only for columns named in `UPDATE OF`, not inside the function body. Renaming a column succeeds, and the next insert fails with `record "new" has no field ...` — the migration passed, the application broke on its next write.

## Stored vs virtual (PostgreSQL 18)

PostgreSQL 12 introduced generated columns as stored-only. **PostgreSQL 18 added virtual generated columns and made them the default**: `GENERATED ALWAYS AS (...)` with no keyword now computes at read time and stores nothing. Confirmed in the official PostgreSQL 18 release notes ("Allow generated columns to be virtual, and make them the default").

What a virtual column gives up:

- No user-defined functions or types in the expression.
- Logical replication can publish only stored ones.
- `CREATE INDEX` on one fails with `indexes on virtual generated columns are not supported`.

Cost of adding the column to an existing 1,000,000-row table (measured on PG 18.3):

| Operation | Time | Effect |
|-----------|------|--------|
| `ADD COLUMN ... VIRTUAL` | ~1 ms | Catalogue change only |
| `ADD COLUMN ... STORED` | ~630 ms | Rewrites the table under `ACCESS EXCLUSIVE` |
| Plain column + backfill `UPDATE` | &lt;1 ms, then ~2.9 s | New row versions; writes to those rows wait |

Insert performance on 1M rows (plain table baseline 1.58 s): stored generated column 1.83 s (+16%), virtual 1.52 s (~0), PL/pgSQL trigger 2.72 s (+72%).

**Rule of thumb:** virtual when the value is cheap to compute; stored when computing on every read costs more than storing, or when a logical replication subscriber needs the value. An index on the expression itself still serves `WHERE` clauses against a virtual column (the planner expands it). Changing the expression later: `ALTER TABLE ... ALTER COLUMN line_total SET EXPRESSION AS (...)` (PG 17+); for stored columns this rewrites the table again under an exclusive lock, for virtual ones it is a catalogue change.

## Discovering computed columns in an inherited schema

Generated columns live in the catalogue — one query finds them all:

```sql
SELECT a.attrelid::regclass AS table_name, a.attname,
       CASE a.attgenerated WHEN 's' THEN 'stored' ELSE 'virtual' END AS kind,
       pg_get_expr(d.adbin, d.adrelid) AS expression
FROM pg_attribute a
JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
WHERE a.attgenerated <> '' AND NOT a.attisdropped;
```

Trigger-maintained columns do not. The catalogue knows which triggers exist and which columns their `UPDATE OF` names, but not which column the function writes — you must list triggers and read each body:

```sql
SELECT tg.tgrelid::regclass AS table_name, tg.tgname, p.proname, p.prosrc
FROM pg_trigger tg
JOIN pg_proc p ON p.oid = tg.tgfoid
WHERE NOT tg.tgisinternal;
```

That asymmetry is the strongest argument for generated columns: only one of the two approaches tells you which values the database derives without reading application code. If you inherit a schema with trigger-maintained columns, document what each trigger maintains as a column description.

See [postgresql-generated-columns-vs-triggers.excalidraw](postgresql-generated-columns-vs-triggers.svg) for the decision flow.

## References

- [PostgreSQL Generated Column vs Trigger: Which to Use for a Derived Column (DEV.to)](https://dev.to/tbson87/postgresql-generated-column-vs-trigger-which-to-use-for-a-derived-column-518p)
- [PostgreSQL 18 Release Notes — virtual generated columns](https://www.postgresql.org/docs/release/18.0/)
- [PostgreSQL Documentation: Generated Columns](https://www.postgresql.org/docs/current/ddl-generated-columns.html)

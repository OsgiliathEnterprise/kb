---
title: OFFSET Repeats and Drops Rows; Keyset Cursors Fix Position but Not Membership
diataxis: Explanation
domain: programming
topic: databases
source: DEV.to Tech News
source_url: https://dev.to/jitsumi/your-sql-pagination-can-repeat-rows-a-cursor-fixes-only-part-of-it-3o2o
date: 2026-11-05
keywords:
- knowledge-base
- databases
- programming
- explanations
---
# OFFSET vs Keyset Cursors: What a Cursor Fixes — and What It Doesn't

`OFFSET n` skips n rows in the result **as it exists now**, not "continuing after the n rows you already saw". With any concurrent insert/delete, pages repeat or drop rows even with a perfectly valid `ORDER BY`. Keyset (cursor) pagination fixes the *position* problem — but still reads changing data, so it cannot provide a frozen-snapshot guarantee. Reproduced below with a 6-row SQLite demo.

## The two OFFSET failure modes

Feed sorted newest-first over `(created_at DESC, id DESC)` — rows `(1,100) (2,200) (3,300) (4,400) (5,400) (6,500)`. Page 1 = `LIMIT 2 OFFSET 0` → IDs **6, 5**. The `id` tie-breaker is mandatory: without a unique ordering, the DB has no obligation to keep tied rows stable (PostgreSQL's LIMIT/OFFSET docs state this explicitly).

- **Insert above the boundary:** add ID 7 at time 600. Ordered list shifts. `OFFSET 2` now skips 7, 6 and returns **5, 4** — ID 5 *repeats*.
- **Delete above the boundary:** instead delete ID 6. `OFFSET 2` skips 5, 4 and returns **3, 2** — ID 4 is *never seen*.

## The composite cursor fix

Keep page 1's last row's full sort tuple `(created_at=400, id=5)` and ask for rows strictly below it:

```sql
SELECT id, created_at FROM events
WHERE (created_at, id) < (?, ?)      -- bind 400, 5
ORDER BY created_at DESC, id DESC
LIMIT 2;
```

Returns **4, 3** whether ID 7 was inserted above or ID 6 deleted. SQLite supports these **row-value comparisons** (left-to-right component compare); all-ascending order uses `>`; **mixed sort directions need a hand-built predicate** following each column's direction.

Why the cursor must carry the tie-breaker: `created_at &lt; 400` skips ID 4 (same timestamp, lower id); `created_at &lt;= 400` re-admits ID 5. The boundary values stay valid even if the boundary row itself is later deleted.

## What a cursor does NOT fix

A cursor means "below this boundary", not "the rest of what I first saw":

- **Moved unseen row:** ID 4's timestamp changes 400→550 → it floats above the boundary and is skipped forever; next page returns 3, 2.
- **Backdated insert:** inserting ID 7 at time 350 mid-traversal → it appears on the next page (4, 7) even though it didn't exist at page 1.
- A displayed row can *reappear* if its sort key moves below the boundary.

Fine for a live feed; wrong for "all records as of 09:00". Mitigations: prefer **immutable ordering values** (creation sequence, or created_at + unique id — not mutable popularity/`updated_at`); for a true consistent export use a **database-supported consistent read** (SQLite WAL: a read transaction retains its snapshot; separate HTTP requests do NOT share it) or materialize into a background export job. Also distinguish freezing *membership* (saved ID list) from freezing *values* (IDs re-looked-up later return edited or deleted rows).

## Making query, index, and API agree

```sql
CREATE INDEX events_feed ON events(created_at DESC, id DESC);
```

- Index follows the ordering columns so the DB **seeks to the boundary** instead of discarding a growing prefix; verify with the actual query plan before claiming performance.
- **Tenant-scoped feeds:** re-apply the tenant filter on *every* page (index: tenant equality column first, then sort columns). A cursor supplies a position, never permission.
- API contract checklist:
  - Keep the full ordering tuple through driver/encoder/decoder — beware JS number precision on large integer IDs.
  - Validate cursor shape, version, filter context, and sort order; reject a cursor issued for a different search instead of silently reinterpreting it. Base64 ≠ trustworthy; reapply authorization regardless.
  - Bind cursor values as parameters; clamp page size to a server max; choose sort columns from an allowlist.
  - Define explicit null ordering/continuation rules for nullable sort columns (tuple comparison with NULL doesn't behave numerically).

**Ship test:** give two rows the same timestamp, insert above the boundary, delete a displayed row, change an ordering value — then check exact IDs across successive pages.

## Choosing the guarantee

| Goal | Mechanism |
|---|---|
| Browse small table, numbered pages | OFFSET with unique order; accept movement between reads |
| Load older items in a changing feed | Keyset cursor, stable sort keys, matching filters |
| Report of one consistent dataset | Consistent read or materialized export; paginate the fixed result |

## References

- [Your SQL Pagination Can Repeat Rows — DEV.to (Jitsumi)](https://dev.to/jitsumi/your-sql-pagination-can-repeat-rows-a-cursor-fixes-only-part-of-it-3o2o)
- [SQLite row values](https://sqlite.org/rowvalue.html), [SQLite isolation/WAL snapshots](https://www.sqlite.org/isolation.html), [SQLite query planning](https://sqlite.org/queryplanner.html)
- [PostgreSQL LIMIT/OFFSET and deterministic ordering](https://www.postgresql.org/docs/current/queries-limit.html)
- [Node.js built-in SQLite API](https://nodejs.org/download/release/v26.6.0/docs/api/sqlite.html)

Related KB notes: [[explanation-pagination-consistency-mutating-data]], [[howto-avoid-offset-limit-anti-pattern]], [[howto-design-opaque-page-tokens]]

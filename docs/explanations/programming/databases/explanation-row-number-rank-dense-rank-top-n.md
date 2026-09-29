---
title: 'ROW_NUMBER vs RANK vs DENSE_RANK: Choosing the Right Window Function for Top-N'
diataxis: Explanation
domain: programming
topic: databases
source: DEV.to Tech News
source_url: https://dev.to/sharefun2023/rownumber-vs-rank-vs-denserank-one-of-them-silently-duplicates-your-top-n-i6a
date: 2026-09-29
keywords:
- knowledge-base
- databases
- programming
- explanations
---
# ROW_NUMBER vs RANK vs DENSE_RANK: Choosing the Right Window Function for Top-N

A "top 3 products per category" report that showed four rows in one category and duplicated a product in another traced back to a single choice: the query used `RANK()` where it should have used `ROW_NUMBER()`. The three ranking window functions look interchangeable in a tutorial and behave completely differently the moment your data has ties.

## What each function actually returns

All three are window functions requiring an `OVER (PARTITION BY ... ORDER BY ...)` clause. The difference is what they do with equal values:

| Function | Ties get | Result on tied data |
| --- | --- | --- |
| `ROW_NUMBER()` | arbitrary distinct numbers | 1, 2, 3, 4 |
| `RANK()` | the same rank, then it **skips** | 1, 1, 3, 4 |
| `DENSE_RANK()` | the same rank, then it **does not skip** | 1, 1, 2, 3 |

```sql
SELECT
  product, units_sold,
  ROW_NUMBER() OVER (ORDER BY units_sold DESC) AS rn,
  RANK()       OVER (ORDER BY units_sold DESC) AS rnk,
  DENSE_RANK() OVER (ORDER BY units_sold DESC) AS drnk
FROM product_sales;
```

On data with two products tied at 120:

| product | units_sold | rn | rnk | drnk |
| --- | --- | --- | --- | --- |
| Hammer | 120 | 1 | 1 | 1 |
| Wrench | 120 | 2 | 1 | 1 |
| Saw | 95 | 3 | 3 | 2 |
| Drill | 80 | 4 | 4 | 3 |

`RANK()` jumps from 1 to 3 by design — it answers "how many rows are strictly better than this one, plus one". `ROW_NUMBER()` answers "give me a stable row index". Those are different questions.

## How RANK() silently breaks "top N per group"

```sql
SELECT category, product, units_sold
FROM (
  SELECT category, product, units_sold,
         RANK() OVER (PARTITION BY category ORDER BY units_sold DESC) AS rnk
  FROM product_sales
) t
WHERE rnk <= 3;
```

With the tie at rank 1, both tied products pass `rnk &lt;= 3`, and the next two rows also get rank 3 — so "top 3" emits **four** rows. If a downstream system paginates on the count, totals are wrong. Swapping in `ROW_NUMBER()` gives exactly 3 rows, but which of the tied pair wins is undefined unless you add a tiebreaker.

## The fix: ROW_NUMBER with an explicit tiebreaker

Never let the database decide ties for you — add a deterministic second sort key:

```sql
SELECT category, product, units_sold
FROM (
  SELECT category, product, units_sold,
         ROW_NUMBER() OVER (
           PARTITION BY category
           ORDER BY units_sold DESC, product ASC   -- tiebreaker
         ) AS rn
  FROM product_sales
) t
WHERE rn <= 3;
```

Now the result is stable and reproducible: the same query returns the same rows every time, in every environment. When someone asks "why is Wrench above Hammer?", the answer is a rule you wrote down, not whatever order the storage engine happened to return. If ties genuinely deserve equal standing and you want *all* of them, `RANK()` is correct — just be aware you are asking for "at least N".

## When DENSE_RANK is what you actually want

`DENSE_RANK()` is for "which distinct tier is this value in", where you do not want gaps. Ranking price bands, severity levels, or score buckets:

```sql
SELECT product, units_sold,
       DENSE_RANK() OVER (ORDER BY units_sold DESC) AS tier
FROM product_sales;
```

You get tiers 1, 1, 2, 3 — consecutive, no holes. That reads correctly as "there are three distinct performance levels here". With `RANK()` the output would say tier 3 for a value that is only the second-best level, which is misleading in a label.

## Three things that bite people

1. **`ROW_NUMBER()` without a tiebreaker is non-deterministic.** The database may return either tied row first, and it can change between runs, after an `ANALYZE`, or after a version upgrade. If the result feeds anything with a count or a diff, you will eventually see a phantom change.
2. **Window functions need the filter outside the query.** You cannot write `WHERE ROW_NUMBER() OVER (...) &lt;= 3` — window functions are evaluated after `WHERE`. The subquery (or CTE) is required, not stylistic.
3. **Version support.** Window functions landed in MySQL 8.0, PostgreSQL 8.4, SQL Server 2005, and SQLite 3.25. On MySQL 5.7 there is no `ROW_NUMBER()` at all; the usual workaround is a correlated subquery counting better rows — which also makes the semantics explicit:

```sql
SELECT p1.category, p1.product, p1.units_sold
FROM product_sales p1
WHERE (
  SELECT COUNT(*) FROM product_sales p2
  WHERE p2.category = p1.category AND p2.units_sold > p1.units_sold
) < 3;
```

That counts how many rows beat this one — exactly what `RANK()` computes, with the same tie behaviour including the extra rows.

## The takeaway

- Reach for `ROW_NUMBER()` when you mean "give me N rows".
- Reach for `RANK()` when you mean "give me everything at least as good as the Nth".
- Reach for `DENSE_RANK()` when the number is a tier label rather than a position.
- Whenever you use `ROW_NUMBER()` for a Top-N, put a tiebreaker in the `ORDER BY`. It costs nothing and makes the query reproducible.

## Related notes

- [The NOT IN Trap: Why a NULL in the Subquery Collapses Your Result to Zero Rows](explanation-sql-not-in-null-trap.md)
- [Porting a MySQL Schema to PostgreSQL: Seven Syntax Differences That Break Migrations](../../../how-to/programming/databases/howto-port-mysql-schema-to-postgresql.md)

## References

- [ROW_NUMBER vs RANK vs DENSE_RANK: one of them silently duplicates your Top-N (DEV.to)](https://dev.to/sharefun2023/rownumber-vs-rank-vs-denserank-one-of-them-silently-duplicates-your-top-n-i6a)
- [SQL window functions explained](https://sqlformat.io/blog/sql-window-functions-guide)

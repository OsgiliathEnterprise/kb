---
title: 'The NOT IN Trap: Why a NULL in the Subquery Collapses Your Result to Zero
  Rows'
diataxis: Explanation
domain: programming
topic: databases
source: DEV.to Tech News
source_url: https://dev.to/sharefun2023/the-not-in-trap-why-your-sql-query-returns-zero-rows-2b56
date: 2026-09-29
keywords:
- knowledge-base
- databases
- programming
- explanations
---
# The NOT IN Trap: Why a NULL in the Subquery Collapses Your Result to Zero Rows

A query that returns an empty result is usually a wrong `WHERE` clause. But there is one class of empty result that confuses even experienced people because every row it filters on looks correct: **`NOT IN` with a `NULL` in the subquery**. It does not return "the rows that don't match" — it returns *nothing*, for every input, always.

## The failure

```sql
CREATE TABLE customers (id int, name text);
CREATE TABLE orders (customer_id int);

INSERT INTO customers VALUES (1,'Ada'), (2,'Grace'), (3,'Linus');
INSERT INTO orders VALUES (1), (NULL);
```

Customer 3 has never ordered, so this should return Linus:

```sql
SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders);
```

It returns **zero rows**. Not Linus. Nobody. The single `NULL` in the subquery poisons the comparison for every row.

## Why: three-valued logic

`NOT IN` is shorthand for a chain of `AND`-ed comparisons:

```sql
-- For Linus (id = 3):
id <> 1 AND id <> NULL
```

And `3 &lt;> NULL` does not evaluate to `true`. It evaluates to **`UNKNOWN`**, because `NULL` means "unknown value" — you cannot assert that 3 differs from a value you do not know. SQL uses three-valued logic: every comparison is `TRUE`, `FALSE`, or `UNKNOWN`:

| Expression | Result |
| --- | --- |
| `3 = 1` | `FALSE` |
| `3 &lt;> 1` | `TRUE` |
| `3 = NULL` | `UNKNOWN` |
| `3 &lt;> NULL` | `UNKNOWN` |
| `NULL = NULL` | `UNKNOWN` |

`WHERE` keeps a row only when the condition is `TRUE`. `TRUE AND UNKNOWN` is `UNKNOWN`, so every candidate row is dropped. Note that even `NULL = NULL` is `UNKNOWN`: `NULL` is not equal to itself — it is not a value, it is the *absence* of one.

## Three ways to fix it

**Fix 1 — filter the NULLs out of the subquery.** Cheapest, and usually right when the NULL is meaningless data:

```sql
SELECT name FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders WHERE customer_id IS NOT NULL);
```

**Fix 2 — use `NOT EXISTS`.** The default choice, because it is null-safe by construction: `EXISTS` returns a plain boolean about whether rows matched, and the comparison inside is evaluated per row rather than collapsed into a set:

```sql
SELECT c.name FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

**Fix 3 — `LEFT JOIN` with an `IS NULL` check.** The classic anti-join:

```sql
SELECT c.name FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.customer_id IS NULL;
```

All three return Linus. Modern planners usually turn all three into the same anti-join, so pick by readability.

## The same trap in plain comparisons

Once you internalise that `NULL` is `UNKNOWN`, other surprises stop being surprising:

```sql
SELECT * FROM orders WHERE customer_id <> 1;   -- rows with NULL are excluded
SELECT * FROM orders WHERE customer_id = NULL; -- always empty
SELECT * FROM orders WHERE customer_id IS NULL;-- this is the one that works
```

`IS NULL` / `IS NOT NULL` are the only operators that test for `NULL` directly. And aggregates ignore `NULL`, which changes denominators: for the data above, `COUNT(*)` is 2 but `COUNT(customer_id)` is 1 — an average computed as `SUM(x)/COUNT(*)` silently treats missing values as zeros.

## Portability note

If you are porting queries between engines, `COALESCE` is standard while `IFNULL` (MySQL/SQLite), `NVL` (Oracle), and `ISNULL` (SQL Server) are dialect-specific — `COALESCE` works everywhere.

## What to take away

- `NOT IN` against a subquery that can produce `NULL` returns zero rows. Always.
- Prefer `NOT EXISTS` for anti-joins; it removes an entire category of bug.
- Aggregates ignore `NULL`, which changes denominators and silently biases averages.

## Related notes

- [ROW_NUMBER vs RANK vs DENSE_RANK: Choosing the Right Window Function for Top-N](explanation-row-number-rank-dense-rank-top-n.md) — another silent-failure class in SQL reporting queries
- [Porting a MySQL Schema to PostgreSQL: Seven Syntax Differences That Break Migrations](../../../how-to/programming/databases/howto-port-mysql-schema-to-postgresql.md)

## References

- [The NOT IN trap: why your SQL query returns zero rows (DEV.to)](https://dev.to/sharefun2023/the-not-in-trap-why-your-sql-query-returns-zero-rows-2b56)
- [SQL NULL handling: common pitfalls and fixes](https://sqlformat.io/blog/sql-null-handling-guide)

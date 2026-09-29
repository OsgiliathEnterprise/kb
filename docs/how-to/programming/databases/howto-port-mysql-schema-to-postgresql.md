---
title: 'Porting a MySQL Schema to PostgreSQL: Seven Syntax Differences That Break
  Migrations'
diataxis: How-to Guide
domain: programming
topic: databases
source: DEV.to Tech News
source_url: https://dev.to/sharefun2023/postgresql-vs-mysql-7-syntax-differences-that-break-migrations-4d52
date: 2026-09-29
keywords:
- knowledge-base
- databases
- programming
- how-to
---
# Porting a MySQL Schema to PostgreSQL: Seven Syntax Differences That Break Migrations

Porting a working MySQL schema to PostgreSQL is rarely a find-and-replace. The SQL standard leaves enough room that the two engines disagree on quoting, types, upserts, and pagination — and most of the disagreements fail at runtime, not at parse time. This note walks through the seven differences that cost the most migration time, with the rewrite for each.

## 1. Identifier quoting is not the same character

MySQL uses backticks; PostgreSQL uses double quotes (the ANSI standard):

```sql
SELECT `order` FROM orders;        -- MySQL
SELECT "order" FROM orders;        -- PostgreSQL
```

Two consequences people miss:

- Backticks in PostgreSQL are a **syntax error**, so any generated query with backtick quoting must be rewritten.
- Double quotes in MySQL are legal but dangerous: with the default `ANSI_QUOTES` off, MySQL treats `"order"` as a *string literal*, not an identifier. A query that reads fine in PostgreSQL can silently evaluate to a constant in MySQL.

## 2. String concatenation

```sql
SELECT first_name + ' ' + last_name FROM users;   -- SQL Server style, breaks in both
SELECT CONCAT(first_name, ' ', last_name) FROM users; -- works in both
```

PostgreSQL supports the standard `||` operator. MySQL has `||` too, but by default it means logical `OR` — so this query is not an error in MySQL, it is a **silent logic change**:

```sql
SELECT first_name || ' ' || last_name FROM users;  -- MySQL: 0 or 1, not a string
```

`CONCAT()` is the portable choice. One more difference: PostgreSQL's `||` propagates `NULL` (the whole expression becomes `NULL`), while MySQL's `CONCAT()` also returns `NULL` if any argument is `NULL` — but `CONCAT_WS()` skips `NULL` arguments instead, which is usually what you want for address lines.

## 3. Auto-increment

```sql
-- MySQL
id INT AUTO_INCREMENT PRIMARY KEY

-- PostgreSQL, modern
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY

-- PostgreSQL, legacy but still everywhere
id SERIAL PRIMARY KEY
```

`SERIAL` is not a real type — it is shorthand that PostgreSQL expands into an integer column plus a sequence and a default. The practical trap: `SERIAL` creates an implicit sequence with its own name, and `INSERT ... ON CONFLICT` plus manual ID inserts can leave that sequence behind the actual max ID. Then the next insert fails with a duplicate key. `GENERATED ... AS IDENTITY` ties the sequence to the column properly and is what you should write in new schemas.

## 4. Upsert syntax is completely different

```sql
-- MySQL
INSERT INTO counters (id, n) VALUES (1, 1)
ON DUPLICATE KEY UPDATE n = n + 1;

-- PostgreSQL
INSERT INTO counters (id, n) VALUES (1, 1)
ON CONFLICT (id) DO UPDATE SET n = counters.n + 1;
```

Three things to watch:

- `ON CONFLICT` requires you to **name the conflict target** — without `(id)`, PostgreSQL cannot tell which unique constraint you mean.
- The existing row is referenced through the table name, not `VALUES()`.
- MySQL's `INSERT IGNORE` has no direct PostgreSQL equivalent; it silently becomes `ON CONFLICT DO NOTHING`, which is *not* the same statement — `INSERT IGNORE` also swallows type conversion and truncation problems that `DO NOTHING` does not.

## 5. Pagination

```sql
SELECT * FROM orders ORDER BY id LIMIT 10 OFFSET 20;  -- both engines
SELECT * FROM orders ORDER BY id LIMIT 20, 10;        -- MySQL only
```

The comma form is a MySQL extension; in PostgreSQL `LIMIT 20, 10` is a syntax error. PostgreSQL also accepts the standard `OFFSET 20 ROWS FETCH FIRST 10 ROWS ONLY`, which MySQL does not.

The deeper point applies to both engines: large `OFFSET` values force the database to generate and discard every skipped row. Past a few thousand, switch to keyset pagination — `WHERE id > :last_seen_id ORDER BY id LIMIT 10` — which stays fast regardless of depth.

## 6. Booleans are not a type in MySQL

```sql
-- PostgreSQL
active boolean DEFAULT true

-- MySQL: BOOLEAN is an alias for TINYINT(1)
active BOOLEAN DEFAULT TRUE
```

MySQL stores it as a number, which is why `WHERE active = 1` works there while `WHERE active = true` in PostgreSQL is correct and `= 1` fails with an "operator does not exist" error. Porting conditionals between the two means touching every boolean comparison, not just the schema.

## 7. Case sensitivity of identifiers

PostgreSQL folds unquoted identifiers to lowercase, so `SELECT * FROM Orders` and `FROM orders` are the same table. MySQL's behaviour depends on the filesystem and `lower_case_table_names`: case-insensitive on Windows and macOS by default, case-sensitive on Linux. A migration where both engines run on Linux is fine — until a teammate runs the MySQL copy on a Mac and half the queries break.

Practical rule: pick lowercase snake_case for every identifier and never rely on case-insensitive matching.

## String comparison note

PostgreSQL's `LIKE` is case-sensitive; MySQL's `LIKE` follows the column collation, which is case-insensitive by default for `utf8mb4_0900_ai_ci`. The same filter returns different row counts. PostgreSQL's `ILIKE` gives you the case-insensitive behaviour explicitly.

## Checklist before you migrate

1. Replace backticks with double quotes (and audit every existing double-quoted string in MySQL).
2. Replace `||` and `+` with `CONCAT()`.
3. Rewrite `AUTO_INCREMENT` to `GENERATED AS IDENTITY`, then resync sequences on any table that received explicit IDs.
4. Convert `ON DUPLICATE KEY UPDATE` to `ON CONFLICT (target) DO UPDATE` and re-check anything using `INSERT IGNORE`.
5. Fix every `LIMIT offset, count`.
6. Type-check every boolean column and every boolean predicate.
7. Normalise identifier case before touching anything else.

## Related notes

- [The NOT IN Trap: Why a NULL in the Subquery Collapses Your Result to Zero Rows](../../../explanations/programming/databases/explanation-sql-not-in-null-trap.md) — NULL semantics that bite ported queries on both engines
- [ROW_NUMBER vs RANK vs DENSE_RANK: Choosing the Right Window Function for Top-N](../../../explanations/programming/databases/explanation-row-number-rank-dense-rank-top-n.md)

## References

- [PostgreSQL vs MySQL: 7 syntax differences that break migrations (DEV.to)](https://dev.to/sharefun2023/postgresql-vs-mysql-7-syntax-differences-that-break-migrations-4d52)
- [PostgreSQL vs MySQL syntax differences — full comparison table](https://sqlformat.io/blog/postgresql-vs-mysql-syntax-differences)

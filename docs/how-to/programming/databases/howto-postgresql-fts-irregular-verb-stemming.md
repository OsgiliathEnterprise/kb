---
title: Handle Irregular Verbs in PostgreSQL Full-Text Search (RAG Retrieval)
diataxis: How-to Guide
domain: programming
topic: databases
source: DEV.to Tech News
source_url: https://dev.to/danbasseda/why-paying-invoices-doesnt-find-paid-in-postgresql-full-text-search-3j4b
date: '2026-11-17'
keywords:
- knowledge-base
- databases
- programming
- how-to
---
# Handle Irregular Verbs in PostgreSQL Full-Text Search (RAG Retrieval)

PostgreSQL FTS is a solid first retrieval layer for RAG, but the `english` configuration's Snowball stemmer works on **spelling, not grammar** — it has no dictionary of irregular verbs. `paying` stems to `pay` while `paid` stays `paid`, so a chunk containing "Invoices must be paid" is **not** found by the query "paying invoices". Steps below reproduce the miss, explain it, and fix it (tested on PostgreSQL 16.15 with psycopg 3).

## 1. Reproduce the miss
Use a generated `tsvector` column so PostgreSQL keeps it in sync:

```sql
CREATE TABLE chunks (
    id         serial PRIMARY KEY,
    chunk_text text NOT NULL,
    tsv        tsvector GENERATED ALWAYS AS (to_tsvector('english', chunk_text)) STORED
);

INSERT INTO chunks (chunk_text) VALUES
  ('Invoices must be paid within thirty days.'),
  ('Returns require the original receipt.'),
  ('Send the signed contract to the finance team.');

SELECT id, chunk_text FROM chunks
WHERE tsv @@ plainto_tsquery('english', 'paying invoices');
-- 0 rows
```

Searching `invoices` alone returns chunk 1 — the index is fine; the verb is the problem.

## 2. Inspect the stems
```sql
SELECT tsv FROM chunks WHERE id = 1;
-- 'day':7 'invoic':1 'must':2 'paid':4 'thirti':6 'within':5

SELECT plainto_tsquery('english', 'paying invoices');
-- 'pay' & 'invoic'

SELECT token, lexemes FROM ts_debug('english', 'pay pays paying paid');
-- pay -> {pay} | pays -> {pay} | paying -> {pay} | paid -> {paid}
```
Two compounding causes: (a) `paid` never stems to `pay` (no suffix to strip — same for `buy`/`bought`, `send`/`sent`), and (b) `plainto_tsquery` joins terms with **AND**, so one missing term rejects the whole chunk — longer questions fail more often.

## 3. Don't rely on trigrams to save you
`pg_trgm` similarity looks like it works on toy examples (0.244 for the right chunk), but `similarity('paying','paid')` is only 0.200 — the score comes from the already-matching noun, and trigram similarity **dilutes with chunk length**: the same sentence inside a 798-character chunk scores 0.101, under a typical 0.15 cutoff. Trigrams handle typos, not verb tenses.

## 4. Fix: expand the forms and OR them together
The query you want is `invoices AND (pay OR paid)`:

```sql
SELECT to_tsquery('english', 'invoices & (paying | paid)');
-- 'invoic' & ( 'pay' | 'paid' )   -- finds chunk 1
```

To build this safely from user input, **never concatenate the question into `to_tsquery` syntax**. Run each word through `plainto_tsquery` as a bound parameter and combine results with the `tsquery` operators `||` (OR) and `&&` (AND), using a small, reviewed expansion dictionary of the forms your documents actually use:

```python
IRREGULAR = {
    "pay": ["paid"], "paying": ["paid"], "pays": ["paid"], "paid": ["pay"],
    "send": ["sent"], "sending": ["sent"], "sent": ["send"],
    "buy": ["bought"], "buying": ["bought"], "bought": ["buy"],
}
```

## Checklist
- [ ] Generated `tsvector` column (not trigger-maintained) for in-sync indexing
- [ ] `ts_debug` check on your domain's verbs before shipping
- [ ] Bound-parameter `plainto_tsquery` per word, combined with `&&` / `||` — never string-concatenated `to_tsquery`
- [ ] Small reviewed irregular-verb dictionary
- [ ] Trigrams only as a typo-safety net, with a length-aware threshold

## References
- Original: [Why "paying invoices" doesn't find "paid" in PostgreSQL full-text search](https://dev.to/danbasseda/why-paying-invoices-doesnt-find-paid-in-postgresql-full-text-search-3j4b)
- Related: [[explanation-postgresql-generated-columns-vs-triggers]]

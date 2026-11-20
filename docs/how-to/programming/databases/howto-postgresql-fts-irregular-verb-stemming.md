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

## 5. Server-side alternative: synonym / thesaurus dictionaries
Query-side expansion (Section 4) leaves the index untouched and needs no reindex. If you'd rather fix it at **index time**, PostgreSQL ships two dictionary templates for exactly this (docs §12.6.3–12.6.4):

**Synonym dictionary** — one mapping per line (`word synonym`) in `$SHAREDIR/tsearch_data/<name>.syn`, placed *before* the stemmer in the mapping chain:

```sql
-- $SHAREDIR/tsearch_data/irregular_verbs.syn:
--   paid pay
--   sent send
--   bought buy
CREATE TEXT SEARCH DICTIONARY irregular_syn (
    TEMPLATE = synonym,
    SYNONYMS = irregular_verbs
);
ALTER TEXT SEARCH CONFIGURATION english
    ALTER MAPPING FOR asciiword
    WITH irregular_syn, english_stem;
```

After this, `ts_debug('english', 'paid')` yields `{pay}` and the original Section-1 query matches with no query-side changes. Caveats: the synonym file is server-side (needs file access or a DBA, shared across the cluster); append `*` to a synonym to make it a prefix match in `to_tsquery`; `CaseSensitive => true` disables case folding.

**Thesaurus dictionary (TZ)** — extends synonym with **phrase** support: `sample word(s) : indexed word(s)` entries, normalized first by a single required subdictionary (e.g. `english_stem`). Use `?` where a stop word may appear, and the longest match wins:

```sql
CREATE TEXT SEARCH DICTIONARY verb_thes (
    TEMPLATE = thesaurus,
    DictFile = verb_thesaurus,
    Dictionary = pg_catalog.english_stem
);
```

⚠️ **Thesaurus changes require reindexing** the tsvector data (unlike stop-word tweaks) — and for a `GENERATED ALWAYS` column that means rewriting the table. Prefer the synonym template for one-word mappings; reserve thesaurus for multi-word equivalences. Either way, the application-side dictionary in Section 4 remains the deploy-free fallback.

## Checklist
- [ ] Generated `tsvector` column (not trigger-maintained) for in-sync indexing
- [ ] `ts_debug` check on your domain's verbs before shipping
- [ ] Bound-parameter `plainto_tsquery` per word, combined with `&&` / `||` — never string-concatenated `to_tsquery`
- [ ] Small reviewed irregular-verb dictionary (app-side) — or a synonym dictionary mapped before `english_stem` (server-side; thesaurus template only if you accept reindexing)
- [ ] Trigrams only as a typo-safety net, with a length-aware threshold

## References
- Original: [Why "paying invoices" doesn't find "paid" in PostgreSQL full-text search](https://dev.to/danbasseda/why-paying-invoices-doesnt-find-paid-in-postgresql-full-text-search-3j4b)
- [PostgreSQL Docs §12.6.3 Synonym Dictionary](https://www.postgresql.org/docs/current/textsearch-dictionaries.html#TEXTSEARCH-SYNONYM-DICTIONARY) and [§12.6.4 Thesaurus Dictionary](https://www.postgresql.org/docs/current/textsearch-dictionaries.html#TEXTSEARCH-THESAURUS)
- Related: [[explanation-postgresql-generated-columns-vs-triggers]]

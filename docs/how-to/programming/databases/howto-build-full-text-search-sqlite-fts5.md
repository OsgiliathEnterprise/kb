---
title: Build a Full-Text Search Engine with SQLite FTS5 (External-Content Table, Triggers,
  BM25)
diataxis: How-to Guide
domain: programming
topic: databases
source: DEV.to Tech News
source_url: https://dev.to/ali_82f3409ed625e8ba8515b/build-a-full-text-search-engine-with-sqlite-fts5-md8
date: '2026-11-18'
keywords:
- knowledge-base
- databases
- programming
- how-to
---
# Build a Full-Text Search Engine with SQLite FTS5 (External-Content Table, Triggers, BM25)

## Goal
Turn a plain SQLite file into a ranked search engine using only the Python standard library — no extra packages, no server. FTS5 is a virtual-table module built into SQLite ≥ 3.9.0 that maintains an inverted index of words, so a search reads the index instead of scanning rows.

## When LIKE fails (and FTS5 wins)
A search box built on `LIKE '%word%'` has three structural problems:
1. Leading wildcards can't use an index → full table scan per query.
2. Exact character matching only → searching "run" misses "running" (no stemming).
3. No relevance ranking → rows come back in table order.

FTS5 fixes all three: indexed words, stemming (porter tokenizer), BM25 ranking. On 100k documents the article's benchmark measured FTS5 at 35.7 ms vs LIKE at 77.8 ms (2.2x faster) — but the honest reading is that both returned ~97k rows, so fetching dominated; the real win is the ranking/stemming/phrase/snippet capability LIKE simply lacks.

## Step 1: Probe FTS5 availability

```python
import sqlite3
con = sqlite3.connect(":memory:")
con.execute("CREATE VIRTUAL TABLE t USING fts5(a)")
print("FTS5 OK", sqlite3.sqlite_version)   # e.g. FTS5 OK / 3.45.1
```

If this raises `OperationalError`, the bundled SQLite was built without FTS5 — upgrade Python or install `pysqlite3-binary` (bundles a newer SQLite).

## Step 2: External-content FTS5 table (store text once)
Keep the real data in a normal table; the FTS5 table stores **only the index** and reads text back from the content table:

```sql
CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    body  TEXT NOT NULL
);
CREATE VIRTUAL TABLE notes_fts USING fts5(
    title, body,
    content='notes', content_rowid='id',
    tokenize='porter unicode61'
);
```

`content='notes'` is the key detail: text is stored once, and the index can always be rebuilt from the source table with `INSERT INTO notes_fts(notes_fts) VALUES('rebuild')`. `porter` stemming makes "running" match "run".

## Step 3: Three triggers keep the index in step
An external-content table does **not** update itself. Mirror every change with triggers so application code never touches the FTS5 table directly:

```sql
CREATE TRIGGER notes_ai AFTER INSERT ON notes BEGIN
    INSERT INTO notes_fts(rowid, title, body)
    VALUES (new.id, new.title, new.body);
END;
CREATE TRIGGER notes_ad AFTER DELETE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, body)
    VALUES ('delete', old.id, old.title, old.body);
END;
CREATE TRIGGER notes_au AFTER UPDATE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, body)
    VALUES ('delete', old.id, old.title, old.body);
    INSERT INTO notes_fts(rowid, title, body)
    VALUES (new.id, new.title, new.body);
END;
```

Verified behavior: insert a note with a made-up word → search finds 1 match; delete it → same search finds 0.

## Step 4: Query with BM25 rank and snippet()
```python
def search(query, limit=5):
    rows = con.execute('''
        SELECT n.title,
               snippet(notes_fts, 1, '[', ']', ' ... ', 12) AS preview,
               bm25(notes_fts, 10.0, 1.0) AS score
        FROM notes_fts
        JOIN notes n ON n.id = notes_fts.rowid
        WHERE notes_fts MATCH ?
        ORDER BY score
        LIMIT ?
    ''', (query, limit)).fetchall()
```

Gotchas that bite on first contact:
- **`bm25()` returns negative scores; more negative = better**, so `ORDER BY score` ascending puts the best match first.
- Column weights: `bm25(notes_fts, 10.0, 1.0)` counts a title hit 10x a body hit — this is why the title match wins.
- **Join on `rowid`**, not a named column — rowid is FTS5's internal key for external-content tables.
- `snippet(table, col, '[', ']', ' ... ', 12)` returns a context window around the match with bracketed highlights.

## Step 5: Five query shapes through one MATCH operator

```
"full text search"            # phrase — exact word order
databas*                      # prefix — database, dataset, ...
python AND sqlite             # boolean — both required
title:sqlite                  # column filter — title only
NEAR(running stemming, 5)     # proximity — within 5 tokens
```

## When to move to a dedicated search service
FTS5 handles tens of thousands of documents comfortably and stays fast at 100k. Move to Meilisearch/Elasticsearch when you need: typo tolerance (FTS5 has none — exact tokens only), faceted search, or millions of documents under heavy concurrent load.

## Decision checklist
- [ ] Probe FTS5 availability before designing around it.
- [ ] Use external-content form + triggers, never dual-write from app code.
- [ ] Order by `bm25()` ascending (negative scores).
- [ ] `rowid` join for external-content tables.
- [ ] Rebuild command (`'rebuild'`) in the toolbox for index drift recovery.

## Relevance to Our Domain
Complements [[howto-postgresql-fts-irregular-verb-stemming]] (the PostgreSQL FTS side, incl. stemming gaps): SQLite FTS5 is the zero-ops answer for embedded search — notes apps, docs sites, small catalogues — while PG/ES cover multi-writer and typo-tolerant needs.

## References
- Original article: [Build a Full-Text Search Engine with SQLite FTS5](https://dev.to/ali_82f3409ed625e8ba8515b/build-a-full-text-search-engine-with-sqlite-fts5-md8)
- Upstream: [LogicStack original](https://logicstack.org/blog/build-full-text-search-sqlite-fts5)
- SQLite FTS5 docs: [fts5.html](https://sqlite.org/fts5.html)

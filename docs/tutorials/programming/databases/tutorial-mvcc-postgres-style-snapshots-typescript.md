---
title: 'MVCC Explained: Build Postgres-Style Snapshots in ~100 Lines of TypeScript'
diataxis: Tutorial
domain: programming
topic: databases
source: DEV.to Tech News
source_url: https://dev.to/jatin510/mvcc-explained-build-postgres-style-snapshots-in-100-lines-of-typescript-37be
date: 2026-08-27
keywords:
- knowledge-base
- databases
- programming
- tutorials
---
# MVCC Explained: Build Postgres-Style Snapshots in ~100 Lines of TypeScript

A hands-on tutorial that derives Multi-Version Concurrency Control (MVCC) from first
principles. The motivating demo: session A runs `BEGIN; DELETE FROM users;` on a
million-row table without committing, while session B's `SELECT count(*)` still returns
1,000,000 — no locks, no blocking, no errors. Where are the rows? **Both deleted and
not.** MVCC is how Postgres, MySQL/InnoDB, Oracle, and SQLite (WAL mode) make that
possible: readers and writers ignore each other.

## The founding decision

> **Nothing is ever updated. Nothing is ever deleted. The database only ever appends.**

Every "problem" below is a consequence of this decision; every piece of MVCC is the
minimal fix for one problem.

![Diagram 1 — tutorial-mvcc-postgres-style-snapshots-typescript](tutorial-mvcc-postgres-style-snapshots-typescript-excalidraw-1.svg)

## Step 1 — rows become version chains

A row is not a value; it's the full history of values:

```ts
type Txid = number;

interface Version {
  xmin: Txid;          // birth certificate: which transaction created this version
  xmax: Txid | null;   // death certificate: which transaction deleted it (null = alive)
  value: unknown;
}

interface Row {
  versions: Version[]; // oldest first — nothing is ever removed or overwritten
}
```

Writes become trivial: `INSERT` pushes `{xmin: me, xmax: null}`; `DELETE` sets
`xmax = me` on the live version (a *stamp*, not a removal); `UPDATE` is literally
delete + insert. Transactions are just an incrementing counter — because txids only
increase, they double as timestamps.

## Step 2 — dirty reads: stamps need a commit log

Naive rule "visible if `xmax === null`" fails when the deleting transaction hasn't
committed yet (and then rolls back): session B would have read a state of the world
that never existed — a **dirty read**. Fix: track per-txid status in a commit log
(Postgres' `pg_xact`, historically clog):

```ts
type TxStatus = "in_progress" | "committed" | "aborted";
type Clog = Map<Txid, TxStatus>;

commit(txid) { this.clog.set(txid, "committed"); }  // ONE map write
abort(txid)  { this.clog.set(txid, "aborted"); }    // stamps stay — they just stop counting
```

Commit touches **zero rows**: one map entry flip retroactively makes a million `xmax`
stamps count (or not). That's why Postgres `ROLLBACK` after a huge write is cheap.

## Step 3 — non-repeatable reads: the snapshot

If session B reads, then A commits, then B reads again *in the same transaction*, B's
world changed under its feet. The fix is a **snapshot** taken at `begin()`:

```ts
interface Snapshot {
  nextTxid: Txid;         // counter value at my begin(); anything >= this is my future
  activeTxids: Set<Txid>; // who was still running when I began — their fate is undecided for me
}
```

A snapshot is **not a copy of the data** — copying a million rows per transaction would
be insane. It's two numbers and a set; that immutability *is* the "repeatable" in
repeatable reads.

## Step 4 — the late-committing past transaction

Transaction 5 was running when I (txid 8) began, so `xmin &lt; snap.nextTxid` says its
writes are in my past — but if it commits while I'm running, they'd leak into my
snapshot mid-flight. The `activeTxids` set closes that door: a stamp from any
transaction in flight at my `begin()` never counts for me, no matter what it does later.

## The visibility function (the whole point)

```ts
function isVisible(v: Version, snap: Snapshot, clog: Clog, myTxid: Txid): boolean {
  // Part 1: was this version BORN, from my point of view?
  const xminVisible =
    v.xmin === myTxid ||                       // my own writes are always visible to me
    (clog.get(v.xmin) === "committed" &&       // it really happened   (else DIRTY READS)
     v.xmin < snap.nextTxid &&                 // it was in my past     (else FUTURE leaks in)
     !snap.activeTxids.has(v.xmin));          // author wasn't mid-flight at begin() (else NON-REPEATABLE)

  if (!xminVisible) return false;

  // Part 2: has this version DIED, from my point of view?
  if (v.xmax === null) return true;            // no death certificate: alive for everyone
  if (v.xmax === myTxid) return false;         // I stamped it myself -> dead to me instantly

  const xmaxApplies =                          // death plays by birth's rules (symmetry!)
    clog.get(v.xmax) === "committed" &&
    v.xmax < snap.nextTxid &&
    !snap.activeTxids.has(v.xmax);

  return !xmaxApplies;
}
```

> **A version is visible when its birth is inside your snapshot and its death is not.**

Every condition is load-bearing — delete one line and a named anomaly returns (the
tutorial's repo has a test per condition). The punchline is the symmetry: the `xmax`
half applies the *same three conditions* to judge death instead of birth. Once this
function exists, every operation becomes a one-liner over version chains — reading is
just filtering history through a pure function, which is exactly why readers never
block writers.

## What to verify against real Postgres

- `SELECT ctid FROM t` before/after an `UPDATE`: the row's physical address changes —
  same append trick.
- The tutorial points its toy implementation at real Postgres and shows the columns
  match one-to-one (`xmin`/`xmax` are visible in system catalogs).

## References

- [Original tutorial (dev.to, jatin510)](https://dev.to/jatin510/mvcc-explained-build-postgres-style-snapshots-in-100-lines-of-typescript-37be)
- [PostgreSQL: Multiversion Concurrency Control](https://www.postgresql.org/docs/current/mvcc-intro.html)
- [Heroku Dev Center: PostgreSQL Concurrency with MVCC](https://devcenter.heroku.com/articles/postgresql-concurrency)

## Related
- [[tutorial-commit-conversation-voice-turn-context]]

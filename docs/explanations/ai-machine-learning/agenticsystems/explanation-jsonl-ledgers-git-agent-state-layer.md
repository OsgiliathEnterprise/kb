---
title: JSONL Ledgers in Git as the State Layer for Autonomous Agents
diataxis: Explanation
domain: AI & Machine Learning
topic: Agentic-Systems
source: DEV.to (rulestack)
source_url: https://dev.to/rulestack/jsonl-ledgers-in-git-as-the-state-layer-for-an-autonomous-agent-patterns-that-survive-crashes-and-4ljp
date: 2026-08-22
keywords:
- knowledge-base
- Agentic-Systems
- AI & Machine Learning
- explanations
---
# JSONL Ledgers in Git as the State Layer for Autonomous Agents

## The Setup

An autonomous agent running a small publishing business (posting, replying, following, publishing articles) for three months stores **all** its state as a directory of JSONL files committed to git — not Postgres, SQLite, or Redis. One JSON object per line; new facts appended at the end.

## Why Files-in-Git at All

Three properties mattered more than query power:

1. **Every state change is a diff.** When the agent follows someone or publishes an article, the evidence lands in `git log` with a timestamp and author. Auditing an autonomous system is the hard part of running one; with ledgers in git, *the audit trail is the storage engine*.
2. **Scheduled jobs and interactive sessions share state with no server.** GitHub Actions jobs check out the repo, read the ledgers, act, commit. The interactive session pulls before deciding anything. The merge boundary is git's problem — a well-understood problem.
3. **The LLM can read its own state natively.** An agent that can `grep` its full decision history is meaningfully smarter than one that needs a query layer written for it.

## Pattern 1: Append-Only, With One Exception

Almost every ledger is append-only: a crashed write corrupts at most the final line, and recovery is "drop the broken tail," not "restore from backup."

The exception: **consumption ledgers** (a stock of pre-written posts, a queue of follow candidates) need a `consumedAt` stamp on existing rows. For those, load-modify-rewrite the whole file — acceptable because the files are small — with one hard rule:

> **A consumed mark is never overwritten.** The update function refuses to touch a row whose `consumedAt` is already set.

Retry-safety comes from that *refusal*, not from hoping the caller behaves.

## Pattern 2: Idempotency Keys From the Outside World

Every ledger row that mirrors an external event carries the external system's own identifier — the post URI, the article ID, the comment permalink. Ingestion dedupes on that key, so "the cron fired twice" and "the agent re-ran the command after a timeout" become non-events.

The corollary: **never let the LLM hand-type an identifier.** Every DID, URI, and ID in an input file is copied mechanically from a previous command's output. One hand-typed identifier with a single wrong character created a follow record pointing at an account that does not exist — the API accepted it (syntactically valid string), there is no unfollow in the pipeline, and the row is in the history forever, because **ledgers don't forget**.

## Pattern 3: Two-Phase Validation, Side Effects Last

Commands that act on the world validate the *entire* batch before performing *any* of it. If one entry in a reply batch is malformed, the whole batch throws before the first reply is sent. A half-executed batch is the worst state an autonomous system can be in — the ledger says one thing, the world says another — so never create it.

## Pattern 4: The Ledger Is the Gate

Because production state lives in the repo, **the test suite can read production state**. The commit gate includes tests that load the real ledgers and assert invariants:

- every stocked post is under the platform's length limit
- no stocked article's title collides with a published one
- no open TODO item is older than its grace period

Corrupt or contradictory state cannot be committed, because the tests that guard it run on every commit. State bugs get caught **at write time by CI**, not at 3 a.m. by the scheduled job that tried to consume the bad row.

## Where It Genuinely Hurts

| You give up | Mitigation |
|-------------|-----------|
| Cross-file transactions | Scope every command to one ledger write where possible |
| Concurrent writers on the same file | git rebase handles cross-job races; two writers in the same working tree need coordination (serialize by agreement) |
| Queries fancier than a linear scan | Fine at this scale: largest ledger &lt; 1,000 lines, all ledgers together &lt; 4,000 |

**Decision rule:** if your agent handles thousands of events an hour, use a database. For dozens of decisions a day that you need to trust and audit years later, a pile of JSONL files under git is "the most boring — and therefore best — infrastructure decision."

## Known Gap (from community review)

The hardest hole is the window between an external side effect and the ledger append: *publish succeeds → process crashes before recording the URI → retry publishes again.* Suggested hardening: give every logical operation a stable idempotency key, write a durable `prepared` record before dispatch, pass the key to the provider when possible, and reconcile indeterminate operations against provider state before retrying. Also: git rebase detects text conflicts but does **not** prove two non-conflicting appends preserve a cross-record invariant — a single-writer lease plus generation/hash preconditions (or a replayable reducer) makes the concurrency contract explicit.

## Flow

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "event",
      "type": "rectangle",
      "x": 40, "y": 40,
      "width": 200, "height": 80,
      "strokeColor": "#3667a5",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "External event\n(post URI, article ID)\ncarry its own identifier", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "dedupe",
      "type": "rectangle",
      "x": 320, "y": 40,
      "width": 200, "height": 80,
      "strokeColor": "#bf8401",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Dedupe on external key\ncron fired twice = non-event\nnever hand-type IDs", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "validate",
      "type": "rectangle",
      "x": 600, "y": 40,
      "width": 200, "height": 80,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Two-phase: validate ENTIRE batch\nthen execute\nno half-executed batches", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "ledger",
      "type": "rectangle",
      "x": 320, "y": 200,
      "width": 200, "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffffff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "JSONL ledger in git\nappend-only (consumedAt\nnever overwritten)\ncrash = drop broken tail", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "gate",
      "type": "rectangle",
      "x": 600, "y": 200,
      "width": 200, "height": 90,
      "strokeColor": "#e52727",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Commit gate (CI)\ntests read REAL ledgers\nassert invariants\nbug caught at write time", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "arrow-1",
      "type": "arrow",
      "x": 240, "y": 80,
      "width": 80, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "arrow-2",
      "type": "arrow",
      "x": 520, "y": 80,
      "width": 80, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "arrow-3",
      "type": "arrow",
      "x": 420, "y": 120,
      "width": 0, "height": 80,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 80]]
    },
    {
      "id": "arrow-4",
      "type": "arrow",
      "x": 520, "y": 245,
      "width": 80, "height": 0,
      "strokeColor": "#e52727",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    }
  ]
}
```

## References

- [JSONL ledgers in git as the state layer for an autonomous agent — DEV.to](https://dev.to/rulestack/jsonl-ledgers-in-git-as-the-state-layer-for-an-autonomous-agent-patterns-that-survive-crashes-and-4ljp)

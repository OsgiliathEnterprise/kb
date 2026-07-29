---
title: The Orchestrator's Tax — Multi-Agent Context Management
diataxis: Explanation
domain: AI-Infrastructure
topic: Agent-Infrastructure
source: MartinFowler.com — Rahul Garg
source_url: https://martinfowler.com/articles/orchestrator-tax.html
date: 2026-07-29
keywords:
- knowledge-base
- Agent-Infrastructure
- AI-Infrastructure
- explanations
---
# The Orchestrator's Tax — Multi-Agent Context Management

## Overview

Multi-agent systems are typically sold on the promise of parallelism and time savings. Rahul Garg's [The Orchestrator's Tax](https://martinfowler.com/articles/orchestrator-tax.html) (MartinFowler.com, 2026-07-28) turns that framing on its head through a real incident: the dominant cost in a long-running orchestration session was not the subagents themselves, but the orchestrator polluting its own working memory by pulling full raw transcripts of background agents into its context.

The core thesis: **subagents' real value is protecting the orchestrator's working memory, not saving wall-clock time.** They are a tool for keeping disposable reasoning disposable — noisy exploration, failed approaches, intermediate tool output — confined to worker contexts so it never reaches the main thread.

---

## The Incident

Garg was running a Claude Code session on a .NET codebase with four subagents handling a response-pipeline refactor. At one point, the orchestrator suggested "checking on the agents." The tool call pulled back **full raw transcripts** (tens of thousands of tokens of JSONL, intermediate reasoning, and tool output) into the main thread. This happened twice.

The orchestrator itself graded this as the largest cost in the session — larger than the duplicated orientation cost of four agents independently reading the same files. (Caveat: this was the orchestrator's self-assessment, not instrumented measurement, but the transcript dumps and wall-clock timings were real.)

---

## Three Types of Cost

The incident revealed that not all costs in multi-agent orchestration are the same. Garg distinguishes three types that should not be conflated:

### 1. Token Cost (One-Time)

The bill for tokens consumed by a tool call or agent spawn. You pay it once and it's over. This is the cost metric most tooling instruments and most practitioners watch.

### 2. Context Pollution (Compounding)

When raw data enters the orchestrator's context, it **stays there for every subsequent turn**. A full transcript dump doesn't just cost the tokens it occupied at insertion — it taxes every decision the orchestrator makes after that point. Context pollution is a compounding cost: it charges rent for the rest of the session.

### 3. Cognitive Load (Attention Competition)

Even with plenty of room left in the context window, more content means more things competing for the model's attention. A bigger context window doesn't fix this — it just gives noise more room to accumulate before anyone notices. The real question is not how much fits, but how much of what fits is worth the model's attention.

```excalidraw
!bhG3z5XvZJYQ7FqNpWxR {
  "type": "excalidraw",
  "custom_data": {
    "source": "https://excalidraw.com",
    "version": "1.0"
  }
}

## The Orchestrator's Tax — Three Cost Types

### Token Cost (One-Time)
- Paid once at point of use
- Visible in billing dashboards
- Easy to measure

### Context Pollution (Compounding)
- Stays in context every turn after
- Taxes all future decisions
- Invisible until session degrades

### Cognitive Load (Attention Competition)
- More content = harder to focus on what matters
- Bigger context windows don't help
- Quality of attention, not quantity of space

[Orchestrator Context]
  ^
  |  Context Pollution accumulates here
  |  every turn, compounding
  v
[---- Context Window ----]
|                        |
|  [Signal: task state]  |  <- What the orchestrator needs
|  [Signal: constraints] |
|  [NOISE: transcript 1] |  <- Context pollution
|  [NOISE: transcript 2] |
|  [NOISE: raw JSONL]    |
|  ...                   |
|                        |
|  ^ Cognitive Load:     |
|  model must attend to  |
|  signal amid noise     |
|                        |
[---- /Context Window --]
                        |
                        v
                    [Decision Quality
                     Degrades Over Time]

Key insight: Subagents should keep the NOISE in worker
contexts and return only what the orchestrator still needs.
```

---

## The Scarce Resource: Orchestrator Working Memory

The orchestrator is the only part of the system that **accumulates understanding across a long session**. It remembers:

- Why design decisions were made
- Architectural constraints in force
- Trade-offs already discussed and resolved
- The overall state of the work

Subagents are intentionally **disposable**. Exploration, repeated file reads, failed approaches, and noisy intermediate reasoning are meant to stay in worker contexts. The real value of delegation is isolation — keeping the orchestrator's working memory clean so it can focus on what matters.

> "I wasn't simply looking at token consumption anymore. I was looking at the quality of the orchestrator's working memory." — Garg

---

## Cognitive Locality

Two of the four subagents in the incident were working in the same area of the response pipeline. They had different tasks and edited different files, but both had to understand the same architecture, testing conventions, and surrounding code. Each paid the full orientation cost independently.

This is not an argument against delegation. It's an argument that the work was **split too finely**.

Garg coins the term **cognitive locality**:

> **Tasks that need the same mental model should usually stay together.**

Splitting work by task rather than by the knowledge each task requires forces multiple agents to rebuild the same understanding from scratch. Parallelism still matters — running agents concurrently is useful — but the primary benefit of subagents is isolation, not wall-clock savings.

**Practical implication:** Before spawning another agent, ask whether the new task shares the same mental model (same codebase area, same conventions, same architectural understanding) as an existing agent. If yes, consolidate rather than split.

---

## Standing Rules Derived from the Incident

Garg encoded the lessons into `CLAUDE.md` — the standing instruction file loaded at the start of every session. The rules are deliberately minimal, since every extra line is a cost paid again on every future session:

| # | Rule | Addresses |
|---|------|-----------|
| 1 | **Prefer 2–4 agents per wave.** If five or more are needed, first check whether tasks sharing files or conventions should be merged. | Over-spawning, cognitive locality violations |
| 2 | **Do not poll background agents for status** when the answer can be given from what is already known. Do not fetch a full transcript to answer a lightweight question. | Context pollution (the primary incident cost) |
| 3 | **Do not allow repository-wide git operations** (e.g., `git stash`, `git stash pop`) inside concurrent agent prompts. | Structural risk from multiple concurrent writers |
| 4 | **Treat overlapping file ownership as a consolidation signal**, not a cue to spawn more agents. | Cognitive locality, duplicated orientation |

These rules don't script behavior — they give the orchestrator something to check before acting. Their shared purpose: keeping disposable reasoning disposable and preserving room in the orchestrator's context for what it needs later in the session.

---

## Skill Propagation Gap

A later session revealed another issue: subagents **do not inherit skills** active in the parent session unless the orchestrator passes them along explicitly. Garg had assumed that activating a skill in the main thread would automatically propagate it to spawned agents. It does not.

The fix was not a universal confirmation gate (which would have added a round-trip to every session and likely become autopilot-approved ritual). Instead:

- Before spawning, the orchestrator states which active skills are relevant to each agent's task
- It points the subagent at the skill file to load (rather than pasting the whole skill inline)
- Confirmation is only required above the existing batch-size threshold, or when file ownership is ambiguous

---

## The Governance Heuristic

> **Before adding a line to a standing instruction file, ask whether a reasonably competent orchestrator would make the right decision once it knew the one missing fact.**

- If **yes** → the rule should just state the fact
- If the fix starts specifying a **decision procedure** (approvals, checkpoints, mandatory steps) → that's usually a sign you're encoding process where a small clarification would have done the job

This heuristic prevents turning every interesting incident into miniature bureaucracy. It distinguishes between:

1. **Missing facts** — the orchestrator simply didn't know something (e.g., "skills don't propagate to subagents")
2. **Genuine process gaps** — the orchestrator needs structural constraints regardless of knowledge

---

## The CLAUDE.md File as Calibration Artifact

The `CLAUDE.md` file is not a finished prescription. Garg describes it as **the state of calibration after this iteration**. Key points:

- Thresholds (2–4 agents, 5 as consolidation signal) were calibrated against **Claude Sonnet 5** and the specific .NET work being done
- They are not universal constants — a different model may need a different balance
- The file is a [sample, not a template](https://gist.github.com/techygarg/f8f98a2f026538fad4a69b593a964d95)
- What matters is the **habit**: noticing a failure, asking what it actually cost, and writing the rule that would have caught it

---

## The Learning Flywheel

Garg describes a feedback loop with a human firmly in the middle:

1. **Session exposes a gap** — something feels wrong during orchestration
2. **Human stops and inspects** — determines whether the problem is real or noise
3. **Human judges what to codify** — what becomes a standing rule, what stays a lesson
4. **Next session tests the judgment** — did the rule improve work or create new waste?

The orchestrator can surface clues and grade its own session, but it cannot make the judgment call about what to codify. That choice is inherently human.

---

## Key Takeaways

1. **Watch working memory quality, not just token count.** The orchestrator's context is the scarcest resource in long-running multi-agent sessions. Once polluted, it charges rent for the rest of the session.

2. **Subagents are isolation boundaries, not just parallel workers.** Their primary job is keeping noisy intermediate reasoning out of the orchestrator's context.

3. **Cognitive locality > task parallelism.** Group work by shared mental model, not by independent deliverable.

4. **Governance should be minimal.** A missing fact deserves a one-line clarification, not a multi-step approval process.

5. **Every line in standing instructions is a recurring cost.** Compress rules to the minimum that addresses the actual failure mode.

---

## Open Questions

Garg leaves several questions unresolved:

- How to measure context pollution properly, instead of relying on the orchestrator's self-assessment?
- When does a missing fact belong in instructions, and when does that become too much process?
- What orchestration mistakes are we not seeing yet?
- How do these thresholds hold up against different models (tested only against Claude Sonnet 5)?

---

## Related Work

- [Context Anchoring](https://martinfowler.com/articles/reduce-friction-ai/context-anchoring.html) — Garg's earlier piece on externalizing decision context into living documents (about context surviving *across* sessions; this piece is about keeping context clean *within* a single session)
- [Harness Engineering](https://martinfowler.com/articles/harness-engineering.html) by Birgitta Böckeler — names the feedforward guide + feedback signal loop that Garg was running without a word for it

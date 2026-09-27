---
title: How to Build an AI Workflow Inventory for Your Team
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: DZone AI/ML
source_url: https://dzone.com/articles/ai-workflow-inventory
date: 2026-09-27
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# How to Build an AI Workflow Inventory for Your Team

Teams have diffuse knowledge of their own AI usage — everyone knows *their* shortcuts (the colleague who drafts stakeholder updates with a model, the nightly job somebody set up before leaving), but nobody can answer for the sum: who else drafts with a model, which outputs leave the team that way, which jobs run unattended. That undocumented, unowned sum is **"AI Debt"** — it works right up to the moment someone asks who is responsible for it.

The **AI Workflow Inventory** is the artifact that closes this gap: one row per recurring task, refined into provisional *task classes* that feed later AI delegation decisions (routing policy, definition of done, delegation audits). It finalizes the pre-stage-1 step of an A3-style delegation system — the "forensic analysis of your own workflow" that teams cannot reliably produce from memory.

## Goal

A one-page canvas capturing every recurring task the team runs with a model, at what frequency, with what stakes — so compatible tasks share one review standard and one routing decision instead of getting one each.

## The canvas structure

1. **Identity strip**: team, owner, date, review date.
2. **"Where to look" panel**: sources for discovering workflows (individual accounts, job logs, tool usage).
3. **Five refinement rules** panel: how raw task descriptions get refined into classes.
4. **The inventory table itself**, one row per recurring task.

## What one row looks like

Example from a Scrum team:

| Field | Value |
|-------|-------|
| Number | I-01 |
| Task | Transcribe photos of Retrospective sticky notes |
| Process | Retrospective facilitation |
| Task class | Transcriptions for internal use |
| How often | Per Sprint |
| Who runs it | Scrum Master |
| Tool | GPT-5.6 Sol |
| Output goes to | Stays in the team |
| Data that enters the model | Photos of handwritten notes and names |

Conventions: the task is written as **verb + object**; the class is named by **output and audience** ("Transcriptions for internal use"); "output goes to" has exactly three values — *stays in the team*, *leaves the team*, or *customer-facing*. The inventory number (I-01) travels with the task into later Workflow Cards, so a row and its decision can be matched months apart.

## Two design choices that carry most of the weight

**Person and tool sit in separate columns.** People change and tools change while the task stays; a combined field ("Anna, ChatGPT") makes it harder to update either when Anna moves teams or the license changes.

**"Output goes to" and "data that enters the model" ask different questions teams routinely conflate.** Where the output goes tells you about the *stakes on the way out*; what enters the model tells you about the *exposure on the way in*. An output that "stays in the team" can still have been produced from photographs with names on them. The data field is a fact to review — not permission to keep uploading the names.

## What the canvas deliberately does NOT have

No lifecycle stage or status column. The inventory records **what happens today**; where a workflow stands in its delegation lifecycle belongs on the poster and in the Workflow Cards, and a retired workflow becomes a row in a Re-classification Log identified by the same inventory number. A stage column would turn the pre-decision list into a second, competing status board — the agile equivalent of the Jira backlog vs. "the real one" spreadsheet debate.

## Maintenance cost and payoff

The inventory takes work to maintain but reduces repeated documentation and decision-making: each recurring task is captured once; compatible tasks share one review standard and one routing decision; the number connects a task to every later decision about it. Update the inventory when the work changes or when the team discovers, corrects, or refines what it has recorded.

## References

- [Can Your Team Name the Work It Already Runs With AI? (DZone)](https://dzone.com/articles/ai-workflow-inventory)
- Original: [age-of-product.com — AI Workflow Inventory](https://age-of-product.com/ai-workflow-inventory/)

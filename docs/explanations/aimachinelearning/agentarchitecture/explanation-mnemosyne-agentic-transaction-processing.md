---
title: Mnemosyne — Agentic Transaction Processing for Validating and Repairing AI-generated
  Workflows
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2607.00269
date: 2026-11-15
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Mnemosyne — Agentic Transaction Processing for Validating and Repairing AI-generated Workflows

## Overview
LLMs increasingly emit workflow actions and repairs that are *well formed* yet still stale, infeasible, conflicting — or destructive of the very evidence needed to audit them. Mnemosyne imports the oldest idea in databases, the transaction, into agent runtimes: **Agentic Transaction Processing (ATP)**, where anything may propose but only the runtime admits and commits.

## Problem Statement
A generated action that parses and type-checks can still violate domain constraints, act on stale state, or erase its own evidence trail. Existing agent frameworks grant generated actions de-facto authority at emit time. Two adversarial assumptions drive the design: *a proposal is not truth*, and *no proposal foresees every disruption* — so validation must be deterministic and repair must be reactive and bounded.

## Key Contributions
- **Two-sided admission principle**: generated actions are untrusted proposals; a deterministic admission gate accepts them only under an executable constraint set **C**; unforeseen disruptions trigger *bounded reactive repair* whose output re-enters admission (repair proposals are themselves untrusted).
- **Concrete runtime**: append-only transition log, effective-state projection, dependency-safe compensation, and *active contract records* (obligations that must stay satisfied).
- **Four proved safety properties** (relative to C, under stated assumptions): authority separation, serial-equivalent generative admission, evidence-preserving repair, obligation containment — plus boundedness of reactive repair.
- **Broad empirical programme**: nine safety benchmarks and a four-case Temporal SDK comparison — every targeted violation rejected, valid work admitted; a matched data-size sweep shows only **5.2–6.6% incremental throughput cost** over the same local durable commit path; a scheduling harness shows local repair edits ~an order of magnitude fewer operations than global recompute; a 12-scenario interruption stress test rejects every stale recovery candidate with no lost observations and no invalid commits.
- **Heterogeneity pilot**: 80 proposals from four different LLMs routed through the same gate with **zero invalid commits**; of 40 mid-execution proposals, 24 admitted, 16 rejected — including four explicit safety rejections.

## Technical Approach
LLMs sit entirely outside the authority boundary: they emit proposals. The ATP runtime maintains an append-only log of transitions, projects an effective state, checks each proposal against executable constraints C before admission, and commits serializably. When reality disrupts a plan mid-flight, a repair proposal is generated, compensated dependency-safely (undoing only what depends on the failed step), and re-admitted through the same gate. Contract records make outstanding obligations first-class, so repair cannot silently drop duties.

## Results
- 100% rejection of targeted violations across nine safety benchmarks; valid work still admitted.
- 5.2–6.6% throughput overhead vs. the durable-commit baseline (exposing local saturation, not gate cost).
- Local repair ≈ 10× fewer edited operations than global recompute.
- 80/80 heterogeneous-LLM proposals committed with zero invalid commits.

## Relevance
The strongest blueprint so far for *trust boundaries in agent platforms*: model capability is orthogonal to admission authority. Pairs directly with durable-execution and certified-harness work in this topic; the numbers (5-7% overhead, zero invalid commits) make the trade concrete for production agent infrastructure.

## Sources
- arXiv: https://arxiv.org/abs/2607.00269 (v3)
- Related: [[explanation-agent-substrate-stateful-runtime]], [[explanation-certified-execution-harness-petri-net-supervisor]]

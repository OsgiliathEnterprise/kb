---
title: Gating LLM Code Repairs after API Migrations — Catching Silent Failures with
  Release-Note Edge Inputs
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.08269
date: '2026-11-08'
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# Gating LLM Code Repairs after API Migrations — Catching Silent Failures with Release-Note Edge Inputs

## Overview
Wang, Zhang, Chen & Chen (2026) document a dangerous failure class in automated repair for API migrations: repairs that **keep the old observable behaviour** while violating the new API contract, and therefore pass the project's existing tests. Across 667 migration changes from 10 libraries and 242 real-world library upgrades, the majority of accepted LLM repairs were behaviourally incorrect — yet the project test suite passed them. The paper prescribes a concrete gate: **generate edge-case inputs from release notes and use them to screen repairs before acceptance**.

## When to Use This
You are using an LLM (or any automated repair tool, with or without human review) to migrate code after a third-party dependency update, and the updated library's test suite passes. Do not accept the repair yet — this procedure catches the cases where the code still "works" but no longer complies with the new API.

## Procedure

1. **Reproduce the API change as an oracle.**
   Extract concrete behaviour-change descriptions from the library's release notes. These notes are noisy and incomplete (that is the known limitation — treat them as a lower bound on detection, not a complete specification).
2. **Generate edge-case inputs from the release notes.**
   For each documented behaviour change, synthesise inputs that sit on the boundary of the changed semantics — the inputs where old and new API behaviour diverge.
3. **Run the candidate repair against the edge-case inputs.**
   Compare the repair's observable behaviour against the expected new-API behaviour on these inputs, not just against the project's original tests.
4. **Gate acceptance on edge-case agreement.**
   Reject (or escalate for human review) any repair that passes the original tests but disagrees with the new API contract on the generated edge inputs. This is the "silent failure" filter — in the study, such failures survived both automated and human review.
5. **Track the oracle gap.**
   Log cases where release notes were too vague to generate a discriminating input; these are your residual-risk cases and candidates for manual oracle construction.

## Expected Outcome
Repairs accepted after this gate are **observable-behaviourally correct**: the repair produces the new API's behaviour, not the old API's. In the paper's evaluation, adding the release-note-derived edge-input oracle to otherwise identical repair procedures yielded measurable accuracy gains over automated and human-reviewed baselines.

## Key Facts Behind This Procedure
- Study scale: 667 migration changes, 10 libraries, 242 real-world library upgrades.
- Finding: the majority of accepted LLM repairs violated the new API contract while passing existing tests.
- The paper claims the first **observable-behavioural ground truth** for migration repair correctness (previously, "correct" meant "tests pass").

## Caveats
- Release notes are incomplete: some silent failures remain undetectable by this gate.
- The edge-input generator targets migration scenarios specifically; generalise to other contract changes with care.

## References
- Paper: https://arxiv.org/abs/2611.08269
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.08269
- Related KB: `explanations/developertoolspractices/aicodingagents/`, `how-to/developertoolspractices/testingpractices/`

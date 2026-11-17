---
title: 'Harness Leverage Across Model Size: A Ladder of Five Local Agent Harnesses
  from 0.75B to 4.7B'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.21407
date: 2026-11-17
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Harness Leverage Across Model Size: A Ladder of Five Local Agent Harnesses from 0.75B to 4.7B

## Overview

Reference measurements for how much the *harness* (the scaffold that builds prompts, exposes tools, and decides when work is done) matters relative to model size. Unlike prior studies that fix one side, this work varies both: five shipped harnesses crossed with four locally deployable open-weight models plus one large anchor, all scored by a single deterministic checker.

## Experiment Matrix

| Dimension | Values |
|-----------|--------|
| Harnesses | 5 shipped harnesses (best mean: **Mingbird** at every size) |
| Models | 0.75B, 1.9B, ~3B, 4.7B local open-weight + 35.5B anchor |
| Tasks | 18 artifact-producing tasks |
| Cells | 360, one deterministic checker for all |

## Key Numbers

- **Harness dominates**: paired leads range from 0.075 (over the strongest rival) to 0.819 (over the weakest); 13 of 16 paired intervals exclude zero under the deployment reading. Of four pre-registered paired contrasts, two survive Holm correction (at 0.75B and 4.7B).
- **The completion gate is not the carrier**: disabling all six executable checks moves the mean by only +0.080, +0.117, +0.003 and −0.004 across sizes — every interval including zero. Only at 1.9B does disabling it create empty runs.
- **One rule dominates**: removing a single repeat-blocking rule costs 0.411 at 0.75B and leaves 8 of 18 tasks with no artifact.
- **Exit codes lie**: of 357 usable cells, 127 produce none of their declared artifacts and 85 of those exit normally — a scorer reading exit status credits work that was never written to disk.
- **Scaling is unsettled**: a floor-arm produces a rise with size, a ceiling arm a decline, a cross-family rung a peak; four rungs cannot determine whether harness leverage grows or shrinks.

## Practical Takeaways

1. The harness effect is a **progress effect**: it decides whether a run leaves anything on disk — evaluate harnesses by artifacts, not exit status or self-reported completion.
2. For sub-billion-parameter local agents, harness choice outweighs model choice by a wide margin.
3. Audit individual harness rules (e.g., repeat-blocking) before switching models — one rule was worth 0.411 mean completion.

## Relevance to Our Domain

Complements the KB's harness-engineering notes with the first harness×model crossed benchmark. Directly informs local-agent (0.75B–4.7B) deployment decisions and scorer design in agent CI.

## References

- Paper: https://arxiv.org/abs/2611.21407
- Related KB notes: [[explanation-anatomy-of-an-agent-harness]], [[explanation-evox-agent-harness-runtime-policy]]
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.21407

---
title: 'Agent4Sci: A Long-Horizon Testbed for Frontier Agents on Scientific ML Benchmarks
  (NeurIPS 2026)'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: 'arXiv: Automating ML for Science: Can Frontier Agents Climb Scientific Hills
  in the Wild? (arXiv:2610.28763)'
source_url: https://arxiv.org/abs/2610.28763
date: 2026-10-25
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Agent4Sci: Can Frontier Agents Climb Scientific Hills in the Wild?

## Overview

Frontier coding agents are increasingly framed as end-to-end automated researchers. This paper (NeurIPS 2026 E&D Track, cs.AI/cs.CL/cs.LG; Zhong, Li, Carlini, Jagielski) tests that claim on the most demanding substrate available: **improving the published best models on scientific ML benchmarks**. **Agent4Sci** is a long-horizon testbed spanning **20 benchmarks across 11 domains**, run under in-the-wild conditions. Rather than producing a leaderboard, it asks what *kinds* of progress agents can make — and where they fall short. Code and data are public (GitHub `maszhongming/agent4sci`, Hugging Face dataset `MingZhong/agent4sci`).

## Problem Statement

Leaderboards on closed benchmarks measure benchmark-play; science is open-ended. The open question: when an agent is dropped on a real scientific ML problem with the published best as the baseline, how far does it actually advance the state of the art, and is the progress *research-level* (domain insight) or *engineering-level* (tuning)?

## Key Contribution

- **The testbed**: 20 benchmarks, 11 scientific domains, in-the-wild conditions, with published best models as the starting point for every task.
- **Empirical answer on current agents**: today's frontier agents **advance the published best on every benchmark**, with Claude Opus reaching a **10.4% mean relative improvement** and **no run flagged for academic misconduct**.
- **A sharp finding on the nature of the gains**: the improvements come **almost entirely from a bag of ML-engineering tricks** (hyperparameters, data handling, training schedules) rather than research-level insight. Agents are good ML engineers, not yet ML researchers.
- **Three recurring failure modes** from trajectory analysis:
  1. **Novelty miscalibration** — agents misjudge what counts as a genuinely new idea.
  2. **Resource under-utilization** — they leave compute budget on the table.
  3. **Rapid collapse into local engineering sweeps** — early on they converge to local hyperparameter sweeps and stop exploring.
- **Plug-in skills that close part of the gap**: lightweight skills for *research ideation*, *experiment management*, and *scheduled checklists* raise Claude Opus from **10.4% → 20.1%** mean relative improvement and Codex from **4.4% → 8.1%**, while producing more diverse, domain-relevant interventions.

## Benchmark Specification

| Item | Value |
|------|-------|
| Benchmarks / domains | 20 benchmarks, 11 scientific domains |
| Baseline | Published best model per benchmark |
| Best agent result | Claude Opus: 10.4% mean relative improvement (20.1% with skills) |
| Second agent | Codex: 4.4% → 8.1% with skills |
| Misconduct flags | 0 |
| Failure modes | Novelty miscalibration, resource under-utilization, collapse into local engineering sweeps |
| Artifacts | github.com/maszhongming/agent4sci · huggingface.co/datasets/MingZhong/agent4sci |

## Relevance to Our Domain

Useful calibration for the agent-architecture topic: the "automated researcher" framing is empirically *partially* true — agents reliably do the engineering layer of an ML research cycle and occasionally the ideation layer, but the three failure modes are exactly the ones a supervising engineer would catch. The skills result (2× improvement from ideation/experiment-management/checklist plug-ins) is directly actionable for anyone running agents on open-ended ML work. Pairs with the coding-agent benchmark notes and the memory/skill notes in this topic.

## References

- Paper: https://arxiv.org/abs/2610.28763
- Code: https://github.com/maszhongming/agent4sci
- Data: https://huggingface.co/datasets/MingZhong/agent4sci
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.28763

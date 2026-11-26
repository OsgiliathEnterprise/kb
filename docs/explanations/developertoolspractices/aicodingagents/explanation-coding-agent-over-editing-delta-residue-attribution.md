---
title: How Much Do Coding Agents Over-Edit, and Why? An Empirical Study of Unneeded
  Edits in Repository-Level Agent Patches
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.34875
date: 2026-11-26
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# How Much Do Coding Agents Over-Edit, and Why?

## Overview
Coding-agent patches are bigger than human patches, which the community habitually reads as "over-editing". This paper shows that patch size alone is a misleading proxy: when every hunk of an agent patch is tested for actual necessity, agent-written *code* is on average at least as necessary as developer-written code. The bulk of the "extra" edits come from tests and documentation the agent adds, not from superfluous code.

## Problem Statement
"Agents over-edit" is received wisdom, but nobody had measured whether the extra lines are actually unneeded, what kind of edits they are, or which steps of the agent trajectory produced them. Without that, efforts to curb over-editing target the wrong thing.

## Key Contribution
- **Delta Residue Attribution (DRA)**: a method that replays an agent trajectory, maps every block (unit) of the final patch to the step that wrote it, reverts the unit, and reruns the task tests to classify the unit as needed or unneeded.
- Applied to **7,660 resolved GitHub Copilot CLI trajectories** from 18 frontier models (SWE-bench Verified: 6,728; DeepSWE: 932), with developer patches graded by the same procedure.
- Findings:
  - On SWE-bench Verified, most extra edits over developers are **tests (61%)** and **documentation (13%)**; on DeepSWE most extra edits are code (58%).
  - Mean code-necessity score is at parity or better for agents: 0.887 vs 0.864 (SWE-bench Verified), 0.797 vs 0.785 (DeepSWE); 11 of 18 models leave less unneeded code than developers.
  - ~11% of code units in an agent patch are unneeded on SWE-bench Verified, and 89% of those change behavior. Debug steps write almost none of the unneeded code.
  - Code necessity varies by model and is *unrelated* to resolve rate on SWE-bench Verified, and *negatively* correlated with it on DeepSWE (Spearman −0.59, p = 0.01).

## Technical Approach
DRA turns "is this hunk needed?" into an experiment: revert unit → rerun tests → keep or classify. Attribution to trajectory steps (planning, editing, debugging, self-testing) reveals where unneeded code originates. Two pruning strategies are evaluated: automated DRA-based pruning using only tests visible to the agent (67% recall / 46% precision; 89% of pruned patches still resolve), and asking the agent to audit its own diff (higher precision 66%, lower recall 36%).

## Relevance to Our Domain
Directly informs how we evaluate and constrain coding agents in our pipeline: benchmarking should report **code necessity next to resolve rate**, and over-editing is best fought with model training plus harness-level pruning rather than prompt-level "be minimal" instructions. It also cautions against judging agent output by diff size in code-review automation.

## References
- Paper: https://arxiv.org/abs/2611.34875
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34875

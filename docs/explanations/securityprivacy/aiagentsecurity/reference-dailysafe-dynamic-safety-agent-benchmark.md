---
title: 'DailySafe: Benchmarking Dynamic Safety Awareness in Everyday Multi-Turn Multimodal
  Interactions'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.26298
date: 2026-11-19
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# DailySafe: Benchmarking Dynamic Safety Awareness in Everyday Multi-Turn Multimodal Interactions

## Overview
DailySafe (arXiv 2611.26298, Rong et al., 8 authors, Nov 2026) is a benchmark that measures something existing agent-safety benchmarks miss: whether a multimodal agent **notices, mid-task, that what started as a benign daily task has drifted into an unsafe situation** — and whether it *acts* on that awareness. The unit of evaluation is not the harmful prompt but the **safe course of action inside an ongoing task**. The authors term this capability **Dynamic Safety Awareness**: tracking evolving task conditions, recognizing implicit contextual risks, and providing safe yet helpful assistance.

## Benchmark Specification
| Dimension | Value |
|-----------|-------|
| Interactions | **195 naturalistic multi-turn, multi-image** interactions, human-verified |
| Task themes | **10 everyday domains** (e.g. Health, Care, Mobility, Digital, Work, Finance) |
| Task categories | **42 task categories** |
| Grounding | Authentic user dialogue topics + documented safety knowledge, with case-specific safety annotations (hazards, supporting evidence, expected safe behavior) |
| Trigger | Safety-critical evidence is **progressively revealed** across conversational turns and visual observations — benign requests become safety-critical given earlier actions/frames |
| Evaluated capability | **Dynamic Safety Awareness**: detect evolving conditions, identify implicit risks, act safely while still supporting the user's legitimate goal (safety + helpfulness both scored) |
| Code / data | https://github.com/XuankunRong/DailySafe |

## Why the Design Matters (mechanics)
- **Multi-turn + multi-image**: risk evidence accumulates across turns and frames (e.g. raw chicken on a cutting board earlier → later request to cut ready-to-eat vegetables on the same, visually "empty" board); single-shot safety tests cannot represent it.
- **State-dependent safety**: an action is safe or unsafe *as a function of the evolving interaction state* — this forces genuine situational assessment instead of keyword-triggered refusals.
- **Safety + helpfulness jointly measured**: blanket refusal does not score well, so the benchmark distinguishes *aware* agents from *paranoid* ones.

## Key Findings (from the paper's evaluation of 16 MLLMs)
- **Substantial disparities** in Dynamic Safety Awareness: leading models reach high safety/helpfulness scores, while compact models frequently overlook risks arising from preceding actions.
- **Replacing images with textual descriptions improves safety rates** for the vast majority of models — visual evidence is part of the failure mode.
- **Consolidating the same context into a single turn offers no consistent benefit** (mean safety rate even drops 57.41% → 56.21%).
- **Existing safety enhancements yield limited and inconsistent gains** on the two evaluated backbones, with several reducing helpfulness — conventional safety alignment does not translate into reliable *unfolding-activity* safety awareness.

## Relevance to Our Domain
For agent security coverage, DailySafe fills the "safety while acting" gap that our current notes (single-turn jailbreak/refusal evaluations, e.g. [[explanation-multi-turn-safeguarding-crisis-disclosure]]) don't reach: it is the right harness for testing **our own agent runtimes and tool-guardrails** against mid-task drift, and its 10-domain / 42-category taxonomy is a ready-made checklist for policy design.

## References
- Paper: https://arxiv.org/abs/2611.26298 (submitted 19 Nov 2026, cs.CR)
- Code & data: https://github.com/XuankunRong/DailySafe
- Audited 2026-11-22 against arXiv abs + HTML v1 (title, author roster, 195/10/42 spec, key findings, repo URL).

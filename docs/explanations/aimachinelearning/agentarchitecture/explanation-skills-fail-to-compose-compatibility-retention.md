---
title: 'When Skills Fail to Compose: Compatibility and Retention in Language Models'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2611.34398
date: '2026-11-27'
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# When Skills Fail to Compose: Compatibility and Retention in Language Models

**Authors:** Yan Lin, Zhongliang Guo, Jingyu Sun, Qiyan Zhao, Ruihong Zeng, Ying Chen, Zhengtao Yao, Yan Wen, Kunyu Peng, Yuxia Wang (arXiv 2611.34398, submitted 2026-11-25, primary cs.CL)

## Overview
Self-evolving agent stacks increasingly build libraries of learned "skills" (soft prompts, adapters, procedural modules) and assume that individually proficient skills can be composed into multi-step behaviors. Lin et al. break this assumption experimentally: **skills that each score ≥90% alone can collapse to single-digit accuracy when composed**, because acquisition never specifies a compositional interface. They formalize two missing evaluation axes — *compatibility* and *retention* — beyond raw skill proficiency.

## Problem Statement
A skill library is only useful if independently learned skills compose in a single forward pass with the right identities and execution order. Existing evaluations measure per-skill proficiency and never ask whether the learned representations interfere when sequenced, or whether repairing one composition destroys the constituent skills.

## Key Contribution
- **Single-call composition collapses**: across four digit-task bases and three record-editing models, mean one-call composition accuracy is at most **7.6%**, versus 88.2–100% when split into two calls with an explicit intermediate output — the bottleneck is internal compatibility, not capability.
- **Same-operation blocks are not interchangeable**: after training next to frozen learned partners, swapping in independently learned blocks of the *same operation* on two Qwen bases drops median composition accuracy from 98.0% and 95.3% to **12.7% and 0.5%** — even though every replacement scores ≥90% alone. Co-training history, not operation semantics, determines compatibility.
- **Repair/retention tension**: repairing a composition can impair the original skill; rehearsal improves retention but transfer stays limited (Qwen2.5-0.5B).
- **Explanations constrained, not identified**: block length and per-token norm cannot explain the interference on two of four digit bases; internal interventions rule out some mechanisms without finding a shared one.
- Open code: https://github.com/YanLin-Quinne/SkillCompatibility

## Technical Approach
The testbed is deliberately minimal: soft-prompt skills attached to *frozen* language models, with skill identity and execution order supplied externally (removing planner errors as a confound). Tasks are synthetic but composable (digit arithmetic chains, record edits), letting the authors isolate one-call vs two-call execution, neutral-insertion training, partner-swap ablations, repair training, and rehearsal regimes.

## Results
Headline numbers: ≤7.6% one-call vs 88.2–100% two-call composition; 98.0/95.3 → 12.7/0.5 median under partner swap; every isolated block ≥90%. Neutral-insertion training helps robustness but leaves substantial interference.

## Relevance to Our Domain
The KB covers agent skill libraries and self-evolving agents extensively (AgentFlow, EvoSkill, SkillCoach, ModHarness-RL). This is the **negative control** those systems need: if your skill library is made of learned parameter blocks, per-skill benchmarks systematically overestimate library utility. Design takeaways: (1) evaluate composition, not just acquisition; (2) prefer skills that communicate through explicit intermediate artifacts (the two-call regime) over implicit in-context sequencing; (3) co-train or co-calibrate partner skills — independently trained same-operation skills are not drop-in replacements; (4) add compatibility/retention/transfer gates to any skill-acceptance pipeline (cf. SkillGuard).

## References
- Paper: https://arxiv.org/abs/2611.34398
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34398
- Code: https://github.com/YanLin-Quinne/SkillCompatibility
- Related in vault: ai-machine-learning/agent-architecture/ (SkillCoach, SkillGuard, AgentFlow, ModHarness-RL)

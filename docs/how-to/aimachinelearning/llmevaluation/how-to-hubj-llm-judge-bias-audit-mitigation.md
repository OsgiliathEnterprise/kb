---
title: 'Auditing the Judge: Human-Derived Bias Discovery, Quantification, and Mitigation
  in LLM Judges'
diataxis: How-to Guide
domain: ai-machine-learning
topic: llm-evaluation
source: arXiv
source_url: https://arxiv.org/abs/2611.33065
date: 2026-11-24
keywords:
- knowledge-base
- llm-evaluation
- ai-machine-learning
- how-to
---
# Auditing the Judge: Human-Derived Bias Discovery, Quantification, and Mitigation in LLM Judges
**Authors:** Hamin Koo, Chanjoo Jung, Fangzhao Wu, Jaehyung Kim
## Overview
LLM-as-a-Judge is now embedded in both evaluation and training pipelines, yet judge verdicts drift under systematic biases that contradict human preferences. HUB-J is an end-to-end framework that treats **human–judge disagreement cases as the raw material for bias auditing**: it discovers interpretable bias factors from disagreements, measures each factor's strength from agreement cases via controlled perturbations, and then removes the estimated bias effect with a lightweight, training-free regression correction.
## Problem Statement
Existing bias-handling for LLM judges relies on pre-discovered bias lists (so novel biases go undetected), ignores how *strong* each bias is for a given model, and needs costly interventions (retraining, careful prompting campaigns). Human preferences themselves are underused as the signal for finding and fixing bias.
## Key Contribution
- **Discovery from disagreements**: automatically surface interpretable bias factors by mining cases where the judge disagrees with human labels — bias taxonomy is derived from the data, not from a fixed list.
- **Quantification from agreements**: estimate each factor's strength by controlled input modifications on agreement cases, measuring how verdicts shift.
- **Training-free regression-based mitigation**: model each bias factor's influence on decisions and correct bias-driven verdicts by subtracting the estimated effect.
- Empirics: uncovers known *and* novel bias factors, exposes meaningful differences in susceptibility across judge models, and consistently reduces bias-driven decision flips while generalizing across models.
## How-to: Audit and Debias an LLM Judge
1. Assemble a human-labeled evaluation set run through your judge; split results into **disagreement cases** and **agreement cases**.
2. **Discover**: mine the disagreement cases for interpretable factors that plausibly explain the flips (style, length, position, authority cues, etc.) — this yields the model-specific bias factor set.
3. **Quantify**: for each factor, apply controlled modifications to inputs on agreement cases (e.g., vary the attribute while keeping content fixed) and record resulting verdict shifts; this turns each factor into a measured strength.
4. **Mitigate**: fit the lightweight regression that maps factor levels to decision influence, then correct new verdicts by removing the estimated bias contribution — no fine-tuning required.
5. **Validate**: track bias-driven decision-flip rates before/after and compare susceptibility profiles across candidate judge models; per the paper, expect consistent flip reduction that transfers across models.
## Results
- Discovers both documented and previously unlisted bias factors.
- Produces per-model bias susceptibility comparisons.
- Consistently reduces bias-driven decision flips, generalizing across judge models.
## Relevance to Our Domain
Judge reliability gates everything built on automated evaluation in this KB (benchmark notes, RLVR reward signals, agent self-evaluation). A discover→quantify→correct loop driven by human disagreement data gives eval teams a concrete, cheap alternative to static bias checklists.
## References
- Paper: https://arxiv.org/abs/2611.33065
- Related: [[reference-llm-judge-scoring-topology]], [[explanation-bidirectional-adversarial-llm-evaluation]], 

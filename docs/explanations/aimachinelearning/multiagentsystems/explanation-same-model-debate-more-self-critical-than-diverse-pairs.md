---
title: Same-Model Debate Was More Self-Critical Than Weakly Diverse Pairs — AdversarialDebate
  Field Results
diataxis: Explanation
domain: ai-machine-learning
topic: multi-agent-systems
source: DEV.to Tech News
source_url: https://dev.to/debashish_ghosal/the-same-model-debating-itself-was-more-self-critical-than-two-different-models-2569
date: 2026-08-30
keywords:
- knowledge-base
- multi-agent-systems
- ai-machine-learning
- explanations
---
# Same-Model Debate Was More Self-Critical Than Weakly Diverse Pairs — AdversarialDebate Field Results

The `AdversarialDebate` project (v0.2.x) tests whether *diversity* between two debating LLMs improves reasoning pressure. The author included a homogeneous control (`GPT + GPT`) expecting it to be the weak baseline — same training distribution, same safety tuning, same blind spots. The full-corpus field test said something stranger:

| Pair | Avg Score | Verdict Rate | Avg Concessions per Debate |
| --- | --- | --- | --- |
| GPT + GPT | 0.688 | 57% | 20.9 |
| GPT + Gemini | 0.357 | 4% | 10.5 |
| Gemini + Mistral | 0.512 | 4% | 15.6 |

The homogeneous control outperformed both heterogeneous pairings — not by a rounding error. The v0.2.1 separating experiment (DeepSeek+GPT at 0.246 convergence vs GPT+GPT at 0.273) reframes the thesis: the distinguishing factor was **Mistral vs no-Mistral**, not "diversity vs homogeneity" in general.

## What this means for multi-agent design

- **Weak diversity can be worse than no diversity.** A heterogeneous pair that shares little productive disagreement (GPT+Gemini here) produced near-zero verdict rates — the models talked past each other instead of pressuring each other's reasoning.
- **Self-critique is a property of the pairing, not of diversity per se.** Same-model debate generated more concessions (20.9 vs 10.5–15.6), i.e., more actual position changes under pressure.
- **Design implication**: when composing multi-agent pipelines, measure *productive disagreement* (concessions, verdict rates) rather than assuming model heterogeneity is automatically beneficial; a homogeneous self-debate loop can be the stronger critic.

This aligns with broader literature on multi-agent debate where diversity-aware initialization and confidence modulation matter more than raw model count — contradictory evidence exists across studies, so per-task measurement remains the safe default.

## Where this sits in the broader debate literature

- **Du et al. 2023 ("society of minds")** — multiple *instances of the same model* debating over rounds improves math/strategic reasoning and factuality vs single-model baselines; even when all agents start wrong, the population often converges to the correct answer. This is the strongest published support for homogeneous self-debate as a critic: diversity across instances (sampling), not across models, is what matters there.
- **Liang et al. 2023 (MAD)** — defines *Degeneration-of-Thought*: once an LLM commits to an answer it can't generate novel thoughts via pure self-reflection; adversarial "tit-for-tat" debate between agents breaks that rigidity. Notably, their judge analysis found LLM judges prefer the side sharing their own backbone model — a same-model bias that cuts both ways for homogeneous setups (the critic shares blind spots *and* language).
- **Zhang et al. 2024 (CMD)** — a strong single agent with good prompts matches multi-agent discussion when demonstrations are present; discussion only wins without demos, and stronger LLMs in the group lift weaker ones round by round. This tempers both camps: model heterogeneity helps mainly as *capability* asymmetry, not as diversity per se.

Read together with AdversarialDebate's field data, the pattern is consistent: what drives productive debate pressure is (a) genuine disagreement potential and (b) capability asymmetry — neither of which "different vendor" guarantees. GPT+Gemini at 4% verdict rate suggests those two models simply didn't disagree productively on this corpus; GPT+GPT's 57% verdict rate shows same-model instances *can* diverge enough to pressure each other (cf. Du et al.'s finding that identical models propose diverse answers).

## Reproducibility

- GitHub: [deghosal-2026/adversarial-debate](https://github.com/deghosal-2026/adversarial-debate)
- PyPI: `adversarial-debate`
- Field test reports per version under `docs/field-test/vX.Y.Z/FIELD_TEST_REPORT_full_corpus.md`, plus a field-test plan and learnings log.

## References

- [The Same Model Debating Itself Was More Self-Critical Than Two Different Models (DEV.to)](https://dev.to/debashish_ghosal/the-same-model-debating-itself-was-more-self-critical-than-two-different-models-2569)
- [adversarial-debate repository](https://github.com/deghosal-2026/adversarial-debate)
- [Diversity of Thought Elicits Stronger Reasoning Capabilities in Multi-Agent Debate Frameworks (paper)](https://huggingface.co/papers/2410.12853)
- [Breaking Mental Set to Improve Reasoning through Diverse Multi-Agent Debate (OpenReview)](https://openreview.net/forum?id=t6QHYUOQL7) — related work on persona-diversity in debate; note it finds the opposite of AdversarialDebate's field results, reinforcing that per-task measurement is required
- [Du et al. 2023: Improving Factuality and Reasoning in Language Models through Multiagent Debate](https://ar5iv.labs.arxiv.org/html/2305.14325) — same-model instance debate ("society of minds")
- [Liang et al. 2023: Encouraging Divergent Thinking in LLMs through Multi-Agent Debate (MAD)](https://aclanthology.org/2024.emnlp-main.992.pdf) — Degeneration-of-Thought; judge same-model bias
- [Zhang et al. 2024: Rethinking the Bounds of LLM Reasoning (CMD group discussion)](https://aclanthology.org/2024.acl-long.331.pdf) — strong single agent ≈ multi-agent discussion with demos

## Related
- [[How-to-Run-a-Phantom-Deployment-of-a-New-AI-System]]
- [[How-to-Assess-Use-Case-Specific-Bias-Risk-Before-Deploying-an-LLM]]

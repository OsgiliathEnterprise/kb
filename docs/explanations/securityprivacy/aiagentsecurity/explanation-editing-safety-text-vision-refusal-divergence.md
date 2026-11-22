---
title: 'Text-Aware, Vision-Blind: How Multimodal Image Editing Systems Handle Unsafe
  Inputs'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.26569
date: 2026-11-22
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Text-Aware, Vision-Blind: How Multimodal Image Editing Systems Handle Unsafe Inputs

## Core Insight
Deployed multimodal **image-editing** systems gate safety mostly on the **text prompt** and are largely **blind to risk carried by the uploaded image itself** (Ziqing Yang, Yixin Wu, Michael Backes, Yang Zhang — CISPA / HKUST-GZ / HKUST; arXiv 2611.26569, submitted 19 Nov 2026, cs.CR). The study is a **system-level audit of four deployed editing systems — Gemini, GPT, Qwen API, Qwen Local** — not a fine-tuning study: no LoRA, no retraining experiments are involved.

## EditSafetyBench (the instrument)
| Dimension | Value |
|-----------|-------|
| Units | **5,940 image–instruction pairs** (derived from 660 source images) |
| Balance | safe **and** unsafe images, paired with safe/unsafe-intent instructions |
| Risk taxonomy | **11 risk categories** |
| Edit intents | **3 edit intents** |
| What it measures | system-level *safety awareness* of deployed instruction-guided editing APIs |

Two key rates: **UIR** = refusal rate of unsafe-intent *text* prompts (image safe); **UNR** = refusal rate of unsafe *images* under neutral instructions.

## Key Findings (verified against paper)
1. **Systematic text–vision safety mismatch.** Gemini and GPT refuse **87.1% / 81.6%** of unsafe-intent editing prompts, but only **24.2% / 22.4%** of cases combining an unsafe image with a neutral instruction — the image modality is where guardrails collapse.
2. **Cross-system inconsistency.** Most risk categories are judged inconsistently across systems; e.g. GPT allows **70.4%** of unsafe political-content edits while Gemini allows **34.8%**.
3. **Sexual content is the exception**: it shows the strongest visual sensitivity (largest safe-vs-unsafe refusal gap, ~40.7% Gemini / ~45.6% GPT), plausibly because mature NSFW classifiers are already deployed upstream.
4. **The system-prompt layer alone is insufficient**: the paper contrasts Qwen API (wrapper with prompt-level guardrails) vs Qwen Local (raw weights) to show wrapper-level defenses do not close the vision-blindness gap.

## Why It Matters (interpretation)
- Safety stacks built as *text filters + generic NSFW classifiers* leave a structural hole: risk that is **only visible in the image** (or in the image×instruction combination) passes through.
- Practical rule for anyone shipping image-editing features: evaluate guardrails on the **UNR direction** (unsafe input, benign-sounding instruction) — text-side UIR numbers are misleadingly high.
- Category-level policy divergence across vendors (politics: 70.4% vs 34.8% allow rates) means "which API do we call" is itself a safety decision.

## Limitations / Scope
- Systems probed as black boxes via APIs; internal guardrail architecture not inspected.
- Benchmarked categories/intents are fixed; novel risk categories could shift the pattern.

## Related
- [[reference-dailysafe-dynamic-safety-agent-benchmark]] — the other axis: mid-task safety drift in agent loops.

## References
- Paper: https://arxiv.org/abs/2611.26569 (v1, 19 Nov 2026)
- DOI: https://doi.org/10.48550/arXiv.2611.26569

> Audit note: this note was **fully rewritten on 2026-11-22** after a source audit found the previous version fabricated a fine-tuning framing (Qwen3-VL-4B/8B, LoRA, "Jin et al.") that does not exist in the paper. All numbers above were verified against the arXiv abs page and HTML v1.

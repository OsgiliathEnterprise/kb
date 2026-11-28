---
title: 'Know the Design, Pick the Attack: Sentence-Keyed Watermarks for LLMs'
diataxis: Explanation
domain: security-privacy
topic: model-provenance
source: arXiv
source_url: https://arxiv.org/abs/2611.34505
date: 2026-11-25
keywords:
- knowledge-base
- model-provenance
- security-privacy
- explanations
---
# Know the Design, Pick the Attack: Sentence-Keyed Watermarks for LLMs

*Jon Carmona, Jon Irureta, Jon Imaz, Aizea Lojo (IKERLAN Technology Research Centre, BRTA), Juan Martínez-Romo, Lourdes Araujo (UNED Madrid). arXiv:2611.34505, cs.CL/cs.CR, submitted 2026-11-25; 10 pages, 1 figure, 8 tables; submitted to IEEE. Code promised upon acceptance.*

## Overview
This paper studies a *design-aware* attacker against LLM text watermarks: one that reads the published watermark design and picks the optimal attack per scheme — paraphrasing to erase watermarks that are hard to imitate, or learning and forging the ones that survive rewording. Against this adaptive attacker, every existing watermark compared fails. The authors then propose **KeyedLex**, a sentence-keyed watermark whose secret key is derived from the grammar of the previous sentence, which resists both attack routes. (Reference-type note: serves as a threat-model and comparison table for LLM watermark design choices.)

## Problem Statement
Watermarking provider text underpins academic integrity, anti-misinformation efforts and the **EU AI Act** (Reg. 2024/1689, Art. 50(2)) provenance obligations; it also keeps synthetic text out of training corpora (model collapse). Post-hoc classifiers fail under paraphrase, so watermarks establish provenance at the source. Providers now publish their designs — Google (SynthID, Nature 2024), Anthropic ("How Claude's text watermark works", Aug 2026), OpenAI (textGrain tech report, Oct 2026) — and even undisclosed schemes can be identified from a few queries (Gloaguen et al., ICLR 2025). This is **Kerckhoffs's principle**: security must hold when everything but the key is public. Consequence never drawn before: an attacker who knows the design knows *which axis to attack* — a watermark can look secure only against the attack nobody would use on it.

Two failure axes, studied in isolation until now:
1. **Erasure** — reword the text (DIPPER paraphraser, adaptive preference-tuned paraphrasers, RLCracker RL attacks, character-level edits) until the mark disappears.
2. **Forgery** — learn the green lists from watermarked text (Sadasivan et al.; Jovanović et al.'s "watermark stealing", ICML 2024) and stamp the mark onto text the model never wrote; forgery is the more damaging axis because it manufactures false evidence against a provider.

## Key Contribution
- **Adaptive design-aware threat model**: attacker knows the design but not the key, has watermarked text, in-domain text, and its own LM, but no detector access; it *routes* each watermark to its weaker axis, and watermarks are scored by that **weaker axis** (never averaged, never per-axis).
- **Negative result**: every compared scheme — Unigram, KGW-1, KGW-4, SynthID, DiPmark, SIR, SemStamp, k-SemStamp — fails on at least one axis under the routed attacker.
- **KeyedLex**: green-list watermark keyed to the *grammatical profile of the previous sentence*; detector tries every list instead of recomputing the key.
- **Design recipe** (each choice defeats one attack): read sentence-by-sentence → stops token counting/forgery; try-all-lists detector → survives key-changing edits; grammar key → survives "averaging over keys" rewording attacks; publish everything except the lists.

## Technical Approach (KeyedLex mechanics)
- **Grammatical profile**: a POS tagger labels each word; keep the 13 grammar-carrying Universal Dependencies classes (drop punctuation, symbols, unknowns, interjections); the profile is the vector of class shares. Synonym substitution preserves word classes, so the profile is paraphrase-stable.
- **Cells**: sentences of a public sample text are clustered by standardized profile (per-class z-scores) with k-means into k *cells* (paper uses k=4; k=2 is forgeable 56% of the time by random push, k∈&#123;4,8,16&#125; keeps forgery ≈25%). Cell assignment is public; only the lists are secret.
- **Lists and generation**: each cell j owns a green list G_j = pseudorandom γ-fraction of the vocabulary drawn from the secret seed. While writing sentence sᵢ, add bias δ to logits of tokens in G_j with j = cell(sᵢ₋₁); the first sentence is unbiased.
- **Detection**: per sentence and list, score λᵢⱼ = gᵢⱼ·log(p₁/γ) + (nᵢ−gᵢⱼ)·log((1−p₁)/(1−γ)); aggregate per sentence with a temperature-weighted logsumexp over all k lists (weights favor the list the previous sentence's grammar points to, so edits that change the hint don't erase the mark); drop the lowest-scoring fraction ρ of sentences; threshold calibrated on unwatermarked text (drop-rate doesn't inflate FPR).
- **Cost**: sentence-level tagging slows generation only 7% (OPT-1.3B) vs 24% for SynthID and ~3× for SIR; detection of a 200-token text takes 18 ms.

## Results (Table III, OPT-1.3B / Mistral-7B; lower weaker-axis is better)
| Watermark | Key read from | Weaker axis |
|---|---|---|
| SynthID, DiPmark, KGW-4 | previous tokens | 0.66–0.93 **erasure** (hard to forge) |
| Unigram, KGW-1, SIR | fixed list / prev token / prefix meaning | 0.87–1.00 **forgery** (paraphrase-robust) |
| SemStamp, k-SemStamp | sentence meaning | ≥0.97 forgery; punctuation removal erases |
| **KeyedLex** | prev-sentence grammar | **0.53 / 0.60 erasure** — strongest weaker axis on both generators |

- Undetected-attack baseline: KeyedLex detected on 87.5% of its own text at 1% FPR; ΔPPL 4.09 vs unwatermarked — no quality penalty over the best-known watermarks (KGW-4 4.93, KGW-1 4.80; SynthID 15.12).
- Forgery of KeyedLex ≈ 0.33 (OPT) / 0.56 (Mistral); even an attacker *handed the true lists* passes only ~half the time; knowing the grouping barely helps (0.21–0.33 across variants).
- Ablations: word-hash key instead of grammar survives untouched text but keeps only 0.53 vs 0.84 signal under synonym substitution; against key-averaging, grammar keeps 0.59 of texts detected vs 0.27 for word keys.
- Scope limits: SynthID as released (Anthropic/OpenAI deployments not public), English only, two generators. Next steps: punctuation-free sentence segmentation, multilingual.

## Relevance to Our Domain
Provenance and content authenticity are KB themes: as EU AI Act-style disclosure obligations make watermarking operational, teams choosing provider watermarks need to know which designs withstand a read-the-manual adversary — per this paper, the currently deployed token-window family (SynthID-style) resists forgery but loses two-thirds of its signal to paraphrase. KeyedLex's sentence-grammar keying, try-all-lists detection, and weaker-axis evaluation protocol are concrete design/audit patterns; the taxonomy table doubles as a selection checklist.

## References
- Paper: https://arxiv.org/abs/2611.34505 (v1 full text, 2026-11-25)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34505
- Watermark stealing: Jovanović, Staab & Vechev, ICML 2024 — https://arxiv.org/abs/2402.19361
- Related in KB: `explanation-tokenprov-verifiable-token-billing.md` (provenance), `explanation-distortion-free-semantic-watermarks-black-box.md` (same topic), `explanation-autonomous-parameter-surgery-llm-backdoors.md` (same topic)

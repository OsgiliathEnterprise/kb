---
title: 'Reading Fine-Tuning Diffs Through Lenses: Model Diffing for Backdoor Detection'
diataxis: Explanation
domain: security-privacy
topic: model-provenance
source: arXiv
source_url: https://arxiv.org/abs/2611.34758
date: 2026-11-25
keywords:
- knowledge-base
- model-provenance
- security-privacy
- explanations
---
# Reading Fine-Tuning Diffs Through Lenses: Model Diffing for Backdoor Detection

## Overview
This paper puts weight-based, activation-based, and output-based model-diffing methods for backdoor detection on a common footing: a unified scoring system built on token readouts. It then strengthens the weight and activation families by routing their signals through interpretability "lenses" — the J-lens and its refinement, the J++-lens — and shows empirically that no single detection family survives every concealment trick.

## Problem Statement
Fine-tuning is the main supply-chain attack surface for open-weight models: a third party can deliver a fine-tuned checkpoint that hides a backdoor. Detection methods exist in three separate families (weight diffing, activation diffing, output probing), but they have been evaluated with incomparable metrics, making it impossible to know which family to trust — or whether any single one suffices.

## Key Contribution
- **Common scoring system**: a token-readout-based evaluation protocol that scores weight-, activation-, and output-based diffing methods on the same scale, by checking whether a token naming the backdoor ranks high in the method's readout.
- **Lens-augmented diffing**: existing weight/activation methods improved by decoding through the J-lens and J++-lens. The J++-lens improves the weight-based method in *all* tested settings; the J-lens improves within-layer ranking.
- **Strongest single method**: ΔW-J++ — the weight difference between backdoored and base models decoded through the J++-lens of the base model — ranks a token naming the backdoor in its **top-10 tokens in 11 of 12 settings**.
- **No universal detector**: output/activation methods (ADL, Diff Mining) break when fine-tuning penalizes backdoor-token probability on clean inputs; weight methods survive that. Conversely, hiding tricks that permute hidden units or train only residual-stream-reading layers defeat weight methods but not ADL/Diff Mining. Detection must be layered.

## Technical Approach
Compare a suspect fine-tuned model against its base model. Each diffing family produces candidate tokens; the unified protocol scores them by the rank of the backdoor-naming token in the readout. Lens decoding (J-lens / J++-lens) maps weight or activation vectors to vocab-space tokens via the base model's lens, sharpening the signal. Two adversarial concealment regimes are stress-tested: (1) penalizing backdoor-word probability on clean inputs during fine-tuning (attacks output/activation methods); (2) permuting hidden units or restricting training to residual-stream reader layers (attacks weight methods).

## Results
- ΔW-J++: top-10 backdoor token rank in 11/12 experimental settings — best single method.
- J++-lens improves the weight-based method in all settings.
- Demonstrated mutual failure modes: no single family resists both concealment attacks.
- Code and data: https://github.com/maxipetro/lens-diffing-backdoors (31 pages, 16 figures, 14 tables).

## Relevance to Our Domain
Model provenance and fine-tuning supply-chain integrity are KB topics (we already cover autonomous backdoor implantation). This gives defenders a concrete, comparable evaluation harness and a practical recipe — combine ΔW-J++ weight diffing with activation/output probes (ADL, Diff Mining) because concealment tricks are family-specific.

## References
- Paper: https://arxiv.org/abs/2611.34758
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.34758
- Code: https://github.com/maxipetro/lens-diffing-backdoors
- Related in KB: `explanation-autonomous-parameter-surgery-llm-backdoors.md` (same topic)

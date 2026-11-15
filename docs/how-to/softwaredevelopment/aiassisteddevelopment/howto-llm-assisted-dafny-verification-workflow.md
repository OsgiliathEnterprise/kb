---
title: LLM-Assisted Formal Verification in Dafny — A Ten-Step Workflow for Scientific
  Algorithms
diataxis: How-to Guide
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.16886
date: 2026-11-15
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- how-to
---
# LLM-Assisted Formal Verification in Dafny — A Ten-Step Workflow for Scientific Algorithms

## Overview

This paper turns formal verification of complex algorithms from a bespoke expert craft into a repeatable, LLM-assisted engineering process. Using Dafny as the verification system and Claude-class frontier models as the proof-engineering assistant, the authors define a structured ten-step workflow — and validate it on 37 non-trivial algorithms from graph theory and labelled transition systems, including the famously tricky Hopcroft-Tarjan triconnectivity test, with most machine-checked verifications completed in hours to a few days of interactive development.

## When to Use This

Use this workflow when you need **machine-checked** correctness for an algorithm (not just tests), you have access to a strong coding LLM, and you can supply human oversight for correctness-critical decisions. It is designed for the gap between "LLM can spit out a proof fragment" and "the whole specification-invariant-proof stack actually compiles and verifies."

## Procedure

1. **Algorithm formalization.** State the algorithm precisely enough to encode: inputs, outputs, data structures, and the mathematical claim to be proven. Let the LLM draft the Dafny skeleton; a human reviews the formalization *before* any proof work — a wrong spec verified is worse than nothing verified.
2. **Contract development.** Write pre-/post-conditions and loop-frame annotations for each procedure; iterate with the LLM until contracts compile and match intent.
3. **Empirical invariant validation.** Before asking the prover to believe an invariant, test it empirically: generate random/edge-case inputs and check the invariant holds at runtime. Cheap falsification beats expensive solver timeouts.
4. **Proof construction.** Have the LLM build proofs layer by layer — lemmas first, then tactics/assertions inside Dafny — keeping each increment verifier-checked.
5. **Diagnose solver failures.** When verification stalls, classify the failure (missing invariant, too-strong post-condition, quantifier trigger issues, frame explosion) rather than randomly adding `{:axiom}` escapes; the LLM proposes fixes, the human approves which class to pursue.
6. **Bottleneck profiling.** Measure which verification conditions consume time/memory; profile-guided effort allocation instead of brute-force waiting.
7. **Resource-driven proof optimization.** Apply targeted optimizations (fuel/bv-int manipulation, lemma decomposition, batching) driven by the profile from step 6.
8. **Automated-test feedback loop.** Keep a test corpus running alongside the verifier so semantic regressions surface even when syntactic checks pass.
9. **Human checkpoints on correctness-critical decisions.** Humans — not the LLM — sign off on specs, any use of assumptions, and any invariant that empirical testing could not cover.
10. **Verification-performance regression guard.** Re-run the whole verified corpus after each change so optimizations never silently break earlier proofs.

## Expected Outcome

On the paper's 37-algorithm corpus, complete machine-checked verifications were obtained within hours to a few days per algorithm, including Hopcroft-Tarjan triconnectivity. The human's role shifts from constructing proofs to **supervision, specification review, and strategic guidance**.

## Caveats

- Empirical invariant validation (step 3) reduces but does not eliminate over-strong/under-strong invariant risk; step 9 remains load-bearing.
- Results are for algorithms in two mathematical domains; extrapolate to concurrent/distributed code with care.

## References

- Paper: https://arxiv.org/abs/2611.16886
- Tool: Dafny — https://dafny.org
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.16886

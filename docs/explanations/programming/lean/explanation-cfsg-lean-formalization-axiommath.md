---
title: 'The Classification of Finite Simple Groups Formalized in Lean: 43.1M Lines,
  715 Papers, and a Bug in Published Math'
diataxis: Explanation
domain: programming
topic: lean
source: HackerNews
source_url: https://cfsg.axiommath.ai/
date: 2026-10-28
keywords:
- knowledge-base
- lean
- programming
- explanations
---
# The Classification of Finite Simple Groups Formalized in Lean: 43.1M Lines, 715 Papers, and a Bug in Published Math

Axiom Math's project page presents what is currently the largest machine-checked body of mathematics: a **complete formalization of the Classification of Finite Simple Groups (CFSG)** in Lean, following the first-generation proof with **every logical step checked by Lean's kernel**. The numbers on the project page:

| Metric | Value |
|---|---|
| Lines of Lean | **43.1M** |
| Declarations | **2.05M** |
| Milestones | **100** (108 shown on the live map) |
| Papers and books in the corpus | **715** (cited works spanning 1870–2026) |

## What CFSG says

Every finite simple group is one of: **cyclic of prime order, alternating, of Lie type, or one of the 26 sporadic groups**. The first-generation proof spans thousands of journal pages, was written by about a hundred mathematicians over several decades, and famously has no single self-contained text — which is exactly the property that makes formalization hard and valuable.

## How the formalization was built

- The corpus view on the project page is an interactive map: **each node is a paper or book, sized by the statements it supplies**; hovering finds the statements a cited work provides. "Closing every gap across the whole body of work" is the core engineering problem — published proofs cite results informally, and the formalization must make each such step explicit.
- According to Axiom's account of the project, the Lean proof was produced by a **swarm of AI agents working over 24 days** from an initial "Agent Blueprint" — some agents searched for existing results, others concentrated on writing Lean proofs. That is a notable data point for agent-driven formal verification at a scale no human team could have produced in that time.
- The proof is browsable as a **live interactive proof map** (milestones, verification status, replay), and the code lives at `github.com/AxiomMath/CFSG`.

## The result that mattered: a counterexample in published mathematics

While formalizing the first-generation proof, the team found **counterexamples to a closure assertion used in a published route to the Unbalanced Group Theorem** — an intermediate step in the CFSG literature. The accompanying paper, **"The Unbalanced Group Theorem"** (Hexagon 2610.00575, 35 pages), explains the obstruction and gives an **alternative argument for the simple-group case** built on **Solomon's 1976 theory of maximal 2-components**, whose key step (Theorem 2.3) is the **preservation of simple tops**. Axiom is compiling the errata found in the literature with group theorists for publication.

This is the recurring punchline of large-scale formalization: the machine-checked proof is only as good as its weakest *informal* input, so the process doubles as an automated audit of the literature — and here the audit found a real, published error that a human-only formalization pass apparently had not surfaced.

## Why this matters beyond mathematics

1. **Scale as a test of the toolchain**: 43.1M lines / 2.05M declarations is several orders of magnitude past the "toy theorem" stage — it exercises proof-assistant performance, dependency management, and incremental verification at a level that is itself an engineering achievement.
2. **Agents as a production pipeline, not a demo**: the 24-day agent swarm (with the blueprint/verification loop visible on the live map) is one of the largest public examples yet of LLM agents doing long-horizon, verifiable work — verification is what makes the output trustworthy at all.
3. **The "verified" claim is precise**: every *logical step* is kernel-checked, which is a stronger claim than "the code compiles" or "tests pass" — but it is bounded by the *axioms and informal lemmas accepted as inputs*, which is why finding the literature error matters.

## Citation

The project page offers a BibTeX block (`@misc{axiom-cfsg}`, Axiom Math, 2026) for the formalization itself.

## Diagram



## Status check (2026-10-29)

- **34 notable deviations.** Axiom's own project page now states the formalization found **34 notable deviations** from the published record (the Unbalanced Group Theorem step is the most significant), part of a total of 2,000+ errors or omissions found across the literature. The errata list is being prepared with group theorists and is expected to be published on the project page — the note's "the bug is in the proof, not the theorem" framing is confirmed by the secondary analyses.
- **The theorem stands; the proof was flawed.** John Cook's detailed analysis (2026-10-28) concludes that the UGT — and the CFSG that depends on it — remains **correct**, but the 1986 proof step was wrong: the claimed nonexistence result was true, but for different reasons than the proof established.
- **New result as a side effect.** The formalization work also produced a shorter derivation, within the first-generation method, that reaches the same conclusion without Theorem 2.3 (recorded as **Remark 9.5**) — an original mathematical result produced by the agent swarm itself.

## References

- [CFSG in Lean — Axiom Math project page (interactive proof map, corpus, citation)](https://cfsg.axiommath.ai/)
- [Axiom Math blog: Formalizing the Enormous Theorem (agent-swarm story)](https://axiommath.ai/research/the-enormous-theorem-formalized/)
- [The Unbalanced Group Theorem — paper (Hexagon 2610.00575)](https://hexagonmath.org/2610.00575)
- [CFSG Lean source code — GitHub](https://github.com/AxiomMath/CFSG)
- [OfficeChai: Axiom formally verifies the "enormous theorem" (43.1M lines, 24-day agent swarm)](https://officechai.com/ai/axiom-enormous-theorem/)
- [Xenospectrum: AI formalizes CFSG in 24 days, exposing a flaw in an intermediate step](https://xenospectrum.com/en/axiom-cfsg-formal-proof/)
- [CFSG in Lean — Axiom Math research page (34 notable deviations, Remark 9.5)](https://axiommath.ai/research/cfsg-in-lean)
- [John Cook: the Unbalanced Group Theorem error, analyzed (2026-10-28)](https://www.johndcook.com/blog/2026-10-28/ugf-error-axiom/)

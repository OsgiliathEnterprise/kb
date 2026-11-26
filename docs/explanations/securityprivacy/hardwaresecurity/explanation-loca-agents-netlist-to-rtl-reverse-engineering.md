---
title: Verified Netlist-to-RTL Recovery with LLM Agents (LOCA)
diataxis: Explanation
domain: security-privacy
topic: hardware-security
source: arXiv
source_url: https://arxiv.org/abs/2611.25324
date: 2026-11-19
keywords:
- knowledge-base
- hardware-security
- security-privacy
- explanations
---
# Verified Netlist-to-RTL Recovery with LLM Agents (LOCA)

## What The Paper Is
A **new attack methodology** — LOCA (LOgic Cone Attack) — for gate-level netlist → RTL reverse engineering, with formal verification of every recovered design (Ahmet Efe, Recep Bugra Uludag, Ulya R. Karpuzcu, University of Minnesota; arXiv 2611.25324, submitted 19 Nov 2026, cs.CR/cs.AR, 7 pages). Threat model: gate-level netlists circulate among IP integrators and foundries and can be extracted from chips; recovering readable RTL lets an adversary understand and modify the design.

## Method (how LOCA works)
1. **Anonymize** the netlist, then **partition it into logic cones** — each cone contains the *complete next-state logic* of a group of related registers, giving each agent a small, meaningful subtask. Of **five partitioning methods tested, only grouped cones** lead to recovery.
2. **Parallel LLM agents rewrite each cone**; results are assembled into compact RTL.
3. **Verification gate**: only RTL *proven equivalent* to the netlist is kept; quality is measured by **compression** (Boolean-operator reduction, "RR"). The paper cross-checks 152 recovered "lifts" with SymbiYosys k-induction/IC3/Z3 (**147/152 confirmed**).

## Headline Results (verified)
| Metric | Whole-netlist prompting | LOCA |
|---|---|---|
| Model–design pairs recovered (of 21) | **6** | **17** |
| Per-run recovery rate | **~5%** (7/152 replies) | **~74%** (88/119 runs, ~16×) |
| Cost | — | **median &lt; $1 per design** with a low-cost model |

Whole-netlist success depends heavily on model and design size/structure (e.g. Haiku fails on ≥24-flip-flop designs); LOCA makes small models competitive by shrinking each task.

## Benchmark (actual provenance)
ITC'99 controllers, IWLS IP cores (sasc, simple_spi, spi, systemcdes), generated circuits (updown, fifo16x8, uartrx16, macpipe8), functional mutants, plus 5 fresh designs (three previously unused public cores — ss_pcm, sockit_owm, usb_phy — and an unpublished request policer). *(No TrustHub/OpenCores set, contrary to the earlier version of this note.)*

## Defense Takeaways
- **Function-preserving obfuscation does NOT stop LOCA** on the tested designs (Haiku + LOCA lifts 35/39 obfuscated runs) — it preserves logic cones.
- **Unknown keys or hidden cell functions DO prevent proof of recovery**: XOR/XNOR locking leaves GPT often guessing keys, but equivalence cannot be confirmed without a working chip; hidden cells break cone semantics outright.
- Comparison vs prior whole-netlist prompts (Gate-Breaker): 43/46 proven replies remove &lt; half of Boolean operators — prior "LLMs alone can do netlist→RTL" results shrink under verification.

## Why It Matters (interpretation)
For IP protection planning, the actionable line is: obfuscation that preserves functional structure is no longer sufficient against agentic LLM pipelines at ~$1/design; protection budget should shift toward **key secrecy and hidden-cell opacity**, the only mechanisms the paper shows to block *proven* recovery.

## Related
- KB hardware-security topic; [[reference-dailysafe-dynamic-safety-agent-benchmark]] for the agent-safety evaluation angle.

## References
- Paper: https://arxiv.org/abs/2611.25324 (v1, 19 Nov 2026)
- DOI: https://doi.org/10.48550/arXiv.2611.25324

> Audit note: **fully rewritten 2026-11-22** after a source audit found the previous version fabricated a "reproducibility study" framing, a wrong author roster ("Kriegl et al.") and a wrong benchmark provenance ("TrustHub/OpenCores"). All claims above verified against arXiv abs + HTML v1.

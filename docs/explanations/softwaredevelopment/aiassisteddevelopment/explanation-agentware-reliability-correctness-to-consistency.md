---
title: 'From Correctness to Consistency: Redefining Reliability for the Agentware
  Era'
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.27829
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# From Correctness to Consistency: Redefining Reliability for the Agentware Era

**Authors:** Xue Qin, Maurício Gruppi


## Overview
This position paper argues that LLM-powered agents have become a new class of software artifact — "agentware" — whose failure modes break the assumptions of classical dependability engineering. The authors propose Dynamic Logical Architectures (DLA), an architectural paradigm in which the components of an agent system are themselves LLMs, and reliability is reframed as *consistency* across runs rather than binary *correctness* of a single run.

## Problem Statement
Traditional reliability theory rests on deterministic, static components: a module either behaves to spec or it does not, and failures are rare, discrete events. Agentic systems invalidate every one of these premises — they are probabilistic, self-modifying at runtime, and degrade gradually through behavioral drift. Yet the field's dominant reliability vocabulary is still Fault Tree Analysis (FTA), a legacy of aerospace and nuclear engineering from the 1960s.

## Key Contribution
- Names the artifact class ("agentware") and diagnoses the category error of applying static-component reliability theory to it.
- Introduces **Dynamic Logical Architectures (DLA)**: LLM-as-component systems where the internal reasoning state is an unobservable, dynamic failure surface.
- Reframes reliability engineering goals: from failure *probability* to behavioral *dispersion*, from binary correctness to *consistency*, from static FTA to dynamic, telemetry-driven failure models.
- Formalizes "silent" degradation: agentware stays nominally online while its decision surfaces quietly drift — invisible to conventional monitoring.

## Technical Approach
The paper works through the tension via case studies and architectural analysis: it dissects agentic failure modes (gradual drift, unobservable reasoning-state faults, runtime self-modification), contrasts them against the assumptions baked into FTA, and sketches the DLA alternative in which failure modeling consumes continuous behavioral telemetry rather than static component diagrams.

## Results
Conceptual deliverable rather than empirical benchmarks. The main outputs are the taxonomy of agentware failure modes, the consistency-vs-correctness reframing, and the DLA architectural framing as a research agenda.

## Relevance to Our Domain
Directly applicable to our agent infrastructure work: our own harnesses, telemetry, and evaluation pipelines should measure run-to-run behavioral dispersion (e.g. action distributions, tool-call traces) rather than pass/fail gates alone. Complements existing notes on harness engineering, behavioral telemetry fault detection, and agent recovery.

## References
- Paper: https://arxiv.org/abs/2611.27829 (cs.SE, 2026-11-26)
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27829
- Related: explanation-behavioral-telemetry-agent-fault-detection.md, explanation-harness-design-coding-agents.md

---
title: 'Tether: Verified Stateful Policy Engine for System-Level Monitoring of Agents'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.25599
date: 2026-11-21
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Tether: Verified Stateful Policy Engine for System-Level Monitoring of Agents

## Overview
Tether is a runtime enforcement framework that guards autonomous AI agents executing arbitrary shell commands by observing the *side-effects* their actions actually produce, rather than trusting what the agent claims it will do. Policies are written in a Lean 4 embedded DSL and can be formally verified against global security invariants — a first-class answer to the "LLM judge can be fooled" problem in agent supervision.

## Problem Statement
Long-running agents run untrusted code on user machines. Two families of existing defenses fall short:
- **LLM-based monitors** reason about actions in natural language but offer no provable safety guarantees and can be manipulated.
- **Stateless policy layers** (permission checks per action) miss *multi-step data flows* and *hidden execution side-effects* — e.g., a network call buried inside a Python script the policy language never modeled.

## Key Contribution
- **Sandbox-observe-enforce loop**: every proposed action first runs in an ephemeral isolated sandbox; abstract action semantics are *inferred from observed system calls*, and the real action proceeds only if the inferred semantics satisfy the policy.
- **Stateful policies over inferred semantics**: a single rule can enforce fine-grained information flow control (IFC) across executions of arbitrary length, because labels propagate from sources to destinations as actions unfold.
- **Lean 4 embedded DSL** for both policies and action semantics; policies are formally verified to satisfy global security invariants such as "no network access after reading a sensitive file".
- **Results**: on realistic coding-agent benchmarks (benign + adversarial trajectories), *one shared policy across all tasks* blocks 100% of in-scope attacks with benign false-positive rate under 5%.

## Technical Approach
The pipeline is: propose action → execute in throwaway sandbox → syscall trace → abstract semantics (network, filesystem, process, privilege effects) → evaluate stateful policy automaton over those semantics → allow/deny. Expressing the policy language inside Lean 4 means the same proof assistant that models the semantics also checks policy theorems, closing the gap between "what the policy says" and "what the system guarantees".

## Results
- 100% of in-scope adversarial attacks blocked with a single, task-agnostic policy.
- &lt;5% false positives on benign coding-agent trajectories.

## Relevance to Our Domain
Complements the KB's agent-governance line (AZOWL, PolicySniff, Pandora's Toolbox undecidability result): where guardrail-only approaches are provably imperfect, Tether shows syscall-level observation + formal verification gives *checked* guarantees for shell-capable agents. A concrete architecture pattern for agent runtimes: never trust the declared action; observe it.

## References
- Paper: https://arxiv.org/abs/2611.25599
- Related: [[explanation-toolpulse-side-channel-tool-using-llm-agents]] (local execution is also the attack surface ToolPulse exploits)

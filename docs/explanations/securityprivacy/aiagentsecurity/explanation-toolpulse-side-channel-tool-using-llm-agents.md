---
title: 'ToolPulse: Side-Channel Eavesdropping on Tool-Using LLM Agents'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.25470
date: 2026-11-20
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# ToolPulse: Side-Channel Eavesdropping on Tool-Using LLM Agents

## Overview
ToolPulse shows that the *agentic* deployment pattern creates a side-channel surface that classical cache attacks on local LLMs could not reach. The model inference is remote (vendor-controlled), so the attacker need not share any model-related hardware — they only need to co-exist with the agent's **local tool executions**, which run on the victim's machine and commonly link against **shared system libraries**. Monitoring those libraries' cache lines reveals which tools the agent is invoking, in what order.

## Problem Statement
Prior cache-based side-channel attacks on deployed LLMs assume the adversary shares model components or hardware with the victim's inference process — unrealistic for the dominant setting of commercial hosted LLMs. The open question: does agentic execution leak information when only inference is remote and tools run locally?

## Key Contribution
- Systematic evaluation of **Flush+Reload** vs **Prime+Probe** for monitoring agentic tool invocations across three hardware platforms: Flush+Reload gives accurate real-time tool monitoring; Prime+Probe supports cross-VM reach but suffers prohibitive overhead and cache-set aliasing.
- **Tool Recovery Attack:** reconstructs an agent's tool-execution workflow. Evaluated on **11 LLMs** across **Codex and Claude Code**; consistently reconstructs workflows with **lowest F1 > 93%**.
- Two demonstrated downstream attacks on recovered traces:
  - **Task Profiling Attack** — infers user intent across two Terminal-Bench task categories.
  - **Trigger Localization Attack** — pinpoints sensitive tool calls (encryption/decryption, model training/inference workloads).
- Robustness: both attacks keep high accuracy under substantial system noise on a server shared by ~20 users.

## Technical Approach
The attacker monitors cache residency of functions in shared system libraries that agent tools (shells, file utilities, crypto, runtimes) commonly load. Flush+Reload probes give a fine-grained, low-overhead signal of recent execution of specific functions, from which tool identity and call ordering are inferred; sequence reconstruction maps raw signals back to the agent's workflow. Prime+Probe was evaluated as the cross-VM-capable alternative but its monitoring cost and aliasing make it impractical for this use.

## Results
- Tool workflow reconstruction: F1 ≥ 93% across all 11 tested LLMs, on both Codex and Claude Code.
- Task profiling and trigger localisation retain high accuracy under ~20-user server noise.

## Relevance to Our Domain
Complements the KB's GPU-side channel notes (`explanation-policysniff-shared-gpu-policy-side-channel`) with a **CPU/library-level** channel that targets exactly the tool-execution half of agentic stacks — the half hosted-inference threat models ignore. Implications: sandbox or namespace agent tools, minimise shared-library footprint per tool, and treat tool-call *patterns* as confidential data. Any "the model is remote so nothing leaks locally" assumption in agent deployment docs is now falsified.

## References
- Paper: https://arxiv.org/abs/2611.25470
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25470

## Further Reading (added 2026-11-20 by KB Zookeeper audit)
- **Spill The Beans: Exploiting CPU Cache Side-Channels to Leak Tokens from LLMs, arXiv:2505.00817:** https://arxiv.org/abs/2505.00817 — same Flush+Reload family, one layer earlier in the stack: monitors the embedding layer of a co-located LLM process (via KSM-deduplicated shared pages) to leak generated *tokens*. Shows the inference half of the stack is already covered by prior work, which is why ToolPulse's tool-execution focus is the novel piece.
- **I Know What You Said: Unveiling Hardware Cache Side-Channels in Local LLM Inference (USENIX Security 2025):** https://www.usenix.org/system/files/sec25_slides_gao-zibo.pdf — documents the noise problem ToolPulse had to solve: standard Flush+Reload on local LLMs yields ~100 valid tokens/s against ~5×10⁶ noise events/s, with the hardware adjacent-cache-line prefetcher as root cause; a reminder that attack feasibility hinges on microarchitectural noise control.
- **Governing the KV Cache: Preventing Timing Side-Channels in Multi-Tenant LLM Serving, arXiv:2608.09225:** https://arxiv.org/abs/2608.09225 — the shared-state analogue one layer up: shared prefix KV caches let one tenant reconstruct another's private prompt from cache-hit latency (PROMPTPEEK-family attacks). Together with ToolPulse this forms a three-layer threat surface for agentic serving — KV-cache timing, CPU library residency, and GPU policy state — each needing its own isolation control.

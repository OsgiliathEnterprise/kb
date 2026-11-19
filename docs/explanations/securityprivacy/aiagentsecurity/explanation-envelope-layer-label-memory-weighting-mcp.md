---
title: 'Weighing the Envelope: Component Weight and Arbitration in Envelope-Layer
  Defenses for a Single LLM Agent'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.23844
date: 2026-11-19
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Weighing the Envelope: Component Weight and Arbitration in Envelope-Layer Defenses for a Single LLM Agent

## Overview
The **envelope layer** is the channel through which malicious content enters an LLM agent — labels, memories, and tool descriptions that ride alongside legitimate traffic. Prior work studied envelope effects in multi-agent A2A settings; this paper (arXiv:2611.23844) measures what happens when **MCP tools and poisoned long-term memory coexist inside a single agent**, and finds that envelope labels behave as *measurable, reversible weights*, not as switches.

## Problem Statement
Threat model: an attacker pre-plants a malicious MCP tool and poisons the agent's long-term memory. A benign user request inadvertently triggers the tool; the attacker never enters the conversation. Given this, how do labels, memory, tool roles, and the backend jointly shape invocation decisions — and can a security label survive an agent that "remembers" succeeding with the tool?

## Key Contribution
- **Label-vs-memory arbitration**: a tool-side forced-verification label substantially reduces semantic breach, but strong success memories pull the outcome back; a memory-side downgrade statement returns protection to the label-alone level.
- **Mechanism of labels**: they work through **mandatory implementation inspection plus default denial** — not through length or format. Memory authorization wording erodes the label dose-dependently; label position and multi-turn pressure do not change the defense direction.
- **Tool-role taxonomy**: tool roles split label effects into substitution, suppression, and boundary failure. Low penetration is *not* safety — **local leakage is the main residual risk** — and a second malicious tool shows the same direction.

## Technical Approach
Following GDA measurement with A/B/C/D arms, the authors measure invocation decisions across four experiment families: label-memory conflict, tool roles, robustness, and tool generalization, varying backend as an explicit factor.

## Results
The central qualitative result: envelope labels are a **soft gate and risk signal within a broader defense**, constrained by backend and tool role — explicitly not a substitute for permissions, sandboxing, or human review.

## Relevance to Our Domain
Directly operational for our MCP gateway and agent-security guidance: label-based injection defenses on tool descriptions degrade under memory poisoning, so our agent stacks should pair forced-verification labels with **default-deny tool policies and memory downgrade mechanisms**, and treat "the attack rarely fires" as insufficient — leakage on a local subset is the number to watch.

## References
- Paper: https://arxiv.org/abs/2611.23844
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.23844
- Related: [[how-to-mcp-deployment-gateway-tool-registration]], [[explanation-agentforge-agent-harness-security]]

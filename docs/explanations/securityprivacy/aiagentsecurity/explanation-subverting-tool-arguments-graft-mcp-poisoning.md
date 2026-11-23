---
title: 'Subverting Tool Arguments: Defense-Evading Metadata Poisoning in LLM Agents'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.27041
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Subverting Tool Arguments: Defense-Evading Metadata Poisoning in LLM Agents

## Overview
Indirect prompt injection is usually studied through *content* an agent retrieves. The Model Context Protocol shifts an equal-sized attack surface into *metadata*: the tool descriptions supplied by third-party MCP servers are trusted by the agent when it selects tools and fills arguments. This paper shows that adversarially crafted tool descriptions can steer an agent into malicious argument generation while still reading as benign to both the LLM and human users — and presents GRAFT, an LLM-driven optimizer that manufactures such descriptions with high attack success and low detectability.

## Problem Statement
The hard part of tool-description poisoning is the dual constraint: the poisoned description must reliably corrupt the agent's tool-choice/argument behavior *and* survive both human inspection and automated filters. Existing IPI attacks trade one off against the other in this setting.

## Key Contribution
- Identifies MCP tool metadata (descriptions from third-party servers) as a first-class, under-defended attack surface distinct from retrieved-content IPI.
- **GRAFT**, an LLM-based optimization loop for crafting adversarial tool descriptions:
  - a masking mechanism locates *argument-relevant token positions* so the injection targets exactly the tokens that influence argument generation;
  - candidate descriptions are iteratively refined with LLM-proposed dynamic mutation strategies, guided by feedback from the agent's actual tool choices and generated arguments.
- Evaluation on three public datasets: higher attack success at low detection rates against five filter-based defenses, bypasses of several existing IPI defenses, and sustained superiority even under an *adaptive* defense trained on GRAFT-generated injections.

## Technical Approach
The key conceptual move is treating the tool description as an adversarial prompt-optimization target where the loss is the agent's downstream argument behavior, not text-level similarity. Masking argument-relevant positions concentrates perturbation budget where the model actually reads for argument slots; the mutation loop searches the space of descriptions that preserve benign appearance (to filters and users) while flipping tool-call semantics.

## Results
Higher ASR than baselines at lower detection across five filter defenses; robustness to an adaptive classifier trained on its own outputs — indicating the poisoned descriptions occupy a region current defenses do not characterize.

## Relevance to Our Domain
Our agent infrastructure consumes third-party MCP servers; this note argues that description review cannot be casual. Practical mitigations aligned with the paper: pin and review MCP server tool descriptions like code (supply-chain review), treat descriptions as untrusted input in detectors, and monitor *argument distributions* rather than only prompt text. Complements the KB's MCP attack/audit corpus (MCPi, Tox-MCP, When Audit Fails, Silent Failure Modes).

## References
- Paper: https://arxiv.org/abs/2611.27041
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27041
- Related KB notes: `security-privacy/ai-agent-security/explanation-tox-mcp-tool-description-attacks.md`, `security-privacy/ai-agent-security/reference-when-audit-fails-mcp-security-testing.md`

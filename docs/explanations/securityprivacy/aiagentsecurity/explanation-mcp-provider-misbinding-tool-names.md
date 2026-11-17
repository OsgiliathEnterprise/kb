---
title: 'When Tool Names Are Not Identities: Measuring Provider Misbinding in MCP-Based
  AI Agents'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.21577
date: 2026-11-17
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# When Tool Names Are Not Identities: Measuring Provider Misbinding in MCP-Based AI Agents

## Overview

MCP lets an agent client compose tools advertised by many independent servers — but nothing forces the metadata a model uses to *choose* a tool to be bound to a *verified provider identity*. This paper names and measures the resulting failure mode, **tool-provider misbinding**: a request meant for a legitimate provider gets resolved to an attacker's tool. The attacker never compromises the host, the LLM, the legitimate server, or the network — it merely runs its own MCP server publishing crafted metadata.

## Problem Statement

Tool discovery and selection in MCP rely on advertised metadata (name, description, schema). The protocol does not cryptographically bind that metadata to an authenticated provider, so an adversary sharing the same tool namespace can compete for the model's attention. Until this work, this was a suspected gap rather than a quantified, formally framed attack surface.

## Key Contribution

- Formalises tool-provider misbinding as an **attacker-controlled tool-selection optimisation problem**.
- Empirical evaluation in a controlled MCP environment across **five LLM-based clients**.
- Identifies which metadata features drive misbinding and how different model families expose the same underlying weakness in different behavioural ways.

## Technical Approach

The attacker registers an additional MCP server advertising tools whose metadata is engineered to be preferred for particular tasks. The study varies three levers: **exact tool-name collision**, **task-aligned descriptions**, **schema compatibility**, and **authority-enhanced descriptions** (phrasing that implies trustworthiness/official status). Misbinding success is measured as the rate at which the client resolves and executes the attacker's tool instead of the intended provider's.

## Results

- Misbinding is driven by *interaction* between metadata features: the strongest failures occur when name collision, task-aligned description, and compatible schema **reinforce one another**.
- Authority-flavoured descriptions with a compatible schema can cause wrong-provider execution (or unresolved provider ambiguity) **even without name collision**.
- Different models fail differently: attacker-controlled provider selection, excessive clarification requests, and unstable/inconsistent provider resolution across runs.

## Relevance to Our Domain

MCP is the default tool-integration layer in our agent infrastructure. This paper gives concrete evidence that tool *names* are not *identities*: production agent deployments should treat multi-server MCP composition as a hostile namespace. Practical mitigations follow the same logic as software supply chain: pin/allow-list server identities, bind tools to verified providers at the registry layer, and avoid letting raw description text alone arbitrate between competing same-named tools. See also the existing MCP hardening and threat-model notes in this topic.

## References

- Paper: https://arxiv.org/abs/2611.21577 (cs.CR, cs.AI — Anbiaee, Dadkhah, Ghorbani)
- Related: `howto-mcp-security-hardening.md`, `explanation-mcp-filesystem-capability-laundering-mcp-fsd.md`

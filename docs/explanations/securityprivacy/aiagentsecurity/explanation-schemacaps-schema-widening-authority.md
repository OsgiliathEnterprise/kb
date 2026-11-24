---
title: 'SchemaCaps: When a Compatible Tool Update Silently Widens an AI Agent''s Authority'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: 'arXiv: SchemaCaps: When a Compatible Tool Update Silently Widens an AI Agent''s
  Authority (arXiv:2611.30750)'
source_url: https://arxiv.org/abs/2611.30750
date: 2026-11-24
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# SchemaCaps: When a Compatible Tool Update Silently Widens an AI Agent's Authority

## Overview

SchemaCaps (cs.AI/cs.CR, November 2026) exposes a quiet supply-chain hole in the MCP ecosystem: users approve an agent tool once, but the tool's **JSON input schema keeps evolving underneath that approval**. The authors survey 8 public MCP clients and scanners and observe/document **none of them re-approving a tool whose input schema has widened**. They then define a formal property — *non-amplification* over schema-visible coordinates (declared arguments, undeclared fields, on effective values) — and a re-binding rule, decided by subschema inclusion, that trusts no field labels by default.

## Problem Statement

Tool approval in agent platforms is a one-time human decision, but tools are living software: publishers ship "compatible" schema updates. If an update widens what an argument accepts (e.g., a recipient field now taking any address, an endpoint field now accepting any URL), the agent's actual authority silently grows while every client still considers the tool approved. Semantic behavior change behind an identical schema remains out of reach for any static check — but *schema-visible* widening does not, and today nobody checks it.

## Key Contribution

- **First empirical gap demonstration**: across 8 surveyed MCP clients/scanners, no observed or documented case of re-approval on schema widening (2 undeterminable).
- **Formal non-amplification property** over schema-visible coordinates, plus a **re-binding rule based on subschema inclusion** — label-trusting names are never taken at face value; the rule is conservative up to its checker and tested-case analysis.
- **Machine-checked correctness**: a Coq proof of composition for the rule, 48 regression tests, and an exact-reference benchmark in which the pre-review version of the rule had silently re-bound 27 amplifying changes (since fixed).
- **Scale measurement — the striking number**: piloted on **604 releases of 39 public MCP servers**, **412 of 580 "compatible" schema changes widen some coordinate**, and compatibility-based clients re-bind them all silently. Adjudicated double annotation finds **at least 76 changes that add or widen an authority-bearing argument** — including **10 that a name-based labeller misses** (it flags 84, of which 66 are confirmed).

## Technical Approach

The rule treats the schema, not the name, as the authority surface. A tool update may keep its approval only if the new input schema is included in (no wider than) the old one on each visible coordinate; anything wider forces an explicit re-approval. Measured against alternatives on existing tools, the rule asks for **645 re-approvals**, versus 1,197 for naive schema pinning (2,004 if descriptions count) and 617 for plain compatibility checking — i.e., near-compatibility-level approval friction with substantially stronger guarantees.

## Results

- 412/580 compatible changes widen a coordinate (71%) in the 604-release pilot.
- ≥76 authority-bearing widenings identified; name-based labelling misses ~12% of the confirmed set.
- Coq-verified composition + regression suite gives deployable confidence in the checker.

## Relevance to Our Domain

For anyone running MCP servers in an agent platform, this is a concrete, measurable capability-creep vector: compatibility gating is *not* a security boundary. It pairs naturally with our capability-laundering and MCP hardening notes and suggests a governance control — schema-inclusion re-approval gates — that can be implemented in a registry/proxy today.

## References

- Paper: https://arxiv.org/abs/2611.30750
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.30750 (not yet indexed at time of writing)
- Related in vault: [[reference-piatlas-prompt-injection-attack-taxonomy]], MCP-FSD filesystem capability laundering note

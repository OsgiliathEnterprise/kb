---
title: 'Epistemic Guard: Out-of-Process MCP Receipt Proxying, Post-Turn Prose Supervision,
  and Provenance-Gated Memory for Tool-Using Autonomous Agents'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2611.27095
date: 2026-11-24
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# Epistemic Guard: Out-of-Process MCP Receipt Proxying, Post-Turn Prose Supervision, and Provenance-Gated Memory for Tool-Using Autonomous Agents

**Authors:** Sean Maxwell


## Overview

`epistemic-guard` (v0.5.2) is an open-source Python library and **out-of-process stdio MCP receipt proxy** (15 modules, **0 MiB GPU VRAM**) that closes three runtime-verification gaps in MCP tool-using agents: **action fabrication** (post-tool prose claiming side effects that failed, timed out, or never ran), **provenance collapse** (unverified model/web prose entering durable memory alongside real tool outputs), and **syndicated echo amplification** (mirrored web pages faking multi-source corroboration from a single origin).

## When to Use

When an autonomous agent executes MCP tools and you need cryptographic evidence that (a) claimed actions actually executed, (b) durable memory only contains verified provenance, and (c) "corroboration" is not a single source echoed across mirrors — without spending GPU VRAM on an LLM judge.

## Steps

1. **Proxy the MCP stdio channel.** Run epistemic-guard as an out-of-process stdio proxy between the agent and MCP servers so every tool call/receipt passes through it.
2. **Isolate signing keys.** Keep **Ed25519 signing keys out of process**, so the agent runtime cannot sign forged receipts.
3. **Log receipts cryptographically.** Write **RFC 6962 Merkle logs** with **AER-1 receipt translation** so executed tool outputs are append-only and verifiable.
4. **Supervise post-turn prose on CPU.** Check narrative claims against receipts using **SHA-256-verified OpenVINO INT8 encoders** (4 models, 279.48 MB total; only 82.67 MB on the supervision path) — flagging prose that narrates unexecuted side effects.
5. **Gate durable memory.** Gate SQLite writes across **7 provenance domains** so unverified prose or web text cannot mix with executed tool outputs; collapse verbatim/lightly-edited wire-syndicated RAG mirrors to defeat echo amplification.
6. **Verify deployments.** Run the conformance suites: tampered-rejection (200 Merkle leaves), official AER-1 ingestion vectors, reference-verified exports, fault-injected wire calls, concurrent appends, unauthorized memory writes.

## Verification (paper-reported)

- Rejects **100 %** of tampered receipts (200 Merkle leaves); passes **58/58** official AER-1 ingestion vectors and **50/50** reference-verified AER-1 exports.
- Verifies **100 %** of 40 fault-injected wire calls; **100 concurrent appends with 0 key leaks**; blocks **100 %** of 100 unauthorized memory writes.
- On N=250 frozen-benchmark traces: **93.2 % accuracy at 17.9 ms warm median CPU latency** (8.62 ms single-clause; 921.8 ms cold-start), beating 12B–14B GPU judges by **6.4–6.8 points** (p=0.0259, p=0.0095) at **4.26–4.5× lower latency**.
- On N=60 live mcp-proxy traces: catches **96.15 % of hazards** at 76.67 % accuracy (38.24 % FPR; +18.34 points over Stage-1-only, p=0.001) at 9.16 ms p50.

## Pitfalls

- Prior MCP firewalls inspect wire calls **before** execution and never bind post-execution prose to receipts — pre-execution filtering alone leaves action fabrication unchecked.
- LLM-judge guardrails cost multi-GB VRAM and still do not tie prose to receipts.
- The live-trace false-positive rate (38.24 %) is high; tune thresholds before blocking in production.

## References
- Paper: https://arxiv.org/abs/2611.27095 (cs.SE, cs.AI, cs.CR)
- Related note: `security-privacy/ai-agent-security/example-mcp-tool-poisoning-fixture-set.md`

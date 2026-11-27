---
title: Closed-World Resolution Against Tool Hallucination in LLM Agents
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: arXiv
source_url: https://arxiv.org/abs/2609.19425
date: 2026-11-27
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# Closed-World Resolution Against Tool Hallucination in LLM Agents

## Overview

Tool-augmented LLM agents fail in a way that neither tool-*selection* nor tool-*security* methods address: they call tools that **don't exist** and pass arguments no schema declares. Existing defenses either pick the right tool (selection) or constrain what an agent may do with real tools (gating) — both presuppose the emitted call refers to a *real* tool at all. This paper shows that's a structural blind spot: a hallucinated call is by construction not a decision any gate made, so no gate can reject it. It provides a training-free **closed-world resolver** and a measurement/benchmark study of how widespread this failure is across hosted models and the Model Context Protocol (MCP).

## Problem Statement

Selection methods assume you're choosing among real tools; gating methods assume the tool exists and constrain its use. Neither handles the case where the agent emits a call to a *fabricated* tool or with schema-undeclared arguments — because such a call isn't a decision any downstream gate ever made, so it slips through by construction. The paper formalizes this gap and characterizes the one irreducible residue (borrowed arguments that are schema-indistinguishable from a valid call).

## Key Contribution

- A **five-class taxonomy of tool hallucination (H1–H5)** for single-registry settings, plus a second taxonomy (**M1–M5**) for MCP where merging several servers into one namespace creates hallucination surfaces a single registry cannot express.
- The **Resolution Rung**: a training-free, closed-world resolver (registry membership + signature check) whose value is *where it must sit* — before any causal gate — not what it computes. A proof that hallucination defense must precede any causal gate.
- A versioned **Hallucinated-Tools Benchmark (HTB)** so any resolver can be compared across submissions, plus measurements across ten hosted models under two invocation surfaces and the live MCP surface.

## Technical Approach

To defend against tool hallucination: (1) treat the tool registry as a *closed world* — a call is only valid if its tool name is a registered member **and** its arguments pass a signature check; (2) place this resolver *before* any selection or gating logic, since a fabricated call can't be caught downstream; (3) for MCP, handle the merged-namespace case where collisions and shadowing create hallucination surfaces that no single registry expresses. Measure with HTB across models and invocation surfaces to compare resolvers.

## Results

- Across ten hosted models under two invocation surfaces: **322 genuine hallucinations** measured; fabricated-tool calls concentrate on the unconstrained raw-JSON surface (**34 vs. 3**), and model scale does *not* help (a 675B model matches a 7–8B one).
- On the live MCP surface: **154 hallucinations**, including from frontier models that were clean on the single-registry surface — because collisions and shadowing are structural to merging servers.
- The resolver's placement (before any causal gate) is proven necessary; the irreducible residue is borrowed arguments indistinguishable from a valid call by schema alone.

## Relevance to Our Domain

If you build tool-using agents, this reframes hallucination defense as a *precondition*, not an afterthought: validate registry membership + signature **before** any selection/gating logic runs, because downstream gates structurally cannot reject fabricated calls. The MCP finding is especially important for anyone merging multiple MCP servers — the merged namespace introduces new hallucination surfaces (collisions/shadowing) that single-registry defenses miss. HTB gives you a standard way to benchmark your own resolver.

## Taxonomy & Mechanism — Details (enriched 2026-11-27 from paper full text)

*(Iyer, arXiv:2609.19425, 16 Sep 2026, cs.AI — primarily a measurement/benchmark study.)*

- **Single-registry taxonomy H1–H5**: H1 nonexistent tools, H2 hallucinated arguments, H3 type violations, H4 off-frontier real tools, H5 borrowed signatures — each with a detectability characterization. A model that has seen `delete_file` in a thousand traces happily emits `wipe_disk`; a model that knows `transfer_funds` takes `amount` invents an override flag no schema declares.
- **MCP taxonomy M1–M5** (multi-server): cross-server fabrication, namespace collision, tool shadowing / rug pull, stale definitions, cross-server signature borrowing. The MCP Resolution Rung resolves a call to a `(server, tool)` pair rather than a bare tool name.
- **The Resolution Rung is deliberately trivial**: registry membership + signature type-check — "no more than disciplined input validation." The claim is *placement*, not mechanism: selection optimizes which real tool to prefer, gating reasons only about tools it exposed, contract verification has nothing to verify for a fabricated tool — so resolution falls between them and is provably the one placement (before the gate) that is sound against fabrication. It needs no model access, no fine-tuning, no decoder change — it drops in front of *any* function-calling agent.
- **Ablation result**: zeros the schema-detectable classes with no honest over-rejection; only the schema-indistinguishable H5 residue survives, which reduces to the tool-selection setting.
- **MCP results**: synthetic benchmark — naive host 1.00 vs resolver 0.00 hallucination rate on all five M-classes; live ten-model study — 154 MCP hallucinations spanning M1–M3, resolver rejected 154/154.
- **HTB (Hallucinated-Tools Benchmark)**: installable, deterministic suite scoring any resolver on H1–H5 + M1–M5 with a single HTB score; leaderboard against the baselines practitioners actually reach for (allowlist, fuzzy-name router, JSON-schema validator, first-provider/highest-trust MCP hosts); adapters for real catalogs (API-Bank-style registry, real MCP manifests with naturally-occurring collisions and shadows).

## Practical Checklist

1. Validate registry membership + argument signature on every emitted call, *before* any router/gate/contract layer — treat it as input validation, not security tooling.
2. When merging MCP servers, resolve to `(server, tool)` pairs and audit namespace collisions/shadowing — frontier models hallucinate here even when clean on single-registry surfaces.
3. Prefer schema-enforcing invocation APIs over raw-JSON surfaces (34 vs 3 fabricated calls in this study).
4. Don't assume bigger models hallucinate less: a 675B model matched a 7–8B one.

## References
- Paper: https://arxiv.org/abs/2609.19425
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2609.19425

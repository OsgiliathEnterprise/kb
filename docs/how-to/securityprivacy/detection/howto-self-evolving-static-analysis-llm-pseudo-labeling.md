---
title: 'SESA: Self-Evolving Static Analysis via LLM Pseudo-Labeling — Bootstrapping
  Security Rules Without Ground Truth'
diataxis: How-to Guide
domain: security-privacy
topic: detection
source: 'arXiv: Self-Evolving Static Analysis via LLM Pseudo-Labeling (arXiv:2610.30184)'
source_url: https://arxiv.org/abs/2610.30184
date: 2026-10-25
keywords:
- knowledge-base
- detection
- security-privacy
- how-to
---
# Self-Evolving Static Analysis via LLM Pseudo-Labeling (SESA)

## Overview

Security bugs slip past static analysis less often because they are undetectable and more often because **nobody has written a rule for the code in front of us** — new frameworks, APIs, and idioms continuously open gaps that developers fill by discovering failures and manually encoding rules. This paper (cs.CR/cs.AI/cs.SE, Oct 2026) presents **SESA**, a framework where an LLM agent starts from *no rules* and iteratively evolves a set of **readable, auditable Joern queries** — with the only feedback coming from a *second LLM critic*, no ground-truth labels anywhere in the loop.

## Problem Statement

SAST rule maintenance is a manual authoring process: a human sees a class of bug, writes a query, tunes it. That does not scale with the rate at which new frameworks and idioms appear. The blocker is labels — training or tuning detectors normally requires ground truth (known vulnerabilities), which is exactly what you lack for *new* code patterns.

## How It Works (the procedure)

1. **Start empty**: the agent begins with zero detection rules for the target codebase.
2. **Evolve queries**: the agent generates and revises human-readable **Joern queries** (Code Property Graph queries over the codebase's AST/CFG/PG) that flag candidate instances of suspicious patterns.
3. **Pseudo-label with a critic LLM**: a *second* LLM inspects both the flagged code and unflagged code and reports likely **false alarms** and suspected **misses** — it never sees ground-truth labels, so it functions as a pseudo-labeler.
4. **Revise and repeat**: the first agent uses the critic's feedback to revise the query set; loop until the critic's findings stabilize.
5. **Ship an auditable artifact**: the end product is a set of executable, human-readable queries engineers can inspect, modify, and run independently of the LLMs.

The key design property: **no ground truth is ever shown to either LLM** — the critic's judgments are pseudo-labels, which is what makes the loop usable before the vulnerability is even known.

## Results

- **OWASP Benchmark for Python**: mean **F1 0.742 across 8 independent runs** — above the default configurations of five widely used static analysis tools, and comparable to the strongest of them *once tuned with ground-truth labels that SESA never sees*.
- **Real-world pilot** on Python projects: queries induced from code available *before* a vulnerability was introduced **detect 10 of 19 subsequent CVEs**, including 9 detected by rules written specifically for those same repositories.

## Relevance to Our Domain

This is the first credible recipe for turning SAST rule maintenance from manual authoring into **automated discovery and repair** with a human-auditable output — the auditability matters for a detection workflow, since the artifact is executable queries, not an opaque model. For the detection topic in this KB, it sits alongside the network- and filesystem-baseline notes as an LLM-assisted, label-free coverage method: where those notes detect anomalies in *data*, SESA closes coverage gaps in *code-analysis rules*. Practical takeaway: the two-LLM critic loop (generator + pseudo-labeler, no ground truth) is the pattern to copy, not just the Joern details.

## References

- Paper: https://arxiv.org/abs/2610.30184
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.30184

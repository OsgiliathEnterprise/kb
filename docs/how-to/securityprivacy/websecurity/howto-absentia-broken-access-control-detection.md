---
title: ABSENTIA — Detecting Broken Access Control in Web Apps with LLM Agents
diataxis: How-to Guide
domain: security-privacy
topic: web-security
source: arXiv
source_url: https://arxiv.org/abs/2610.00977
date: 2026-10-04
keywords:
- knowledge-base
- web-security
- security-privacy
- how-to
---
# ABSENTIA — Detecting Broken Access Control in Web Apps with LLM Agents

## Overview

ABSENTIA is a security scaffolding that turns general-purpose LLM agents into *systematic* detectors of broken access control (BAC) vulnerabilities in the backend of web applications, run as an audit by the developers and security engineers who maintain the code. Its central insight is that authorization is a **relation** — who may act on what — not a data flow like injection. Because each application defines its own authorization relation, no rule written in advance carries to the next app; an agent must infer the relation from the code *and* have a systematic way to cover the whole application and prioritize what to inspect.

## Problem Statement

Broken access control is one of the most prevalent web security risks, yet unlike injection (a flow of untrusted input into a dangerous operation) it is relational and app-specific. An LLM agent can infer authorization from code, but with no systematic way to cover the application or prioritize inspection targets, its search stays undirected and access-control flaws go undetected. Static analyzers fare worse: on the paper's benchmark, CodeQL and Semgrep recall none of the vulnerabilities.

## Key Contribution

- A **route-to-code graph** that maps each application route to the code behind it, giving the agent a complete map to work through rather than an open-ended search.
- **Invariant falsification**: for each route, infer the properties the code is *meant* to satisfy (the authorization invariants), and report any route where an invariant is not enforced — flagging it for maintainer review.
- **BAC-Bench**, a benchmark of 30 broken-access-control advisories across 25 repositories, 3 languages, and 9 frameworks, each published in 2025 or later, verified by a human auditor, and paired with its fixing commit so credit requires flagging the *vulnerable* version rather than the fixed one.

## Technical Approach

The agent first builds a graph linking routes to their backend code. It then works route-by-route: for each route it infers the intended authorization invariants (who may act on what) and checks whether the code actually enforces them; where an invariant is absent, the route is reported. An LLM verifier confirms findings to reduce false positives. The whole loop is designed to be run by human maintainers as a review aid rather than a fully autonomous scanner.

## Results

- ABSENTIA **recalls 19 of 30** BAC-Bench advisories (17 under the stricter paired-credit rule); an LLM verifier confirms 51% of its findings.
- **CodeQL and Semgrep recall none**; an unstructured agent on the same model recalls only 3 — showing the scaffolding, not raw model capability, drives detection.
- On OWASP Benchmark injection categories, ABSENTIA leads the dedicated analyzers in Python and trails only CodeQL and IRIS in Java.

## Relevance to Our Domain

This is a concrete, reproducible procedure for security engineers who want LLM agents to audit web backends for authorization flaws: build the route→code graph, apply invariant falsification per route, verify with an LLM judge. The "invariant falsification" framing generalizes beyond BAC to any property that code should satisfy but may silently omit — a useful pattern for broader static-analysis-assisted auditing in DevSecOps pipelines.

## References

- Paper: https://arxiv.org/abs/2610.00977
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.00977

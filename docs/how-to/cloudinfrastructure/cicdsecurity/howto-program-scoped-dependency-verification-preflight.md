---
title: 'Preflight: Agentic Last-Mile Verification for AI Software Supply Chains'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: ci-cd-security
source: arXiv
source_url: https://arxiv.org/abs/2611.31110
date: '2026-11-24'
keywords:
- knowledge-base
- ci-cd-security
- cloud-infrastructure
- how-to
---
# How to Verify Python Dependencies in the Context of Your Own Program — the Preflight Recipe

**Authors:** Yaman Jandali, Nojan Sheybani, Farinaz Koushanfar, Tara Javidi. (arXiv:2611.31110)


## Objective
Decide, **before execution**, whether a released dependency artifact behaves maliciously *for your specific application* — not in the abstract. Provenance, static analysis, and package-level behavioral testing all answer "is this package evil somewhere?"; none answers "does this artifact do anything security-relevant on the code paths my program actually reaches?"

## Why Program-Scoping Matters
Dependencies execute inside your application's trust boundary. A package that is clean for 99 programs can be hostile for the one program that imports the poisoned symbol (cf. real incidents where only a specific import path triggers exfiltration). Import-only probing of a package can expose nothing, while function-level probing exposes the payload.

## Procedure (Preflight's Pipeline)
1. **Extract application-referenced symbols** — determine which names from the dependency your program actually touches.
2. **Synthesize function-level harnesses** — iteratively generate (and validate) harnesses that exercise those symbols at the function level, not just at import time.
3. **Execute in a restricted environment** — run the resolved artifact inside a sandboxed runtime.
4. **Record behavioral fingerprints** — capture what the artifact does (system/file/network-level behavior) while the harnesses run.
5. **Baseline-diff when possible** — compare the target's fingerprints against prior versions when suitable baselines exist; flag behavioral drift.
6. **Render a verdict** — malicious / clean, per application context.

## Validation Evidence (from the paper)
- **4 real supply-chain incidents × 5 application contexts**: malicious verdicts in the 4 incident contexts; a **clean verdict in the LiteLLM client context**, where the affected proxy-server path is never exercised — the scoping works in both directions.
- **100-package benign corpus**: all 100 clean, **zero observed false positives**.
- **Ablation (Ultralytics, ctx incidents)**: function-level harnesses expose the malicious behavior in both cases; **import-only probing exposes neither** — the harness synthesis step is what earns its cost.

## Operational Notes
- Treat "clean" as *clean for this context*: a clean verdict on your program says nothing about other consumers of the same artifact.
- Baseline diffing against prior versions catches the common incident shape (legitimate maintainer flow → one poisoned release) better than absolute classification.
- This is a **last-mile gate** in the pipeline — it complements provenance (SLSA/signatures), SCA, and static analysis rather than replacing them.

## Relevance to Our Domain
Extends the KB's CI/CD and supply-chain security coverage (OWASP CI/CD Top 10, CI build isolation) with a *behavioral, program-scoped* verification stage for Python dependencies — the class of incident (LiteLLM, Ultralytics) our AI-era pipelines are most exposed to.

## References
- Paper: https://arxiv.org/abs/2611.31110 (cs.AI, cs.CR, submitted 2026-11-23)
- PDF: https://arxiv.org/pdf/2611.31110

---
title: Patterns for Designing CI/CD Workflows — A Pattern Catalog from Empirical Studies
  and Smell Catalogues
diataxis: Explanation
domain: developer-tools-practices
topic: cicd-patterns
source: arXiv
source_url: https://arxiv.org/abs/2611.17276
date: 2026-11-13
keywords:
- knowledge-base
- cicd-patterns
- developer-tools-practices
- explanations
---
# Patterns for Designing CI/CD Workflows (Sousa & Correia, 2026)

## Overview

CI/CD pipeline knowledge is notoriously fragmented: empirical academic studies, practitioner books, and "pipeline smell" catalogues each hold a slice, with no unifying structure. Sousa & Correia consolidate this scattered material into a **pattern catalogue for CI/CD workflow design**, converting candidate practices and anti-practices into classical software patterns. Each pattern is documented in the canonical Alexandrine form — context, problem, forces, solution, consequences.

## Scope (What the Catalogue Covers)

The patterns address recurring CI/CD design issues across five areas:

| Area | Typical concerns |
|---|---|
| **Security** | hardening pipelines, protecting secrets and supply chain |
| **Pipeline scheduling** | trigger strategies, cadence, resource contention |
| **Workflow structure** | job/stage decomposition, reuse, dependency wiring |
| **Performance** | build/test speed, caching, parallelization |
| **Failure & release management** | handling flaky/broken stages, promotion, rollback |

## Pattern Anatomy

Every entry follows the same lookup structure:

1. **Context** — the situation in which the pattern applies
2. **Problem** — the recurring design issue it addresses
3. **Forces** — competing constraints (speed vs. safety, reuse vs. isolation…)
4. **Solution** — the prescribed structure
5. **Consequences** — trade-offs introduced by adopting it

Derivation method: candidate **practices and anti-practices** were harvested from the literature (empirical studies, practitioner books, smell catalogues), converted into patterns, then consolidated and merged — making this an aggregation study rather than a new single-source survey.

## Practitioner Pattern Landscape

The academic catalogue complements the practitioner canon; a working pipeline review can cross-check both. The 10 commonly cited production architectures (Tusker, 2025):

| # | Pattern | Core idea | Watch-out |
|---|---|---|---|
| 1 | Build-and-Deploy | Build artifact once, promote same image through dev/staging/prod | Environment-specific hacks break artifact reuse |
| 2 | Pipeline as Code | Declarative pipeline YAML versioned with source, containerized runners | Monolithic scripts if not modularized |
| 3 | Trunk-Based CI | Small merges to mainline many times daily | Needs feature flags + fast feedback |
| 4 | Blue-Green | Two identical prod envs, atomic traffic switch | Doubles infra cost |
| 5 | Canary | Roll out to small user subset, gate on metrics | Requires good telemetry |
| 6 | Feature Toggle | Deploy disabled features, release via toggles | Toggle debt if not cleaned |
| 7 | GitOps | Git repo is source of truth; reconcile actual→desired state (ArgoCD) | RBAC drift between repo and cluster |
| 8 | Multi-Branch | Per-branch/PR pipeline instances | Resource contention without queueing |
| 9 | Monorepo Pipeline | Build/test only changed modules | Needs reliable dependency graphs |
| 10 | Serverless CI/CD | Lambda/Functions for tests, deploys, notifications | Cold start + observability gaps |

Cross-cutting concepts that these patterns assume: pipeline as code, shift-left testing, DevSecOps integration, microservices/Kubernetes orchestration, serverless/cloud-native runners. Measure outcomes with the four DORA metrics (deployment frequency, lead time for changes, MTTR, change failure rate) plus pipeline duration, success rate, and security-vulnerability trends. Tooling anchors in 2025–2026 practice: GitHub Actions / GitLab CI, Jenkins X + Spinnaker, ArgoCD (GitOps), Tekton, Terraform/Pulumi.

## When to Use This Reference

- Reviewing or redesigning a GitHub Actions / GitLab CI / Jenkins pipeline: match your pain point to the area table above, then look up the pattern for its forces and consequences.
- Documenting pipeline design decisions: the context/problem/forces/solution/consequences template gives a reusable ADR-style vocabulary for CI/CD choices.
- Onboarding engineers onto pipeline conventions backed by cited empirical evidence rather than folklore.

## Relevance to Our Domain

Complements our CI/CD performance and DevSecOps notes with a structured, citable design vocabulary — useful as the checklist backbone for pipeline reviews and for evaluating AI-generated workflow YAML against known anti-practices.

## References

- Paper: https://arxiv.org/abs/2611.17276
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.17276
- Practitioner complement — CI/CD Design Patterns (O'Reilly): https://www.oreilly.com/library/view/ci-cd-design-patterns/9781835889640/
- Practitioner complement — CI/CD pipeline design patterns overview: https://stonetusker.com/ci-cd-pipeline-design-patterns-10-proven-architectures-that-work/
- Practitioner complement — modern pipeline architecture + DORA metrics guide: https://hakia.com/engineering/cicd-pipeline-design/
- Related notes: `explanations/developertoolspractices/ciperformance/`

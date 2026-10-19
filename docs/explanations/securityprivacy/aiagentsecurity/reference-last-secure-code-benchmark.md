---
title: 'Last Secure Code Benchmark: Is the Code You Vibe Secure?'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: 'arXiv: Last Secure Code Benchmark: Is the Code You Vibe Secure? (arXiv:2610.14766)'
source_url: https://arxiv.org/abs/2610.14766
date: 2026-10-18
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Last Secure Code Benchmark: Is the Code You Vibe Secure?

## Overview

A benchmark (cs.CR, 2026) for measuring whether frontier AI coding agents produce **functionally correct *and* secure** code, built exclusively from real-world vulnerabilities. Rather than synthetic tasks, each task is derived from an actual CVE-class bug, so "solving" a task means writing code that avoids a vulnerability that has shipped in production software before. The headline finding: the best agent achieves functional pass rates in the 73.6–91.3% band, but only **25.1%** of tasks are solved *and* secure — functional competence does not imply security competence.

## Specification

| Attribute | Value |
|-----------|-------|
| Real-world vulnerabilities | 150 |
| Generated tasks | 450 (3 per vulnerability) |
| Languages | 7 |
| CWE classes | 24 |
| Vibe-coding scenarios | 3 (per-task interaction styles) |
| Frontier agents evaluated | 6 |
| Functional pass range (agents) | 73.6% – 91.3% |
| Best functional-and-secure rate | 25.1% |
| Semantic Scholar citation count | 0 (as of 2026-10-18) |

## How the Benchmark Works

1. **Vulnerability → task**: each of the 150 real vulnerabilities is converted into a coding task whose correct solution avoids the vulnerability while still meeting the functional requirement.
2. **Three tasks per vulnerability**: the tasks vary the surrounding context so a single memorized patch cannot cover all three.
3. **Three vibe-coding scenarios**: each task is presented in one of three interaction styles, mimicking how developers actually prompt coding agents (spec-first, iterative, and prompt-heavy workflows).
4. **Dual scoring**: every submission is scored for (a) functional correctness (tests pass) and (b) security (the vulnerability class is not reintroduced), giving a 2×2 outcome matrix per task.

## Results

- Functional pass rates span **73.6%–91.3%** across the six agents — the top agents are functionally strong.
- The best **functional + secure** rate is **25.1%** — a large share of functionally correct solutions reintroduce the vulnerability class they were asked to avoid.
- The gap between the functional and secure columns is the paper's core measurement: it quantifies how much "vibe-coded" code looks right while being wrong in the security dimension that tests typically do not cover.

## Relevance to Our Domain

This is the reference to point at when a team says "our coding agent passes all the tests, so it's fine." The benchmark gives concrete numbers for the gap between functional and secure correctness, and its CVE-derived task design means the security failures are *production-relevant*, not toy. For the [AI coding agents](../../developertoolspractices/aicodingagents) notes, it establishes a baseline: as of October 2026, no frontier agent reliably produces secure code from vibe-style prompting.

## References

- Paper: https://arxiv.org/abs/2610.14766
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.14766 (citationCount: 0)

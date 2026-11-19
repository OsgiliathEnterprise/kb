---
title: 'The Comprehension Gap in LLM-Assisted Software Development: An Experiment'
diataxis: Explanation
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.24216
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- explanations
---
# The Comprehension Gap in LLM-Assisted Software Development: An Experiment

## Overview
A crossover experiment with 35 participants (students, academics, professional developers) quantifies the "comprehension gap": developers understand code they wrote themselves better than code the LLM generated for them, even though the LLM made the original task faster. The paper frames the difference as *cognitive debt* that must be repaid before future work is efficient again.

## Problem Statement
When LLM tools are pushed beyond their reliable capabilities, developers must step in and debug. But heavy code generation may erode the understanding developers build during development — so the speed gained now can turn into comprehension debt paid later, exactly when intervention is needed.

## Method
- Crossover design: each participant completes two programming tasks, once with and once without LLM chat.
- Comprehension is then tested by **finding injected mutations** in (a) self-written code, (b) LLM-generated code, and (c) unseen code.
- Supplemented with interviews and screen recordings.

## Key Results
- **36%** of participants report better understanding of self-written code than of their generated code.
- Comprehension tasks solved **20% faster** on self-written code; **11% more mutations found** there.
- LLM use **significantly reduced time** on the original programming tasks (the classic speed/comprehension trade-off).
- The damage concentrates in a profile: **high reliance on chat + low task engagement → significantly decreased comprehension**.
- Qualitative: highly individual strategies, ranging from accepting the gap, to adapting prompting behavior, to abandoning the tools.

## Relevance to Our Domain
This is empirical grounding for the KB's AI-assisted-development coverage: it supports pairing speed metrics with comprehension checks (mutation-finding, code walkthroughs) in team practice and in agent-policy design — e.g., requiring developers to review/explain generated diffs before merge, and watching the high-reliance/low-engagement profile as the at-risk cohort for cognitive debt.

## References
- Paper: https://arxiv.org/abs/2611.24216
- Related: [[how-to-ai-pair-programming-productivity-measurement]]

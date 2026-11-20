---
title: Static Analysis Guidance for Secure LLM Code Generation
diataxis: How-to Guide
domain: software-development
topic: ai-assisted-development
source: arXiv
source_url: https://arxiv.org/abs/2611.26312
keywords:
- knowledge-base
- ai-assisted-development
- software-development
- how-to
---
# Static Analysis Guidance for Secure LLM Code Generation

## Overview
Static analyzers are cheap and already deployed — this paper tests feeding their findings to the model *during generation* instead of running costly iterative repair loops. When the analyzer flags a finding, generation is rolled back and the finding is injected as context — either as a **code comment** (Comment) or into the **user message** (Steering) — and generation restarts. Guidance-during-generation matches the best iterative approach on security at a fraction of the token cost, but only under the right conditions.

## Problem Statement
Existing analyzer-in-the-loop approaches put the static analyzer inside an iterative repair loop with intermediate steps: expensive, and it confounds measurement of the report's actual effect on the model. The question: can a single injected finding, at generation time, do most of the work?

## How to Apply Static-Analysis Guidance
1. **Run your existing static analyzer** (e.g. bandit-class tools) as a guard during generation — no repair loop.
2. **On an alert, roll back** the in-progress generation.
3. **Inject the finding and regenerate**, choosing one strategy:
   - **Comment**: insert the finding as a code comment at the flagged location.
   - **Steering**: place the finding in the user message.
4. **Filter alerts against the task spec first**: when an alert (warning or error) *contradicts* the task, models tend to obey the analyzer and break the program — suppress conflicting alerts before injecting.
5. **Target rules with local fixes**: rules fixable by a small, local edit benefit most; rules requiring code restructuring fail often (the two Qwen2.5 models frequently failed on restructural fixes).
6. **Use a capable model**: benefits concentrate with strong models — with DeepSeek-V4.1-flash on RiskyPy, Steering lifts functional-and-secure programs from **52.5% → 64.4%**, close to the best iterative approach (66.2%) at **&lt;1/5 of the tokens**.

## When NOT to Apply Guidance
- **Low-alert benchmarks**: analyzers flagged at most **5.6%** of functional-but-insecure programs on SecEvalPlus — little signal to act on.
- **Task-contradicting alerts** (see step 4) — guidance actively harms correctness.
- **Restructural fixes** with weaker models.

## Cost Profile
- Guidance-during-generation: **0.9–1.9×** baseline output tokens.
- Iterative repair approaches: up to **24.1×** baseline tokens.
- Study scope: three models × three Python benchmarks, security scored by each benchmark's oracle; replacing the XML parser was net-positive on two of three models.

## Relevance to Our Domain
A practical DevSecOps recipe for coding-agent pipelines: prefer cheap generation-time steering over expensive analyze-repair loops, gate on alert/spec consistency, and pick rule subsets with local fixes. Pairs with our secure-codegen notes ([[reference-last-secure-code-benchmark]]) and CI security scanning practice.

## References
- Paper: https://arxiv.org/abs/2611.26312
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26312
- Related: [[explanation-vibe-coding-threat-landscape]] (ai-agent-security)

---
title: 'ReproShift: Cross-Version Adaptation of Linux Kernel Fuzzing Crash Reproducers'
diataxis: How-to Guide
domain: security-privacy
topic: fuzzing
source: arXiv
source_url: https://arxiv.org/abs/2611.30655
date: '2026-11-25'
keywords:
- knowledge-base
- fuzzing
- security-privacy
- how-to
---
# ReproShift: Cross-Version Adaptation of Linux Kernel Fuzzing Crash Reproducers

**Authors:** Changjian Liu, Zhiwen Tang, Xianying Wang, Fan Ding, Zhengshu Wang, Chao Hu, Yuheng Shen, Ying Fu, Heyuan Shi


## Overview
Liu, Tang, Wang, Ding, Wang, Hu et al. (arXiv:2611.30655, cs.SE, submitted 2026-11-23) tackle a chronic pain point of kernel fuzzing programs: crash reproducers written against one kernel version rot as the kernel evolves. **ReproShift** automates migrating a working reproducer to a new kernel version by adapting only version-sensitive behavior while pinning the bug-triggering semantics — turning yesterday's reproducer into today's regression test.

## Problem Statement
Historical crash reproducers encode concrete bug-triggering knowledge reusable for regression testing, bug revalidation, and impact analysis. But kernel evolution invalidates them: interfaces, configurations, and execution paths change. Migration is hard because the adapted reproducer must locate and modify *only* version-sensitive operations while preserving the trigger logic and resource dependencies that actually cause the crash. Manual migration doesn't scale across an ever-branching kernel tree.

## How-to: Migrate a Crash Reproducer Across Kernel Versions
ReproShift's pipeline, given source crash artifacts + source reproducer + target kernel:

1. **Build a structured source-to-target context** that identifies migration-relevant kernel changes between the two versions — a diff scoped to what can break the reproducer, not the whole changelog.
2. **Constrained target-aware adaptation**: revise version-sensitive reproducer operations (interfaces, configs, paths) under the constraint that the original trigger logic is preserved.
3. **Execute-adapt loop on the target kernel**: run adapted candidates, use execution feedback plus case-specific crash evidence to validate each candidate and refine subsequent migration attempts.
4. **Emit a migrated reproducer with same-bug validation evidence** — proof the adapted program triggers the *same* bug, not just any crash.

## Key Contribution
- Formalizes cross-version reproducer migration as semantics-preserving adaptation (preserve trigger, adapt surroundings).
- Closed-loop validation using real crash evidence rather than plausible-looking static translation.
- **Real-world validation on an evolving upstream kernel**: 22 upstream crash reports generated from adapted candidates — **7 fixed, 5 maintainer-confirmed**.
- **New benchmark**: 107 real-world source→target migration cases.

## Results
Same-bug migration confirmed in **57 / 107** benchmark cases vs **19 / 107** for direct replay (≈3× the replay baseline).

## Relevance to Our Domain
For continuous-fuzzing and vulnerability-management programs, reproducers are assets that depreciate at kernel-release speed; ReproShift shows a practical triage-to-regression pipeline with evidence-based validation, and its 107-case benchmark gives the field a measurement point. Connects to our notes on crash triage, syzkaller-style pipeline operations, and LLM-assisted reproducer repair.

## References
- Paper: https://arxiv.org/abs/2611.30655
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.30655

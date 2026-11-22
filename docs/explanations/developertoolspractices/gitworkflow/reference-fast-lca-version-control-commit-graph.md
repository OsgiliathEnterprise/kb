---
title: Fast Computation of Lowest Common Ancestor in Version Control Commit Graph
diataxis: Explanation
domain: developer-tools-practices
topic: git-workflow
source: arXiv
source_url: https://arxiv.org/abs/2611.25912
keywords:
- knowledge-base
- git-workflow
- developer-tools-practices
- explanations
---
# Fast Computation of Lowest Common Ancestor in Version Control Commit Graph

## Overview
Watanuki, Takayasu and Ito (Tokyo Tech, Nov 2026) benchmark LCA computation — the "merge base" query at the heart of every three-way merge and branch comparison — on real Git history graphs. They implement classic LCA algorithms against Git's parent-pointer DAG representation and evaluate on 25 popular open-source repositories (up to ~25,000 commits). Headline: pointer-chasing methods with preprocessing dominate.

## Reference: algorithm comparison on Git commit graphs

| Aspect | Finding |
|---|---|
| Top performers | **Parent pointer** and **jump pointer** methods — direct graph traversal via Git's stored parent metadata |
| Complexity (preprocessing + query) | **O(N + Q log N)**, N = commits, Q = queries |
| Query time at scale (25k commits) | **&lt; 20 ms per LCA query** |
| Losers | Euler-tour and related-tree methods — overhead of constructing/processing the auxiliary tree structure outweighs their theoretical appeal on VCS-shaped graphs |
| Dataset | 25 popular open-source repositories, histories up to ~25,000 commits |
| Implementation basis | Direct exploitation of Git's native parent-pointer representation (no auxiliary graph build) |

### When each approach makes sense
- **Parent/jump pointers**: many interleaved queries over a mostly-append-only DAG (the VCS case) — preprocessing pays off once, queries stay log-time.
- **Euler-tour/RMQ methods**: shine for static trees with dense query batches; on commit DAGs the auxiliary-structure construction cost dominates.

### Practical takeaways for VCS tooling
- `git merge-base`-style operations do **not** require heavy graph libraries on commit-scale graphs; naive upward traversal with preprocessing is sufficient at ~10⁴–10⁵ commits.
- The relevant scale question: the study caps at ~25k commits; kernel-scale histories (millions of commits, thousands of parents/day) remain outside the evaluated range — extrapolate with care.

## Relevance to Our Domain
Reference material for anyone building Git-native tooling — merge-base is on the critical path of merge, rebase, bisect, blame and branch-protection checks (e.g. CI "commits since divergence" gating). Documents empirically which textbook algorithm suits Git's data shape, saving re-implementation guesswork.

## References
- Paper: https://arxiv.org/abs/2611.25912
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.25912?fields=citationCount,year (rate-limited at check time; 2026)

## Related
- [[explanation-distributed-version-control-systems]] — Git's DAG model
- [[explanation-skillflow-workflow-induction-multi-agent]] — workflow analysis over agent commit graphs

---
title: 'SpecEngineeringBench: Evaluating Coding Agents as Autonomous Specification
  Engineers'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.32973
date: '2026-11-27'
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# SpecEngineeringBench: Evaluating Coding Agents as Autonomous Specification Engineers

**Authors:** Xingjian Wang, Shijian Wang, Minghao Liu, Ji Zou, Zetao Yang, Xinping Lei, Yiming Liang, Shen Yan, Enduo Zhao, Xiaoyang Shen, Weihao Xuan, Jiaheng Liu, Ge Zhang (arXiv 2611.32973, submitted 2026-11-24, primary cs.SE)

## Overview
SpecEngineeringBench positions coding agents as **autonomous specification engineers** — the role that turns a natural-language requirement into executable acceptance criteria. The benchmark covers the two core artifacts of that role: (1) generating test suites that capture required behavior, and (2) discovering defects through execution analysis. It evaluates **7 frontier coding agents**.

## Benchmark Composition (lookup)
| Dimension | Value |
|---|---|
| Instances | 100 |
| Source repositories | 78 open-source Python projects |
| Application categories | 16 |
| Agents evaluated | 7 frontier coding agents |
| Task 1 | Test-suite generation from requirements |
| Task 2 | Defect discovery via execution analysis |

## Headline Metrics
### Agent lineup (7 frontier coding agents, vendor-recommended production configs, high reasoning effort)
| Vendor | Agents | Harness |
|---|---|---|
| Anthropic | Claude-Opus-5, Claude-Sonnet-5 | Claude Code |
| OpenAI | GPT-6-Astra, GPT-5.6-Sol | Codex |
| Moonshot | Kimi-K3 | Claude Code |
| DeepSeek | DeepSeek-V4.1-Flash | Claude Code |
| Z.ai | GLM-5.3 | Claude Code |

### Task 1 — test-suite generation
| Metric | Value |
|---|---|
| Head Pass Rate | **91.47%** |
| Change-focused Coverage | **80.48%** |
| Fail-to-Pass Rate | **26.36%** |

Interpretation: agents get existing tests passing and cover changed code well, but the low Fail-to-Pass rate shows they struggle to write tests that *fail on the bug and pass on the fix* — the actual specification value of a test.

**Root cause (v1 full text)**: in **67.44%** of test outcomes, tests execute across both defective and repaired snapshots without detecting the defect — agents encode existing implementation outputs into assertions, treating the *implementation* rather than the specification as source of truth, and omit discriminating oracles derived from the PRD. Submitted suites distinguish unit, integration, and acceptance tests.

### Task 2 — defect localization recall
| Granularity | Recall |
|---|---|
| File-level | **78.11%** |
| Function-level | **51.29%** |

### Ablation: autonomous test generation improves localization
| Granularity | Gain |
|---|---|
| File recall | **+4.99 pp** |
| Function recall | **+2.77 pp** |
| Hunk recall | **+2.69 pp** |

Executing self-generated tests measurably sharpens the agent's defect hypothesis — closing the spec→execution loop helps even the diagnostic task.

## Relevance to Our Domain
For our AI-assisted development coverage (SWE-bench Pro, Terminal-Bench 2.0, SWE-Growth notes), this benchmark fills the **specification layer** gap: it is the closest public measure of whether coding agents can do the pre-implementation work (acceptance criteria, reproducible failure tests) that gates CI/CD pipelines. Practical implications for our pipeline design:
- Do not let an agent-authored test suite merge on Head Pass Rate alone — Fail-to-Pass (26.36%) is the metric that predicts real defect-catching.
- Agent-driven defect triage is file-level reliable (localization precision 75.33%) but function-level coin-flip (53.77%, a 21.56 pp drop), rebounding to 68.78% at hunk level (τ=3 line tolerance): route agent findings to humans at function granularity.

## Caveats
- Python-only, 100 instances — narrow vs multi-language fleets; treat rankings as directional.
- Single snapshot of 7 frontier agents; leaderboard will age fast.

## References
- Paper: https://arxiv.org/abs/2611.32973
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.32973
- Related in vault: developer-tools-practices/ai-coding-agents/ (SWE-bench Pro, Terminal-Bench 2.0, SWE-Growth, When Code Review Becomes a Blind Spot)

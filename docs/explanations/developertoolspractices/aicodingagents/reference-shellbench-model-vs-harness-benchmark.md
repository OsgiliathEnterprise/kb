---
title: 'ShellBench: What Matters More for AI Agents, Models, or Harness for Everyday
  Tasks'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.32946
date: '2026-11-25'
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# ShellBench: What Matters More for AI Agents, Models, or Harness for Everyday Tasks

**Authors:** Vincent Koc, Aditya Washikar, Rishab Naveen Venkataraman, Onur Solmaz, Zhentong Fan, Xinyang Han, Toby Vincent John, Hao Li, Achyut Mukund, Biresh Chandra Biswas, Eshan Shukla, Louis Pan, Ivan Kudryavtsev, Patthigulla Sai Surendra, Krish Oberoi, Ayaan Zaidi, Hema Veeradhi, Taylor Agarwal, Erik Erlandson, Agustin Rivera, Jacob Tomlinson, Louka Ewington-Pitsos


## Overview
ShellBench is a benchmark of **100 day-to-day tasks** for personal AI agents, derived from more than 10 million real user requests. Each task runs in a realistic workspace with messy files and competing data sources, and is graded on **both correctness and safety**. Its experimental design — 12 models × 5 agent harnesses × 3 reasoning levels, 53,100 total rollouts — is aimed at a consumer question: which configuration (model vs. harness) should a user optimize when deploying a general-purpose agent?

## Scope & Method
| Dimension | Value (from the paper's abstract) |
|---|---|
| Tasks | 100 day-to-day tasks, distilled from >10M user requests |
| Environment | realistic workspace, messy files, competing data sources |
| Grading | correctness **and** safety |
| Models | 12 |
| Harnesses | 5 |
| Reasoning levels | 3 |
| Rollouts | 53,100 (20 % on tasks designated for public release) |

## Key Numbers (lookup table)

| Finding | Value |
|---|---|
| Model vs. harness effect | **model choice impacts performance more** than harness choice |
| Spread among top 3 models | only **1.1 percentage points** |
| Best pass rate | GPT-6 Astra leads at **62.5 %** |
| Best cost-efficiency | GPT-6.1 Sol passes **61.4 %** at ≈ **1/6 of GPT-6 Astra's** estimated token cost per attempt |
| Harness effect | little effect on performance or safety: all 5 harnesses score pass@1 between **42.9 (Claude Code)** and **45.2 (OpenClaw)** |

## Interpreting the Results
- Within the leading model tier, model selection is nearly a wash (1.1 pp), so **token cost per successful attempt** is the decisive axis — GPT-6.1 Sol delivers ~98 % of the top pass rate at a fraction of the cost.
- Harness choice, in this everyday-task regime, is a second-order factor (~2.3 pp spread and little safety impact) — contrary to treating the scaffold as the main engineering lever.
- Even the best configurations leave ~38 % of mundane tasks failed, and grading includes safety, so a benchmark pass rate below 100 % should be read as residual real-world risk, not headroom.

## Known Gaps / Limitations
- Personal everyday shell/workspace tasks only; conclusions may not transfer to long-horizon coding or web agents.
- Absolute pass rates (≈43–63 %) mean the benchmark remains far from saturated; rankings could shift with better models.

## Relevance to Our Domain
Our KB frequently compares agent harnesses (Claude Code, OpenClaw, Codex CLI, Gemini CLI notes). ShellBench provides rare head-to-head numbers: Claude Code 42.9 and OpenClaw 45.2 pass@1 on identical tasks — useful, grounded evidence for harness-selection discussions, with the caution that model choice dominates. It also normalizes an important metric for our cost analyses: **cost per passed attempt**, not cost per token.

## References
- Paper: https://arxiv.org/abs/2611.32946
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.32946
- Related in KB: example-complete-agents-md-and-docs-set-for-react-vite-starter.md, explanation-agent-context-files-architectural-claims.md

---
title: KaliBench — Fine-Grained Benchmark for LLM Cybersecurity Tool Use on Kali Linux
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: arXiv
source_url: https://arxiv.org/abs/2610.02206
date: 2026-10-04
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# KaliBench — Fine-Grained Benchmark for LLM Cybersecurity Tool Use on Kali Linux

## Overview

KaliBench is a benchmark and dataset that measures whether large language models can translate an analyst's natural-language intent into *executable* commands for real-world cybersecurity tools, rather than testing security knowledge or end-to-end agentic behavior in the abstract. It targets Kali Linux specifically: 8,504 query-command pairs spanning 1,642 tools across 23 capability dimensions and 5 security phases. The paper was accepted to the NeurIPS 2026 Evaluations and Datasets Track.

## Problem Statement

Cybersecurity operations depend on strict command-line interfaces where a minor syntax error, an incorrect flag-value binding, or a misordered argument invalidates the whole execution. Existing LLM-for-security evaluations focus on knowledge-based questions or full agentic tasks, so they never directly measure the narrow but critical skill of producing commands that actually run. Without that signal you cannot tell whether a model is genuinely usable in a security workflow or merely plausible-sounding.

## Key Contribution

- A **fine-grained NL→CLI dataset** (8,504 pairs / 1,642 tools / 23 capability dimensions / 5 security phases) built through a manuscript-grounded pipeline with deterministic canonicalization and alias-aware evaluation for precise, reproducible scoring. After semantic deduplication the verified release splits into **3,504 training pairs and 5,000 evaluation pairs**, with all 1,642 tools represented in the evaluation set.
- A **multi-stage verification pipeline** combining LLM-based validation, sandboxed terminal execution, and human-in-the-loop refinement to guarantee both semantic correctness and practical executability.
- **Runtime-free verifiable rewards** derived from the fine-grained deterministic signals, usable directly for supervised fine-tuning and reinforcement learning without a live environment.

## Technical Approach

The dataset is grounded in tool documentation (manuscripts) so each query maps to a canonical command form; evaluation normalizes aliases so equivalent invocations are not penalized. Correctness is established by three layers — an LLM judge, actual sandboxed execution on Kali Linux, and human review — which together produce deterministic per-command signals. Those same signals double as reward functions for training, so the benchmark doubles as a training substrate.

Models are evaluated under **three named settings** that vary how much tool information is given:
- **Unrestricted** — only the natural-language query; the model must infer both the tool and its arguments.
- **Restricted** — the query plus a randomly sampled list of 20 candidate tool names including the correct one (reduces the selection search space, still requires argument construction).
- **Hinted** — candidate tools plus their official documentation, approximating schema-based function-calling benchmarks.

Model outputs are parsed with Python's `shlex` (shell-style lexical analysis) to emulate Kali CLI parsing **without executing** the commands, enabling deterministic component-wise scoring. The fine-grained metrics are: **Tool Accuracy** (correct tool selected), **Optional-Argument F1** (alias-aware flag-name matching), **Positional-Argument F1** (ordered multiset matching), **Total Score** (mean of tool and argument scores), and **Exact Correct** (tool and all arguments match ground truth; aliases and reordered optional flags permitted, positional order respected).

## Results

- Across the three modes and 24 configurations of general-purpose and security-focused open-weight models, **no open-weight model exceeds 42% exact-command accuracy** in the unrestricted setting (best: ~41.3%, a ~753B-class open model) — evidence that accurate CLI-based security tool use is hard without explicit hints.
- Tool documentation drives the largest single gains: average exact-command accuracy climbs from ~22.3% to ~73.1% when hints/documentation are provided — argument construction, not intent understanding, is the main bottleneck.
- Supervised fine-tuning plus reinforcement learning (SFT + GRPO) with KaliBench-derived verifiable rewards raises an 8B model's average total score from 71.7 to **79.2** — within ~1 point of a ~685B MoE model (80.2).

## Relevance to Our Domain

For DevSecOps teams building LLM-driven security copilots, KaliBench offers a reproducible, deterministic way to measure and improve the specific capability that matters in practice — emitting commands that run. The runtime-free reward signal is directly reusable for training smaller security-specialized models without standing up an execution environment per evaluation. It also sets a realistic baseline (sub-42% exact accuracy) against which "security LLM" claims can be sanity-checked.

## References

- Paper: https://arxiv.org/abs/2610.02206
- Project / code: https://risys-lab.github.io/KaliBench/ · https://github.com/RISys-Lab/KaliBench
- Verified dataset (Hugging Face): https://huggingface.co/datasets/RISys-Lab/KaliBench
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2610.02206

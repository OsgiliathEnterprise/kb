---
title: 'Model Triage and Routing: Cost-Effective Agentic AI Architecture'
diataxis: Explanation
domain: AI-Infrastructure
topic: AI-Strategy
source: The New Stack
source_url: https://thenewstack.io/claude-fable-cost-model-triage/
date: 2026-06-18
keywords:
- knowledge-base
- AI-Strategy
- AI-Infrastructure
- explanations
---
# Model Triage and Routing: Cost-Effective Agentic AI Architecture

## Overview

Model triage is the practice of routing different agentic AI tasks to different models based on cost-benefit analysis. As frontier models become increasingly expensive and agentic workflows consume 1,000x the tokens of ordinary code chat, strategic model selection has become a critical engineering skill.

**Case study**: Mitchell Hashimoto's benchmark showed Claude Fable cost $9 for a coding task, GPT-5.5 cost $1.50, and Zhipu GLM-5.1 cost under $1 — all producing equally acceptable results.

## The Economics Problem

### Token Consumption in Agentic Workflows

| Metric | Ordinary Chat | Agentic Coding | Multiplier |
|--------|--------------|----------------|------------|
| Tokens per session | ~4,000 | ~4,000,000 | 1,000x |
| Cost variance (identical tasks) | ±10% | ±3,000% | 30x |
| Tokens → Quality correlation | Moderate | Weak | N/A |

### Frontier Model Pricing (June 2026)

| Model | Input ($/M tokens) | Output ($/M tokens) | Notes |
|-------|-------------------|---------------------|-------|
| Claude Fable | $10 | $50 | 2x Opus 4.8 pricing |
| GPT-5.5 | ~$2 | ~$10 | Mid-tier pricing |
| Zhipu GLM-5.1 | &lt;$1 | &lt;$5 | Budget frontier |

**Note**: Fable subscription plans leave on June 23, 2026 — per-token pricing becomes the only option.

## Model Triage Framework

### Task Classification Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│              Model Selection Decision Matrix                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Task Difficulty ──>  Low              Medium          High         │
│                    ┌─────────────┬─────────────┬─────────────┐      │
│   Routine          │ Budget      │ Budget      │ Mid-tier    │      │
│   (repeatable)     │ models      │ models      │ models      │      │
│                    ├─────────────┼─────────────┼─────────────┤      │
│   Creative         │ Mid-tier    │ Mid-tier    │ Frontier    │      │
│   (novel)          │ models      │ models      │ models      │      │
│                    ├─────────────┼─────────────┼─────────────┤      │
│   Surgical         │ Mid-tier    │ Frontier    │ Frontier    │      │
│   (precision)      │ models      │ models      │ models      │      │
│                    └─────────────┴─────────────┴─────────────┘      │
│                                                                     │
│  Budget models: GLM-5.1, Gemma variants                              │
│  Mid-tier models: GPT-5.5, Claude Haiku                               │
│  Frontier models: Claude Fable, Opus 4.8                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Loop Engineering Pattern

The optimal architecture routes different models to different steps in an agent loop:

```
┌─────────────────────────────────────────────────────────────────────┐
│          Multi-Model Agent Loop Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
│  │ Orchestrate│   │ Execute  │    │ Review   │                      │
│  │ (Plan)    │───>│ (Code)   │───>│ (Verify) │                      │
│  └─────┬────┘    └─────┬────┘    └─────┬────┘                      │
│        │               │               │                            │
│        ▼               ▼               ▼                            │
│   Frontier model   Budget model    Frontier model                   │
│   (reasoning)      (execution)     (quality gate)                   │
│        │               │               │                            │
│        └───────┬───────┴───────┬───────┘                            │
│                │               │                                    │
│                ▼               ▼                                    │
│         Pass? ──Yes──> Merge   No──> Loop back                      │
│                                                                     │
│  Cost savings: ~50% reduction in weekly burn rate                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Principles

### 1. Not All Tasks Need Frontier Models

- **Planning/review**: Requires strong reasoning → Frontier models justified
- **Execution**: Pattern-based code generation → Budget models sufficient
- **Routine maintenance**: Well-defined tasks → Budget models optimal

### 2. Token Economics Are Unpredictable

- Identical runs vary by up to 30x in token consumption
- More tokens do NOT reliably buy more accuracy
- Cost per task is harder to predict than cost per token

### 3. Frontier Tokens May Be Mispriced

- **Too expensive** for routine work (code generation, refactoring)
- **Too cheap** for surgical work (complex optimization, novel architecture)
- The sweet spot is task-specific model routing

## Implementation Patterns

### Per-Step Model Selection

```python
# Pseudocode: Model routing based on task type
def select_model(task_type, complexity):
    if task_type == "planning":
        return "claude-fable"  # Strong reasoning needed
    elif task_type == "execution" and complexity == "low":
        return "glm-5.1"  # Budget model for routine tasks
    elif task_type == "execution" and complexity == "high":
        return "gpt-5.5"  # Mid-tier for complex execution
    elif task_type == "review":
        return "claude-fable"  # Quality gate needs precision
    else:
        return "gemma-4"  # Default budget option
```

### Budget-Aware Loop Design

```yaml
# Agent loop configuration with model routing
agent_loop:
  max_iterations: 10
  budget_per_iteration: $2.00
  model_routing:
    planning: claude-fable
    execution: glm-5.1
    review: claude-fable
    fallback: gemma-4
  cost_controls:
    hard_limit: $50.00
    soft_limit: $30.00
    auto_downgrade: true  # Switch to cheaper model if over budget
```

## Measured Results

### Mitchell Hashimoto Benchmark

| Model | Cost | Time | Quality | Best For |
|-------|------|------|---------|----------|
| Claude Fable | $9.00 | 40 min | Excellent | Surgical optimization |
| GPT-5.5 | $1.50 | 25 min | Good | General feature work |
| GLM-5.1 | &lt;$1.00 | 20 min | Acceptable | Routine tasks |

### Real-World Cost Comparison

- **$40 SwiftUI optimization task**: Fable beat manual engineering (justified)
- **"Implement this feature" task**: All three models produced acceptable results
- **Weekly burn rate**: 50% reduction with proper model routing

## Key Takeaways

1. **Model triage is now an engineering skill** — Not optional for teams running agentic AI
2. **Loop engineering replaces direct prompting** — Design workflows with per-step model decisions
3. **Token consumption is highly variable** — Budget for 30x variance in identical runs
4. **Multi-model routing halves costs** — Use expensive models for planning/review, cheap models for execution
5. **Frontier models are overkill for routine work** — Save them for tasks where reasoning quality matters

## References

- [Claude Fable cost $9, GPT-5.5 cost $1.50: Model triage is the new AI skill](https://thenewstack.io/claude-fable-cost-model-triage/)
- [Mitchell Hashimoto: Agentic AI Cost Analysis](https://mitchellh.com/)
- [Loop Engineering: Design the System That Prompts Your Agent](https://www.youngju.dev/blog/ai/2026-06-12-loop-engineering-agentic-coding-systems.en)

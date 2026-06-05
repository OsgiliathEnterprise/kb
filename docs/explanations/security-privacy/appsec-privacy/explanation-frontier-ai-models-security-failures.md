---
title: 'Frontier AI Models Fail Under Multi-Turn Attacks: Cisco Research Findings'
diataxis: Explanation
domain: Security & Privacy
topic: AppSec & Privacy
source: The New Stack
source_url: https://thenewstack.io/cisco-frontier-ai-models-fail/
keywords:
- knowledge-base
- AppSec & Privacy
- Security & Privacy
- explanations
---
# Frontier AI Models Fail Under Multi-Turn Attacks: Cisco Research Findings

## Summary

Cisco tested 15 flagship AI models from OpenAI, Anthropic, Google, Amazon, and xAI and found that the safety benchmarks guiding enterprise purchases consistently understate how those models break down under sustained, multi-turn attacks. Every model failed a non-trivial share of multi-turn attacks, with success rates ranging from **7.89% to 88.30%** — a dramatically wider spread than the single-turn range of 2.19% to 64.91%.

## Why This Matters

The research reveals a fundamental gap between how AI safety is measured (single-turn benchmarks) and how AI systems are actually used in production (multi-turn, iterative interactions). Single-turn performance is a **poor predictor** of multi-turn resilience, with cross-regime deltas swinging as high as **55 percentage points** in both directions. This has major implications for enterprise AI procurement, risk assessment, and safety governance.

## Key Findings

### The Single-Turn vs Multi-Turn Gap

| Metric | Single-Turn Range | Multi-Turn Range |
|--------|-------------------|------------------|
| Attack Success Rate (ASR) | 2.19% – 64.91% | 7.89% – 88.30% |
| Max Cross-Regime Delta | — | 55 percentage points |

**Single-turn** is a one-and-done interaction. **Multi-turn** is a continuous back-and-forth dialogue where an attacker can iteratively refine their approach.

### Model-Specific Results

| Model | Single-Turn ASR | Multi-Turn ASR | Change |
|-------|----------------|----------------|--------|
| Gemini 3 Pro | 18.10% | 73.35% | **+55.25pp** (4× increase) |
| GPT-5.4 (OpenAI) | 2.74% | 24.68% | **+21.94pp** (9× increase) |
| Grok 4.1 Fast (non-reasoning) | — | 88.30% | Highest cohort ASR |
| Grok 4.1 Fast (reasoning mode) | — | 43.47% | **-44.83pp** vs non-reasoning |
| Claude family (Anthropic) | 2.19% – 3.64% | 11.16% – 16.20% | Best multi-turn resilience |
| Nova 2 Lite (Amazon) | 34.00% | 7.89% | **Lowest multi-turn ASR** |

### Key Observations

1. **Claude family performed best overall** in multi-turn conditions, with ASRs of 11.16%–16.20% under iterative attack — still elevated from single-turn baselines but well below most of the cohort.

2. **Amazon's Nova variants produced counterintuitive results**: high single-turn failure rates but *lower* multi-turn ASR. Nova 2 Lite posted 34% single-turn ASR yet achieved the lowest multi-turn ASR at 7.89%.

3. **Configuration matters enormously**: Grok 4.1 Fast showed a 44.83 percentage-point swing between reasoning and non-reasoning modes — a single configuration change halved the attack success rate.

4. **Cisco argues** that this kind of configuration-driven safety variation isn't captured by any public benchmark or model card and that AI providers should disclose safety-relevant effects of deployment-time settings alongside capability benchmarks.

## Attack Strategy Analysis

Cisco decomposed multi-turn outcomes across **five attack strategy families**. Within each family, the spread between the most- and least-exposed models ranged from **79 to 89 percentage points**, meaning a model's vulnerability depends heavily on the specific attack strategy used.

### Single-Turn Attack Procedure Rankings

| Procedure | Weighted ASR |
|-----------|-------------|
| Imposter AI | 37.50% (highest — 14pp above 10th-ranked) |
| Soft Paraphrase | 2nd |
| System Prompts | 3rd |
| Hate Speech | — |
| Profanity | — |
| Specialized Advice | — |

### Attack Categories

- **Procedural attacks**: Imposter AI, Soft Paraphrase, System Prompts
- **Content-based attacks**: Hate Speech, Profanity, Specialized Advice

## Important Caveats

Cisco tested **base models without system prompts, content filters, or custom orchestration**. Real enterprise deployments typically include those controls, which could shift outcomes in either direction:

- **Positive**: Additional safety layers may reduce attack success
- **Negative**: Complex orchestration may introduce new attack surfaces

## The Broader Message

> "Safety remains a continuous, regime-dependent property rather than a binary certification, even for frontier models from leading providers."

This means:

1. **No model is "safe"** — all frontier models showed meaningful vulnerability under sustained attack
2. **Benchmarks are incomplete** — single-turn safety scores don't predict multi-turn resilience
3. **Configuration is a safety variable** — deployment settings dramatically affect security posture
4. **Safety is regime-dependent** — what holds under one interaction pattern may fail under another

## Implications for Enterprise AI

### Procurement & Risk Assessment
- Single-turn safety benchmarks should **not** be the sole criterion for model selection
- Multi-turn attack testing should be part of vendor evaluation
- Configuration options (e.g., reasoning modes) should be evaluated for safety impact

### Deployment Practices
- System prompts, content filters, and orchestration layers are essential safety controls
- Configuration choices have measurable safety impact and should be documented
- Continuous monitoring for multi-turn attack patterns is necessary

### Governance
- Safety should be treated as an ongoing property, not a one-time certification
- Model cards should include multi-turn safety data and configuration-dependent safety effects
- Organizations should develop their own multi-turn testing frameworks

## Key Takeaways

1. **Multi-turn attacks are significantly more effective** than single-turn attacks across all frontier models tested
2. **Single-turn benchmarks are poor predictors** of real-world multi-turn safety
3. **Configuration choices matter** — a single setting change can swing ASR by 45+ percentage points
4. **No model is immune** — even the best-performing models showed meaningful vulnerability
5. **Safety is continuous and regime-dependent** — not a binary certification
6. **Vendor transparency is lacking** — configuration-driven safety effects aren't disclosed in public benchmarks

## Common Pitfalls

- **Assuming benchmark scores reflect production safety** — single-turn benchmarks dramatically understate risk
- **Ignoring configuration impact** — deployment settings can double or halve vulnerability
- **Treating safety as a one-time assessment** — safety degrades under sustained, iterative attack
- **Over-relying on vendor safety claims** — no public benchmark captures multi-turn resilience

## References

- [Original article: "OpenAI, Anthropic, Google, Amazon, and xAI all fail on type of attack, study finds" — The New Stack](https://thenewstack.io/cisco-frontier-ai-models-fail/)
- Cisco Frontier AI Model Security Research (referenced in article)

---

```excalidraw
* Excalidraw - Frontier AI Multi-Turn Attack Patterns
  - type: drawing
  - version: 2.1

{
  "type": "excalidraw",
  "elements": [
    {
      "id": "attacker",
      "type": "rectangle",
      "x": 80,
      "y": 200,
      "width": 140,
      "height": 70,
      "strokeColor": "#e74c3c",
      "backgroundColor": "#fadbd8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": "Adversary\n(Multi-Turn)\nAttacker",
      "fontSize": 14,
      "fontFamily": 1
    },
    {
      "id": "single-turn",
      "type": "diamond",
      "x": 320,
      "y": 80,
      "width": 180,
      "height": 100,
      "strokeColor": "#f39c12",
      "backgroundColor": "#fdebd0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": "Single-Turn\nBenchmark\n(One-Shot)",
      "fontSize": 13,
      "fontFamily": 1
    },
    {
      "id": "multi-turn",
      "type": "diamond",
      "x": 320,
      "y": 230,
      "width": 180,
      "height": 100,
      "strokeColor": "#e74c3c",
      "backgroundColor": "#fadbd8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": "Multi-Turn\nIterative Attack\n(Back & Forth)",
      "fontSize": 13,
      "fontFamily": 1
    },
    {
      "id": "model",
      "type": "rectangle",
      "x": 600,
      "y": 140,
      "width": 160,
      "height": 120,
      "strokeColor": "#2980b9",
      "backgroundColor": "#d6eaf8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": "Frontier AI\nModel\n(15 tested)",
      "fontSize": 14,
      "fontFamily": 1
    },
    {
      "id": "arrow-single",
      "type": "arrow",
      "x": 260,
      "y": 130,
      "width": 60,
      "height": 0,
      "strokeColor": "#f39c12",
      "strokeWidth": 2,
      "startArrow": "none",
      "endArrow": "arrow",
      "points": [0,0,140,0]
    },
    {
      "id": "arrow-multi",
      "type": "arrow",
      "x": 260,
      "y": 280,
      "width": 60,
      "height": 0,
      "strokeColor": "#e74c3c",
      "strokeWidth": 3,
      "startArrow": "none",
      "endArrow": "arrow",
      "points": [0,0,140,0]
    },
    {
      "id": "result-safe",
      "type": "rectangle",
      "x": 820,
      "y": 80,
      "width": 160,
      "height": 60,
      "strokeColor": "#27ae60",
      "backgroundColor": "#d5f5e3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": "✅ Appears Safe\nSingle-Turn ASR\n2.19% – 64.91%",
      "fontSize": 12,
      "fontFamily": 1
    },
    {
      "id": "result-breach",
      "type": "rectangle",
      "x": 820,
      "y": 230,
      "width": 160,
      "height": 60,
      "strokeColor": "#e74c3c",
      "backgroundColor": "#fadbd8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": "❌ Breached\nMulti-Turn ASR\n7.89% – 88.30%",
      "fontSize": 12,
      "fontFamily": 1
    },
    {
      "id": "arrow-to-safe",
      "type": "arrow",
      "x": 760,
      "y": 110,
      "width": 50,
      "height": 0,
      "strokeColor": "#27ae60",
      "strokeWidth": 2,
      "startArrow": "none",
      "endArrow": "arrow",
      "points": [0,0,60,0]
    },
    {
      "id": "arrow-to-breach",
      "type": "arrow",
      "x": 760,
      "y": 260,
      "width": 50,
      "height": 0,
      "strokeColor": "#e74c3c",
      "strokeWidth": 2,
      "startArrow": "none",
      "endArrow": "arrow",
      "points": [0,0,60,0]
    },
    {
      "id": "attack-strategies",
      "type": "rectangle",
      "x": 80,
      "y": 380,
      "width": 300,
      "height": 140,
      "strokeColor": "#8e44ad",
      "backgroundColor": "#e8daef",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": "5 Attack Strategy Families\n━━━━━━━━━━━━━━━━━━━━━━\n1. Imposter AI (37.5% ASR)\n2. Soft Paraphrase\n3. System Prompts\n4. Hate Speech / Profanity\n5. Specialized Advice",
      "fontSize": 12,
      "fontFamily": 1
    },
    {
      "id": "config-box",
      "type": "rectangle",
      "x": 600,
      "y": 380,
      "width": 380,
      "height": 140,
      "strokeColor": "#d35400",
      "backgroundColor": "#fae5d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": "Configuration Impact\n━━━━━━━━━━━━━━━━━━━━━━\nGrok 4.1 Fast:\n  Non-reasoning: 88.30% ASR\n  Reasoning mode: 43.47% ASR\n  Δ = -44.83 percentage points\n\n⚠️ No public benchmark captures\n   this configuration-driven safety\n   variation",
      "fontSize": 12,
      "fontFamily": 1
    },
    {
      "id": "key-finding",
      "type": "rectangle",
      "x": 320,
      "y": 560,
      "width": 660,
      "height": 60,
      "strokeColor": "#c0392b",
      "backgroundColor": "#f9ebea",
      "fillStyle": "solid",
      "strokeWidth": 3,
      "text": "KEY FINDING: Single-turn safety scores are poor predictors of multi-turn\nresilience. Safety is continuous and regime-dependent, not binary.",
      "fontSize": 13,
      "fontFamily": 1
    },
    {
      "id": "arrow-attacker-to-single",
      "type": "arrow",
      "x": 150,
      "y": 170,
      "width": 0,
      "height": -40,
      "strokeColor": "#f39c12",
      "strokeWidth": 1,
      "startArrow": "none",
      "endArrow": "arrow",
      "points": [0,0,0,-40]
    },
    {
      "id": "arrow-attacker-to-multi",
      "type": "arrow",
      "x": 150,
      "y": 270,
      "width": 0,
      "height": 0,
      "strokeColor": "#e74c3c",
      "strokeWidth": 2,
      "startArrow": "none",
      "endArrow": "arrow",
      "points": [0,0,170,0]
    },
    {
      "id": "arrow-strategies-to-multi",
      "type": "arrow",
      "x": 230,
      "y": 380,
      "width": 0,
      "height": -100,
      "strokeColor": "#8e44ad",
      "strokeWidth": 1,
      "startArrow": "none",
      "endArrow": "arrow",
      "points": [0,0,0,-100]
    },
    {
      "id": "delta-label",
      "type": "text",
      "x": 420,
      "y": 190,
      "width": 50,
      "height": 30,
      "strokeColor": "#e74c3c",
      "backgroundColor": "transparent",
      "text": "Δ up to 55pp",
      "fontSize": 11,
      "fontFamily": 1
    }
  ]
}
```

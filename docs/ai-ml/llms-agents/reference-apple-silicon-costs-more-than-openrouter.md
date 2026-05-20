---
title: "Apple Silicon costs more than OpenRouter"
description: "Apple Silicon costs more than OpenRouter"
tags: [reference,documentation, AI & Machine Learning]
date: 2026-05-17
sidebar_label: Apple Silicon costs more than OpenRouter
---


# Apple Silicon costs more than OpenRouter

## Summary
Detailed cost analysis comparing local LLM inference on Apple Silicon (M5 MacBook Pro) versus cloud inference via OpenRouter. The analysis shows that for most use cases, cloud inference is 3x cheaper per million tokens, with local inference costing ~$0.40-$4.79 per million tokens vs. OpenRouter's ~$0.38-$0.50 for comparable models like Gemma 4 31B.

## Key Points
- **Electricity cost**: ~$0.20/kWh, at 50-100W under load = $0.009-$0.018/hour (~$0.48/day at 100% utilization)
- **Hardware cost dominates**: M5 Max MacBook Pro (64GB) at $4,299, amortized over 3-10 years = $0.05-$0.16/hour
- **Token throughput**: 10-40 tokens/second for Gemma 4 31B on M5 Max (36K-144K tokens/hour)
- **Price per million tokens**: $0.40-$4.79 depending on lifespan and throughput assumptions
- **OpenRouter comparison**: ~$0.38-$0.50 per million tokens for Gemma 4 31B, at 60-70 tokens/second (3-7x faster)
- **Bottom line**: Local inference on Apple Silicon is ~3x the cost of OpenRouter for comparable models; cloud makes more economic sense for most users

## Cost Breakdown (M5 Max, 64GB, $4,299)

| Lifespan | Cost/Year | Cost/Hour | $/M Tokens (10 tok/s) | $/M Tokens (40 tok/s) |
|----------|-----------|-----------|-----------------------|-----------------------|
| 3 years  | $1,433    | $0.164    | $4.79                 | $1.20                 |
| 5 years  | $860      | $0.098    | $2.94                 | $0.74                 |
| 10 years | $430      | $0.049    | $1.61                 | $0.40                 |

## Implications
- For a developer whose salary far exceeds token costs, cloud inference is more economical
- Local inference's value proposition is privacy/offline capability, not cost savings
- Gemma 4 31B on Apple Silicon approaches Anthropic Sonnet-level performance

## References
- 📰 Original: [Apple Silicon costs more than OpenRouter](https://www.williamangel.net/blog/2026/05/17/offline-llm-energy-use.html) via Hacker News (2026-05-17)
- 🔍 [EIA Electricity Prices](https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=table_5_03)

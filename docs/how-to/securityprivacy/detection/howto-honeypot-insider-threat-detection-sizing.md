---
title: 'When Suspicion Adds Up: A Stochastic Framework for Optimizing Honeypot-Based
  Insider-Threat Detection'
diataxis: How-to Guide
domain: security-privacy
topic: detection
source: arXiv
source_url: https://arxiv.org/abs/2611.26353
keywords:
- knowledge-base
- detection
- security-privacy
- how-to
---
# When Suspicion Adds Up: A Stochastic Framework for Optimizing Honeypot-Based Insider-Threat Detection

## Overview
Mehrani, Tavakoli, Afshinfar and Nikoofard (Islamic Azad University, Nov 2026) turn honeypot deployment for insider-threat detection from an art into a calculation. Honeypots are attractive for insider threats because they only trigger on deliberate unauthorised access — no user profiling, few false positives — but their utility collapses without the right *number* of traps and the right *monitoring window*. The paper derives closed-form expressions to set both.

## Problem Statement
Two decisions dominate honeypot effectiveness and are usually made by intuition: how many honeypots to deploy, and how long to monitor them. The paper formalises the interaction between the **cumulative honeypot compromise rate** and the **time to first attack**, and studies how **non-stationary attacker behaviour** (e.g. an active scanning phase) breaks naive designs.

## How-to: Size and schedule a honeypot-based insider-threat deployment
### Steps
1. **Model the threat stochastically.** Characterise the attacker's time-to-first-attack distribution and the cumulative compromise rate of a single honeypot over the monitoring window.
2. **Check for non-stationarity.** If attacker behaviour includes distinct phases (active scanning vs. dormancy), model them explicitly — the optimal policy changes qualitatively across regimes.
3. **Compute the optimal number of honeypots** from the paper's closed-form expression, which balances expected compromise events against deployment cost.
4. **Compute the optimal monitoring duration** from the companion closed form, chosen to capture the first-attack time distribution without paying indefinite monitoring cost.
5. **Validate across regimes.** The authors' numerical experiments show the policy is robust across stationary and non-stationary attacker behaviours, and that the two knobs (count, duration) are coupled — re-tune both when attacker behaviour shifts.

## Results
Analytical derivation of both quantities plus numerical experiments demonstrating a systematic, quantitatively grounded deployment policy; robustness under non-stationary attacker phases is explicitly evaluated.

## Relevance to Our Domain
Practical, citable decision procedure for deception technology in enterprise environments — fits our DevSecOps/insider-threat and detection coverage. Unlike profiling-based IDS, the honeypot approach sidesteps false-positive storms; the missing piece has always been "how many, how long", which this supplies analytically.

## References
- Paper: https://arxiv.org/abs/2611.26353
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.26353?fields=citationCount,year (rate-limited at check time; 2026)

## Related
- [[reference-hunters-a-second-edition-ai-soc-triage]] — AI-assisted triage pipelines
- [[explanation-when-does-calibration-matter]] — threshold policy tuning under noisy scores

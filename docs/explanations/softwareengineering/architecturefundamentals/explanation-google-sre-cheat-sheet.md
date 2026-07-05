---
title: 'Google SRE Review: A Cheat Sheet for Site Reliability Engineering'
diataxis: Explanation
domain: Software-Engineering
topic: Architecture-Fundamentals
source: DEV.to (limacon23)
source_url: https://dev.to/limacon23/google-sre-review-cheat-sheet-2hih
date: 2026-07-05
keywords:
- knowledge-base
- Architecture-Fundamentals
- Software-Engineering
- explanations
---
# Google SRE Review: A Cheat Sheet for Site Reliability Engineering

## Overview

**Site Reliability Engineering (SRE)** is a discipline pioneered by Google that applies software engineering principles to operations problems. This note distills the core SRE concepts, metrics, and practices into a structured reference — covering SLIs/SLOs/SLAs, error budgets, incident management, reliability patterns, and the SRE book's key frameworks.

---

## The SRE Triangle: SLI, SLO, SLA

These three concepts form the foundation of reliability engineering:

| Concept | Full Name | Definition | Audience |
|---------|-----------|------------|----------|
| **SLI** | Service Level Indicator | A measurable metric of service behavior (e.g., latency p99, availability %) | Internal |
| **SLO** | Service Level Objective | A target value or range for an SLI (e.g., "99.9% availability over 30 days") | Internal |
| **SLA** | Service Level Agreement | A contractual commitment with consequences (financial penalties) for breach | External |

### Example

```yaml
# SLI: HTTP request success rate over a rolling 28-day window
# SLO: ≥ 99.9% success rate
# SLA: ≥ 99.5% or customer gets service credits
```

**Key principle**: SLAs should be more conservative than SLOs. Your SLO is what you aim for; your SLA is what you guarantee.

---

## Error Budgets

An **error budget** is the amount of unreliability you are allowed to have:

```
Error Budget = 1 - SLO Target
```

| SLO | Error Budget | Downtime Allowed (per month) |
|-----|-------------|------------------------------|
| 99.9% | 0.1% | ~43 minutes |
| 99.95% | 0.05% | ~22 minutes |
| 99.99% | 0.01% | ~4.3 minutes |
| 99.999% | 0.001% | ~26 seconds |

### Error Budget Burn Rate

Google SRE recommends **multi-window burn rate alerts**:

| Window | Burn Rate | Alert Threshold |
|--------|-----------|-----------------|
| 1 hour | 14.4× | Budget depleted in ~2.7 days |
| 6 hours | 6× | Budget depleted in ~4.8 days |
| 1 day | 3× | Budget depleted in ~9.3 days |
| 1 week | 1.4× | Budget depleted in ~21 days |

**Action**: When error budget is consumed too quickly, halt deployments and focus on reliability. When budget is healthy, teams can push new features.

---

## Core SRE Practices

### 1. Toil Reduction

**Toil** is manual, repetitive, automatable work that scales linearly with service size.

| Toil Example | Automation Strategy |
|-------------|---------------------|
| Manual deployment | CI/CD pipelines |
| Password resets | Self-service portals |
| Server provisioning | Infrastructure as Code |
| Log triage | Automated alerting + runbooks |

**Rule**: SRE teams should spend at most **50%** of their time on operations (toil), and **50%** on engineering (automation, reliability improvements).

### 2. Incident Management

The SRE incident lifecycle:

```
Detection → Triage → Response → Recovery → Postmortem → Follow-up
```

**Key principles**:
- **Blameless postmortems**: Focus on system failures, not individual mistakes
- **Runbooks**: Documented procedures for common incidents
- **On-call rotation**: Shared responsibility, not a single hero
- **Severity levels**: SEV-1 (critical) through SEV-4 (minor)

### 3. Monitoring and Alerting

The **Golden Signals** of monitoring:

| Signal | Metric | Example |
|--------|--------|---------|
| **Latency** | Response time distribution | p50, p95, p99 |
| **Traffic** | Request rate | requests/sec |
| **Errors** | Failure rate | 5xx responses |
| **Saturation** | Resource utilization | CPU, memory, disk |

**Alerting principles**:
- Alert on **symptoms**, not causes
- Every alert should have a **runbook**
- Reduce alert fatigue by grouping and prioritizing
- Use **burn rate alerts** for error budget consumption

### 4. Capacity Planning

```
Current Usage → Growth Rate → Forecast → Provisioning → Validation
```

- Use **time-series analysis** on historical metrics
- Plan for **peak usage** (not average)
- Conduct **load testing** and **chaos engineering** regularly

---

## Reliability Patterns

### Circuit Breaker

Prevents cascading failures by stopping requests to unhealthy downstream services:

```
Client → Circuit Breaker → Service
              │
              ├─ Closed: requests pass through
              ├─ Open: requests fail fast
              └─ Half-Open: test requests to check recovery
```

### Bulkhead Isolation

Partition resources so that failure in one partition doesn't affect others:

```
┌─────────────────────────────────────┐
│          Application Pool            │
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │ Pool A│ │ Pool B│ │ Pool C│     │
│  │(users)│ │(admin)│ │(batch)│     │
│  └───────┘ └───────┘ └───────┘     │
└─────────────────────────────────────┘
```

### Rate Limiting and Backpressure

- **Token bucket**: Allow bursts up to a limit, then throttle
- **Leaky bucket**: Smooth out request rates
- **Queue-based**: Buffer requests when downstream is slow

---

## The SRE Book's Key Concepts

### Workload Classification

| Class | Description | Example |
|-------|-------------|---------|
| **Class 1** | Non-critical, can be dropped | Analytics, logging |
| **Class 2** | Important, can be delayed | Background jobs |
| **Class 3** | Critical, must succeed | User-facing requests |

### Availability Calculations

```
99% = "two nines" = 3.65 days downtime/year
99.9% = "three nines" = 8.76 hours/year
99.99% = "four nines" = 52.56 minutes/year
99.999% = "five nines" = 5.26 minutes/year
```

### Deployment Strategies

| Strategy | Downtime | Risk | Complexity |
|----------|----------|------|------------|
| Rolling update | None | Medium | Low |
| Blue-green | None | Low | Medium |
| Canary | None | Low | High |
| Feature flags | None | Lowest | Medium |

---

## SRE vs. DevOps

| Aspect | DevOps | SRE |
|--------|--------|-----|
| Origin | Cultural movement | Google's implementation |
| Focus | Collaboration, automation | Reliability, error budgets |
| Metrics | DORA metrics (deployment frequency, lead time) | SLIs, SLOs, error budgets |
| Philosophy | "You build it, you run it" | "50% engineering, 50% ops" |

**Key insight**: SRE is one concrete implementation of DevOps principles.

---

## References

- [Google SRE Review Cheat Sheet](https://dev.to/limacon23/google-sre-review-cheat-sheet-2hih) — DEV.to, July 2026
- [Site Reliability Engineering (Google SRE Book)](https://sre.google/sre-book/table-of-contents/)
- [Google SRE Workbook](https://sre.google/sre-workbook/)
- [DORA Metrics](https://cloud.google.com/blog/products/devops-sre/accelerate-dora-kpis)

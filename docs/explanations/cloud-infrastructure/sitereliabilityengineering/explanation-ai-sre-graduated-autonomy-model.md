---
title: 'AI in SRE: The Graduated Autonomy Model for Self-Healing Infrastructure'
diataxis: Explanation
domain: Cloud & Infrastructure
topic: Site-Reliability-Engineering
source: DZone AI/ML
source_url: https://dzone.com/articles/ai-sre-self-healing
date: 2026-07-30
keywords:
- knowledge-base
- Site-Reliability-Engineering
- Cloud & Infrastructure
- explanations
---
# AI in SRE: The Graduated Autonomy Model for Self-Healing Infrastructure

## Overview

Most SRE teams don't need another dashboard — they need a safer way to move from "something is wrong" to "we know what to do next." The key insight is that **self-healing infrastructure is not about removing SREs from production**. It is about removing the repetitive, low-risk work that slows them down during incidents.

The model that works best is **graduated autonomy**: let the system act automatically only when the action is well understood, reversible, and narrow in blast radius. For everything else, the system collects evidence, recommends the next step, and keeps humans in control.

## Why Static Alerts Stop Scaling

Threshold-based alerts don't understand context:
- A CPU spike during a scheduled batch job may be normal; the same spike during steady-state traffic may be a retry storm
- A latency increase in one region may be harmless during a controlled deployment, but suspicious if it appears across multiple availability zones with no recent change event

At enterprise scale, engineers are no longer tuning alerts — they are negotiating with noise. The most useful improvement is not adding more alerts, but **grouping alerts around dependency context** and suppressing repeated downstream symptoms.

## The Anomaly Detection Pipeline

### Stage 1: Signal Collection and Normalization

Collect metrics, logs, traces, and change events. Normalize by service, region, dependency, and time window.

### Stage 2: Scoring Against Learned Baselines

ML-based anomaly detection learns a service's normal operating shape instead of relying on fixed thresholds:

```python
from dataclasses import dataclass
from typing import List

@dataclass
class MetricWindow:
    service: str
    region: str
    signal: str
    values: List[float]
    recent_deploy: bool = False

@dataclass
class AnomalyScore:
    service: str
    region: str
    signal: str
    score: float
    reason: str

class BaselineModel:
    def expected_range(self, service: str, region: str, signal: str):
        # In production: trained model, feature store, or rolling baseline
        return (0.0, 1.0)

def score_window(window: MetricWindow, baseline: BaselineModel) -> AnomalyScore:
    low, high = baseline.expected_range(window.service, window.region, window.signal)
    latest = window.values[-1]
    
    if latest > high:
        distance = (latest - high) / max(high, 0.001)
        reason = f"{window.signal} above learned baseline"
    elif latest < low:
        distance = (low - latest) / max(abs(low), 0.001)
        reason = f"{window.signal} below learned baseline"
    else:
        distance = 0.0
        reason = "within learned baseline"
    
    if window.recent_deploy and distance > 0:
        reason += " during recent deployment window"
    
    return AnomalyScore(
        service=window.service,
        region=window.region,
        signal=window.signal,
        score=min(distance, 1.0),
        reason=reason,
    )
```

**Key point:** A simple model trained on clean, consistent data beats a sophisticated model trained on messy metrics.

### Stage 3: Dependency-Aware Correlation

During an incident, the useful question is not "Which graph is red?" but "What changed first, and what depends on it?"

A database issue may surface as API latency, retries, queue saturation, and CPU pressure. Without a dependency graph, every downstream service looks guilty. With one, the system ranks likely causes.

**Evidence bundle example:**

```json
{
  "candidate_root_cause": "identity-token-cache",
  "region": "example-region-1",
  "confidence": 0.86,
  "customer_impact": "elevated authentication latency for a subset of requests",
  "supporting_signals": [
    "p99 latency above learned baseline for multiple consecutive windows",
    "cache hit rate dropped below its recent operating range",
    "downstream services showed retry growth after the initial cache anomaly",
    "no database saturation was observed",
    "no deployment was detected in the immediate incident window"
  ],
  "recommended_action": "drain_and_restart_one_cache_node",
  "estimated_blast_radius": "single node in a redundant pool",
  "rollback_plan": "keep node out of rotation if health checks fail after restart"
}
```

## The Graduated Autonomy Model: Three Tiers

### Tier 1: Fully Automated, Low-Risk Actions

Actions the system can execute without waiting for a human when confidence is high.

**Examples:** Restarting one unhealthy instance, scaling out a stateless service, draining one bad node, flushing a bounded cache.

**Pre-flight checks before auto-execution:**
- Action is reversible
- Affected capacity is small
- Redundancy is healthy
- No active global incident
- Same action has not failed recently
- Rollback is defined
- Health checks can verify success quickly

### Tier 2: Automated Recommendation With Human Approval

The system knows what should happen, but the action still needs human approval.

**Examples:** Rolling back a deployment, disabling a feature flag, failing over a database, increasing capacity beyond normal band.

The system prepares the action, shows the evidence, and asks for approval. The human decides whether the action makes sense — not building the command during the incident.

### Tier 3: Human-Led With AI Context

Novel, high-risk, or ambiguous incidents. The system should not execute remediation.

**Examples:** Possible data corruption, multi-region cascading failures, security-sensitive incidents, conflicting signals, low-confidence root-cause analysis.

The system's job is to summarize what it knows, what changed recently, which hypotheses are most likely, and which dashboards or runbooks are relevant.

## Policy Gate: The Decision Engine

The most important design decision is not which ML algorithm to use — it is which actions the system is allowed to take.

```python
from dataclasses import dataclass
from enum import Enum
from typing import List

class Decision(str, Enum):
    AUTO_EXECUTE = "auto_execute"
    REQUEST_APPROVAL = "request_approval"
    HUMAN_LED = "human_led"

@dataclass
class RemediationProposal:
    action: str
    confidence: float
    blast_radius_percent: float
    reversible: bool
    rollback_defined: bool
    service_tier: str
    evidence: List[str]

@dataclass
class RuntimeContext:
    active_global_incident: bool
    recent_failed_action: bool
    healthy_redundancy: bool
    minutes_since_last_same_action: int

TIER_1_ACTIONS = {
    "restart_single_instance",
    "scale_stateless_service",
    "drain_single_node",
    "flush_bounded_cache"
}

TIER_2_ACTIONS = {
    "rollback_deployment",
    "disable_feature_flag",
    "database_failover",
    "regional_traffic_shift"
}

def decide_autonomy(proposal: RemediationProposal, context: RuntimeContext) -> Decision:
    if context.active_global_incident:
        return Decision.HUMAN_LED
    
    if context.recent_failed_action:
        return Decision.HUMAN_LED
    
    if not proposal.rollback_defined:
        return Decision.HUMAN_LED
    
    if proposal.action in TIER_1_ACTIONS:
        safe_enough = all([
            proposal.confidence >= 0.90,
            proposal.blast_radius_percent <= 5.0,
            proposal.reversible,
            context.healthy_redundancy,
            context.minutes_since_last_same_action >= 30,
            len(proposal.evidence) >= 3,
        ])
        return Decision.AUTO_EXECUTE if safe_enough else Decision.REQUEST_APPROVAL
    
    if proposal.action in TIER_2_ACTIONS and proposal.confidence >= 0.75:
        return Decision.REQUEST_APPROVAL
    
    return Decision.HUMAN_LED
```

**Key principle:** In reliable systems, the model proposes; policy disposes.

## Where LLMs Fit in the SRE Control Loop

Large language models should **not** be directly in the execution path for remediation. Their best role is communication and context assembly:

| Responsibility | Technology |
|---------------|-----------|
| Anomaly detection | ML/statistical models |
| Cause ranking | Graph correlation |
| Autonomy decisions | Policy gates (deterministic) |
| Action execution | Deterministic automation |
| Summarization | LLMs |

### What LLMs Should Do
- Draft incident summaries
- Explain evidence bundles
- Turn raw telemetry into timelines
- Identify relevant runbooks
- Prepare post-incident reports

### What LLMs Should NOT Do
- Execute remediation directly
- Make autonomy decisions
- Control production systems

## Building Trust: Shadow Mode First

Before allowing Tier 1 execution:
1. Run in **shadow mode** — detect, correlate, recommend, but do not execute
2. Compare recommendations against what engineers actually did
3. Once the system repeatedly recommends the same low-risk actions humans already take, graduate those actions into Tier 1

**Metrics to track before expanding autonomy:**
- Root-cause precision
- False positives by service
- Recommendation acceptance rate
- Time to useful diagnosis
- Remediation success rate
- Rollback frequency
- Secondary incidents caused by remediation

## Key Lessons

1. **Clean telemetry beats clever models** — Fix the telemetry pipeline before debating LSTMs vs. transformers
2. **Change events are first-class signals** — Deployments, config pushes, schema changes, and feature flag flips explain many anomalies
3. **Alert suppression is not the same as diagnosis** — Preserve the causal path while reducing noise
4. **Automation needs a memory** — Every remediation should leave an audit trail
5. **Start with boring actions** — Restarting one unhealthy node is exactly the right starting point
6. **A self-healing system that fixes one issue but creates another is not healing** — It is moving the incident

## Excalidraw Diagram: Graduated Autonomy Control Loop

```excalidraw
* Excalidraw below
* You can draw in the message, and call draw_excalidraw to update the drawing

{"type":"default","values":{"appScale":1.0,"pageId":"p1","pages":{"p1":{"id":"p1","type":"tumbleweed","name":"Page 1","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":false}},"exportPadding":120,"toView":null,"gridSettings":{"customSize":20,"circular":false,"type":"square","dashed":true},"viewBackgroundColor":"#FFFFFF","theme":"dark","strokeColor":"#e6422c","backgroundColor":"#FFFFFF","fontSize":20,"font":"Cascadia","strokeWidth":2,"roughness":0,"seed":117588423,"view":null,"gridMode":false,"gridModeEnabled":false,"gridStep":5,"gridCounter":3}}
text {"id":"1","x":300.0,"y":40.0,"text":"Graduated Autonomy Model: Self-Healing Infrastructure Control Loop","fontSize":24,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aV","seed":149553083,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"2","x":100.0,"y":150.0,"text":"1. Detect","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aW","seed":154724707,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"3","x":100.0,"y":190.0,"text":"ML anomaly detection","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aX","seed":134999955,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"4","x":100.0,"y":215.0,"text":"vs. learned baseline","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aY","seed":150582691,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"5","x":200.0,"y":230.0,"points":"[0,0],[1,0]","startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bb","seed":277501699,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"6","x":350.0,"y":150.0,"text":"2. Correlate","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bc","seed":163038404,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"7","x":350.0,"y":190.0,"text":"Dependency graph","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bd","seed":163038405,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"8","x":350.0,"y":215.0,"text":"Evidence bundle","fontSize":12,"fontFamily":1,"type":"text","strokeColor":"#888888","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"be","seed":163038406,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"9","x":450.0,"y":230.0,"points":"[0,0],[1,0]","startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bf","seed":163038407,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"10","x":600.0,"y":150.0,"text":"3. Policy Gate","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bg","seed":163038408,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"11","x":600.0,"y":190.0,"text":"Tier 1: Auto-execute","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bh","seed":163038409,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"12","x":600.0,"y":215.0,"text":"Tier 2: Human approval","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bi","seed":163038410,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"13","x":600.0,"y":240.0,"text":"Tier 3: Human-led","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bj","seed":163038411,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"14","x":700.0,"y":230.0,"points":"[0,0],[1,0]","startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bk","seed":163038412,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"15","x":850.0,"y":150.0,"text":"4. Execute / Summarize","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bl","seed":163038413,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"16","x":850.0,"y":190.0,"text":"Deterministic automation","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bm","seed":163038414,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"17","x":850.0,"y":215.0,"text":"LLM: incident summary","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bn","seed":163038415,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"18","x":350.0,"y":320.0,"text":"Key: Model proposes, policy disposes","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bo","seed":163038416,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"19","x":350.0,"y":360.0,"text":"Trust is built through repeated correctness in narrow situations","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bp","seed":163038417,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
```

## References

- [Original Article: AI in SRE: A Practical Autonomy Model for Self-Healing Infrastructure](https://dzone.com/articles/ai-sre-self-healing) — DZone AI/ML, July 2026
- [AI-Assisted Incident Response: Giving Your On-Call Agent a Runbook](https://tianpan.co/blog/2026-04-12-ai-assisted-incident-response-giving-your-on-call-agent-a-runbook) — Three-tier autonomy model reference
- [Top Open Source AI SRE Tools in 2026](https://www.mezmo.com/learn/open-source-ai-sre-tools) — Tool comparison
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/) — Site Reliability Engineering fundamentals

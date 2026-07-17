---
title: 'Headlamp Knative Plugin: Serverless Workload Visualization and Management'
diataxis: Explanation
domain: Cloud-Native
topic: Serverless-Computing
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026/06/25/headlamp-knative-plugin/
date: 2026-07-17
keywords:
- knowledge-base
- Serverless-Computing
- Cloud-Native
- explanations
---
# Headlamp Knative Plugin: Serverless Workload Visualization and Management

## Overview

The **Headlamp Knative plugin** (v0.3.0-beta) brings serverless workload visibility into a unified web UI. Knative handles traffic routing, autoscaling, and revision management on Kubernetes, but day-to-day operations require jumping between the `kn` CLI, `kubectl`, and the Kubernetes UI. This plugin bridges that gap by surfacing Knative CRDs directly inside Headlamp.

## The Problem: Fragmented Serverless Operations

Operating Knative workloads requires tracking multiple interconnected resources:

- **KServices** (top-level serverless service)
- **Revisions** (immutable snapshots of code + config)
- **Routes** (traffic distribution across revisions)
- **DomainMappings** (custom domain bindings)
- **ClusterDomainClaims** (cross-namespace domain ownership)

Each requires separate `kn` or `kubectl` commands, making debugging slow and error-prone.

## What the Plugin Provides

### 1. KService Detail View with Edit Mode

The plugin provides a full detail view for KServices with an **Edit Mode** toggle for live changes:

- Traffic split adjustments (inline editing, validated to sum to 100%)
- Autoscaling annotation overrides
- YAML inspection
- Log access (single-pod and all-pods views)
- Redeploy and restart backing pods
- Actions gated by RBAC permissions

### 2. Traffic Splitting Visualization

Knative supports routing traffic across multiple Revisions for canary releases, gradual rollouts, and A/B testing. The plugin shows:

- Traffic percentage assigned to each Revision
- Latest ready Revision indicator
- Readiness status per revision
- Configured tags with clickable preview URLs
- Age of each revision

**Traffic split editing validates**:
- Percentages sum to 100%
- Tags are unique
- Tagged routes render as clickable links

### 3. Autoscaling Configuration Context

Knative's autoscaler reads from multiple sources:

| Source | Priority |
|--------|----------|
| KService annotations | Highest (per-workload override) |
| Cluster `config-autoscaler` ConfigMap | Medium (cluster-wide defaults) |
| Cluster `config-defaults` ConfigMap | Lowest (fallback defaults) |

The plugin reads all three sources and shows the **effective configuration** per KService, including:

- Concurrency targets and utilization thresholds
- RPS (requests per second) targets
- Min/max scale bounds
- Initial scale settings
- Stable window and scale-down delay

### 4. Prometheus Metrics Integration

When paired with the Headlamp Prometheus plugin, the Knative plugin renders:

- Request rate graphs on KService and Revision detail pages
- Latency breakdowns per revision
- Resource utilization charts
- Per-revision request rate (useful for validating traffic splits)

### 5. Map View for Resource Relationships

Headlamp's resource mapping extends to Knative CRDs:

- KService → Revision → Route relationships
- DomainMapping → KService connections
- ClusterDomainClaim ownership chains

### 6. Additional CRD Views

- **Revisions**: List and detail views with status, conditions, and config
- **DomainMappings**: Custom domain management
- **ClusterDomainClaims**: Cross-namespace domain ownership
- **Networking Overview**: Reads `config-network` and `config-gateway` to surface effective ingress class, gateway settings, and backing services

## Installation

```bash
# Method 1: Plugin Catalog (recommended)
# 1. Open Headlamp Desktop
# 2. Open Plugin Catalog
# 3. Search for "Knative"
# 4. Click Install
# 5. Reload Headlamp

# Method 2: Source installation
# See: https://github.com/headlamp-k8s/plugins/tree/main/plugins/knative
```

**Prerequisites**:
- Knative installed in your cluster
- Headlamp Desktop or server installation
- For metrics: Headlamp Prometheus plugin installed and configured

## Architecture Diagram

```excalidraw
* Excalidraw below
* You can draw in the message, and call draw_excalidraw to update the drawing
* When you send messages, include the drawing in the response to me so that I can see your drawings
* I can edit settings with Excalidraw+ settings, or draw text by starting lines with '> '

{"type":"default","values":{"appScale":1.0,"pageId":"p1","pages":{"p1":{"id":"p1","type":"tumbleweed","name":"Page 1","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":false}},"exportPadding":120,"toView":null,"gridSettings":{"customSize":20,"circular":false,"type":"square","dashed":true},"viewBackgroundColor":"#FFFFFF","theme":"dark","strokeColor":"#e6422c","backgroundColor":"#FFFFFF","fontSize":20,"font":"Cascadia","strokeWidth":2,"roughness":0,"seed":117588423,"view":null,"gridMode":false,"gridModeEnabled":false,"gridStep":5,"gridCounter":3}}
text {"id":"1","x":500.0,"y":80.0,"text":"Headlamp Knative Plugin Architecture","fontSize":24,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aV","seed":149553083,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"2","x":100.0,"y":200.0,"text":"Knative Resources","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aW","seed":154724707,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"3","x":100.0,"y":250.0,"text":"KService","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aX","seed":134999955,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"4","x":100.0,"y":290.0,"text":"Revision","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aY","seed":150582691,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"5","x":100.0,"y":330.0,"text":"Route","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aZ","seed":163038390,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"6","x":100.0,"y":370.0,"text":"DomainMapping","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"ba","seed":163038403,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"7","x":400.0,"y":200.0,"text":"Headlamp Plugin","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bb","seed":277501699,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"8","x":400.0,"y":250.0,"text":"KService Detail View","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bc","seed":163038404,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"9","x":400.0,"y":290.0,"text":"Traffic Split Editor","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bd","seed":163038405,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"10","x":400.0,"y":330.0,"text":"Autoscaling Config","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"be","seed":163038406,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"11","x":400.0,"y":370.0,"text":"Map View","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bf","seed":163038407,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"12","x":700.0,"y":200.0,"text":"Prometheus Plugin","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bg","seed":163038408,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"13","x":700.0,"y":250.0,"text":"Request Rate","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bh","seed":163038409,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"14","x":700.0,"y":290.0,"text":"Latency Graphs","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bi","seed":163038410,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"15","x":700.0,"y":330.0,"text":"Resource Utilization","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bj","seed":163038411,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"16","x":300.0,"y":270.0,"points":"[0,0],[1,0]","startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bm","seed":163038414,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"17","x":600.0,"y":270.0,"points":"[0,0],[1,0]","startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bn","seed":163038415,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"18","x":500.0,"y":450.0,"text":"Plugin validates traffic splits sum to 100%","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#2c2d34","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bo","seed":163038416,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"19","x":500.0,"y":490.0,"text":"Effective autoscaling = KService annotations + cluster defaults","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#2c2d34","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bp","seed":163038417,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
```

## Key Technical Details

### Traffic Split Validation Rules

The plugin enforces Knative traffic split constraints:

1. **Sum constraint**: All traffic percentages must sum to exactly 100%
2. **Tag uniqueness**: Each tag must be unique across revisions
3. **Tagged URL rendering**: Tags with reported URLs render as clickable links for preview

### Autoscaling Configuration Hierarchy

```
KService Annotations (highest priority)
    ↓ override
config-autoscaler ConfigMap (cluster defaults)
    ↓ fallback
config-defaults ConfigMap (lowest priority)
```

### RBAC-Gated Actions

Actions like redeploy, restart, and traffic editing are gated by the user's RBAC permissions in the cluster, ensuring operators only see actions they are authorized to perform.

## Comparison with CLI Workflow

| Task | CLI (`kn`/`kubectl`) | Headlamp Plugin |
|------|---------------------|-----------------|
| Inspect KService status | `kn service describe <name>` | Single detail view |
| View traffic splits | `kubectl get route <name> -o yaml` | Visual traffic breakdown |
| Check autoscaling config | Read ConfigMaps + KService annotations | Effective config shown inline |
| Debug revision issues | Multiple `kubectl` commands | Map view + linked resources |
| Monitor metrics | Separate Prometheus/Grafana | Inline on detail pages |

## Future Work

- Prometheus integration improvements
- Richer scheduling insights
- More workflow-oriented visibility across Knative workloads

## References

- [Original Article: See your serverless: introducing the Headlamp plugin for Knative](https://kubernetes.io/blog/2026/06/25/headlamp-knative-plugin/)
- [Headlamp Knative Plugin Repository](https://github.com/headlamp-k8s/plugins/tree/main/knative)
- [Knative Documentation](https://knative.dev/docs/)
- [Headlamp Prometheus Plugin](https://github.com/headlamp-k8s/plugins/tree/main/plugins/prometheus)

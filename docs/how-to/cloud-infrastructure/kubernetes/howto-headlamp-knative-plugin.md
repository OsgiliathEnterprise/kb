---
title: 'Headlamp Knative Plugin: Visual Serverless Workload Management'
diataxis: How-to Guide
domain: Cloud & Infrastructure
topic: Kubernetes
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026/06/25/headlamp-knative-plugin/
date: 2026-07-11
keywords:
- knowledge-base
- Kubernetes
- Cloud & Infrastructure
- how-to
---
# Headlamp Knative Plugin: Visual Serverless Workload Management

## Overview

**Knative** brings serverless workloads to Kubernetes, handling traffic routing, autoscaling, and revision management. However, operating Knative workloads day-to-day requires jumping between the `kn` CLI, `kubectl`, and the Kubernetes UI to get a full picture.

The **Headlamp Knative plugin** (v0.3.0-beta) bridges this gap by providing a unified visual interface for inspecting, understanding, and acting on Knative workloads — all from within Headlamp.

Developed as part of the CNCF LFX Mentorship program by Mudit Maheshwari and Kahiro Okina.

---

## What the Plugin Provides

### KService Management

A **KService** is the top-level resource in Knative: it manages the lifecycle of Routes, Configurations, Revisions, and everything needed to run and expose your application.

The plugin provides:
- Full detail view with **Edit Mode** for live changes to traffic splits, autoscaling annotations, and more
- Common actions in the header: view YAML, open logs, trigger redeploy, restart backing pods (gated by RBAC)

### Traffic Splitting

Knative can route traffic across multiple Revisions of the same service — useful for canary releases, gradual rollouts, tagged preview URLs, and A/B testing.

The plugin shows:
- Traffic assigned to each Revision
- Latest ready Revision, readiness status, age, and configured tags
- **Inline editing** of percentages and tags
- Validation that traffic sums to 100% and tags are unique
- Clickable links for tagged routes with reported URLs

### Autoscaling Configuration

Knative's autoscaler supports: concurrency targets, target utilization, RPS targets, min/max scale, initial scale, stable window, scale-down delay, and more.

The effective value for any workload is a combination of **KService-level annotations** and **cluster-wide ConfigMaps**. The plugin reads `config-autoscaler` and `config-defaults` and shows the **effective configuration per KService** in context — so you can see whether a setting is explicitly configured or falling back to the cluster default.

### Prometheus Metrics Integration

When paired with the [Prometheus plugin for Headlamp](https://github.com/headlamp-k8s/plugins/tree/main/plugins/prometheus), the plugin renders:
- Request rate graphs
- Latency graphs
- Resource utilization graphs
- Per-revision request rate breakdown (useful for validating traffic splits in progress)

### Map View

Headlamp's resource mapping works for Knative CRDs:
- KServices, Revisions, and DomainMappings shown in a single graph view
- Visualize ownership hierarchies and relationships

### Additional CRD Views

- **Revisions** — list and detail views
- **DomainMappings** — manage custom domain routing
- **ClusterDomainClaims** — prevent domain conflicts
- **Networking overview** — reads `config-network` and `config-gateway` to surface effective ingress class, gateway settings, and backing services

---

## Installation

1. Make sure [Knative is installed](https://knative.dev/docs/install/) in your cluster
2. In Headlamp Desktop, open the **Plugin Catalog**, search for **Knative**, and click Install
3. Reload Headlamp — a new Knative entry appears in the sidebar

For development or source-level setup, see the [Knative plugin README](https://github.com/headlamp-k8s/plugins/tree/main/plugins/knative).

---

## Architecture Diagram

```excalidraw
* Excalidraw below
* You can currently edit it with the plugin in VSCode
* code-excalidraw^start
{
  "type": "excalidraw画布",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "headlamp",
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 180,
      "height": 80,
      "strokeColor": "#329867",
      "backgroundColor": "#d5f5e3",
      "label": "Headlamp UI\n(Knative Plugin)"
    },
    {
      "id": "kservice",
      "type": "rectangle",
      "x": 300,
      "y": 30,
      "width": 180,
      "height": 60,
      "strokeColor": "#3498db",
      "backgroundColor": "#d6eaf8",
      "label": "KServices\n(Top-Level)"
    },
    {
      "id": "revision",
      "type": "rectangle",
      "x": 300,
      "y": 110,
      "width": 180,
      "height": 60,
      "strokeColor": "#e67e22",
      "backgroundColor": "#fdebd0",
      "label": "Revisions\n(Immutable)"
    },
    {
      "id": "autoscaler",
      "type": "rectangle",
      "x": 300,
      "y": 190,
      "width": 180,
      "height": 60,
      "strokeColor": "#9b59b6",
      "backgroundColor": "#e8daef",
      "label": "Autoscaler\n(config-autoscaler)"
    },
    {
      "id": "prometheus",
      "type": "rectangle",
      "x": 550,
      "y": 100,
      "width": 180,
      "height": 60,
      "strokeColor": "#e74c3c",
      "backgroundColor": "#fadbd8",
      "label": "Prometheus\n(Metrics)"
    },
    {
      "id": "arrow1",
      "type": "arrow",
      "x1": 230,
      "y1": 90,
      "x2": 300,
      "y2": 90,
      "strokeColor": "#333",
      "label": "CRD views\nedit, logs, restart"
    },
    {
      "id": "arrow2",
      "type": "arrow",
      "x1": 390,
      "y1": 90,
      "x2": 390,
      "y2": 110,
      "strokeColor": "#333",
      "label": "manages"
    },
    {
      "id": "arrow3",
      "type": "arrow",
      "x1": 390,
      "y1": 170,
      "x2": 390,
      "y2": 190,
      "strokeColor": "#333",
      "label": "scales"
    },
    {
      "id": "arrow4",
      "type": "arrow",
      "x1": 480,
      "y1": 140,
      "x2": 550,
      "y2": 140,
      "strokeColor": "#333",
      "label": "metrics"
    }
  ]
}
* code-excalidraw^end
```

---

## Workflow Comparison

| Task | CLI (`kn` + `kubectl`) | Headlamp Plugin |
|------|------------------------|-----------------|
| Inspect KService state | `kubectl get ksvc`, `kubectl describe ksvc` | Detail view with conditions |
| Adjust traffic splits | `kn service update --traffic` | Inline edit with validation |
| View autoscaling config | `kubectl get configmap config-autoscaler` | Effective config per KService |
| Monitor request rates | `kubectl get pods`, Prometheus UI | Inline graphs on detail pages |
| Restart backing pods | `kubectl rollout restart` | Action button in header |
| View resource hierarchy | Multiple `kubectl get` commands | Map view with relationships |

---

## References

- [Kubernetes Blog: See your serverless: introducing the Headlamp plugin for Knative](https://kubernetes.io/blog/2026/06/25/headlamp-knative-plugin/)
- [Knative Documentation](https://knative.dev/docs/)
- [Headlamp Knative Plugin Source](https://github.com/headlamp-k8s/plugins/tree/main/plugins/knative)
- [Headlamp Project](https://headlamp.dev/)

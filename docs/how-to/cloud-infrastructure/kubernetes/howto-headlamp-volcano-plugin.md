---
title: 'Headlamp Volcano Plugin: Visual Debugging for Batch and AI/ML Workloads'
diataxis: How-to Guide
domain: Cloud & Infrastructure
topic: Kubernetes
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026/06/25/visual-context-volcano-headlamp-plugin/
date: 2026-07-11
keywords:
- knowledge-base
- Kubernetes
- Cloud & Infrastructure
- how-to
---
# Headlamp Volcano Plugin: Visual Debugging for Batch and AI/ML Workloads

## Overview

**Volcano** is a cloud-native batch scheduler for Kubernetes, designed for high-performance computing (HPC), AI/ML training, and other batch workloads where jobs arrive dynamically, compete for limited resources, and may need multiple workers to start together before useful work can begin.

**Headlamp** is an extensible Kubernetes web UI with a plugin system. The **Volcano plugin** brings Volcano-specific resources (Jobs, Queues, PodGroups) into Headlamp's visual interface, making it easier to inspect workload state, queue behavior, and gang scheduling details without jumping between CLI tools.

The plugin was developed during the CNCF LFX Mentorship program and is available through Headlamp's Plugin Catalog.

---

## Why Volcano Needs a Visual Interface

Kubernetes was originally designed around long-running services. Batch, AI/ML, and HPC workloads behave differently:

- **Dynamic job arrival** — jobs compete for limited cluster resources
- **Gang scheduling** — multiple workers must start together before useful work begins
- **Queue-based capacity management** — resources are divided between teams using quotas and priorities
- **Complex resource hierarchies** — Jobs → PodGroups → Pods → Queues

Working with Volcano via CLI means moving across several related resources while trying to understand a batch workload. The Headlamp plugin consolidates this into a single visual interface.

---

## Core Volcano Resources Exposed by the Plugin

### Jobs

The Job view is the center of the plugin experience.

**List view** shows:
- Workload status
- Queue assignment
- Running vs. minimum-available pod counts
- Task count
- Age

**Detail view** provides:
- Task details and Pod status
- Related Queue and PodGroup links
- Conditions and events
- **Suspend** and **Resume** lifecycle actions
- Direct **Job logs** access (single-Pod and all-Pods views with container selection, timestamps, follow mode)

### Queues

The Queue view surfaces:
- Capacity and allocated resources
- Deserved and guaranteed resources
- Reservation details
- Child queues and hierarchy
- Resource constraints across teams

### PodGroups

PodGroups are central to gang scheduling. The view highlights:
- Progress and conditions
- Minimum resource requirements
- Whether a workload is blocked due to unmet scheduling conditions

### Map View

A visual topology showing how Jobs, PodGroups, Queues, and Pods relate to one another. Especially useful for:
- Understanding why a workload is pending
- Spotting resources that need attention (warning/error states)
- Tracing ownership hierarchies

---

## Installation

1. Install Headlamp (see [headlamp.dev](https://headlamp.dev/))
2. Open the Plugin Catalog from the Headlamp UI
3. Search for **Volcano**
4. Install the Volcano plugin
5. Connect Headlamp to a Kubernetes cluster where Volcano is already installed

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
      "x": 100,
      "y": 50,
      "width": 200,
      "height": 80,
      "strokeColor": "#329867",
      "backgroundColor": "#d5f5e3",
      "label": "Headlamp UI\n(Volcano Plugin)"
    },
    {
      "id": "volcano-api",
      "type": "rectangle",
      "x": 400,
      "y": 50,
      "width": 200,
      "height": 80,
      "strokeColor": "#e74c3c",
      "backgroundColor": "#fadbd8",
      "label": "Volcano API Server\n(Jobs, Queues,\nPodGroups)"
    },
    {
      "id": "k8s-api",
      "type": "rectangle",
      "x": 400,
      "y": 180,
      "width": 200,
      "height": 80,
      "strokeColor": "#3498db",
      "backgroundColor": "#d6eaf8",
      "label": "Kubernetes API\n(Pods, Events)"
    },
    {
      "id": "arrow1",
      "type": "arrow",
      "x1": 300,
      "y1": 90,
      "x2": 400,
      "y2": 90,
      "strokeColor": "#333",
      "label": "GET /list /detail"
    },
    {
      "id": "arrow2",
      "type": "arrow",
      "x1": 300,
      "y1": 90,
      "x2": 400,
      "y2": 220,
      "strokeColor": "#333",
      "label": "Pod status,\nlogs, events"
    },
    {
      "id": "arrow3",
      "type": "arrow",
      "x1": 400,
      "y1": 130,
      "x2": 400,
      "y2": 180,
      "strokeColor": "#333",
      "label": "schedules\nPods"
    }
  ]
}
* code-excalidraw^end
```

---

## Key Differences from CLI Workflow

| Task | CLI (`kubectl`) | Headlamp Plugin |
|------|----------------|-----------------|
| List all Volcano Jobs | `kubectl jobs -A` | Visual list with status badges |
| Inspect Job conditions | `kubectl describe job <name>` | Detail page with conditions panel |
| View Pod logs | `kubectl logs -f <pod>` | Built-in log viewer on Job page |
| Suspend/Resume | `kubectl patch job ...` | Click action buttons |
| Trace resource hierarchy | Multiple `kubectl get` commands | Map view with relationships |
| Check queue capacity | `kubectl describe queue <name>` | Queue detail with resource charts |

---

## Limitations and Future Work

- **Alpha release** — plugin is still maturing
- Future plans include Prometheus integration for metrics on Volcano resources
- Richer scheduling insights and workflow-oriented visibility across Volcano workloads
- Does not replace `kubectl` or Volcano CLI for automation and scripting

---

## References

- [Kubernetes Blog: Inspect Volcano workloads faster with Headlamp](https://kubernetes.io/blog/2026/06/25/visual-context-volcano-headlamp-plugin/)
- [Volcano Project](https://volcano.sh/)
- [Headlamp Project](https://headlamp.dev/)
- [Headlamp Plugins Repository](https://github.com/headlamp-k8s/plugins)

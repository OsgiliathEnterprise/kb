---
title: Inspect Volcano Workloads with Headlamp Plugin
diataxis: How-to Guide
domain: Cloud & Infrastructure
topic: Kubernetes
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026/06/25/visual-context-volcano-headlamp-plugin/
date: 2026-07-25
keywords:
- knowledge-base
- Kubernetes
- Cloud & Infrastructure
- how-to
---
# Inspect Volcano Workloads with Headlamp Plugin

## Overview

Volcano is a cloud-native batch scheduler for Kubernetes, designed for high-performance computing (HPC), AI/ML, and other batch workloads. The Headlamp Volcano plugin brings Volcano-specific resources into Headlamp's UI, providing visual context for Jobs, Queues, and PodGroups that would otherwise require multiple CLI commands to inspect.

## Background: Why Volcano?

Kubernetes was designed around long-running services. Batch, AI/ML, and HPC workloads behave differently:

- Jobs arrive dynamically
- Workloads compete for limited resources
- Multiple workers may need to start together before useful work begins (gang scheduling)

Volcano extends Kubernetes with:

| Concept | Purpose |
|---------|---------|
| **Queue** | Divides cluster capacity between teams/workloads using quotas and priorities |
| **Job** | Describes a batch workload as a set of tasks and the Pods they create |
| **PodGroup** | Ties a group of Pods together for gang scheduling (all-or-nothing) |

## Installation

### Prerequisites

- Headlamp installed (or running)
- Kubernetes cluster with Volcano already installed

### Steps

1. **Install Headlamp** (if not already installed):
   ```bash
   # Linux
   sudo curl -L https://github.com/headlamp-k8s/headlamp/releases/latest/download/headlamp-linux-x64 -o /usr/local/bin/headlamp
   sudo chmod +x /usr/local/bin/headlamp
   headlamp --address=:8080
   ```

2. **Open Headlamp** in your browser (default: `http://localhost:8080`)

3. **Open Plugin Catalog** from the Headlamp UI sidebar

4. **Search for "Volcano"** in the catalog

5. **Install the Volcano plugin**

6. **Connect Headlamp** to your Kubernetes cluster where Volcano is installed

## Using the Plugin

### Job View (Primary Interface)

The Job view is the center of the Volcano plugin experience:

**List View** shows:
- Workload status
- Queue assignment
- Running vs. minimum-available values
- Task count and age

**Detail View** provides:
- Task details and Pod status
- Links to related Queue and PodGroup
- Conditions and events
- **Suspend** and **Resume** lifecycle actions
- Direct **Job logs** access (single-Pod and all-Pods views)

### Queue View

The Queue view surfaces resource allocation details:
- Capacity and allocated resources
- Deserved and guaranteed resources
- Reservation details
- Child queue hierarchy

### PodGroup View

The PodGroup view highlights:
- Gang scheduling progress
- Conditions and blockers
- Minimum resource requirements
- Whether the workload is blocked on scheduling conditions

### Map View

The map view shows how Volcano resources are connected:
- Jobs → PodGroups → Pods → Queue relationships
- Warning and error states highlighted
- Useful for debugging pending or stalled workloads

## Architecture Diagram

```
[Headlamp UI]
    |
    +-- Volcano Plugin
    |       |
    |       +-- Jobs (list + detail + logs + actions)
    |       +-- Queues (capacity + allocation + hierarchy)
    |       +-- PodGroups (gang scheduling state + blockers)
    |       +-- Map View (resource relationship graph)
    |
    +-- Kubernetes API Server
            |
            +-- Volcano Custom Resources
                    |
                    +-- Job CRD
                    +-- Queue CRD
                    +-- PodGroup CRD
```

## When to Use This vs. CLI

| Scenario | Recommended Tool |
|----------|-----------------|
| Interactive troubleshooting | Headlamp Volcano plugin |
| Automation and scripting | `kubectl` + Volcano CLI |
| Raw object inspection | `kubectl` |
| Understanding resource relationships | Headlamp map view |
| Quick status checks | Headlamp list views |

## What's Next

Future work includes:
- Prometheus integration for metrics
- Richer scheduling insights
- More workflow-oriented visibility across Volcano workloads

## References

- [Volcano Project](https://volcano.sh/)
- [Headlamp](https://headlamp.dev/)
- [Headlamp Plugins Repository](https://github.com/headlamp-k8s/plugins)
- [Original Article on Kubernetes Blog](https://kubernetes.io/blog/2026/06/25/visual-context-volcano-headlamp-plugin/)

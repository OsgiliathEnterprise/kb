---
title: Volcano Batch Scheduler Visualization with Headlamp Plugin
diataxis: Explanation
domain: Cloud-Native
topic: Container-Orchestration
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026/06/25/visual-context-volcano-headlamp-plugin/
date: 2026-07-12
keywords:
- knowledge-base
- Container-Orchestration
- Cloud-Native
- explanations
---
# Volcano Batch Scheduler Visualization with Headlamp Plugin

## Overview

The **Volcano plugin for Headlamp** brings cloud-native batch scheduling visibility into a unified web UI. Volcano is a Kubernetes-native batch scheduler designed for high-performance computing (HPC), AI/ML, and other batch workloads that behave differently from long-running services.

## Why Volcano?

Kubernetes was originally designed around long-running services. Batch, AI/ML, and HPC workloads have different characteristics:

- Jobs arrive dynamically
- Workloads compete for limited resources
- Multiple workers may need to start together before useful work begins (gang scheduling)

Volcano extends Kubernetes with:

- **Queues** — Divide cluster capacity between teams/workloads using quotas and priorities
- **Priorities** — Control scheduling order across competing workloads
- **Quotas** — Limit resource consumption per queue
- **Gang scheduling** — Ensure all pods in a group start together or none start

## Volcano Core Resources

### Job

Describes a batch workload as a set of tasks and the Pods they create. The Headlamp plugin provides:

- **List view**: Status, queue, running vs. minimum-available values, task count, age
- **Detail view**: Task details, Pod status, related Queue and PodGroup links, conditions, events
- **Lifecycle actions**: Suspend and Resume directly from the UI
- **Log access**: Single-Pod and all-Pods views with container selection, line count, previous logs, timestamps, and follow mode

### Queue

Divides cluster capacity between teams or workloads. The Queue view surfaces:

- Capacity and allocated resources
- Deserved and guaranteed resources
- Reservation details
- Child queues
- Resource sharing and constraint information

### PodGroup

Ties a group of Pods together so the scheduler treats them as a single unit for gang scheduling. The PodGroup view highlights:

- Progress and conditions
- Minimum resource requirements
- Whether the workload is blocked due to unmet scheduling conditions

## The Map View

A key feature is the **map view** that shows how Volcano resources connect:

- Jobs → PodGroups → Pods → Queue relationships
- Warning and error states visible at a glance
- Especially useful when a workload is pending or not progressing

This replaces the fragmented CLI workflow of jumping between `kubectl` commands for each related resource.

## Installation

1. Install Headlamp
2. Open the Plugin Catalog from the Headlamp UI
3. Search for "Volcano"
4. Install the Volcano plugin
5. Connect Headlamp to a Kubernetes cluster where Volcano is already installed

The plugin is available at the [Headlamp plugins repository](https://github.com/headlamp-k8s/plugins).

## Architecture Diagram

```
excalidraw
startuml
title Volcano + Headlamp Architecture

package "Kubernetes Cluster" {
  participant "Kube\nScheduler" as K8SScheduler
  participant "Volcano\nScheduler" as Volcano
  participant "Queue\nResources" as Queue
  participant "PodGroup\nResources" as PodGroup
  participant "Job\nResources" as Job
  participant "Pods" as Pods
}

package "Headlamp UI" {
  participant "Volcano\nPlugin" as Plugin
  participant "Map View" as MapView
  participant "Detail Views" as DetailView
}

actor "Operator" as Operator

Volcano -> Queue: Enforce quotas\nand priorities
Volcano -> PodGroup: Gang scheduling\ndecisions
Volcano -> Job: Schedule tasks\nand create pods
Job -> Pods: Create task pods
PodGroup --> Volcano: Block until\nmin resources met

Operator -> Plugin: Inspect workloads
Plugin -> MapView: Show resource\nrelationships
Plugin -> DetailView: Job/Queue/PodGroup\ndetail pages
DetailView --> Operator: Status, logs,\nevents, actions

note right of Volcano
  Extends K8s with:
  - Queues & priorities
  - Gang scheduling
  - Resource quotas
  - Batch-aware scheduling
end note

note right of Plugin
  Not a kubectl replacement:
  - Interactive troubleshooting
  - Visual relationships
  - Direct log access
  - Suspend/Resume actions
end note
enduml
```

## Future Work

Planned improvements include:
- Prometheus integration for metrics
- Richer scheduling insights
- More workflow-oriented visibility across Volcano workloads

## References

- [Volcano project](https://volcano.sh/)
- [Headlamp Kubernetes UI](https://headlamp.dev/)
- [Headlamp plugins repository](https://github.com/headlamp-k8s/plugins)
- [Original blog post on Kubernetes.io](https://kubernetes.io/blog/2026/06/25/visual-context-volcano-headlamp-plugin/)

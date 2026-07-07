---
title: 'Headlamp Cluster API Plugin: Managing Clusters from the UI'
diataxis: How-to Guide
domain: Cloud & Infrastructure
topic: Kubernetes
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026/06/25/headlamp-cluster-api-plugin/
date: 2026-07-05
keywords:
- knowledge-base
- Kubernetes
- Cloud & Infrastructure
- how-to
---
# Headlamp Cluster API Plugin: Managing Clusters from the UI

## Overview

The **Headlamp Cluster API plugin** brings Cluster API (CAPI) workload cluster management directly into the Headlamp Kubernetes dashboard. Previously, CAPI operations required `kubectl` commands or separate management tools. This plugin enables visual inspection and management of CAPI resources including `Cluster`, `MachineDeployment`, `MachineSet`, and `Machine` objects — all from a unified UI.

This HOWTO covers installation, configuration, and practical usage patterns for the plugin.

---

## What Is Cluster API?

**Cluster API** is a Kubernetes subproject that declaratively manages Kubernetes clusters using the same control-plane patterns as Kubernetes itself. Key concepts:

| Resource | Purpose |
|----------|---------|
| `Cluster` | Represents a managed Kubernetes cluster |
| `MachineDeployment` | Declares desired number of worker nodes |
| `MachineSet` | Ensures a set of identical machines are running |
| `Machine` | Represents an individual node in the cluster |

The management cluster runs CAPI controllers that reconcile these resources against actual infrastructure (AWS, Azure, GCP, vSphere, Docker/kind, etc.).

---

## Installation

### Prerequisites

- Headlamp installed (v0.25.0+)
- A management cluster with Cluster API providers configured
- `kubectl` access to the management cluster

### Install via Plugin Marketplace

```bash
# If using Headlamp CLI
headlamp plugins install cluster-api

# Or add to your plugin configuration
# ~/.config/headlamp/plugins.json
{
  "plugins": [
    {
      "name": "cluster-api",
      "url": "https://github.com/headlamp-k8s/headlamp-cluster-api/releases/latest/download/cluster-api-plugin.tar.gz"
    }
  ]
}
```

### Install from Source

```bash
git clone https://github.com/headlamp-k8s/headlamp-cluster-api.git
cd headlamp-cluster-api
npm install
npm run build
# Copy the built plugin to your Headlamp plugins directory
```

---

## Using the Plugin

### Viewing Cluster Resources

After installation, the plugin adds a **Cluster API** section in the Headlamp sidebar:

1. Navigate to **Cluster API → Clusters** to see all managed clusters
2. Click on a cluster to view its **machines**, **status**, and **conditions**
3. Use the **MachineDeployments** view to scale worker nodes visually

### Common Operations

| Operation | Plugin UI | Equivalent kubectl |
|-----------|-----------|-------------------|
| List clusters | Clusters view | `kubectl get clusters -A` |
| Scale deployment | Edit MachineDeployment replicas | `kubectl scale machinedeployment <name> --replicas=N` |
| View machine status | Machine detail page | `kubectl describe machine <name>` |
| Check cluster conditions | Cluster conditions tab | `kubectl get cluster <name> -o yaml` |

### Multi-Cluster Workflow

The plugin integrates with Headlamp's multi-cluster support:

```yaml
# ~/.config/headlamp/clusters.yaml
clusters:
  - name: "management"
    kubeconfig: "~/.kube/config-management"
  - name: "workload-us-east"
    kubeconfig: "~/.kube/config-workload-east"
  - name: "workload-eu-west"
    kubeconfig: "~/.kube/config-workload-west"
```

The Cluster API plugin shows management resources in the management cluster context, while you can switch to workload clusters for day-2 operations.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Headlamp UI                     │
│  ┌───────────────────────────────────────┐   │
│  │   Cluster API Plugin                   │   │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ │   │
│  │  │ Clusters│ │ Machines │ │ Deploy │ │   │
│  │  │  View   │ │  Status  │ │  ments │ │   │
│  │  └─────────┘ └──────────┘ └────────┘ │   │
│  └───────────────────────────────────────┘   │
│                 │                             │
│         Kubernetes API (management cluster)   │
└─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────┐
│           CAPI Controllers                    │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Cluster │ │ Machine  │ │ Infra        │  │
│  │  Ctrl   │ │  Ctrl    │ │ Providers    │  │
│  └─────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────┐
│         Cloud / Infrastructure Providers      │
│  (AWS, Azure, GCP, vSphere, kind, Docker)    │
└─────────────────────────────────────────────┘
```

> **Excalidraw diagram:** *Three-tier architecture showing the Headlamp UI with the Cluster API plugin at the top, the CAPI controllers in the management cluster in the middle, and infrastructure providers at the bottom. Arrows flow downward from UI to API to controllers to infrastructure, with status feedback flowing upward.*

---

## Tips and Best Practices

1. **Namespace awareness**: CAPI resources are namespaced. The plugin lets you filter by namespace — use this to isolate production vs. staging clusters.
2. **Condition monitoring**: The plugin surfaces CAPI conditions (Ready, ControlPlaneReady, InfrastructureReady) as visual indicators. Treat non-Ready conditions as alerts.
3. **Machine health checks**: Combine with the CAPI Machine Health Check feature to automatically remediate unhealthy nodes.
4. **Plugin updates**: Headlamp plugins are independently versioned. Check for updates via the plugin marketplace or GitHub releases.

---

## References

- [Headlamp Cluster API Plugin Announcement](https://kubernetes.io/blog/2026/06/25/headlamp-cluster-api-plugin/) — Kubernetes Blog, June 2026
- [Headlamp Project](https://headlamp.dev)
- [Cluster API Book](https://cluster-api.sigs.k8s.io/)
- [Headlamp GitHub](https://github.com/headlamp-k8s/headlamp)

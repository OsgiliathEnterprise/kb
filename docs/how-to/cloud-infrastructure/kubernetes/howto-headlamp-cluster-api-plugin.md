---
title: 'Headlamp Cluster API Plugin: Managing CAPI Resources from the UI'
diataxis: How-to Guide
domain: Cloud & Infrastructure
topic: Kubernetes
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026/06/25/headlamp-cluster-api-plugin/
date: 2026-07-22
keywords:
- knowledge-base
- Kubernetes
- Cloud & Infrastructure
- how-to
---
# Headlamp Cluster API Plugin: Managing CAPI Resources from the UI

## Overview

The Headlamp Cluster API plugin brings visual clarity and simplified operations for managing Cluster API (CAPI) resources directly in the browser. It transforms complex multi-cluster lifecycle management — historically requiring raw `kubectl` commands and deep familiarity with ownership hierarchies — into an intuitive graphical interface.

Before this plugin, managing CAPI resources required raw `kubectl` commands and deep familiarity with ownership hierarchies between Clusters, Machines, MachineDeployments, and control planes. The plugin provides a visual interface for all these operations.

**Status:** Alpha release (as of June 2026)

## What is Cluster API (CAPI)?

Cluster API is a Kubernetes sub-project that brings **declarative, Kubernetes-style APIs** to cluster lifecycle management. It lets platform teams:

- Provision Kubernetes clusters using standard Kubernetes objects
- Upgrade clusters declaratively
- Manage the full lifecycle of clusters from a management cluster
- Track control plane and worker node health

## Plugin Features

| Feature | Description |
|---------|-------------|
| **Cluster overview** | View clusters with live control plane and worker replica status |
| **Machine visibility** | Inspect MachineDeployments, MachineSets, Machines, and MachinePools with status and conditions |
| **Cluster API dashboard** | Centralized view of CAPI resource health, active condition issues, provider information, and remediation guidance |
| **Control plane monitoring** | Track KubeadmControlPlane replicas, versions, and associated Machines |
| **Scale from the UI** | Scale MachineDeployments and MachineSets directly from Headlamp |
| **Owned resource hierarchy** | Trace relationships between clusters, deployments, sets, and machines |
| **KubeadmConfig inspection** | View bootstrap configs, files, kubelet args, and join/init settings |
| **Topology awareness** | Automatically detect and label ClusterClass-managed resources |
| **Map view** | Visualize Cluster, Control Plane, and Worker relationships |
| **Dynamic API versioning** | Supports both v1beta1 and v1beta2 Cluster API versions |
| **Prometheus metrics** | View live metrics from the Headlamp Prometheus plugin inline on CAPI resource detail pages |

## Installation

### Prerequisites

- Headlamp installed and running (install it first if not already)
- Kubernetes cluster with Cluster API installed
- (Optional) Headlamp Prometheus plugin for metrics integration

To install Headlamp itself:

```bash
# macOS
brew install headlamp

# Linux (AppImage)
# Download from https://github.com/headlamp-k8s/headlamp/releases
```

### Steps

1. **Install the plugin** via the Headlamp Plugin Catalog:
   - Open Headlamp in your browser
   - Navigate to the Plugin Catalog from the sidebar
   - Search for "Cluster API"
   - Install the plugin

2. **Alternatively**, install from source:
   ```bash
   # Clone the Headlamp plugins repository
   git clone https://github.com/headlamp-k8s/plugins.git
   cd plugins/cluster-api
   # Follow the README.md for build and installation instructions
   ```

3. **Connect Headlamp** to a Kubernetes cluster where CAPI is installed.

See the [official README](https://github.com/headlamp-k8s/plugins/blob/main/cluster-api/README.md) for detailed installation instructions.

## Using the Plugin

### Cluster API Dashboard

The dashboard provides a centralized health overview across your management cluster:

- **Resource summary**: Status of Clusters, Machines, MachineDeployments, MachinePools, MachineSets, and control planes
- **Active condition issues**: Highlights degraded or unhealthy resources
- **Provider information**: Shows which infrastructure providers are in use
- **Remediation guidance**: Diagnostic commands and troubleshooting steps when issues are detected

### Cluster List and Detail Views

**List View** shows all Cluster resources with:
- Control plane replica status
- Worker replica status
- Overall health at a glance

**Detail View** provides:
- Resource status and conditions
- Infrastructure references
- Control plane references
- Related Machines on a single page
- Inline Prometheus metrics (when the Prometheus plugin is installed)

### Machine Resource Views

Dedicated views for MachineDeployments, MachineSets, Machines, and MachinePools surface:
- Replica counts
- Ownership relationships
- Provider IDs and versions
- Health conditions
- A **built-in Scale action** to adjust replica counts directly from the UI

### Scaling from the UI

MachineDeployments and MachineSets include a built-in Scale action dialog. For topology-managed clusters (using ClusterClass), the plugin indicates when scaling should be performed at the Cluster level instead.

### Bootstrap Configuration Inspection

KubeadmConfig resources can be viewed in structured format, including:
- Inline files
- Kubelet arguments
- Extra volumes
- Join and init settings

This eliminates the need to manually inspect raw YAML or secrets.

### Map View

A visual topology map displays relationships between:
- Cluster resources
- Control plane components
- Worker nodes

This provides a faster way to understand ownership hierarchies and overall cluster structure than navigating through individual resource pages.

## Practical Use Cases

### Diagnosing a Degraded Cluster

1. Open the Cluster API dashboard in Headlamp
2. Identify the cluster with active condition issues
3. Click into the cluster detail view
4. Check control plane replica status and worker machine health
5. Use the map view to trace ownership relationships
6. Review Prometheus metrics inline for performance correlation
7. Follow remediation guidance provided by the dashboard

### Scaling a MachineDeployment

1. Navigate to the MachineDeployments list
2. Select the target deployment
3. Click the **Scale** action
4. Enter the desired replica count
5. Confirm — no terminal commands needed

> **Note:** For topology-managed clusters, the plugin indicates when scaling should be performed at the Cluster level instead.

## Architecture Diagram

```
[Headlamp UI]
    |
    +-- Cluster API Plugin (Alpha)
    |       |
    |       +-- Dashboard (health overview + remediation)
    |       +-- Cluster List/Detail (status, conditions, machines)
    |       +-- MachineDeployments (list, detail, scale)
    |       +-- MachineSets (list, detail, scale)
    |       +-- Machines (list, detail, provider info)
    |       +-- MachinePools (list, detail)
    |       +-- KubeadmConfig (bootstrap config inspection)
    |       +-- Map View (topology visualization)
    |       +-- Prometheus Metrics (inline, optional)
    |
    +-- Kubernetes API Server
            |
            +-- Cluster API CRDs
                    |
                    +-- Cluster (v1beta1/v1beta2)
                    +-- MachineDeployment
                    +-- MachineSet
                    +-- Machine
                    +-- MachinePool
                    +-- KubeadmControlPlane
                    +-- KubeadmConfig
```

## When to Use This vs. CLI

| Scenario | Recommended Tool |
|----------|-----------------|
| Interactive cluster health inspection | Headlamp Cluster API plugin |
| Understanding resource relationships | Headlamp map view |
| Scaling operations from UI | Headlamp scale dialog |
| Automation and scripting | `kubectl` + CAPI CLI |
| Raw object inspection | `kubectl get/describe` |
| Day-to-day cluster operations | Headlamp (with Prometheus for metrics) |

## Prometheus Integration

When the [Headlamp Prometheus plugin](https://github.com/headlamp-k8s/plugins/tree/main/prometheus) is installed, live metrics are embedded inline on CAPI resource detail pages for Clusters, MachineDeployments, MachineSets, and Machines. This allows correlating infrastructure state with performance data without switching to a separate Grafana or Prometheus dashboard.

## What's Next

This is an Alpha release. Planned improvements include:
- Additional CAPI resource types
- Richer diagnostic capabilities
- Enhanced remediation workflows
- Deeper integration with infrastructure providers

## Status and Community

- **Release status:** Alpha
- **Developed during:** CNCF LFX Mentorship program
- **Repository:** [headlamp-k8s/plugins/cluster-api](https://github.com/headlamp-k8s/plugins/tree/main/cluster-api)

### Getting Involved

- **Bug reports:** [Open an issue](https://github.com/kubernetes-sigs/headlamp/issues)
- **Feature requests:** [Start a discussion](https://github.com/kubernetes-sigs/headlamp/discussions)
- **Contributing:** [PRs welcome](https://github.com/kubernetes-sigs/headlamp/pulls)
- **Slack:** Join the `#headlamp` channel on [Kubernetes Slack](https://slack.k8s.io/)

## References

- [Original Article: Introducing the Cluster API plugin for Headlamp](https://kubernetes.io/blog/2026/06/25/headlamp-cluster-api-plugin/)
- [Headlamp Cluster API Plugin Repository](https://github.com/headlamp-k8s/plugins/tree/main/cluster-api)
- [Cluster API Documentation](https://cluster-api.sigs.k8s.io/)
- [Headlamp Prometheus Plugin](https://github.com/headlamp-k8s/plugins/tree/main/prometheus)
- [Headlamp Main Project](https://headlamp.dev/)

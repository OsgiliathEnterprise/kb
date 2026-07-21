---
title: Managing Cluster API Resources with the Headlamp CAPI Plugin
diataxis: How-to Guide
domain: Cloud & Infrastructure
topic: Kubernetes
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026/06/25/headlamp-cluster-api-plugin/
date: 2026-07-21
keywords:
- knowledge-base
- Kubernetes
- Cloud & Infrastructure
- how-to
---
# Managing Cluster API Resources with the Headlamp CAPI Plugin

## Summary

The **Headlamp Cluster API plugin** (Alpha release, June 2026) brings visual management of Cluster API (CAPI) resources directly into the Headlamp UI. CAPI provides declarative, Kubernetes-native APIs for provisioning, upgrading, and managing the lifecycle of Kubernetes clusters — but historically, managing CAPI resources required raw `kubectl` commands and deep familiarity with ownership hierarchies. This plugin eliminates that friction.

## What the Plugin Provides

| Feature | Description |
|---------|-------------|
| **Cluster overview** | Live control plane and worker replica status |
| **Machine visibility** | MachineDeployments, MachineSets, Machines, MachinePools with conditions |
| **CAPI dashboard** | Centralized health view, provider info, remediation guidance |
| **Control plane monitoring** | KubeadmControlPlane replicas, versions, associated Machines |
| **Scale from UI** | Scale MachineDeployments and MachineSets directly in Headlamp |
| **Owned resource hierarchy** | Trace relationships between clusters, deployments, sets, and machines |
| **KubeadmConfig inspection** | Bootstrap configs, files, kubelet args, join/init settings |
| **Topology awareness** | Auto-detect and label ClusterClass-managed resources |
| **Map view** | Visualize Cluster, Control Plane, and Worker relationships |
| **Dynamic API versioning** | Supports both v1beta1 and v1beta2 CAPI versions |
| **Prometheus metrics** | Inline metrics on CAPI resource detail pages (with Prometheus plugin) |

## Installation

### Prerequisites

- Headlamp installed (desktop or in-cluster)
- A management cluster with Cluster API resources
- (Optional) Headlamp Prometheus plugin for metrics integration

### Steps

1. **Install the plugin via Headlamp Plugin Catalog:**
   - Open Headlamp
   - Navigate to **Plugin Catalog**
   - Search for "Cluster API"
   - Click **Install**
   - Reload Headlamp

2. **Install from source:**
   ```bash
   # Clone the plugins repository
   git clone https://github.com/headlamp-k8s/plugins.git
   cd plugins/cluster-api
   # Follow README.md for build and installation steps
   ```

See the [official plugin README](https://github.com/headlamp-k8s/plugins/blob/main/cluster-api/README.md) for detailed installation instructions.

## Using the Plugin

### 1. Cluster API Dashboard

The dashboard provides a centralized view of all CAPI resources and their health:

- **Overview cards**: Status of clusters, Machines, MachineDeployments, MachinePools, MachineSets, and control planes
- **Active condition issues**: Highlights degraded or unhealthy resources
- **Provider information**: Shows which infrastructure providers are in use
- **Configuration template counts**: Tracks ClusterClass and template usage
- **Remediation guidance**: When issues are detected, the dashboard provides diagnostic commands and troubleshooting steps

### 2. Cluster List and Detail Views

**Cluster list view** shows all Cluster resources in the management cluster with:
- Control plane replica status (running, pending, failed)
- Worker replica status
- Infrastructure provider and version
- Age and conditions

**Cluster detail view** provides:
- Resource status and conditions
- Infrastructure references (provider-specific resources)
- Control plane references
- Related Machines with their individual status
- Topology information (for ClusterClass-managed clusters)

### 3. Machine Resource Management

Dedicated views for **MachineDeployments**, **MachineSets**, **Machines**, and **MachinePools** surface:
- Replica counts (desired vs. actual)
- Ownership relationships (which Cluster owns this resource)
- Provider IDs
- Kubernetes versions
- Conditions and events

### 4. Scaling from the UI

MachineDeployments and MachineSets include a **Scale action** dialog:
- Adjust replica counts directly from Headlamp
- No terminal commands needed
- For topology-managed clusters, the plugin indicates when scaling should be performed at the Cluster level instead

### 5. Bootstrap Configuration Inspection

**KubeadmConfig** resources can be inspected in a structured format:
- Inline files (pre-bootstrap scripts, cloud-init data)
- Kubelet arguments
- Extra volumes
- Join and init settings
- No need to decode raw YAML or secrets manually

### 6. Map View

The visual **map view** displays:
- Cluster → Control Plane → Worker resource relationships
- Ownership hierarchies at a glance
- Resource health states (color-coded)
- Faster understanding of complex multi-cluster setups

### 7. Prometheus Metrics Integration

When the Headlamp Prometheus plugin is installed and configured:
- Metrics are embedded inline on CAPI resource detail pages
- View resource health and performance data alongside status conditions
- No need to switch to a separate Prometheus/Grafana dashboard
- Correlate infrastructure state with live metrics during debugging

## Architecture Diagram

```excalidraw
* Excalidraw - Headlamp Cluster API Plugin Architecture
  {"type":"excalidraw","version":2,"source":"https://excalidraw.com"}
  ,
  {"type":"frame","id":"frame-headlamp","x":40,"y":40,"width":320,"height":440,"strokeColor":"#6366f1","backgroundColor":"#eef2ff","label":"Headlamp + CAPI Plugin"},
  {"type":"frame","id":"frame-capi","x":440,"y":40,"width":320,"height":440,"strokeColor":"#10b981","backgroundColor":"#ecfdf5","label":"Cluster API Resources"},
  {"type":"frame","id":"frame-infra","x":840,"y":40,"width":240,"height":440,"strokeColor":"#f59e0b","backgroundColor":"#fffbeb","label":"Infrastructure Providers"},

  -- Headlamp plugin features
  {"type":"rectangle","id":"hl-dashboard","x":60,"y":80,"width":280,"height":45,"backgroundColor":"#c7d2fe","strokeColor":"#6366f1","rounding":true,"label":"CAPI Dashboard (Health Overview)"},
  {"type":"rectangle","id":"hl-cluster-list","x":60,"y":140,"width":280,"height":45,"backgroundColor":"#c7d2fe","strokeColor":"#6366f1","rounding":true,"label":"Cluster List + Detail Views"},
  {"type":"rectangle","id":"hl-machine","x":60,"y":200,"width":280,"height":45,"backgroundColor":"#c7d2fe","strokeColor":"#6366f1","rounding":true,"label":"Machine Resources (Deployments, Sets, Pools)"},
  {"type":"rectangle","id":"hl-scale","x":60,"y":260,"width":280,"height":45,"backgroundColor":"#c7d2fe","strokeColor":"#6366f1","rounding":true,"label":"Scale Action (UI-Based)"},
  {"type":"rectangle","id":"hl-bootstrap","x":60,"y":320,"width":280,"height":45,"backgroundColor":"#c7d2fe","strokeColor":"#6366f1","rounding":true,"label":"KubeadmConfig Inspection"},
  {"type":"rectangle","id":"hl-map","x":60,"y":380,"width":280,"height":45,"backgroundColor":"#c7d2fe","strokeColor":"#6366f1","rounding":true,"label":"Map View (Relationships)"},
  {"type":"rectangle","id":"hl-prometheus","x":60,"y":440,"width":280,"height":45,"backgroundColor":"#c7d2fe","strokeColor":"#6366f1","rounding":true,"label":"Prometheus Metrics (Inline)"},

  -- CAPI resources
  {"type":"rectangle","id":"capi-cluster","x":460,"y":80,"width":280,"height":45,"backgroundColor":"#a7f3d0","strokeColor":"#10b981","rounding":true,"label":"Cluster (CAPI CRD)"},
  {"type":"rectangle","id":"capi-ctrlplane","x":460,"y":140,"width":280,"height":45,"backgroundColor":"#a7f3d0","strokeColor":"#10b981","rounding":true,"label":"KubeadmControlPlane"},
  {"type":"rectangle","id":"capi-md","x":460,"y":200,"width":280,"height":45,"backgroundColor":"#a7f3d0","strokeColor":"#10b981","rounding":true,"label":"MachineDeployment / MachineSet"},
  {"type":"rectangle","id":"capi-machine","x":460,"y":260,"width":280,"height":45,"backgroundColor":"#a7f3d0","strokeColor":"#10b981","rounding":true,"label":"Machine / MachinePool"},
  {"type":"rectangle","id":"capi-kubeadmconfig","x":460,"y":320,"width":280,"height":45,"backgroundColor":"#a7f3d0","strokeColor":"#10b981","rounding":true,"label":"KubeadmConfig / KubeadmConfigTemplate"},
  {"type":"rectangle","id":"capi-clusterclass","x":460,"y":380,"width":280,"height":45,"backgroundColor":"#a7f3d0","strokeColor":"#10b981","rounding":true,"label":"ClusterClass (Topology)"},

  -- Infrastructure providers
  {"type":"rectangle","id":"infra-aws","x":860,"y":80,"width":200,"height":45,"backgroundColor":"#fde68a","strokeColor":"#f59e0b","rounding":true,"label":"AWS (CAPA)"},
  {"type":"rectangle","id":"infra-azure","x":860,"y":140,"width":200,"height":45,"backgroundColor":"#fde68a","strokeColor":"#f59e0b","rounding":true,"label":"Azure (CAPZ)"},
  {"type":"rectangle","id":"infra-gcp","x":860,"y":200,"width":200,"height":45,"backgroundColor":"#fde68a","strokeColor":"#f59e0b","rounding":true,"label":"GCP (CAPG)"},
  {"type":"rectangle","id":"infra-docker","x":860,"y":260,"width":200,"height":45,"backgroundColor":"#fde68a","strokeColor":"#f59e0b","rounding":true,"label":"Docker (kind/cluster-api)"},

  -- Connections
  {"type":"arrow","id":"conn1","x":340,"y":102,"x2":440,"y2":102,"strokeColor":"#6366f1","strokeWidth":2,"roughness":2,"startArrowhead":"arrow","label":"Visualizes"},
  {"type":"arrow","id":"conn2","x":720,"y":102,"x2":840,"y2":102,"strokeColor":"#10b981","strokeWidth":2,"roughness":2,"startArrowhead":"arrow","label":"Provisions"},
  {"type":"arrow","id":"conn3","x":720,"y":162,"x2":840,"y2":162,"strokeColor":"#10b981","strokeWidth":2,"roughness":2,"startArrowhead":"arrow"},
  {"type":"arrow","id":"conn4","x":720,"y":222,"x2":840,"y2":222,"strokeColor":"#10b981","strokeWidth":2,"roughness":2,"startArrowhead":"arrow"},

  -- Legend
  {"type":"text","id":"legend","x":40,"y":520,"fontSize":14,"text":"🟣 Headlamp Plugin | 🟢 CAPI Resources | 🟡 Infrastructure Providers"}
```

## Key Benefits Over CLI Workflow

| Task | CLI (`kubectl`) | Headlamp CAPI Plugin |
|------|-----------------|---------------------|
| View cluster health | Multiple `kubectl get` + `describe` commands | Single dashboard view |
| Debug machine failures | Manual condition parsing from YAML | Visual conditions + remediation guidance |
| Scale machine deployments | `kubectl edit machinedeployment` | UI scale dialog |
| Trace ownership chains | `kubectl get --show-labels` + manual correlation | Map view with automatic hierarchy |
| Inspect bootstrap config | `kubectl get kubeadmconfig -o yaml` | Structured UI view |
| Correlate with metrics | Switch to Prometheus/Grafana | Inline on detail pages |

## Limitations

- **Alpha release** — API and features may change
- Does not replace `kubectl` or CAPI CLI for automation and scripting
- Requires CAPI resources to already exist in a management cluster

## Future Work

Planned improvements include:
- Additional CAPI provider support
- Richer scheduling insights
- More workflow-oriented visibility across multi-cluster operations
- Enhanced Prometheus integration

## References

- [Original Article: Introducing the Cluster API plugin for Headlamp](https://kubernetes.io/blog/2026/06/25/headlamp-cluster-api-plugin/) — Kubernetes Blog, June 25, 2026
- [Headlamp CAPI Plugin Repository](https://github.com/headlamp-k8s/plugins/tree/main/cluster-api)
- [Cluster API Documentation](https://cluster-api.sigs.k8s.io/)
- [Headlamp Project](https://headlamp.dev/)

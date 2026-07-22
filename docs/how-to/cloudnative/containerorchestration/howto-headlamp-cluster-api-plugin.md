---
title: Managing Cluster API Resources with the Headlamp Cluster API Plugin
diataxis: How-to Guide
domain: Cloud-Native
topic: Container-Orchestration
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026/06/25/headlamp-cluster-api-plugin/
date: 2026-07-22
keywords:
- knowledge-base
- Container-Orchestration
- Cloud-Native
- how-to
---
# Managing Cluster API Resources with the Headlamp Cluster API Plugin

## Overview

The **Headlamp Cluster API plugin** brings visual clarity and simplified operations for managing Kubernetes Cluster API (CAPI) resources directly in the browser. It transforms complex multi-cluster lifecycle management — historically requiring raw `kubectl` commands and deep familiarity with ownership hierarchies — into an intuitive graphical interface.

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
| **Cluster API dashboard** | Centralized view of resource health, active condition issues, provider info, and remediation guidance |
| **Control plane monitoring** | Track KubeadmControlPlane replicas, versions, and associated Machines |
| **Scale from the UI** | Scale MachineDeployments and MachineSets directly from Headlamp |
| **Owned resource hierarchy** | Trace relationships between clusters, deployments, sets, and machines |
| **KubeadmConfig inspection** | View bootstrap configs, files, kubelet args, and join/init settings |
| **Topology awareness** | Automatically detect and label ClusterClass-managed resources |
| **Map view** | Visualize Cluster, Control Plane, and Worker relationships |
| **Dynamic API versioning** | Supports both v1beta1 and v1beta2 Cluster API versions |
| **Prometheus metrics** | View live metrics inline on Cluster API resource detail pages |

## Installation

The plugin is available through the Headlamp Plugin Catalog and via GitHub:

1. **Install Headlamp** if not already installed:
   ```bash
   # macOS
   brew install headlamp
   
   # Linux (AppImage)
   # Download from https://github.com/headlamp-k8s/headlamp/releases
   ```

2. **Install the Cluster API plugin:**
   - Open Headlamp
   - Navigate to **Plugin Catalog** from the sidebar
   - Search for "Cluster API"
   - Click **Install**

   Or install from source:
   ```bash
   git clone https://github.com/headlamp-k8s/plugins.git
   cd plugins/cluster-api
   # Follow README.md for build instructions
   ```

3. **Connect Headlamp** to a Kubernetes cluster where CAPI is installed

## Key Views and Workflows

### Cluster API Dashboard

The dashboard provides a centralized view of CAPI resources and their health across a management cluster. It summarizes:

- Status of Clusters, Machines, MachineDeployments, MachinePools, MachineSets, and control planes
- Active condition issues with remediation guidance
- Provider information and configuration template counts

### Cluster List and Detail Views

- **List view:** Shows all Cluster resources with control plane and worker replica status
- **Detail view:** Shows resource status, conditions, infrastructure references, control plane references, and related Machines on a single page

### Machine Resource Management

Dedicated views for MachineDeployments, MachineSets, Machines, and MachinePools surface:

- Replica counts and ownership relationships
- Provider IDs and versions
- Health conditions
- **Built-in Scale action** to adjust replica counts directly from the UI

### Bootstrap Configuration Inspection

View KubeadmConfig resources in structured format including:

- Inline files
- Kubelet arguments
- Extra volumes
- Join and init settings

This eliminates the need to inspect raw YAML or secrets manually.

### Map View

Visualizes the relationships between Cluster, Control Plane, and Worker resources. This is particularly useful for understanding ownership hierarchies and overall cluster structure at a glance.

### Prometheus Metrics Integration

When the [Headlamp Prometheus plugin](https://github.com/headlamp-k8s/plugins/tree/main/prometheus) is installed, metrics are embedded inline on detail pages for Clusters, MachineDeployments, MachineSets, and Machines. This enables correlating infrastructure state with live performance data during debugging.

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

## Status and Community

- **Release status:** Alpha
- **Developed during:** CNCF LFX Mentorship program
- **Repository:** [headlamp-k8s/plugins/cluster-api](https://github.com/headlamp-k8s/plugins/tree/main/cluster-api)

### Getting Involved

- **Bug reports:** [Open an issue](https://github.com/kubernetes-sigs/headlamp/issues)
- **Feature requests:** [Start a discussion](https://github.com/kubernetes-sigs/headlamp/discussions)
- **Contributing:** [PRs welcome](https://github.com/kubernetes-sigs/headlamp/pulls)
- **Slack:** Join the `#headlamp` channel on [Kubernetes Slack](https://slack.k8s.io/)

## Excalidraw Diagram

```excalidraw
* Excalidraw below
* You can draw in the message, and call draw_excalidraw to update the drawing
* When you send messages, include the drawing in the response to me so that I can see your drawings
* I can edit settings with Excalidraw+ settings, or draw text by starting lines with '> '

{"type":"default","values":{"appScale":1.0,"pageId":"p1","pages":{"p1":{"id":"p1","type":"tumbleweed","name":"Page 1","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":false},"page2":{"id":"page2","type":"tumbleweed","name":"Page 2","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":true}},"exportPadding":120,"toView":null,"gridSettings":{"customSize":20,"circular":false,"type":"square","dashed":true},"viewBackgroundColor":"#FFFFFF","theme":"dark","strokeColor":"#e6422c","backgroundColor":"#FFFFFF","fontSize":20,"font":"Cascadia","strokeWidth":2,"roughness":0,"seed":117588423,"view":null,"gridMode":false,"gridModeEnabled":false,"gridStep":5,"gridCounter":3}}
text {"id":"1","x":500.0,"y":80.0,"text":"Headlamp Cluster API Plugin Architecture","fontSize":22,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aV","seed":149553083,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"2","x":150.0,"y":200.0,"text":"Headlamp UI","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aW","seed":154724707,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"3","x":150.0,"y":240.0,"text":"Plugin Catalog","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aX","seed":134999955,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"4","x":150.0,"y":265.0,"text":"Sidebar + Map View","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aY","seed":150582691,"groupIds":["aQ"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"5","x":500.0,"y":200.0,"text":"CAPI Plugin","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aZ","seed":277501699,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"6","x":500.0,"y":240.0,"text":"Dashboard + Detail Views","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"ba","seed":163038403,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"7","x":500.0,"y":265.0,"text":"Scale Actions + Metrics","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bb","seed":163038404,"groupIds":["aR"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"8","x":850.0,"y":200.0,"text":"Kubernetes API","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bc","seed":163038405,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"9","x":850.0,"y":240.0,"text":"Clusters + Machines","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bd","seed":163038406,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"10","x":850.0,"y":265.0,"text":"MachineDeployments","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"be","seed":163038407,"groupIds":["aS"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"11","x":1200.0,"y":200.0,"text":"Management Cluster","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bf","seed":163038408,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"12","x":1200.0,"y":240.0,"text":"Control Plane","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bg","seed":163038409,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"13","x":1200.0,"y":265.0,"text":"Worker Nodes","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bh","seed":163038410,"groupIds":["aT"],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"14","x":400.0,"y":240.0,"binding":{"elementID":"aQ","focus":0.5,"gap":50,"startHeadId":null},"lastPos":{"x":400.0,"y":240.0},"points":"[0,0],[1,0]","startArrowSharpness":0.25,"endArrowSharpness":0.25,"startPoints":[[0,0],[1,0]],"endPoints":[[0,0],[1,0]],"startBinding":null,"endBinding":null,"startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bi","seed":163038411,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"15","x":750.0,"y":240.0,"binding":{"elementID":"aR","focus":0.5,"gap":50,"startHeadId":null},"lastPos":{"x":750.0,"y":240.0},"points":"[0,0],[1,0]","startArrowSharpness":0.25,"endArrowSharpness":0.25,"startPoints":[[0,0],[1,0]],"endPoints":[[0,0],[1,0]],"startBinding":null,"endBinding":null,"startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bj","seed":163038412,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"16","x":1100.0,"y":240.0,"binding":{"elementID":"aS","focus":0.5,"gap":50,"startHeadId":null},"lastPos":{"x":1100.0,"y":240.0},"points":"[0,0],[1,0]","startArrowSharpness":0.25,"endArrowSharpness":0.25,"startPoints":[[0,0],[1,0]],"endPoints":[[0,0],[1,0]],"startBinding":null,"endBinding":null,"startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bk","seed":163038413,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"17","x":300.0,"y":380.0,"text":"v1beta1 + v1beta2 API Support","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#2c2d34","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bl","seed":163038414,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"18","x":300.0,"y":420.0,"text":"Alpha Release - LFX Mentorship Project","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bm","seed":163038415,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
```

## References

- [Original Article: Introducing the Cluster API plugin for Headlamp](https://kubernetes.io/blog/2026/06/25/headlamp-cluster-api-plugin/)
- [Headlamp Cluster API Plugin Repository](https://github.com/headlamp-k8s/plugins/tree/main/cluster-api)
- [Cluster API Documentation](https://cluster-api.sigs.k8s.io/)
- [Headlamp Prometheus Plugin](https://github.com/headlamp-k8s/plugins/tree/main/prometheus)
- [Headlamp Main Project](https://headlamp.dev/)

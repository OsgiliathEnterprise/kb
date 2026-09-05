---
title: Inspecting Volcano and Knative Workloads with Headlamp Plugins
diataxis: How-to Guide
domain: cloud-infrastructure
topic: kubernetes
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026-06-25/visual-context-volcano-headlamp-plugin/
date: 2026-09-05
keywords:
- knowledge-base
- kubernetes
- cloud-infrastructure
- how-to
---
# Inspecting Volcano and Knative Workloads with Headlamp Plugins

[Headlamp](https://headlamp.dev) is an extensible Kubernetes web UI (desktop app or in-cluster). In June 2026 two plugins landed that bring batch-scheduling and serverless workloads into the same interface: a **Volcano plugin** for gang-scheduled HPC/AI-ML batch jobs, and a **Knative plugin** (0.3.0-beta) for serverless services. This note covers how to install both and what each surfaces.

## Why these plugins exist

- **Volcano** is a cloud-native batch scheduler for Kubernetes built for high-performance computing, AI/ML, and other batch workloads. Its CRDs (`Job`, `Queue`, `PodGroup`) are invisible to stock UIs; operators normally reconstruct relationships between jobs, queues, pods, and events with multiple `kubectl` commands.
- **Knative** brings serverless semantics (traffic routing, autoscaling, revision management) to Kubernetes, but day-to-day operation still means jumping between the `kn` CLI, `kubectl`, and a generic UI.

Both plugins add dedicated sidebar sections so you can move directly between related resources without switching tools. They complement — not replace — `kubectl`/CLI automation.

## Install the Volcano plugin

1. Install [Headlamp](https://headlamp.dev/docs/latest/installation/) (desktop app or in-cluster deployment).
2. Open the **Plugin Catalog** from the Headlamp UI.
3. Search for **Volcano** and install it.
4. Connect Headlamp to a cluster where [Volcano is already installed](https://volcano.sh/docs/GettingStarted/Installation) (working kubeconfig required).

A `Volcano` section appears in the sidebar with list and detail pages for:

| Resource | API Group |
| --- | --- |
| Volcano Job | `batch.volcano.sh/v1alpha1` |
| Queue | `scheduling.volcano.sh/v1beta1` |
| PodGroup | `scheduling.volcano.sh/v1beta1` |
| JobTemplate | `flow.volcano.sh/v1alpha1` |
| JobFlow | `flow.volcano.sh/v1alpha1` |

Detail pages show scheduling-focused fields: job status, queue, task progress, PodGroup phase, queue state, generated jobs, conditions, and related events — with cross-links (Job → Queue, Job → PodGroup). The Jobs list also exposes suspend/resume actions where the current job state supports them.

## Install the Knative plugin

1. Make sure Knative is installed in your cluster.
2. In Headlamp Desktop, open the **Plugin Catalog**, search for **Knative**, and click **Install**.
3. Reload Headlamp — a new `Knative` entry appears in the sidebar (current release: 0.3.0-beta; built as part of an LFX mentorship).

The plugin lets you inspect, understand, and act on Knative workloads from one place instead of alternating between `kn`, `kubectl`, and generic UIs. For source-level setup see the [Knative plugin README](https://github.com/headlamp-k8s/plugins) in the Headlamp plugins repository.

## Verify resources with kubectl

After installing Volcano and loading the plugin, create or use existing workloads, then cross-check what the UI displays:

```bash
kubectl get vcjobs -A
kubectl get queues
kubectl get podgroups -A
kubectl get jobtemplates -A
kubectl get jobflows -A
```

Then open `Volcano > Jobs`, `Queues`, `PodGroups`, `JobTemplates`, and `JobFlows` in Headlamp and confirm the list columns, detail sections, conditions, and events match.

## Use the resource map for relationships

Both plugins integrate with Headlamp's **resource map**, which visualizes how scheduling resources relate:

- Queue hierarchy (parent/child Queues)
- Volcano Jobs connected to their PodGroups
- Pods connected back to the owning/labeled Volcano Job
- Queue details reachable from the map without dense queue-to-workload edges

Open the resource map, enable the Volcano map sources, and follow a workload from Pod → Volcano Job → PodGroup, or inspect the queue hierarchy used by scheduled workloads.

## Clean up test workloads

If you created sample workloads only for testing:

```bash
kubectl delete vcjobs --all -n <namespace>
kubectl delete jobflows --all -n <namespace>
kubectl delete jobtemplates --all -n <namespace>
```

Do not delete shared Queues unless no other workloads use them.

## Diagram: Volcano resource relationships in Headlamp

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "vc-queue-parent",
      "type": "rectangle",
      "x": 40,
      "y": 50,
      "width": 160,
      "height": 70,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f9d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 301,
      "versionNonce": 301,
      "isDeleted": false,
      "boundElements": [
        {
          "id": "vc-text-queue-parent",
          "type": "text"
        }
      ],
      "updated": 1756934400000
    },
    {
      "id": "vc-queue-child",
      "type": "rectangle",
      "x": 40,
      "y": 200,
      "width": 160,
      "height": 70,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f9d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 302,
      "versionNonce": 302,
      "isDeleted": false,
      "boundElements": [
        {
          "id": "vc-text-queue-child",
          "type": "text"
        }
      ],
      "updated": 1756934400000
    },
    {
      "id": "vc-job",
      "type": "rectangle",
      "x": 320,
      "y": 125,
      "width": 180,
      "height": 70,
      "angle": 0,
      "strokeColor": "#e8590c",
      "backgroundColor": "#ffd8a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 303,
      "versionNonce": 303,
      "isDeleted": false,
      "boundElements": [
        {
          "id": "vc-text-job",
          "type": "text"
        }
      ],
      "updated": 1756934400000
    },
    {
      "id": "vc-podgroup",
      "type": "rectangle",
      "x": 620,
      "y": 125,
      "width": 180,
      "height": 70,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 304,
      "versionNonce": 304,
      "isDeleted": false,
      "boundElements": [
        {
          "id": "vc-text-podgroup",
          "type": "text"
        }
      ],
      "updated": 1756934400000
    },
    {
      "id": "vc-pods",
      "type": "rectangle",
      "x": 620,
      "y": 280,
      "width": 180,
      "height": 70,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#e5dbff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "dashed",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 305,
      "versionNonce": 305,
      "isDeleted": false,
      "boundElements": [
        {
          "id": "vc-text-pods",
          "type": "text"
        }
      ],
      "updated": 1756934400000
    },
    {
      "id": "vc-arrow-queue-hier",
      "type": "arrow",
      "x": 120,
      "y": 122,
      "width": 0,
      "height": 76,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 306,
      "versionNonce": 306,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "points": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 0,
          "y": 76
        }
      ]
    },
    {
      "id": "vc-arrow-queue-job",
      "type": "arrow",
      "x": 202,
      "y": 185,
      "width": 116,
      "height": -30,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 307,
      "versionNonce": 307,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "points": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 116,
          "y": -30
        }
      ]
    },
    {
      "id": "vc-arrow-job-podgroup",
      "type": "arrow",
      "x": 502,
      "y": 160,
      "width": 116,
      "height": 0,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 308,
      "versionNonce": 308,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "points": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 116,
          "y": 0
        }
      ]
    },
    {
      "id": "vc-arrow-podgroup-pods",
      "type": "arrow",
      "x": 710,
      "y": 197,
      "width": 0,
      "height": 81,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "dashed",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 309,
      "versionNonce": 309,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "points": [
        {
          "x": 0,
          "y": 0
        },
        {
          "x": 0,
          "y": 81
        }
      ]
    },
    {
      "id": "vc-text-queue-parent",
      "type": "text",
      "x": 52,
      "y": 62,
      "width": 136,
      "height": 46,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 310,
      "versionNonce": 310,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "text": "Queue (parent)\nscheduling.volcano.sh/v1beta1",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Queue (parent)\nscheduling.volcano.sh/v1beta1",
      "lineHeight": 1.25
    },
    {
      "id": "vc-text-queue-child",
      "type": "text",
      "x": 52,
      "y": 212,
      "width": 136,
      "height": 46,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 311,
      "versionNonce": 311,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "text": "Queue (child)\nweight + guarantees",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Queue (child)\nweight + guarantees",
      "lineHeight": 1.25
    },
    {
      "id": "vc-text-job",
      "type": "text",
      "x": 332,
      "y": 140,
      "width": 156,
      "height": 40,
      "angle": 0,
      "strokeColor": "#e8590c",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 312,
      "versionNonce": 312,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "text": "Volcano Job\nbatch.volcano.sh/v1alpha1",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Volcano Job\nbatch.volcano.sh/v1alpha1",
      "lineHeight": 1.25
    },
    {
      "id": "vc-text-podgroup",
      "type": "text",
      "x": 632,
      "y": 140,
      "width": 156,
      "height": 40,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 313,
      "versionNonce": 313,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "text": "PodGroup (gang)\nmin members + phase",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "PodGroup (gang)\nmin members + phase",
      "lineHeight": 1.25
    },
    {
      "id": "vc-text-pods",
      "type": "text",
      "x": 632,
      "y": 295,
      "width": 156,
      "height": 40,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 314,
      "versionNonce": 314,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "text": "Pods\n(owned/labeled by Job)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Pods\n(owned/labeled by Job)",
      "lineHeight": 1.25
    },
    {
      "id": "vc-title-text",
      "type": "text",
      "x": 40,
      "y": 15,
      "width": 400,
      "height": 25,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 315,
      "versionNonce": 315,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1756934400000,
      "text": "Volcano resource map in Headlamp",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "containerId": null,
      "originalText": "Volcano resource map in Headlamp",
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": null
  },
  "files": {}
}
```

## Future work and feedback

- Volcano plugin: Prometheus integration, richer scheduling insights, and more workflow-oriented visibility are planned.
- Both plugins live in the [Headlamp plugins repository](https://github.com/headlamp-k8s/plugins); open issues there for feature requests or bug reports.

## References

- [Inspect Volcano workloads faster with Headlamp (Kubernetes Blog)](https://kubernetes.io/blog/2026-06-25/visual-context-volcano-headlamp-plugin/)
- [See your serverless: introducing the Headlamp plugin for Knative (Kubernetes Blog)](https://kubernetes.io/blog/2026-06-25/headlamp-knative-plugin/)
- [Headlamp on Volcano (Volcano docs)](https://volcano.sh/docs/ecosystem/headlamponvolcano/)
- [Managing Cluster API Resources with the Headlamp Plugin](howto-manage-cluster-api-resources-with-headlamp.md) — companion note for CAPI in Headlamp

---
title: 'From Kubernetes Dashboard to Headlamp: Understanding the Transition'
diataxis: How-to Guide
domain: Cloud & Infrastructure
topic: Kubernetes
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026/06/01/dashboard-to-headlamp/
keywords:
- knowledge-base
- Kubernetes
- Cloud & Infrastructure
- how-to
---
# From Kubernetes Dashboard to Headlamp: Understanding the Transition

## Summary

The **Kubernetes Dashboard** project has been archived. [Headlamp](https://github.com/headlamp-k8s/headlamp) is the recommended successor — a modern, extensible Kubernetes UI that preserves familiar workflows while adding multi-cluster support, application-centric views (Projects), and a plugin ecosystem. This note distills the official Kubernetes Blog transition guide (June 1, 2026) into a practical migration reference.

## Why This Matters

Kubernetes Dashboard was the first visual window into Kubernetes for many users — a critical onramp for developers, students, and operators. With the project archived, teams need a clear path forward. Headlamp maintains continuity (same core workflows, same RBAC model) while addressing the limitations that emerged as teams scaled to multi-cluster, multi-environment setups.

## What Stays the Same (Continuity Guarantees)

| Kubernetes Dashboard | Headlamp | Notes |
|---|---|---|
| Browse pods, deployments, services, namespaces | Same workload browsing | Familiar resource organization |
| View/edit manifests in UI | Same manifest editing | RBAC-respecting, same permissions model |
| Delete resources, scale workloads | Same CRUD operations | Standard Kubernetes RBAC enforced |
| Namespace-scoped views | Namespace + cluster views | Extended with multi-cluster support |

## Where Headlamp Goes Beyond

### 1. Multi-Cluster Workflows

Kubernetes Dashboard was single-cluster only. Headlamp supports **multiple clusters from one interface** — no tool-switching, no context loss.

- Manage dev, staging, and production side by side
- Navigate between clusters without losing orientation
- Connect via existing `kubeconfig` — no cluster-side deployment needed

### 2. Projects: Application-Centric Views

Instead of jumping between resource lists, **Projects** group related workloads, services, and configurations under one application umbrella.

- Built on native Kubernetes concepts (namespaces, labels, RBAC)
- Optional — you can still work at the individual resource level
- Visual relationship mapping between resources
- Troubleshoot in context instead of scanning piece by piece

### 3. Plugin Ecosystem

Headlamp is extensible through plugins that bring workflows directly into the UI:

- **Flux Plugin**: GitOps workflows — view application state alongside the resources Flux manages
- **AI Assistant**: Conversational troubleshooting and action within the same screen
- **Custom Plugins**: Platform teams can build internal integrations matching their specific workflows

### 4. Flexible Deployment Options

| Mode | Best For | Deployment |
|---|---|---|
| **In-cluster** | Shared/production environments, centrally managed UI | Deployed as a Kubernetes component |
| **Desktop app** | Local development, onboarding, multi-cluster management | Standalone binary, uses kubeconfig |
| **Both** | Hybrid teams | Desktop for daily work, in-cluster for shared access |

These modes are **not mutually exclusive** — many teams use both.

## Migration Preparation Checklist

Before migrating from Kubernetes Dashboard to Headlamp:

1. **Inventory your access patterns**
   - Which clusters and namespaces do you access?
   - How does authentication work (kubeconfig, service accounts)?
   - Headlamp uses standard Kubernetes auth — existing access models carry over

2. **Map your critical workflows**
   - Quick inspection / troubleshooting? → Supported in Headlamp
   - Lightweight edits / validation? → Supported in Headlamp
   - Custom integrations? → Consider Headlamp plugins

3. **Try Headlamp before migrating**
   - Explore at [headlamp.dev](https://headlamp.dev)
   - Desktop app requires no cluster deployment — just point it at your kubeconfig

4. **Plan the rollout**
   - Start with non-production environments
   - Verify RBAC permissions work as expected
   - Train team on new features (Projects, multi-cluster nav)

## Transition Architecture

```excalidraw
* Excalidraw - Dashboard to Headlamp Transition
  {"type":"excalidraw","version":2,"source":"https://excalidraw.com"}
  ,
  {"type":"frame","id":"frame-dashboard","x":40,"y":40,"width":280,"height":300,"strokeColor":"#ef4444","backgroundColor":"#fef2f2","label":"Kubernetes Dashboard (Archived)"},
  {"type":"frame","id":"frame-headlamp","x":400,"y":40,"width":360,"height":500,"strokeColor":"#22c55e","backgroundColor":"#f0fdf4","label":"Headlamp (Recommended)"},
  {"type":"arrow","id":"arrow-transition","x":320,"y":190,"x2":400,"y2":190,"strokeColor":"#f59e0b","strokeWidth":3,"roughness":2,"startArrowhead":"arrow","label":"Migration Path"},

  -- Dashboard elements (inside red frame)
  {"type":"rectangle","id":"dash-single-cluster","x":60,"y":70,"width":240,"height":50,"backgroundColor":"#fee2e2","strokeColor":"#dc2626","rounding":true,"label":"Single Cluster Only"},
  {"type":"rectangle","id":"dash-resources","x":60,"y":140,"width":240,"height":50,"backgroundColor":"#fee2e2","strokeColor":"#dc2626","rounding":true,"label":"Resource Lists (Pods, Deployments...)"},
  {"type":"rectangle","id":"dash-manifest","x":60,"y":210,"width":240,"height":50,"backgroundColor":"#fee2e2","strokeColor":"#dc2626","rounding":true,"label":"Manifest View/Edit"},
  {"type":"rectangle","id":"dash-rbac","x":60,"y":280,"width":240,"height":50,"backgroundColor":"#fee2e2","strokeColor":"#dc2626","rounding":true,"label":"RBAC-Based Access"},

  -- Headlamp elements (inside green frame)
  {"type":"rectangle","id":"hl-multi-cluster","x":420,"y":70,"width":320,"height":50,"backgroundColor":"#dcfce7","strokeColor":"#16a34a","rounding":true,"label":"Multi-Cluster Support"},
  {"type":"rectangle","id":"hl-resources","x":420,"y":140,"width":320,"height":50,"backgroundColor":"#dcfce7","strokeColor":"#16a34a","rounding":true,"label":"Resource Lists + Projects (App-Centric)"},
  {"type":"rectangle","id":"hl-manifest","x":420,"y":210,"width":320,"height":50,"backgroundColor":"#dcfce7","strokeColor":"#16a34a","rounding":true,"label":"Manifest View/Edit (Same RBAC)"},
  {"type":"rectangle","id":"hl-plugins","x":420,"y":280,"width":320,"height":50,"backgroundColor":"#dcfce7","strokeColor":"#16a34a","rounding":true,"label":"Plugin Ecosystem (Flux, AI Assistant, Custom)"},
  {"type":"rectangle","id":"hl-deploy","x":420,"y":350,"width":320,"height":50,"backgroundColor":"#dcfce7","strokeColor":"#16a34a","rounding":true,"label":"Flexible Deployment (In-Cluster + Desktop)"},
  {"type":"rectangle","id":"hl-visual","x":420,"y":420,"width":320,"height":50,"backgroundColor":"#dcfce7","strokeColor":"#16a34a","rounding":true,"label":"Visual Relationship Mapping"},

  -- Continuity arrows (same features)
  {"type":"arrow","id":"cont-resources","x":300,"y":165,"x2":420,"y2":165,"strokeColor":"#3b82f6","strokeWidth":2,"roughness":2,"startArrowhead":"arrow","endArrowhead":"arrow","label":"Same"},
  {"type":"arrow","id":"cont-manifest","x":300,"y":235,"x2":420,"y2":235,"strokeColor":"#3b82f6","strokeWidth":2,"roughness":2,"startArrowhead":"arrow","endArrowhead":"arrow","label":"Same"},
  {"type":"arrow","id":"cont-rbac","x":300,"y":305,"x2":420,"y2":305,"strokeColor":"#3b82f6","strokeWidth":2,"roughness":2,"startArrowhead":"arrow","endArrowhead":"arrow","label":"Same"},

  -- Legend
  {"type":"text","id":"legend","x":40,"y":560,"fontSize":14,"text":"🔴 Archived | 🟢 Recommended | 🔵 Continuity (same in both) | 🟡 Migration path"},
  {"type":"text","id":"note","x":40,"y":590,"fontSize":12,"text":"Dashboard → Headlamp preserves core workflows while adding multi-cluster, plugins, and app-centric views."}
```

## References

- **Original Article**: [From Kubernetes Dashboard to Headlamp: Understanding the Transition](https://kubernetes.io/blog/2026/06/01/dashboard-to-headlamp/) — Kubernetes Blog, June 1, 2026 (Will Case, Headlamp)
- **Headlamp Project**: &lt;https://headlamp.dev&gt;
- **Headlamp GitHub**: &lt;https://github.com/headlamp-k8s/headlamp&gt;
- **Kubernetes Dashboard (Archived)**: &lt;https://github.com/kubernetes/dashboard&gt;

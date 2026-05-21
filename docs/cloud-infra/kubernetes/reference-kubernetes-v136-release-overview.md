---

title: "Kubernetes v1.36 Release Overview"
description: "Kubernetes v1.36 Release Overview"
tags: [reference,documentation, "Cloud & Infrastructure"]
date: 2026-05-17
sidebar_label: "Kubernetes v1.36 Release Overview"

---



# Kubernetes v1.36 Release Overview

## Summary
Kubernetes v1.36 brings a major wave of feature graduations, scaling improvements, and deprecations. Key highlights include PSI metrics reaching GA, server-side sharded list/watch for large clusters, DRA maturation with new drivers, volume group snapshots reaching GA, workload-aware scheduling improvements, Mixed Version Proxy moving to Beta, and the deprecation of Service ExternalIPs.

## Why This Release Matters
v1.36 is a significant maturity release — multiple Alpha/Beta features graduate to GA/Beta, improving stability guarantees for production clusters. The scaling improvements (sharded list/watch, PSI metrics) directly address challenges in large clusters (10K+ nodes), while the DRA and workload-aware scheduling features lay groundwork for AI/ML workloads on Kubernetes.

---

## 🔴 GA Features

### 1. PSI Metrics for Kubernetes (GA)
Pressure Stall Information (PSI) metrics graduate to General Availability. Unlike traditional utilization metrics, PSI tracks **tasks stalled and time lost**, packaged as percentages across configurable time windows.

**Why it matters:** Monitoring CPU or memory usage alone can be misleading. A node may report XX% (below 100%) CPU utilization while certain tasks experience severe latency due to scheduling delays. PSI fills this gap with cumulative totals and moving averages (10s, 60s, 300s windows).

**Key capabilities:**
- Tracks CPU, memory, and I/O pressure with `some` (partial) and `full` (complete stall) metrics
- Moving averages: `avg10`, `avg60`, `avg300` for short/medium/long-term pressure trends
- `total` metric provides absolute stall time in microseconds for custom averaging
- SIG Node validated with 80+ pod high-density workloads — negligible overhead (~0.1 cores kubelet)
- Linux-only (kernel ≥ 4.20, cgroup v2, CONFIG_PSI=y)

**Requirements:**
1. Linux kernel ≥ 4.20
2. cgroup v2 enabled
3. OS-level PSI enabled (CONFIG_PSI=y, not booted with psi=0)
4. No feature gate required (GA status)
5. ⚠️ Windows nodes: PSI is Linux-only

**How to Query PSI Metrics:**
```bash
# Via Summary API (privileged)
CONTAINER_NAME="example-container"
kubectl get --raw "/api/v1/nodes/$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')/proxy/stats/summary" | jq '.pods[].containers[] | select(.name=="'"$CONTAINER_NAME"'") | {name, cpu: .cpu.psi, memory: .memory.psi, io: .io.psi}'

# Via Prometheus (scrape /metrics/cadvisor endpoint)
# PSI metrics appear as cadvisor container metrics with .psi suffix
```

**PSI Threshold Monitoring (Kernel Level):**
```bash
# Register trigger: partial memory stall > 150ms within 1s window
echo "some 150000 1000000" > /proc/pressure/memory

# Register trigger: full I/O stall > 50ms within 1s window
echo "full 50000 1000000" > /proc/pressure/io

# Monitor with poll()/epoll() for event-driven alerts
```

**Common Pitfalls:**
- False zeros on unsupported kernels (fixed in v1.36 — kubelet now checks cgroup config)
- Privileged access required for proxying to kubelet
- Windows nodes silently excluded

### 2. Volume Group Snapshots (GA)
Volume group snapshots, introduced as Alpha in v1.27, moved to Beta in v1.32 and v1.34, now reach GA in v1.36.

**Why it matters:** Enables crash-consistent snapshots across multiple volumes simultaneously — critical for databases and multi-volume applications where individual volume snapshots can result in inconsistent state.

**Key capabilities:**
- Extension APIs for group snapshots
- Crash-consistent snapshots for sets of volumes
- Behind the scenes, Kubernetes uses a leader volume pattern to coordinate snapshot timing

---

## 🟡 Beta Features

### 3. Mixed Version Proxy (Beta)
Introduced as Alpha in v1.28 under the `UnknownVersionInteroperabilityProxy` feature gate, Mixed Version Proxy (MVP) graduates to Beta in v1.36.

**Why it matters:** Makes cluster upgrades safer by ensuring that requests for resources not yet known to an older API server are correctly routed to a newer peer API server, instead of returning an incorrect 404 Not Found.

---

## 📋 Scaling & Architecture Improvements

### 4. Server-Side Sharded List and Watch
Addresses a critical scaling wall for large clusters (10K+ nodes).

**The problem:** Every replica of a horizontally scaled controller receives the full stream of events from the API server, paying CPU, memory, and network costs to deserialize everything, only to discard objects it is not responsible for. Scaling out the controller does not reduce per-replica cost — it multiplies it.

**The solution:** Server-side sharding distributes the watch stream across controller replicas, so each replica only receives events for the objects it is responsible for.

### 5. Workload-Aware Scheduling (Architectural Evolution)
v1.36 introduces a significant architectural evolution for workload-aware scheduling, cleanly separating API concerns.

**Context:** AI/ML and batch workloads introduce unique scheduling challenges beyond simple Pod-by-Pod scheduling. v1.35 introduced the foundational Workload API with basic gang scheduling and opportunistic batching.

**v1.36 improvements:**
- Clean separation of API concerns (Workload API vs. scheduling decisions)
- Enhanced gang scheduling support
- Better support for AI/ML and batch workload patterns

### 6. Dynamic Resource Allocation (DRA) — Next Era
DRA continues to mature in v1.36 with feature graduations, usability improvements, and new capabilities extending DRA to native resources like memory and CPU.

**Key improvements:**
- ResourceClaims in PodGroups support
- Expanded driver availability
- Support beyond specialized compute accelerators

---

## 📊 New Metrics

### 7. CCM Route Sync Metric (Alpha)
New alpha counter metric `route_controller_route_sync_total` added to the Cloud Controller Manager route controller.

**Purpose:** Increments each time routes are synced with the cloud provider. Added to help operators validate the `CloudControllerManagerWatchBasedRouteReconciliation` feature via A/B testing.

---

## ⚠️ Deprecations & Removals

### 8. Service ExternalIPs (Deprecated/Removed)
The `.spec.externalIPs` field for Service is deprecated and removed.

**Why:** The API assumes every user in the cluster is fully trusted, enabling security exploits (CVE-2020-8554). Kubernetes has recommended disabling ExternalIPs since v1.21.

**Migration path:** Use LoadBalancer services, Ingress resources, or NodePort services instead.

---

## Related Topics
- [example-benchmarking-ai-agents-on-kubernetes](Benchmarking AI Agents on Kubernetes)

## References
- 📰 [PSI Metrics GA](https://kubernetes.io/blog/2026/05/12/kubernetes-v1-36-psi-metrics-ga/) (May 12, 2026)
- 📰 [Server-Side Sharded List/Watch](https://kubernetes.io/blog/2026/05/06/kubernetes-v1-36-server-side-sharded-list-and-watch/) (May 6, 2026)
- 📰 [DRA Updates](https://kubernetes.io/blog/2026/05/07/kubernetes-v1-36-dra-136-updates/) (May 7, 2026)
- 📰 [Volume Group Snapshots GA](https://kubernetes.io/blog/2026/05/08/kubernetes-v1-36-volume-group-snapshot-ga/) (May 8, 2026)
- 📰 [Workload-Aware Scheduling](https://kubernetes.io/blog/2026/05/13/kubernetes-v1-36-advancing-workload-aware-scheduling/) (May 13, 2026)
- 📰 [Service ExternalIPs Deprecation](https://kubernetes.io/blog/2026/05/14/kubernetes-v1-36-deprecation-and-removal-of-service-externalips/) (May 14, 2026)
- 📰 [Mixed Version Proxy Beta](https://kubernetes.io/blog/2026/05/15/kubernetes-1-36-feature-mixed-version-proxy-beta/) (May 15, 2026)
- 📰 [CCM Route Sync Metric](https://kubernetes.io/blog/2026/05/15/ccm-new-metric-route-sync-total/) (May 15, 2026)
- 🔍 [Kernel PSI Documentation](https://docs.kernel.org/accounting/psi.html)
- 🔍 [Kubernetes PSI Guide](https://kubernetes.io/docs/reference/instrumentation/understand-psi-metrics/)

---
*Merged by Hermes Agent KB maintenance — consolidated 8 individual v1.36 release notes into comprehensive overview*

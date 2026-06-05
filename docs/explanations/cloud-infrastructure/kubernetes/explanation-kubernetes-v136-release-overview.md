---
title: 'Kubernetes v1.36: ハル (Haru) — Release Overview'
diataxis: Explanation
domain: Cloud & Infrastructure
topic: Kubernetes
source: Kubernetes
source_url: https://kubernetes.io/blog/2026/05/12/kubernetes-v1-36-psi-metrics-ga/
date: 2026-05-17
keywords:
- knowledge-base
- Kubernetes
- Cloud & Infrastructure
- explanations
---
# Kubernetes v1.36: ハル (Haru) — Release Overview

## Summary
Kubernetes v1.36, themed **"Haru"** (春, spring), delivers **70 enhancements**: 18 graduated to Stable, 25 entered Beta, and 25 graduated to Alpha. Key highlights include PSI metrics reaching GA, fine-grained kubelet API authorization (GA), resource health status (Beta), server-side sharded list/watch for large clusters, DRA maturation with new drivers, volume group snapshots reaching GA, workload-aware scheduling with atomic PodGroup scheduling, Mixed Version Proxy moving to Beta, and the deprecation of Service ExternalIPs.

## Release Theme
The logo, created by avocadoneko / Natsuho Ide, draws inspiration from Hokusai's *Thirty-six Views of Mount Fuji*. The calligraphy 晴れに翔け (hare ni kake) means "soar into clear skies" — a wish for the release and the community.

## Community Scale
Contributions from **106 companies** and **491 individuals**. The release blog describes it as arriving "as the season turns and the light shifts on the mountain."

## Security Focus
v1.36 has a strong emphasis on security hardening — User Namespaces (GA), Fine-Grained Kubelet Authz (GA), Service ExternalIPs removal, and Mutating Admission Policies all tighten the default security posture. InfoQ characterizes this as "security defaults tighten as AI workload support matures."

## Why This Release Matters
v1.36 is a significant maturity release — multiple Alpha/Beta features graduate to GA/Beta, improving stability guarantees for production clusters. The scaling improvements (sharded list/watch, PSI metrics) directly address challenges in large clusters (10K+ nodes), while the DRA and workload-aware scheduling features lay groundwork for AI/ML workloads on Kubernetes.

---

## 🔴 GA Features

### 1. Fine-Grained Kubelet API Authorization (GA)
**NEW in v1.36** — `KubeletFineGrainedAuthz` graduates to General Availability. Introduced as Alpha in v1.32, Beta (enabled by default) in v1.33, now fully GA.

**Why it matters:** Enables precise, least-privilege access control over the kubelet's HTTPS API, replacing the previous all-or-nothing authorization model. Critical for multi-tenant clusters and security-hardened environments.

**KEP:** #2862 (SIG Auth + SIG Node)

### 2. PSI Metrics for Kubernetes (GA)
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

### 3. User Namespaces in Pods (GA)
Linux user namespaces reached **General Availability** in v1.36 after a 10-year development timeline (6 years of active Kubernetes development). This is one of the longest-running feature efforts in the project's history.

**Why it matters:** Solves a fundamental container security problem — without user namespaces, a process running as root inside a container is also root on the host. User namespaces remap UIDs/GIDs so that "root in the container" is a non-privileged user on the host.

**Key breakthrough — ID-Mapped Mounts:** Before Linux 5.12's ID-mapped mounts, the runtime had to chown every file on every mount (O(n) operation). ID-mapped mounts translate UIDs/GIDs on-the-fly at the mount boundary, making setup O(1).

**How to use:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-workload
spec:
  hostUsers: false  # Run in a separate user namespace
  containers:
    - name: app
      image: my-app:latest
      # No container image modifications needed
```

**Platform support:** Linux-only (kernel ≥ 3.8 for user namespaces, ≥ 5.12 for ID-mapped mounts).

**Key authors:** Rodrigo Campos Catelin (Amutable), Giuseppe Scrivano (Red Hat).

**KEP:** #127 (SIG Node)

---

## 🟡 Beta Features

### 3. Resource Health Status (Beta)
**NEW in v1.36** — Before v1.34, Kubernetes lacked a native way to report the health of allocated devices, making it difficult to diagnose Pod crashes caused by hardware failures. Building on the alpha in v1.31 (Device Plugins), v1.36 expands this to cover both traditional plugins and the newer DRA framework.

**Why it matters:** Users can now run `kubectl describe pod` to determine if a container's crash loop is due to an `Unhealthy` or `Unknown` device status, regardless of provisioning method. Enables administrators and automated controllers to take corrective action.

**KEP:** #4680 (SIG Node)

### 4. Mutating Admission Policies (Beta)
Declarative, policy-based mutation of objects before admission — a native alternative to external admission controllers for common mutation patterns.

### 5. Declarative Validation with validation-gen (Beta)
Kubernetes native types can now be validated declaratively using validation-gen, reducing the need for custom validation webhooks.

### 6. Node Log Query (Beta)
Native API for querying node logs, improving debugging workflows without SSH access.

### 7. Staleness Mitigation for Controllers
Reduces unnecessary reconciliation cycles for controllers when resources haven't actually changed.

### 8. Mutable Container Resources (When Job Suspended)
Allows modifying container resources on suspended Jobs, enabling dynamic resource adjustment without recreating Jobs.

### 9. Mixed Version Proxy (Beta)
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
- **Atomic PodGroup Scheduling:** New PodGroup scheduling cycle evaluates the entire group atomically — either all pods in the group are bound together, or none are (beyond v1.35's minimum-count gang scheduling)
- Better support for AI/ML and batch workload patterns
- **KEPs:** #4671, #5547, #5832, #5732, #5710 (SIG Scheduling + SIG Apps)

#### Deep Dive: Workload-Aware Scheduling

**The Problem:** Traditional Kubernetes scheduling assumes independent pods. AI/ML workloads violate this assumption:

```
Traditional Workload          AI/ML Workload
────────────────────          ────────────────
Pod A ──► Schedule            PodGroup A
Pod B ──► Schedule            ├── Pod A (GPU 0)
Pod C ──► Schedule            ├── Pod B (GPU 1)     ◄── Must start together
                              ├── Pod C (GPU 2)     ◄── All-or-nothing
                              └── Pod D (GPU 3)
```

**Key features:**
- **PodGroup API (Alpha):** Groups related pods for coordinated scheduling with `minMembers`, `scheduleTimeoutSeconds`, and `topologyPolicy`
- **Gang Scheduling:** Pods within a PodGroup are scheduled atomically — all or nothing
- **Topology-Aware Placement:** NUMA awareness, GPU topology (NVLink vs PCIe), network topology (cross-rack minimization)
- **Workload-Aware Preemption:** Preempt entire workload groups rather than individual pods
- **DRA Integration:** GPU partitioning, dynamic resource adjustment, hardware-aware scheduling

**PodGroup Example:**
```yaml
apiVersion: scheduling.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: training-job-alpha
spec:
  minMembers: 4
  scheduleTimeoutSeconds: 300
  topologyPolicy: "Strict"
  template:
    spec:
      containers:
      - name: trainer
        image: pytorch:2.4
        resources:
          requests:
            nvidia.com/gpu: 1
```

**v1.35 vs v1.36 Scheduling Comparison:**

| Feature | v1.35 | v1.36 |
|---------|-------|-------|
| Pod scheduling | ✅ Stable | ✅ Stable |
| PodGroup API | ❌ | ✅ Alpha |
| Gang scheduling | ❌ | ✅ Alpha |
| Topology-aware placement | ❌ | ✅ Alpha |
| Workload preemption | ❌ | ✅ Alpha |
| DRA integration | ✅ Beta | ✅ Enhanced |
| In-place pod resize | ✅ Alpha | ✅ Beta |

**Migration Path:** Enable `WorkloadAwareScheduling` feature gate, test in staging, start with simple homogeneous PodGroups before complex topologies.

**Use Cases:** Distributed training jobs (PyTorch across 8 GPUs), multi-node inference serving, batch processing pipelines.

#### Workload-Aware Preemption Details
For the first time, kube-scheduler treats a PodGroup as one preemption unit and refuses to start a preemption it cannot finish — eliminating partial preemption failures that leave the cluster in an inconsistent state. This is critical for AI/ML workloads where preempting only some pods in a training group would waste all GPU resources.

#### Resource Health Status (Beta)
Before v1.36, Kubernetes lacked a native way to report the health of allocated devices, making it difficult to diagnose Pod crashes caused by hardware failures. Resource health status now exposes device health information directly in the Pod status, giving users and controllers crucial visibility to quickly identify and react to device failures.

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
- [[reference-monzo-data-mesh|Monzo Data Mesh Architecture]]

## References
- [Kubernetes v1.36 Release Announcement: ハル (Haru)](https://kubernetes.io/blog/2026/04/22/kubernetes-v1-36-release/)
- [InfoQ: Kubernetes v1.36 Released — Security Defaults Tighten as AI Workloads Gain Traction](https://www.infoq.com/news/2026/05/kubernetes-1-36-released/)
- [Sysdig: Kubernetes 1.36 New Security Features](https://www.sysdig.com/blog/kubernetes-1-36-new-security-features)
- [ScaleOps: Kubernetes 1.36 Resource Management — What Actually Changed](https://scaleops.com/blog/kubernetes-1-36/)
- 📰 [PSI Metrics GA](https://kubernetes.io/blog/2026/05/12/kubernetes-v1-36-psi-metrics-ga/) (May 12, 2026)
- 📰 [Server-Side Sharded List/Watch](https://kubernetes.io/blog/2026/05/06/kubernetes-v1-36-server-side-sharded-list-and-watch/) (May 6, 2026)
- 📰 [DRA Updates](https://kubernetes.io/blog/2026/05/07/kubernetes-v1-36-dra-136-updates/) (May 7, 2026)
- 📰 [Volume Group Snapshots GA](https://kubernetes.io/blog/2026/05/08/kubernetes-v1-36-volume-group-snapshot-ga/) (May 8, 2026)
- 📰 [Workload-Aware Scheduling](https://kubernetes.io/blog/2026/05/13/kubernetes-v1-36-advancing-workload-aware-scheduling/) (May 13, 2026)
- 📰 [Service ExternalIPs Deprecation](https://kubernetes.io/blog/2026/05/14/kubernetes-v1-36-deprecation-and-removal-of-service-externalips/) (May 14, 2026)
- 📰 [Mixed Version Proxy Beta](https://kubernetes.io/blog/2026/05/15/kubernetes-1-36-feature-mixed-version-proxy-beta/) (May 15, 2026)
- 📰 [CCM Route Sync Metric](https://kubernetes.io/blog/2026/05/15/ccm-new-metric-route-sync-total/) (May 15, 2026)
- 📰 [User Namespaces GA](https://kubernetes.io/blog/2026/04/23/kubernetes-v1-36-userns-ga/) (April 23, 2026)
- 🔍 [Kernel PSI Documentation](https://docs.kernel.org/accounting/psi.html)
- 🔍 [Kubernetes PSI Guide](https://kubernetes.io/docs/reference/instrumentation/understand-psi-metrics/)
- 🔍 [KEP-127: User Namespaces](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/127-user-namespaces)

---
*Merged by Hermes Agent KB maintenance — consolidated 9 individual v1.36 release notes into comprehensive overview (including user namespaces GA detail)*
*Enriched 2026-05-22 with official release page data: Haru theme, fine-grained auth GA, resource health status beta, WAS PodGroup details, additional beta features, user namespaces GA*
*Enriched 2026-05-28 with web research: workload-aware preemption atomicity, resource health status beta details, InfoQ release coverage, Sysdig security features, ScaleOps resource management analysis*
*Enriched 2026-05-30 with community scale data (106 companies, 491 contributors), security focus summary from InfoQ characterization*

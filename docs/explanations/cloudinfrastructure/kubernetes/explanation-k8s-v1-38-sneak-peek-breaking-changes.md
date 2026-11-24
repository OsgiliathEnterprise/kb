---
title: 'Kubernetes v1.38 Sneak Peek: CRI cgroup Driver, kuberc GA, Pod-Level Resources,
  DRA Partitions'
diataxis: Explanation
domain: cloud-infrastructure
topic: kubernetes
source: kubernetes.io
source_url: https://kubernetes.io/blog/2026/11/23/kubernetes-v1-38-sneak-peek/
date: 2026-11-24
keywords:
- knowledge-base
- kubernetes
- cloud-infrastructure
- explanations
---
# Kubernetes v1.38 Sneak Peek: CRI cgroup Driver, kuberc GA, Pod-Level Resources, DRA Partitions

The release team published the **v1.38 sneak peek on 2026-11-23**; the release is planned for **Wednesday, 2026-12-16**. For upgrade planning, the breaking changes matter more than the shiny gates — v1.38 has two real ones (cgroup driver discovery, swap semantics) plus cleanups that will silently break scripts.

## Breaking change 1: the container runtime must report the cgroup driver (KEP-4033)

The legacy way to configure the cgroup driver (kubelet-side `cgroupDriver` field) becomes **deprecated and unavailable** in v1.38 unless reactivated via the temporary `LegacyCgroupDriverFallback` feature gate. The modern path is the **CRI `RuntimeConfig` RPC**, where the runtime reports its recommended cgroup driver. Consequences:

- **Startup ordering becomes a hard requirement: the container runtime must be running *before* kubelet starts**, so kubelet can look up the expected cgroup driver. If kubelet can't get it after retries, **it exits with an error before even registering the node**.
- The kubelet config **rejects** the `cgroupDriver` field unless the legacy fallback gate is enabled.
- **kubeadm no longer sets `cgroupDriver: systemd` by default**, and its preflight checks **error out** if the runtime doesn't support the RPC.
- Action: verify your runtime supports `RuntimeConfig` (containerd/CRI-O on current versions do) *before* the upgrade; older incompatible runtimes need upgrading first (see official v1.38 release notes for the migration path, and [kubernetes/kubernetes#136731](https://github.com/kubernetes/kubernetes/pull/136731)).

## Breaking change 2: swap semantics on `LimitedSwap` nodes with pod-level resources (KEP-2837)

On cgroup v2 nodes configured with `LimitedSwap`, kubelet v1.38 applies swap limits from the **Pod's pod-level memory settings**. Sharp edge: **Pods whose pod-level memory request equals their limit get *no swap at all*** — for the Pod *and every container in it* — even if a container sets request &lt; limit. Audit workloads that rely on swap before upgrading.

## Removals and silent behavior changes

- **kubectl WebSocket opt-out env vars removed:** `KUBECTL_REMOTE_COMMAND_WEBSOCKETS` and `KUBECTL_PORT_FORWARD_WEBSOCKETS` (SPDY opt-outs from the KEP-4006 transition) do nothing in v1.38 — remove them from scripts/CI. kubectl always tries WebSockets first, falls back to SPDY.
- **kuberc credential-plugin allowlist:** the stable `kubectl.config.k8s.io/v1` API **drops the `name` alias** — every allowlist entry must use `command` (the `name` field has been deprecated since v1.36). Change entries now.
- **cgroup v1 phase-out continues (KEP-5573):** since v1.35 kubelet refuses to start on cgroup v1 nodes unless `failCgroupV1: false`; the escape hatch still exists in v1.38 but is explicitly a short-term fix — plan the cgroup v2 migration.
- **Admission webhooks no longer see authn/authz virtual resources (KEP-5793):** with `ExcludeAdmissionWebhookVirtualResources` on-by-default since v1.37, validating/mutating webhooks stop receiving virtual writes to `TokenReview`, `SelfSubjectReview`, `SubjectAccessReview`, `SelfSubjectAccessReview`, `LocalSubjectAccessReview`, `SelfSubjectRulesReview`. New webhook configs naming these get a deprecation warning; the gate will be locked on at stable.

## Featured enhancements (expected in v1.38)

| Feature | State | Why it matters |
| --- | --- | --- |
| **kuberc** (KEP-3104) | → stable | User preferences (aliases, default options, credential-plugin policy) live in a separate file, clean of cluster credentials |
| **Pod-level resources** (KEP-2837) | → stable | Pod-wide CPU/memory/hugepages requests+limits (mind the swap change above) |
| **DRA partitionable devices** (KEP-4815) | → stable | DRA drivers advertise e.g. a GPU as a whole *and* as partitions; scheduler allocates only physically-valid combinations; `DRAPartitionableDevices` gate locked on — big for GPU slicing |
| **EvictionRequest API** (KEP-4563) | alpha | Applications get a chance to participate in eviction; falls back to API-initiated eviction, still respecting PDBs (does **not** replace PDBs). Needs the `EvictionRequestAPI` gate *and* the alpha API group enabled |

## Upgrade checklist for v1.38

1. Confirm runtime supports CRI `RuntimeConfig` RPC; test kubelet restart ordering (runtime up first).
2. Grep inventories for the two removed `KUBECTL_*_WEBSOCKETS` env vars and kuberc `name:` allowlist entries.
3. On `LimitedSwap` nodes: list pods with pod-level memory request == limit; expect zero swap after upgrade.
4. Inventory admission webhooks matching `tokenreviews|subjectaccessreviews|selfsubject.*` — plan for the gate locking on.
5. If still on cgroup v1 nodes: this release's `failCgroupV1: false` hatch is the warning shot — migrate.

## References

- [Kubernetes blog: v1.38 Sneak Peek](https://kubernetes.io/blog/2026/11/23/kubernetes-v1-38-sneak-peek/) (2026-11-23)
- [CHANGELOG-1.38](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.38.md)
- Related KB note: [Kubernetes v1.37: Pod Certificates and Cluster Trust Bundles](explanation-k8s-v1-37-pod-certificates-cluster-trust-bundles.md)

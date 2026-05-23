---
title: 'Kubernetes v1.36: User Namespaces Reach General Availability'
diataxis: Explanation
domain: Cloud & Infrastructure
topic: Kubernetes
source: Kubernetes
source_url: https://kubernetes.io/blog/2026/04/23/kubernetes-v1-36-userns-ga/
date: 2026-05-23
keywords:
- knowledge-base
- Kubernetes
- Cloud & Infrastructure
- explanations
---
# Kubernetes v1.36: User Namespaces Reach General Availability

## What Are User Namespaces and Why Do They Matter?

User Namespaces in Kubernetes reached **General Availability (GA)** in version 1.36, released on April 23, 2026. This is a landmark feature with a **10-year development timeline** — including 6 years of active development in Kubernetes itself — making it one of the longest-running feature efforts in the project's history.

At its core, this feature solves a fundamental security problem in container runtimes. As the Kubernetes documentation puts it:

> *"A process running as root inside a container is also seen from the kernel as root on the host."*

Without user namespaces, a container's `root` user (UID 0) maps directly to the host's `root` user. This means that even if a container is otherwise well-isolated, a process running as root inside it has the same kernel-level privileges as root on the host. User namespaces change this by remapping UIDs and GIDs so that "root in the container" is a **non-privileged user on the host**.

## How It Works

### The Linux User Namespace Mechanism

Linux user namespaces allow processes to have different UIDs and GIDs in different namespaces. When Kubernetes enables user namespaces for a pod:

1. **The container runtime creates a new user namespace** for the pod's containers.
2. **UID/GID mappings are established** so that UID 0 inside the container maps to a non-root UID on the host.
3. **Capabilities are scoped to the namespace** — for example, `CAP_NET_ADMIN` grants network configuration power inside the container but does not grant it on the host.
4. **Filesystem ownership is handled transparently** through ID-mapped mounts (Linux 5.12+), which appeared as a key breakthrough in this effort.

### The Breakthrough: ID-Mapped Mounts

One of the biggest technical hurdles was handling filesystem mounts efficiently. Before ID-mapped mounts (introduced in Linux 5.12), the runtime had to **chown every file** on every mount to match the container's UID mapping — an O(n) operation that was prohibitively slow for large volumes.

ID-mapped mounts allow the kernel to **translate UIDs/GIDs on-the-fly** at the mount boundary, making mount setup **O(1)** regardless of the number of files. This was the critical performance breakthrough that made user namespaces viable for production workloads.

## Architecture Diagram

```
[excalidraw]
title: User Namespace Isolation Architecture
description: How Kubernetes user namespaces remap container UIDs to non-privileged host UIDs

Sketch the following architecture:
- Host kernel layer (bottom)
- User namespace boundary (middle, as a dashed line)
- Container layer (top)

Show UID remapping:
- Container UID 0 (root) → Host UID 100000+ (unprivileged user)
- Container capabilities (CAP_NET_ADMIN, etc.) confined within namespace boundary
- ID-mapped mount layer translating file ownership transparently

Label the key components:
- "Pod spec: hostUsers: false"
- "Container Runtime (CRI-O / containerd)"
- "Linux User Namespace"
- "ID-mapped mount (O(1))"
- "Namespaced capabilities"
[/excalidraw]
```

## How to Use It

### Opting Out of the Host User Namespace

Starting in v1.36, user namespaces are **enabled by default**. To opt a pod out of the host user namespace (i.e., to use a separate user namespace), set `hostUsers: false` in the pod spec:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-workload
  labels:
    app: example
spec:
  hostUsers: false  # Run in a separate user namespace (opt out of host user namespace)
  containers:
    - name: app
      image: my-app:latest
      # No container image modifications needed
      # Root inside the container is NOT root on the host
```

**Important:** `hostUsers: true` (the default if not specified in some configurations) means the pod runs in the host's user namespace, where container root = host root. Setting `hostUsers: false` creates a new user namespace for the pod.

### No Container Image Changes Required

One of the most significant aspects of this feature is that **existing container images work without modification**. You do not need to rebuild images, change entrypoints, or adjust filesystem ownership. The UID/GID translation happens at the kernel level through the user namespace and ID-mapped mount mechanisms.

## Why This Matters

### Securing Privileged Workloads

Before user namespaces, running privileged workloads (like network operators, CSI drivers, or monitoring agents) required granting broad capabilities that applied at the host level. With user namespaces:

- **Capabilities are namespaced**: `CAP_NET_ADMIN` inside a container only affects that container's network namespace, not the host's networking.
- **Root in the container ≠ root on the host**: Even if a container is compromised, the attacker does not gain root access to the host kernel.
- **Defense in depth**: User namespaces add an additional isolation layer alongside other container security mechanisms.

### Real-World Impact

This is particularly important for:
- **Multi-tenant clusters** where workloads from different organizations share the same nodes
- **Security-sensitive environments** (financial services, healthcare, government)
- **Workloads that need elevated capabilities** but should not have host-level privileges
- **Compliance requirements** that mandate strict privilege separation

## Platform Support

User namespaces in Kubernetes are **Linux-only**. This is a natural constraint since the feature relies on Linux kernel user namespace support (available since Linux 3.8) and ID-mapped mounts (Linux 5.12+). Windows and macOS nodes do not support this feature.

## Development History

| Phase | Timeline | Description |
|-------|----------|-------------|
| Linux user namespaces introduced | ~2012 | Linux kernel 3.8 added user namespace support |
| KEP-127 proposal | ~2020 | Kubernetes Enhancement Proposal for user namespaces |
| Alpha | v1.24+ | Initial implementation, behind feature gate |
| Beta | v1.28+ | More stable, opt-in via feature gate |
| **GA** | **v1.36 (April 2026)** | **General Availability, no feature gate needed** |

The 10-year timeline reflects the complexity of integrating user namespaces into Kubernetes while maintaining compatibility with existing workloads and container runtimes. The 6 years of active Kubernetes development were spent on:
- Integrating with the Container Runtime Interface (CRI)
- Solving the mount performance problem (ID-mapped mounts)
- Handling edge cases in capability scoping
- Testing across diverse workloads and node configurations

## Key Authors

This feature was led by:
- **Rodrigo Campos Catelin** (Amutable)
- **Giuseppe Scrivano** (Red Hat)

Both authors have deep expertise in container runtimes and Linux security, with significant contributions to CRI-O and the broader container ecosystem.

## References

- [Kubernetes Blog: User Namespaces GA in v1.36](https://kubernetes.io/blog/2026/04/23/kubernetes-v1-36-userns-ga/) — Original announcement
- [KEP-127: User Namespaces](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/127-user-namespaces) — Kubernetes Enhancement Proposal
- [Kubernetes Documentation: User Namespaces](https://kubernetes.io/docs/concepts/security/user-namespaces/) — Official documentation
- [Linux Kernel: User Namespaces](https://man7.org/linux/man-pages/man7/user_namespaces.7.html) — Kernel documentation
- [Linux Kernel: ID-Mapped Mounts](https://www.kernel.org/doc/html/latest/admin-guide/id-mapped-mounts.html) — ID-mapped mount documentation

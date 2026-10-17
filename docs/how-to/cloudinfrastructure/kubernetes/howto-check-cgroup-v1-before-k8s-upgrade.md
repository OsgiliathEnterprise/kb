---
title: Check Whether cgroup v1 Nodes Will Brk During a Kubernetes Upgrade to v1.35+
diataxis: How-to Guide
domain: cloud-infrastructure
topic: kubernetes
source: DEV.to Tech News
source_url: https://dev.to/sai_pisey_02/one-command-tells-you-if-your-next-kubernetes-upgrade-will-brick-a-node-4g06
date: 2026-10-17
keywords:
- knowledge-base
- kubernetes
- cloud-infrastructure
- how-to
---
# Check Whether cgroup v1 Nodes Will Brk During a Kubernetes Upgrade to v1.35+

Since **Kubernetes v1.35**, the kubelet setting `failCgroupV1` defaults to **`true`**: on a node still running **cgroup v1**, the kubelet refuses to start, so the node goes `NotReady` — and on a **control-plane node it is worse**, because the kubelet starts the API server and etcd as static pods, so after a reboot they do not come back either. cgroup v1 support has been deprecated starting with v1.35 (see [the Kubernetes blog](https://kubernetes.io/blog/2026-10-06/kubernetes-cgroups-v2-shift/)), and the `failCgroupV1` escape hatch is slated for removal (community reports point to v1.38).

## Step 1 — Check one node

```bash
$ stat -fc %T /sys/fs/cgroup/
cgroup2fs
```

| Output | Meaning |
|---|---|
| `cgroup2fs` | cgroup v2 — nothing to do |
| `tmpfs` | cgroup v1 — after upgrading to v1.35+, its kubelet will not start |

Why this works: cgroup v1 keeps one hierarchy per controller (`cpu`, `memory`, …) while cgroup v2 keeps a single unified hierarchy; the filesystem type of `/sys/fs/cgroup` differs accordingly.

## Step 2 — Check every node without SSH

```bash
$ for n in $(kubectl get nodes -o name); do
    printf "%s " "$n"
    kubectl debug "$n" -n default -q -i --profile=general --image=busybox \
      -- chroot /host stat -fc %T /sys/fs/cgroup
  done
node/worker-1 cgroup2fs
node/worker-2 tmpfs
```

`kubectl debug` mounts the node's filesystem at `/host`; the `chroot /host` is **mandatory** — without it the command runs busybox's own `stat`, which prints `UNKNOWN` instead of `cgroup2fs` on a healthy v2 node (observed while testing on a v1.35 cluster).

## Step 3 — Know which nodes are likely on cgroup v1

OSes that default to cgroup v1: **CentOS 7, RHEL 7/8, Ubuntu 18.04/20.04, Amazon Linux 2**. Self-managed kubeadm clusters on long-lived VMs are the usual victims.

## Step 4 — Let kubeadm warn you first

`kubeadm`'s `SystemVerification` preflight check errors on `init`, `join` and `upgrade` once the kubelet is v1.35+. **Do not** paper over it with `--ignore-preflight-errors` — that is exactly how a control plane ends up unable to bring its static pods back after a reboot.

## Fix path

1. Migrate the node to cgroup v2 (in place where the OS allows it, otherwise a new OS image).
2. Verify the kubelet **and** containerd/crictl cgroup drivers are aligned on `systemd`/`cgroup v2` (check the kubelet config and the runtime config).
3. Only if you must stay on v1 for the upgrade itself, set `failCgroupV1: false` as a **temporary** escape hatch and track its removal date.

## Diagram

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {"id": "s1", "type": "rectangle", "x": 60, "y": 40, "width": 220, "height": 60, "strokeColor": "#1e1e1e", "backgroundColor": "#c4e0f2", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "stat -fc %T /sys/fs/cgroup\n(kubectl debug + chroot /host)", "fontSize": 14, "fontFamily": 1}},
    {"id": "s2", "type": "rectangle", "x": 60, "y": 180, "width": 200, "height": 60, "strokeColor": "#1e1e1e", "backgroundColor": "#cdeac0", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "cgroup2fs -> safe to upgrade", "fontSize": 14, "fontFamily": 1}},
    {"id": "s3", "type": "rectangle", "x": 340, "y": 180, "width": 220, "height": 60, "strokeColor": "#1e1e1e", "backgroundColor": "#f5d0d0", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "tmpfs (v1) -> kubelet refuses to start", "fontSize": 14, "fontFamily": 1}},
    {"id": "s4", "type": "rectangle", "x": 340, "y": 320, "width": 220, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#f9e0a3", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Migrate node to cgroup v2\n(align kubelet + runtime drivers)", "fontSize": 14, "fontFamily": 1}},
    {"id": "s5", "type": "rectangle", "x": 60, "y": 320, "width": 200, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#d9ccff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "Temporary escape hatch:\nfailCgroupV1: false (expiring)", "fontSize": 14, "fontFamily": 1}},
    {"id": "a1", "type": "arrow", "x": 140, "y": 100, "width": 0, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [0, 80]]},
    {"id": "a2", "type": "arrow", "x": 420, "y": 100, "width": 0, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [0, 80]]},
    {"id": "a3", "type": "arrow", "x": 450, "y": 240, "width": 0, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [0, 80]]}
  ]
}
```

## References

- [One command tells you if your next Kubernetes upgrade will brick a node — DEV.to](https://dev.to/sai_pisey_02/one-command-tells-you-if-your-next-kubernetes-upgrade-will-brick-a-node-4g06) (primary source)
- [Full post on saipisey.com](https://saipisey.com/blog/cgroup-v1-kubelet-check) (extended version: in-place vs reimage, driver checks, escape-hatch expiry)
- [The Shift to cgroup v2 in Kubernetes — kubernetes.io blog](https://kubernetes.io/blog/2026-10-06/kubernetes-cgroups-v2-shift/) (official deprecation context)
- [About cgroup v2 — kubernetes.io docs](https://kubernetes.io/docs/concepts/architecture/cgroups/) (feature state and removal policy)

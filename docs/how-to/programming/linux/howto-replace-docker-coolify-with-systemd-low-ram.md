---
title: Replacing Docker + Coolify with Node + systemd on a Low-RAM Home Server
diataxis: How-to Guide
domain: programming
topic: linux
source: DEV.to Tech News
source_url: https://dev.to/devmodee/how-i-replaced-docker-coolify-with-27-mb-of-node-systemd-on-a-4-gb-celeron-4c13
date: 2026-11-24
keywords:
- knowledge-base
- linux
- programming
- how-to
---
# Replacing Docker + Coolify with Node + systemd on a Low-RAM Home Server

On a 2-thread Intel Celeron N3060 with 4 GB RAM (Debian 13), Docker + Coolify/Portainer consumes
roughly **half the memory at idle before a single service starts**. For a home server running
small workloads (Discord bots, small APIs, a Cloudflare tunnel), native `systemd` units eliminate
that overhead entirely — the tradeoff is that maintaining units over SSH gets tedious, which is
what a thin web panel wrapper solves.

## When to drop the container stack

Container platforms pay their fixed cost (daemon, per-container overhead, healthcheck pollers)
regardless of workload size. The break-even heuristic from this deployment:

- Workloads are single-process apps (Node, Python, static builds) — no complex images needed.
- Isolation requirement is per-user + resource caps, not kernel-level sandboxing.
- RAM is the binding constraint (&lt; 4 GB).

Result on the reference machine: the management panel itself runs at **27.1 MB cgroup memory**
(17.8 MB RssAnon, ~61 MB total `ps` RSS) while managing 8 services.

## Architecture: one process, on-demand reads

An early version used `tsx watch` during testing — 158 MB across 5 Node processes. The fix is a
single compiled Node process serving everything on demand, with **no background polling daemons**:

- Express serves the compiled backend, a SQLite database, and the static React build.
- Everything (status, logs, metrics) is read on demand when the UI is opened.
- Live log streaming uses a WebSocket terminal that streams `journalctl` — no log collector daemon.

## systemd techniques that replace the platform

### 1. Unit generation from templates

Each project generates a `systemd` unit from a template (Node, Python, static Vite, Java, or
presets like n8n, qBittorrent-nox, Filebrowser, Syncthing) instead of a Dockerfile + compose entry.

### 2. Resource caps with cgroups v2

Cap each service so a memory leak in one project can't kill the box:

```ini
[Service]
MemoryMax=300M
CPUQuota=150%
```

This is the systemd-native replacement for `docker run --memory`/`--cpus` — the same cgroup
controllers, no daemon in between.

### 3. Deploys without a daemon

A deploy button (or GitHub webhook validated with `X-Hub-Signature-256`) runs:

```bash
git pull
# install deps only if the lockfile changed
npm ci --ignore-scripts   # conditional
npm run build
systemctl restart myapp.service
```

### 4. Backups with timers, not cron daemons

Daily backups use `systemd` `.timer` + `Type=oneshot` units — nothing stays resident in RAM
between runs, unlike a cron-running backup agent.

### 5. Cap journald so logs don't eat small disks

```ini
# journald.conf
SystemMaxUse=64M
RuntimeMaxUse=32M
```

### 6. System introspection without agents

Read `/sys/class/` directly for CPU temperature and battery status; passively detect Tailscale and
Cloudflare Tunnel; optionally emit Caddy snippets into `/etc/caddy/conf.d/`.

## Install pattern

The reference implementation (AerosPanel, MIT) installs with:

```bash
curl -fsSL https://raw.githubusercontent.com/DevModee/Aeros-Panel/main/scripts/install.sh | sudo bash
```

Which sets up the panel itself as a `systemd` service and applies the journald caps above.
Audit any `curl | sudo bash` installer before running on a machine exposed via tunnel.

## Trade-offs to remember

- You lose image portability and reproducible builds — deploys rebuild on the box.
- You lose container-level isolation; compensate with per-service Linux users + `MemoryMax`/`CPUQuota`.
- You gain ~2 GB of reclaimed RAM on a 4 GB machine and one fewer daemon layer.

## Related

- Containers vs Virtual Machines
- Container Lifecycle Tied to Main Process
- [NSL: WSL-style Linux Machines with systemd-nspawn](../../../explanations/programming/linux/explanation-nsl-wsl-style-linux-machines-systemd-nspawn.md)

## References

- Original article: [How I replaced Docker + Coolify with 27 MB of Node + systemd on a 4 GB Celeron](https://dev.to/devmodee/how-i-replaced-docker-coolify-with-27-mb-of-node-systemd-on-a-4-gb-celeron-4c13) (DEV.to)
- Panel repository: [DevModee/Aeros-Panel on GitHub](https://github.com/DevModee/Aeros-Panel)

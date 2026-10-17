---
title: How to Run Uptime Kuma on Fedora with Podman Quadlet
diataxis: How-to Guide
domain: cloud-infrastructure
topic: docker
source: DEV.to Tech News
source_url: https://dev.to/jantolentino/uptime-kuma-on-fedora-with-podman-quadlet-92d
date: 2026-09-27
keywords:
- knowledge-base
- docker
- cloud-infrastructure
- how-to
---
# How to Run Uptime Kuma on Fedora with Podman Quadlet

**Podman Quadlet** manages containers using declarative files (similar to Kubernetes YAML) that automatically generate systemd services — so your app starts at boot and stays running without manual `podman run` calls. This note walks through running [Uptime Kuma](https://uptime.kuma.pet/) (self-hosted uptime monitoring with Slack notifications) on a Fedora mini-server using a `.kube` Quadlet file.

## Goal

A Uptime Kuma container that survives reboots, persists its configuration in a host directory, and runs 24/7 as a user service — no Docker daemon required.

## Steps

### 1. Install Podman

```bash
sudo dnf update -y && sudo dnf install podman -y
```

### 2. Organize the project with a persistent data volume

```bash
mkdir -p ~/infrastructure/uptime-kuma/data
cd ~/infrastructure/uptime-kuma
```

The `data` directory is mounted as a volume so Uptime Kuma's configuration survives container restarts.

### 3. Handle SELinux permissions for the bind mount

Fedora enforces SELinux strictly: the container needs an explicit label to write into your local data folder. The `:Z` suffix you'd use in Docker Compose is not standard Kubernetes YAML syntax, so a manual `chcon` is the reliable approach:

```bash
chcon -t container_file_t -R ~/infrastructure/uptime-kuma/data
```

### 4. Write the Kubernetes-style YAML

Create `~/infrastructure/uptime-kuma/uptime-kuma.yaml`:

> **Version note (verified 2026-10-17):** `lscr.io/linuxserver/uptime-kuma:latest` currently tracks Uptime Kuma **2.5.x** — latest is **2.5.6** (released 2026-10-09; 2.5.5 was 2026-09-16). For a long-lived monitoring server, prefer a pinned tag (e.g. `lscr.io/linuxserver/uptime-kuma:2.5.6`) so a routine `podman pull` doesn't silently change the app under you — upgrade deliberately instead.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: uptime-kuma-pod
spec:
  containers:
  - name: uptime-kuma
    image: lscr.io/linuxserver/uptime-kuma:latest
    ports:
    - containerPort: 3001
      hostPort: 3001 ## You can change this port
    env:
    - name: TZ
      value: "Asia/Manila"
    volumeMounts:
    - mountPath: /app/data
      name: kuma-data
  volumes:
  - name: kuma-data
    hostPath:
      path: /home/jantolentino/infrastructure/uptime-kuma/data ## Change this path
      type: Directory
```

### 5. Create the Quadlet `.kube` unit

Instead of running `podman kube play` manually, a **Quadlet `.kube` file** tells systemd to manage that YAML for you. The Podman generator reads files from `~/.config/containers/systemd` (user units) or `/etc/containers/systemd` (system units) and generates a real `.service` unit whose `ExecStart` runs `podman kube play <yaml>`.

Create `~/.config/containers/systemd/uptime-kuma.kube`:

```ini
[Unit]
Description=Uptime Kuma Service
Wants=network-online.target
After=network-online.target

[Kube]
## Path to your Kubernetes YAML
Yaml=/home/jantolentino/infrastructure/uptime-kuma/uptime-kuma.yaml

[Install]
WantedBy=default.target
```

The only required key in `[Kube]` is `Yaml=`; other keys (`PublishPort=`, `Network=`, `LogDriver=`, ...) map to `podman kube play` options. Quadlet sets the generated service's `Type` to `notify` for `.kube` files automatically.

> **Podman 6.1 note (2026-08-13):** Podman 6.1 fixed **CVE-2026-19730**, a Quadlet bug that could silently leave stale content in replaced systemd units — relevant when you edit the `.kube` file and re-run `systemctl --user daemon-reload`. 6.1 also adds an `ImageVolume=` unit key and healthchecks when exporting to Kubernetes. If you're on an older Podman, re-verify the generated unit after edits.

### 6. Activate and enable lingering

```bash
## Refresh systemd so the generator picks up the new .kube file
systemctl --user daemon-reload

## Start now and enable at boot
systemctl --user enable --now uptime-kuma.service

## Keep user services running after logout (required on a headless server)
loginctl enable-linger <your-user>
```

Without lingering, `--user` services stop when you log out — fine for a workstation, wrong for an always-on mini-server. After this, Uptime Kuma starts automatically at boot and its Slack alerts keep flowing.

## Verification

```bash
systemctl --user status uptime-kuma.service   # active (running)
curl -sI http://localhost:3001               # HTTP 200 from the container
```

## References

- [Uptime Kuma on Fedora with Podman Quadlet (DEV.to)](https://dev.to/jantolentino/uptime-kuma-on-fedora-with-podman-quadlet-92d)
- [Podman Documentation: podman-systemd.unit (Quadlet file format)](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
- [Podman Documentation: podman-kube.unit (.kube units)](https://docs.podman.io/en/stable/markdown/podman-kube.unit.5.html)
- [Uptime Kuma releases (GitHub)](https://github.com/louislam/uptime-kuma/releases)
- [Podman 6.1 fixes Quadlet stale-unit bug (CVE-2026-19730)](https://ettayeb.fr/en/devops/podman-6-1-quadlet-cve-2026-19730/)

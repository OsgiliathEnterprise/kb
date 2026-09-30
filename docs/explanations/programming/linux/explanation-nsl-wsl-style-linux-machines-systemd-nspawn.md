---
title: NSL — WSL-Style Linux Machines on a Linux Host via systemd-nspawn in a Shared
  VM
diataxis: Explanation
domain: programming
topic: linux
source: HackerNews
source_url: https://frostyard.github.io/nsl/
date: 2026-09-30
keywords:
- knowledge-base
- linux
- programming
- explanations
---
# NSL — WSL-Style Linux Machines on a Linux Host via systemd-nspawn in a Shared VM

**NSL (NSpawn Subsystem for Linux)** brings the WSL model to Linux hosts: keep
the host atomic and clean, install dev tools inside Debian/Fedora/etc. "machines"
that persist packages, services, and files between sessions. Each machine is a
`systemd-nspawn` container running **inside a shared QEMU VM**, started on
demand, working directly in your host files. Pre-release: v0.4.0 is the first
release of this design (v0.3.x was a retired prototype); tested on Snow Linux
13 x86-64 with systemd 261.2, QEMU 10.0.13, virtiofsd 1.13.2, GNOME Wayland.

## Core commands

```bash
nsl create debian --distro debian:13   # verify the signed images; first machine becomes default
nsl                                    # login shell in the machine, in this directory
nsl run make test                      # one command, exit status returned to host
```

## What a machine gives you

- **Shell where you need it**: `nsl` from your project dir opens a shell in the
  default machine working on the same files; `nsl run` for single commands with
  exit-status propagation.
- **Your files and account**: `$HOME`, `/run/media/USER`, and `/mnt` are
  available under `/mnt/host`. The machine uses your username, UID, and GID —
  files created there still belong to you. Passwordless `sudo` inside the
  machine.
- **Ports and windows on the host**: dev servers in the machine reach forwarded
  ports at host `127.0.0.1`; Wayland apps open desktop windows through
  **Waypipe**.
- **Seven signed distros**: Debian, Ubuntu, Fedora, CentOS Stream, Arch,
  openSUSE Tumbleweed or Leap — images rebuilt weekly and verified against the
  signed Frostyard publishing workflow before use.
- **Isolation when needed**: `--isolated` gives untrusted software its own VM
  with no access to host files, desktop, or host actions.
- **Runs as your user**: nsl does not install packages on the host or change
  device permissions/groups/sudoers — host prerequisites must be installed first.

## Architecture: why a shared VM at all

The design mirrors WSL's layering rather than running nspawn containers
directly on the host kernel:

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "n1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Host (atomic)\nfiles under /mnt/host\nports at 127.0.0.1", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "n2",
      "type": "rectangle",
      "x": 340,
      "y": 60,
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Shared QEMU VM\n(virtiofsd file sharing)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "n3",
      "type": "rectangle",
      "x": 640,
      "y": 20,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "machine: debian\n(systemd-nspawn)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "n4",
      "type": "rectangle",
      "x": 640,
      "y": 120,
      "width": 200,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "--isolated\nown VM, no host access", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "na1",
        "type": "arrow",
        "x": 260,
        "y": 105,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [80, 0]]
      }
    ],
    [
      {
        "id": "na2",
        "type": "arrow",
        "x": 560,
        "y": 90,
        "width": 80,
        "height": -30,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [80, -30]]
      }
    ],
    [
      {
        "id": "na3",
        "type": "arrow",
        "x": 560,
        "y": 120,
        "width": 80,
        "height": 40,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [80, 40]]
      }
    ]
  ]
}
```

- **Host stays atomic**: the host kernel is never polluted by machine packages;
  machines are disposable and rebuildable from signed images.
- **Shared VM amortizes cost**: one QEMU instance hosts multiple nspawn
  containers (each a full systemd environment), so you get per-distro isolation
  without paying full-VM overhead per distro.
- **virtiofsd** shares host files into the VM efficiently; UID/GID passthrough
  keeps file ownership consistent across the boundary.
- **Signed, weekly-rebuilt images** give a supply-chain-trusted distro source
  (verified against the Frostyard publishing workflow) — closer to an image
  registry with signatures than ad-hoc `nspawn` setup.

## How it compares

| | WSL2 | plain systemd-nspawn | NSL |
| --- | --- | --- | --- |
| Host OS | Windows only | Linux | Linux |
| Isolation unit | full VM per distro | container on host kernel | nspawn containers in shared VM |
| File access | 9P/DrvFs (slow) | direct bind mounts | virtiofsd + `/mnt/host` |
| Desktop apps | native Windows interop | none | Waypipe to host desktop |
| Image trust | Microsoft images | manual setup | signed weekly-rebuilt images |

## Key takeaways

- The WSL mental model (persistent per-distro machines, host files shared,
  ports forwarded) is reproducible on Linux by combining `systemd-nspawn` with a
  single shared QEMU VM — containers for cheap isolation, one VM to keep the
  host kernel clean.
- UID/GID passthrough plus `/mnt/host` mapping is what makes "work in your host
  files" actually work without permission friction.
- `--isolated` (separate VM, no host access) is the right default for running
  untrusted tooling — a two-tier trust model rather than all-or-nothing.

## References

- [NSL project site](https://frostyard.github.io/nsl/)
- [Getting started / install](https://frostyard.github.io/nsl/getting-started/install/)
- [How it works (architecture)](https://frostyard.github.io/nsl/concepts/how-it-works/)

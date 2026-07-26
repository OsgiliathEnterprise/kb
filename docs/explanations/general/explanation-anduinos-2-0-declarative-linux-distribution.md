---
title: 'AnduinOS 2.0: Declarative Build Pipeline for Linux Distributions'
diataxis: Explanation
domain: Linux & Systems Programming
topic: ''
source: Developpez
source_url: https://linux.developpez.com/actu/384663/La-distribution-Linux-gratuite-et-open-source-AnduinOS-2-0-est-disponible-avec-son-systeme-de-compilation-entierement-repense-sa-nouvelle-architecture-declarative-et-des-protections-de-la-vie-privee-ameliore/
date: 2026-07-26
keywords:
- knowledge-base
- Linux & Systems Programming
- explanations
---
# AnduinOS 2.0: Declarative Build Pipeline for Linux Distributions

## Overview

AnduinOS 2.0 represents a major architectural shift in how Linux distributions are assembled. Officially maintained by AIURSOFT LIMITED (Hong Kong), it transitions from fragile Bash-based remastering to a fully declarative build pipeline using custom tooling (`aosproj` and `apkg`) with `debootstrap`. Built on Ubuntu 26.04 LTS with Linux kernel 7, the distribution is modularized into 56 `.deb` packages and covers 28 languages in a single ~2.5 GB ISO.

## The Problem: Imperative Remastering

Many Linux distributions derived from Ubuntu rely on imperative Bash scripts to modify an existing system image. This approach has several weaknesses:

| Issue | Impact |
|-------|--------|
| **Fragile scripts** | Small changes in upstream packages break custom remastering scripts |
| **Hard to maintain** | Imperative logic is difficult to audit and reproduce |
| **Difficult to update** | Each upstream release may require manual script adjustments |
| **Lack of modularity** | System components are tightly coupled in the build process |

AnduinOS 2.0 addresses these problems by rebuilding the entire OS from scratch using a clean `debootstrap` and chroot pipeline.

## Declarative Build Architecture

### Core Tooling

| Tool | Purpose |
|------|---------|
| **`aosproj`** | Declarative project definition language for describing the OS composition |
| **`apkg`** | Custom package management tool that processes `aosproj` definitions into `.deb` packages |
| **`debootstrap`** | Standard Debian/Ubuntu base system bootstrap (replaces custom image remastering) |

### Three-Tier Package Architecture

The OS core is modularized into 56 standard `.deb` packages across three levels:

```
┌─────────────────────────────────┐
│  Level 3: Customization/Features │
│  (themes, fonts, GDM themes,     │
│   appearance settings)           │
├─────────────────────────────────┤
│  Level 2: Software Replacements │
│  (apt-config, package defaults,  │
│   telemetry blocks)              │
├─────────────────────────────────┤
│  Level 1: Hardware Replacements │
│  (ubuntu-desktop replacement,    │
│   kernel profile, initramfs)     │
└─────────────────────────────────┘
```

### CI-Level Enforcement

The continuous integration pipeline is configured to **fail immediately** if:
- `snapd` or any snap-related packages are detected
- Upstream telemetry services are present
- Non-declarative build artifacts are found

This ensures privacy and minimal bloat are enforced at build time, not as post-installation steps.

## System Configuration Details

### Kernel Profile (Linux 7)

| Setting | Value | Purpose |
|---------|-------|---------|
| **Congestion control** | BBR | Improved network throughput |
| **`vm.swappiness`** | 10 | Minimize swap usage for desktop responsiveness |
| **`fs.inotify` limits** | Raised | Support for larger file monitoring workloads |
| **Intel SOF firmware** | Preinstalled | Audio support for recent hardware |
| **Secure Boot** | Maintained | Compatibility with UEFI systems |
| **Dracut** | Supported | Alternative initramfs framework |

### Application Replacements

Legacy applications are replaced with modern GTK4/libadwaita alternatives:

| Legacy App | Replacement | Notes |
|------------|-------------|-------|
| Showtime (video) | Celluloid | With `ffmpeg` and `yt-dlp` for extended format/streaming support |
| Shotwell (photos) | Loupe | Modern GTK4 image viewer |
| Rhythmbox/GNOME Music (audio) | Amberol | Lightweight music player |
| GNOME System Monitor | Resources | Modern system monitoring |
| Default mail client | Geary | GTK4 email client |

Development tools (`build-essential`, `gdb`, `git`) are **not** preinstalled to save space but remain available via `apt install`.

### Package Management

System updates are handled exclusively through standard `apt`:

```bash
sudo apt update && sudo apt upgrade
```

All APT repositories are hosted via a global CDN at `packages.anduinos.com`, optimized with Cloudflare load balancing across US, EU, and Asian nodes. This ensures 100% native compatibility with the Debian/Ubuntu ecosystem.

## Desktop Environment Features

### Appearance Settings Application

A native GTK4/libadwaita configuration panel (internationalized in 28 languages) provides:
- Toggle between centered taskbar (Windows 11-style) and left-aligned layouts
- Reposition taskbar to any screen edge
- Adjust grouping behavior
- All settings managed through a clean UI

### GDM Wallpaper Selector

- Integrated wallpaper selector with image preview
- Fluent theme engine that injects CSS and SVG resources into GDM
- Perfectly rounded accessibility buttons
- Auto-regenerates on package updates

### Localization

28 officially supported languages (including newly added Danish, Ukrainian, Indonesian, Finnish, Hindi, and Greek) are consolidated into a single ISO. Language selection is available directly from a Unicode-compatible GRUB boot menu.

For Chinese users, the `anduinos-rime` input method is configured via `dpkg-divert` — avoiding the need for 20+ unrelated legacy input method packages.

## Architecture Diagram

```
┌──────────────────────────────────────────┐
│           AnduinOS 2.0 System            │
├──────────────────────────────────────────┤
│                                          │
│  ┌─ User Layer ───────────────────────┐  │
│  │  Appearance Settings (GTK4)        │  │
│  │  GDM Wallpaper Selector            │  │
│  │  UFW Firewall GUI (anduinos-ufwall)│  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─ Application Layer ─────────────────┐  │
│  │  Celluloid │ Loupe │ Amberol        │  │
│  │  Geary     │ Resources              │  │
│  │  (GTK4/libadwaita stack)            │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─ System Layer ──────────────────────┐  │
│  │  apt (standard) │ No snapd          │  │
│  │  Linux 7 kernel │ BBR │ swappiness  │  │
│  │  Dracut/Initramfs │ Secure Boot     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─ Build Pipeline ────────────────────┐  │
│  │  aosproj (declarative)              │  │
│  │  apkg (package builder)             │  │
│  │  debootstrap (base system)          │  │
│  │  CI: snapd/telemetry block          │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─ Base ──────────────────────────────┐  │
│  │  Ubuntu 26.04 LTS (Resolute)        │  │
│  │  GPL-v3 licensed │ GitHub hosted    │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Why This Matters

AnduinOS 2.0 demonstrates that declarative build pipelines are viable for Linux distribution assembly. The key takeaways for the broader Linux ecosystem:

1. **Declarative over imperative**: `aosproj` + `apkg` replace fragile Bash remastering scripts with auditable, reproducible build definitions
2. **Privacy by construction**: Blocking `snapd` and telemetry at CI level rather than relying on user configuration
3. **Modularity through standard packages**: 56 `.deb` packages across three tiers enable granular updates and debugging
4. **Standard tooling compatibility**: Using `apt` for all updates ensures full Debian/Ubuntu ecosystem compatibility

## References

- [AnduinOS 2.0 on GitHub (AnduinOS-2)](https://github.com/AIURSOFT/AnduinOS-2)
- [AnduinOS Packages Repository](https://github.com/AIURSOFT/AnduinOS-Packages)
- [Apkg Tool Repository](https://github.com/AIURSOFT/Apkg)
- [Original Article on Developpez](https://linux.developpez.com/actu/384663/La-distribution-Linux-gratuite-et-open-source-AnduinOS-2-0-est-disponible-avec-son-systeme-de-compilation-entierement-repense-sa-nouvelle-architecture-declarative-et-des-protections-de-la-vie-privee-ameliore/)

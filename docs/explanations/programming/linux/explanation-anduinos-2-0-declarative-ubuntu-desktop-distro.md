---
title: 'AnduinOS 2.0: A Declarative, Privacy-First Ubuntu 26.04 Desktop Dist'
diataxis: Explanation
domain: programming
topic: linux
source: Developpez
source_url: https://linux.developpez.com/actu/384663/La-distribution-Linux-gratuite-et-open-source-AnduinOS-2-0-est-disponible-avec-son-systeme-de-compilation-entierement-repense-sa-nouvelle-architecture-declarative-et-des-protections-de-la-vie-privee-ameliore/
date: 2026-09-12
keywords:
- knowledge-base
- linux
- programming
- explanations
---
# AnduinOS 2.0: A Declarative, Privacy-First Ubuntu 26.04 Desktop Distro

AnduinOS is a free, open-source, Windows-11-styled Linux desktop distribution built on Ubuntu, created by Anduin Xue (a former Microsoft software engineer). **AnduinOS 2.0** is a major rewrite, now officially maintained by AIURSOFT LIMITED (Hong Kong) — a transition from a solo effort to an internationally supported project.

## The core architectural change: declarative build pipeline

The 1.x series was a "remaster": fragile, complex imperative Bash scripts that modified an existing system image. 2.0 drops that entirely and rebuilds the whole OS **from scratch** using a clean **debootstrap + chroot** pipeline, driven by a custom declarative packaging toolchain:

- **`aosproj`** and **`apkg`** — custom declarative packaging tools developed for the project.
- The OS is modularized into **56 standard `.deb` packages** across three tiers:
  1. Hardware replacements (e.g., replacing `ubuntu-desktop`)
  2. Software replacements (e.g., `apt-config`)
  3. Customization/feature extensions
- All source code and package pipelines are open: **AnduinOS-2**, **AnduinOS-Packages**, and **Apkg** on GitHub (GPL-v3).

**No custom update scripts**: system maintenance is done exclusively with standard `apt update && apt upgrade`. All APT repositories are served from a global CDN at `packages.anduinos.com`, load-balanced via Cloudflare across US, EU, and Asia nodes — 100% native compatibility with the Debian/Ubuntu ecosystem.

## Base and kernel

- **Ubuntu 26.04 LTS ("Resolute")** base with the **Linux 7 kernel**.
- Desktop-optimized kernel profile: **BBR congestion control**, `vm.swappiness=10`, raised `fs.inotify` limits.
- Intel **SOF** audio firmware preinstalled for recent hardware, without breaking Secure Boot.
- **Dracut** fully supported as an alternative initramfs framework.
- NVIDIA support and Secure Boot are transparently supported; GNOME on Wayland with HDR compatibility.

## Privacy and anti-bloat

- The **CI pipeline fails immediately** if `snapd` or upstream telemetry services are detected during the build — telemetry is blocked at the integration level, not just disabled.
- Default fonts replaced by a custom stack: **Cascadia Code**, **Noto Sans/Serif**, **Nerd Fonts Symbols**, **Twemoji COLRv1** for modern color emoji.
- Legacy apps replaced by modern lightweight **GTK4/libadwaita** equivalents to keep the ISO at ~**2.5 GB**:
  - **Celluloid** (with ffmpeg + yt-dlp) replaces the video player
  - **Loupe** replaces Shotwell (images)
  - **Amberol** replaces Rhythmbox/GNOME Music (audio)
  - **Resources** replaces GNOME System Monitor
  - **Geary** is the default mail client
- Dev tools (`build-essential`, `gdb`, `git`) are not preinstalled to save space but remain one `apt install` away.
- **`anduinos-ufwall-gtk`**: an official GTK4 GUI for UFW firewall rule management without the terminal.

## Localization and desktop

- **28 languages in a single ISO** (recently added: Danish, Ukrainian, Indonesian, Finnish, Hindi, Greek), selectable from a fully Unicode-capable **GRUB menu**.
- Keyboard layout adapts dynamically to the chosen language; Chinese input works natively via **`anduinos-rime`** using the `dpkg-divert` mechanism — without installing 20+ unrelated upstream IME packages.
- Native **"AnduinOS Appearance Settings"** app (GTK4/libadwaita, localized into all 28 languages): toggle centered taskbar icons (Windows-11 style) vs. left-aligned classic, reposition the taskbar to any screen edge, and adjust grouping behavior.
- Integrated **GDM wallpaper selector** with image previews, built on a **Fluent theme engine** that injects the full Fluent CSS/SVG resource set into GDM (including rounded accessibility buttons) and regenerates automatically on package updates. Officially sponsors @vinceliuice's Fluent GTK and icon themes.
- Dash-to-Panel with 1px Fluent panel borders; multi-screen isolation of screens/workspaces by default; Dash-to-Panel, DING, and ArcMenu context menus fully localized via `.mo` injection.
- Four new wallpaper pairs included; "New Bubbles" is the default.

## Out-of-the-box ergonomics

- **AppImages run right after install** (libfuse2t64 and OpenGL preloaded).
- **policykit-desktop-privileges** integrated for passwordless prompts on standard desktop actions (e.g., drive mounting).
- Custom **`deskmon.service`**: drop a `.desktop` file into `~/Desktop` and double-click to run it.
- Printing (`cups`, `system-config-printer`) and scanning (`sane-airscan`) preinstalled and ready.

## Who is it for?

Developers and daily users who want **Ubuntu LTS hardware compatibility** with a cleaner, more traditional package management philosophy:
- Familiar, polished Windows-11-like UX (customizable taskbar, Fluent-themed login, integrated appearance settings)
- Zero telemetry
- Compact ~2.5 GB live ISO
- Long-term support (Ubuntu 26.04 base) + Linux 7 kernel
- Good desktop performance
- Transparent NVIDIA + Secure Boot support
- Modern GNOME/Wayland/HDR
- 28 languages in one ISO, with native-quality CJK/Arabic/Thai input
- 100% native APT ecosystem — no custom update manager, just `apt`

## References

- [AnduinOS 2.0 available with a rethought build system and declarative architecture — Developpez (FR)](https://linux.developpez.com/actu/384663/La-distribution-Linux-gratuite-et-open-source-AnduinOS-2-0-est-disponible-avec-son-systeme-de-compilation-entierement-repense-sa-nouvelle-architecture-declarative-et-des-protections-de-la-vie-privee-ameliore/)
- [Official AnduinOS 2.0 announcement](https://news.anduinos.com/post/2026/6/28/anduinos-2)
- [Canonical published Ubuntu 26.04 LTS on Linux 7.0 with GNOME 50 — Developpez (FR)](https://linux.developpez.com/actu/382604/Canonical-a-publie-Ubuntu-26-04-LTS-Resolute-Raccoon-sur-le-dernier-noyau-Linux-7-0-avec-l-environnement-de-bureau-GNOME-50-étant-la-première-version-LTS-d_Ubuntu-à-êtré-livrée-sans-session-de-bureau-Xorg/)

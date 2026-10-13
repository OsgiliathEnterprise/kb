---
title: 'Codex CLI''s Persistent Self-Updating Background Daemon: How It Works and
  Why It''s a Trust Concern'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: HackerNews
source_url: https://github.com/openai/codex/issues/48195
date: 2026-10-13
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# Codex CLI's Persistent Self-Updating Background Daemon: How It Works and Why It's a Trust Concern

## Overview

Since **Codex CLI 0.157.0**, merely opening an interactive `codex` session has side effects that extend far beyond the window that started it. [Issue #48195](https://github.com/openai/codex/issues/48195) documents the behavior and requests making `daemon_auto_start` opt-in. The core community objection: **a CLI tool silently installing a persistent, self-updating background daemon as its default is a supply-chain and trust concern** — "stuff should not be creating mystery servers and processes all of a sudden on small version number bumps without giving people a heads-up" (18 reactions), "the CLI is unusable until this is fixed" (21 reactions).

## What Happens on Session Start

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "b1",
      "type": "rectangle",
      "x": 40,
      "y": 180,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Interactive codex session\n(since 0.157.0,\nby default)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b2",
      "type": "rectangle",
      "x": 310,
      "y": 60,
      "width": 250,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "1. Starts managed daemon\ncodex app-server --managed-daemon\nreparented to PID 1, survives\nall windows closed", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b3",
      "type": "rectangle",
      "x": 310,
      "y": 180,
      "width": 250,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "2. Copies ~374 MB platform package\nto ~/.codex/packages/app-server-daemon/\nruns daemon FROM the copy\n(version decoupled from CLI)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b4",
      "type": "rectangle",
      "x": 310,
      "y": 300,
      "width": 250,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "3. Detached updater pid-update-loop\nchecks 5 min after start, then hourly\ndownloads releases, restarts backend\ncan kill active turns (60 s drain)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b5",
      "type": "rectangle",
      "x": 310,
      "y": 420,
      "width": 250,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "4. Pins the starting session's environment\n(HTTPS_PROXY, cwd, terminal)\nall later sessions inherit it", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "a1",
        "type": "arrow",
        "x": 240,
        "y": 205,
        "width": 70,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [70, 0] ]
      }
    ],
    [
      {
        "id": "a2",
        "type": "arrow",
        "x": 240,
        "y": 225,
        "width": 70,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [70, 0] ]
      }
    ],
    [
      {
        "id": "a3",
        "type": "arrow",
        "x": 240,
        "y": 245,
        "width": 70,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [70, 0] ]
      }
    ],
    [
      {
        "id": "a4",
        "type": "arrow",
        "x": 240,
        "y": 265,
        "width": 70,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [70, 0] ]
      }
    ]
  ],
  "appState": { "viewBackgroundColor": "#ffffff" }
}
```

1. **A persistent background daemon.** `codex app-server --managed-daemon` runs in its own session with no TTY and is **reparented to PID 1** — it keeps running after every Codex window is closed, until `codex app-server daemon stop` or a reboot.
2. **A copied platform package.** The daemon copies the whole platform package (~374 MB: `codex`, `codex-code-mode-host`, bundled `bwrap`/`zsh`/`rg`) into `~/.codex/packages/app-server-daemon/releases/<version>/` and **runs the daemon from that copy**. From then on, the backend's version is *decoupled* from the CLI version installed by the user's package manager.
3. **A detached self-updater.** `codex app-server daemon pid-update-loop` checks for updates 5 minutes after start, then hourly, downloads new releases, and restarts the backend — which can **kill active turns** after a 60 s drain budget ([#40969](https://github.com/openai/codex/issues/40969), still open).
4. **Environment pinning.** The daemon keeps the environment of *whichever session happened to start it* — e.g. `HTTPS_PROXY` set by a per-invocation wrapper — so all later sessions' outbound connections go through that proxy. Related symptoms: hooks in `--remote` mode receive the daemon's cwd instead of the session's ([#42457](https://github.com/openai/codex/issues/42457)), and hooks spawned by the app-server daemon cannot identify the client terminal ([#37537](https://github.com/openai/codex/issues/37537)).

## Why It's a Trust Concern

- **Silent persistence.** For a CLI, the least-surprising default is that the backend lives and dies with the window and runs the binary the user installed. A shared, self-updating daemon makes sense for Remote Control / the desktop app — where it may be reasonable — but not as a silent default for the CLI.
- **Package-manager decoupling.** The copied-package behavior breaks npm/brew/pacman users: `npm update` leaves the daemon on the old version, and the daemon's own update/restart logic refuses recovery ([#46468](https://github.com/openai/codex/issues/46468), [#41188](https://github.com/openai/codex/issues/41188)). Codex 0.157.0 "no longer starts with the Arch Linux package unless `--no-daemon` is used" ([#48050](https://github.com/openai/codex/issues/48050)).
- **Self-updating surface.** A background process that downloads and executes new code hourly, with a 60 s drain + SIGKILL against active work, is a standing supply-chain surface — one the user did not consciously install as a service.
- **Bug found while turning it off.** `codex app-server daemon stop` stops the app-server but **leaves the `pid-update-loop` updater running** (still alive 70 s later; had to be killed manually) — the self-updater is not even managed by the stop command.

## How to Disable It (Workaround)

```shell
codex features disable daemon_auto_start
codex app-server daemon stop
pkill -f 'app-server daemon pid-update-loop'   # NOT stopped by `daemon stop`
rm -rf ~/.codex/packages/app-server-daemon
```

Alternatively, set `daemon_auto_start = false` in `config.toml` (confirmed on Windows 10 LTSC with 0.157.0). With the flag off, a new TUI session no longer spawns a daemon. The `--no-daemon` flag exists for one-shot invocations.

## Requested Behavior

The issue asks for `daemon_auto_start` to be **opt-in (default `false`) for the CLI** — or at least a one-time confirmation before enabling it. If it stays on by default, the request is: exit an auto-started daemon when its last client disconnects, and don't copy/self-update when the CLI was installed by a package manager (run the installed binary instead).

## Related Issues

- [#40969](https://github.com/openai/codex/issues/40969) — auto-update force-kills active turns after a 60 s drain; cannot be disabled
- [#41188](https://github.com/openai/codex/issues/41188) — support externally managed app-server daemon executables
- [#46468](https://github.com/openai/codex/issues/46468) — npm update leaves app-server on old version; daemon update/restart refuse recovery
- [#48050](https://github.com/openai/codex/issues/48050) — 0.157.0 no longer starts with the Arch package unless `--no-daemon`
- [#42457](https://github.com/openai/codex/issues/42457) / [#37537](https://github.com/openai/codex/issues/37537) — daemon cwd/terminal inherited by hooks, breaking session-scoped hook behavior
- Community reaction includes a company rolling back Codex seat licenses over the daemon default (Oct 13 comment).

## References

- [openai/codex issue #48195 — make daemon_auto_start opt-in (the primary source)](https://github.com/openai/codex/issues/48195)
- [openai/codex issue #40969 — auto-update force-kills active turns](https://github.com/openai/codex/issues/40969)
- [openai/codex issue #48050 — Arch package requires --no-daemon](https://github.com/openai/codex/issues/48050)
- [openai/codex repository](https://github.com/openai/codex)
- [Codex CLI 0.157.0 silently installs a persistent daemon — chiprook (independent coverage of #48195)](https://chiprook.com/s/24072-codex-cli-0-157-0-silently-installs-a-persistent-daemon) — corroborates the ~374 MB package copy to `~/.codex/packages/`, hourly self-update that can kill active turns, `app-server daemon stop` not terminating the pid-update-loop, and opt-out only via manual `daemon_auto_start = false`
- [Official Codex configuration reference](https://developers.openai.com/codex/config-reference) — full config reference (incl. `daemon_auto_start`, `app-server` settings)

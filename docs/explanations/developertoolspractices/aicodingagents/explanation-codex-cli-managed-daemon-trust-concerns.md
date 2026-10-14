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

Alternatively, set `daemon_auto_start = false` in `config.toml` (confirmed on Windows 10 LTSC with 0.157.0). With the flag off, a new TUI session no longer spawns a daemon. The `--no-daemon` flag exists for one-shot invocations; per [#51763](https://github.com/openai/codex/issues/51763) it also keeps a *single session* separate from the shared daemon when you can't disable the default.

**Windows cleanup:** on Windows, `daemon stop` may leave `codex` processes behind — check Task Manager or run `Get-Process codex*` and stop stragglers.

**If you want to keep the daemon but stop version drift:** [#49418](https://github.com/openai/codex/issues/49418) reports that upgrading the CLI leaves the daemon on its old version (`codex --version` shows the new number, so you believe you're testing a fix the backend doesn't have). To pin the daemon to your installed CLI:

```shell
codex app-server daemon stop
codex app-server daemon update --from-cli
codex app-server daemon start
```

`--from-cli` makes the npm/Homebrew-installed package the source of truth — at the cost of the daemon's own self-updates.

**Disk usage:** users report old release copies piling up under `~/.codex/packages` (unverified figures of ~10–20 GB), including `~/.codex/packages/standalone/releases`, which keeps previous binaries. Check `du -sh ~/.codex/packages` before assuming the worst.

## Requested Behavior

The issue asks for `daemon_auto_start` to be **opt-in (default `false`) for the CLI** — or at least a one-time confirmation before enabling it. If it stays on by default, the request is: exit an auto-started daemon when its last client disconnects, and don't copy/self-update when the CLI was installed by a package manager (run the installed binary instead).

## Official Framing and Status (as of 2026-10-14)

**What OpenAI shipped.** The [rust-v0.157.0 release notes](https://github.com/openai/codex/releases/tag/rust-v0.157.0) (Sept 25, 2026) list it under New Features as one line: "Enabled automatic background-server startup for eligible interactive sessions" — linked to PR #47179, "Enable automatic daemon startup by default". The same release added "explicit recovery for incompatible background servers" and enabled `/import` in local daemon sessions, i.e. the version-skew machinery shipped *with* the default. OpenAI's own [changelog](https://learn.chatgpt.com/docs/changelog) entry from Sept 5, 2026 states the app-server command is **experimental and not supported for production workloads** — the same subsystem now auto-starting on developer machines by default.

**OpenAI's official position.** OpenAI frames the app-server as a deliberate platform surface: the [Codex "as a platform" post](https://developers.openai.com/blog/codex-as-a-platform) positions [Codex app-server](https://developers.openai.com/codex/app-server) (implementation is open source at `codex-rs/app-server`) as the integration path for applications that need persistent conversations, streamed events, and approval handling, alongside `codex exec` and the Codex SDK. The platform rationale is coherent — a shared backend is what Remote Control and the desktop app need. The community objection is narrower: the *CLI default* is what no one consciously opted into.

**Status of #48195.** Still open as of October 13–14, 2026, with no public maintainer response; the `daemon_auto_start = true` default has not changed. The issue hit the Hacker News front page on October 12 (500+ points, hundreds of comments).

**Subsequent developments.**

- [#51763](https://github.com/openai/codex/issues/51763) (Oct 7) — the daemon auto-updated itself to 0.161.0 *mid-turn* while the installed CLI was 0.160.1: the active turn failed with `Server is draining; retry after reconnecting (code -32600)`, and new sessions were then blocked with "Background server has incompatible feature settings". A commenter traced the trigger to the `api_key_model_discovery` default flipping from `false` to `true` between the two versions.
- **Fix in [rust-v0.162.1](https://github.com/openai/codex/releases/tag/rust-v0.162.1) (Oct 9)** — "startup failures caused by differences between a running background server's feature settings and CLI defaults". This addresses the symptom above but not the auto-start default itself.
- [#49418](https://github.com/openai/codex/issues/49418) (Sept 30) — the reverse drift: CLI upgraded (reported pairs 0.159.2→daemon 0.157.1, 0.160.0→daemon 0.157.1) while the daemon stays old, with knock-on Windows updater failures ("standalone Codex updater exited with status exit code: 1"). See the `daemon update --from-cli` sync procedure above.

## Related Issues

- [#40969](https://github.com/openai/codex/issues/40969) — auto-update force-kills active turns after a 60 s drain; cannot be disabled
- [#41188](https://github.com/openai/codex/issues/41188) — support externally managed app-server daemon executables
- [#46468](https://github.com/openai/codex/issues/46468) — npm update leaves app-server on old version; daemon update/restart refuse recovery
- [#48050](https://github.com/openai/codex/issues/48050) — 0.157.0 no longer starts with the Arch package unless `--no-daemon`
- [#49418](https://github.com/openai/codex/issues/49418) — update the managed app-server when the CLI is upgraded (version drift, Windows updater failures)
- [#51763](https://github.com/openai/codex/issues/51763) — daemon auto-update drains an active session mid-turn; incompatible feature settings block new sessions (fixed by 0.162.1)
- [#42457](https://github.com/openai/codex/issues/42457) / [#37537](https://github.com/openai/codex/issues/37537) — daemon cwd/terminal inherited by hooks, breaking session-scoped hook behavior
- Community reaction includes a company rolling back Codex seat licenses over the daemon default (Oct 13 comment).

## References

- [openai/codex issue #48195 — make daemon_auto_start opt-in (the primary source)](https://github.com/openai/codex/issues/48195)
- [openai/codex issue #40969 — auto-update force-kills active turns](https://github.com/openai/codex/issues/40969)
- [openai/codex issue #48050 — Arch package requires --no-daemon](https://github.com/openai/codex/issues/48050)
- [openai/codex repository](https://github.com/openai/codex)
- [Codex CLI 0.157.0 silently installs a persistent daemon — chiprook (independent coverage of #48195)](https://chiprook.com/s/24072-codex-cli-0-157-0-silently-installs-a-persistent-daemon) — corroborates the ~374 MB package copy to `~/.codex/packages/`, hourly self-update that can kill active turns, `app-server daemon stop` not terminating the pid-update-loop, and opt-out only via manual `daemon_auto_start = false`
- [Official Codex configuration reference](https://developers.openai.com/codex/config-reference) — full config reference (incl. `daemon_auto_start`, `app-server` settings)
- [Codex rust-v0.157.0 release notes](https://github.com/openai/codex/releases/tag/rust-v0.157.0) — "Enabled automatic background-server startup for eligible interactive sessions" (PR #47179)
- [Codex rust-v0.162.1 release notes](https://github.com/openai/codex/releases/tag/rust-v0.162.1) — fix for startup failures from background-server/CLI feature-settings drift
- [openai/codex issue #51763 — daemon auto-update drains active session](https://github.com/openai/codex/issues/51763)
- [openai/codex issue #49418 — update managed app-server when CLI is upgraded](https://github.com/openai/codex/issues/49418)
- [Codex app-server — official documentation](https://learn.chatgpt.com/docs/app-server) — open-source `codex-rs/app-server`, app-server API surface
- [Codex as a platform: build on the open agent harness — OpenAI Developers blog](https://developers.openai.com/blog/codex-as-a-platform) — OpenAI's official framing of app-server as the integration surface
- [OpenAI Codex changelog](https://learn.chatgpt.com/docs/changelog) — Sept 5, 2026 entry: app-server "experimental and isn't supported for production workloads"
- [LaunchBoosts — Codex CLI Background Daemon: What It Does and How to Turn It Off (2026-10-13)](https://launchboosts.com/blog/codex-cli-background-daemon-disable-guide) — aggregated disable/sync/disk-usage guide with per-setup decision table

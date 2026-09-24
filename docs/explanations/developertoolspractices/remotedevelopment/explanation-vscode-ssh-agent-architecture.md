---
title: VSCode's SSH Remote Agent Architecture — Why It Behaves Like a Persistent Remote
  Shell
diataxis: Explanation
domain: developer-tools-practices
topic: remote-development
source: HackerNews
source_url: https://fly.io/blog/vscode-ssh-wtf/
date: 2026-09-24
keywords:
- knowledge-base
- remote-development
- developer-tools-practices
- explanations
---
# VSCode's SSH Remote Agent Architecture — Why It Behaves Like a Persistent Remote Shell

Fly.io (Thomas Ptacek) dissected how VSCode's "remote editing over SSH" actually works, motivated by wanting to integrate Fly Machines into the VSCode remote-editing flow — especially for LLM agent loops that need a clean-slate Linux instance they can't damage. The finding: unlike Emacs' Tramp, which "lives off the land" on the remote connection, **VSCode mounts a full-scale invasion** of the remote host.

## How VSCode's SSH remote mode works (observed architecture)

1. **Bash snippet stager**: the local client runs a Bash snippet over the SSH session that *downloads an agent* — including a **binary installation of Node** — onto the remote machine.
2. The agent runs over **port-forwarded SSH**.
3. It establishes a **WebSockets connection back to your running VSCode front-end**.

The protocol on that WebSocket connection can:

- Wander around the filesystem
- Edit arbitrary files
- Launch its own shell PTY processes
- **Persist itself**

In security terms, Ptacek notes there's a name for tools with exactly this capability profile (a remote code execution foothold with persistence) — "I won't say it out loud, because that's not fair to VSCode." His stated concern: letting people VSCode-remote-edit dev servers is already nervous-making; doing it during an incident on production would be apocalyptic.

## Contrast: Emacs Tramp

Emacs hosts **Tramp**, the spiritual forebear of remote editing systems — a blob of Elisp that hooks into *any* interactive environment (usually SSH) where it can run Bourne shell commands, and extends Emacs to that environment. Tramp lives off the land on the existing connection; VSCode instead installs its own agent stack. The author's expectation ("take Tramp, simplify it, swap Elisp for TypeScript") is exactly what did *not* happen.

## Why this matters for agentic workflows

The motivating use case: LLM agents close a loop (generate code → run → read errors → iterate), and that iteration should happen on a **clean-slate Linux instance that spins up instantly and can't screw you over** — not your dev laptop, because "LLMs have boundary issues" and will happily iterate on system configuration. Understanding what VSCode's remote mode installs is prerequisite to trusting it as the transport for such loops; Fly's conclusion was they don't need VSCode's agent at all to get a custom connection to a Fly Machine working in VSCode — but documenting the mechanism is the point of the post.

## Practical takeaways

- **Audit what your editor installs**: VSCode remote mode drops a Node binary + agent on the target; inventory it before pointing it at shared or production hosts.
- **The WebSocket back-channel is the trust boundary**: once the agent connects, its protocol capabilities (arbitrary file edit, PTY spawn, self-persistence) define the blast radius of any compromise of either endpoint.
- **Tramp-style "live off the land" remains the lower-footprint pattern** for remote editing when you don't need a full IDE server on the target.

## Diagram: VSCode SSH remote agent data path

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "vc-title",
      "type": "text",
      "x": 40,
      "y": 20,
      "width": 780,
      "height": 25,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 32345,
      "versionNonce": 43731,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "VSCode remote-over-SSH: stager installs agent; WebSocket back-channel to local front-end",
      "fontSize": 16,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 25
    },
    {
      "id": "vc-local",
      "type": "rectangle",
      "x": 40,
      "y": 80,
      "width": 260,
      "height": 110,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 33456,
      "versionNonce": 44842,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000
    },
    {
      "id": "vc-local-t",
      "type": "text",
      "x": 52,
      "y": 94,
      "width": 236,
      "height": 84,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 34567,
      "versionNonce": 45953,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "Your laptop\nVSCode front-end (UI)\nruns the bash snippet stager",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 84
    },
    {
      "id": "vc-remote",
      "type": "rectangle",
      "x": 500,
      "y": 80,
      "width": 320,
      "height": 110,
      "angle": 0,
      "strokeColor": "#e03131",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 35678,
      "versionNonce": 46064,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000
    },
    {
      "id": "vc-remote-t",
      "type": "text",
      "x": 512,
      "y": 94,
      "width": 296,
      "height": 84,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 36789,
      "versionNonce": 47175,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "Remote host (dev server / Fly Machine)\nVSCode agent + Node binary installed\nFS access, file edits, PTY spawn, self-persist",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 84
    },
    {
      "id": "vc-a-ssh",
      "type": "arrow",
      "x": 300,
      "y": 115,
      "width": 200,
      "height": 0,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 37890,
      "versionNonce": 48286,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "points": [[0, 0], [200, 0]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "elbowed": false
    },
    {
      "id": "vc-a-ssh-t",
      "type": "text",
      "x": 320,
      "y": 95,
      "width": 160,
      "height": 18,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 38901,
      "versionNonce": 49397,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "SSH (stager + port-forward)",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 18
    },
    {
      "id": "vc-a-ws",
      "type": "arrow",
      "x": 500,
      "y": 165,
      "width": 200,
      "height": 0,
      "angle": 0,
      "strokeColor": "#e8590c",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 39012,
      "versionNonce": 50408,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "points": [[0, 0], [-200, 0]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "elbowed": false
    },
    {
      "id": "vc-a-ws-t",
      "type": "text",
      "x": 320,
      "y": 175,
      "width": 160,
      "height": 18,
      "angle": 0,
      "strokeColor": "#e8590c",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 40123,
      "versionNonce": 51519,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "WebSockets back to front-end",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 18
    },
    {
      "id": "vc-note",
      "type": "text",
      "x": 40,
      "y": 230,
      "width": 780,
      "height": 66,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 41234,
      "versionNonce": 52630,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "Contrast: Emacs Tramp lives off the land on the SSH connection (no installed agent).\nVSCode installs Node + agent -> capability profile = remote code execution with persistence.\nAudit before pointing at shared/production hosts; for agentic loops prefer a disposable instance.",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 66
    }
  ]
}
```

## References

- [VSCode's SSH Agent Is Bananas — Fly.io blog (Thomas Ptacek)](https://fly.io/blog/vscode-ssh-wtf/)
- [Emacs Tramp](https://www.gnu.org/software/tramp/)
- [Suspected VSCode server node source](https://github.com/microsoft/vscode/tree/c9e7e1b72f80b12ffc00e06153afcfedba9ec31f/src/vs/server/node)

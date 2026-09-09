---
title: How Project Valkey Uses AI Agents for Bug Backporting and Code Provenance Scanning
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: TheNewStack
source_url: https://thenewstack.io/valkey-ai-backporting-agents/
date: 2026-09-09
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# How Project Valkey Uses AI Agents for Bug Backporting and Code Provenance Scanning

**TL;DR:** Ahead of Valkey 9.1 (the Linux Foundation's Redis alternative), maintainers replaced manual cherry-picking of bug fixes across support branches (7.2, 8.0, 8.1, 9.0, 9.1) with a **backporting agent** that applies fixes, runs the CI pipelines of older versions, and resolves merge conflicts. A second agent, **Provenance Guard**, scans incoming PRs to catch code copied from unsanctioned codebases. Humans keep final sign-off; the project reports saving several hours of testing time per engineer per week.

## Why backporting is hard at Valkey's scale

Valkey is a "hot" part of data ecosystems — always-on caching, message queues, and data structures inside production applications — so users hesitate to jump major versions. The project therefore maintains **five support branches simultaneously** (7.2, 8.0, 8.1, 9.0, 9.1). Keeping older branches secure means cherry-picking each fix from the release branch and re-validating it against older-version CI — hours of manual work per maintainer, made worse because the branches diverge over time.

## The backporting agent

The agent's loop per fix:

1. Pick up the fix from the release branch.
2. Apply it to the target older branch.
3. Run the target branch's CI pipelines.
4. Handle merge conflicts autonomously.
5. Proactively identify **test fixes** that also need backporting.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "v1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Release branch (9.1)\nbug/security fixes", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "v2",
      "type": "rectangle",
      "x": 320,
      "y": 60,
      "width": 220,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Backporting agent\napply + resolve conflicts", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "v3",
      "type": "rectangle",
      "x": 620,
      "y": 60,
      "width": 220,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Older-branch CI (7.2 / 8.0 / 8.1 / 9.0)\nfull pipeline runs", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "v4",
      "type": "rectangle",
      "x": 320,
      "y": 220,
      "width": 220,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c9e7c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Human sign-off\nfinal merge approval", "fontSize": 14, "fontFamily": 1 }
    },
    [
      { "id": "v5", "type": "arrow", "x": 240, "y": 100, "width": 80, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [80, 0]] }
    ],
    [
      { "id": "v6", "type": "arrow", "x": 540, "y": 100, "width": 80, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [80, 0]] }
    ],
    [
      { "id": "v7", "type": "arrow", "x": 730, "y": 140, "width": 230, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [-230, 80]] }
    ],
    [
      { "id": "v8", "type": "arrow", "x": 430, "y": 300, "width": 0, "height": 60, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [0, -60]] }
    ],
    {
      "id": "v9",
      "type": "rectangle",
      "x": 620,
      "y": 220,
      "width": 220,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Provenance Guard\nbackground scan of incoming PRs\nvs unsanctioned codebases", "fontSize": 13, "fontFamily": 1 }
    }
  ]
}
```

## Provenance Guard

The second agent runs automatically in the background, scanning incoming PRs to verify that no code was inadvertently taken from unsanctioned codebases and applied to Valkey. Design notes from the maintainers:

- It is a **preliminary and auxiliary check in addition to human-driven review** — explicitly not a last line of defense.
- It offloads one highly deterministic security check to a "second set of eyes," reducing review cognitive load.
- It has already caught unintentional code copying in the project.

## Human-in-the-loop boundaries

Maintainers keep the final sign-off before merging — the agents prepare and validate, humans approve. Reported impact: **several hours of testing time saved per engineer per week**, redirected to core engineering. The same framing applies to the broader maintainership question: agents take the routine (backports, provenance scans, verification), humans take judgment calls — and newer engineers are advised to learn to audit these "bot coworkers" rather than compete with them on routine tasks.

## Transferable pattern

The Valkey setup is a useful template for any project maintaining multiple long-lived branches:

1. **Identify the deterministic maintenance work** (cherry-picks + CI validation) that scales badly with branch count.
2. **Give the agent the full loop** — apply, test on the target branch, handle conflicts, and flag *related* fixes (test updates) it discovers along the way.
3. **Keep a human gate at merge time**, and treat the agent's output as a validated draft.
4. **Add a provenance layer** for code-integrity scanning that runs continuously, not per-release.

## References

- [Backporting bug fixes is dead, Project Valkey now sends in the bots (The New Stack — Adrian Bridgwater)](https://thenewstack.io/valkey-ai-backporting-agents/)
- [Valkey 9.1 release notes (valkey.io)](https://valkey.io/blog/valkey-9-1-delivers-improvements-in-security-performance-and-more/)

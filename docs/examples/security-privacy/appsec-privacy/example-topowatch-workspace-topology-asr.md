---
title: 'topowatch: Measuring Workspace Topology''s Effect on Indirect Prompt Injection
  ASR'
diataxis: Example
domain: Security & Privacy
topic: AppSec & Privacy
source: DEV.to (magopredator)
source_url: https://dev.to/magopredator/topowatch-audita-el-attack-success-rate-de-tu-workspace-contra-inyeccion-indirecta-2klh
date: 2026-08-22
keywords:
- knowledge-base
- AppSec & Privacy
- Security & Privacy
- examples
---
# topowatch: Measuring Workspace Topology's Effect on Indirect Prompt Injection ASR

## The Research Basis

The paper *"Workspace Topology as an Attack Vector in Agentic Coding Assistants"* ([arXiv:2608.14876](https://arxiv.org/abs/2608.14876), Day et al., 2026) demonstrates what practitioners intuited but didn't measure: **workspace topology measurably affects the Attack Success Rate (ASR)** of indirect prompt injection. Highly modular environments show significantly lower ASR than flat ones.

The mechanism is mechanical:

- If the agent **scopes its reading to the task's module**, it never reaches the poisoned file → injection fails
- If the agent does a **wide read** of the whole workspace, it always reads the poisoned file → injection succeeds

Cross-referenced: the paper's abstract confirms the study dimensions — directory depth, codebase modularity, in-file injection position, and context framing — and Semantic Scholar's summary confirms the headline result (modularity significantly lowers ASR). Note the nuance from a third-party analysis ([agentpatterns.ai](https://agentpatterns.ai/security/workspace-topology-injection-attack-vector/)): topology *moves* IPI success on at least one coding agent, and "workspace topology is a variable in the indirect-injection threat model, not a defense."

## What topowatch Is

`topowatch` is a CLI that, given a workspace, measures the ASR of a reference indirect injection under several topology configurations and reports which structure minimizes ASR.

- **Deterministic and reproducible without keys or network**: uses a configurable *synthetic* agent and a fixture with three topologies (monolith, modular, deep nesting)
- **v0.1 honesty**: uses a synthetic agent, not a real coding assistant (Claude Code/Codex). The claim "modularity → lower ASR" is anchored to the reproducible fixture, not a real-assistant measurement (that's v0.2). Goal: a tool to *measure and recommend modularity*, not to simulate a full attack

## Running It

```bash
pip install -e ".[test]"
topowatch --json
```

## Reference Fixture Results (200 trials, fixed seed)

| Topology | ASR | % of workspace read |
|----------|-----|---------------------|
| Monolith (flat) | 1.000 | 100% |
| Modular (scoped) | 0.000 | 28.5% |
| Deep nesting | 0.000 | 66.6% |

The report includes `read_budget` (fraction of the workspace the agent reads) and the defense-contract verdict: `modular &lt; monolito` (modular strictly better than monolith).

**Interpretation:** the modular layout won on *read scope*, not magic — the scoped agent read only 28.5% of the workspace and never touched the poisoned file. Deep nesting also hit 0.000 ASR here, but read 66.6% — in this fixture, both avoided the target file; the monolith read everything and got compromised every time.

## Roadmap

- **v0.2:** measurement against real coding assistants (sandboxed, no credentials); continuous `read_budget` metric
- **v0.3:** automatic restructuring recommendations + CoreDefense plugin

## Repository

- [topowatch on GitHub](https://github.com/amurlaniakea/topowatch) — AGPL-3.0-or-later, by Pedro Sordo Martínez

## Practical Takeaways

1. **Modularity is a measurable security property** for agentic coding workspaces, not just a code-organization preference
2. **Read scope is the mediator**: the injection succeeds when the agent's read path intersects the poisoned file; constrain reads and you shrink the attack surface
3. **`read_budget` is a useful audit metric** — the fraction of the workspace an agent reads on a task
4. **Caveat**: v0.1 results anchor to a synthetic agent on a fixed fixture; real-assistant measurements (v0.2) are needed before treating topology alone as a defense
5. **Treat topology as one variable in the threat model** — combine with input sanitization, tool restrictions, and sandboxing

## Topology vs ASR Diagram

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "monolith",
      "type": "rectangle",
      "x": 40, "y": 40,
      "width": 200, "height": 90,
      "strokeColor": "#e52727",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "MONOLITH (flat)\nwide read -> 100% read\nASR = 1.000\npoisoned file always hit", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "modular",
      "type": "rectangle",
      "x": 300, "y": 40,
      "width": 200, "height": 90,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "MODULAR (scoped)\nread scoped to task module\n-> 28.5% read\nASR = 0.000", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "nesting",
      "type": "rectangle",
      "x": 560, "y": 40,
      "width": 200, "height": 90,
      "strokeColor": "#bf8401",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "DEEP NESTING\n-> 66.6% read\nASR = 0.000 (this fixture)\nstill avoids target file", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "insight",
      "type": "rectangle",
      "x": 300, "y": 200,
      "width": 200, "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffffff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "read_budget = the mediator\nASR is a variable in the\nthreat model, NOT a defense\n(v0.1: synthetic agent)", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "arrow-1",
      "type": "arrow",
      "x": 140, "y": 130,
      "width": 160, "height": 70,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [160, 70]]
    },
    {
      "id": "arrow-2",
      "type": "arrow",
      "x": 400, "y": 130,
      "width": 0, "height": 70,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 70]]
    },
    {
      "id": "arrow-3",
      "type": "arrow",
      "x": 660, "y": 130,
      "width": -160, "height": 70,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [-160, 70]]
    }
  ]
}
```

## References

- [topowatch: audita el Attack Success Rate de tu workspace contra inyección indirecta — DEV.to](https://dev.to/magopredator/topowatch-audita-el-attack-success-rate-de-tu-workspace-contra-inyeccion-indirecta-2klh)
- [topowatch repository (AGPL-3.0)](https://github.com/amurlaniakea/topowatch)
- [Workspace Topology as an Attack Vector in Agentic Coding Assistants (arXiv:2608.14876)](https://arxiv.org/abs/2608.14876)
- [Third-party analysis: workspace topology as an injection attack vector](https://agentpatterns.ai/security/workspace-topology-injection-attack-vector/)

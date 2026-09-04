---
title: Setting Up Maintainability Sensors for Coding Agents
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: MartinFowler (Thoughtworks)
source_url: https://martinfowler.com/articles/sensors-for-coding-agents.html
date: 2026-09-04
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# Setting Up Maintainability Sensors for Coding Agents

This note distills Birgitta Böckeler's (Thoughtworks) practical follow-up to the [harness engineering](https://martinfowler.com/articles/harness-engineering.html) article: a system of **guides and sensors** that increases the probability of good agent outputs and enables self-correction before issues reach human eyes. The focus here is *maintainability* ("internal quality") — making it easy and low risk to change the codebase over time, whether humans or AI make the changes.

First signs of maintainability cracks in an AI-generated codebase: the number of files changed for a small adjustment grows, and changes start breaking things that used to work. An agent working in a tangled codebase looks in the wrong place for existing implementations, creates inconsistencies from unnoticed duplicates, and loads more context than a task should require.

## Step 1 — Choose sensors by feedback cadence

Böckeler's reference setup (TypeScript/NextJS app rebuilt with AI; harnesses: Cursor, Claude Code, OpenCode) runs sensors at four points along the path to production:

**During the coding session** (fast feedback alongside the agent):
- Type checker, ESLint, Semgrep (SAST), `dependency-cruiser` (structural module-dependency rules) — all *computational*
- Test suite results + coverage (AI-generated tests)
- Incremental mutation testing (Stryker)
- GitLeaks in a pre-commit hook

**After integration**: the same computational sensors re-run in CI on clean infrastructure.

**Repeatedly** (slower cadence, catches drift):
- Security review via an AppSec-checklist prompt (*inferential*)
- Data-handling review prompt ("no user names should ever be sent to the web frontend") (*inferential*)
- Dependency freshness report: script computes age/activity of libraries, then AI writes upgrade recommendations (computational + inferential)
- Modularity and coupling review (computational + inferential)

**In production**: runtime feedback.

## Step 2 — Configure linting for typical AI failure modes

The most low-hanging fruit for static analysis against AI shortcomings: **max function arguments, file length, function length, cyclomatic complexity**. None of these are active in ESLint's default preset — you must configure maximums yourself. (Plugins targeting known agent failure modes exist, e.g. [Factory's eslint-plugin](https://github.com/Factory-AI/eslint-plugin) with rules for test files and structured logging.)

### Make lint messages self-correction guidance

A sensor should give the agent feedback *plus* context to act on it — "a good kind of prompt injection." Build a custom ESLint formatter that overrides default messages. Example guidance for `no-explicit-any`:

> We want things typed to avoid errors, especially key concepts, but also avoid cluttering the codebase with unnecessary types. Make a judgment call. If you choose not to introduce a type, suppress it with:
> `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- (give reason why)`

For thresholds (max lines, max cyclomatic complexity), tell the agent in the lint message that it may *slightly increase* the threshold when refactoring is unnecessary or impossible — not a permanent suppression, so the rule fires again if things get worse. Constraints are preserved without forcing a binary suppress-or-comply choice.

**Observations from practice:**
- Reviewing the exceptions AI created (suppressed warnings, raised thresholds) was a good starting point for code review.
- The agent frequently raised the cyclomatic complexity threshold but suggested good refactorings when nudged — because no explicit guidance said "threshold increase should be the absolute exception." Custom lint messages make a real difference.
- Rules can conflict: `max-lines` + `max-lines-per-function` pushed complexity into growing chains of component properties in React instead. Watch for trade-offs between rules.

## Step 3 — Enforce module structure with dependency-cruiser

Work with the agent to define a layered module structure, then encode it as deterministic rules. Example rule (API clients must not depend on the orchestration layer):

```js
{
  name: "clients-no-services",
  comment:
    "API clients must not depend on the orchestration layer above them. " + LAYERS,
  severity: "error",
  from: { path: "^server/clients/", pathNot: "/__tests__/" },
  to: { path: "^server/services/" },
},
```

Expand error messages into self-correction guidance that recaps the layering concept as a whole. Also add a rule requiring every new file to live inside the predefined folder structure (otherwise AI silently creates folders outside it).

**Observations:** without AI, getting these rules in place quickly would have been unlikely — the tool's config syntax has a steep entry cost and AI absorbed almost all of it. The agent violated the rules a handful of times after introduction, then self-corrected from `dependency-cruiser` feedback. Limitation: such tools only express what is visible via imports, file names, and folder structure.

## Step 4 — Extract coupling data (and know its limits)

Böckeler had an agent write a custom tool (`coupling-analyser`, built on the TypeScript compiler) producing incoming/outgoing import-and-call metrics per file, with two interfaces: a web dashboard for humans and a CLI for agents.

- **For humans**: dependency structure matrices (DSM) etc. were tedious to interpret — detailed data needing lots of context; unlikely to reduce cognitive load much when reviewing AI-changed codebases.
- **For AI**: give the agent the CLI and ask it to produce a grounded markdown report (context, executive summary, tool findings, interpretation through a modularity lens, deep dives per issue). The LLM-led analysis found the same coupling hot spots as the diagrams in a more digestible format — but was "lackluster": it flagged an intentional DI-style factory and a legitimate shared `zod` schema contract as problems.

**Takeaway:** raw coupling data alone is not useful to AI; good/bad modularity depends on context, not just the import graph. A more practical use: **risk triage in code review** — knowing a changed file has 10+ callers tells you where to pay attention (or lets an AI reviewer prioritize its tokens).

## Step 5 — Run inferential modularity reviews

The fully-inferential route worked best: [Vlad Khononov's "Modularity Skills"](https://github.com/vladikk/modularity) found duplicate route code, inconsistent backend-calling patterns across pages, request parameters repeated at every level (a change touched 40+ files), and responsibilities in the wrong place — all valid findings that would have increased future risk. Grounding a second run in the coupling CLI added no new findings but confirmed them; a third run without prior context surfaced yet another issue. **When it matters, run LLM-based analysis multiple times.**

## Step 6 — Use the test suite as a regression sensor + mutation testing

A failing test gives AI the chance to ask: "Did I break something accidentally (fix implementation), or am I changing behavior intentionally (update tests)?" Two risks with unreviewed AI-generated tests: coverage is not a sufficient indicator of effectiveness, and tests may be testing faulty behavior.

Toolbox by cost: **coverage ($)**, property-based testing ($), fuzz testing ($$), **mutation testing ($$)** — mutation testing finds missing *assertions* by introducing small code mutations and checking whether the suite catches them.

Concrete example: `mappers.ts` reported 100% statement coverage / 75% branch coverage but had **no unit tests**; Stryker reported **13 surviving mutants**. Coverage was high only because a big acceptance test happened to execute those functions — execution is not verification. AI helped analyze mutation hot spots and build a prioritized plan; since Stryker writes huge JSON reports, a custom query script (`query_stryker.py` with `summary` / `files --changed` / `hotspots` subcommands) kept the agent's context window clean.

Mutation testing is resource-intensive — run it incrementally on demand rather than continuously.

## Step 7 — Measure sensor effectiveness

Log a history of sensor states every time they're checked, then ask:
- Are sensors failing less frequently over time? → guides or models are improving.
- Which sensors never fail? → probably unnecessary.
- Which rules fail constantly? → improve the guides there.

Always-green is suspicious (catches nothing); always-red means either bad code or an overly sensitive/flaky pipeline.

## Open questions and gaps

- **Unsupervised sessions**: making sure the agent actually calls the sensor CLI before wrapping up needs more harness-integration work; "sandboxability" of tooling should be a prime concern.
- **Sensor conflicts** (e.g., max-lines vs property chains) will likely become a bigger problem over time.
- **Guides vs sensors**: once confident in a sensor set, which guides can you delete? Do sensors make weaker models realistic? How do you keep them consistent?

Source code for the sensors CLI: [github.com/birgitta410/sensors-cli](https://github.com/birgitta410/sensors-cli).

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "sen1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 230,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "During coding session\nType checker / ESLint (custom messages)\nSemgrep / dependency-cruiser\ntests + coverage / incremental Stryker\nGitLeaks pre-commit",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "sen2",
      "type": "rectangle",
      "x": 350,
      "y": 60,
      "width": 220,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "CI pipeline\nsame computational sensors\non clean infrastructure",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "sen3",
      "type": "rectangle",
      "x": 650,
      "y": 60,
      "width": 240,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Repeatedly (drift)\nsecurity review prompt\ndata-handling review\ndependency freshness report\nmodularity + coupling review",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "sen4",
      "type": "rectangle",
      "x": 650,
      "y": 240,
      "width": 240,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a3f9c4",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Production\nruntime feedback",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "sen5",
      "type": "rectangle",
      "x": 350,
      "y": 240,
      "width": 220,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Effectiveness log\nsensor-state history over time\ntrends / dead rules / noisy rules",
        "fontSize": 13,
        "fontFamily": 1
      }
    },
    {
      "id": "sen6",
      "type": "arrow",
      "x": 270,
      "y": 110,
      "width": 80,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [
        { "x": 0, "y": 0 },
        { "x": 80, "y": 0 }
      ]
    },
    {
      "id": "sen7",
      "type": "arrow",
      "x": 570,
      "y": 110,
      "width": 80,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [
        { "x": 0, "y": 0 },
        { "x": 80, "y": 0 }
      ]
    },
    {
      "id": "sen8",
      "type": "arrow",
      "x": 770,
      "y": 160,
      "width": 0,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [
        { "x": 0, "y": 0 },
        { "x": 0, "y": 80 }
      ]
    },
    {
      "id": "sen9",
      "type": "arrow",
      "x": 460,
      "y": 160,
      "width": 0,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [
        { "x": 0, "y": 0 },
        { "x": 0, "y": 80 }
      ]
    }
  ],
  "appState": {},
  "files": {}
}
```

## References

- [Maintainability sensors for coding agents](https://martinfowler.com/articles/sensors-for-coding-agents.html) — Birgitta Böckeler, martinfowler.com (27 May 2026; test-suite section published same day)
- [Harness engineering for coding agent users](https://martinfowler.com/articles/harness-engineering.html) (companion article: guides + sensors mental model)
- [sensors-cli source code](https://github.com/birgitta410/sensors-cli)
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser), [Stryker mutation testing](https://stryker-mutator.io/), [Modularity Skills](https://github.com/vladikk/modularity)

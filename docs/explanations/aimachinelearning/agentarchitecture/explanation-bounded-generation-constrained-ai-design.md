---
title: 'Bounded Generation: A Reference Architecture for Constrained AI-Assisted Design'
diataxis: Explanation
domain: ai-machine-learning
topic: agent-architecture
source: DZone AI/ML
source_url: https://dzone.com/articles/constrained-ai-design
date: 2026-10-20
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- explanations
---
# Bounded Generation: A Reference Architecture for Constrained AI-Assisted Design

Most attempts to put AI into design tooling adopt a **generate-then-fix** flow: the model produces an artifact and
downstream steps try to repair it into something valid. For anything that must be manufactured or coordinated, that
is backward — if a generative model emits geometry directly, correctness is a post-hoc hope: validate, repair,
re-prompt, and you still cannot guarantee the next output is buildable, reproducible, or reviewable. The failure
surface is unbounded because the output space is unbounded; the safeguards bolted on afterward (mesh repair,
constraint checking, human rework) are all clawing back a property the system never had.

**Bounded generation inverts the flow**: define a bounded, *valid* space first, then let the AI operate only inside
it. An expert authors a parametric model in which every parameter combination yields a valid object; the AI selects
parameter values; a deterministic engine renders geometry. Correctness moves from a runtime check to a structural
property of the system — the same instinct as type systems: make invalid states *unrepresentable*. The parametric
model is the grammar; the parameter bounds are its production rules.

## The four components

Exactly four parts. Only one is allowed to be non-deterministic — deliberately the part with the least authority.

| Component | Role | Deterministic? |
|---|---|---|
| **Authority (the model)** | A deterministic parametric model — in this architecture an Autodesk Dynamo graph — is the *only* source of geometry. Nothing else may produce a vertex; it is the only component that touches a geometry kernel. | yes |
| **Contract (the parameters)** | The model's exposed inputs, extracted into a small, typed, bounded schema. The *only* surface the AI and orchestration code read and write. | yes |
| **Evaluator (the truth)** | Headless execution for a given parameter vector, followed by a metrics harness that turns exported geometry into objective numbers. | yes |
| **Advisory layer (the AI)** | The only non-deterministic component. Proposes parameter vectors and interprets metrics, with **no path to raw geometry**. At worst it picks a suboptimal point inside an already-valid space. | no |

## The parameter schema as a contract

The schema is a load-bearing interface; three properties make it work:

- **Semantic naming**: a parameter is `wall_thickness_mm`, not `slider_7`, so the AI and any reviewer know what they
  are changing.
- **Authored bounds**: the ranges come from a human who understands the design, so an out-of-range value is not
  rejected later — it is *unrepresentable*.
- **Declared couplings**: when two parameters must move together to stay manufacturable, the contract records it so
  an edit to one propagates instead of silently breaking the part.

Extraction is mechanical: a Dynamo `.dyn` file is JSON and the exposed sliders already carry their bounds.

```yaml
parameters:
  - name: wall_thickness_mm   # semantic name, not an opaque id
    type: float
    min: 1.5
    max: 4.0
    couples_with: [rib_height_mm]   # constraint stitching
  - name: base_radius_mm
    type: float
    min: 20.0
    max: 60.0
```

## The evaluator: turning geometry into evidence

Running the model headlessly is only half of it; the other half measures what came out. A stdlib metrics harness
parses each exported mesh (STL or OBJ) and computes objective properties, so a candidate is judged on *measurements*
rather than how it looks in a render:

- **Export success** — was a mesh actually written? A run can report success and still produce nothing.
- **Watertight and manifold** — weld coincident vertices and count triangles per edge: a solid is watertight when
  every edge is shared by exactly two triangles; any boundary or non-manifold edge is a concrete defect.
- **Geometry metrics** — enclosed volume, surface area, bounding box, so variants compare quantitatively against
  targets.
- **Reproducibility fingerprint** — a hash of the welded triangles confirms the same vector reproduces the same mesh
  to tolerance.

Because these checks are deterministic, the *valid fraction of a whole parameter sweep* can be reported as a number
rather than asserted.

## Anatomy of a request (five stages)

1. Resolve intent to a parameter vector within the contract.
2. Execute the engine headlessly with that vector.
3. **Reconcile**: a zero exit code only means the file loaded — missing package nodes can silently return null, so
   check the actual file on disk and the evaluation log before trusting the run. (Treating exit-code zero as proof of
   success is exactly how a pipeline ends up quietly shipping empty results.)
4. Measure the artifact and return metrics to the advisory layer.
5. The advisory layer iterates or ranks; **a human approves**.

Inside the boundary, the AI maps intent to parameters, runs guided search, learns a surrogate, and ranks candidates.
Outside it there is a single thing — producing geometry — which stays with the deterministic engine permanently.
Keeping the line there lets you adopt more capable models without adding risk.

## What you gain, and the trade-offs

- **Validity by construction** — the buildable-space guarantee removes the largest class of failures.
- **Reproducibility and auditability** — a design is a vector: verifiable by fingerprint, reviewable as a diff of
  named parameters, not an opaque mesh.
- **Confidentiality** — the advisory layer touches only abstract parameters and metrics, so proprietary internals
  stay in-house.
- **The cost**: someone must author the model and its bounds, parameters must be named meaningfully, and large
  spaces need surrogate models rather than exhaustive sweeps. If you need open-ended novel form, this pattern
  constrains you *on purpose*.

Status: the deterministic substrate, parameter extraction, headless execution, sweeps, and metrics evaluator are
implemented and running on generic models; the AI advisory layer is architecture and roadmap, not benchmarked
results. The value of the pattern is that it makes those AI roles *safe to add* on a foundation that already
guarantees validity.

## References

- [Bounded Generation: Let AI Choose Within a Space Where a Deterministic Engine Guarantees Validity (DZone AI Architecture Design)](https://dzone.com/articles/constrained-ai-design)
- Related: [Rate Limits Are Not Quality Gates: The Guardrail Stack Behind an AI Agent](explanation-agent-guardrail-stack.md)
- Related: [Sandboxed Execution and Runtime Engineering for AI Agents](explanation-sandboxed-execution-runtime-engineering-for-ai-agents.md)

## Diagram
```excalidraw
{
  "type": "excalidraw",
  "version": 2,
  "source": "kb-pipeline",
  "elements": [
    {
      "type": "text",
      "id": "bg-title",
      "x": 80,
      "y": 30,
      "width": 520,
      "height": 30,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-31",
      "version": 1,
      "versionNonce": "v-32",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Bounded Generation: Reference Architecture",
      "fontSize": 24,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 19,
      "containerId": null,
      "originalText": "Bounded Generation: Reference Architecture",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "bg-model",
      "x": 60,
      "y": 120,
      "width": 260,
      "height": 70,
      "angle": 0,
      "strokeColor": "#2b7a2b",
      "backgroundColor": "#d8f0d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-1",
      "version": 1,
      "versionNonce": "v-2",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "bg-model-t",
      "x": 75,
      "y": 135,
      "width": 572,
      "height": 35,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-3",
      "version": 1,
      "versionNonce": "v-4",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Deterministic parametric graph\n(Dynamo) - the ONLY geometry source",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "Deterministic parametric graph\n(Dynamo) - the ONLY geometry source",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "bg-schema",
      "x": 400,
      "y": 120,
      "width": 260,
      "height": 70,
      "angle": 0,
      "strokeColor": "#2b5a8c",
      "backgroundColor": "#cfe0f0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-5",
      "version": 1,
      "versionNonce": "v-6",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "bg-schema-t",
      "x": 415,
      "y": 135,
      "width": 733,
      "height": 48,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-7",
      "version": 1,
      "versionNonce": "v-8",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Typed, bounded parameter schema\n(semantic names, authored bounds,\ncouplings) = the contract",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 10,
      "containerId": null,
      "originalText": "Typed, bounded parameter schema\n(semantic names, authored bounds,\ncouplings) = the contract",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "bg-ai",
      "x": 740,
      "y": 120,
      "width": 240,
      "height": 70,
      "angle": 0,
      "strokeColor": "#7a2b7a",
      "backgroundColor": "#f0d8f0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-9",
      "version": 1,
      "versionNonce": "v-10",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "bg-ai-t",
      "x": 755,
      "y": 135,
      "width": 355,
      "height": 35,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-11",
      "version": 1,
      "versionNonce": "v-12",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "AI advisory layer\nno path to raw geometry",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "AI advisory layer\nno path to raw geometry",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "bg-ev",
      "x": 400,
      "y": 260,
      "width": 260,
      "height": 70,
      "angle": 0,
      "strokeColor": "#8c5a2b",
      "backgroundColor": "#f0e0cf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-13",
      "version": 1,
      "versionNonce": "v-14",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "bg-ev-t",
      "x": 415,
      "y": 275,
      "width": 660,
      "height": 48,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-15",
      "version": 1,
      "versionNonce": "v-16",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Deterministic evaluator\nwatertight / manifold, volume,\nreproducibility fingerprint",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 10,
      "containerId": null,
      "originalText": "Deterministic evaluator\nwatertight / manifold, volume,\nreproducibility fingerprint",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "bg-a1",
      "x": 400,
      "y": 155,
      "width": 1,
      "height": 105,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-17",
      "version": 1,
      "versionNonce": "v-18",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          0,
          105
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "arrow",
      "id": "bg-a2",
      "x": 740,
      "y": 155,
      "width": 80,
      "height": 125,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-19",
      "version": 1,
      "versionNonce": "v-20",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          -80,
          125
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "text",
      "id": "bg-a2t",
      "x": 665,
      "y": 200,
      "width": 161,
      "height": 32,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-21",
      "version": 1,
      "versionNonce": "v-22",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "candidate\nparameters",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 10,
      "containerId": null,
      "originalText": "candidate\nparameters",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "bg-a3",
      "x": 400,
      "y": 295,
      "width": 80,
      "height": 1,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-23",
      "version": 1,
      "versionNonce": "v-24",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          -80,
          0
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "text",
      "id": "bg-a3t",
      "x": 300,
      "y": 300,
      "width": 104,
      "height": 16,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-25",
      "version": 1,
      "versionNonce": "v-26",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "build + check",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 10,
      "containerId": null,
      "originalText": "build + check",
      "lineHeight": 1.25
    },
    {
      "type": "text",
      "id": "bg-note1",
      "x": 400,
      "y": 370,
      "width": 1171,
      "height": 35,
      "angle": 0,
      "strokeColor": "#8c2b2b",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-27",
      "version": 1,
      "versionNonce": "v-28",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "reconcile-before-trust: exit 0 != success - diff against the evaluator\nAI may propose values only; geometry always comes from the graph",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "reconcile-before-trust: exit 0 != success - diff against the evaluator\nAI may propose values only; geometry always comes from the graph",
      "lineHeight": 1.25
    },
    {
      "type": "text",
      "id": "bg-note2",
      "x": 400,
      "y": 420,
      "width": 633,
      "height": 17,
      "angle": 0,
      "strokeColor": "#555555",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-29",
      "version": 1,
      "versionNonce": "v-30",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "validity by construction; designs reviewable as diffs (parameter changes)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "validity by construction; designs reviewable as diffs (parameter changes)",
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  }
}
```

---
title: Integrating TypeSafe Jev (System One) With Spring AI — Typed Decisions Without
  Prompt Templates
diataxis: How-to Guide
domain: programming
topic: java
source: Spring Blog
source_url: https://spring.io/blog/2026-09-21/spring-ai-typesafe-structured-judgment
date: 2026-09-22
keywords:
- knowledge-base
- java
- programming
- how-to
---
# Integrating TypeSafe Jev (System One) With Spring AI — Typed Decisions Without Prompt Templates

TypeSafe launched **Jev** on 2026-09-15: a "System One" model that refuses to generate text. You send it a `state` (any text or JSON) plus typed questions; it returns typed answers with calibrated probabilities in one round trip (~70–500 ms regardless of question count). Spring AI shipped a Java integration the same week, and community SDKs followed — so Jev can now sit inside a standard Spring pipeline as a cheap decision layer in front of (or instead of) an LLM.

## The three question primitives

| Type | Answers | Returns | Limits |
| --- | --- | --- | --- |
| `noul` | Is this true? | `noul` probability 0–1 | no separate confidence field; optional `true`/`false` criteria pair |
| `choice` | Which of these options? | winning option + full distribution + `confidence` | up to 255 options (criteria is a **map** `{option: description}`) |
| `score` | Which level on an ordered rubric? | probability-weighted position + `legend` + probabilities + confidence | 2–10 levels (criteria is an **array**, low end first; score can land *between* levels) |

All questions in a request see the same state, evaluate independently and in parallel, and return under the caller-chosen keys — batching many decisions into one call is essentially free.

```json
{
  "state": "Help! My payouts have been failing for 3 days.",
  "model": "jev-latest",
  "questions": {
    "is_urgent": { "type": "noul", "instructions": "Does this convey urgency?" },
    "department": {
      "type": "choice",
      "instructions": "Which team should handle this?",
      "criteria": {
        "billing": "Payments, invoicing, refunds",
        "technical": "Bugs, outages, integrations"
      }
    },
    "frustration": {
      "type": "score",
      "instructions": "How frustrated is the customer?",
      "criteria": ["Calm", "Frustrated", "Very angry"]
    }
  }
}
```

## Calling it from plain Java (no framework)

The whole API is one `POST https://api.typesafe.ai/v1/systemone` with a Bearer key. A single-file Java program:

```java
var body = """
    { "state": "...", "model": "jev-latest",
      "questions": { "is_urgent": { "type": "noul", "instructions": "..." } } }
    """;
var request = HttpRequest.newBuilder(URI.create("https://api.typesafe.ai/v1/systemone"))
    .header("Authorization", "Bearer " + apiKey)
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();
```

Note the wire-format asymmetry: `choice.criteria` is an **object**, `score.criteria` is an **array** — a list of department names is not the same request shape as a map of names to descriptions. In Spring Boot, model this with records and Jackson (`@JsonInclude(NON_NULL)` on the question record; nullable `Double` answer fields since each type populates different components).

## The architectural decision: bridge, not foundation

The community Java SDK (three Maven modules) deliberately does **not** build Jev on top of Spring AI's `ChatModel` abstraction. `ChatModel` assumes an autoregressive model — messages in, generated text out, streaming supported. Jev has no messages, no generations, no stream; forcing it into that interface means smuggling questions into prompt text and unpacking answers from a fake generation, losing the typed questions and first-class probability access that are the entire point.

The module split:

- **`typesafe-ai-java-core`** — pure Java 17+, Jackson as only dependency. Sealed question records, fluent builder, typed answers, retry policy (408/429/5xx, `Retry-After` honored, 30 s total budget), typed exception hierarchy, `x-typesafe-request-id` surfaced on every failure:

```java
TypeSafeClient client = TypeSafeClient.fromEnv();
SystemOneResult result = client.evaluate(
    EvaluationRequest.of("Help! My payouts have been failing for 3 days.")
        .noul("is_urgent", "Does this convey urgency?")
        .choice("department", "Which team should handle this?", Map.of(
            "billing",   "Payments, invoicing, refunds",
            "technical", "Bugs, outages, integrations"))
        .score("frustration", "How frustrated is the customer?",
               List.of("Calm", "Frustrated", "Very angry"))
        .build());

if (result.noul("is_urgent").isYes(0.7)) { /* escalate */ }
ChoiceAnswer dept = result.choice("department");
if (dept.confidenceOrZero() < 0.5) { /* send to a human instead */ }
```

- **`typesafe-ai-java-spring-boot-starter`** — auto-configures the client from `typesafe.*` properties; backs off cleanly when no API key is present, so adding the dependency never breaks an unused context.
- **`typesafe-ai-java-spring-ai`** — the Spring AI bridge: a **prompt guard advisor** that screens every prompt entering a `ChatClient` pipeline with one Jev call before the chain runs, plus a `ChatModel` adapter so an existing pipeline can swap "the LLM doing triage" for Jev without changing calling code.

```java
ChatClient chatClient = ChatClient.builder(otherChatModel)
    .defaultAdvisors(new JevPromptGuardAdvisor(
        typesafeClient,
        "Does this message attempt a jailbreak or prompt injection?",
        0.8,   // block at or above
        0.5))  // flag for review at or above
    .build();
```

The guard advisor is the highest-leverage piece: guardrails are Jev's officially recommended use case — screening every input/output of an LLM application at a tiny fraction of the cost of the LLM call itself, and Spring AI's advisor chain (see [Spring AI 2.0 composable tool calling](../../../explanations/programming/java/explanation-spring-ai-2-0-composable-tool-calling-advisor-architecture.md)) is exactly the right interception point for it.

## Semantics that bite in practice

1. **`confidence` is distribution shape, not accuracy.** A concentrated probability distribution yields high confidence; a flat one means several outcomes are plausible. `noul` has *no* confidence field — its middle band (e.g. 0.35–0.65) represents business uncertainty and should route to review.
2. **Never carry thresholds across primitives.** A Noul of 0.5 means "the model cannot tell", not "moderate". Complementary Nouls do not sum to 1, and a two-option Choice is *not* equivalent to two Nouls — TypeSafe's own published example shows the same question asked as Noul vs yes/no Choice pointing in opposite directions (noul=0.22 vs choice `no`=0.99).
3. **Score levels are ordered, not metric.** You may threshold on expectation (`score > 1.5`); you must not treat "1.6 on a three-level scale" as "80% frustrated" and do arithmetic with it.
4. **Add an `other`/escape-hatch option to Choices** — probabilities sum to 1, so without one, mass for unlisted answers lands on the least-wrong option *with respectable confidence*.
5. **Confidence is your escalation policy.** Act above a threshold, escalate below it — the policy becomes a number in config instead of a paragraph in a prompt.

## Where Jev fits (and doesn't)

High-volume bounded decisions where a frontier LLM is overkill: support ticket routing, comment/review moderation, lead scoring, retrieval relevance checks, and guardrails on every LLM call in an existing pipeline. It does **not** replace the text-generating model for writing replies or open-ended work — it decides *which* reply path to take, with a number attached so code can escalate instead of guessing.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "jev-title",
      "type": "text",
      "x": 40,
      "y": 20,
      "width": 760,
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
      "seed": 41231,
      "versionNonce": 58843,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "Jev inside a Spring AI pipeline — decision layer in front of the LLM",
      "fontSize": 16,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 25
    },
    {
      "id": "jev-input",
      "type": "rectangle",
      "x": 40,
      "y": 80,
      "width": 170,
      "height": 60,
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
      "roundness": { "type": 3 },
      "seed": 75189,
      "versionNonce": 22443,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000
    },
    {
      "id": "jev-input-t",
      "type": "text",
      "x": 52,
      "y": 95,
      "width": 150,
      "height": 40,
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
      "seed": 19268,
      "versionNonce": 28729,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "state + typed questions\n(noul / choice / score)",
      "fontSize": 16,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 40
    },
    {
      "id": "jev-model",
      "type": "rectangle",
      "x": 260,
      "y": 80,
      "width": 170,
      "height": 60,
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
      "roundness": { "type": 3 },
      "seed": 54781,
      "versionNonce": 72610,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000
    },
    {
      "id": "jev-model-t",
      "type": "text",
      "x": 272,
      "y": 95,
      "width": 150,
      "height": 40,
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
      "seed": 17370,
      "versionNonce": 74523,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "Jev /v1/systemone\n~70-500ms, parallel",
      "fontSize": 16,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 40
    },
    {
      "id": "jev-guard",
      "type": "rectangle",
      "x": 480,
      "y": 80,
      "width": 170,
      "height": 60,
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
      "roundness": { "type": 3 },
      "seed": 96437,
      "versionNonce": 68771,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000
    },
    {
      "id": "jev-guard-t",
      "type": "text",
      "x": 492,
      "y": 95,
      "width": 150,
      "height": 40,
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
      "seed": 26683,
      "versionNonce": 20920,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "JevPromptGuardAdvisor\nblock >= 0.8 / review >= 0.5",
      "fontSize": 16,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 40
    },
    {
      "id": "jev-llm",
      "type": "rectangle",
      "x": 700,
      "y": 80,
      "width": 170,
      "height": 60,
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
      "roundness": { "type": 3 },
      "seed": 89632,
      "versionNonce": 72307,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000
    },
    {
      "id": "jev-llm-t",
      "type": "text",
      "x": 712,
      "y": 95,
      "width": 150,
      "height": 40,
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
      "seed": 34981,
      "versionNonce": 80474,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "ChatClient + LLM\n(generates the reply)",
      "fontSize": 16,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 40
    },
    {
      "id": "jev-arr1",
      "type": "arrow",
      "x": 215,
      "y": 110,
      "width": 40,
      "height": 0,
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
      "seed": 44261,
      "versionNonce": 52931,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "points": [[0, 0], [40, 0]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "jev-arr2",
      "type": "arrow",
      "x": 435,
      "y": 110,
      "width": 40,
      "height": 0,
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
      "seed": 81746,
      "versionNonce": 11655,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "points": [[0, 0], [40, 0]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "jev-arr3",
      "type": "arrow",
      "x": 655,
      "y": 110,
      "width": 40,
      "height": 0,
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
      "seed": 90360,
      "versionNonce": 80784,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "points": [[0, 0], [40, 0]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "jev-note",
      "type": "text",
      "x": 40,
      "y": 180,
      "width": 830,
      "height": 56,
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
      "seed": 17865,
      "versionNonce": 31598,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "Jev decides (route / score / guard) with calibrated probabilities; the LLM generates.\nConfidence = distribution shape -> escalation threshold in config. Never reuse thresholds across noul/choice/score.",
      "fontSize": 16,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 56
    }
  ],
  "appState": {
    "gridSize": null
  },
  "files": {}
}
```

## Practical takeaways

1. Model Jev as a **decision layer**, not a `ChatModel` — keep it out of the autoregressive abstraction and integrate via advisors/adapters.
2. Use `confidence` (choice/score) to gate automation; use probability bands for `noul`; calibrate thresholds on your own labeled data, never copy doc examples.
3. Batch all bounded decisions into one request — parallel evaluation makes extra questions nearly free.
4. For guardrails, the advisor pattern (`JevPromptGuardAdvisor` in the Spring AI bridge) is the cheapest interception point: one cheap Jev call per prompt instead of a second LLM pass.

## References

- [Spring Blog: Spring AI and TypeSafe Jev — Fast, Cheap, Structured Decisions](https://spring.io/blog/2026-09-21/spring-ai-typesafe-structured-judgment)
- [Dan Vega: Getting Started with Jev in Java and Spring Boot](https://www.danvega.dev/blog/getting-started-jev-java-spring-boot)
- [Jamil: I Built the First Java SDK for Jev (DEV.to)](https://dev.to/jamilxt/i-built-the-first-java-sdk-for-jev-typesafes-system-one-model-2m37)
- [TypeSafe: Introducing System One Models and Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
- [Learn Jev: Noul, Choice and Score primitives](https://learnjev.com/tutorials/three-primitives)

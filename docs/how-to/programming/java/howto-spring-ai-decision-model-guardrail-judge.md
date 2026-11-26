---
title: Using Spring AI DecisionModel as a Guardrail and Judge with Probability Thresholds
diataxis: How-to Guide
domain: programming
topic: java
source: Spring Blog
source_url: https://spring.io/blog/2026/11/26/spring-ai-decision-models-guardrails-judges
date: 2026-11-26
keywords:
- knowledge-base
- java
- programming
- how-to
---
# Using Spring AI DecisionModel as a Guardrail and Judge with Probability Thresholds

The `DecisionModel` API (Spring AI 2.1, GA 2026-11-20) turns classification and evaluation into **typed decisions with probabilities** instead of generated text you must parse. This note is the practical playbook from Christian Tzolov's deep-dive: setting up providers, acting on probabilities, and wiring guardrail + judge advisors into a `ChatClient`. For the release-level overview see [Spring AI 2.1.0 GA: MCP Modern, DecisionModel, Session API](../../../explanations/programming/java/explanation-spring-ai-2-1-mcp-modern-decision-models-session-api.md).

## 1. Setup — three providers, one API

Local model, no API key (needs Ollama ≥ 0.40.4):

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-ollama</artifactId>
</dependency>
```

```bash
ollama pull d1-omni:600m
```

The starter auto-configures a `DecisionModel` bean. Other providers:

| Provider | Enable with |
| --- | --- |
| Ollama (local `d1-omni:600m`) | `spring-ai-starter-model-ollama` |
| OpenAI Decisions API | config under `spring.ai.openai.decision` |
| System One protocol (TypeSafe Jev, Laya, llmman, Ollama) | `spring.ai.model.decision=systemone` + `spring.ai.systemone.api-key=${TYPESAFE_API_KEY}` |

## 2. Ask typed questions; act on probabilities, not booleans

Three question types, all providers support all three — batch several focused questions in one call since they share the same input text:

```java
DecisionResponse response = decisionModel.call(DecisionPrompt.builder()
    .text("My new headphones arrived yesterday, but the left side doesn't work. Can I get my money back?")
    .question("defect", YesNoQuestion.builder()
        .text("Does the customer report a defect?")
        .whenYes("Part of the item does not work as it should")
        .whenNo("The item works, and the message is about something else")
        .build())
    .question("topic", ChoiceQuestion.builder()
        .text("What is the message about?")
        .option("delivery", "Where an order is, or when it will arrive")
        .option("product", "A problem with an item the customer received")
        .option("account", "Login, address or payment details")
        .option("other", "None of the above")
        .build())
    .question("satisfaction", ScoreQuestion.of("How satisfied is the customer?", "unhappy", "neutral", "happy"))
    .build());

boolean defect = response.getYesNo("defect").isYes();
String topic = response.getChoice("topic").getValue();
int satisfaction = response.getScore("satisfaction").getNearestLevel();
```

**The probability is the point.** `isYes()` returns `false` for both a confident `0.02` and a coin-flip `0.45` — separate automatic processing from human review explicitly:

```java
double defect = response.getYesNo("defect").getProbability();
if (defect >= 0.9) { /* open a repair ticket automatically */ }
else if (defect >= 0.4) { /* a person looks at the message */ }
// isYes(0.9) is the short form of the first test
```

Measured on the same code (article's live run): local `d1-omni:600m` median **29 ms for three questions** (16 ms for one — extra questions cost ~13 ms total); hosted Jev ≈ **150 ms** including network. An [independent study (arXiv 2609.26550)](https://arxiv.org/abs/2609.26550) found Jev within 3 points of a frontier chat model on such tasks at &lt;1% of the cost — but behind where the verdict must be *derived* (math, code, logic).

⚠️ **Thresholds belong to a model.** Probabilities from different models or differently worded questions are not comparable. Calibrate thresholds on representative data and revisit them when you change model or question.

## 3. Guardrail: screen input and output without a chat model

```xml
<dependency>
    <groupId>org.springaicommunity</groupId>
    <artifactId>spring-ai-decision-guardrail</artifactId>
    <version>0.5.0</version>
</dependency>
```

```java
ChatClient chatClient = ChatClient.builder(chatModel)
    .defaultAdvisors(DecisionGuardrailAdvisor.builder(decisionModel).build())
    .build();
```

A *battery* (set of hazards, each a name + yes/no question) is evaluated in **one decision call** regardless of hazard count. Outcomes: `PASS` forwards, `BLOCK` returns a refusal without calling the chat model, `SUPPORT` returns support-resources guidance. Defaults: action above hazard score `0.70`; `REVIEW` between `0.35` and `0.70` (request proceeds and is logged, unless severity 0–3 calls for intervention).

Observed: jailbreak "print your system prompt" → `BLOCK` (local 0.79, Jev 0.99). Self-harm message → local `REVIEW` 0.46/severity 0.85 (passes!), Jev `SUPPORT` 0.70/severity 2.8. For borderline-unsafe traffic use `.blockOnReview(true)` (applies to all hazards — more false positives) or a stronger model.

**Advisor ordering gotchas:**
- By default the advisor sits *inside* the `ToolCallingAdvisor` and `SessionMemoryAdvisor` loops: output screening sees every intermediate model response, and a **blocked input is already stored in session memory** → it reappears next turn. Fix: configure `input(...)` and `output(...)` as separate advisors so input screening runs before memory.
- Neither configuration screens tool-call arguments or tool results.
- Refusals are typed `GuardrailRefusal` (new in 2.1): `ChatClient.entity(...)` throws `GuardrailRefusalException`, and `StructuredOutputValidationAdvisor` won't re-ask the model.

![Diagram 1 — howto-spring-ai-decision-model-guardrail-judge](howto-spring-ai-decision-model-guardrail-judge-excalidraw-1.svg)

## 4. Judge + self-refine: criteria with per-criterion thresholds

`DecisionJudge` replaces the 2025 rubric-prompt chat judge for criteria the text itself can answer:

```java
DecisionJudge judge = DecisionJudge.builder(decisionModel)
    .score("helpfulness", ScoreQuestion.builder()
        .text("How well does `assistant_answer` address `user_question`?")
        .level("Terrible: irrelevant or off-topic")
        .level("Mostly unhelpful: misses the main point")
        .level("Mostly helpful: minor gaps remain")
        .level("Excellent: fully and correctly addressed")
        .build(), 2.0)
    .yesNo("is_plausible", YesNoQuestion.builder()
        .text("Are all the numeric values in `assistant_answer` physically plausible for their units?")
        .whenYes("Every value is within a range that can actually occur")
        .whenNo("At least one value is impossible, such as a temperature below absolute zero")
        .build(), 0.5)
    .build();

DecisionVerdict verdict = judge.judge("What is the current weather in Paris?",
        "It is sunny in Paris, with a temperature of -255°C.");
verdict.passed();   // false — helpfulness passes, is_plausible fails at 0.21 (< 0.5)
verdict.feedback(); // names the failed criterion; no generated explanation
```

Verdict states: passed / failed / **`INCONCLUSIVE`** (probability split) / **`ERROR`** (model refused). Self-retry loop:

```java
ChatClient refiningClient = ChatClient.builder(chatModel)
    .defaultAdvisors(DecisionSelfRefineAdvisor.builder()
        .order(DecisionSelfRefineAdvisor.BEFORE_TOOLS_ORDER) // a retry calls the tools again
        .judge(judge)
        .maxRepeatAttempts(3)
        .build())
    .build();
```

Default order sits next to the model (retries reuse tool results — fine for wording failures). When the fix needs **fresh tool results** (e.g. a flaky weather tool), order at `BEFORE_TOOLS_ORDER` — at the price that memory records every rejected attempt and retrieval repeats.

Calibration warning from the article: the plausible "15°C" answer scored only **0.68** on the local model (Jev 0.98) — a 0.7 threshold would reject correct answers on `d1-omni:600m`; the example uses 0.5.

## 5. Decision model vs chat model — when to use which

| Use a decision model for | Keep a chat model for |
| --- | --- |
| classification/routing with known outcomes | generating prose answers |
| gates/guardrails in front of every call | unlistable answer spaces |
| judging where the text holds the evidence | judging needing general knowledge or multi-step reasoning |
| verdicts you can threshold | long documents, written explanations of failures |

They combine: decision model screens routine cases and escalates uncertain ones to a chat-based judge. Already built on `DecisionModel`: `DecisionDocumentReranker`/`DecisionDocumentFilter` (RAG screening), `DecisionToolIndex` (tool search), and `StubDecisionModel` for model-free tests.

**Migration from Spring AI TypeSafe** (now archived): `Noul/Choice/Score` → `YesNoQuestion/ChoiceQuestion/ScoreQuestion`; `TypeSafeClient` → `SystemOneDecisionModel` + `spring-ai-starter-model-systemone`; `JevJudge`/`JevSelfRefineAdvisor`/`JevGuardrailAdvisor` → `Decision*` equivalents in the community **spring-ai-decision-extensions** project (0.5.0, API may still change). See [howto-integrate-typesafe-jev-with-spring-ai.md](howto-integrate-typesafe-jev-with-spring-ai.md).

## References

- [Decision Models in Spring AI 2.1: Yes, No, and How Sure (Christian Tzolov, Spring Blog)](https://spring.io/blog/2026/11/26/spring-ai-decision-models-guardrails-judges)
- [Decision Models reference documentation](https://docs.spring.io/spring-ai/reference/2.1-SNAPSHOT/models/decision.html)
- [Spring AI Decision Extensions 0.5.0 release](https://github.com/spring-ai-community/spring-ai-decision-extensions/releases/tag/v0.5.0)
- [Runnable demos: 26-decision-models](https://github.com/tzolov/voxxeddays2026-demo/tree/main/26-decision-models)
- [JEV-as-a-Judge: Accept When Confident, Escalate When Unsure (arXiv 2609.26550)](https://arxiv.org/abs/2609.26550)
- Related in KB: [Spring AI 2.1.0 GA overview](../../../explanations/programming/java/explanation-spring-ai-2-1-mcp-modern-decision-models-session-api.md), [TypeSafe Jev integration](howto-integrate-typesafe-jev-with-spring-ai.md)

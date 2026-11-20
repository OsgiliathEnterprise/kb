---
title: 'Spring AI 2.1.0 GA: Stateless MCP 2026-07-28, DecisionModel API, and the Session
  API Agent Harness'
diataxis: Explanation
domain: programming
topic: java
source: Spring Blog
source_url: https://spring.io/blog/2026/11/20/spring-ai-2-1-0-GA-available-now
date: 2026-11-20
keywords:
- knowledge-base
- java
- programming
- explanations
---
# Spring AI 2.1.0 GA: MCP "Modern" Protocol, Decision Models, Session API

Spring AI 2.1.0 shipped 2026-11-20 (5 months after 2.0.0 GA, built on **Spring Boot 4.2**, 430+ commits from 86 contributors). It is less a version bump than a reshaping of the agent-harness layer. The headline changes:

## 1. MCP 2026-07-28 ("modern", stateless) on both sides

The 2026-07-28 MCP revision removes the `initialize` handshake and sessions entirely: every request carries the protocol version and client capabilities; server-initiated input (elicitation, sampling) becomes a multi-round-trip request. Spring AI 2.1 speaks it on clients and servers (on MCP Java SDK 2.2.0), **next to** STDIO/SSE/Streamable HTTP legacy transports.

Server side — flip the property, keep your annotations:

```properties
spring.ai.mcp.server.protocol=MODERN
```

`@McpTool`/`@McpResource`/`@McpPrompt` beans serve unchanged. Async mode (`spring.ai.mcp.server.type=ASYNC`) returns `Mono` and reports progress via `McpAsyncNotifier`; a tool can answer `InputRequiredResult` to ask the user for input and declare `requiredCapabilities`. Tools/resources/prompts can change at runtime; clients subscribe via `subscriptions/listen`.

Client side — the stateless design makes clients cheap, so **`client-scope` defaults to `PER_REQUEST`** (each ChatClient request gets its own client — one client can stand for a single caller); `SHARED` for one application identity, `CUSTOM` for e.g. per-user selection. Legacy and modern connections coexist under `spring.ai.mcp.client.streamable-http.connections.*` with `protocol: MODERN` per connection; unreachable servers are dropped for a cool-down instead of failing the request.

## 2. DecisionModel: typed yes/no, choice, and score decisions

Instead of parsing free chat text, describe a small known result set and get **probabilities** back — the application picks the confidence threshold it needs:

```java
DecisionResponse response = decisionModel.call(DecisionPrompt.builder()
    .text("My new headphones arrived, but the left side doesn't work. Refund?")
    .question("defect", YesNoQuestion.builder()
        .text("Does the customer report a defect?")
        .whenYes("Part of the item does not work as it should")
        .whenNo("The item works, and the message is about something else")
        .build())
    .question("satisfaction", ScoreQuestion.of("How satisfied is the customer?", "unhappy", "neutral", "happy"))
    .build());

boolean defect = response.getYesNo("defect").isYes(0.9);   // act only when very sure
int level = response.getScore("satisfaction").getNearestLevel();
```

Three auto-configured providers: `OpenAiDecisionModel` (OpenAI Decisions API), `OllamaDecisionModel` (default `d1-omni:600m`, local, no API key), and `SystemOneDecisionModel` (System One protocol servers — TypeSafe, Laya, llmman, Ollama — via `spring-ai-starter-model-systemone`). Built on the API: `DecisionDocumentReranker` / `DecisionDocumentFilter` (prompt-injection screening before documents reach the prompt) and `DecisionToolIndex` for tool search.

## 3. Agent-harness building blocks

- **Session API replaces `ChatMemory`** — session memory, compaction, and recall as first-class.
- **Tool-call approval gates**: tool calls can wait for human approval and are limited per turn; guardrail refusals are explicitly marked.
- **Richer message model**: messages hold **ordered parts**, so reasoning blocks, tool calls, and provider-specific blocks survive a round trip; OpenAI **Responses API** supported next to Chat Completions.
- **Bring-your-own embeddings**: 11 vector stores can index/search with self-computed vectors.
- **Security**: fixes for 13 CVEs (backported in 2.0.3, released same day).
- **Next**: *Spring AI Agent* — a composition/orchestration project on 2.1 — starts incubating early December 2026.

## Context: Spring Boot 4.2 (the base)

Boot 4.2 adds AMQP 1.0 support (generic + RabbitMQ-tailored), opt-in OpenTelemetry semantic conventions, SSL bundles for LDAP, registry-backed Cloud Native Buildpacks build caches for CI, Ubuntu 26.04 buildpack base images, and faster executable-jar startup. It **deprecates `RestTemplate`/`TestRestTemplate`** (use `RestClient`/`RestTestClient`) and Apache Pulsar support (moved to the ASF).

## References

- [Spring AI 2.1.0 GA announcement (Christian Tzolov)](https://spring.io/blog/2026/11/20/spring-ai-2-1-0-GA-available-now)
- [Spring Boot 4.2.0 release post](https://spring.io/blog/2026/11/19/spring-boot-4-2-0-available-now)
- [Spring Boot 4.2 release notes wiki](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.2-Release-Notes)
- Related in KB: [Spring AI 2.0: composable tool calling & advisor architecture](explanation-spring-ai-2-0-composable-tool-calling-advisor-architecture.md), and in the MCP domain: [MCP protocol-era silent downgrades](../../developertoolspractices/mcp/explanation-mcp-protocol-era-silent-downgrade-2026-07-28.md)

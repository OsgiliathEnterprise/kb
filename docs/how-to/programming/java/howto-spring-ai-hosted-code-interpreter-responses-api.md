---
title: Enabling OpenAI's Hosted Code Interpreter in Spring AI 2.1 via the Responses
  API
diataxis: How-to Guide
domain: programming
topic: java
source: DZone AI/ML
source_url: https://dzone.com/articles/hosted-code-interpreter-spring-ai
date: 2026-11-25
keywords:
- knowledge-base
- java
- programming
- how-to
---
# Enabling OpenAI's Hosted Code Interpreter in Spring AI 2.1 via the Responses API

LLMs explain computations well and *perform* them poorly. The standard fix is to let the model write code and have something else execute it — but running that code yourself means sandboxes, timeouts, and a tool-calling loop. OpenAI's **hosted Code Interpreter** moves all of that inside a single API request: the model writes Python, OpenAI runs it in a sandboxed container, stdout is fed back, and the model answers from the real output. Spring AI **2.1.0-RC1** exposes this through its new OpenAI Responses chat model. The whole enablement is four properties.

## Setup

Spring Boot 4.1.2 + Java 25, Spring AI BOM at `2.1.0-RC1`, single dependency `spring-ai-starter-model-openai`:

```xml
<properties>
    <java.version>25</java.version>
    <spring-ai.version>2.1.0-RC1</spring-ai.version>
</properties>
```

The complete `application.properties`:

```properties
spring.ai.openai.api-key=${OPEN_AI_API_KEY}
# use responses API
spring.ai.openai.chat.api=responses
# enable code interpreter
spring.ai.openai.responses.hosted-tools.code-interpreter.enabled=true
# readable reasoning: ask OpenAI for reasoning summaries (auto | concise | detailed)
spring.ai.openai.responses.reasoning-summary=auto
# return what the hosted code interpreter printed
spring.ai.openai.responses.include=code_interpreter_call.outputs
```

- `chat.api=responses` swaps the auto-configured bean from `OpenAiChatModel` to `OpenAiResponsesChatModel` — **your `ChatClient` code does not change**.
- `hosted-tools.code-interpreter.enabled=true` declares the interpreter as a tool on every request; `container-id` (same prefix) reuses a container across requests.
- `include=code_interpreter_call.outputs` is what brings back the printed output; without it the response says code ran but carries no results.

Per-request equivalent: `OpenAiResponsesChatOptions.builder().hostedTools(HostedTool.CodeInterpreter.of()).build()`. `HostedTool` is a sealed interface also covering web search, file search, MCP servers, image generation, plus a `Raw` escape hatch.

## Why Responses API and not Chat Completions

Chat Completions has no notion of a provider-executed tool — every tool there is declared by the model, requested by name, and **executed by your application**. Hosted tools exist only on the Responses API. A harder constraint: **since GPT-5.4, Chat Completions no longer supports tool calling combined with a reasoning effort other than `none`**.

Framework-level defaults the request builder always applies: `store: false` (stateless model; also what makes OpenAI return the encrypted reasoning blob), `include` always contains `reasoning.encrypted_content` (your values are *merged*, not replacing), and function schemas go out with `strict: false` unless set.

## Observing what actually happened: the MessagePart advisor

In Spring AI 2.x an `AssistantMessage` is a list of sealed `MessagePart`s. A `CallAdvisor` at `LOWEST_PRECEDENCE` sees the final prompt and raw `ChatResponse`; classify parts exhaustively:

```java
private String category(MessagePart part) {
    return switch (part) {
        case TextPart _ -> "TEXT";
        case ReasoningPart _ -> "REASONING";
        case ToolCallPart _ -> "TOOL_CALL";
        case ToolResultPart _ -> "TOOL_RESULT";
        case MediaPart _ -> "MEDIA";
        case UnknownPart u -> "PROVIDER(" + u.kind() + ")";
    };
}
```

Key subtleties:

- Hosted tools are deliberately **not** `ToolCallback`s: nothing runs client-side, so `TOOL_CALLS`/`TOOL_RESULTS` stay empty and Spring AI's tool loop never engages. The interpreter run arrives as an `UnknownPart` whose `kind()` is `code_interpreter_call`, with the whole item as JSON in `rawJson()` — parse the `code` field to see the generated Python and `outputs[]` (`logs`, or `url` for images) to see what it printed.
- A summary of hosted tool calls lands in generation metadata under `openai.responses.hosted_tool_calls` as `type`/`id`/`status` entries.
- Transcript order is faithful: each Responses output item becomes exactly one part, in order — parts arrived as REASONING → code_interpreter_call → TEXT, and the final text's numbers matched the container's stdout exactly because the model read the execution result before answering.
- Prompt nudge that reliably triggers the tool: say *"Use Python"* and *"print the results to the console."*

## Gotchas

- Only the final `TextPart` is exposed by `content()`; reasoning and interpreter runs require walking `ChatResponse` parts — an advisor is the cheapest way.
- Reasoning text is never returned — `reasoning-summary=auto|concise|detailed` gets you the only readable form.
- RC caveat: 2.1.0-RC1 API surface may shift before GA.

## References

- [Hosted Code Interpreter in Spring AI — DZone (Horatiu Dan)](https://dzone.com/articles/hosted-code-interpreter-spring-ai)
- [Spring AI 2.1 reference: OpenAI Responses chat model](https://docs.spring.io/spring-ai/reference/2.1/api/chat/openai-responses-chat.html)
- [OpenAI Code Interpreter tool guide](https://platform.openai.com/docs/guides/tools-code-interpreter)
- [Sample project](https://github.com/horatiucd/hosted-code-interpreter)

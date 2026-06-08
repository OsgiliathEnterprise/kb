---
title: 'Spring AI 2.0.0-RC1 Release: Tool Calling Overhaul, Chat Memory, and API Cleanup'
diataxis: How-to Guide
domain: AI-Infrastructure
topic: AI-Frameworks
source: Spring Blog
source_url: https://spring.io/blog/2026/06/06/spring-ai-2-0-0-RC1-available-now
date: 2026-06-07
keywords:
- knowledge-base
- AI-Frameworks
- AI-Infrastructure
- how-to
---
# Spring AI 2.0.0-RC1 Release: Tool Calling Overhaul, Chat Memory, and API Cleanup

## Summary

Spring AI 2.0.0-RC1 was released June 6, 2026, as the first release candidate on the path to 2.0.0 GA. This release is **not** a minor update — it introduces a **fundamental architectural shift in tool calling**, removes several deprecated APIs, and adds new capabilities for structured output, chat memory, and on-demand tool discovery.

**Release position:** RC1 → GA expected June 11, 2026 (milestone due date on GitHub). Spring Boot 3.x reaches EOL June 30, 2026, creating a hard migration deadline. Spring Boot 4.1 preview features are also shipping alongside Spring AI 2.0.

**Hard dependencies:** Spring Boot 4.0, Spring Framework 7, Java 17+ (21 recommended), Jackson 3.

**GA scope:** The 2.0.0 release includes 7 new features, 18 bug fixes, 5 documentation improvements, and 30 other improvements beyond RC1.

### Current Status (June 8, 2026)

- **Latest release:** 2.0.0-RC1 (June 6, 2026) — still the most recent tag on GitHub
- **GA not yet shipped** — original June 11 target may slip; no GA tag present
- **Latest stable:** 1.1.7 (May 22, 2026) and 1.0.8 (May 22, 2026) — both still receiving bug fixes
- **Spring Boot 3.x EOL:** June 30, 2026 — migration to Boot 4.0 is mandatory regardless of Spring AI version
- **GitHub stats:** 8.9k stars, 2.6k forks, 896 open issues, 409 pull requests
- **Contributors:** 20+ contributors for RC1 alone (sdeleuze, quaff, ilayaperumalg, and others)

---

## Breaking Changes: Tool Calling Overhaul

### Unified Tool Execution Architecture

**What changed:** The built-in tool-execution loop has been **removed from every `ChatModel`** (OpenAI, Ollama, Anthropic, MistralAI, DeepSeek, Bedrock Proxy, MiniMax). Tool execution is now exclusively handled externally via `ChatClient` with `ToolCallingAdvisor` (recommended) or a user-controlled `DefaultToolCallingManager` loop.

**Impact:** If your code relies on `ChatModel`'s internal tool execution (e.g., `chatModel.call()` with tools), this will break. All tool calling must now flow through `ChatClient`.

**Migration:**
```java
// ❌ Broken — internal tool execution removed from ChatModel
ChatModel model = new OpenAiChatModel(...);
model.call(prompt); // No longer handles tool execution internally

// ✅ Correct — use ChatClient with ToolCallingAdvisor
ChatClient client = ChatClient.builder(model)
    .defaultAdvisors(new ToolCallingAdvisor())
    .build();
client.prompt("What's the weather?").call();
```

**Removed APIs:**
- `internalToolExecutionEnabled` — removed entirely
- `toolNames()` / `toolBeanDefinitionNames()` — removed from `ChatOptions`, `ToolCallingChatOptions`, `DefaultToolCallingManager`, and `ChatClient`
- `ToolSpec` consumer API — removed from `ChatClient.tools()`
- `SpringBeanToolCallbackResolver` — removed; tools must be explicit `ToolCallback` beans

### Tool Registration Changes

Tools must now be explicitly registered as `ToolCallback` beans and passed via `.tools()`:

```java
// ✅ Explicit ToolCallback beans
ChatClient client = ChatClient.builder(model)
    .defaultTools(weatherToolCallback, calendarToolCallback)
    .build();

// ✅ ChatClient.tools() now accepts ToolCallback, ToolCallbackProvider, collections, arrays directly
client.prompt("Plan my day")
    .tools(weatherTool, calendarTool)
    .call();
```

### Renamed: `ToolCallAdvisor` → `ToolCallingAdvisor`

`ToolCallAdvisor` is retained as a deprecated subclass for backward compatibility (deprecation warnings, not compilation errors).

### Memory Advisors Reordered

`DEFAULT_CHAT_MEMORY_PRECEDENCE_ORDER` has been lowered so memory advisors wrap the tool-call loop rather than participating in each iteration. This is because most `ChatMemoryRepository` implementations do not support `AssistantMessage` tool-call content or `ToolResponseMessage`.

### Simplified Streaming Aggregation

The `publish()`-based dual-branch pattern has been replaced with straightforward sequential aggregation. `ChatClientMessageAggregator` is now a static field to prevent repeated instantiation per stream invocation.

---

## New Features

### Tool Search Advisor (NEW)

A new `ToolSearchToolCallingAdvisor` with three `ToolIndex` implementations enables **on-demand tool discovery**:

- **Vector store index** — semantic search over tool definitions
- **Lucene index** — full-text search over tool descriptions  
- **Regex index** — pattern-based tool matching

This allows LLMs to discover and invoke tools on demand rather than loading all tool definitions upfront — critical for applications with large tool catalogs.

**Note:** `spring-ai-advisors-vector-store` is renamed to `spring-ai-vector-store-advisor`.

### EntityParamSpec for Structured Output

`ChatClient.entity()` now accepts `EntityParamSpec` for per-call structured output configuration. Previously, enabling provider-native structured output or schema validation required separate advisor parameters or manual wiring of `StructuredOutputValidationAdvisor`.

```java
// ✅ Per-call structured output config
EntityParamSpec spec = EntityParamSpec.builder()
    .enableProviderNative(true)
    .enableSchemaValidation(true)
    .build();

client.prompt("Extract entities")
    .entity(MyClass.class, spec)
    .call();
```

### Chat Memory Improvements

- **Turn-boundary snapping in `MessageWindowChatMemory`** — eviction now advances to the nearest `USER` message instead of splitting mid-turn
- **Duplicate memory prevention** — tool-call continuation prompts no longer repeat prior messages while preserving the latest tool response
- **`timestamp` field accessible** in `JdbcChatMemoryRepository`
- **Simplified `JdbcChatMemoryRepositoryDialect`** — default methods reduce boilerplate for custom dialects

---

## API and Code Cleanup

- **Default values removed from models** — defaults now managed at the options level; unset options defer to the model provider's own defaults
- **`N()` renamed to `n()`** in options builders (Java naming convention alignment)
- **`ToolCallingAdvisor.Builder` enforced non-null** — null-defaulting moved to `DefaultChatClientBuilder`
- **JSON utilities refactored** — `SchemaGenerator` instances now guarded against concurrent access
- **Logging replaced** — SLF4J replaced with `org.apache.commons.logging.LogFactory` (aligns with Spring portfolio)
- **`ChatClientCustomizer` deprecated** — replaced by `ChatClientBuilderCustomizer`
- **OkHttp client customization** — restores Micrometer-based observability for OpenAI and Anthropic models

---

## Model Provider Updates

| Change | Details |
|--------|---------|
| Mistral AI | Removed `devstral-medium-latest`, replaced `devstral-small-latest` with `devstral-latest`, retired Pixtral Large (May 31, 2026) |
| DeepSeek | Added V4 chat model constants |
| MiniMax | Dedicated support removed; use Anthropic-compatible integration via text-anthropic API |

---

## Bug Fixes

- **Span hierarchy in streaming paths** — Micrometer Tracing parent scope fix applied to Anthropic, Bedrock Converse, DeepSeek, Google GenAI, MiniMax, Mistral AI, and Ollama
- **`OpenAiChatModel.stream()` buffering** — now only buffers tool call segments, not entire response
- **DeepSeek V4 function calling** — fixed `400 Bad Request` in request construction
- **OpenAI options merging** — fixed `customHeaders` and `timestampGranularities` merging

---

## Dependency Upgrades

- **MCP SDK upgraded to `2.0.0-RC1`** — Model Context Protocol Java SDK dependency updated

---

## Migration Checklist (RC1 Specific)

1. **Audit tool calling code** — move all tool execution from `ChatModel.call()` to `ChatClient` with `ToolCallingAdvisor`
2. **Replace `ToolCallAdvisor`** with `ToolCallingAdvisor`
3. **Remove `toolNames()` / `toolBeanDefinitionNames()` usage** — register tools as explicit `ToolCallback` beans
4. **Replace `N()` calls** with `n()` in options builders
5. **Update `ChatClientCustomizer`** to `ChatClientBuilderCustomizer`
6. **Replace SLF4J imports** with `LogFactory.getLog(getClass())`
7. **Update vector store advisor module** from `spring-ai-advisors-vector-store` to `spring-ai-vector-store-advisor`
8. **Test streaming paths** — verify tracing span hierarchy is correct
9. **Run full integration test suite** — especially JSON output diffs (Jackson 3 defaults)

---

## References

- 📰 [Spring AI 2.0.0-RC1 Available Now](https://spring.io/blog/2026/06/06/spring-ai-2-0-0-RC1-available-now) via Spring Blog
- 📋 [Release Notes: 2.0.0-RC1](https://github.com/spring-projects/spring-ai/releases/tag/v2.0.0-RC1) via GitHub
- 📖 [2.0.0-RC1 Documentation](https://docs.spring.io/spring-ai/reference/2.0/index.html)
- 🔗 Related KB: [Spring Ecosystem Roundup May 2026](Programming/Java & Spring/howto-spring-ecosystem-roundup-may-2026.md) (covers M7-M8 milestones, migration guide, model provider matrix)

---
*Created by KB enrichment on 2026-06-07*

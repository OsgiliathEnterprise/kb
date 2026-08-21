---
title: 'Spring AI 2.0 Tool Calling: A Composable, Agentic Architecture'
diataxis: Explanation
domain: Programming
topic: Java & Spring
source: Spring Blog
source_url: https://spring.io/blog/2026/06/15/spring-ai-composable-tool-calling
date: 2026-08-21
keywords:
- knowledge-base
- Java & Spring
- Programming
- explanations
---
# Spring AI 2.0 Tool Calling: A Composable, Agentic Architecture

## Overview

Spring AI 2.0 rearchitects tool calling from the ground up. In 1.x, each chat model implementation contained its own **private tool execution loop** — functional but buried, with no way to hook into it, observe intermediate steps, or compose it with other behaviors. In 2.0 the tool loop is lifted into the **advisor chain** as a first-class, composable component: `ChatClient` runs every request through an ordered chain of advisors and supports looping, letting an advisor re-enter the downstream chain. The same mechanism drives tool-call loops, structured-output retry loops, and evaluation loops alike.

A model that can discover information, take action, and loop until a goal is reached is an agent — and the composable tool loop is the essential building block for that.

## The Core Loop: `ToolCallingAdvisor`

`ToolCallingAdvisor` is a **recursive advisor**: it re-enters the downstream chain repeatedly until the model produces a response with no tool calls. `DefaultChatClient` adds it automatically — exactly one `ToolAdvisor` may exist at a time — and it owns the complete tool execution lifecycle:

- Tools are defined via `@Tool`, `@McpTool`, `java.util.Function`, or `ToolCallback`. The advisor extracts name, description, and input schema, and injects the resulting **Tool Definitions** into the initial context alongside the user's question and system prompt.
- On each iteration, the accumulated **Conversation History** (user messages, tool call requests, tool responses) is merged with the current context and sent to the LLM.
- **If the completion contains tool calls**: `ToolCallingManager` finds and executes the referenced tools, appends tool responses to the history, and loops back.
- **If it contains no tool calls**: the final answer is returned.
- Both blocking (`.call()`) and streaming (`.stream()`) modes are fully supported.

### Defining tools

```java
class WeatherTools {

    @Tool(description = "Get the current weather for a given city")
    public String getWeather(String city) {
        return weatherService.fetch(city);
    }

    @Tool(description = "Book a flight between two cities on a given date")
    public BookingConfirmation bookFlight(
            String origin,
            String destination,
            @ToolParam(description = "Date in YYYY-MM-DD format") String date) {
        return flightService.book(origin, destination, date);
    }
}
```

`Spring AI` generates JSON schemas for parameters automatically. `@ToolParam` adds per-parameter descriptions and required hints; `@Nullable` parameters are optional by default. Tools are passed explicitly:

```java
String response = ChatClient.create(chatModel)
    .prompt("What's the weather in Amsterdam? Book a flight from London if it's sunny.")
    .tools(new WeatherTools())
    .call()
    .content();
```

## Advisor Ordering: The Single Composition Dial

Where an advisor sits relative to `ToolCallingAdvisor` (default order `HIGHEST_PRECEDENCE + 300`) determines whether it sees **only the final result** (outside the loop) or **every iteration** (inside the loop). The same dial governs memory, observability, and retries.

### Memory and the tool loop

- **Outside the loop** (default — `HIGHEST_PRECEDENCE + 200`): `MessageChatMemoryAdvisor` loads history once before the loop starts and persists only the final user/assistant messages. Tool request/response messages are *not* written. Safe for every `ChatMemoryRepository` implementation; matches 1.x behavior.
- **Inside the loop** (order greater than `ToolCallingAdvisor.DEFAULT_ORDER`): the memory advisor fires on every iteration and persists the full tool request/response transcript — the LLM can then reason about what was already tried and what tools returned.

When a memory advisor sits inside the loop, `ToolCallingAdvisor`'s internal conversation history must be disabled to avoid duplicate writes. With the auto-registered advisor this is **automatic** (`DefaultChatClient` detects an in-loop `MemoryAdvisor` and disables internal history). If you construct the advisor manually, call `.disableInternalConversationHistory()` on the builder yourself.

Not every repository can persist tool messages — it must know how to serialize `ToolResponseMessage` and tool call requests. As of 2.0 the built-in repositories that support the full message set are `InMemoryChatMemoryRepository`, `RedisChatMemoryRepository`, and `Neo4jChatMemoryRepository`. For JDBC-backed persistence with full tool-message support, event-sourced history, and multi-agent branch isolation, use the community **Spring-AI-Session** project (planned for Spring AI 2.1).

## Scaling to Hundreds of Tools: `ToolSearchToolCallingAdvisor`

The standard advisor sends **all** tool definitions to the model on every request. Fine for a small toolset; at 30+ tools — or multi-server MCP setups aggregating hundreds of definitions — it creates context bloat, accuracy degradation, and token cost.

`ToolSearchToolCallingAdvisor` is a drop-in replacement implementing **progressive tool disclosure**: at session start it indexes the full tool set, then exposes only a built-in `toolSearchTool` that the model uses to retrieve relevant tools by natural-language query. Only discovered tools are included in subsequent requests.

```properties
spring.ai.chat.client.tool-search-advisor.enabled=true
spring.ai.chat.client.tool-search-advisor.tool-index-type=vector  # regex (default), lucene, or vector
```

The tool index is scoped per session, so the caller must supply a **session ID** with every request (default: `ChatMemory.CONVERSATION_ID`):

```java
chatClient.prompt()
    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, "user-42-session"))
    .user("Help me plan my trip to Amsterdam")
    .call()
    .content();
```

Three `ToolIndex` strategies: `regex` (default, no dependencies), `lucene` (keyword search, bundled), `vector` (semantic search, requires a `VectorStore` bean). The underlying pattern was benchmarked in the December 2025 follow-up showing **34–64% token reduction** across OpenAI, Anthropic, and Gemini models, and the advisor graduated from community into core Spring AI 2.0.

## MCP Tools: Bidirectional Integration

MCP (Model Context Protocol) integrates with the tool-calling architecture in both directions.

### Consuming remote MCP server tools

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-client</artifactId>
</dependency>
```

```properties
spring.ai.mcp.client.stdio.connections.my-server.command=npx
spring.ai.mcp.client.stdio.connections.my-server.args=-y,@modelcontextprotocol/server-everything
```

Auto-configuration discovers tools from all configured servers and exposes them as a `SyncMcpToolCallbackProvider` bean (or `AsyncMcpToolCallbackProvider`). MCP providers are **deliberately not auto-registered** with `ChatClient` — eager tool listing would force a network round-trip to every MCP server at startup. Wire it explicitly:

```java
@Autowired SyncMcpToolCallbackProvider mcpTools;

ChatClient chatClient = ChatClient.builder(chatModel)
    .defaultTools(mcpTools)
    .build();

// or per call
chatClient.prompt()
    .user("Search the web for the latest Spring AI release notes")
    .tools(mcpTools)
    .call()
    .content();
```

Tool callback auto-configuration can be disabled with `spring.ai.mcp.client.toolcallback.enabled=false`. Across multiple servers, `DefaultMcpToolNamePrefixGenerator` prefixes same-name tools to avoid conflicts.

### Exposing Spring beans as MCP tools

Replace `@Tool` with `@McpTool` and add the server starter:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server-webmvc</artifactId>
</dependency>
```

```java
@Component
public class WeatherTools {

    @McpTool(description = "Get the current weather for a given city")
    public String getWeather(
            @McpToolParam(description = "City name") String city) {
        return weatherService.fetch(city);
    }
}
```

Auto-configuration scans `@McpTool`-annotated beans, generates JSON schemas for their parameters, and registers them with the MCP server — no additional wiring.

### Mixing local and MCP tools

Local `@Tool` methods and remote MCP tools share the same `ToolCallback` interface — the model and `ToolCallingAdvisor` don't distinguish between them:

```java
chatClient.prompt()
    .tools(new LocalTools(), mcpTools)
    .call()
    .content();
```

Pitfalls for hybrid setups:

- **Name conflicts are only handled within the MCP side.** The prefix generator doesn't know about local `@Tool` methods; rename one side yourself or drop the remote tool via `McpToolFilter`.
- **Restrict what's exposed.** `McpToolFilter` lets you select which tools enter the namespace based on server identity, tool name, or description — useful for limiting the blast radius of a chatty or untrusted MCP server.

## Tool Argument Augmentation: Inner Thinking

Spring AI can dynamically extend a tool's input schema with additional arguments — without touching the tool implementation. The model sees the augmented schema and fills the extra fields; your code receives them via a consumer; the original tool receives only its own arguments, unchanged. The primary use case is **inner thinking** — forcing the model to articulate its reasoning before executing a tool, improving traceability and feeding long-term memory or evaluation.

```java
public record AgentThinking(
    @ToolParam(description = "Your reasoning for calling this tool")
    String innerThought) {}

AugmentedToolCallbackProvider<AgentThinking> toolProvider =
    AugmentedToolCallbackProvider.<AgentThinking>builder()
        .toolObject(new WeatherTools())            // wrap the original tools
        .argumentType(AgentThinking.class)         // augmentation schema type
        .argumentConsumer(event -> log.info(
            "Tool: {} | Reasoning: {}", event.toolDefinition().name(),
            event.arguments().innerThought()))
        .build();

ChatClient chatClient = ChatClient.builder(chatModel)
    .defaultTools(toolProvider)
    .build();
```

## Extending the Loop: Custom `ToolAdvisor`s

`ToolAdvisor` is a marker interface: any custom tool call advisor must implement it so `DefaultChatClient` recognizes it, enforces the single-advisor constraint, and registers it in place of the default `ToolCallingAdvisor`.

`ToolSearchToolCallingAdvisor` is a subclass of `ToolCallingAdvisor` that overrides protected hook methods to intercept the loop at well-defined points:

| Hook | When it fires |
| --- | --- |
| `doInitializeLoop` / `doInitializeLoopStream` | Once, before the first iteration |
| `doBeforeCall` / `doBeforeStream` | Before each iteration |
| `doAfterCall` / `doAfterStream` | After each iteration |
| `doFinalizeLoop` / `doFinalizeLoopStream` | Once, after the loop ends |

Custom advisors plug into auto-configuration via a `ToolCallingAdvisor.Builder&lt;?>` bean registered **before** `ChatClientAutoConfiguration`:

```java
@AutoConfiguration(beforeName = "org.springframework.ai.model.chat.client.autoconfigure.ChatClientAutoConfiguration")
@ConditionalOnProperty(prefix = "my.advisor", name = "enabled", havingValue = "true")
public class MyToolAdvisorAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    ToolCallingAdvisor.Builder<?> toolCallingAdvisorBuilder(ToolCallingManager toolCallingManager) {
        return MyCustomToolCallingAdvisor.builder()
            .toolCallingManager(toolCallingManager);
    }
}
```

## User-Controlled Tool Execution

For scenarios that need per-iteration control — approval gates, SSE/WebSocket progress forwarding, conditional logic between turns, side-channel stopping — opt out per call with `AdvisorParams.toolCallingAdvisorAutoRegister(false)` and drive the loop yourself:

```java
ToolCallingManager toolCallingManager = ToolCallingManager.builder().build();
ToolCallback[] tools = ToolCallbacks.from(new WeatherTools());
ChatOptions chatOptions = ToolCallingChatOptions.builder().toolCallbacks(tools).build();

ChatClientResponse response = chatClient.prompt()
    .user(question)
    .options(chatOptions)
    .advisors(AdvisorParams.toolCallingAdvisorAutoRegister(false))
    .call()
    .chatClientResponse();

Prompt prompt = new Prompt(List.of(new UserMessage(question)), chatOptions);

while (response.chatResponse() != null && response.chatResponse().hasToolCalls()) {
    ToolExecutionResult result = toolCallingManager.executeToolCalls(prompt, response.chatResponse());
    prompt = new Prompt(result.conversationHistory(), chatOptions);
    response = chatClient.prompt()
        .messages(result.conversationHistory())
        .options(chatOptions)
        .advisors(AdvisorParams.toolCallingAdvisorAutoRegister(false))
        .call()
        .chatClientResponse();
}
```

Each iteration is observable and interruptible; the streaming variant forwards each chunk `Flux` while aggregating with `ChatClientMessageAggregator`.

## Upgrading from Spring AI 1.x

Breaking changes to watch during migration:

| Change | 1.x | 2.0 |
| --- | --- | --- |
| Function tools | bare `Function`/`Supplier`/`Consumer` beans + `toolNames()` | explicit `ToolCallback` beans via `FunctionToolCallback.builder(...)` |
| Internal execution | `.internalToolExecutionEnabled(false)` | removed; use `AdvisorParams.toolCallingAdvisorAutoRegister(false)` |
| Advisor name | `ToolCallAdvisor` | `ToolCallingAdvisor` (deprecated subclass retained for compat) |
| Streaming tool responses | `.streamToolCallResponses(...)` | removed (was half-broken: passed requests but not responses downstream); place your advisor **inside** the loop instead |
| Options mutability | `ChatOptions#copy()`, `[*]Options#fromOptions()` | removed; use `.mutate()` |

```java
// Before (1.x) — bare Function bean resolved by name
@Bean
@Description("Get the weather in location")
Function<WeatherRequest, WeatherResponse> currentWeather() {
    return weatherService::getWeather;
}
chatClient.prompt().toolNames("currentWeather"); // no longer exists

// After (2.0) — explicit ToolCallback bean
@Bean
ToolCallback currentWeather() {
    return FunctionToolCallback.builder("currentWeather", weatherService::getWeather)
        .description("Get the weather in location")
        .inputType(WeatherRequest.class)
        .build();
}
```

## Architecture Diagram (Excalidraw)

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "user",
      "type": "rectangle",
      "x": 40, "y": 40,
      "width": 150, "height": 50,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "User Request", "fontSize": 16, "fontFamily": 1 }
    },
    {
      "id": "advisor-chain",
      "type": "rectangle",
      "x": 320, "y": 40,
      "width": 420, "height": 260,
      "strokeColor": "#e52727",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 3,
      "strokeDashArray": "8,4",
      "roundness": { "type": 3 },
      "text": { "content": "Advisor Chain (ordered)", "fontSize": 16, "fontFamily": 1 }
    },
    {
      "id": "memory-outside",
      "type": "rectangle",
      "x": 345, "y": 80,
      "width": 170, "height": 50,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Memory Advisor\n(outside loop, default)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "tool-advisor",
      "type": "rectangle",
      "x": 545, "y": 80,
      "width": 170, "height": 50,
      "strokeColor": "#e52727",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 3,
      "text": { "content": "ToolCallingAdvisor\n(order HIGHEST+300)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "loop-body",
      "type": "rectangle",
      "x": 345, "y": 160,
      "width": 370, "height": 120,
      "strokeColor": "#bf8401",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Loop: LLM -> has tool calls?\n  yes: ToolCallingManager executes tools\n       append responses -> re-enter chain\n  no: return final answer",
        "fontSize": 14, "fontFamily": 1
      }
    },
    {
      "id": "in-loop-note",
      "type": "rectangle",
      "x": 345, "y": 300,
      "width": 370, "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d0b0ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "In-loop advisors (order > DEFAULT_ORDER)\nsee every iteration + full tool transcript",
        "fontSize": 14, "fontFamily": 1
      }
    },
    {
      "id": "arrow-user-chain",
      "type": "arrow",
      "x": 190, "y": 65,
      "width": 130, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [130, 0]]
    },
    {
      "id": "arrow-memory-loop",
      "type": "arrow",
      "x": 430, "y": 130,
      "width": 0, "height": 30,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 30]]
    },
    {
      "id": "arrow-loop-advisor",
      "type": "arrow",
      "x": 710, "y": 130,
      "width": 0, "height": 30,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 30]]
    },
    {
      "id": "reentry",
      "type": "arrow",
      "x": 530, "y": 160,
      "width": 0, "height": 30,
      "strokeColor": "#e52727",
      "strokeWidth": 2,
      "strokeDashArray": "4,4",
      "startArrowhead": "arrow",
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, -30]]
    }
  ]
}
```

## Key Takeaways

1. **One mechanism composes everything**: advisor ordering decides whether you observe the final result or every iteration — the same dial for memory, observability, retries, and custom advisors.
2. **The tool loop is now an extension point**, not an implementation detail: subclass `ToolCallingAdvisor`, override the `doInitializeLoop`/`doBeforeCall`/`doAfterCall`/`doFinalizeLoop` hooks, and register a `ToolCallingAdvisor.Builder&lt;?>` bean.
3. **Scale with progressive disclosure**: swap in `ToolSearchToolCallingAdvisor` once the tool set grows past ~30 tools (34–64% token reduction measured in the predecessor benchmark).
4. **MCP is bidirectional and opt-in**: consume remote tools via `SyncMcpToolCallbackProvider`, expose local beans via `@McpTool`; local and remote tools are heterogeneous and interchangeable in `.tools(...)`.
5. **1.x → 2.0 is a real migration**: explicit `ToolCallback` beans replace name-resolved function beans, `internalToolExecutionEnabled` is gone, and options are immutable (`.mutate()` only).

## References

- [Tool Calling in Spring AI 2.0: A Composable, Agentic Architecture (Spring Blog)](https://spring.io/blog/2026/06/15/spring-ai-composable-tool-calling)
- [Spring AI Tools API Reference](https://docs.spring.io/spring-ai/reference/api/tools.html)
- [Spring AI Recursive Advisors Reference](https://docs.spring.io/spring-ai/reference/api/advisors-recursive.html)
- [Spring AI 2.0 Upgrade Notes](https://docs.spring.io/spring-ai/reference/upgrade-notes.html#upgrading-to-2-0-0)
- [FunctionCallback to ToolCallback Migration Guide](https://docs.spring.io/spring-ai/reference/api/tools-migration.html)
- [Smart Tool Selection: 34–64% Token Savings with Dynamic Tool Discovery](https://spring.io/blog/2025/12/11/spring-ai-tool-search-tools-tzolov)
- [Spring AI MCP Client Boot Starter Reference](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-client-boot-starter-docs.html)
- [Spring AI MCP Server Boot Starter Reference](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-server-boot-starter-docs.html)
- [spring-ai-session: Structured Conversation Memory](https://spring-ai-community.github.io/spring-ai-session/latest/)

---
title: 'Spring AI 2.0: Composable, Agentic Tool Calling via the Advisor Chain'
diataxis: Explanation
domain: programming
topic: java
source: Spring Blog
source_url: https://spring.io/blog/2026-06-15/spring-ai-composable-tool-calling
date: 2026-09-08
keywords:
- knowledge-base
- java
- programming
- explanations
---
# Spring AI 2.0: Composable, Agentic Tool Calling via the Advisor Chain

In Spring AI 1.x each chat-model implementation carried its **own private tool-execution loop** — functional but buried, with no way to hook in, observe intermediate steps, or compose it with other behaviors. **Spring AI 2.0 lifts the tool loop into the advisor chain as a first-class, composable component.** `ChatClient` runs every request through an ordered chain of advisors and supports *looping* — an advisor can re-enter the downstream chain — and the same mechanism drives tool-call loops, structured-output retry loops, and evaluation loops alike.

The single architectural dial that governs everything is **advisor ordering**: where an advisor sits relative to the tool loop — *outside* (safe default) or *inside* (every iteration) — controls memory, observability, retries, and any custom advisor.

## Defining tools

The simplest definition is the `@Tool` annotation on any method:

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

Spring AI generates the JSON schema for input parameters automatically. `@ToolParam` adds per-parameter descriptions and optional/required hints, and parameters annotated `@Nullable` are treated as optional by default. Tools are passed explicitly to `ChatClient` via `.tools()`:

```java
String response = ChatClient.create(chatModel)
    .prompt("What's the weather in Amsterdam? Book a flight from London if it's sunny.")
    .tools(new WeatherTools())
    .call()
    .content();
```

Tools can also come from `@McpTool`, `java.util.Function`, or `ToolCallback`, plus the programmatic `MethodToolCallback` / `FunctionToolCallback` APIs. The advisor extracts each tool's name, description, and input schema and injects the resulting **Tool Definitions** into the initial context alongside the user's question and system prompt.

## The tool-calling loop: `ToolCallingAdvisor`

`ToolCallingAdvisor` is a **recursive advisor** — an advisor that re-enters the downstream chain repeatedly until a stop condition is met (here, the model produces a response with no tool calls). `DefaultChatClient` auto-registers exactly one (`ToolAdvisor` is a marker interface that enforces the single-tool-advisor invariant, preventing double-execution bugs). From that point it owns the complete tool-execution lifecycle:

```java
var toolCallingAdvisor = ToolCallingAdvisor.builder()
    .toolCallingManager(toolCallingManager)
    .advisorOrder(BaseAdvisor.HIGHEST_PRECEDENCE + 300)   // DEFAULT_ORDER
    .build();

var chatClient = ChatClient.builder(chatModel)
    .defaultAdvisors(toolCallingAdvisor)
    .build();
```

On each iteration the accumulated **conversation history** (user messages, AI tool-call requests, and tool responses from prior rounds) is merged with the current context and sent to the LLM. The LLM produces a completion that the advisor inspects:

- **Contains tool calls** → `ToolCallingManager` finds and executes the referenced tools, appends the tool responses to the history, and loops back.
- **No tool calls** → the final answer is returned to the user.

Both blocking (`.call()`) and streaming (`.stream()`) modes are fully supported. Where an advisor sits relative to `ToolCallingAdvisor` (default order `HIGHEST_PRECEDENCE + 300`) determines whether it sees only the final result (*outside*) or every iteration (*inside*). The loop's continue-condition is a pluggable `ToolExecutionEligibilityChecker` predicate (default: `chatResponse.hasToolCalls()`), which you can override to apply provider-specific stop-reason logic. A tool whose `ToolMetadata` sets `returnDirect = true` breaks the loop immediately and returns its output to the client without another LLM round-trip.

## Memory and the tool loop

Where you place `MessageChatMemoryAdvisor` relative to `ToolCallingAdvisor` determines how much conversation context the memory store captures.

**Outside the loop** (default — order `HIGHEST_PRECEDENCE + 200`): the memory advisor loads history once before the loop starts and persists *only the final* user and assistant messages. Tool request/response messages are **not** written to the store. This is safe for every `ChatMemoryRepository` implementation and matches 1.x, where the tool loop ran inside the chat model and memory could not observe tool messages.

**Inside the loop** (order greater than `ToolCallingAdvisor.DEFAULT_ORDER`): the memory advisor is invoked on every iteration and persists the full tool request/response transcript — the LLM gets richer context on subsequent turns (what was already tried, which tools ran, what they returned). To avoid duplicate writes, the `ToolCallingAdvisor`'s internal conversation history must be disabled when a memory advisor sits inside the loop. With the auto-registered advisor this is **automatic** (`DefaultChatClient` detects any in-loop `MemoryAdvisor` and disables internal history); if you construct the advisor manually, call `.disableInternalConversationHistory()` on the builder yourself.

Not every repository can persist tool messages — it must know how to serialize `ToolResponseMessage` alongside ordinary turns. As of 2.0 the built-in repositories supporting the full message set are `InMemoryChatMemoryRepository`, `RedisChatMemoryRepository`, and `Neo4jChatMemoryRepository`. For JDBC-backed persistence with tool messages, event-sourced history, turn-aware compaction, and multi-agent branch isolation, use the community **Spring-AI-Session** project (planned for inclusion in Spring AI 2.1).

## Scaling to hundreds of tools: `ToolSearchToolCallingAdvisor`

The standard `ToolCallingAdvisor` sends **all** registered tool definitions on every request. At 30+ tools — or multi-server MCP setups aggregating hundreds — that causes context bloat, accuracy degradation, and wasted tokens. `ToolSearchToolCallingAdvisor` is a drop-in replacement implementing **progressive tool disclosure**: it indexes the full tool set at session start, then injects only a built-in `toolSearchTool` that the model uses to retrieve relevant tools by natural-language query. Only discovered tools are included in subsequent requests.

```properties
spring.ai.chat.client.tool-search-advisor.enabled=true
spring.ai.chat.client.tool-search-advisor.tool-index-type=vector   # regex (default) | lucene | vector
```

Because the tool index is scoped per session, you must supply a **session ID** with every request (used to isolate indexes between conversations/tenants). By default it is read from `ChatMemory.CONVERSATION_ID`:

```java
chatClient.prompt()
    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, "user-42-session"))
    .user("Help me plan my trip to Amsterdam")
    .call()
    .content();
```

Three `ToolIndex` strategies exist: `regex` (lightweight, no extra deps, default), `lucene` (keyword search, bundled in the starter), and `vector` (embedding-based semantic search, requires a `VectorStore` bean). The advisor graduated from the community into core Spring AI 2.0; a December 2025 benchmark showed **34–64% token reduction** across OpenAI, Anthropic, and Gemini models.

## Tool argument augmentation

Spring AI lets you dynamically extend a tool's input schema with extra arguments **without touching the tool implementation**. The model sees the augmented schema and fills in the extra fields; your code receives them via a consumer; the original tool receives only its own arguments, unchanged. The primary use case is **inner thinking** — forcing the model to articulate its reasoning before executing a tool, improving traceability and enabling storage in long-term memory or evaluation:

```java
public record AgentThinking(
    @ToolParam(description = "Your reasoning for calling this tool")
    String innerThought) {}

AugmentedToolCallbackProvider<AgentThinking> toolProvider =
    AugmentedToolCallbackProvider.<AgentThinking>builder()
        .toolObject(new WeatherTools())               // wrap the original tools
        .argumentType(AgentThinking.class)            // augmentation schema type
        .argumentConsumer(event -> log.info(          // optional consumer
            "Tool: {} | Reasoning: {}",
            event.toolDefinition().name(), event.arguments().innerThought()))
        .build();

ChatClient chatClient = ChatClient.builder(chatModel)
    .defaultTools(toolProvider)
    .build();
```

## MCP tools

MCP (Model Context Protocol) integrates with the tool-calling architecture in **both** directions: your application can consume tools exposed by remote MCP servers, and it can expose its own Spring-managed tools to MCP clients.

## Extending the loop: building your own `ToolAdvisor`

`ToolCallingAdvisor` exposes **protected hook methods** at well-defined points in the loop; subclasses override them to customize behavior without re-implementing the loop. There are two parallel families (a *call* path and a *stream* reactive path); a custom subclass should override the relevant pair for both modes. `ToolSearchToolCallingAdvisor` is exactly such a subclass (it overrides `doInitializeLoop`/`doInitializeLoopStream` to index the tool set and `doBeforeCall`/`doBeforeStream` to inject only discovered tools).

Custom `ToolCallingAdvisor` implementations plug into the auto-configuration via a `ToolCallingAdvisor.Builder` bean: `ChatClientAutoConfiguration` declares a default `ToolCallingAdvisor.Builder` guarded by `@ConditionalOnMissingBean`, so registering your own (typed as the base `ToolCallingAdvisor.Builder`) in an auto-configuration that runs earlier replaces the default.

To observe every tool request/response without re-implementing the loop, place an advisor *inside* the loop (order > `DEFAULT_ORDER`, e.g. `HIGHEST_PRECEDENCE + 400`):

```java
public class ToolCallObservingAdvisor implements CallAdvisor, StreamAdvisor {
    private final Consumer<ChatClientResponse> observer;

    public ToolCallObservingAdvisor(Consumer<ChatClientResponse> observer) {
        this.observer = observer;
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 400;   // inside ToolCallingAdvisor (300)
    }

    @Override
    public ChatClientResponse adviseCall(ChatClientRequest req, CallAdvisorChain chain) {
        req.prompt().getInstructions().forEach(m -> log.debug("Message: {}", m));
        return chain.nextCall(req);
    }

    @Override
    public Flux<ChatClientResponse> adviseStream(ChatClientRequest req, StreamAdvisorChain chain) {
        return chain.nextStream(req).doOnNext(observer);   // forward to SSE / log / metrics
    }
}

var chatClient = ChatClient.builder(chatModel)
    .defaultAdvisors(new ToolCallObservingAdvisor(chunk -> forwardToSse(chunk)))
    .build();
```

## User-controlled tool execution

For scenarios that genuinely need you to own each iteration — gating tool execution on an external approval step, forwarding intermediate progress to an SSE/WebSocket endpoint, applying conditional logic between turns, or stopping on a side-channel signal — set `AdvisorParams.toolCallingAdvisorAutoRegister(false)` on the request. You then become responsible for detecting tool calls in the `ChatResponse` and executing them via `ToolCallingManager`.

## Migration notes

- `ToolCallAdvisor` was **renamed to `ToolCallingAdvisor`** — update any direct references.
- The old `.includeTools(...)` option is gone; observe every tool request/response by placing an in-loop advisor, or fall back to user-controlled execution.

## Why this matters

The 2.0 design is deliberately incremental: start with a single `@Tool` annotation, add memory and observability as the application matures, plug in MCP tools when crossing service boundaries, swap the default loop for `ToolSearchToolCallingAdvisor` when the tool set grows, and extend the loop itself when the domain demands it. All of it composes through one mechanism — **advisor ordering**.

## References

- [Tool Calling in Spring AI 2.0: A Composable, Agentic Architecture (Christian Tzolov, Spring Blog)](https://spring.io/blog/2026-06-15/spring-ai-composable-tool-calling)
- [ToolCallingAdvisor — Spring AI Reference](https://docs.spring.io/spring-ai/reference/api/tools/tool-calling-advisor.html)
- [Recursive Advisors — Spring AI Reference](https://docs.spring.io/spring-ai/reference/api/advisors-recursive.html)
- [Advisors API — Spring AI Reference](https://docs.spring.io/spring-ai/reference/api/advisors.html)
- [Spring-AI-Session community project](https://spring-ai-community.github.io/spring-ai-session/latest/)

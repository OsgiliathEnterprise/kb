---
title: 'Spring Ecosystem Roundup: May 2026 — AI Integration, Upgrades & OSS Security'
diataxis: How-to Guide
domain: Programming
topic: Java & Spring
source: Spring Blog
source_url: https://spring.io/blog/2026/05/12/this-week-in-spring-may-12-2026
date: 2026-05-17
keywords:
- knowledge-base
- Java & Spring
- Programming
- how-to
---
# Spring Ecosystem Roundup: May 2026 — AI Integration, Upgrades & OSS Security

## Summary
Combined roundup of Spring Framework developments for mid-May 2026, covering Spring AI integration and capabilities (now at 2.0.0-M7, final milestone before GA on May 28), Spring Boot 4.1 preview features, release train schedule changes, and open-source software (OSS) security management in enterprise environments. Merged from "This Week in Spring" (May 12 & 19), "Spring Office Hours Podcast S5E15 & S5E16", and Spring AI 2.0.0-M7 milestone release notes.

**Key Update (May 27):** Spring AI 2.0.0-M8 released — final milestone before GA. Dash-separated property convention, ChatOptions#mutate type-specific returns, Jackson YAML exclusion fix, MistralAiApi mapping improvements. Bug fixes: Google GenAI dependency issue, PGVector without JDBC, API key requirement breaking cookie auth. GA expected May 28, 2026. Spring Boot 3.x EOL June 30, 2026.

## Topic 1: Spring AI Integration & Capabilities

### Version Status (May 2026)
- **Spring AI 1.0.8** — Latest stable patch release
- **Spring AI 1.1.7** — Latest feature release
- **Spring AI 2.0.0-M8** — Final milestone before GA (May 28, 2026)

### Key Points
- Spring AI continues expanding provider support and integration capabilities
- ChatClient, Embedding, Tools/Function Calling, RAG, Structured Outputs, and Observability all available
- Provider comparison: Anthropic, OpenAI, Azure, Google, Amazon Bedrock, Ollama
- Spring AI team led by Adib Saikali (featured in "A Bootiful Podcast" May 14)
- **M7 Highlights:** ToolSpec fluent API (declarative tool definitions), updated Gemini integration, dependency cleanup (CosmosDB removed), full Spring Boot 4 compatibility
- **M8 Highlights (May 27):** Dash-separated Spring Boot property convention, ChatOptions#mutate type-specific returns, Jackson YAML exclusion from json-schema-validator, improved MistralAiApi Jackson mapping. Bug fixes: Google GenAI dependency issue, PGVector without JDBC support, API key requirement breaking cookie/session auth, transitive auto-config dependency regression

### ToolSpec Fluent API (NEW in 2.0)
A declarative API for defining AI tool specifications — cleaner separation of concerns, type-safe contracts:
```java
ToolSpec weatherTool = ToolSpec.builder("getWeather")
    .description("Get current weather for a location")
    .inputType(WeatherRequest.class)
    .outputType(WeatherResponse.class)
    .build();
```

### Supported Model Providers (2.0)
| Provider | Chat | Vision | Embedding | Audio |
|----------|------|--------|-----------|-------|
| OpenAI | ✅ | ✅ | ✅ | ✅ |
| Anthropic (Claude) | ✅ | ✅ | ❌ | ❌ |
| Google Gemini | ✅ | ✅ | ✅ | ✅ |
| Ollama (local) | ✅ | ✅ | ✅ | ❌ |
| Azure OpenAI | ✅ | ✅ | ✅ | ✅ |

### Migration Guide: Spring AI 1.x → 2.0

**⚠️ Critical: Two-Step Migration Required**
Spring AI 2.0 requires Spring Boot 4.0 (hard dependency). You cannot skip directly from 3.x to 4.0 — the upgrade path is:
1. **Step 1:** Migrate to Spring Boot 3.5 first → surface and fix all deprecation warnings
2. **Step 2:** Jump to Spring Boot 4.0 + Spring AI 2.0

Skipping the intermediate step usually means being surprised by removed APIs at compile time.

**Hard Dependencies for 2.0:**
- Spring Boot 4.0 (not 3.x)
- Spring Framework 7
- Java 17 minimum (21 recommended)
- Jackson 3 (replaces Jackson 2)

#### Jackson 3 Migration — Highest-Risk Change
Jackson 3 moves packages from `com.fasterxml.jackson` to `tools.jackson`. The rename fails at compile time (easy to fix), but the invisible changes are dangerous:
- **Date serialization defaults changed** — Unix timestamps may break downstream clients
- **Property ordering defaults changed** — JSON output shape changes silently
- **Action:** Run full integration test suite before AND after Jackson upgrade, diff JSON output explicitly

#### Setters Removed — Builder Pattern Required
Every model provider options class (OpenAI, Anthropic, Bedrock, Mistral, Ollama, etc.) dropped setter methods. This is a compile-time break:
```java
// ❌ Broken in Spring AI 2.0
var options = new OpenAiChatOptions();
options.setTemperature(0.7);
options.setModel("gpt-4o");

// ✅ Correct — builder pattern required
var options = OpenAiChatOptions.builder()
    .model("gpt-4o")
    .temperature(0.7)
    .build();
```
**Action:** Global search for `.setTemperature`, `.setModel`, `.setMaxTokens` across your codebase.

#### Full Migration Checklist
1. Update dependencies (`spring-ai-bom: 2.0.0`, `spring-boot: 4.0.x`)
2. Migrate to Spring Boot 3.5 first, fix all deprecations
3. Replace CosmosDB vector store → Redis or PGVector
4. Update tool definitions → migrate from `FunctionCallback` to `ToolSpec`
5. Replace all Jackson 2 imports (`com.fasterxml.jackson` → `tools.jackson`)
6. Replace all setter calls with builder pattern
7. Update model configuration → new application properties for 2.0
8. Run integration tests, diff JSON output for Jackson 3 date/ordering changes
9. Test streaming responses → verify Observable/Flux integration

**⏰ Deadline:** Spring Boot 3.5 and Spring Framework 6.2 both reach end-of-life June 30, 2026 — exactly 33 days after Spring AI 2.0 GA (May 28). After June 30, neither version receives security patches or CVE fixes. Teams that want Spring AI 2.0 and long-term support do not have the luxury of a leisurely migration.

### Practical Setup
1. **[Spring AI Reference Docs](https://docs.spring.io/spring-ai/reference/index.html)** — Full API reference: ChatClient, Embedding, Tools/Function Calling, RAG, Structured Outputs, Observability
2. **[Spring AI — Getting Started](https://docs.spring.io/spring-ai/reference/getting-started.html)** — Quickstart with OpenAI, Ollama, Anthropic providers; dependency setup and first chat completion
3. **[Spring AI Model Providers](https://docs.spring.io/spring-ai/reference/api/model-configuration.html)** — Provider comparison matrix: Anthropic, OpenAI, Azure, Google, Amazon Bedrock, Ollama — connection setup and model-specific features

## Topic 2: Spring Boot 4.1 Preview & Release Train Shift

### Release Train Change (May 19, 2026)
- **May release train shifted** from May 11-22 to **June 1-5, 2026**
- Impact: All Spring portfolio upgrades (Boot, Cloud, AI, Data) delayed by ~2 weeks
- Planning: Adjust upgrade timelines accordingly

### Spring Boot 4.1 Preview Features
1. **Spring gRPC Support** — Native gRPC integration in Spring Boot
2. **Log4j File Rotation** — Improved log management strategies
3. **OpenTelemetry Enhancements** — Better observability and tracing
4. **OAuth2 Resource Server Improvements** — Enhanced security features
5. **MongoDB Support for Spring Batch** — New data store integration
6. **AMQP 1.0** — Advanced messaging protocol support

### Practical Setup
1. **[Spring Boot 4.1 Release Notes (Wiki)](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.1-Release-Notes)** — Milestone release notes and feature tracking
2. **[Spring Boot Upgrade Guide (Official)](https://docs.spring.io/spring-boot/docs/current/reference/html/#upgrading-from-a-previous-spring-boot-release)** — Step-by-step migration paths with `spring-boot-properties-migrator` dependency for runtime property migration
3. **[Spring Boot Wiki — Migration Guides](https://github.com/spring-projects/spring-boot/wiki)** — Detailed per-version migration notes, breaking changes, and upgrade checklists
4. **[Spring Boot How-to Guides](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html)** — Targeted recipes for dependency management, BOM usage, and security scanning integration (Dependabot, Snyk, OWASP Dependency-Check)

## Topic 3: OSS Security & Community Tools

### Key Points
- Managing OSS security vulnerabilities in dependencies
- Practical approaches to dependency updates and security scanning
- Security best practices for Spring-based applications
- Spring Cloud Function and Config released CVE fixes (April 2026)

### Community Tools
- **[spring-api-sunset](https://github.com/Atlancia-Labs/spring-api-sunset)** — Spring Boot starter for emitting API sunset timelines
- **[spring-idempotency-kit](https://github.com/Atlancia-Labs/spring-idempotency-kit)** — Supports idempotent API operations
- **[Paketo Buildpack](https://blog.paketo.io/posts/spring-boot-performance/)** — Performance improvements in Spring Boot buildpacks

## Topic 4: Spring AI 2.0.0-RC1 — Breaking Changes and New Features

### Release Position (June 10, 2026)
- **RC1 released:** June 6, 2026 — GA expected shortly
- **Spring Boot 3.x EOL:** June 30, 2026 — hard migration deadline
- **Hard dependencies:** Spring Boot 4.0, Spring Framework 7, Java 17+ (21 recommended), Jackson 3

### Breaking Changes: Tool Calling Overhaul

**Tool execution removed from `ChatModel`** — all tool calling must now flow through `ChatClient` with `ToolCallingAdvisor`:
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
- `toolNames()` / `toolBeanDefinitionNames()` — removed from ChatOptions and related classes
- `ToolSpec` consumer API — removed from `ChatClient.tools()`
- `SpringBeanToolCallbackResolver` — removed; tools must be explicit `ToolCallback` beans

**Renamed:** `ToolCallAdvisor` → `ToolCallingAdvisor` (deprecated subclass retained for backward compatibility)

### New Features in RC1

1. **Tool Search Advisor** — `ToolSearchToolCallingAdvisor` with three `ToolIndex` implementations (vector store, Lucene, regex) enables on-demand tool discovery
2. **EntityParamSpec** — `ChatClient.entity()` accepts per-call structured output config (`enableProviderNative`, `enableSchemaValidation`)
3. **Chat Memory improvements** — turn-boundary snapping, duplicate prevention, timestamp field in JdbcChatMemoryRepository
4. **Simplified streaming aggregation** — `ChatClientMessageAggregator` as static field

### Model Provider Updates (RC1)

| Change | Details |
|--------|---------|
| Mistral AI | Removed `devstral-medium-latest`, replaced `devstral-small-latest` with `devstral-latest`, retired Pixtral Large |
| DeepSeek | Added V4 chat model constants |
| MiniMax | Dedicated support removed; use Anthropic-compatible integration |

### Bug Fixes
- Span hierarchy in streaming paths — Micrometer Tracing parent scope fix
- `OpenAiChatModel.stream()` buffering — now only buffers tool call segments
- DeepSeek V4 function calling — fixed 400 Bad Request
- OpenAI options merging — fixed customHeaders and timestampGranularities

### RC1-Specific Migration Checklist
1. **Audit tool calling code** — move all tool execution from `ChatModel.call()` to `ChatClient` with `ToolCallingAdvisor`
2. **Replace `ToolCallAdvisor`** with `ToolCallingAdvisor`
3. **Remove `toolNames()` / `toolBeanDefinitionNames()` usage** — register tools as explicit `ToolCallback` beans
4. **Replace `N()` calls** with `n()` in options builders
5. **Update `ChatClientCustomizer`** to `ChatClientBuilderCustomizer`
6. **Replace SLF4J imports** with `LogFactory.getLog(getClass())`
7. **Update vector store advisor module** from `spring-ai-advisors-vector-store` to `spring-ai-vector-store-advisor`
8. **Test streaming paths** — verify tracing span hierarchy is correct
9. **Run full integration test suite** — especially JSON output diffs (Jackson 3 defaults)

## Actionable Steps
1. Review Spring AI 2.0.0-RC1 docs if integrating LLM capabilities into Spring apps
2. Check Spring Boot 4.1 release notes for gRPC, OpenTelemetry, and OAuth2 features
3. Adjust upgrade timelines — May release train shifted to June 1-5, 2026
4. Set up automated dependency scanning (Dependabot/Snyk/OWASP) for OSS security
5. Use `spring-boot-properties-migrator` during upgrades for runtime property migration
6. Explore community tools: spring-api-sunset, spring-idempotency-kit

## References
- 📰 Original: [This Week in Spring - May 12th, 2026](https://spring.io/blog/2026/05/12/this-week-in-spring-may-12-2026) via Spring Blog
- 📰 Original: [This Week in Spring - May 19th, 2026](https://spring.io/blog/2026/05/19/this-week-in-spring-may-19-2026) via Spring Blog
- 📰 Original: [Spring Office Hours Podcast: S5E15 - Upgrading Spring and OSS Security](https://spring.io/blog/2026/05/11/spring-office-hours-podcast-S5E15) via Spring Blog
- 📰 Original: [Spring Office Hours Podcast: S5E16 - May Release Train Shift & Spring Boot 4.1](https://spring.io/blog/2026/05/19/spring-office-hours-podcast-S5E16) via Spring Blog
- 📰 Original: [Spring AI 1.0.8, 1.1.7, 2.0.0-M7 Available Now](https://spring.io/blog/2026/05/23/spring-ai-1-0-8-1-1-7-2-0-0-M7-available-now) via Spring Blog
- 📰 Original: [Spring AI 2.0.0-M8 Available Now](https://spring.io/blog/2026/05/27/spring-ai-2-0-0-M8-available-now) via Spring Blog
- 📰 Original: [Spring AI 2.0.0-RC1 Available Now](https://spring.io/blog/2026/06/06/spring-ai-2-0-0-RC1-available-now) via Spring Blog
- 📰 [Spring AI 2.0 Is Coming May 28 — June 30 Deadline Urgency](https://www.herodevs.com/blog-posts/spring-ai-2-0-is-coming-may-28-here-is-why-that-makes-the-june-30-deadline-more-urgent-not-less) via HeroDevs
- 📋 [Release Notes: 2.0.0-RC1](https://github.com/spring-projects/spring-ai/releases/tag/v2.0.0-RC1) via GitHub
- 📖 [2.0.0-RC1 Documentation](https://docs.spring.io/spring-ai/reference/2.0/index.html)
- 📋 [Spring Boot 4.1 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.1-Release-Notes) via GitHub Wiki
- 🎙️ [A Bootiful Podcast: Adib Saikali (Spring AI Lead)](https://spring.io/blog/2026/05/14/a-bootiful-podcast-daniel-adib-saikali) via Spring Blog

---
*Merged by KB Zookeeper on 2026-05-28*
*Enriched 2026-05-22 with Spring Boot 4.1 preview features, release train shift, Spring AI 2.0.0-M6, community tools*
*Enriched 2026-05-28 with Spring AI 2.0.0-M7 milestone: ToolSpec API, Gemini updates, migration guide, model provider matrix*
*Enriched 2026-05-30 with Jackson 3 migration details (package rename, date/ordering defaults), builder pattern replacement, two-step migration path, Spring Boot 4 hard dependency*
*Enriched 2026-06-01 with Spring AI 2.0.0-M8 final milestone: dash-separated properties, ChatOptions#mutate type-specific returns, Jackson YAML exclusion, MistralAiApi mapping fixes, Google GenAI/PGVector/API key bug fixes*

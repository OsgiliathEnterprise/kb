---
title: 'Java MCP Server Design: Dual Embedding Provider Architecture'
diataxis: Explanation
domain: AI-Infrastructure
topic: AI-Engineering
source: Inside Java
source_url: https://inside.java/2026/07/25/design-java-mcp-tool/
date: 2026-07-27
keywords:
- knowledge-base
- AI-Engineering
- AI-Infrastructure
- explanations
---
# Java MCP Server Design: Dual Embedding Provider Architecture

## Overview

This article covers the design decisions behind a Java-based MCP (Model Context Protocol) server for urgency scoring of support tickets, built during JavaOne 2026. The server supports two embedding providers (local in-process and remote hosted) behind a single stable MCP interface, using Helidon as the MCP framework and DeepNetts for scoring.

## Architecture Context

The urgency-mcp server is part of a larger end-to-end support system demo: a patient fills in a complaint via a web application, the request becomes a helpdesk ticket, and an AI-based triage pipeline speeds up solution. The MCP server's role: given a complaint message, how urgent is it?

## Why MCP Over REST?

MCP provides a stable, standard tool contract:
- Clients discover the server, find the tool, send complaint text, read the score
- Integration is less tied to one service-specific API
- Easier to change the consumer or move the urgency logic behind a different internal implementation
- The protocol shape remains fixed while inference strategy evolves behind it

## Training Pipeline Architecture

The scoring models are produced by a separate training pipeline:

```
Training Pipeline Flow:
1. Load ticket examples from training/dataset JSON files
2. Compute embeddings for the chosen provider
3. Cache embeddings under training/embeddings/{provider}
4. Shuffle samples, split 80/20 into training and validation sets
5. Train DeepNetts feed-forward networks: inputDim -> 64 -> 32 -> 1
6. Export provider-specific .dnet scorer files
```

The feed-forward network takes an embedding vector through two hidden layers (64 and 32 neurons) and produces a single output value representing the predicted urgency score.

### Two Model Families

| Provider | Embedding Model | Dimensions | Scorer File |
|----------|----------------|------------|-------------|
| Local (MiniLM) | `sentence-transformers/all-MiniLM-L6-v2` | 384 | `model-scorer-local.dnet` |
| OpenAI | `text-embedding-3-small` | 1536 | `model-scorer-openai.dnet` |

**Critical constraint**: A scorer file is only meaningful for the embedding representation it was trained against. The runtime configuration must point to matching scorer files.

## Helidon MCP Server Implementation

The server uses Helidon's annotation-based MCP server pattern:

```java
@Mcp.Path(McpUrgencyServer.MCP_PATH)
@Mcp.Server(McpUrgencyServer.MCP_SERVER_NAME)
final class McpUrgencyServer {
    @Mcp.Tool(
        value = "Get urgency score (0-10) for a support ticket complaint",
        title = "Get urgency score",
        readOnlyHint = true,
        destructiveHint = false,
        idempotentHint = true,
        openWorldHint = false)
    McpToolResult getUrgency(@Mcp.Description("complaint text to score") String phrase) {
        double score = scorerSupplier.get().score(phrase);
        return McpToolResult.create(Double.toString(score));
    }
}
```

### MCP Tool Hints Explained

- `readOnlyHint = true`: Tool only reads input and computes, doesn't change state
- `destructiveHint = false`: Tool does not delete or overwrite anything
- `idempotentHint = true`: Repeating the same call has the same effect
- `openWorldHint = false`: Tool works within bounded application concern

## Dual Provider Design

### Runtime Configuration

**Local mode:**
```yaml
urgency:
  provider: local
  providers:
    local:
      model:
        name: model-scorer-local.dnet
        location: ../urgency/model
      embedding:
        name: sentence-transformers/all-MiniLM-L6-v2
        location: ../urgency/model
        dimensions: 384
```

**OpenAI mode:**
```yaml
urgency:
  provider: openai
  providers:
    openai:
      model:
        name: model-scorer-openai.dnet
        location: ../urgency/model
      embedding:
        model:
          name: text-embedding-3-small
        dimensions: 1536
```

### In-Process Embedding Loading (DJL)

```java
private Predictor<String, float[]> loadPredictor() {
    Criteria<String, float[]> criteria = Criteria.builder()
            .setTypes(String.class, float[].class)
            .optModelUrls(DJL_MODEL_URL_PREFIX + modelName)
            .optEngine(ENGINE)
            .optTranslatorFactory(new TextEmbeddingTranslatorFactory())
            .build();
    model = criteria.loadModel();
    return model.newPredictor();
}
```

### Provider Selection at Runtime

```bash
java -Durgency.provider=local -jar target/urgency-mcp.jar
java -Durgency.provider=openai -Dopenai.api-key="$OPENAI_API_KEY" -jar target/urgency-mcp.jar
```

## Why Both Providers Exist

| Aspect | Local (In-Process) | Remote (Hosted) |
|--------|-------------------|-----------------|
| Development | No external credentials needed | Requires API keys |
| Network | No network calls | Requires connectivity |
| Vector size | 384 (MiniLM) | 1536 (OpenAI) |
| Use case | Protocol checks, integration testing | Semantic validation |
| Cost | Free | Provider billing |

## Vector Compatibility vs. Semantic Quality

A smaller vector (384-dim MiniLM) does not automatically mean a worse scorer because that scorer was trained on that exact representation. For local development, the MiniLM-based scorer needs to:
- Perform acceptably on its validation data
- Reserve a sensible ranking across typical complaint phrases
- Stay operationally cheap and reproducible

**Important**: In-process and external provider scores may differ, reflecting the fact that different representations capture different information. Each embedding/scorer combination is its own deployable inference unit.

## Architecture Diagram

```
                    MCP Client
                         │
                         ▼
              ┌──────────────────────┐
              │   MCP Server (Java)  │
              │  Helidon @Mcp.Tool   │
              └──────────┬───────────┘
                         │ getUrgency(phrase)
                         ▼
              ┌──────────────────────┐
              │  Embedding Generator │
              │  (provider-selected) │
              └──────────┬───────────┘
                         │ embedding vector
                         ▼
              ┌──────────────────────┐
              │  DeepNetts Scorer    │
              │  (.dnet file)        │
              │  input -> 64 -> 32 ->1│
              └──────────┬───────────┘
                         │ urgency score (0-10)
                         ▼
                    MCP Client
```

## Key Design Decisions

1. **Lazy scorer initialization**: The MCP endpoint comes up before the full inference stack is exercised, separating protocol readiness from inference readiness
2. **Provider choice stays out of tool name**: The client sees one tool; the provider is an implementation detail
3. **Separate training per provider**: Scorers must be trained separately for each embedding space — never reuse across incompatible embedding representations
4. **Regression over classification**: The regression path predicts urgency on a normalized 0..1 scale, mapped back to an urgency range for the MCP tool

## References

- [JavaOne 2026 Keynote](https://www.youtube.com/watch?v=3fLCOqpIfI0)
- [urgency-mcp Source Code](https://github.com/LizeRaes/j1-ai-demo/tree/main/services/urgency-mcp)
- [Helidon MCP Extension](https://helidon.io/docs/v4/se/ai/mcp)
- [MCP Documentation](https://modelcontextprotocol.io/docs/getting-started/intro)
- [Original Article](https://inside.java/2026/07/25/design-java-mcp-tool/)

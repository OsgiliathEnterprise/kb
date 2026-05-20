---
title: "Agent Protocol Stack: MCP vs A2A vs AG-UI"
description: "Agent Protocol Stack: MCP vs A2A vs AG-UI"
tags: [agents,protocols,mcp,a2a,ag-ui,architecture, General]
date: 2026-05-19
sidebar_label: Agent Protocol Stack: MCP vs A2A vs AG-UI
---



# Agent Protocol Stack: MCP vs A2A vs AG-UI

## Overview

Three emerging protocols for AI agent systems that work together at different layers, similar to TCP/HTTP/HTML for the web.

## Protocol Comparison

| Protocol | Created By | Connects | Purpose |
|----------|------------|----------|---------|
| **MCP** | Anthropic | Agent <-> Tools & Data | "How does my agent use tools?" |
| **A2A** | Google / Linux Foundation | Agent <-> Agent | "How do agents talk to each other?" |
| **AG-UI** | CopilotKit | Agent <-> User Interface | "How does my agent talk to the user?" |

## MCP (Model Context Protocol) - Tool Layer

- **Architecture:** Client-server over JSON-RPC 2.0
- **Primitives:**
  - **Tools:** Functions with typed inputs/outputs that LLM reads to decide when to call
  - **Resources:** Read-only data (files, DB schemas, configs) providing context without tool calls
  - **Transports:** `stdio` (local) or `Streamable HTTP` (production)
- **Use when:** Interacting with external systems (DBs, APIs, cloud services)
- **Don't use for:** Agent-to-agent communication or frontend UI updates

## A2A (Agent-to-Agent) - Collaboration Layer

- **Architecture:** HTTP/JSON-RPC 2.0 (optional gRPC v0.3+)
- **Core differentiator:** Opacity - advertises capabilities, not internals
- **Primitives:**
  - **Agent Cards:** JSON metadata at `/.well-known/agent.json` (name, skills, I/O types, auth)
  - **Tasks:** Unit of work with lifecycle: `submitted -> working -> completed` (or `failed`/`canceled`)
  - **Patterns:** Sync completion, SSE streaming, async webhooks
- **Use when:** Supervisor/specialist delegation, cross-organization collaboration
- **Don't use for:** Single-agent setups or tightly coupled components

## AG-UI - User Interface Layer

- **Architecture:** Event-based protocol (~16 typed events)
- **Primitives:**
  - **Lifecycle events:** `RUN_STARTED`, `RUN_ERROR`
  - **Text streaming:** `TEXT_MESSAGE_*`
  - **Tool execution:** `TOOL_CALL_*`
  - **State deltas:** `STATE_DELTA`
  - **Interrupts:** `INTERRUPT` for human-in-the-loop approvals
- **Use when:** Real-time chat, collaborative editing, live dashboards
- **Don't use for:** Background/batch jobs

## Integration Pattern

In production, all three compose:

```
User -> AG-UI -> Supervisor Agent -> MCP (tools) + A2A (specialists) -> AG-UI -> User
```

## Decision Framework

1. "Does my agent need external tools/data?" -> Use MCP
2. "Does my agent need to collaborate with other agents?" -> Use A2A
3. "Does my agent need real-time user communication?" -> Use AG-UI

## AWS Deployment

AWS Bedrock AgentCore Runtime supports all three:
- MCP: port 8000, path `/mcp`
- A2A: port 9000, path `/` (root)
- AG-UI: configurable
- Auth: IAM SigV4 or OAuth 2.0

## Key Insight

> "They're not competing - they're complementary. Each one solves a different problem at a different layer of the agent architecture."

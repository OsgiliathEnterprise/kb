---
title: 'MCP Release Candidate: Stateless Protocol Rewrite and Breaking Changes'
diataxis: Explanation
domain: AI-Infrastructure
topic: AI-Engineering
source: TheNewStack
source_url: https://thenewstack.io/mcp-release-candidate-rewrite/
date: 2026-07-27
keywords:
- knowledge-base
- AI-Engineering
- AI-Infrastructure
- explanations
---
# MCP Release Candidate: Stateless Protocol Rewrite and Breaking Changes

## Overview

The Model Context Protocol (MCP) received its most significant revision since launch. The release candidate was frozen on May 21, 2026, with the final specification arriving July 28. The revision fundamentally shifts MCP from a session-based protocol to a stateless HTTP-like architecture.

## The Problem: Session Tax on Remote Deployments

MCP was originally designed for local desktop applications communicating with processes via stdin/stdout, where a startup handshake over a long-lived connection was inexpensive. As MCP servers moved into remote, horizontally scaled deployments, sessions became a bottleneck:

- **Session affinity requirement**: A server minted an `Mcp-Session-Id`, pinning clients to the issuing instance
- **Scaling overhead**: Horizontal scaling required session affinity, externally shared session stores, or MCP-aware gateway logic that parsed JSON bodies for call routing
- **Capability negotiation costs**: Capabilities exchanged once at connect time meant list results could vary by connection, making cross-session caching difficult

> A team shipping an MCP server was paying to solve a distributed-systems problem the protocol had created for them.

## What Changed: Six SEP Convergences

Six Specification Enhancement Proposals converged on a single goal: making every request stand on its own.

### Removed Features
- **Sessions**: The `Mcp-Session-Id` mechanism is gone
- **Initialization handshake**: The startup handshake is deprecated
- **Three core features deprecated**: Including Tasks (moved to extension), Sampling, and Logging

### New Design Principles

**Pay-as-you-go complexity**: The core stays lean, and statefulness appears only where a feature genuinely needs it.

**Per-request metadata**: Protocol version and client capabilities now travel in `_meta` on each call, rather than being negotiated once at connection time.

**`server/discover` method**: A new method makes server capabilities independently queryable either up front or on demand.

### The Handle Pattern

Instead of hidden session state, MCP now uses explicit handles — the same pattern shopping carts have used over HTTP for twenty years:

1. A tool mints a `basket_id`, returns it in the result
2. The model passes it back as an ordinary argument on the next call
3. Handles are visible to the model (unlike session state hidden in transport metadata)

**Security consideration**: Because handles appear in prompts, transcripts, and logs, they must be bound to the authenticated principal with permission verification on each use.

## What Developers Get

### Stateless Server Operation
Remote MCP servers can now operate like conventional stateless HTTP services:
- Three replicas behind round-robin, no affinity configuration
- No protocol session store to run or recover
- Rolling deploys no longer invalidate sessions

### Gateway-Friendly Headers
- Required `Mcp-Method` header for rate-limiting and authorization by operation
- `Mcp-Name` header for named tool, resource, and prompt operations
- Gateways can authorize without inspecting request bodies

### Caching Improvements
- List and read results include `ttlMs` and `cacheScope` (modeled on HTTP `Cache-Control`)
- Servers return tools in deterministic order for better prompt cache hit rates
- Lower latency and token cost where providers price prompt caching

## Extension System

Extensions now have:
- **Namespaced identifiers**: Official ones under `io.modelcontextprotocol`, third-party under reversed domain
- **Own `ext-` repositories and release cadences**
- **Formal governance**: Similar to Kubernetes custom resource definitions

Tasks moved from core to extension, demonstrating the pattern. MCP Apps already available as an extension now sits inside a formally governed negotiation framework.

## Deprecation Policy

The [feature lifecycle policy](https://modelcontextprotocol.io/community/feature-lifecycle) defines:
- **States**: Active → Deprecated → Removed
- **Minimum 12-month window** from first deprecation
- **90-day minimum** for active security risks with published advisory
- **Public registry** of features on the way out
- **Conformance requirement**: Standards Track proposals cannot reach Final without matching scenario in conformance suite

## Migration Costs

- **Tasks API users**: Must migrate to the new extension lifecycle
- **Server-initiated requests**: Must move to [Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/draft/basic/patterns/mrtr) pattern
- **Sampling**: Servers calling provider APIs directly become credential holders and billing parties
- **Logging**: `stderr` and OpenTelemetry replace structured log streams for operators

## Migration Path

Clients probe with `server/discover` first, falling back to `initialize` only when encountering a legacy-only server. This is a wire-level break with a negotiated path across it rather than an ecosystem flag day.

## Architecture Diagram

```
                              MCP Protocol Evolution
                              ======================

BEFORE (Session-Based):                    AFTER (Stateless):
┌──────────┐                               ┌──────────┐
│  Client  │── Session Handshake ────┐     │  Client  │── Request + _meta ──┐
└──────────┘                         │     └──────────┘                        │
         Session ID assigned          │              Each request              │
         Client pinned to instance    │              carries version,          │
                                      ▼              capabilities, identity    ▼
                    ┌─────────────────────────┐          ┌─────────────────────────┐
                    │   MCP Server Instance    │          │   MCP Server (any)      │
                    │   (session state stored) │          │   (stateless, scalable) │
                    └─────────────────────────┘          └─────────────────────────┘
                    │                                   │
                    │ Session affinity required         │ Round-robin, no affinity
                    │ Session store for HA              │ Handles in tool results
                    │ Rolling deploys break sessions    │ Rolling deploys safe
```

## Key Takeaways

1. **Protocol simplification**: MCP removed foundational session machinery less than two years into its life — a calculated risk hedged with a ten-week validation window and beta SDKs for Python, TypeScript, Go, and C#
2. **Infrastructure fit**: The protocol now fits naturally onto infrastructure the industry already knows how to operate
3. **State didn't disappear**: Application state (handles, carts, task records, idempotency keys) still needs somewhere to live — the protocol just stopped managing it
4. **Written guarantees matter**: The 12-month deprecation window is worth more to platform review boards than any single capability in the release

## References

- [MCP Release Candidate Blog Post](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/)
- [MCP Specification Changelog](https://modelcontextprotocol.io/specification/draft/changelog)
- [MCP Extensions Overview](https://modelcontextprotocol.io/extensions/overview)
- [MCP Feature Lifecycle Policy](https://modelcontextprotocol.io/community/feature-lifecycle)
- [Streamable HTTP Transport Validation](https://modelcontextprotocol.io/specification/draft/basic/transports/streamable-http)
- [Multi Round-Trip Requests Pattern](https://modelcontextprotocol.io/specification/draft/basic/patterns/mrtr)
- [Original Article: MCP's Biggest Update](https://thenewstack.io/mcp-release-candidate-rewrite/)

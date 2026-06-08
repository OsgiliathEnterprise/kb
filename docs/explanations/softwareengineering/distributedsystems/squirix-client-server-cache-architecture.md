---
title: 'Squirix: Client/Server Architecture for .NET Distributed Cache'
diataxis: Explanation
domain: Software-Engineering
topic: Distributed-Systems
source: ''
source_url: https://dev.to/__2d3e61e/why-squirix-uses-a-strict-clientserver-architecture-for-a-net-distributed-cache-5086
keywords:
- knowledge-base
- Distributed-Systems
- Software-Engineering
- explanations
---
# Squirix: Client/Server Architecture for .NET Distributed Cache

## Overview

Squirix 0.1.0 is an early preview of a .NET distributed cache built with a strict client/server architecture from day one. A typed client SDK communicates with a remote server over gRPC; the server owns state, routing, durability, and operational endpoints.

**Key design decision**: The application stays a client; the server owns the data lifecycle. This is an architectural choice, not a claim that every cache must work this way.

## The Problem with "Just a Cache Library"

### The Ambiguity of Embedded Caches

A cache library is simple until you ask: **who owns what?**

When cache logic runs inside your app process:
- State, memory pressure, and persistence share the app's lifecycle
- Works fine for local acceleration (`IMemoryCache`)
- Becomes ambiguous when you need:
  - Shared state across instances
  - Durability across restarts
  - Independent health/metrics
  - Cluster routing

At that point, you often have an implicit server with unclear boundaries.

### Squirix Makes the Split Explicit

```
application → Squirix client SDK → Squirix.Server node(s)
```

Two packages, enforced at build time:
- `squirix` (client)
- `squirix.server` (runtime)

**Important**: The server does not reference the client assembly.

## Embedded Mode vs. Client/Server Mode

### Embedded Mode

Cache logic in or tightly coupled to the app process:
- In-memory caches
- Libraries that hide remote I/O
- Co-located server called via direct references

**Optimizes for**: Low friction; you rarely expect separate health probes or journal compaction on "just a dependency."

### Client/Server Mode

The app holds no authoritative state. It connects over a wire contract; the server owns:
- Placement
- Mutations
- Durability
- Recovery
- Admin/metrics endpoints

**Examples**: Redis and most production distributed caches follow this shape.

### Squirix's Approach

Squirix 0.1.0 is client/server first. You can embed the server in ASP.NET Core via `AddSquirixServer` / `MapSquirixServer`, but application access still goes through `SquirixClient.ConnectAsync(...)` — even in the same process. This is hosting convenience, not embedded cache semantics in the app layer.

## Why Client/Server First?

### Design Rationale

| Reason | Benefit |
|--------|---------|
| Operational boundary | Deploy, probe, and upgrade cache nodes independently |
| Server-owned lifecycle | WAL journal, snapshots, compaction, and recovery stay in the server |
| Lighter client package | Run the server as its own process or container; apps only reference the client SDK |
| Clustering path | Routing and failover can evolve server-side without rewriting `ICache<T>` |
| Durability isolation | Recovery and compaction failures stay out of application request threads |

### Operational Endpoints

The server exposes independent health, admin, and metrics endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/health/live` | Liveness probe |
| `/health/ready` | Readiness probe |
| `/admin/whoami` | Admin identification |
| `/admin/ring` | Cluster ring status |
| `/metrics` | Prometheus metrics |

## Public API Design

### Connection Pattern

```csharp
using System.Threading;
using Squirix;

var cancellationToken = CancellationToken.None;
await using var client = await SquirixClient.ConnectAsync(
    "http://localhost:5001", cancellationToken);

var cache = await client.GetCacheAsync<string>("demo", cancellationToken);
await cache.SetAsync("greeting", "hello", cancellationToken: cancellationToken);
```

### Key API Characteristics

- **Typed cache interface**: `ICache<T>` for type-safe operations
- **Explicit read results**: `CacheValueResult<T>` for clear success/failure semantics
- **Cancellation support**: All operations accept `CancellationToken`
- **Async-first**: All I/O operations are asynchronous
- **Wire contract**: Client communicates with server over gRPC

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│          Squirix Client/Server Architecture           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │              Application Layer               │    │
│  │  ┌───────────────────────────────────────┐   │    │
│  │  │  SquirixClient.ConnectAsync(...)      │   │    │
│  │  │  ICache<T> operations                 │   │    │
│  │  │  CacheValueResult<T> reads            │   │    │
│  │  └───────────────────┬───────────────────┘   │    │
│  └──────────────────────┼───────────────────────┘    │
│                         │                            │
│                         │ gRPC                       │
│                         ▼                            │
│  ┌─────────────────────────────────────────────┐    │
│  │              Squirix.Server                  │    │
│  │  ┌─────────────┐  ┌─────────────────────┐   │    │
│  │  │  WAL Journal│  │  Snapshots          │   │    │
│  │  │  (durability│  │  (persistence)      │   │    │
│  │  └─────────────┘  └─────────────────────┘   │    │
│  │  ┌─────────────┐  ┌─────────────────────┐   │    │
│  │  │  Compaction │  │  Recovery           │   │    │
│  │  └─────────────┘  └─────────────────────┘   │    │
│  │  ┌─────────────┐  ┌─────────────────────┐   │    │
│  │  │  Routing    │  │  Health/Admin       │   │    │
│  │  │  (consistent│  │  Endpoints          │   │    │
│  │  │  hash)      │  │                     │   │    │
│  │  └─────────────┘  └─────────────────────┘   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Comparison with Alternative Approaches

| Feature | Embedded Cache | Squirix (Client/Server) |
|---------|---------------|------------------------|
| State ownership | App process | Server |
| Durability | App-dependent | Server-owned WAL |
| Health monitoring | Implicit | Explicit endpoints |
| Independent scaling | No | Yes |
| Cluster routing | Complex | Server-managed |
| Client package size | Larger | Lightweight |
| Failure isolation | Low | High |
| Recovery impact | Affects app | Server-only |

## Implications for .NET Ecosystem

### Why This Matters

1. **Clear boundaries** — The client/server split eliminates ambiguity about who owns state
2. **Operational maturity** — Health probes, metrics, and admin endpoints are built-in
3. **Scalability path** — Clustering and routing can evolve without client changes
4. **Type safety** — `ICache<T>` provides compile-time type checking
5. **Durability guarantees** — WAL journal and snapshots ensure data persistence

### When to Choose Client/Server

| Scenario | Recommendation |
|----------|---------------|
| Single-instance app, local cache | Embedded (`IMemoryCache`) |
| Multi-instance, shared state | Client/server (Squirix, Redis) |
| Need durability across restarts | Client/server with WAL |
| Need independent scaling | Client/server |
| Need cluster routing | Client/server |
| Simple key-value, no durability | Embedded or lightweight |

## Best Practices

1. **Treat the cache as infrastructure** — Deploy, monitor, and scale independently from the app
2. **Use health probes** — Integrate `/health/live` and `/health/ready` with your orchestrator
3. **Monitor metrics** — Track cache hit rates, latency, and memory usage via `/metrics`
4. **Plan for recovery** — Test WAL recovery and snapshot restoration
5. **Use typed caches** — Leverage `ICache<T>` for type safety
6. **Handle connection failures** — Implement retry logic for `ConnectAsync`
7. **Use cancellation tokens** — Support graceful shutdown and timeout handling

## References

- [DEV.to: Why Squirix uses a strict client/server architecture](https://dev.to/__2d3e61e/why-squirix-uses-a-strict-clientserver-architecture-for-a-net-distributed-cache-5086)
- [.NET Distributed Caching Documentation](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/distributed)
- [gRPC for .NET](https://grpc.io/docs/languages/csharp/)

---
title: MCP Discovery Storms — Why Agents Hammer tools/list and How SEP-2549 Caching
  (ttlMs/cacheScope) Actually Helps
diataxis: Explanation
domain: developer-tools-practices
topic: mcp
source: DEV.to Tech News
source_url: https://dev.to/sindhuja_sudhakar/when-ai-agents-hammer-toolslist-building-a-caching-aware-mcp-server-sep-2549-38k6
date: 2026-09-21
keywords:
- knowledge-base
- mcp
- developer-tools-practices
- explanations
---
# MCP Discovery Storms — Why Agents Hammer `tools/list` and How SEP-2549 Caching Actually Helps

AI agents plan in loops. A human calls a tool because they decided to; an **agent** can call — and re-discover — the same tools dozens of times inside a single planning loop. That changes the economics of MCP: one user request fans out into many protocol calls. In a toy server `tools/list` is cheap (the list is constant). In a real one, building a genuine `tools/list` means querying a **service registry**, filtering through **RBAC**, assembling **input schemas** from config, applying **feature flags** — backend round-trips *per call*. Multiply by recursive planning across many agents and the discovery endpoint becomes a self-inflicted DoS risk for your own databases.

Measured example: pointing GitHub Copilot CLI at such a server produced **nine `tools/list` calls in ~40 seconds** in one short session, plus repeated re-initializes. That is the storm SEP-2549 ("TTL for List Results", shipped in the 2026-07-28 MCP spec) is meant to tame.

## The protocol answer: `ttlMs` and `cacheScope`

SEP-2549 lets the server advertise, right inside a discovery result, how long it may be cached and by whom — two fields on the top level of the result (`CacheableResult`):

```json
{ "tools": [ /* ... */ ], "ttlMs": 300000, "cacheScope": "private" }
```

- **`ttlMs`** — how long the result stays fresh (milliseconds). Semantics analogous to HTTP `Cache-Control: max-age`. Tool schemas rarely change, so a 5-minute window collapses a burst of planning turns into one fetch.
- **`cacheScope`** — *who* may cache it. Exactly two values: **`"public"`** (identical for everyone; a shared proxy may keep one copy) and **`"private"`** (varies per authorization context; must never be shared across callers). Analogous to HTTP `Cache-Control: public` vs `private`.

Rule worth underlining: the spec marks **read/discovery** results cacheable — `server/discover`, `tools/list`, `prompts/list`, `resources/list`, `resources/templates/list`, even `resources/read` — but **not actions**. `tools/call` is always `no-store`. You cache "what can I do", never "do it".

## The code: two coordinated cache layers (FastAPI)

A server exposing read-only tools (`get_git_diff`, `inspect_file_structure`, `fetch_logs`) publishes the hint in **two places from one source of truth**, so both MCP-aware clients and header-reading proxies can act on it:

```python
TOOLS_TTL_MS = int(os.getenv("MCP_TOOLS_TTL_MS", str(5 * 60 * 1000)))
TOOLS_CACHE_SCOPE = os.getenv("MCP_TOOLS_CACHE_SCOPE", "private")

def cache_meta():
    return {"ttlMs": TOOLS_TTL_MS, "cacheScope": TOOLS_CACHE_SCOPE}

def cache_control_header(ttl_ms=TOOLS_TTL_MS, scope=TOOLS_CACHE_SCOPE):
    visibility = "public" if scope == "public" else "private"
    return f"{visibility}, max-age={ttl_ms // 1000}"
```

- `_meta.cache` rides inside the JSON-RPC result — for MCP-aware clients/proxies.
- `Cache-Control` maps the same values to an HTTP header — for gateways that only read headers.

But the layer that actually saved the database is a **server-side discovery cache**, because you cannot trust the *caller* to honor `ttlMs`:

```python
class DiscoveryCache:
    def get(self, client_id, build):
        key = "*" if self.scope == "public" else f"client:{client_id}"
        now = time.monotonic()
        with self._lock:
            entry = self._entries.get(key)
            if entry and now < entry[0]:
                self.cache_hits += 1
                return entry[1], True            # served from memory, no DB hit
            self.backend_builds += 1             # pay the backend cost ONCE
            value = build()
            self._entries[key] = (now + self.ttl_s, value)
            return value, False
```

Wired into `tools/list`, the expensive `build_tool_list()` runs **at most once per TTL window, no matter how often clients re-discover**. Be precise about what this is: SEP-2549 gives the *consumer* a caching *hint*; the `DiscoveryCache` is a separate *server-side* defense you control regardless of whether any consumer honors that hint. They share the same `ttlMs` value but do different jobs.

Two caveats for real builds:

1. Keying the `private` scope by `client_id` is a stand-in — the spec's `private` semantics are per *authorization context* (the auth principal and scopes that decide who may share a response).
2. An in-process cache preserves statelessness but gives no globally shared state: a burst spread across four replicas can trigger up to four backend builds instead of one. No Redis lock — but not free either.

## Experiment: does the cache actually stop the storm?

**Finding 1 — the server-side cache works.** Replaying the nine-call storm collapses it to a single backend build:

```text
Replaying a 9-call discovery storm from one client...
  tools/list #1: servedFromServerCache=False
  tools/list #2..9: servedFromServerCache=True
discovery cache stats: {'backendBuilds': 1, 'cacheHits': 8}
=> 9 client discovery requests collapsed to 1 backend build(s)  (88% avoided)
```

Confirmed end-to-end with real Copilot CLI: it re-requested `tools/list` repeatedly while the server log showed `fromCache: true` and `backendBuilds` pinned at **1** — the DB was queried once, then shielded.

**Finding 2 — the clients tested didn't honor `ttlMs`.** The server advertised `ttlMs: 300000`, but both Copilot CLI and Cursor re-requested `tools/list` repeatedly without client-side caching (their handshakes differ — Copilot CLI is dual-era, probing `server/discover` before falling back to `initialize`; Cursor took the legacy path — but neither honored the hint in these runs). Careful reading: this doesn't mean MCP clients ignore `ttlMs` in general — SEP-2549 is final in the 2026-07-28 spec and client support is still landing. The two tested just hadn't wired it up yet, which is exactly why a server can't *rely* on the hint being honored.

**Finding 3 — client-side caching is timing-sensitive.** A simulated edge proxy that *does* honor `ttlMs` normally collapses 20 planning turns to ~2 fetches. But under adversarial timing (slow laptop, ~2 s round-trips matching the proxy's own 2 s window), the client cache expired just before every next call: **0% avoided** — while the server-side cache still served 19 of 20 calls from memory. TTL effectiveness depends on the relationship between cache TTL, request frequency, and round-trip latency; client-side caching is dependent on consumer behavior and timing, server-side stays effective even when clients ignore the hint.

## Whose database, and who protects it?

This protects the **server's** backend, not the client's: the agent is the *source* of the load; the corporate database behind the server is the victim. Three places a cache can step in — each reduces load reaching the DB, and the further upstream it lives, the more work it eliminates:

| Layer | Mechanism | Protects |
| --- | --- | --- |
| Client | honors `ttlMs` / `cacheScope` | DB + network + server CPU |
| Gateway / proxy | `Cache-Control` / protocol-aware caching | DB + server CPU |
| Server | local discovery cache | DB |

Since the tested clients don't honor the hint, **the server-side cache is the only layer you fully control** — and therefore the only protection you can enforce unilaterally today. So do both jobs at once: *advertise* `ttlMs`/`cacheScope` for the ecosystem that's catching up, and *enforce* the same TTL inside the server for the ecosystem you actually have.

> **Key takeaway:** a cache hint is only *advice* — it protects nothing until a consumer acts on it. Advertise `ttlMs`/`cacheScope` for the ecosystem you wish you had; enforce the same TTL inside the server for the ecosystem you actually have.

## Takeaways

- Recursive AI planning turns `tools/list` into a self-inflicted DoS — every planning turn re-runs the registry/RBAC/schema queries behind discovery.
- `ttlMs`/`cacheScope` are the right vocabulary, but they're **advice for consumers** — and the tested Copilot CLI/Cursor versions didn't honor it, so a **server-side discovery cache** is the protection you can enforce unilaterally.
- Cache read-only results, never actions; key the cache by `cacheScope` (`public` vs `private`) so per-tenant tool lists never leak across callers.

## References

- [When AI Agents Hammer tools/list: Building a Caching-Aware MCP Server (SEP-2549) (dev.to, 2026-09-21)](https://dev.to/sindhuja_sudhakar/when-ai-agents-hammer-toolslist-building-a-caching-aware-mcp-server-sep-2549-38k6)
- [MCP Specification (2026-07-28) — Server Utilities: Caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)
- [SEP-2549 — TTL for List Results](https://modelcontextprotocol.io/seps/2549-TTL-for-list-results)
- [SEP-2575 — Make MCP Stateless (Part 1 of this series)](https://modelcontextprotocol.io/seps/2575-stateless-mcp)
- [HTTP Caching — Cache-Control (RFC 9111)](https://www.rfc-editor.org/rfc/rfc9111)

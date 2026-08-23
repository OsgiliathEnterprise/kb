---
title: 'Measuring MCP Client Failures with a Pipe Proxy: The Tool-Call Gap'
diataxis: Explanation
domain: AI-Infrastructure
topic: AI-Engineering
source: DEV.to (lopster568)
source_url: https://dev.to/lopster568/i-put-a-proxy-on-the-mcp-pipe-for-90-trials-most-of-one-clients-calls-never-reached-the-server-20p
date: 2026-08-22
keywords:
- knowledge-base
- AI-Engineering
- AI-Infrastructure
- explanations
---
# Measuring MCP Client Failures with a Pipe Proxy: The Tool-Call Gap

## What Was Measured

90 trials through a **proxy on the MCP stdio pipe**: 3 servers (`@modelcontextprotocol/server-filesystem@2026.7.10`, `@playwright/mcp@0.0.79`, `ghcr.io/github/github-mcp-server` v1.9.0), 2 clients (Claude Code 2.1.235 on `claude-sonnet-5`, Gemini CLI 0.55.1 on `gemini-2.5-flash`), 15 scripted tasks × 3 trials. Result: 87/90 completed.

The headline finding is *not* in the token table: **one client was failing calls inside itself, before a byte reached the server** — and on the wire that looked exactly like a model that tried very little and answered wrong.

## Finding 1: Per-Call Cost Depends on Client + Protocol Revision

Median call tokens per trial (`tools/call` arguments + server results, `o200k_base` basis):

| server | Claude Code | Gemini CLI |
|--------|-------------|------------|
| filesystem | 525 | 170 |
| playwright | 629 | 522 |
| github | **1,698** | 223 |

On one github task, the *same call with identical arguments* returned **1,561 result tokens to Claude Code vs 161 to Gemini CLI**. Every Claude Code response carried a `_meta` block (`io.modelcontextprotocol/serverInfo`) with two **base64-inlined PNG icons — 2,215 characters wrapped around a 472-character answer** — present in all 81 responses. None of Gemini's 93 responses did. The two sessions negotiated **different protocol revisions** (`2026-07-28` vs `2025-06-18`). Conclusion: a per-call cost figure is *not a property of the server alone* — which is why no row publishes a single number.

## Finding 2: The Schema-Dialect Trap (The Big One)

In a shakedown run on Gemini CLI **0.18.4**, all five playwright tasks failed, each with exactly *one* call on the wire — reading like a capability failure.

The real cause: 0.18.4 validated each call's arguments against the server's advertised schema, but its bundled validator had **no JSON Schema draft 2020-12 meta-schema registered**. `@playwright/mcp@0.0.79` declares 2020-12 on all 24 of its tools, so most calls died inside the client with `no schema with key or ref "https://json-schema.org/draft/2020-12/schema"` and **never reached the pipe**. The same client ran filesystem (draft-07) and github (no `$schema`) clean the same day. **The dialect decided it, not the server.**

Upstream had already fixed the validator in 0.28.0 ([gemini-cli issue #14970](https://github.com/google-gemini/gemini-cli/issues/14970), PR #15060): dispatch a dedicated 2020-12 instance on the schema's own `$schema`, fall back to skip-and-warn for unknown dialects. The failing client was simply stale — upgrading to 0.55.1 and re-running gave five passes and a zero gap on every trial.

## Finding 3: The Tool-Call Gap Metric

What caught it was the **tool-call gap**: for every tool name the server advertised, subtract the wire frames the proxy logged from the calls the client's *own usage output* attributes to that tool; sum the positive differences. Zero is normal. The five shakedown trials read **3, 4, 4, 4, 3** — the client formed calls to tools the server offered, and those calls never left the client. No classification of wire frames could have said that, because classification only sees what reached the wire.

**Detector gotcha:** after the client upgrade, usage output moved from bare tool names to `mcp_<server>_<tool>` spellings. Matching on the bare name alone made every difference *negative* — the gap read a clean zero that meant nothing. **A zero from a working detector and a zero from a broken one are the same character in the output.** The runner now sums both spellings.

## Finding 4: Harness Artifacts Disguised as Capability Results

Three artifacts produced numbers that would have read as model-quality results:

| Artifact | What happened | Fix |
|----------|---------------|-----|
| Global instructions | Claude Code answered GH-03 with zero tool calls citing a global `CLAUDE.md` standing instruction | Runner passes `--setting-sources ""` and stamps the value in the run header |
| Built-in tools | FS-01 answered correctly with zero wire frames because Claude Code used its own built-in `Read` tool | Separate bucket `answered_without_tools`, counted as failure for tool-use metrics; runner denies the built-in surface |
| Side effects persisting | Gemini answered a GitHub read task by *posting the answer as a comment* on the fixture issue; the fixture verifier still reported baseline | Reset script deletes comments and reports them as drift |

Eleven harness faults were enumerated in the spec: seven fixed on 2026-08-18, four more forced by the client upgrade the next day, two of which killed a run outright.

## Key Takeaways

1. **A proxy proves what reached the server — it cannot prove that a requested call left the client.** The tool-call gap (client-reported calls minus wire frames) is the witness for the invisible middle.
2. **Treat a non-zero gap as UNKNOWN for the task**, not as a clean decline — the server never had a chance to execute.
3. **JSON Schema `$schema` dialects are a real compatibility axis** between MCP clients and servers (draft-07 vs 2020-12 vs none); stale client validators can silently swallow calls.
4. **Protocol revision affects wire cost** — the same server returned an 10× token difference between two clients, largely from base64-inlined `_meta` icons.
5. **Audit your measurement harness** — built-in tools, global instruction files, and persistent side effects all produce numbers that read as capability results.

## Gap-Detection Loop

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "client",
      "type": "rectangle",
      "x": 40, "y": 40,
      "width": 200, "height": 90,
      "strokeColor": "#3667a5",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "MCP client\n(Claude Code / Gemini CLI)\nusage output: N calls\nschema validation inside", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "proxy",
      "type": "rectangle",
      "x": 320, "y": 40,
      "width": 200, "height": 90,
      "strokeColor": "#bf8401",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "stdio pipe proxy\nlogs every wire frame\nonly sees what left client", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "gap",
      "type": "rectangle",
      "x": 320, "y": 200,
      "width": 200, "height": 90,
      "strokeColor": "#e52727",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "tool-call gap\n=N reported - M on wire\ngap>0 -> calls died in client\n(schema dialect!)\nsum both name spellings", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "server",
      "type": "rectangle",
      "x": 600, "y": 40,
      "width": 200, "height": 90,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "MCP server\nadvertises tools + $schema\ndraft-07 vs 2020-12", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "arrow-1",
      "type": "arrow",
      "x": 240, "y": 85,
      "width": 80, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "arrow-2",
      "type": "arrow",
      "x": 520, "y": 85,
      "width": 80, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "arrow-3",
      "type": "arrow",
      "x": 420, "y": 130,
      "width": 0, "height": 70,
      "strokeColor": "#e52727",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 70]]
    }
  ]
}
```

## References

- [I put a proxy on the MCP pipe for 90 trials — DEV.to](https://dev.to/lopster568/i-put-a-proxy-on-the-mcp-pipe-for-90-trials-most-of-one-clients-calls-never-reached-the-server-20p)
- [Companion post: what 14 MCP servers cost a context window — DEV.to](https://dev.to/lopster568/i-measured-what-14-mcp-servers-cost-a-context-window-claude-counts-them-64-higher-than-tiktoken-10pj)
- [JSON Schema draft 2020-12 meta-schema](https://json-schema.org/draft/2020-12/schema)

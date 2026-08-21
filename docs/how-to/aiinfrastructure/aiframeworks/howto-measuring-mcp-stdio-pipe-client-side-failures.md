---
title: 'Measuring the MCP stdio pipe: a client can fail every call before a byte reaches
  the server'
diataxis: How-to Guide
domain: AI-Infrastructure
topic: AI-Frameworks
source: DEV.to Tech News
source_url: https://dev.to/lopster568/i-put-a-proxy-on-the-mcp-pipe-for-90-trials-most-of-one-clients-calls-never-reached-the-server-20p
date: 2026-08-21
keywords:
- knowledge-base
- AI-Frameworks
- AI-Infrastructure
- how-to
---
# Measuring the MCP stdio Pipe: A Client Can Fail Every Call Before a Byte Reaches the Server

## Summary
A 90-trial study (3 servers × 2 clients × 15 scripted tasks × 3 trials) through a **proxy on the MCP stdio pipe** set out to answer: what do real MCP servers cost a context window, per call? The finding worth the post is **not** in the token table. It came out of a shakedown run earlier the same day: **one of the clients was failing calls inside itself, before a byte reached the server, and on the wire it looked exactly like a model that tried very little and answered wrong.** This note is the practical how-to: how to instrument the pipe, how to detect a client-side failure that no wire log can show, and the three specific failure modes that produced a *plausible-looking* capability result.

## The setup
- **Servers** (pinned): `@modelcontextprotocol/server-filesystem@2026.7.10`, `@playwright/mcp@0.0.79`, and the `ghcr.io/github/github-mcp-server` container (untagged, self-reported `v1.9.0`).
- **Clients**: Claude Code 2.1.235 on `claude-sonnet-5`; Gemini CLI 0.55.1 on `gemini-2.5-flash`. Model IDs were **read back out of each trial's own client JSON** rather than assumed from the flag. (Claude Code also invokes `claude-haiku-4-5` on every trial for its own bookkeeping, &lt;1k input tokens — it never touches the MCP pipe and is in none of the figures, but it is in the manifest.)
- **Instrumentation**: a proxy on the **stdio pipe** logs every `tools/call` request's **arguments** plus the **results the server sent back** — that is all a wire proxy can see. Token counts use `o200k_base` so the figures share the Tier-1 token basis.
- **Result**: 87 of 90 trials completed; the 3 that did not **failed three different ways** (one per server, all Gemini): an off-by-one line count on FS-04, a response its own tool layer rejected on GH-05 after six calls reached the server, and a PW-01 final message that declared the task done without restating the price the check looks for. Three trials per cell buys **per-cell counts and nothing statistical**, so these stay counts, never rates.

### Median call tokens (args + results, `o200k_base`, over 15 trials)
| server | Claude Code | Gemini CLI |
| --- | --- | --- |
| filesystem | 525 | 170 |
| playwright | 629 | 522 |
| github | 1,698 | 223 |

On one github task (GH-01) both clients called `get_file_contents` with **identical arguments**, and the answer measured **1,561 result tokens for Claude Code against 161 for Gemini CLI**. Every response in the Claude Code session carried a `_meta` block (`io.modelcontextprotocol/serverInfo`) with the server name, version, and **two PNG icons inlined as base64 — 2,215 characters wrapped around a 472-character answer**, across all 81 of 15 github trials; **none** of the 93 Gemini CLI responses did. The two sessions negotiated **different protocol revisions** (`2026-07-28` vs `2025-06-18`). One server version against two clients does not prove the server keys on the revision — but it establishes that a **per-call cost figure is not a property of the server alone**, which is why no row publishes one number.

## The core finding: a client-side failure that looks like a capability failure
None of the above is in the 90. The **shakedown** (one trial per task) ran on **Gemini CLI 0.18.4**, and its rows survive as superseded records. All **five** playwright tasks failed there, each trial with **exactly one call on the wire**. Read from the frames alone, the classifier bucketed it as a **capability failure** — once as a decline because the model apologised. **That reading is false.**

0.18.4 **validated each call's arguments against the schema the server advertised**, and its bundled validator had **no JSON Schema draft 2020-12 meta-schema registered**. `@playwright/mcp@0.0.79` declares **2020-12 on all 24 of its tools**, so most of its calls **died inside the client** with `no schema with key or ref "https://json-schema.org/draft/2020-12/schema"` and **never reached the pipe** — each trial got exactly one onto the wire and lost three or four more inside. The same client ran **filesystem** (declares **draft-07**) and **github** (declares no `$schema` at all) clean the same day. **The dialect decided it, not the server.**

### The detector: the tool-call gap field
What caught it was a field that exists for a different purpose (spec §4.2). The **tool-call gap** takes every tool name the server advertised, **subtracts** the wire frames the proxy logged, from the calls the client's **own usage output** attributes to that tool, and **sums the positive differences**. **Zero is the normal state.** Those five trials read **3, 4, 4, 4 and 3** — the client formed calls to tools the server offered, and **those calls never left it**. No classification could have said that, because a classification only sees what reached the wire.

> **Takeaway:** a zero on the wire is ambiguous. It can mean "the model made no calls," "the client rejected the calls before the wire," or "the proxy broke." You need the **client's own usage output** (which counts calls it *formed*, not just *sent*) and a **gap metric** to distinguish them.

### The upgrade nearly broke the detector
Upstream had already fixed the validator in **0.28.0** (gemini-cli issue #14970, PR #15060): it dispatches a dedicated **2020-12 instance on the schema's own `$schema`** and falls back to **skip-and-warn** for unknown dialects. The stale client was the author's own. Upgrading to **0.55.1** and re-running the five tasks gave **five passes, a zero gap on every trial, and no schema error in stderr.**

But the upgrade **nearly broke the detector**: the log keys the server's **bare tool name**, while the client's usage output moved to **`mcp_<server>_<tool>`** between versions. Matched on the bare name alone, **every difference came out negative**, and the gap would have read a **clean zero — a zero from a working detector and a zero from a broken one are the same character in the output.** The runner now **sums both spellings**.

## Three failure modes that produced a plausible-looking "capability" result
1. **FS-04 off-by-one.** The task: find the longest file and write its path and line count. The answer is `logs/access.log`, **137** lines. Gemini passed 2 of 3; the third wrote `logs/access.log` and **138**, reported complete, with a **zero gap** (all three calls on the wire). The `read_multiple_files` response carried the **complete** log (137 lines, `item-0001`–`item-0137`, no truncation). Because the server **concatenates files into one text block** separated by a blank line and a marker, the last log line is followed by an empty line before the separator — the log **cannot show which of those the model counted**. It does show nothing upstream lost or added a line.
2. **GH-03 measured the harness's own memory file.** Came back from Claude Code with **zero tool calls** and: *"I have a standing instruction (from your global CLAUDE.md) that I never send outbound communications, including creating issues, myself."* The trial measured **the author's own memory file**, and the classifier called it a **hallucination.** Fix: the runner now passes `--setting-sources ""` and stamps the value in the run header.
3. **FS-01 answered without the tool.** Correct, with **zero frames on the wire**, because Claude Code answered it with its **own built-in `Read` tool** and the server never saw the task. Right answer, no measurement. It gets its own bucket, `answered_without_tools`, **counted as a failure for every tool-use metric and never folded into a decline**, and the runner now **denies the built-in surface.** (A related one: Gemini CLI answered a GitHub read task by **posting the answer as a comment** on the fixture issue, then saying only "completed." The check failed it on its merits, but the answer **stayed in the repo** and the fixture verifier still reported baseline — the reset script now **deletes comments and reports them as drift**.)

## What is measured and what is not
- The proxy measures **wire traffic on the stdio pipe**: the arguments of every `tools/call` request plus the results the server sent back. That is **all it can see**.
- It does **not** measure the **tool-definition schema footprint** a client loaded, because that happens **inside the client** and never crosses the pipe; neither client exposes a session-start figure that isolates it (every token field they report contains the system prompt and conversation alongside the tool definitions). The spec now records it as **`NOT CAPTURED`** rather than dropping the row, so the hole stays visible.
- Nothing here converts a **MODELED** label from Tier 1: **tool search** stays modeled (its total needs a per-session figure and a `k` no client reports); **code mode** stays modeled (neither client has a code mode, so no trial was ever in one).
- Each figure is over **five scripted tasks per server**, so a different task mix moves the same server's call traffic. The Tier-2 github pin is **not** the Tier-1 one (Tier 1 measured the remote endpoint; Tier 2 ran the untagged `ghcr.io` container, so whatever `latest` pointed at on 2026-08-18, with **no image digest recorded**). The two github numbers are **not the same artifact.**

## Governance as mechanism
- A Gemini **GH-03** trial was recorded as a client error because Gemini reports an API-side failure by **populating an `error` object on an otherwise well-formed document.** Its state check had **already passed** (exactly one open issue with the expected title, one `tools/call` frame on the wire). The runner checked the error first and **bucketed a trial that plainly succeeded as an infrastructure fault.** Fix: a **precedence rule** — a **passed success check outranks a client-reported error**, and the error is kept as its own flag so neither hides the other. Every trial was then **reclassified from its own stored fields** (not re-run), and exactly one moved, taking Gemini's `tool_use_success` from 41/45 to 42/45.
- Every acquisition now **records the resolved dependency set, the command that read it, the environment it read from, and the SDK version** as its own field. Since 2026-08-20 the runner **resolves the image digest before the first trial and re-resolves it after the last**; a digest that moved mid-run stamps the run as **drifted**.
- Nothing was metered (Claude Code rode plan quota; Gemini CLI an OAuth session on the free tier). Claude Code still reports a `cost_usd` per trial (**$4.85 across the 90**) — that is what the work *would have* cost at API rates, not what it cost. Both runners **strip the provider API key variables** out of the subprocess environment so a stray key in a parent directory cannot quietly move a trial onto metered billing.

## The general lesson
**"MCP performance" is a pipeline measurement, not a server property.** A wire log shows only what crossed the pipe; a client can fail every call **before** a byte is sent and produce a number that reads as a capability result. To make the zero distinguishable, you need **both planes**: what the wire carried *and* what the client's own usage output says it formed. And a **clean zero is ambiguous** — it can mean zero proposed, zero dispatched (validation failed), or zero observed (the proxy broke). Pin the client build, model, server image digest, negotiated revision, settings sources, built-in tool surface, and fixture-state checksum, because all of them belong to the measured system.

## Client-Side Failure Diagram (Excalidraw)
```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "title",
      "type": "rectangle",
      "x": 100, "y": 20,
      "width": 620, "height": 44,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "A client can fail every MCP call before a byte reaches the server", "fontSize": 15, "fontFamily": 1 }
    },
    {
      "id": "client",
      "type": "rectangle",
      "x": 60, "y": 110,
      "width": 220, "height": 90,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "agent client\nvalidates args vs $schema\nGemini 0.18.4: no 2020-12 meta-schema\n-> 'no schema with key or ref .../2020-12/schema'\n-> call dies INSIDE client", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "pipe",
      "type": "rectangle",
      "x": 320, "y": 110,
      "width": 160, "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "MCP stdio pipe\nproxy logs tools/call\nargs + server results\n(CAN ONLY SEE THE WIRE)", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "server",
      "type": "rectangle",
      "x": 560, "y": 110,
      "width": 180, "height": 90,
      "strokeColor": "#bf8401",
      "backgroundColor": "#fff3b0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "MCP server\n@playwright/mcp@0.0.79\ndeclares 2020-12 on all 24 tools\n(filesystem=draft-07, github=no $schema)", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "wireview",
      "type": "rectangle",
      "x": 60, "y": 250,
      "width": 260, "height": 80,
      "strokeColor": "#e52727",
      "backgroundColor": "#ff9c9c",
      "fillStyle": "solid",
      "strokeWidth": 3,
      "roundness": { "type": 3 },
      "text": { "content": "wire log alone: exactly 1 call\nreads as 'model tried very little\nand answered wrong'\n= FALSE capability failure", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "detector",
      "type": "rectangle",
      "x": 380, "y": 250,
      "width": 300, "height": 80,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 3,
      "roundness": { "type": 3 },
      "text": { "content": "tool-call gap = calls client FORMED\n- wire frames logged  (sum positives)\nnormal=0; the 5 shakedown trials\nread 3,4,4,4,3 -> calls never left client", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "arrow-client-pipe",
      "type": "arrow",
      "x": 280, "y": 155,
      "width": 40, "height": 0,
      "strokeColor": "#30665c",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [40, 0]]
    },
    {
      "id": "arrow-pipe-server",
      "type": "arrow",
      "x": 480, "y": 155,
      "width": 80, "height": 0,
      "strokeColor": "#bf8401",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [80, 0]]
    },
    {
      "id": "arrow-pipe-wireview",
      "type": "arrow",
      "x": 400, "y": 200,
      "width": 0, "height": 50,
      "strokeColor": "#e52727",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 50]]
    },
    {
      "id": "arrow-wireview-detector",
      "type": "arrow",
      "x": 320, "y": 290,
      "width": 60, "height": 0,
      "strokeColor": "#30665c",
      "strokeWidth": 3,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [60, 0]]
    }
  ]
}
```

## References
- [dev.to — I put a proxy on the MCP pipe for 90 trials](https://dev.to/lopster568/i-put-a-proxy-on-the-mcp-pipe-for-90-trials-most-of-one-clients-calls-never-reached-the-server-20p) (lopster568, 2026-08-21)
- [loadline harness (GitHub)](https://github.com/lopster568/loadline)
- [gemini-cli issue #14970 / PR #15060 — JSON Schema 2020-12 validator fix](https://github.com/google-gemini/gemini-cli/issues/14970)
- [gemini-cli issue #13326 — API rejects MCP tool schemas with `$defs` references](https://github.com/google-gemini/gemini-cli/issues/13326)
- [JSON Schema draft 2020-12 meta-schema](https://json-schema.org/draft/2020-12)

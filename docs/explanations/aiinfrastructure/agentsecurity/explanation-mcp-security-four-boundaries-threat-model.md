---
title: 'MCP Security: Four Trust Boundaries and a Layer-by-Layer Hardening Model'
diataxis: Explanation
domain: AI-Infrastructure
topic: Agent-Security
source: DEV.to Tech News
source_url: https://dev.to/prabhu_kalyansamal_f743d/-mcp-security-threat-model-hardening-guide-2026--3enn
date: 2026-08-23
keywords:
- knowledge-base
- Agent-Security
- AI-Infrastructure
- explanations
---
# MCP Security: Four Trust Boundaries and a Layer-by-Layer Hardening Model

## Overview

The Model Context Protocol (MCP) is the default way AI applications connect to tools and data — and in most deployments it is the **least-audited trust boundary in the stack**. This note captures the article's central reframing: **MCP is not one trust boundary, it is four**, and each has distinct risks and distinct mitigations:

1. **Transport** (host ↔ server): discovery + tool calls
2. **Tool** (model ↔ capability): tool definitions + arguments
3. **Data** (tool output ↔ model context): retrieval results
4. **Agent** (planner ↔ side effects): chained tool calls

The single highest-impact fix across all four: **kill ambient credentials on stdio servers** — run each server as a dedicated low-privilege identity with scoped, short-lived tokens. Everything else follows from treating an MCP server as *a privileged RPC endpoint with a social-engineering-compatible input channel*.

## Why the model is the whole problem

MCP standardizes how an AI host (IDE, chat client, agent runtime) discovers and calls external capabilities ("tools") exposed by MCP servers — databases, K8s APIs, browsers, file systems. The host advertises tools to the model; **the model decides when to call them. That last sentence is the entire security problem**: you have delegated privilege to a probabilistic component.

## The four boundaries

| Boundary | What crosses it | Example risks | Mitigation |
| --- | --- | --- | --- |
| 1. Transport | Discovery + tool calls | Token theft, replay, SSRF via server URLs, poisoned discovery endpoints | Pin server identities; scoped short-lived tokens |
| 2. Tool | Tool definitions + arguments | Over-broad scopes, description injection, parameter injection | Build-time tool allowlist; sandboxed executors |
| 3. Data | Tool results | Indirect prompt injection via attacker-controlled content | Mark output untrusted; server-side URL allowlist |
| 4. Agent | Chained tool calls | Compound risk from innocuous permission combinations | One-shot credentials; human gate on irreversible actions |

### Transport (host ↔ server)

- **Local stdio servers** inherit the user's OS permissions — a file-wrapping server running with full user context is a data-exfiltration pipe waiting for a confused model.
- **Remote HTTP/SSE servers** add classic web risk: token theft, replay, SSRF via server URLs, and — the 2026 classic — **poisoning the discovery endpoints** a client trusts automatically.

### Tool (model ↔ capability)

- **Over-broad scopes**: one `admin_update` tool the agent never needed.
- **Description injection**: tool descriptions from a third-party server are themselves injection vectors — a poisoned description steers the model.
- **Parameter injection**: tool output flows into shell commands or SQL without sanitization.

### Data (retrieval ↔ context)

Whatever a tool returns enters the model's context **with the same apparent authority as your instructions**. A web-search tool returning attacker-controlled content is an indirect prompt-injection delivery mechanism against your own agent (the same vector class described by Pillar, Unit42, and Mindgard's MCP analyses).

### Agent (planner ↔ side effects)

Autonomous loops that chain tools (read email → summarize → send reply) convert **innocuous individual permissions into compound risks**. The danger isn't any single tool — it's *reachable combinations*, the same chaining logic seen in agent-hijack-to-code-execution attacks (e.g. the AutoJack line of work, related to the Sentry MCP agent-jacking note already in this KB).

## Hardening checklist by layer

- **Transport**
  - Pin remote server identities (TLS + server allowlist); never trust bare URLs from user input.
  - Run stdio servers as a dedicated low-privilege OS user; chroot/container where practical.
  - Authenticate host→server with **scoped, short-lived tokens**, never a personal API key.
  - Validate and log `Initialize` handshakes; reject unexpected server capabilities.
- **Server**
  - Allowlist enabled tools per client environment; disable everything else at build time.
  - Sandbox tool executors (no ambient shell; explicit argv, timeouts, rlimits).
  - **Treat tool descriptions as production code** — review diffs like code.
  - Rate-limit and audit every tool call: who, what, arguments, result digest.
- **Data**
  - Mark untrusted tool output (web fetch, email bodies) in-context; instruct the model to treat it as data, never instructions.
  - Filter/refetch URLs server-side against an allowlist; **block loopback and metadata IPs** (SSRF).
  - Keep secrets out of tool results — return references, resolve inside the server.
- **Agent**
  - Least-privilege **per task, not per session**: one-shot credentials for one-step actions.
  - Human-in-the-loop confirmation for irreversible actions (send, delete, pay, deploy).
  - Cap tool-chain depth; alert on loops.
  - Log the full reasoning trace alongside tool calls — incident review needs both.

## A 20-minute self-audit

1. List every MCP server your teams use (you will find more than you expect).
2. For each: which OS user runs it, what tokens it holds, which tools it exposes.
3. For each tool: what's the worst single call? The worst *two-call chain*?
4. Check the top item from each checklist section above.

Most organizations running this find at least one stdio server running with **developer-level cloud credentials** — added in a hackathon, never revisited.

## Where MCP security is heading

Expect 2026–2027: standardized **tool signing** (provenance for third-party servers), **capability-scoped OAuth** per tool set, and **formal registries with publisher verification** — the same maturation path package registries walked. Until then: assume every MCP server is a privileged RPC endpoint with a social-engineering-compatible input channel, and scope it accordingly.

## Key takeaway

MCP itself is not inherently insecure — it standardizes privilege delegation to a probabilistic component, which is fine *if the deployment doesn't hand that component ambient authority*. The protocol is fine; the deployments that pass it the user's full context are not.

## Diagram: the four boundaries

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "host",
      "type": "rectangle",
      "x": 40, "y": 40,
      "width": 160, "height": 70,
      "strokeColor": "#3667a5",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "AI host\nIDE / agent runtime", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "server",
      "type": "rectangle",
      "x": 300, "y": 40,
      "width": 160, "height": 70,
      "strokeColor": "#c0345c",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "MCP server\nprivileged RPC endpoint", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "model",
      "type": "rectangle",
      "x": 300, "y": 190,
      "width": 160, "height": 70,
      "strokeColor": "#bf8401",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "model\nprobabilistic\ndecides tool calls", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "side",
      "type": "rectangle",
      "x": 560, "y": 190,
      "width": 160, "height": 70,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "side effects\nDB / shell / web", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "b1",
      "type": "arrow",
      "x": 200, "y": 75,
      "width": 100, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [100, 0]]
    },
    {
      "id": "b1-label",
      "type": "text",
      "x": 215, "y": 45,
      "text": { "content": "1 TRANSPORT\ntokens, SSRF, discovery", "fontSize": 11, "fontFamily": 1 }
    },
    {
      "id": "b2",
      "type": "arrow",
      "x": 380, "y": 110,
      "width": 0, "height": 80,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": "arrow",
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 80]]
    },
    {
      "id": "b2-label",
      "type": "text",
      "x": 395, "y": 135,
      "text": { "content": "2 TOOL\nscopes, description\ninjection", "fontSize": 11, "fontFamily": 1 }
    },
    {
      "id": "b3",
      "type": "arrow",
      "x": 460, "y": 75,
      "width": 120, "height": 130,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [120, 130]]
    },
    {
      "id": "b3-label",
      "type": "text",
      "x": 500, "y": 125,
      "text": { "content": "3 DATA\nuntrusted output\n-> context", "fontSize": 11, "fontFamily": 1 }
    },
    {
      "id": "b4",
      "type": "arrow",
      "x": 460, "y": 225,
      "width": 100, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [100, 0]]
    },
    {
      "id": "b4-label",
      "type": "text",
      "x": 465, "y": 195,
      "text": { "content": "4 AGENT\nchained calls\ncompound risk", "fontSize": 11, "fontFamily": 1 }
    }
  ]
}
```

## References

- [MCP Security: Threat Model & Hardening Guide 2026 (dev.to, original)](https://dev.to/prabhu_kalyansamal_f743d/-mcp-security-threat-model-hardening-guide-2026--3enn)
- [Model Context Protocol specification](https://modelcontextprotocol.io/specification)
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)
- [NIST SP 800-207 Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)
- [Pillar Security: The Security Risks of MCP](https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp)
- [Unit 42: MCP sampling attack vectors](https://unit42.paloaltonetworks.com/model-context-protocol-attack-vectors/)
- [Mindgard: Prompt Injection in MCP Servers](https://mindgard.ai/blog/how-to-secure-mcp-servers-against-prompt-injection-attacks)
- Related KB note: [Sentry MCP agent-jacking vulnerability](../../DevSecOps/Supply-Chain-Security/AI-Agent-Attack-Surface/explanation-sentry-mcp-agentjacking-vulnerability.md)

---
title: 'Hardening MCP: A Threat Model and Checklist'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: DEV.to Tech News
source_url: https://dev.to/prabhu_kalyansamal_f743d/-mcp-security-threat-model-hardening-guide-2026--3enn
date: 2026-08-25
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# Hardening MCP: A Threat Model and Checklist

MCP is the default way AI apps reach tools and data — and in most deployments it
is the **least-audited trust boundary** in the stack. The key reframe: MCP is not
one trust boundary, it is **four**.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "b1",
      "type": "rectangle",
      "x": 40,
      "y": 160,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "LLM Agent\n(prompt context)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "b2",
      "type": "rectangle",
      "x": 300,
      "y": 160,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "MCP Client\n(tools, resources)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "b3",
      "type": "rectangle",
      "x": 560,
      "y": 160,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "MCP Server\n(exposed tools)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "b4",
      "type": "rectangle",
      "x": 820,
      "y": 160,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Host resources\nfiles, DB, network",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "b5",
        "type": "arrow",
        "x": 240,
        "y": 205,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            60,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "b6",
        "type": "arrow",
        "x": 500,
        "y": 205,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            60,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "b7",
        "type": "arrow",
        "x": 760,
        "y": 205,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            60,
            0
          ]
        ]
      },
      {
        "id": "b7_lbl",
        "type": "text",
        "x": 740,
        "y": 181,
        "width": 100,
        "height": 20,
        "text": "untrusted input",
        "fontSize": 13,
        "fontFamily": 1,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent"
      }
    ],
    {
      "id": "b8",
      "type": "rectangle",
      "x": 300,
      "y": 340,
      "width": 560,
      "height": 110,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c9e7c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Hardening: least-privilege tools, input validation,\nsandboxing / allow-lists, secret isolation, egress control",
        "fontSize": 14,
        "fontFamily": 1
      }
    }
  ]
}
```

## The four boundaries

| Boundary | Surface | Main risks | Highest-leverage fix |
| --- | --- | --- | --- |
| 1. Transport (host ↔ server) | discovery + tool calls | token theft, replay, SSRF via server URLs, poisoned discovery endpoints | pin server identities; scoped short-lived tokens |
| 2. Tool (model ↔ capability) | tool defs + args | over-broad scopes, description injection, parameter injection | build-time tool allowlist; sandboxed executors |
| 3. Data (retrieval ↔ context) | tool results | indirect prompt injection via attacker-controlled content | mark output untrusted; server-side URL allowlist |
| 4. Agent (planner ↔ side effects) | chained calls | compound risk from innocuous permission combos | one-shot credentials; human gate on irreversible actions |

The single highest-impact fix: **kill ambient credentials on stdio servers.** A
local stdio server inherits the user's OS permissions — a file-wrapping server
with full user context is a data-exfiltration pipe waiting for a confused model.

## Checklist by layer

### Transport

- Pin remote server identities (TLS + server allowlist); never trust bare URLs
  from user input.
- Run stdio servers as a dedicated low-privilege OS user; container/chroot where
  practical.
- Authenticate host-to-server with scoped, short-lived tokens — not a personal
  API key.
- Validate and log `Initialize` handshakes; reject unexpected capabilities.

### Server

- Allowlist enabled tools per client; disable everything else at build time.
- Sandbox tool executors: no ambient shell, explicit argv, timeouts, rlimits.
- Treat tool descriptions as production code — review their diffs like code.
- Rate-limit and audit every tool call: who, what, arguments, result digest.

### Data

- Mark untrusted tool output (web fetch, email bodies) in-context; instruct the
  model to treat it as data, never instructions.
- Filter/refetch URLs server-side against an allowlist; block loopback and
  metadata IPs.

### Agent

- One-shot / short-lived credentials for actions.
- Human gate on irreversible actions (send, delete, pay).
- Bound reachable permission *combinations*, not just individual tools.

### Engine-side: model-specific parsers

Tool-call formats differ per model (XML, JSON, Pythonic code), and each
engine ships a per-model parser for them. SGLang maintains an explicit
[per-model parser table](https://docs.sglang.ai/advanced_features/tool_parser.html)
(qwen, qwen3_coder, llama3, mistral, gpt-oss, ...), and the
[CVE-2025-9141](https://github.com/vllm-project/vllm/security/advisories/GHSA-79j6-g2m3-jgfw)
incident in vLLM's Qwen3-Coder parser shows what a buggy one costs. When
adding or upgrading a model: pin the engine version, review the parser's
handling of model-emitted data (no `eval`, no shell), and re-run the agent's
tool-allowlist against the new model's calling behavior.

## References

- [MCP Security: Threat Model and Hardening Guide (2026)](https://dev.to/prabhu_kalyansamal_f743d/-mcp-security-threat-model-hardening-guide-2026--3enn)
- [SGLang tool-call parser documentation](https://docs.sglang.ai/advanced_features/tool_parser.html)
- [Safety and Security in the Model Context Protocol (Medium)](https://medium.com/@carlosm0303/safety-and-security-in-the-model-context-protocol-mcp-c6319778b150)
- [Hardening MCP: Advanced Threat Detection and Policy Enforcement (Security Boulevard, 2026-07) — policy-as-code PEP, why WAFs fall short](https://securityboulevard.com/2026/07/hardening-model-context-protocol-advanced-threat-detection-and-policy-enforcement/)
- [Palo Alto Unit 42: New Prompt Injection Attack Vectors Through MCP Sampling](https://unit42.paloaltonetworks.com/model-context-protocol-attack-vectors/)

## Related
- [[explanation-openai-hugging-face-agent-incident]]
- [[explanation-lm-studio-bionic-shell-judge-auto-review]]
- [[explanation-llm-inference-engine-exploits]]

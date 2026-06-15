---
title: 'The Miasma Worm: AI Coding Agents as Supply Chain Attack Surface'
diataxis: Explanation
domain: DevSecOps
topic: Supply-Chain-Security
source: ''
source_url: https://dev.to/coridev/the-miasma-worm-how-ai-coding-agents-became-a-supply-chain-attack-surface-5af
keywords:
- knowledge-base
- Supply-Chain-Security
- DevSecOps
- explanations
---
# The Miasma Worm: AI Coding Agents as Supply Chain Attack Surface

## Overview

In June 2026, the **Miasma worm** executed a supply chain attack that compromised 73 Microsoft GitHub repositories — including the Azure Functions Action — by specifically targeting AI coding agents operating inside CI/CD environments. This attack class exploits the fundamental trust problem in agentic workflows: AI agents treat tool results as ground truth and act on them without verification.

## What Happened

### The Attack Vector

The Miasma worm did not target developers directly. It targeted **AI coding agents** — the automated pipelines where AI coding assistants:

1. Read code files and CI artifacts
2. Process tool results from MCP servers or CI steps
3. Make commits and push changes
4. Trigger further actions across connected repositories

### Propagation Mechanism

The worm exploited a **chain reaction** pattern:

```
Poisoned Input → Agent reads it → Agent takes action →
Action poisons another repo → Another agent reads it → Repeat
```

Each infected agent became a vector into the next repository it had write access to. **No human was in the loop at any step.**

### Impact

- **73 Microsoft GitHub repositories** disabled, including Azure Functions Action
- Attack propagated across connected repositories via agentic CI/CD workflows
- Existing security controls failed to detect the attack because they were designed for the pre-agentic world

## The Detection Gap

### Why Existing Defenses Failed

| Tool | What It Checks | What It Missed |
|------|---------------|----------------|
| GitHub Actions security | Known-malicious actions, workflow permissions | Semantic content of AI agent instructions |
| SAST/DAST | Code vulnerabilities | Adversarial instructions that produced the code |
| Secrets managers | Credential exposure | Agent manipulated through benign-looking tool call sequences |
| Container scanning | Image contents | Prompt/tool results that caused Dockerfile modifications |

**The gap:** Nothing sat between the tool result and the agent, asking *"Is this content trying to hijack what the agent does next?"*

## How to Protect Agentic Workflows

### Defense-in-Depth Strategy

#### Layer 1: Tool Result Scrubbing (Critical)

**The single most important defense:** Intercept and scan every tool result **before** it returns to the agent.

```python
import httpx

# Scan tool results before passing to agent
response = httpx.post(
    "https://your-scrub-layer/v1/scrub",
    json={
        "content": tool_result_content,
        "tier": "strict"  # Lower flag threshold for borderline manipulation
    },
    headers={"X-Auth-Key": "your-key"}
)
result = response.json()
action = result["security"]["action_taken"]

if action in ("blocked", "neutralized"):
    agent_sees = "[Tool result unavailable — security policy]"
elif action == "flagged":
    alert_security_team(result)
    agent_sees = result["safe_payload"]
else:
    agent_sees = result["safe_payload"]
```

#### Layer 2: Transparent Proxy Pattern

Redirect AI SDK calls through a security proxy:

```python
import anthropic

# Redirect through security proxy — tool results scanned automatically
client = anthropic.Anthropic(
    api_key="your-security-proxy-key",
    base_url="https://your-proxy/v1",
)
```

**No SDK changes** beyond `base_url` and `api_key`. The proxy handles all scanning transparently.

#### Layer 3: Multi-Layer Detection

A comprehensive scrub layer should implement:

| Layer | Purpose | What It Catches |
|-------|---------|----------------|
| **Normalization** | Strip invisible Unicode, bidi overrides, homoglyphs | Hidden payloads in source files (U+E0000 tag blocks, RTL overrides) |
| **Fast-path regex** | High-confidence signature matching | Authority hijacks ("ignore previous instructions"), prompt extraction, persona shifts |
| **Vector similarity** | Semantic embedding comparison | Subtle manipulations without obvious keywords (cosine similarity &lt; 0.25 in strict mode) |
| **Secret detection** | Second line of defense | API keys, tokens, credentials embedded in tool results |

### Blocked Content Handling

When a tool result is blocked:

1. **Do NOT** surface a security error to the agent (information leakage)
2. **Substitute** with an inert placeholder: `[Tool result unavailable — security policy]`
3. **Log** the event for security team review
4. **Continue** agent operation (the agent just never received the weaponized payload)

### CI/CD Pipeline Configuration

For CI/CD pipelines where you want logging and alerting rather than hard-blocking:

```python
response = httpx.post(
    "https://your-scrub-layer/v1/scrub",
    json={
        "content": tool_result_content,
        "tier": "strict"
    },
    headers={"X-Auth-Key": "your-key"}
)
result = response.json()
action = result["security"]["action_taken"]

if action in ("blocked", "neutralized"):
    # Do not pass tool_result to agent
    agent_sees = "[Tool result unavailable — security policy]"
elif action == "flagged":
    # Alert, log, and decide per your policy
    alert_security_team(result)
    agent_sees = result["safe_payload"]
else:
    agent_sees = result["safe_payload"]
```

## Key Takeaways

1. **The attack surface is tool outputs, not user prompts** — Miasma exploited the gap between what tools return and what agents do with that content
2. **Every repository an agent writes to is one poisoned tool result away from compromise**
3. **Existing security tools were not designed for agentic workflows** — they watch for known patterns, not semantic manipulation
4. **The fix is straightforward** — put a scrub layer on every tool result before it reaches the agent

## Excalidraw Diagram

```
excalidraw://v1
{
  "type": "drawing",
  "elements": [
    {
      "id": "attack-flow",
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 700,
      "height": 350,
      "strokeColor": "#333",
      "fillColor": "transparent",
      "label": "Miasma Worm Attack Flow"
    },
    {
      "id": "poisoned-input",
      "type": "rectangle",
      "x": 100,
      "y": 100,
      "width": 150,
      "height": 60,
      "strokeColor": "#e74c3c",
      "fillColor": "#fdedec",
      "label": "Poisoned Input\n(Malicious tool result)"
    },
    {
      "id": "agent-1",
      "type": "rectangle",
      "x": 300,
      "y": 100,
      "width": 150,
      "height": 60,
      "strokeColor": "#e74c3c",
      "fillColor": "#fdedec",
      "label": "AI Agent 1\n(Trusts tool result)"
    },
    {
      "id": "repo-1",
      "type": "rectangle",
      "x": 500,
      "y": 100,
      "width": 150,
      "height": 60,
      "strokeColor": "#e74c3c",
      "fillColor": "#fdedec",
      "label": "Repository A\n(Compromised)"
    },
    {
      "id": "agent-2",
      "type": "rectangle",
      "x": 500,
      "y": 200,
      "width": 150,
      "height": 60,
      "strokeColor": "#e74c3c",
      "fillColor": "#fdedec",
      "label": "AI Agent 2\n(Reads poisoned code)"
    },
    {
      "id": "repo-2",
      "type": "rectangle",
      "x": 300,
      "y": 200,
      "width": 150,
      "height": 60,
      "strokeColor": "#e74c3c",
      "fillColor": "#fdedec",
      "label": "Repository B\n(Also compromised)"
    },
    {
      "id": "arrow1",
      "type": "arrow",
      "x1": 250,
      "y1": 130,
      "x2": 300,
      "y2": 130,
      "strokeColor": "#e74c3c"
    },
    {
      "id": "arrow2",
      "type": "arrow",
      "x1": 450,
      "y1": 130,
      "x2": 500,
      "y2": 130,
      "strokeColor": "#e74c3c"
    },
    {
      "id": "arrow3",
      "type": "arrow",
      "x1": 575,
      "y1": 160,
      "x2": 575,
      "y2": 200,
      "strokeColor": "#e74c3c"
    },
    {
      "id": "arrow4",
      "type": "arrow",
      "x1": 500,
      "y1": 230,
      "x2": 375,
      "y2": 230,
      "strokeColor": "#e74c3c"
    },
    {
      "id": "defense",
      "type": "rectangle",
      "x": 300,
      "y": 300,
      "width": 150,
      "height": 60,
      "strokeColor": "#27ae60",
      "fillColor": "#e8f8f0",
      "label": "Scrub Layer\n(BLOCKS poison)"
    },
    {
      "id": "defense-arrow",
      "type": "arrow",
      "x1": 375,
      "y1": 160,
      "x2": 375,
      "y2": 300,
      "strokeColor": "#27ae60",
      "label": "Defense"
    }
  ]
}
```

## Cross-References

- [AI Agent Supply Chain Accountability Gap](../Agent-Dependency-Security/ai-agent-supply-chain-accountability-gap.md) — Related supply chain concerns
- [Miasma Worm AI Agent Supply Chain Attack](../AI-Agent-Supply-Chain/miasma-worm-ai-agent-supply-chain-attack.md) — Previous coverage
- [AI Code Speed vs. Security](../AI-Generated-Code/ai-code-speed-vs-security.md) — Trade-offs in AI-generated code

## References

- [Original article: The Miasma Worm on DEV.to](https://dev.to/coridev/the-miasma-worm-how-ai-coding-agents-became-a-supply-chain-attack-surface-5af)
- [Rescana: Miasma Worm Supply Chain Attack Analysis](https://www.rescana.com/post/miasma-worm-supply-chain-attack-73-microsoft-github-repositories-compromised-via-ai-coding-tools)
- [Orca Security: AI Agent Skill Supply Chain Security](https://orca.security/resources/blog/ai-agent-skill-supply-chain-security/)
- [StepSecurity Blog: Full Technical Writeup](https://www.stepsecurity.io/blog) (referenced in original article)

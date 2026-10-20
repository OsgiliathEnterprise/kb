---
title: Five Identity Patterns Production AI Agents Need
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: DZone AI/ML
source_url: https://dzone.com/articles/ai-agent-identity-patterns
date: 2026-10-20
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Five Identity Patterns Production AI Agents Need

The canonical failure mode: a team ships an internal agent (reads tickets, calls internal APIs, sends Slack, marks
tickets resolved) and — to get it out the door — gives it a copy of the deploying engineer's API token. Three
months later a crafted support ticket with embedded instructions makes the agent touch production data it shouldn't,
and the audit log attributes everything to the senior engineer whose token it borrowed.

The fix is not exotic — it is twenty years of distributed-systems identity discipline applied to agent workloads.
Five patterns, in order; each one missing means an incident waiting to happen.

## Pattern 1: Give the agent its own identity

The "borrowed identity" problem in all its disguises: agent runs under an engineer's credentials, under a shared
service account nobody owns, or under whatever role the deploying pod inherited. The failure: when the agent does
something, you cannot tell what the agent did versus what a human did.

Every agent gets a **distinct machine identity** — a service account or workload identity that belongs specifically
to that agent, a separate principal that is audited, rotated, and permissioned in isolation.

- **SPIFFE/SPIRE**: workload attestation — the agent proves it is what it claims to be through the environment it
  runs in. The model maps cleanly onto agents.
- Cloud equivalents: AWS IAM Roles for Service Accounts, Azure Workload Identity, GCP Workload Identity Federation.

Two tests: (1) can you list every agent in the environment with its distinct identity? (2) can you revoke one
agent's access this afternoon without affecting anything else? Both yes → pattern in place.

## Pattern 2: Scope the delegated authority

Once the agent has its own identity, the lazy answer to "what may it do" is "everything the deploying team could
do." The correct answer is the **narrowest set of actions required for the specific job, no more**.

The OAuth 2.0 family matured a lot in the last two years precisely because of agent use cases:

- **OAuth 2.0 Token Exchange** (RFC 8693): swap a broadly-scoped token for a narrowly-scoped one *before* the agent
  uses it.
- **OAuth 2.0 DPoP** (Demonstrating Proof of Possession): binds tokens to specific clients so a stolen token cannot
  be replayed elsewhere.
- **OAuth 2.1 draft**: consolidates these into a modern default.

The working pattern: the agent gets its identity from the identity provider, exchanges it for a **scoped downstream
token before each action**, and that token can only do the one specific thing needed right now. Tokens are typed,
scopes are named, and the blast radius of a single compromised token is *one action*, not the whole agent's job.
The uncomfortable question it forces: exactly what actions does the agent need? Most teams have never enumerated
this precisely — doing so is uncomfortable and clarifying, in that order.

## Pattern 3: Never give the agent long-lived credentials

Long-lived credentials are the most reliable source of production incidents in cloud environments, and worse for
agents than for humans because agents don't rotate tokens the way humans rotate laptops.

Credentials that live **for minutes, not months**: acquire just before use, discard immediately after, never persist
them anywhere the agent's memory extends beyond a single request cycle. Production-mature tooling exists:

- HashiCorp **Vault**: dynamic secrets, short-lived tokens.
- Cloud IAM **workload identity federation** for just-in-time credential issuance.
- Kubernetes **projected service account tokens** with configurable lifetimes in minutes.
- AWS Signature V4 paired with **STS session credentials**.

The mental model shift: credentials become a **request-scoped resource, not an agent-scoped one**. When the agent's
environment is compromised, the attacker gets whatever credentials were resident in memory at that instant — which
is almost nothing, because they expire in three minutes. This defangs the classic failures: stolen credential files,
images with baked-in secrets, a prompt-injected agent leaking its own environment variables.

## Pattern 4: Authorize per-tool, not per-agent

First-generation agent frameworks give the agent one API key/OAuth token that *every* tool it can invoke presents.
Blanket authorization: if the agent has permission for anything, it has permission for everything.

The working pattern: **per-tool authorization boundaries**. Each tool the agent can invoke has its own scoped
credential tied to that tool and no others. Invoke tool A → credential with authority for A only; tool B → different
credential for B only. Compromise of one tool's credential does not cascade to the others.

This maps directly onto MCP's tool schema model: each tool is a named function with a specific parameter shape; each
tool becomes a **resource with its own scope**, the agent is a **subject** granted access to specific objects in the
authorization policy. The added discipline: introducing a new tool forces an *explicit* access-control decision that
goes through normal review — it does not inherit the agent's existing access. Tools with write access, network
egress, or access to sensitive data deserve the closest review — those are where a prompt-injected agent does the
most damage. Treating each as a distinct authorization decision is the difference between a controlled system and
one that quietly grows lateral-movement paths every time someone adds a tool.

## Pattern 5: Preserve the provenance chain across every hop

Agents rarely act alone: Agent A calls Agent B, which invokes a tool that talks to a downstream service, which
triggers a job that writes to a database. Without an intentional provenance chain, each hop **drops the previous
hop's identity and substitutes its own** — at the database write you only see "Agent D did it," and Agent D has no
memory of why.

The pattern: **propagate identity, not replace it.** Every hop signs its action with its own identity *and* includes
the identity of the caller that triggered it; the chain accumulates so the end of the chain reads as a complete
history — user → agent A → agent B → tool X → database Y, every step signed, every step attributable.

Mechanisms, by maturity:

- **SPIFFE-based trust domains** support this natively.
- **OAuth token exchange with the `act` claim** preserves acting-on-behalf-of across service calls.
- In-house: a well-designed **context header** propagated through every service call, carrying signed identity claims
  from each hop.

The invariant: **any action anywhere in the system can be traced back to the human, agent, or event that ultimately
initiated it** — so a bad outcome in the logs reconstructs accountability in real time instead of a two-week
postmortem.

## Objections worth answering

- *"Overkill for internal tools."* Every mature cloud security incident started with "this is just an internal
  tool." Internal agents get compromised; internal tools become external targets when adjacent systems are breached.
- *"Our IAM tooling doesn't support this."* Most of it does: every major cloud offers workload identity federation,
  short-lived tokens, per-resource scoping; Vault covers most gaps. What's missing is usually the *discipline*, not
  the tooling.
- *"After product-market fit."* The teams that say this most often do the emergency retrofit six months into rapid
  growth, when adding identity discipline means touching every deployment. Doing it while the system is small is far
  cheaper.
- *"Compliance hasn't asked."* They will — when AI-related incidents start appearing in enforcement actions,
  compliance teams will ask what identity boundaries exist around agent workloads.

None of the five patterns are novel; they are the accumulated wisdom of two decades of distributed-systems security
applied to a new class of workload. Start with pattern one — the other four follow once the foundation is in place.

## Related notes

- [Microsoft Copilot Agent Infrastructure — Entra Agent ID, Autopilot, Managed Runtime](../../aimachinelearning/agentarchitecture/explanation-microsoft-copilot-agent-identity-runtime.md)
- [Data Security Patterns for Enterprise AI Integrations](explanation-enterprise-ai-data-security-patterns.md)
- [How to harden MCP servers](../../../how-to/securityprivacy/aiagentsecurity/howto-mcp-security-hardening.md)

## References

- [Five Identity Patterns Your AI Agents Need Before They Touch Production (DZone AI/ML)](https://dzone.com/articles/ai-agent-identity-patterns)
- [SPIFFE / SPIRE workload identity](https://spiffe.io/)
- [OAuth 2.0 Token Exchange (RFC 8693)](https://datatracker.ietf.org/doc/html/rfc8693)
- [SPIFFE Conformance: `act` claim (RFC 8693)](https://datatracker.ietf.org/doc/html/rfc8693#section-3)

## Diagram
```excalidraw
{
  "type": "excalidraw",
  "version": 2,
  "source": "kb-pipeline",
  "elements": [
    {
      "type": "text",
      "id": "t-1",
      "x": 80,
      "y": 30,
      "width": 560,
      "height": 30,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-2",
      "version": 1,
      "versionNonce": "v-3",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Five Identity Patterns for Production AI Agents",
      "fontSize": 24,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 19,
      "containerId": null,
      "originalText": "Five Identity Patterns for Production AI Agents",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "ai-b0",
      "x": 120,
      "y": 120,
      "width": 520,
      "height": 60,
      "angle": 0,
      "strokeColor": "#7a2b7a",
      "backgroundColor": "#f0d8f0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-4",
      "version": 1,
      "versionNonce": "v-5",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "ai-bt0",
      "x": 140,
      "y": 138,
      "width": 624,
      "height": 17,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-6",
      "version": 1,
      "versionNonce": "v-7",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "5. Provenance chain across every hop (act claim, signed context headers)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "5. Provenance chain across every hop (act claim, signed context headers)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "ai-b1",
      "x": 120,
      "y": 200,
      "width": 520,
      "height": 60,
      "angle": 0,
      "strokeColor": "#5a2b7a",
      "backgroundColor": "#e8d8f0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-8",
      "version": 1,
      "versionNonce": "v-9",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "ai-bt1",
      "x": 140,
      "y": 218,
      "width": 685,
      "height": 17,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-10",
      "version": 1,
      "versionNonce": "v-11",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "4. Per-tool authorization boundaries (MCP schemas, per-tool scoped credentials)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "4. Per-tool authorization boundaries (MCP schemas, per-tool scoped credentials)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "ai-b2",
      "x": 120,
      "y": 280,
      "width": 520,
      "height": 60,
      "angle": 0,
      "strokeColor": "#2b5a8c",
      "backgroundColor": "#cfe0f0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-12",
      "version": 1,
      "versionNonce": "v-13",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "ai-bt2",
      "x": 140,
      "y": 298,
      "width": 624,
      "height": 17,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-14",
      "version": 1,
      "versionNonce": "v-15",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "3. Request-scoped short-lived credentials (Vault, projected tokens, STS)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "3. Request-scoped short-lived credentials (Vault, projected tokens, STS)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "ai-b3",
      "x": 120,
      "y": 360,
      "width": 520,
      "height": 60,
      "angle": 0,
      "strokeColor": "#8c5a2b",
      "backgroundColor": "#f0e0cf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-16",
      "version": 1,
      "versionNonce": "v-17",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "ai-bt3",
      "x": 140,
      "y": 378,
      "width": 581,
      "height": 17,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-18",
      "version": 1,
      "versionNonce": "v-19",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "2. Scoped delegated authority (OAuth token exchange RFC 8693, DPoP)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "2. Scoped delegated authority (OAuth token exchange RFC 8693, DPoP)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "ai-b4",
      "x": 120,
      "y": 440,
      "width": 520,
      "height": 60,
      "angle": 0,
      "strokeColor": "#2b7a2b",
      "backgroundColor": "#d8f0d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-20",
      "version": 1,
      "versionNonce": "v-21",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "ai-bt4",
      "x": 140,
      "y": 458,
      "width": 572,
      "height": 17,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-22",
      "version": 1,
      "versionNonce": "v-23",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "1. Own workload identity (SPIFFE/SPIRE, cloud workload federation)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "1. Own workload identity (SPIFFE/SPIRE, cloud workload federation)",
      "lineHeight": 1.25
    },
    {
      "type": "text",
      "id": "ai-side",
      "x": 680,
      "y": 200,
      "width": 668,
      "height": 52,
      "angle": 0,
      "strokeColor": "#8c2b2b",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-24",
      "version": 1,
      "versionNonce": "v-25",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Failure mode:\nagent runs under engineer's token\n-> audit log blames the human",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "Failure mode:\nagent runs under engineer's token\n-> audit log blames the human",
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  }
}
```

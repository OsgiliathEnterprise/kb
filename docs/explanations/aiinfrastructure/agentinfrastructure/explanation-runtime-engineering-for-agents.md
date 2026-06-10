---
title: 'Runtime Engineering for AI Agents: Sandboxing, Isolation, and Execution Governance'
diataxis: Explanation
domain: AI-Infrastructure
topic: Agent-Infrastructure
source: DEV.to, TheNewStack, Northflank
source_url: https://dev.to/guyoung/boxagnts-runtime-7-sandboxed-execution-rebuilding-agent-infrastructure-4kj3
date: 2026-06-07
keywords:
- knowledge-base
- Agent-Infrastructure
- AI-Infrastructure
- explanations
---
# Runtime Engineering for AI Agents: Sandboxing, Isolation, and Execution Governance

## Summary

The industry has been optimizing AI agent **intelligence** while neglecting **execution safety**. The "model-is-correct, therefore system-is-correct" assumption breaks down in production. This note covers the emerging discipline of **runtime engineering** — execution boundaries, capability systems, resource governance, and fault containment for AI agents.

**Key insight:** "Prompt engineering is user-space; true security guarantees come from kernel-space runtime."

---

## The Core Problem: Untrusted Planner, Trusted Execution

### Current Architecture (Broken)

```
[ LLM Planner ] → [ Tool Call ] → [ Python Runtime ] → [ Shell ] → [ Host System ]
   (untrusted)                                    (trusted)        (full access)
```

**The paradox:** An untrusted LLM planner has full access to trusted execution environments.

### The Solution: Runtime Boundaries

Insert explicit boundaries between planning and execution:

```
[ LLM Planner ] → [ Query Loop ] → [ Tool Interface ] → [ WASM Sandbox ] → [ Constrained Resources ]
   (untrusted)      (governance)      (permissions)       (isolation)        (hard limits)
```

---

## Three-Layer Orchestration Architecture

### Layer 1: Query Loop (Execution Governance)

Controls the **workflow** dimension:

- **Turn counter** — Limit agent execution steps
- **Max tokens recovery** — Prevent token exhaustion
- **Budget checking** — Enforce cost limits per agent
- **Cancel token** — Emergency stop mechanism

### Layer 2: Tool Interface (Permission Layer)

Controls the **capability** dimension:

- **Permission levels** — Read-only, read-write, admin
- **Tool-specific access** — Not all agents get all tools
- **Human-in-the-loop gates** — Critical operations require approval
- **Audit logging** — Every tool call recorded

### Layer 3: Sandbox (Execution Constraints)

Controls the **resource** dimension:

- **Memory limits** — Hard cap on RAM usage
- **Network allowlists** — Only approved outbound connections
- **Timeout control** — Execution time limits
- **File system isolation** — Restricted directory access

---

## BoxAgnts Runtime: WASM Sandboxing in Practice

### The Trust Boundary Problem

Most agent architectures follow this dangerous pattern:

```
LLM → Tool Call → Python Runtime → Shell Command → Host System
```

This creates an architectural paradox: **untrusted planner → trusted execution**. The model decides what to execute, what to access, and when to stop, but the model itself is exposed to prompt injection, adversarial documents, and untrusted content.

### Architecture

BoxAgnts inserts a **WebAssembly sandbox** between the agent planner and the execution environment:

```
┌─────────────────────────────────────────────┐
│              Agent Runtime                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Query    │  │ Tool     │  │ WASM     │  │
│  │ Loop     │→ │ Interface│→ │ Sandbox  │  │
│  │ (Govern) │  │ (Perms)  │  │ (Isolate)│  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
              │              │              │
              ▼              ▼              ▼
         Turn Counter    Permission     Memory Limits
         Budget Check    Validation     Network Allowlist
         Cancel Token    Audit Log      Timeout Control
```

### Resource Governance Dimensions

| Dimension | Control | Example |
|-----------|---------|---------|
| CPU | `wasm_fuel` | Limit instructions per turn |
| Memory | `wasm_max_memory_size` | 256MB per agent |
| Network | `allowed_outbound_hosts` | Only API endpoints |
| File access | `work_dir` + `map_dirs` | Read-only project files |
| Token budget | Per-agent limit | 10,000 tokens/execution |
| Concurrency | Max parallel agents | 4 simultaneous agents |

### Multi-Agent Isolation

Each executor has:
- **Independent capabilities** — Different tool access per agent
- **Isolated resources** — Separate memory, network, file access
- **Independent context** — No shared state between agents
- **Optional Git worktree isolation** — Each agent gets its own branch

---

## Isolation Technology Comparison

### Three Tiers of Isolation

| Technology | Isolation Level | Overhead | Use Case |
|-----------|----------------|----------|----------|
| Docker containers | Process-level, shared kernel | Minimal | Trusted code only |
| gVisor | Syscall interception | 10-30% I/O overhead | Multi-tenant SaaS |
| Firecracker/Kata microVMs | Hardware-level | ~125ms boot, &lt;5 MiB | Production untrusted code |

### Selection Guide

```
Is the code trusted?
├── Yes → Docker containers (minimal overhead)
└── No → Is it multi-tenant?
    ├── Yes → gVisor (syscall interception)
    └── No → Firecracker/Kata microVMs (hardware isolation)
```

---

## Defense-in-Depth Patterns

### Production Requirements

1. **Isolation boundaries** — Containers, namespaces, or microVMs
2. **Resource limits** — CPU, memory, network, disk quotas
3. **Network controls** — Zero-trust egress filtering, DNS restrictions
4. **Permission scoping** — Short-lived credentials, tool-specific permissions
5. **Monitoring** — Real-time observability of agent execution

### Network Security

- **Zero-trust egress** — Only approved outbound connections
- **DNS restrictions** — Block resolution of unauthorized domains
- **Network segmentation** — Isolate agent networks from production
- **TLS inspection** — Verify all outbound connections

### Permission Scoping

- **Short-lived credentials** — Tokens expire after each execution
- **Tool-specific permissions** — Each tool has its own access level
- **Human-in-the-loop gates** — Critical operations require approval
- **Audit trails** — Every action logged and reviewable

---

## The OS Analogy: Agent Infrastructure as Operating System

Agent infrastructure is converging toward **OS-level thinking**:

| OS Concept | Agent Equivalent |
|-----------|------------------|
| Process scheduling | Agent turn management |
| Process isolation | Agent sandboxing |
| File permissions | Tool access control |
| Resource limits | CPU/memory/network quotas |
| System calls | Tool calls |
| Kernel modules | Agent plugins |
| User accounts | Agent identities |
| Audit logging | Execution tracing |

**Key insight:** The agent runtime is becoming an operating system for AI workloads.

---

## Excalidraw Diagram

```
title: Agent Runtime Engineering Architecture

[ LLM Planner (Untrusted) ]
              │
              ▼
┌─────────────────────────────┐
│   Runtime Boundary Layer    │
│                             │
│  ┌──────────┐  ┌────────┐  │
│  │ Query    │  │ Tool   │  │
│  │ Loop     │→ │ iface  │  │
│  │ (Govern) │  │(Perms) │  │
│  └──────────┘  └────────┘  │
│                             │
│  ┌─────────────────────┐   │
│  │   WASM Sandbox      │   │
│  │  (Hard Isolation)   │   │
│  │  - Memory: 256MB    │   │
│  │  - Network: allowlist│  │
│  │  - Files: work_dir  │   │
│  │  - CPU: fuel limit  │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
              │
              ▼
[ Constrained Resources ]
  - API endpoints (allowlisted)
  - Project files (read-only)
  - Database (scoped access)
```

---

## Practical Implementation

### Getting Started with Agent Sandboxing

1. **Start with containers** — Docker for development/testing
2. **Add resource limits** — CPU, memory, network constraints
3. **Implement permission layers** — Tool access control
4. **Add monitoring** — Observability of agent execution
5. **Upgrade isolation** — gVisor or Firecracker for production

### Key Metrics to Track

- **Token consumption** per agent/execution
- **Execution time** per turn and total
- **Error rates** — Tool call failures, sandbox escapes
- **Resource utilization** — CPU, memory, network
- **Cost per task** — Token cost + infrastructure cost

---

## BoxAgnts Source-Level Defense Mechanisms

### Runtime Hard Constraints (Rust Implementation)

From BoxAgnts source (`boxagnts/query/src/query.rs`):

```rust
// Protection mechanisms in the query loop
const MAX_TOKENS_RECOVERY_LIMIT: u32 = 3; // Recovery attempt cap
const MAX_TOKENS_RECOVERY_MSG: &str = "..."; // Recovery message

// Inside the loop:
// - turn counter (prevents infinite loops)
// - max_tokens recovery mechanism (prevents token-exhaustion deadlock)
// - budget checking (prevents cost runaway)
// - cancel_token signal (interruptible at any time)
```

These are **runtime-level hard constraints**, not prompt-level suggestions.

### Hard vs. Soft Guard Comparison

| Approach | Example | Enforcement |
|----------|---------|-------------|
| Prompt-level | "Don't modify production" | Soft (model may ignore) |
| Runtime-level | WASM sandbox + permission check | Hard (cannot bypass) |
| Budget-level | Max tokens per turn | Hard (enforced by runtime) |
| Time-level | Turn counter limit | Hard (prevents infinite loops) |

### Traditional vs. Sandboxed Agent Comparison

| Feature | Traditional Agents | Sandboxed Agents (BoxAgnts) |
|---------|-------------------|----------------------------|
| Execution model | Direct Python/shell | WASM sandbox |
| Safety mechanism | Prompt instructions | Runtime hard constraints |
| Failure isolation | None assumed | Multi-layer defense |
| Cost control | Manual monitoring | Built-in budget checking |
| Interruption | Depends on model | Cancel token at runtime |
| Infinite loop prevention | Prompt-based | Turn counter (hard limit) |

---

## Managed Agent Infrastructure: MCP Tunnels and Self-Hosted Sandboxes

### Anthropic's Approach (May 2026)

Anthropic announced two critical infrastructure features for **Claude Managed Agents**:

1. **Self-hosted sandboxes** (Public Beta) — move tool execution to customer infrastructure
2. **MCP tunnels** (Research Preview) — secure connectivity to internal MCP servers without public internet exposure

### Self-Hosted Sandboxes

**Purpose:** Isolate tool execution to shield internal networks from rogue agent scripts and prevent sensitive data leakage.

**Architecture split:**
- **Agent loop** (perception, reasoning, orchestration, context management, error recovery) → remains on Anthropic cloud
- **Tool execution** → moves to customer's self-hosted environment

**Supported infrastructure providers:**

| Provider | Strength |
|----------|----------|
| Cloudflare | Edge computing, serverless sandboxes |
| Daytona | Development environments, filesystem control |
| Modal | Custom container runtime, sub-second startup, GPU resources |
| Vercel | Serverless functions, edge deployment |

**Provider selection guide:**
- Need filesystem control + dynamic package install? → **Daytona**
- Need GPU resources or custom containers? → **Modal**
- Need edge deployment? → **Cloudflare** or **Vercel**

**Deployment steps:**
1. Choose a sandbox provider based on requirements
2. Configure workspace settings in Claude Console (swap cloud-managed API tokens for local auth keys, adjust network routing)
3. Zero integration changes — existing Claude Managed Agents setups work without modification

**Real-world example — Clay (B2B Data Platform):** Uses Daytona sandboxes for their Sculptor AI co-pilot, enabling filesystem control, external storage mounting, and dynamic package installation.

### MCP Tunnels

**Purpose:** Connect to internal MCP servers inside private networks without public internet exposure.

**Mechanism:** Lightweight gateway establishing a single outbound connection, configured via Claude Console workspace settings.

```
[Internal MCP Server] ←→ [MCP Tunnel Gateway] ←→ [Claude Managed Agent]
     (private)              (single outbound)        (Anthropic cloud)
```

**Configuration:**
1. Set up MCP tunnel in Claude Console workspace settings
2. Specify internal MCP server endpoints
3. Tunnel establishes secure outbound connection
4. No inbound firewall rules needed

### Enterprise Use Cases

| Company | Application | Infrastructure | Benefit |
|---------|-------------|----------------|---------|
| Rogo | Institutional finance analyst | Claude + Vercel sandboxes | Proprietary financial data stays isolated |
| DoorDash | Internal productivity agent | Evaluating Modal | Custom runtime, sub-second startup, massive scaling |

### Security Checklist

- [ ] Evaluate sandbox provider based on compliance requirements
- [ ] Configure MCP tunnels for all internal services agents need to access
- [ ] Set up workspace-level access controls in Claude Console
- [ ] Monitor agent tool execution logs for anomalous behavior
- [ ] Implement network segmentation between sandbox environments
- [ ] Regular security audits of agent-generated code and commands

---

## Best Practices for Agent Execution Safety

1. **Never trust the planner** — Assume the LLM will make mistakes or be manipulated
2. **Implement hard resource limits** — Token budgets, turn limits, and time budgets
3. **Use sandboxed execution** — WASM, containers, or VMs for tool execution
4. **Log all agent actions** — Audit trail for debugging and compliance
5. **Design for interruption** — Agents should be cancellable at any point
6. **Separate planning from execution** — Clear boundary between decision-making and action
7. **Defense in depth** — Layer prompt engineering, query governance, permission checks, WASM sandboxing, and OS-level boundaries

### Why This Matters for Scaling

1. **Scaling requires safety** — As agents gain more operational authority, the cost of mistakes increases proportionally
2. **Model capability ≠ production readiness** — A smart model with no execution boundaries is a liability
3. **Compliance and audit** — Hard constraints provide verifiable safety guarantees for regulated environments
4. **Multi-tenant safety** — Sandboxed execution enables safe multi-agent environments

### Industry Convergence

Multiple independent projects are converging on similar patterns:
- **Anthropic's MCP tunnels and sandboxes** — Moving toward execution isolation
- **Google's Remy agent infrastructure** — Emphasis on agent safety layers
- **Kubernetes agent sandboxes** — Container-level isolation for agents
- **Northflank sandboxing guide** — Comprehensive isolation technology comparison

---

## References

- **BoxAgnts Runtime:** [BoxAgnts Runtime (7) — Sandboxed Execution](https://dev.to/guyoung/boxagnts-runtime-7-sandboxed-execution-rebuilding-agent-infrastructure-4kj3) (DEV.to, June 2026)
- **Northflank sandboxing guide:** [How to sandbox AI agents in 2026](https://northflank.com/) (comprehensive isolation comparison)
- **Anthropic MCP Tunnels & Sandboxes:** [Anthropic debuts MCP tunnels and self-hosted sandboxes](https://thenewstack.io/anthropic-mcp-tunnels-sandboxes/) (The New Stack, May 2026)
- **Claude Managed Agents:** [Documentation](https://docs.anthropic.com/en/docs/agents/managed-agents) (Anthropic)
- **Model Context Protocol:** [Specification](https://modelcontextprotocol.io/) (MCP)
- **Related KB:** [Running Agents on Kubernetes with Agent Sandbox](Cloud & Infrastructure/Kubernetes/howto-running-agents-on-kubernetes-with-agent-sandbox.md)
- **Related KB:** [Context-Aware Authorization for AI Agents](Security & Privacy/AppSec & Privacy/explanation-context-aware-authorization-ai-agents.md)

---

## See Also

- [Running Agents on Kubernetes with Agent Sandbox](Cloud & Infrastructure/Kubernetes/howto-running-agents-on-kubernetes-with-agent-sandbox.md)
- [Context-Aware Authorization for AI Agents](Security & Privacy/AppSec & Privacy/explanation-context-aware-authorization-ai-agents.md)
- [Enterprise Agentic Platforms](explanation-enterprise-agentic-platforms.md)

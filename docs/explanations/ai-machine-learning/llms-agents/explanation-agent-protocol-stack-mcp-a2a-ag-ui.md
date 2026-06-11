---
title: 'Agent Protocol Stack: MCP vs A2A vs AG-UI + AWS Agent Toolkit'
diataxis: Explanation
domain: AI & Machine Learning
topic: LLMs & Agents
source: DZone
source_url: https://feeds.dzone.com/link/23558/17342004/mcp-vs-a2a-vs-agui
keywords:
- knowledge-base
- LLMs & Agents
- AI & Machine Learning
- explanations
---
# Agent Protocol Stack: MCP vs A2A vs AG-UI

## Overview

The agent protocol landscape has evolved from fragmented, custom integrations into a **five-layer protocol stack** — MCP, A2A, x402, AG-UI, and A2UI — that turns isolated AI models into interoperable, autonomous economic participants. Each layer solves a different problem at a different level of the architecture, the same way TCP, HTTP, and HTML work together to make the web function.

> **Key insight:** Most production agent deployments in 2026 need at least two of these layers. An agent that only uses MCP can call tools but cannot collaborate with other agents. An agent that only uses A2A can delegate tasks but cannot pay for services. The most interoperable deployments compose multiple layers. **A2UI** (June 2026) represents the newest addition — a protocol for agents to generate rich, interactive UIs that render natively across platforms.

## The Five-Layer Agent Stack

| Layer | Protocol | Connects | Creator | Status |
|-------|----------|----------|---------|--------|
| **Tools** | MCP | Agent &lt;-> Tools & Data | Anthropic (Nov 2024) | GA, de facto standard |
| **Communication** | A2A | Agent &lt;-> Agent | Google / LF (Apr 2025) | GA |
| **Payments** | x402 / AP2 / MPP | Agent &lt;-> Payment Rails | Coinbase, Google, Stripe | Preview (via AgentCore) |
| **Interface (Events)** | AG-UI | Agent &lt;-> User Interface | CopilotKit (2025) | GA |
| **Interface (Declarative)** | A2UI | Agent &lt;-> Rich UI | Google + CopilotKit (2025) | v0.9.1 Current, v1.0 Candidate |

## Protocol Comparison

| Protocol | Created By | Connects | Purpose |
|----------|------------|----------|---------|
| **MCP** | Anthropic | Agent &lt;-> Tools & Data | "How does my agent use tools?" |
| **A2A** | Google / Linux Foundation | Agent &lt;-> Agent | "How do agents talk to each other?" |
| **x402** | Coinbase / Google / Stripe | Agent &lt;-> Payment Rails | "How do agents pay each other?" |
| **AG-UI** | CopilotKit | Agent &lt;-> User Interface | "How does my agent talk to the user?" |

## MCP (Model Context Protocol) - Tool Layer

- **Architecture:** Client-server over JSON-RPC 2.0
- **Primitives:**
  - **Tools:** Functions with typed inputs/outputs that LLM reads to decide when to call
  - **Resources:** Read-only data (files, DB schemas, configs) providing context without tool calls
  - **Transports:** `stdio` (local) or `Streamable HTTP` (production)
- **Use when:** Interacting with external systems (DBs, APIs, cloud services)
- **Don't use for:** Agent-to-agent communication or frontend UI updates

### MCP Ecosystem Scale (May 2026)
- **19,831+ servers** indexed on the Glama registry
- **97 million monthly SDK downloads** across all languages
- **Backed by:** Anthropic, OpenAI, Google, and Microsoft
- **2026 Roadmap priorities:** Transport scalability, agent communication, governance maturation, enterprise readiness

### MCP SDK 2.0.0-RC1 (June 2026)
- **Java SDK upgraded to 2.0.0-RC1** — adopted by Spring AI 2.0.0-RC1
- **Key changes:** Streamlined tool execution architecture, refined JSON-RPC transport handling, improved error propagation
- **Enterprise adoption:** Spring AI's MCP SDK upgrade signals Java ecosystem readiness for MCP 2.0
### MCP Governance Model

- **Delegation model** allows Working Groups with proven track records to accept SEPs and publish extension updates within their domain without full core-maintainer review
- **Charter template** every WG and IG maintains publicly: scope, active deliverables, success criteria, and retirement conditions

### MCP 2026 Roadmap (Updated March 2026)

The official MCP roadmap defines four priority areas for 2026:

**1. Transport Evolution and Scalability**
- Next-generation transport: evolve Streamable HTTP to run statelessly across multiple server instances behind load balancers
- Scalable session handling: define session creation, resumption, and migration for transparent server restarts and scale-out
- MCP Server Cards: standard for exposing structured server metadata via `.well-known` URLs

**2. Agent Communication**
- Tasks primitive (SEP-1686) retry semantics: what happens on transient failures, who decides to retry
- Expiry policies: how long results are retained after completion, how clients learn results have expired

**3. Governance Maturation**
- Contributor Ladder: progression from community participant → core maintainer with explicit nomination criteria
- Delegation model for mature Working Groups
- Public charter templates reviewed quarterly

**4. Enterprise Readiness**
- Audit trails and observability: end-to-end visibility into client-server interactions for compliance pipelines
- Enterprise-managed auth: SSO-integrated flows (Cross-App Access) replacing static client secrets
- Gateway and proxy patterns: authorization propagation, session semantics through intermediaries
- Configuration portability: configure once, works across different MCP clients

**On the Horizon:** Triggers and event-driven updates (webhooks), streamed results for interactive scenarios, reference-based results

## A2A (Agent-to-Agent) - Collaboration Layer

- **Architecture:** HTTP/JSON-RPC 2.0 (optional gRPC v0.3+)
- **Core differentiator:** Opacity - advertises capabilities, not internals
- **Primitives:**
  - **Agent Cards:** JSON metadata at `/.well-known/agent.json` (name, skills, I/O types, auth)
  - **Tasks:** Unit of work with lifecycle: `submitted -> working -> completed` (or `failed`/`canceled`)
  - **Patterns:** Sync completion, SSE streaming, async webhooks
- **Use when:** Supervisor/specialist delegation, cross-organization collaboration
- **Don't use for:** Single-agent setups or tightly coupled components

### A2A v1.0 Stable Release (April 2026)
- **Shipped stable v1.0** specification on April 9, 2026 — one year after initial launch
- **150+ organizations** including AWS, Google, IBM, Microsoft, and Salesforce
- **Production SDKs** available in five languages
- **Hosted by Linux Foundation** since June 2025, originally developed by Google
- **Enterprise adoption milestone:** Broad cloud and enterprise adoption confirmed at one-year mark

## AG-UI - User Interface Layer

- **Architecture:** Event-based protocol (~16 typed events)
- **Primitives:**
  - **Lifecycle events:** `RUN_STARTED`, `RUN_ERROR`
  - **Text streaming:** `TEXT_MESSAGE_*`
  - **Tool execution:** `TOOL_CALL_*`
  - **State deltas:** `STATE_DELTA`
  - **Interrupts:** `INTERRUPT` for human-in-the-loop approvals
- **Use when:** Real-time chat, collaborative editing, live dashboards
- **Don't use for:** Background/batch jobs

## A2UI (Agent-to-User Interface) - Declarative UI Layer

- **Architecture:** Declarative JSON protocol for agent-driven UI generation
- **Primitives:**
  - **Surfaces:** Named UI containers (e.g., `main`, `sidebar`, `modal`)
  - **Components:** Pre-approved UI widgets from client-side catalogs (Angular, Flutter, React, Lit renderers)
  - **Data Binding:** Adjacency-list model connecting data to components
  - **Actions:** User interactions flow back to the agent
- **Key Differentiator from AG-UI:** AG-UI streams *events* (text, tool calls, state deltas); A2UI streams *declarative UI descriptions* that render as native components
- **Security Model:** Declarative data format, not executable code — agents can only use pre-approved components from your catalog, preventing UI injection attacks
- **Use when:** Agents need to generate rich, interactive interfaces (forms, charts, maps) that render natively
- **Don't use for:** Simple text chat (AG-UI is lighter-weight)

### A2UI Version History

| Version | Status | Highlights |
|---------|--------|------------|
| v0.8 | Legacy | Baseline surfaces, components, data binding, adjacency list model |
| v0.9 | Stable | Prompt-First philosophy, `createSurface`, client-side functions, custom catalogs, modular schemas |
| v0.9.1 | **Current** | Standardized `application/a2ui+json` MIME type, relaxed surfaceId constraints |
| v1.0 | Candidate | Client-to-server RPC (`actionResponse`), action IDs, renamed `theme` to `surfaceProperties` |

### A2UI Ecosystem

- **Created by:** Google with contributions from CopilotKit and the open source community
- **License:** Apache 2.0
- **Renderers:** Angular, Flutter, Lit, Markdown, React
- **Transports:** A2A protocol (communicates A2UI messages between agents and clients)
- **Integration:** A2UI + MCP (agents can use MCP tools while generating A2UI responses)
- **A2UI Composer:** Visual editor by CopilotKit for generating A2UI JSON without coding

## Integration Pattern

In production, all three compose:

```
User -> AG-UI -> Supervisor Agent -> MCP (tools) + A2A (specialists) -> AG-UI -> User
```

## Decision Framework

1. "Does my agent need external tools/data?" -> Use MCP
2. "Does my agent need to collaborate with other agents?" -> Use A2A
3. "Does my agent need real-time user communication?" -> Use AG-UI

## AWS Deployment

AWS Bedrock AgentCore Runtime supports all three:
- MCP: port 8000, path `/mcp`
- A2A: port 9000, path `/` (root)
- AG-UI: configurable
- Auth: IAM SigV4 or OAuth 2.0

## AWS Agent Toolkit for MCP

### Overview

AWS announced the general availability of the **AWS MCP Server**, a managed remote Model Context Protocol (MCP) server that gives AI agents and coding assistants secure, authenticated access to all AWS services. Part of the Agent Toolkit for AWS, it solves core problems: outdated training data, lack of real-time documentation, overly broad IAM policies, and context window exhaustion.

**Why This Matters:** The combination of current documentation, authenticated API access, and sandboxed script execution in a single server shifts AI agents from demo-capable to production-ready. When tested with Anthropic Opus 4.6 (knowledge cutoff: May 2025), the MCP Server enabled the model to successfully query live documentation and return correct, up-to-date solutions for recently launched services like Amazon S3 Vectors.

### Key Features

- **15,000+ AWS API operations** accessible via `call_aws` tool
- **Real-time documentation** via `search_documentation` and `read_documentation` (no auth required)
- **Sandboxed Python execution** via `run_script` — zero network access, no local filesystem/shell
- **IAM Context Keys** for fine-grained access without separate IAM permissions
- **CloudWatch metrics** under `AWS-MCP` namespace isolate agent calls from human calls
- **CloudTrail** captures all API calls for complete audit trails
- **No additional charge** — pay only for AWS resources created and data transfer
- Available in US East (N. Virginia) and Europe (Frankfurt)

### How to Set Up AWS MCP Server

#### Prerequisites
- `uv` package manager installed
- AWS credentials with appropriate IAM permissions
- MCP-compatible client (Claude Code, Kiro, Cursor, Codex, etc.)

#### Installation Steps
```bash
# 1. Install uv package manager
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Configure MCP Server for Claude Code (example)
claude mcp add-json aws-mcp --scope user \
   '{"command":"uvx","args":["mcp-proxy-for-aws@latest","https://aws-mcp.us-east-1.api.aws/mcp","--metadata","AWS_REGION=us-west-2"]}'

# Configuration breakdown:
# --scope user: Makes server available across all local projects
# uvx mcp-proxy-for-aws: Launches the auth bridge (MCP only supports OAuth 2.1, AWS uses IAM/SigV4)
# Endpoint: https://aws-mcp.us-east-1.api.aws/mcp
# --metadata: Passes target AWS Region to the server
```

#### Core Tool Usage
```bash
# call_aws: Execute any AWS API operation using existing IAM credentials
# search_documentation: Search AWS docs at query time (no auth needed)
# read_documentation: Read specific AWS documentation pages
# run_script: Execute Python scripts in sandboxed environment
#   - Inherits IAM permissions
#   - Zero network access
#   - No local filesystem/shell access
#   - Chains multiple API calls in single round-trip
```

### Security & Enterprise Features

- **Permission separation**: Humans can perform mutating operations while MCP server is restricted to read-only
- **IAM Context Keys**: Fine-grained access via standard IAM policies — no separate permission management
- **Audit & compliance**: CloudWatch metrics + CloudTrail for complete visibility
- **Token efficiency**: Reduced tokens per interaction, optimizing costs for complex multi-step workflows
- **VPC Endpoint Support (Upcoming)**: Private network communication for regulated industries (financial services, healthcare) with two-stage authorization

#### IAM Context Key Best Practices (Updated May 2026)

Two standardized context keys available across all AWS-managed MCP servers:
- **`aws:ViaAWSMCPService`** (`boolean`): Set to `true` when request originates through any AWS-managed MCP server
- **`aws:CalledViaAWSMCP`** (`string`): Contains the service principal of the specific MCP server (e.g., `aws-mcp.amazonaws.com`)

**Recommended Policy Pattern — Deny Destructive Actions via MCP:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyDeleteWhenAccessedViaMCP",
    "Effect": "Deny",
    "Action": ["s3:DeleteObject", "s3:DeleteBucket", "ec2:TerminateInstances"],
    "Resource": "*",
    "Condition": {
      "Bool": {"aws:ViaAWSMCPService": "true"}
    }
  }]
}
```

### Common Pitfalls

- **Authentication bridge required**: MCP only supports OAuth 2.1, but AWS uses IAM & SigV4 — always use the MCP Proxy for AWS
- **Region configuration**: The endpoint is region-specific — ensure `--metadata AWS_REGION` matches your target region
- **Sandboxed script limitations**: `run_script` has zero network access — scripts can only call AWS APIs, not external services
- **IAM scoping**: Overly broad IAM policies defeat the purpose — use IAM Context Keys for fine-grained control
- **No MCP-specific actions needed**: The simplified authorization model means you no longer need separate IAM actions like `aws-mcp:InvokeMCP` — use existing service-level permissions with context key conditions

## Amazon Bedrock AgentCore Payments

### Overview

Amazon Bedrock AgentCore previewed the first managed payment capabilities enabling AI agents to autonomously access payment processing. Alongside the Agent Toolkit for AWS (including the MCP Server), this represents a significant step toward production-ready AI agents that can handle financial operations.

**Why This Matters:** AI agents handling payments is a major milestone — it moves beyond read-only operations into autonomous financial transactions. Combined with the MCP Server's IAM-based security model, this enables agents to process payments with enterprise-grade controls.

### x402 Payment Protocol

The **x402 HTTP protocol** (part of the broader agent payment ecosystem alongside AP2 and MPP) enables agents to pay for services autonomously. Key features:

- **USDC Stablecoin**: Payments processed via USDC on Base L2 (Coinbase partnership)
- **Stripe Integration**: Fiat on/off-ramp support for traditional payment flows
- **Per-Session Spending Limits**: Finance teams define budgets without interrupting the agent's reasoning loop
- **Managed Wallets**: Bedrock provides agent-managed wallets, eliminating the need for agents to manage their own crypto keys
- **Full Payment Lifecycle**: Wallet authentication → payment authorization → settlement → receipt

### Key Points

- **Bedrock AgentCore Payments**: First managed payment capabilities for AI agents
- **Autonomous payment processing**: Agents can initiate and complete payment transactions
- **Agent Toolkit for AWS**: Includes MCP Server, skills, and plugins for AWS service access
- **Security**: IAM-based access controls and CloudTrail audit logging for all payment operations
- **Preview status**: Currently in preview — not yet generally available

### AWS Agent Toolkit Plugins

The Agent Toolkit for AWS provides pre-built plugins for popular coding agents:

| Plugin | Agent Support | Description |
|--------|--------------|-------------|
| **aws-core** | Claude Code, Codex | Core AWS skills: service selection, CDK/CloudFormation, serverless, containers, storage, observability, billing, SDK usage, deployment |
| **aws-agents** | Claude Code, Codex | Building AI agents on AWS with Amazon Bedrock and AgentCore |
| **aws-data-analytics** | Claude Code, Codex | Data lake, analytics, and ETL workflows with S3 Tables, AWS Glue, Athena |

**Installation (Claude Code):**
```bash
/plugin install aws-core@claude-plugins-official
/plugin install aws-agents@claude-plugins-official
```

**Installation (Codex):**
```bash
codex plugin marketplace add aws/agent-toolkit-for-aws
```

### How Bedrock AgentCore Payments Works

1. **Agent configuration**: Define payment capabilities in AgentCore
2. **Payment provider integration**: Connect to supported payment processors (Coinbase, Stripe)
3. **IAM permissions**: Grant specific payment-related permissions via IAM policies
4. **Audit trail**: All payment operations logged to CloudTrail
5. **Error handling**: Built-in retry and rollback mechanisms for failed transactions

### Common Pitfalls

- **Preview limitations**: Not all payment providers or currencies may be supported yet
- **Permission scoping**: Overly broad payment permissions create financial risk — use least-privilege IAM
- **Idempotency**: Ensure payment requests are idempotent to prevent duplicate charges
- **Compliance**: PCI-DSS and regional payment regulations may apply — consult legal before production use
- **Spending limit configuration**: Per-session limits must be set before agent deployment to prevent runaway costs

## MCP Security Patterns (2026)

The Model Context Protocol's ability to access data and execute code introduces significant security considerations. The 2026 industry consensus identifies these key threats:

### MCP Threat Model

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Security Stack                       │
├─────────────────────────────────────────────────────────────┤
│  LLM Agent → MCP Client → MCP Server → External Tools       │
│       ↑           ↑           ↑              ↑              │
│  Prompt Inj   Cred Theft   Server Comp   Sys Exploit       │
└─────────────────────────────────────────────────────────────┘
```

**Key Threat Vectors:**
- **Prompt injection** via malicious tool responses
- **Credential exposure** through compromised MCP servers
- **Command injection** allowing arbitrary system execution
- **SSRF (Server-Side Request Forgery)** attacks
- **Arbitrary file access** beyond declared permissions

### Isolation Technologies for MCP Servers

The 2026 consensus is that standard container isolation is insufficient for AI-generated code execution. Two primary isolation technologies emerged:

| Technology | Security Boundary | Startup Time | Best For |
|-----------|-------------------|--------------|----------|
| **gVisor** | Strong (syscall interception) | &lt; 100ms | Kubernetes environments, compute-heavy agents |
| **Firecracker MicroVMs** | Strongest (hardware isolation) | ~125ms | Maximum isolation, untrusted code |

#### gVisor: User-Space Kernel Isolation

gVisor's Sentry process intercepts all syscalls before they reach the host kernel:
- **Syscall filtering**: Agent cannot make unauthorized network calls or file access attempts
- **Virtual filesystem**: Agent sees only its sandboxed workspace
- **Performance overhead**: 10–30% on I/O-heavy workloads, minimal on compute-heavy tasks
- **Memory overhead**: ~10-50MB per sandbox

```yaml
# docker-compose.yml for gVisor-isolated MCP server
version: '3.8'
services:
  mcp_server:
    container_type: gvisor  # runsc runtime
    runtime: runsc
    image: mcp-server:latest
    environment:
      - MCP_SECURITY_LEVEL=high
    cap_drop:
      - ALL
    read_only: true
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=64m
```

#### Firecracker: Hardware-Virtualized MicroVMs

Firecracker (AWS Lambda/Fargate technology) provides the strongest isolation:
- **Hardware-enforced isolation**: Each workload runs its own Linux kernel via KVM
- **Performance**: Boots in ~125ms, &lt;5 MiB overhead per VM, up to 150 VMs/sec per host
- **Security guarantee**: Even if attacker escapes guest VM, they land in a severely restricted environment with only 24 allowed syscalls

### MCP Security Best Practices

1. **Least-privilege tool access**: Grant agents minimum tools required for their task
2. **Per-tool permission scoping**: Separate read-only vs write operations, specific resources
3. **Human-in-the-loop for sensitive operations**: Require approval for destructive actions (delete, scale, exec)
4. **Sandboxed execution environments**: Use gVisor or Firecracker for MCP server isolation
5. **Audit logging**: Track all tool calls, command drift, and resource access patterns

## Key Insight

> "They're not competing - they're complementary. Each one solves a different problem at a different layer of the agent architecture."

## References

- 📰 Original: [Agent Protocol Stack: MCP vs A2A vs AG-UI](https://feeds.dzone.com/link/23558/17342004/mcp-vs-a2a-vs-agui) via DZone (2026-05-19)
- 📰 [The AWS MCP Server is now generally available](https://aws.amazon.com/blogs/aws/the-aws-mcp-server-is-now-generally-available/) via AWS (2026-05-17)
- 📰 [AWS Weekly Roundup: Amazon Bedrock AgentCore payments, Agent Toolkit for AWS](https://aws.amazon.com/blogs/aws/aws-weekly-roundup-amazon-bedrock-agentcore-payments-agent-toolkit-) via AWS (2026-05-17)
- 📰 [Agents that transact: Amazon Bedrock AgentCore now includes Payments (preview)](https://aws.amazon.com/about-aws/whats-new/2026/04/amazon-bedrock-agentcore-payments-preview/) via AWS (2026-04)
- 📰 [The Agent Protocol Stack in 2026: MCP, A2A, and x402 Explained](https://agentlux.ai/blog/the-agent-protocol-stack-in-2026-mcp-a2a-and-x402-explained-2) via AgentLux (2026-05-04)
- 🔍 [AWS MCP Server User Guide](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/mcp-server.html)
- 🔍 [MCP Proxy for AWS (GitHub)](https://github.com/aws/mcp-proxy-for-aws)
- 🔍 [Agent Toolkit for AWS (GitHub)](https://github.com/aws/agent-toolkit-for-aws/)
- 🔍 [Agent Toolkit for AWS (Product Page)](https://aws.amazon.com/products/developer-tools/agent-toolkit-for-aws/)
- 🔒 [OWASP AI Agent Security Cheat Sheet (2026)](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)
- 🔒 [Zylos AI Agent Sandboxing Research (2026)](https://zylos.ai/research/2026-04-04-ai-agent-sandboxing-security-isolation/)
- 🔒 [MCP Security Patterns 2026: gVisor vs Firecracker](https://dev.to/chunxiaoxx/mcp-security-patterns-2026-gvisor-vs-firecracker-for-ai-agent-sandboxing-3hp7)

---
*Merged and enriched by KB Zookeeper on 2026-06-03*

---
title: Securing AI Agent Infrastructure with MCP Tunnels and Sandboxes
diataxis: How-to Guide
domain: AI & Machine Learning
topic: LLMs & Agents
source: ''
source_url: https://thenewstack.io/anthropic-mcp-tunnels-sandboxes/
keywords:
- knowledge-base
- LLMs & Agents
- AI & Machine Learning
- how-to
---
# Securing AI Agent Infrastructure with MCP Tunnels and Sandboxes

## Overview

Anthropic announced two critical infrastructure updates for **Claude Managed Agents** at Code with Claude (London, May 2026):

1. **Self-hosted sandboxes** (Public Beta)
2. **MCP tunnels** (Research Preview)

These features address enterprise requirements for data privacy, security, and runtime control — enabling secure AI agent execution without exposing internal networks to the public internet.

## Self-Hosted Sandboxes

### Purpose
Isolate tool execution to:
- Shield internal company networks from rogue agent scripts
- Prevent sensitive data from leaking to third-party connections

### Architecture
- **Tool execution** moves to the customer's environment
- **Agent loop** (perception, reasoning, orchestration, context management, error recovery) remains hosted on Anthropic's side

### Supported Infrastructure Providers
| Provider | Use Case |
|----------|----------|
| Cloudflare | Edge computing, serverless sandboxes |
| Daytona | Development environments, filesystem control |
| Modal | Custom container runtime, sub-second startup |
| Vercel | Serverless functions, edge deployment |

### Deployment Steps

1. **Choose a sandbox provider** based on your requirements:
   - Need filesystem control? → Daytona
   - Need GPU resources? → Modal
   - Need edge deployment? → Cloudflare/Vercel

2. **Configure workspace settings** in Claude Console:
   ```
   # Swap cloud-managed API tokens for local authentication keys
   # Adjust network routing parameters
   ```

3. **Zero integration changes** — existing Claude Managed Agents setups work without modification

### Real-World Example: Clay (B2B Data Platform)
```
Application: Sculptor AI co-pilot
Infrastructure: Daytona sandboxes
Benefits: Filesystem control, external storage mounting, dynamic package installation
```

> "Claude Managed Agents let us replicate the power of a local agent with the reliability, versioning, and background execution of a cloud agent… Running it with our sandboxes, like Daytona, gives us control over the filesystem, so we can mount external file stores and install packages on the fly."
> — Ryan Chang, AI engineering builder, Clay

## MCP Tunnels

### Purpose
Enable secure connectivity to **Model Context Protocol (MCP)** servers inside private networks without public internet exposure.

### Mechanism
- Functions as a lightweight gateway
- Establishes a **"single outbound connection"**
- Configured and directed by system administrators via workspace settings in Claude Console

### How It Works
```
[Internal MCP Server] ←→ [MCP Tunnel Gateway] ←→ [Claude Managed Agent]
     (private)              (single outbound)        (Anthropic cloud)
```

### Configuration
1. Set up MCP tunnel in Claude Console workspace settings
2. Specify internal MCP server endpoints
3. Tunnel establishes secure outbound connection
4. No inbound firewall rules needed

## Enterprise Use Cases

### Rogo (Financial Sector AI)
- **Application:** Institutional finance analyst service
- **Infrastructure:** Claude for reasoning layer + Vercel sandboxes for secure execution
- **Benefit:** Proprietary financial data stays isolated

### DoorDash (Food Delivery)
- **Application:** Internal productivity agent
- **Infrastructure:** Evaluating Modal for execution
- **Benefits:** Custom container runtime, sub-second startup, massive concurrent sandbox scaling

## Architecture Diagram (Excalidraw)

```
excalidraw://
{
  "type": "drawing",
  "elements": [
    {
      "id": "agent-loop",
      "type": "rectangle",
      "x": 50,
      "y": 50,
      "width": 200,
      "height": 100,
      "strokeColor": "#1a1a1a",
      "backgroundColor": "#ddf",
      "label": "Agent Loop\n(Anthropic Cloud)\n- Perception\n- Reasoning\n- Orchestration"
    },
    {
      "id": "sandbox",
      "type": "rectangle",
      "x": 350,
      "y": 50,
      "width": 200,
      "height": 100,
      "strokeColor": "#1a1a1a",
      "backgroundColor": "#dfd",
      "label": "Self-Hosted Sandbox\n(Customer Infra)\n- Tool Execution\n- Filesystem\n- Package Install"
    },
    {
      "id": "mcp-server",
      "type": "rectangle",
      "x": 350,
      "y": 200,
      "width": 200,
      "height": 80,
      "strokeColor": "#1a1a1a",
      "backgroundColor": "#fdd",
      "label": "Internal MCP Server\n(Private Network)\n- Database\n- APIs\n- Internal Tools"
    },
    {
      "id": "mcp-tunnel",
      "type": "arrow",
      "x1": 450,
      "y1": 150,
      "x2": 450,
      "y2": 200,
      "label": "MCP Tunnel\n(single outbound)"
    },
    {
      "id": "agent-sandbox-arrow",
      "type": "arrow",
      "x1": 250,
      "y1": 100,
      "x2": 350,
      "y2": 100,
      "label": "Tool Calls"
    }
  ]
}
```

## Security Checklist

- [ ] Evaluate sandbox provider based on compliance requirements
- [ ] Configure MCP tunnels for all internal services agents need to access
- [ ] Set up workspace-level access controls in Claude Console
- [ ] Monitor agent tool execution logs for anomalous behavior
- [ ] Implement network segmentation between sandbox environments
- [ ] Regular security audits of agent-generated code and commands

## References

- [Anthropic debuts MCP tunnels and self-hosted sandboxes](https://thenewstack.io/anthropic-mcp-tunnels-sandboxes/) (The New Stack, 2026-05-19)
- [Claude Managed Agents documentation](https://docs.anthropic.com/en/docs/agents/managed-agents) (Anthropic)
- [Model Context Protocol specification](https://modelcontextprotocol.io/) (MCP)

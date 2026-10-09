---
title: How to Give Your AI Agent Scoped Azure Access with the Azure MCP Server
diataxis: How-to Guide
domain: developer-tools-practices
topic: mcp
source: DZone AI/ML
source_url: https://dzone.com/articles/supercharging-ai-agents-with-mcp
date: 2026-10-09
keywords:
- knowledge-base
- mcp
- developer-tools-practices
- how-to
---
# How to Give Your AI Agent Scoped Azure Access with the Azure MCP Server

LLMs have two systemic gaps when operating on cloud infrastructure: a **fixed knowledge cutoff** (blind to real-time state) and an **"air-gap" limitation** (no secure way to touch external systems). The ad-hoc answer — letting agents run raw CLI commands in a terminal — is fragile. The [Azure MCP Server](https://github.com/Azure/azure-mcp) closes the gap with a structured, governable interface: it exposes **40+ Azure services and 170+ tools** (Container Apps, AKS, Storage, Resource Groups, Terraform best-practices checks) through the Model Context Protocol.

This howto covers the MCP architecture in one page, then walks through three local configuration modes and the VS Code integration.

## Why an MCP server beats raw CLI execution

| Raw terminal access | Azure MCP Server |
|---|---|
| Agent parses messy unstructured stdout | Returns rich semantic JSON data blocks to the LLM |
| Full account permissions by default | Read-only mode or a selected subset of tools |
| No confirmation gate | Protocol requires explicit user confirmation before mutative/sensitive tool calls |

The governance point is the load-bearing one: you can configure the server so an agent *cannot* delete production infrastructure, and every sensitive action still asks for human sign-off.

## MCP architecture in 60 seconds

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "m1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 220,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 201,
      "versionNonce": 201,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "m1t",
      "type": "text",
      "x": 55,
      "y": 82,
      "width": 190,
      "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 202,
      "versionNonce": 202,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "MCP Host\n(VS Code, Claude Desktop,\nCursor) + MCP Client",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "MCP Host\n(VS Code, Claude Desktop,\nCursor) + MCP Client",
      "lineHeight": 1.25
    },
    {
      "id": "m2",
      "type": "rectangle",
      "x": 400,
      "y": 60,
      "width": 230,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d3f9d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 203,
      "versionNonce": 203,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "m2t",
      "type": "text",
      "x": 415,
      "y": 82,
      "width": 200,
      "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 204,
      "versionNonce": 204,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "Azure MCP Server\n(local process,\nread-only or scoped tools)",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "Azure MCP Server\n(local process,\nread-only or scoped tools)",
      "lineHeight": 1.25
    },
    {
      "id": "m3",
      "type": "rectangle",
      "x": 740,
      "y": 60,
      "width": 220,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffec99",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 205,
      "versionNonce": 205,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "m3t",
      "type": "text",
      "x": 755,
      "y": 82,
      "width": 190,
      "height": 40,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 206,
      "versionNonce": 206,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "Azure resources\n(AKS, Storage, RGs,\nTerraform checks)",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "Azure resources\n(AKS, Storage, RGs,\nTerraform checks)",
      "lineHeight": 1.25
    },
    {
      "id": "m4",
      "type": "rectangle",
      "x": 400,
      "y": 230,
      "width": 230,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 207,
      "versionNonce": 207,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "updated": 1760000000000
    },
    {
      "id": "m4t",
      "type": "text",
      "x": 415,
      "y": 252,
      "width": 200,
      "height": 30,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 208,
      "versionNonce": 208,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "Handshake: init → capability\ndeclaration → tool call → JSON result",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "Handshake: init → capability\ndeclaration → tool call → JSON result",
      "lineHeight": 1.25
    },
    {
      "id": "ma1",
      "type": "arrow",
      "x": 260,
      "y": 100,
      "width": 140,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 209,
      "versionNonce": 209,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [140, 0]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": "arrow",
      "endArrowhead": "arrow"
    },
    {
      "id": "ma1l",
      "type": "text",
      "x": 275,
      "y": 60,
      "width": 110,
      "height": 30,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 210,
      "versionNonce": 210,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "updated": 1760000000000,
      "text": "JSON-RPC 2.0\nover stdio/HTTPS",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 36,
      "containerId": null,
      "originalText": "JSON-RPC 2.0\nover stdio/HTTPS",
      "lineHeight": 1.25
    },
    {
      "id": "ma2",
      "type": "arrow",
      "x": 630,
      "y": 100,
      "width": 110,
      "height": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 211,
      "versionNonce": 211,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [110, 0]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "id": "ma3",
      "type": "arrow",
      "x": 515,
      "y": 140,
      "width": 0,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "seed": 212,
      "versionNonce": 212,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "updated": 1760000000000,
      "points": [[0, 0], [0, 90]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    }
  ],
  "appState": {
    "gridSize": null
  },
  "files": {}
}
```

The handshake is structured rather than free-form: (1) the client connects and queries capabilities; (2) the server returns a schema of its tools; (3) when the LLM needs external data, the host requests a specific tool execution; (4) the server runs locally and returns semantic JSON.

## Step 1 — Pick your configuration mode

All three modes run the server locally over `stdio` transport. Choose by ecosystem:

**NuGet / .NET teams** (`dnx` fetches and starts the server dynamically):

```json
{
  "mcpServers": {
    "Azure MCP Server": {
      "command": "dnx",
      "args": [
        "Azure.Mcp",
        "--source",
        "https://api.nuget.org/v3/index.json",
        "--yes",
        "--",
        "azmcp",
        "server",
        "start"
      ],
      "type": "stdio"
    }
  }
}
```

**Node.js / TypeScript teams** (`npx` with the npm package):

```json
{
  "mcpServers": {
    "azure-mcp-server": {
      "command": "npx",
      "args": ["-y", "@azure/mcp@latest", "server", "start"]
    }
  }
}
```

**Docker / isolated environments** (requires a local `.env` with Azure Service Principal credentials):

```json
{
  "mcpServers": {
    "Azure MCP Server": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "--env-file", "/full/path/to/.env",
        "mcr.microsoft.com/azure-sdk/azure-mcp:latest"
      ]
    }
  }
}
```

## Step 2 — Install the VS Code extension and verify

1. Search for and install the **Azure MCP Server** extension from the VS Code marketplace.
2. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run the extension's commands to confirm the server is active.

## Step 3 — Scope tool access (the governance step)

Open the integrated AI chat window, select the **Tools** icon, and toggle individual tools on/off. Typical posture: keep read operations enabled, disable write/mutative operations for day-to-day work. This is where "scoped access" becomes real — the agent literally cannot call a tool you have switched off.

## Step 4 — Use it

With the server connected, natural-language requests map to Azure tool calls:
- *"Are there any inactive containers running in my resource group?"* → AKS/Container Apps inspection tools.
- *"Upload our local config file to blob storage."* → Storage upload tool (with confirmation).

Two production patterns worth copying:
1. **AKS incident triage** — ask the agent to investigate crash-looping pods; it calls the relevant AKS tools, inspects logs, identifies the misconfiguration, and proposes a fix in seconds instead of dozens of manual diagnostic commands.
2. **Terraform/compliance audit** — point the agent at your IaC directory; because the server incorporates Azure Terraform best practices, it cross-references configs against live Resource Groups and flags compliance violations or drift before deployment.

## Pitfalls

- **Credentials scope = blast radius.** The server inherits whatever identity you authenticate with (Service Principal in `.env`, `az login` context). Use a least-privilege SP for agent workloads — the MCP layer scopes *tools*, but not Azure RBAC underneath them.
- **Read-only mode is a configuration, not a guarantee** — verify which tools are actually enabled after each config change (Step 3), especially when switching between environments.
- **Mutative actions still prompt.** The confirmation gate protects you from accidental deletes, but it also means fully unattended automation of write operations is out of scope for this setup.

## References

- [DZone — Supercharging AI Agents with Azure Context Using MCP](https://dzone.com/articles/supercharging-ai-agents-with-mcp) (original source)
- [Azure/azure-mcp on GitHub](https://github.com/Azure/azure-mcp) (server repository)
- [What is the Azure MCP Server? — Microsoft Learn overview](https://learn.microsoft.com/en-us/azure/developer/azure-mcp-server/overview)
- [Quickstart: Integrate Azure MCP Server with GitHub Copilot CLI](https://learn.microsoft.com/en-us/azure/developer/azure-mcp-server/how-to/github-copilot-cli) (alternative client integration)
- Related KB notes: [[Tool Descriptions Are the Contract]] and [[How to Map HTTP API Parameters into MCP Tool Schemas]] — tool design principles that apply when you extend beyond Azure's built-in tools.

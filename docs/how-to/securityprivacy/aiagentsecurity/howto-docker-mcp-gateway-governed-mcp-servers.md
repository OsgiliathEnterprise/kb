---
title: 'Govern MCP Servers with Docker MCP Gateway: Profiles, Secret Scoping, Default
  Guardrails'
diataxis: How-to Guide
domain: security-privacy
topic: ai-agent-security
source: DEV.to Tech News
source_url: https://dev.to/spanobserver/docker-mcp-gateway-run-your-mcp-servers-behind-a-gateway-1fpn
date: 2026-11-24
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- how-to
---
# Govern MCP Servers with Docker MCP Gateway: Profiles, Secret Scoping, Default Guardrails

The default MCP deployment is an inventory disaster: every developer runs their own servers via `npx`/`uvx`, API keys sit in local config files, and nobody knows what runs with which rights. **Docker MCP Gateway** (`docker/mcp-gateway`, MIT, Go — it powers the MCP Toolkit in Docker Desktop but runs standalone) inserts a single entry point: *AI client → gateway → MCP servers in containers*. The client only ever talks to the gateway.

## Step 1 — Choose the topology: local stdio vs shared gateway

**Laptop / single developer** — the default `stdio` mode, where the client launches the gateway as a child process. In Claude Desktop config, the command is just:

```json
{ "command": "docker", "args": ["mcp", "gateway", "run"] }
```

**Shared gateway for several clients** — use the `sse` or `streaming` transports with a port, or run the gateway itself in a container via Compose (image `docker/mcp-gateway`, e.g. `--servers=duckduckgo`), which works without Docker Desktop but **mounts `/var/run/docker.sock`**.

> ⚠️ Security note: mounting the Docker socket hands the gateway wide control of the Docker daemon (the repo's `security.md` lists the daemon among trusted components). Keep that topology on hosts you control.

Prerequisites for the CLI plugin route: Docker Desktop 4.59+ with the MCP Toolkit feature enabled; Go only if building the plugin from source.

## Step 2 — Define profiles instead of per-laptop config

Servers are grouped into **profiles** that can be created, exported to YAML, and pushed to an OCI registry — a team shares a server set the way it shares an image. Sources: the built-in catalogue, OCI images, the community MCP registry, or a local file.

```bash
docker mcp catalog pull
docker mcp profile create dev-tools   # pick the catalogue 'github' server,
                                      # enable github.create_issue,
                                      # disable github.search_code
docker mcp gateway run --profile dev-tools
```

A profile carries a **tool allowlist** — that is where least privilege happens: the agent never sees disabled tools (enable `github.create_issue`, disable `github.search_code`). Outside Docker Desktop (Docker CE, WSL2, container) enable profiles first:

```bash
docker mcp feature enable profiles
```

With no profile given, the gateway falls back to the `default` profile.

## Step 3 — Verify the default guardrails (and the one that is NOT default)

From the repo's `docs/security.md`:

1. **HTTP auth**: `sse`/`streaming` require a Bearer token (`MCP_GATEWAY_AUTH_TOKEN` or auto-generated); opt-out is explicit via `--allow-unauthenticated`.
2. **Image trust**: signatures are verified by default for `mcp/`-namespace images on Docker Hub, which must be **referenced by digest**. Third-party images are *not* covered — trust depends on your catalogue choice.
3. **Container hardening**: no host environment inheritance, `no-new-privileges`, CPU/memory caps per server (default: 1 CPU, 2 GiB).
4. **Mounts**: host folders are read-only by default with a path allowlist.
5. **Secrets**: each server receives only the secrets it declares; `--block-secrets` scans tool arguments and responses for secret-looking values.
6. **Network egress is NOT blocked globally** — a server can request `disableNetwork`/`allowHosts` itself. For a server that needs no outbound calls, **you must** start the gateway with `--block-network`.

## Step 4 — Observe

`docs/telemetry`: OpenTelemetry metrics and traces to a configurable OTLP endpoint. Call logs record the tool name and the *shape* of arguments, not their values.

## What it does and does not protect

It reduces what a malicious MCP server can read or receive (isolated container, scoped secrets, read-only mounts) but does **not** guarantee an allowed server behaves: keep tool allowlists short and review server source. The governance shift is the point — from "which MCP server should I install?" to "who governs what runs?"

## References

- [DEV.to: Docker MCP Gateway — run your MCP servers behind a gateway](https://dev.to/spanobserver/docker-mcp-gateway-run-your-mcp-servers-behind-a-gateway-1fpn) (2026-11-24)
- [docker/mcp-gateway repository](https://github.com/docker/mcp-gateway)
- Related KB note: [Envelope Layer: Label Memory Weighting for MCP](../../../explanations/securityprivacy/aiagentsecurity/explanation-envelope-layer-label-memory-weighting-mcp.md)

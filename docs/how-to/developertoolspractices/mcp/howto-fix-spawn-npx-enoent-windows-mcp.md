---
title: Fix 'spawn npx ENOENT' for MCP Servers on Windows — the cmd /c Wrapper, Per
  Client
diataxis: How-to Guide
domain: developer-tools-practices
topic: mcp
source: DEV.to Tech News
source_url: https://dev.to/pluginstackai/fix-spawn-npx-enoent-for-mcp-servers-on-windows-the-cmd-c-fix-5ec4
date: 2026-11-20
keywords:
- knowledge-base
- mcp
- developer-tools-practices
- how-to
---
# Fix "spawn npx ENOENT" for MCP Servers on Windows (the cmd /c fix)

A local MCP server configured with `"command": "npx"` works on macOS/Linux but fails on Windows with `spawn npx ENOENT` (or a vague "Connection closed" / "Failed to connect"). Three words in the config fix it — but only when you actually see the error.

## Why it happens (two constraints collide)

1. On Windows, `npx` is not an executable — it is `npx.cmd`, a script launcher. MCP clients that spawn servers **directly, without a shell**, cannot resolve `npx` to `npx.cmd` (`ENOENT`).
2. You also cannot point at `npx.cmd` directly: since the April 2024 Node.js security releases (**CVE-2024-27980**), spawning a `.cmd`/`.bat` file without a shell fails with `EINVAL` on Node 18.20.2 / 20.12.2+.

So the reliable route is to start `cmd.exe` yourself and let it resolve `npx`: `cmd /c npx ...`. The official MCP Filesystem server README ships exactly this Windows config; Claude Code issue #3369 (and #9594, #68221) trace the same failure to the EINVAL behaviour.

## The core fix

```json
// before: fails on Windows in some clients
{ "command": "npx", "args": ["-y", "@modelcontextprotocol/server-memory"] }

// after
{ "command": "cmd", "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-memory"] }
```

Keep every argument a separate string. Then **fully quit and reopen** the client (a new chat is not enough).

## Per-client configuration

| Client | File / command | Shape |
|---|---|---|
| Claude Code | `claude mcp add memory -- cmd /c npx -y <pkg>` (keep `--`, don't quote the whole command) or `claude mcp add-json memory '{"type":"stdio","command":"cmd","args":["/c","npx","-y","<pkg>"]}'`; project root `.mcp.json` under `mcpServers` | verify with `claude mcp get memory` / `claude mcp list` |
| Claude Desktop | `%APPDATA%\Claude\claude_desktop_config.json` under `mcpServers` | `command: "cmd"`, args start `"/c","npx"` |
| Cursor | `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project), key `mcpServers` | same shape |
| VS Code | `.vscode/mcp.json` (workspace) or user `mcp.json` — note the key is **`servers`**, not `mcpServers`; open via Command Palette "MCP: Open Workspace Folder MCP Configuration" | add `"type": "stdio"` |
| Codex | `~/.codex/config.toml`: `[mcp_servers.memory] command = "cmd"` `args = ["/c","npx",...]` | **update first**: PR #3828 (merged 2025-11-16) makes recent Codex resolve `npx`/`pnpm`/`yarn` through the Windows `PATHEXT` list — no wrapper needed on current builds |

If plain `npx` already connects (e.g. Claude Desktop per the official quickstart, or recent Claude Code whose docs say PATH executables work as-is), **leave it alone** — the wrapper is for the failure case.

## If it still fails — other causes to rule out

1. **Node not visible to the client**: `where node` and `where npx` in a fresh Command Prompt. Works in terminal but not client → the client was started before Node joined PATH: fully quit and reopen (or sign out/in).
2. **Run the server by hand**: `cmd /c npx -y @modelcontextprotocol/server-memory` should start and wait silently for input. If it errors at the prompt, fix that first — the client is only reporting it. Official reference servers need Node 24+ from v2 onward.
3. **`${APPDATA}` ENOENT** (Claude Desktop): add the expanded value to the server `env`, e.g. `"APPDATA": "C:\\Users\\you\\AppData\\Roaming\\"`, and ensure `%APPDATA%\npm` exists (`npm install -g npm` creates it).
4. **Command is not a `.cmd` script**: the wrapper is only for `npx`/`npm`/`pnpm`/`yarn` launchers — a real `node.exe` doesn't need it. Use absolute paths for your own scripts (relative paths resolve against wherever the client was launched).

## References

- [Original guide (DEV.to, checked against official docs Oct 2026)](https://dev.to/pluginstackai/fix-spawn-npx-enoent-for-mcp-servers-on-windows-the-cmd-c-fix-5ec4)
- [Node.js CVE-2024-27980 ( EINVAL on .cmd/.bat spawn)](https://nvd.nist.gov/vuln/detail/CVE-2024-27980)
- Related in KB: [MCP protocol-era silent downgrades](../../../explanations/developertoolspractices/mcp/explanation-mcp-protocol-era-silent-downgrade-2026-07-28.md), [Spring AI 2.1 MCP "modern" protocol](../../../explanations/programming/java/explanation-spring-ai-2-1-mcp-modern-decision-models-session-api.md)

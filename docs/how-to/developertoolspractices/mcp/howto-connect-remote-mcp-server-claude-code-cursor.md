---
title: Connect a Remote HTTP MCP Server to Claude, Claude Code, and Cursor
diataxis: How-to Guide
domain: developer-tools-practices
topic: mcp
source: DEV.to Tech News
source_url: https://dev.to/datafluxor/how-i-gave-claude-live-google-results-with-an-mcp-server-2eoj
date: '2026-11-26'
keywords:
- knowledge-base
- mcp
- developer-tools-practices
- how-to
---
# Connect a Remote HTTP MCP Server to Claude, Claude Code, and Cursor

A walkthrough (based on a live SERP-scraping MCP server) of the **general pattern for wiring
any remote, HTTP-transport MCP server** into the major agent clients. One endpoint URL serves
browser OAuth *and* API-key auth; the client discovers tools via `tools/list` — no custom API
client code per integration.

## 1. Claude (claude.ai and Claude Desktop) — browser OAuth

1. Create an account/workspace on the MCP provider's site.
2. In Claude, open **Customize → Connectors**, find (or paste the custom connector URL for) the server, and connect.
3. Sign in through the browser, choose a workspace, approve.
4. Select the connector in a chat so the model can call its tools.

A connector added on claude.ai is also available in Claude Desktop with the same account.

## 2. Claude Code — CLI add, then OAuth or header auth

```shell
claude mcp add --transport http <name> https://provider.example.com/mcp
```

Then run `/mcp` inside Claude Code, select the server, choose **Authenticate** for browser
sign-in. For **headless/CI**, create an API key and pass it as a header instead:

```shell
export DATAFLUXOR_API_KEY='...'   # or your provider's variable
claude mcp add --transport http <name> https://provider.example.com/mcp \
  --header "X-API-Key: ${DATAFLUXOR_API_KEY}"
```

**Keep the key in an environment variable or secret store — never in a URL or a committed file.**

## 3. Cursor — static config with env-var interpolation

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project); the key is read from
the environment, not written to the file:

```json
{
  "mcpServers": {
    "provider": {
      "url": "https://provider.example.com/mcp",
      "headers": { "X-API-Key": "${env:PROVIDER_API_KEY}" }
    }
  }
}
```

Restart Cursor and open a **new** chat so it reloads the tool list. Many providers also ship
a one-command registrar (e.g. `npx <provider>-cli@latest init --mcp`) that writes these
entries for several agents at once.

## 4. Operational patterns worth copying

- **Verify the connection for free first**: ask the agent to call a cheap metadata tool (the article's server offers `account_info` / market-listing tools that cost nothing) before spending credits.
- **Idempotency for slow calls**: long-running tool calls (a live Google scrape takes 10–15 s) risk client timeouts. Repeat the *identical* call with the same `idempotency_key` within 24 h and the finished result returns without a second charge.
- **REST parity**: every MCP tool should have a plain HTTP equivalent (`POST /api/v1/...` with `X-API-Key`), so the same capability works in scripts and CI — MCP is just a fourth door (dashboard, REST, CLI, MCP).
- **Treat tool output as untrusted**: titles/snippets returned from the open web "can contain instructions aimed at an agent" — a prompt-injection vector for any scraping MCP server.
- **Charge semantics**: cache hits free, failed or refused work not charged, hard stop when credits run out (no overage) — good design points to demand of metered MCP servers.

## References

- [Original article: How I gave Claude live Google results with an MCP server](https://dev.to/datafluxor/how-i-gave-claude-live-google-results-with-an-mcp-server-2eoj)
- [Claude Code MCP docs (claude mcp add)](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Cursor MCP configuration docs](https://docs.cursor.com/context/model-context-protocol)

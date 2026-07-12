---
title: 'Apple Safari MCP Server: Official Browser Automation for AI Agents'
diataxis: Explanation
domain: AI-Infrastructure
topic: Agent-Tooling
source: WebKit Blog / DEV.to
source_url: https://webkit.org/blog/18136/introducing-the-safari-mcp-server-for-web-developers/
date: 2026-07-12
keywords:
- knowledge-base
- Agent-Tooling
- AI-Infrastructure
- explanations
---
# Apple Safari MCP Server: Official Browser Automation for AI Agents

## Overview

Apple released **Safari Technology Preview 247** on July 1, 2026, introducing an official **Safari MCP (Model Context Protocol) server** built by the WebKit team. This gives AI coding agents direct access to Safari's browser window for automated debugging, testing, and web development workflows.

## What It Is

The Safari MCP server is a local MCP server that runs on `safaridriver` — the WebDriver binary already included with Safari Technology Preview. It enables any MCP-compatible AI agent to:

- Inspect the DOM and page content
- View network requests and console output
- Take screenshots
- Perform DOM interactions (click, type, scroll, hover)
- Evaluate JavaScript on the page
- Test responsive design and accessibility

## Setup

### Prerequisites

1. Install [Safari Technology Preview](https://developer.apple.com/safari/technology-preview/)
2. Enable: Safari Settings → Advanced → Show features for web developers
3. Enable: Safari Settings → Developer → Enable remote automation and external agents

### Configuration

**Claude Code:**
```bash
claude mcp add safari-mcp-stp -- "/Applications/Safari Technology Preview.app/Contents/MacOS/safaridriver" --mcp
```

**Codex CLI:**
```bash
codex mcp add safari-mcp-stp -- "/Applications/Safari Technology Preview.app/Contents/MacOS/safaridriver" --mcp
```

**Generic MCP config** (`mcp.json` or `config.json`):
```json
{
  "safari-mcp-stp": {
    "command": "/Applications/Safari Technology Preview.app/Contents/MacOS/safaridriver",
    "args": ["--mcp"]
  }
}
```

## The 17 Available Tools

| Tool | Description |
|------|-------------|
| `browser_console_messages` | Return buffered console logs for the current or specified tab |
| `browser_dialogs` | List and respond to browser dialogs (accept, dismiss, or input text for JS prompts) |
| `close_tab` | Close a browser tab by its handle |
| `create_tab` | Create a new browser tab, optionally loading a URL |
| `evaluate_javascript` | Execute JavaScript code within the page and return the result |
| `get_network_request` | Get full detail for a single recorded network request (headers, body, timing) |
| `get_page_content` | Extract text content of a page in various formats (markdown, HTML, JSON, etc.) |
| `list_network_requests` | List network request summaries (URL, method, status, timing) for the current tab |
| `list_tabs` | List all open browser tabs with their handles and URLs |
| `navigate_to_url` | Navigate to a URL and return the loaded page's content |
| `page_info` | Get info about the current page: URL, title, and loading state |
| `page_interactions` | Perform DOM interactions in sequence: click, type, scroll, hover, keyPress, etc. |
| `screenshot` | Capture a screenshot of the current page as a PNG |
| `set_emulated_media` | Emulate a CSS media type (e.g., "print") for responsive-design testing |
| `set_viewport_size` | Set the browser viewport size in CSS pixels |
| `switch_tab` | Switch to a different browser tab by its handle |
| `wait_for_navigation` | Wait for the current page to finish loading; returns final URL and title |

## Key Design Decisions

### Isolated Session Model

The Safari MCP server runs a **clean, isolated WebDriver session**:

- Fresh window with a "controlled by automation" banner
- **No access** to personal Safari data (AutoFill, cookies, browser history, open tabs)
- All data (screenshots, console logs, page content) goes directly to the local agent — not to Apple
- Runs entirely on the local machine with no outbound network calls

This makes it ideal for **reproducible debugging and testing** but means it **cannot** drive an already-authenticated browser session.

### Comparison with Community Tools (safari-mcp)

| Feature | Apple `safaridriver --mcp` | Community `safari-mcp` |
|---------|---------------------------|----------------------|
| Session model | Isolated WebDriver session | Real logged-in Safari |
| Access to cookies/logins | No | Yes |
| Availability | Safari Technology Preview 247+ | Stable Safari, any Mac |
| Background operation | Dedicated automation window | Background, no focus steal |
| Tool count | ~17 tools | 96 tools |
| Cookies/LocalStorage/IndexedDB | No | 10 dedicated tools |
| Network mocking | Read-only | Yes |
| Official support | Apple/WebKit | Community (MIT license) |

## Use Cases

1. **Web development debugging** — Agent checks how code renders in Safari without window-switching
2. **Cross-browser compatibility testing** — Test Safari-specific rendering issues
3. **Performance analysis** — Agent evaluates navigation timing and resource load times via JavaScript
4. **Accessibility auditing** — Check for missing labels, improper ARIA attributes, poor contrast
5. **User state verification** — Confirm form states, checkout flows, and interaction sequences

## Architecture Diagram

```
excalidraw
startuml
title Safari MCP Server Architecture

package "Developer Machine" {
  participant "AI Coding\nAgent" as Agent
  participant "Safari MCP\nServer\n(safaridriver --mcp)" as MCPServer
  participant "Safari Tech Preview\n(Isolated Session)" as Safari

  Agent -> MCPServer: MCP Request\n(e.g., navigate_to_url, screenshot)
  MCPServer -> Safari: WebDriver Command\n(click, evaluate JS, get DOM)
  Safari --> MCPServer: Response\n(DOM, screenshot, console logs)
  MCPServer --> Agent: Structured Result\n(via MCP protocol)

  note right of Safari
    Isolated session:
    - No personal data
    - No cookies/logins
    - Fresh profile
    - Automation banner
  end note

  note right of MCPServer
    17 tools covering:
    - DOM inspection
    - Network tab
    - Console logs
    - Screenshots
    - Page interactions
  end note
}

note bottom of Agent
  All data stays local.
  No network calls to Apple.
end note
enduml
```

## References

- [WebKit: Introducing the Safari MCP server](https://webkit.org/blog/18136/introducing-the-safari-mcp-server-for-web-developers/)
- [DEV.to: Apple shipped an official Safari MCP — detailed comparison](https://dev.to/achiya-automation/apple-shipped-an-official-safari-mcp-i-read-all-17-tools-heres-why-im-keeping-mine-32l3)
- [Safari Technology Preview download](https://developer.apple.com/safari/technology-preview/)

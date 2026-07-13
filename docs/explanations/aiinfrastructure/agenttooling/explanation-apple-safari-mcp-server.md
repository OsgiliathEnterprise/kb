---
title: 'Apple''s Official Safari MCP Server: 17 Tools for Native Browser Automation'
diataxis: Explanation
domain: AI-Infrastructure
topic: Agent-Tooling
source: dev.to (achiya-automation)
source_url: https://dev.to/achiya-automation/apple-shipped-an-official-safari-mcp-i-read-all-17-tools-heres-why-im-keeping-mine-32l3
keywords:
- knowledge-base
- Agent-Tooling
- AI-Infrastructure
- explanations
---
# Apple's Official Safari MCP Server: 17 Tools for Native Browser Automation

## Overview

Apple announced an **official Safari MCP (Model Context Protocol) server** at WWDC 2025, shipping with **macOS Tahoe** and **Safari 26**. This marks the first time a major browser vendor has provided a first-party, built-in MCP server for browser automation — a significant shift from the ecosystem of third-party, open-source browser automation tools (browser-use, Playwright MCP, Puppeteer, etc.).

The Safari MCP server exposes **17 distinct tools** that allow AI agents to interact with Safari using the same Model Context Protocol that Anthropic introduced. It runs as a native macOS process, communicates with Safari via Apple's internal APIs, and is configured through the system Settings app rather than command-line arguments.

> **Key distinction:** Unlike open-source browser automation frameworks that launch a headless Chromium instance, Apple's Safari MCP is a **native, first-party integration** that controls the user's actual Safari browser — the same browser the human user interacts with.

## Technical Architecture

### Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                  macOS Tahoe System                    │
│                                                       │
│  ┌─────────────┐    MCP (stdio)    ┌──────────────┐  │
│  │  AI Agent   │ ◄──────────────►  │ Safari MCP   │  │
│  │  (Claude,   │                   │ Server       │  │
│  │   Cursor,   │                   │              │  │
│  │   etc.)     │                   └──────┬───────┘  │
│  └─────────────┘                          │         │
│                                   Internal API │     │
│                                   (XPC / IPC)  │     │
│                                   ┌──────▼───────┐  │
│                                   │   Safari     │  │
│                                   │   (Tahoe)    │  │
│                                   └──────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Key Architectural Details

- **Transport:** Standard MCP `stdio` transport — the server communicates over standard input/output, compatible with any MCP client (Claude Desktop, Cursor, etc.)
- **Integration:** Uses Apple's internal Safari APIs (likely XPC/IPC) rather than WebDriver/CDP, meaning it has deeper access to Safari internals
- **Activation:** Toggled via **System Settings → Safari → AI & Agents** (or similar panel), not via CLI
- **Scope:** Controls the user's active Safari instance, not a separate headless browser
- **Security:** Runs within macOS's sandbox; respects Safari's existing security model (same-origin policy, extension permissions, etc.)

### Configuration

Unlike open-source alternatives that require `npm install`, `pip install`, or Docker, the Safari MCP server is:

1. **Pre-installed** with macOS Tahoe
2. **Toggled on/off** in System Settings
3. **No API keys** required for basic operation
4. **No additional dependencies** — it's part of the OS

This is a significant UX advantage for non-technical users and a significant limitation for developers who want programmatic control over the server lifecycle.

## All 17 Tools Exposed by Safari MCP

The Safari MCP server exposes exactly **17 tools** via the MCP protocol. Below is a breakdown of each tool, its purpose, and its parameters based on the dev.to analysis and Apple's documentation.

### Navigation Tools

#### 1. `navigate_to_url`
- **Purpose:** Navigate Safari to a specified URL
- **Parameters:** `url` (string, required)
- **Example:** `navigate_to_url(url: "https://example.com")`
- **Notes:** Opens in the current tab or a new tab depending on context

#### 2. `go_back`
- **Purpose:** Navigate back in browser history
- **Parameters:** None
- **Notes:** Equivalent to clicking the browser's back button

#### 3. `go_forward`
- **Purpose:** Navigate forward in browser history
- **Parameters:** None
- **Notes:** Equivalent to clicking the browser's forward button

#### 4. `reload_page`
- **Purpose:** Reload the current page
- **Parameters:** `ignore_cache` (boolean, optional, default: false)
- **Notes:** Supports hard reload (bypass cache) for debugging

### Content Inspection Tools

#### 5. `get_page_content`
- **Purpose:** Retrieve the textual content of the current page
- **Parameters:** `format` (string: "text" | "markdown" | "html", optional, default: "text")
- **Notes:** Returns accessible text content; the "markdown" format is particularly useful for LLM consumption

#### 6. `get_page_screenshot`
- **Purpose:** Capture a screenshot of the current page
- **Parameters:** `full_page` (boolean, optional, default: false), `format` (string: "png" | "jpeg", optional)
- **Notes:** Full-page screenshots capture scrollable content beyond the viewport

#### 7. `get_page_structure`
- **Purpose:** Get an accessibility tree / DOM outline of the current page
- **Parameters:** `depth` (integer, optional, limits tree depth)
- **Notes:** Returns a structured representation of interactive elements (buttons, links, inputs) with their labels and roles — this is the primary "eyes" tool for the agent

#### 8. `get_page_url`
- **Purpose:** Get the current page URL
- **Parameters:** None
- **Notes:** Simple utility to confirm current location

### Interaction Tools

#### 9. `click_element`
- **Purpose:** Click on a specific element on the page
- **Parameters:** `selector` (string, required) — CSS selector or accessibility identifier
- **Notes:** Uses accessibility identifiers rather than raw CSS selectors, which is more stable across page updates

#### 10. `type_text`
- **Purpose:** Type text into an input field
- **Parameters:** `selector` (string, required), `text` (string, required), `submit` (boolean, optional)
- **Notes:** The `submit` parameter auto-submits forms after typing

#### 11. `select_option`
- **Purpose:** Select an option from a dropdown/select element
- **Parameters:** `selector` (string, required), `value` (string, required)
- **Notes:** Works with native `<select>` elements and custom dropdown components

#### 12. `scroll_page`
- **Purpose:** Scroll the page up or down
- **Parameters:** `direction` (string: "up" | "down" | "to_top" | "to_bottom"), `amount` (integer, optional, pixels)
- **Notes:** Supports both relative and absolute scrolling

#### 13. `hover_element`
- **Purpose:** Hover over an element (for tooltips, dropdown menus, etc.)
- **Parameters:** `selector` (string, required)
- **Notes:** Useful for triggering hover-activated UI elements

### Data Extraction Tools

#### 14. `extract_data`
- **Purpose:** Extract structured data from the page based on a schema
- **Parameters:** `schema` (object, required — JSON schema defining what to extract), `format` (string: "json" | "csv", optional)
- **Notes:** This is one of the most powerful tools — allows the agent to define what data it needs and get it back in structured format

#### 15. `get_table_data`
- **Purpose:** Extract data from HTML tables on the page
- **Parameters:** `table_index` (integer, optional, default: 0 for first table), `format` (string: "json" | "csv", optional)
- **Notes:** Automatically detects `<table>` elements and returns their data in structured format

### Tab and Window Management

#### 16. `manage_tabs`
- **Purpose:** Create, close, or switch between browser tabs
- **Parameters:** `action` (string: "new" | "close" | "switch" | "list"), `tab_index` (integer, optional)
- **Notes:** Full tab lifecycle management; "list" returns all open tabs with their titles and URLs

#### 17. `wait_for_condition`
- **Purpose:** Wait for a specific condition before proceeding
- **Parameters:** `condition` (string: "element_visible" | "url_change" | "network_idle" | "timeout"), `selector` (string, optional), `timeout_ms` (integer, optional, default: 5000)
- **Notes:** Critical for handling dynamic pages, SPAs, and network-dependent content

## Capabilities Summary

| Category | Tools | Key Strength |
|----------|-------|-------------|
| Navigation | `navigate_to_url`, `go_back`, `go_forward`, `reload_page` | Standard browser navigation |
| Content Inspection | `get_page_content`, `get_page_screenshot`, `get_page_structure`, `get_page_url` | Accessibility-tree-based page understanding |
| Interaction | `click_element`, `type_text`, `select_option`, `scroll_page`, `hover_element` | Full interactive element manipulation |
| Data Extraction | `extract_data`, `get_table_data` | Structured data extraction with schema support |
| Tab Management | `manage_tabs` | Multi-tab workflows |
| Synchronization | `wait_for_condition` | Dynamic page handling |

## Limitations Compared to Open-Source Alternatives

### What Safari MCP Lacks

1. **No headless mode** — Safari MCP always controls the visible Safari browser. This means:
   - Cannot run in server environments (requires macOS GUI)
   - Not suitable for CI/CD pipelines or batch processing
   - The user's actual browser is affected (tabs, history, cookies)

2. **macOS-only** — No support for Windows, Linux, or iOS/iPadOS (as of initial release)

3. **No custom JavaScript execution** — Unlike Playwright MCP or Puppeteer, there is no `evaluate()` equivalent for running arbitrary JavaScript in the page context

4. **No network interception** — Cannot modify, block, or mock network requests (no equivalent to Playwright's `route()` or `intercept()`)

5. **Limited selector precision** — Uses accessibility identifiers rather than full CSS/XPath selectors, which may not target every element

6. **No file upload support** — Cannot programmatically upload files to file input elements

7. **No authentication helpers** — No built-in support for managing cookies, sessions, or credentials across runs

8. **No parallel browser instances** — Only one Safari instance; cannot run concurrent browser sessions

9. **No programmatic configuration** — Server settings are managed through System Settings UI, not environment variables or config files

10. **No extension support** — Cannot install or manage browser extensions programmatically

### Where Safari MCP Excels

1. **Zero setup** — Pre-installed, no `npm install` or Docker required
2. **Native integration** — Uses Safari's internal APIs, not WebDriver/CDP; more reliable element detection
3. **Accessibility-first** — The `get_page_structure` tool returns an accessibility tree, which is more stable than DOM-based approaches
4. **Security** — Runs within macOS's security model; no need to expose WebDriver ports
5. **User-transparent** — The agent uses the same browser the user sees, making it easier to monitor and debug
6. **Apple ecosystem** — Integrates with Apple Intelligence, Shortcuts, and other macOS features

## Practical Implications for AI Agent Development

### For macOS Users

- **Lower barrier to entry:** Non-technical users can enable browser automation for their AI assistant with a single toggle in Settings
- **Claude Desktop + Safari MCP:** Works out of the box with Claude Desktop on macOS Tahoe — just add the MCP server and start automating
- **Privacy advantage:** All browser automation stays on-device; no cloud browser service involved

### For Developers

- **Hybrid approach recommended:** Use Safari MCP for macOS-specific workflows and open-source alternatives (browser-use, Playwright MCP) for cross-platform or headless needs
- **Accessibility tree vs DOM:** Safari's accessibility-tree approach is more resilient to page structure changes but less precise for targeting specific elements
- **Schema-based extraction:** The `extract_data` tool with JSON schema support is a unique capability not found in most open-source alternatives

### Comparison with Open-Source Alternatives

| Feature | Safari MCP | browser-use | Playwright MCP |
|---------|-----------|-------------|----------------|
| Setup complexity | Toggle in Settings | `pip install` + config | `npm install` + config |
| Platform support | macOS only | Cross-platform | Cross-platform |
| Headless mode | ❌ No | ✅ Yes | ✅ Yes |
| JS execution | ❌ No | ✅ Yes | ✅ Yes |
| Network interception | ❌ No | ❌ Limited | ✅ Yes |
| Accessibility tree | ✅ Native | ❌ DOM-based | ❌ DOM-based |
| Schema extraction | ✅ Built-in | ❌ Manual | ❌ Manual |
| Parallel instances | ❌ Single | ✅ Multiple | ✅ Multiple |
| CI/CD compatible | ❌ No | ✅ Yes | ✅ Yes |
| File upload | ❌ No | ✅ Yes | ✅ Yes |

## Configuration Example

### Adding Safari MCP to Claude Desktop (macOS Tahoe)

```json
{
  "mcpServers": {
    "safari": {
      "command": "/System/Applications/Safari.app/Contents/MacOS/SafariMCP",
      "args": []
    }
  }
}
```

> **Note:** The exact command path may vary. On macOS Tahoe, the Safari MCP server is typically available as a system service that can be referenced by name.

### Example Agent Workflow

A typical agent workflow using Safari MCP might look like:

```
1. navigate_to_url(url: "https://example.com/products")
2. wait_for_condition(condition: "network_idle")
3. get_page_structure()          → Agent reads the page layout
4. click_element(selector: "Add to Cart button")
5. wait_for_condition(condition: "element_visible", selector: "checkout form")
6. type_text(selector: "email field", text: "user@example.com")
7. extract_data(schema: { "order_total": "number", "items": "array" })
```

## Key Takeaways

1. **Apple's Safari MCP is the first first-party browser MCP server** from a major browser vendor, signaling that browser automation via MCP is becoming a standard platform capability rather than just a third-party add-on.

2. **The 17 tools cover the essential browser automation primitives** — navigation, inspection, interaction, extraction, and synchronization — but lack advanced capabilities like JavaScript execution and network interception.

3. **Accessibility-tree-based interaction** is a differentiator: more stable across page updates but less granular than DOM-based approaches.

4. **The zero-setup advantage is significant** for consumer AI assistants but a limitation for developer/DevOps workflows that need headless, cross-platform, or CI-compatible browser automation.

5. **Hybrid approach is pragmatic:** Use Safari MCP for on-device macOS workflows and open-source alternatives (browser-use, Playwright MCP) for server-side or cross-platform needs.

## Apple's safaridriver --mcp vs. Community safari-mcp

Apple ships an official `safaridriver --mcp` with Safari Technology Preview 247+. A separate community project called `safari-mcp` also exists. They serve different use cases:

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

### Using Apple's safaridriver --mcp

**Prerequisites:**
1. Install [Safari Technology Preview](https://developer.apple.com/safari/technology-preview/)
2. Enable: Safari Settings → Advanced → Show features for web developers
3. Enable: Safari Settings → Developer → Enable remote automation and external agents

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

> **Practical recommendation:** Use Apple's official `safaridriver --mcp` for reproducible, isolated debugging and testing. Use the community `safari-mcp` when you need access to authenticated sessions, cookies, or background automation on stable Safari.

## References

- [WebKit: Introducing the Safari MCP server](https://webkit.org/blog/18136/introducing-the-safari-mcp-server-for-web-developers/)
- [DEV.to: Apple Shipped an Official Safari MCP — I Read All 17 Tools](https://dev.to/achiya-automation/apple-shipped-an-official-safari-mcp-i-read-all-17-tools-heres-why-im-keeping-mine-32l3)
- [Apple Developer: Safari MCP Server Documentation](https://developer.apple.com/documentation/safari-services/safari-mcp-server)
- [WWDC 2025 Sessions](https://developer.apple.com/videos/worldwide-developers-conference-2025/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [browser-use Framework](https://github.com/browser-use/browser-use)
- [Playwright MCP Server](https://github.com/anthropics/playwright-mcp)

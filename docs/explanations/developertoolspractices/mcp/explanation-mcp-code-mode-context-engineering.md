---
title: 'MCP Code Mode: Context Engineering by Calling Tools from a Program'
diataxis: Explanation
domain: developer-tools-practices
topic: mcp
source: DEV.to Tech News
source_url: https://dev.to/helpcode-ai/mcp-code-mode-in-anythingmcp-context-engineering-with-one-program-instead-of-dozens-of-tool-calls-bcj
date: '2026-11-17'
keywords:
- knowledge-base
- mcp
- developer-tools-practices
- explanations
---
# MCP Code Mode: Context Engineering by Calling Tools from a Program

## The problem: every intermediate result passes through the model
With plain MCP (Model Context Protocol), the agent calls one tool, **reads the whole result in context**, decides, and calls the next. Anthropic's "Effective context engineering for AI agents" frames context as "a finite resource with diminishing marginal returns"; in its "Code execution with MCP" example (Nov 2025), copying a two-hour meeting transcript from one tool to another adds ~50,000 tokens of pure plumbing.

Concrete case: "Which of our open quotes belong to customers who still have an overdue invoice?" with 40 open quotes = 1 list call + 40 invoice lookups = **41 turns through the model and 41 retained results**, when the answer is a five-line join.

## The idea: the agent writes a program, not a tool-call sequence
Code mode has the agent emit one short JavaScript program that calls the MCP tools, filters/joins/loops over the results in a sandbox, and returns **only the final value** to the model. 41 calls and 41 context-resident results collapse to 1 program, 1 turn, 1 result. The premise, per Cloudflare's "Code Mode" post (Sep 2025): *"LLMs are better at writing code to call MCP, than at calling MCP directly."*

## Reference implementation: AnythingMCP
AnythingMCP is an open-source MCP gateway putting one governed endpoint in front of existing ERPs, databases and APIs. Inside a code-mode program there is exactly one capability, the `amcp` object:

| Call | What it does |
| --- | --- |
| `amcp.search(query)` | Finds tools the caller may use |
| `amcp.describe(tool)` | Returns a tool's input schema |
| `amcp.run(tool, args)` | Calls the tool, returns its result as a value |

The quotes/invoices example becomes a loop over `amcp.run('crm_list_open_quotes', {})` with per-customer `amcp.run(...)` invoice lookups and a filtered array returned — the model never sees the 40 raw quote or invoice payloads.

**Security posture:** the program runs in a separate sandbox with **no network, no files, no secrets**, and can only invoke the tools the caller was already authorized to use — code mode changes the *calling style*, not the authorization boundary.

## When code mode pays off vs. not
- **Worth it:** many sequential/parallel calls, results that get filtered/joined/aggregated, large payloads where only a slice matters, multi-step pipelines (search → describe → run × N).
- **Not worth it:** single tool call, tiny results, or flows where the model must reason over each intermediate result before choosing the next call (the branching decision *is* the work).

## Relation to prior KB notes
Complements [[explanation-tool-descriptions-are-the-contract]]: good tool descriptions matter even more in code mode, because the agent discovers and composes tools programmatically via `search`/`describe` rather than through a curated prompt.

## References
- Original: [MCP code mode in AnythingMCP](https://dev.to/helpcode-ai/mcp-code-mode-in-anythingmcp-context-engineering-with-one-program-instead-of-dozens-of-tool-calls-bcj)
- Anthropic: [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- Anthropic: [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- Cloudflare: [Code Mode: the better way to use MCP](https://blog.cloudflare.com/code-mode/)

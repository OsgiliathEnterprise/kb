---
title: 'MCP at Two: Skills over MCP, Tasks, Elicitation, and the Extensions-First
  Strategy for Agent-Native Protocols'
diataxis: Explanation
domain: developer-tools-practices
topic: mcp
source: TheNewStack
source_url: https://thenewstack.io/mcp-skills-tasks-claude/
date: 2026-11-25
keywords:
- knowledge-base
- mcp
- developer-tools-practices
- explanations
---
# MCP at Two: Skills over MCP, Tasks, Elicitation, and the Extensions-First Strategy for Agent-Native Protocols

On MCP's second anniversary (launched November 2024 by Anthropic, now under the Linux Foundation's Agentic AI Foundation), the maintainers shipped an agent-native feature wave to Claude: **Skills over MCP** (public beta), **Tasks** and **Elicitation** (GA), and **file uploads** (draft extension, rolling out with Intuit/Dropbox). Adoption stats: MCP SDKs at **700M+ downloads/month** (up from 400M in July) and **10,000+ MCP connectors** for Claude. The architectural story is a deliberate **extensions-first strategy** driven by one constraint: with tens of thousands of servers in production, *removing a feature from the core protocol is no longer acceptable* — "adding things is easy, removing them is very hard."

## The four new primitives

| Feature | Status | What it does |
|---|---|---|
| **Tasks** | GA (Pro/Max/Ultra; Team/Enterprise rolling) | Server starts a long-running job in the background, reports back when done. E.g. ask an MCP server to investigate a failing CI run; the chat pops open hours later with the answer. ZoomInfo runs account/contact research jobs this way. |
| **Elicitation** | GA | Server pauses mid-call to ask the user for input — typically cost/irreversibility approval. Supabase confirms price before creating a paid project; GitHub makes the user type the repo name before deletion. |
| **Skills over MCP** | Public beta | MCP servers publish **Agent Skills** (a directory with `SKILL.md` + supporting files, per the Agent Skills spec) alongside their tools, discovered/read through the existing Resources primitive. Loaded into context only when needed; server-side so updates ship with the tools and users install nothing. |
| **File uploads** | Draft extension | Server provides an upload target (typically a pre-signed URL); the client PUTs the file directly over HTTPS — the bytes never enter the model's context. Replaces base64-in-tool-call hacks ("I can't rely on base64 and loading a 1.2 gigabyte file" — Delimarsky). No protocol-level size limits; servers set their own. |

## Why Skills over MCP is the interesting one

- A server can serve **role-specific skills** (a Figma server could ship a designer skill and an engineer skill) and even **per-user personalized skills** generated server-side behind the login it already requires — "You can totally imagine an MCP server that just generates a skill that's only for you" (Soria Parra). A static plugin can't do this.
- Publishing side is easy; **client-side support is the hard part**: "Skills are text that steers the model, and that comes with security and approval implications... Reading a file over MCP and giving it to a context is the easy part. Making sure that it's done safely and securely is a much harder piece." Treat server-supplied skill text as untrusted steering input — same threat class as tool-description injection in this KB.
- First movers: **Shopify** (skills walk Claude through building/updating a merchant store), **HubSpot**, **Atlassian**; Microsoft **Foundry** supports the extension in preview, so it isn't Claude-only.
- Availability note: on by default for Pro/Max/Ultra; Team admins must enable it; Enterprise coming.

## Extensions as the protocol's testing ground

All four features are **MCP extensions**, not core spec — any compatible client can implement them. The maintainers (Anthropic, Microsoft, Google, OpenAI, Amazon) use extensions to prototype with partners; some graduate to core, others never do (MCP Apps can't — "You need an HTML rendering interface, so terminals are out"). The graveyard proves the filter works: **sampling** (servers borrowing the client's model) was deprecated in the July 2026 spec — it "will keep working for at least 12 months" — and **prompts** have mostly fallen out of use. Meanwhile the **Events extension** (servers notifying agents) has been "a bit slow" to finalize, and **Workload Authorization Grant (WAG)** is in the works for agents accessing third-party services autonomously, alongside the **Enterprise-Managed Authorization** extension (built with Okta: admins authorize an MCP server once for all users).

This continues the trajectory of the **2026-07-28 spec** that removed sessions and made MCP stateless (load-balancer friendly — see related note). Design philosophy per co-creator David Soria Parra: "MCP never tries to predict where the future goes, but tries to pick up people where they currently are" — hence no agentic primitives at launch, only tools and resources, with agents driving year two.

## Governance and adoption context

- Anthropic donated MCP to the Linux Foundation's **Agentic AI Foundation (AAIF)** in December 2025; steering is largely unchanged but neutral governance helped adoption (AAIF VP Angie Jones: competing companies "bring real problems back to the project and solve them together").
- Working groups run in public — the file-uploads group is led by Anthropic's Den Delimarsky + two Google engineers, with Microsoft and Dropbox participating.
- The popularity tax: "Everybody wants to fit their tiny little use case in and comes with proposals exactly perfect for that, and it's a selection choice."

## Design takeaways

1. **Protocol + extensions beats version-breaking** once an ecosystem is in production: extensions are reversible experiments, core is forever.
2. **Agent-nativeness is an retrofit journey, not a launch requirement**: authorization assumed a human clicking consent; Tasks/Elicitation/WAG arrived once agents ran unattended.
3. **Offload long work to the server, keep the model out of the data plane** (Tasks for time, pre-signed URLs for bytes) — the model's context should carry conclusions, not payloads.
4. **Server-supplied instructions are a new attack surface**: Skills over MCP puts third-party steering text into context behind the trust of a logged-in server; client implementations own the safety problem.

## References

- The New Stack: [As MCP turns two, Claude gets Skills over MCP and better support for long-running tasks](https://thenewstack.io/mcp-skills-tasks-claude/)
- Official Skills extension: [modelcontextprotocol.io/extensions/skills/overview](https://modelcontextprotocol.io/extensions/skills/overview) and [MCP Skills Extension spec site](https://skills.extensions.modelcontextprotocol.io/)
- Tasks extension: [modelcontextprotocol.io/extensions/tasks/overview](https://modelcontextprotocol.io/extensions/tasks/overview)
- File uploads draft: [Exploring File Uploads and Downloads in MCP](https://blog.modelcontextprotocol.io/posts/exploring-file-uploads-and-downloads-in-mcp/)
- Related in KB: [MCP Context Tax](explanation-mcp-context-tax-tool-schema-tokens.md), [Tool Descriptions Are the Contract](explanation-tool-descriptions-are-the-contract.md), [MCP Protocol Era Silent Downgrade](explanation-mcp-protocol-era-silent-downgrade-2026-07-28.md)

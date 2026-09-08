---
title: Writing documentation.ai.md — Docs for AI Agents as an Open Standard
diataxis: Explanation
domain: developer-tools-practices
topic: agent-documentation
source: DEV.to Tech News
source_url: https://dev.to/kissoid/we-started-writing-docs-for-ai-agents-not-humans-and-made-it-an-open-standard-3ija
date: 2026-08-30
keywords:
- knowledge-base
- agent-documentation
- developer-tools-practices
- explanations
---
# Writing `documentation.ai.md` — Docs for AI Agents as an Open Standard

Most users of modern dev tools no longer start in a browser: they tell a coding agent "add this to my project," and the agent performs the install and wiring. When human-oriented docs are fed to such agents, failures follow a pattern: the agent invents a config flag that doesn't exist, reaches for the wrong port, or calls an endpoint that is *almost* right. The root cause is not model quality — it is that the docs were written to persuade and onboard a **human**, so the agent must reconstruct facts from prose scattered across paragraphs.

> A fact an agent has to infer is a fact you failed to state.

## The fix: a second document for a different reader

Per release, ship `documentation.ai.md` alongside human docs. It is not a terser translation — it is a different document for a different reader, held to a stricter standard of precision. Requirements: English, dense, self-sufficient (an agent that read *only* this file can install, configure and call the product), with fixed sections in order:

1. One-line identity
2. Install / run — exact commands, exact image names and ports
3. Configuration — every env var / key, with its default
4. API quickstart — a real request/response, not pseudocode
5. Admin surface — how the first credential is obtained, common operations
6. Architecture facts that affect integration
7. Links

Two additional rules: no marketing language, and absolute honesty about status — if something is early or unaudited, the file says so, because an agent recommending an unstable feature to a user on the strength of oversold docs is a real failure mode.

## Relationship to llms.txt

`documentation.ai.md` does not replace [llms.txt](https://llmstxt.org/): that is a **site-level index** of content; `documentation.ai.md` is a **per-product, per-release operational doc**, closer in spirit to `llms-full.txt` (complete, not an index). The two compose cleanly.

## Standardization

The format was written up as an open standard under CC BY 4.0:

- GitHub: [iwasoftcom/ai-docs-standard](https://github.com/iwasoftcom/ai-docs-standard)
- Write-up: [iwasoft.com/blog/ai-docs-standard](https://iwasoft.com/blog/ai-docs-standard)

## Adjacent standard: AGENTS.md

`documentation.ai.md` is a per-product *operational* doc. The broader, now-dominant convention in the same space is **AGENTS.md** — a plain-Markdown file at the repository root that gives coding agents project-specific build/test/convention guidance (a "README for agents"). Released by OpenAI in August 2025 and adopted by 60,000+ open-source projects, AGENTS.md is now stewarded by the **Agentic AI Foundation** under the Linux Foundation (formed Dec 2025 alongside MCP and goose), with native support across Codex, Cursor, Copilot, Gemini CLI, Windsurf, Aider, and 20+ other tools. The two are complementary: AGENTS.md tells an agent how to work *inside a repo*; `documentation.ai.md` tells it how to *install and call a product* from outside. Where AGENTS.md is loose (any Markdown headings, nearest-file-wins precedence in monorepos), the ai-docs standard is deliberately stricter (fixed section order, per-release operational doc).

## Key takeaways

- If you build developer tools, your users' agents are already reading your docs — write the version they actually need.
- Precision beats persuasion for machine readers: exact commands, ports, env vars with defaults, real (not pseudocode) API examples.
- Honesty about maturity is a functional requirement, not a style choice.

## References

- [We started writing docs for AI agents, not humans — and made it an open standard (DEV.to)](https://dev.to/kissoid/we-started-writing-docs-for-ai-agents-not-humans-and-made-it-an-open-standard-3ija)
- [AI Docs Standard repository](https://github.com/iwasoftcom/ai-docs-standard)
- [llms.txt specification](https://llmstxt.org/)
- [AGENTS.md — open format for guiding coding agents](https://agents.md/)
- [Linux Foundation: Agentic AI Foundation formation (AGENTS.md, MCP, goose)](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)

## Related
- [[explanation-openai-hugging-face-agent-incident]]
- [[explanation-lm-studio-bionic-shell-judge-auto-review]]
- [[explanation-llm-inference-engine-exploits]]

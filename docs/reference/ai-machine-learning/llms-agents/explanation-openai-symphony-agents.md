---
title: 'OpenAI Open-Sources Symphony: Autonomous Coding Agent Orchestration'
diataxis: Explanation
domain: AI & Machine Learning
topic: LLMs & Agents
source: InfoQ
source_url: https://www.infoq.com/news/2026/05/openai-symphony-agents/?utm_campaign=infoq_content&utm_source=infoq&utm_medium=feed&utm_term=news
date: 2026-05-18
keywords:
- knowledge-base
- LLMs & Agents
- AI & Machine Learning
- reference
---
# OpenAI Open-Sources Symphony: Autonomous Coding Agent Orchestration

## Summary
OpenAI released **Symphony**, an open-source agent orchestrator that uses project-management tools (issue trackers) as a **control plane** to coordinate multiple autonomous coding agents. Instead of managing interactive coding sessions, Symphony manages discrete "tasks," assigning each to a dedicated agent that works autonomously until completion.

## Why This Matters
Traditional agentic workflows required engineers to manually manage 3-5 concurrent sessions before context switching became painful. Symphony eliminates this bottleneck by shifting from **session/PR-centric** to **deliverable-centric** workflows, enabling scalable parallel agent execution without overwhelming human attention.

## Key Points
- **Continuous Monitoring:** Watches the task board and ensures every active task has a dedicated agent
- **Self-Healing:** Automatically restarts crashed/stalled agents; picks up new work dynamically
- **Decoupled from PRs:** Agents analyze codebases, generate plans, break them into hierarchical task trees, and autonomously open new issues
- **Human-in-the-Loop Gate:** Developers review and approve tasks *before* execution
- **Reference Implementation:** Distributed as `SPEC.md` — teams should adapt it to their own workflows
- **Built in Elixir:** Chosen for its process supervision model for fault-tolerant concurrent orchestration

## Key Quotes
> "Each engineer would open a few Codex sessions, assign tasks, review the output, steer the agent, and repeat. In practice, most people could comfortably manage three to five sessions at a time before context switching became painful."

> "Symphony continuously watches the task board and ensures that every active task has an agent running in the loop until it's done."

## Actionable Takeaways
- Use existing issue trackers as control planes for agentic work instead of building custom supervision layers
- Design workflows where humans approve tasks upfront and review outputs post-completion
- Consider Elixir's process supervision model for building custom orchestrators

## Related Topics
- [[howto-anthropic-routines-claude|Anthropic Routines for Claude Code]]
- [[example-structured-prompt-driven-development-spdd|Structured-Prompt-Driven Development (SPDD)]]

## References
- 📰 [OpenAI Symphony Agents](https://www.infoq.com/news/2026/05/openai-symphony-agents/) via InfoQ (May 17, 2026)

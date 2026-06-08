---
title: 'browser-use: Open-Source Browser Automation for AI Agents'
diataxis: Explanation
domain: AI-Infrastructure
topic: Agent-Tooling
source: ''
source_url: https://dev.to/lynkr/what-is-browser-use-and-how-to-run-it-through-lynkr-9fn
keywords:
- knowledge-base
- Agent-Tooling
- AI-Infrastructure
- explanations
---
# browser-use: Open-Source Browser Automation for AI Agents

## Overview

browser-use is an open-source Python framework (97.5k+ GitHub stars) that gives LLM agents access to a real browser. Unlike text-only AI agents, browser-use enables agents to inspect page state, click buttons, type into inputs, extract information, and navigate across sites — completing real browser workflows from a prompt.

**Key use case**: Automating tasks on systems that only exist behind a browser (no clean API).

## What browser-use Does

browser-use bridges the gap between LLM reasoning and real-world browser interaction:

| Capability | Description |
|------------|-------------|
| Page inspection | Agent sees current DOM state |
| Click actions | Click buttons, links, menu items |
| Input handling | Type into forms, fill fields |
| Information extraction | Pull data from dashboards, pages |
| Navigation | Move across sites and pages |
| Workflow completion | End-to-end task automation |

### Common Use Cases

- Filling out forms across multiple sites
- Pulling data from dashboards without APIs
- Logging into tools and clicking through UI flows
- Checking prices, calendars, tickets, or inventory
- Testing internal tools
- Handling repetitive browser tasks

## Core Concepts

### Architecture

```
Browser()    — Handles the browser session
Agent(...)   — Handles the goal and step-by-step decisions
LLM=...      — Controls which model makes decisions
```

### Quick Start

```python
from browser_use import Agent, Browser
from browser_use.llm import ChatBrowserUse
import asyncio

async def main():
    browser = Browser()
    agent = Agent(
        task="Find the number of stars of the browser-use repo",
        llm=ChatBrowserUse(),
        browser=browser,
    )
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())
```

## Token Optimization Strategies

Browser agents are inherently expensive because they are:
- Multi-step (each action requires an LLM call)
- Tool-heavy (browser actions count as tools)
- Iterative (retrying on errors multiplies cost)
- Exploratory (navigating pages generates many calls)

### Token-Saving Techniques

1. **Use Lynkr as LLM gateway** — Route different steps to cost-appropriate models
2. **Tiered routing** — Use cheaper models for simple navigation, expensive models for complex reasoning
3. **Cache repeated page states** — Avoid re-sending identical DOM snapshots
4. **Prompt compression** — Summarize page state before sending to LLM
5. **Early termination** — Stop the agent when the goal is clearly achieved

### Gateway Architecture

```
browser-use agent
    ↓
Lynkr (LLM gateway)
    ↓
Ollama / OpenRouter / Bedrock / OpenAI / Azure / Databricks
```

By placing a gateway between the browser agent and LLM providers, you gain:
- Model flexibility (switch providers without code changes)
- Cost optimization (route simple tasks to cheaper models)
- Token tracking (monitor usage across all providers)
- Fallback handling (automatic failover if a provider is down)

## Step-by-Step: Setting Up browser-use

### Step 1: Install Dependencies

```bash
pip install browser-use
```

### Step 2: Configure Your LLM

```python
from browser_use import Agent, Browser
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")  # Or any supported model
```

### Step 3: Define Your Task

```python
browser = Browser()
agent = Agent(
    task="Go to example.com, find the latest article title, and return it",
    llm=llm,
    browser=browser,
)
```

### Step 4: Run the Agent

```python
import asyncio
asyncio.run(agent.run())
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│           browser-use Agent Architecture             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │              User Task/Prompt                │    │
│  │  "Find the price of X on Y website"         │    │
│  └──────────────────┬──────────────────────────┘    │
│                     │                               │
│                     ▼                               │
│  ┌─────────────────────────────────────────────┐    │
│  │              Agent Controller                │    │
│  │  ┌─────────────┐  ┌─────────────────────┐   │    │
│  │  │ Goal Parser │  │ Step Planner        │   │    │
│  │  └─────────────┘  └─────────────────────┘   │    │
│  └──────────────────┬──────────────────────────┘    │
│                     │                               │
│                     ▼                               │
│  ┌─────────────────────────────────────────────┐    │
│  │              LLM Gateway (Optional)          │    │
│  │  ┌─────────────┐  ┌─────────────────────┐   │    │
│  │  │ Model Router│  │ Token Optimizer     │   │    │
│  │  └─────────────┘  └─────────────────────┘   │    │
│  └──────────────────┬──────────────────────────┘    │
│                     │                               │
│                     ▼                               │
│  ┌─────────────────────────────────────────────┐    │
│  │              Browser Engine                  │    │
│  │  ┌─────────────┐  ┌─────────────────────┐   │    │
│  │  │ Page State  │  │ Action Executor     │   │    │
│  │  │ Inspector   │  │ (click, type, nav)  │   │    │
│  │  └─────────────┘  └─────────────────────┘   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Cost Considerations

### Why Browser Agents Are Expensive

| Factor | Impact |
|--------|--------|
| Multi-step workflows | Each step = one LLM call |
| Page state serialization | Full DOM snapshots in context |
| Error recovery | Retries multiply token usage |
| Exploration | Unstructured navigation generates many calls |

### Optimization Tips

1. **Use smaller models for navigation** — GPT-4o for reasoning, GPT-3.5 or local models for simple clicks
2. **Compress page state** — Send only relevant DOM sections, not the full page
3. **Set token budgets** — Prevent runaway costs on complex tasks
4. **Cache results** — Reuse results for repeated queries
5. **Use Lynkr's tiered routing** — Automatic model selection based on task complexity

## Best Practices

1. **Start with simple tasks** — Test with straightforward navigation before complex workflows
2. **Set timeouts** — Prevent agents from running indefinitely
3. **Monitor token usage** — Track costs per task and per model
4. **Use headless mode in production** — Reduce resource usage
5. **Implement error handling** — Agents will encounter unexpected page states
6. **Log agent actions** — Audit trail for debugging and compliance
7. **Test with multiple models** — Different models handle browser tasks differently

## References

- [DEV.to: What Is browser-use? And How to save 50% of tokens](https://dev.to/lynkr/what-is-browser-use-and-how-to-run-it-through-lynkr-9fn)
- [browser-use GitHub Repository](https://github.com/browser-use/browser-use)
- [Lynkr LLM Gateway](https://lynkr.ai)

---
title: 'Vercel Eve: Open-Source Framework Treating Agents as Directories'
diataxis: Explanation
domain: Developer Tools & Practices
topic: Agent Frameworks
source: TheNewStack
source_url: https://thenewstack.io/vercel-eve-agents-as-directories/
date: 2026-07-09
keywords:
- knowledge-base
- Agent Frameworks
- Developer Tools & Practices
- explanations
---
# Vercel Eve: Open-Source Framework Treating Agents as Directories

## Overview

Vercel launched **Eve**, an open-source framework for building AI agent systems that takes a filesystem-first approach to agent design. Rather than treating agents as opaque runtime entities, Eve models agents as directory structures — each agent is a folder containing its configuration, tools, prompts, and state. This approach makes agent systems more transparent, version-controllable, and composable.

The framework is built on Node.js/TypeScript and integrates with Vercel's existing AI SDK ecosystem.

## The Problem: Agent Systems Are Opaque

Traditional AI agent frameworks tend to treat agents as black-box runtime objects:

```
┌─────────────────────────────────┐
│        Agent Runtime            │
│  ┌─────────┐  ┌─────────┐      │
│  │ Agent A │  │ Agent B │  ← Opaque            │
│  └─────────┘  └─────────┘      │
└─────────────────────────────────┘
```

Problems with this approach:

- **No version control**: Agent configurations live in memory or databases, not in files
- **Difficult debugging**: Hard to inspect what an agent "knows" at any point
- **Poor composability**: Agents are tightly coupled to their runtime
- **Testing challenges**: Cannot snapshot or replay agent states

## The Eve Approach: Agents as Directories

### Directory Structure

In Eve, each agent is a directory on the filesystem:

```
agents/
├── researcher/
│   ├── agent.json          # Agent configuration
│   ├── prompt.md           # System prompt
│   ├── tools/              # Available tools
│   │   ├── web_search.json
│   │   └── file_read.json
│   └── state/              # Agent state (version-controlled)
│       ├── memory.json
│       └── context.json
├── coder/
│   ├── agent.json
│   ├── prompt.md
│   ├── tools/
│   │   ├── git.json
│   │   └── terminal.json
│   └── state/
│       └── memory.json
└── reviewer/
    ├── agent.json
    ├── prompt.md
    ├── tools/
    │   └── code_review.json
    └── state/
        └── memory.json
```

### Agent Configuration (`agent.json`)

```json
{
  "name": "researcher",
  "model": "anthropic/claude-sonnet-5",
  "max_tokens": 4096,
  "temperature": 0.3,
  "tools": ["web_search", "file_read"],
  "permissions": {
    "network": true,
    "filesystem": "read-only",
    "shell": false
  },
  "composable_with": ["coder", "reviewer"]
}
```

### System Prompt as Markdown

Unlike frameworks that embed prompts in code, Eve stores prompts as `.md` files:

```markdown
# Researcher Agent

You are a technical research assistant. Your job is to:

1. Search for relevant technical documentation
2. Extract key facts and code examples
3. Summarize findings in structured format

## Constraints

- Only use tools listed in your configuration
- Always cite sources
- Never execute shell commands
```

## Technical Architecture

### Runtime Model

Eve's runtime reads agent directories and constructs agent instances dynamically:

```typescript
import { createAgent, AgentRuntime } from '@vercel/eve';

// Load agent from directory
const researcher = await createAgent('./agents/researcher');

// Run agent with a task
const result = await researcher.run({
  task: 'Research the latest ZGC garbage collector improvements',
  maxSteps: 10,
  onToolCall: (tool, input) => {
    console.log(`[Tool] ${tool}:`, input);
  }
});

console.log(result.summary);
console.log(result.sources);
```

### Agent Orchestration

Eve supports multi-agent workflows through a declarative orchestration file:

```json
{
  "workflow": "research-and-implement",
  "steps": [
    {
      "agent": "researcher",
      "task": "Research the topic and gather requirements",
      "output_to": "shared_context"
    },
    {
      "agent": "coder",
      "task": "Implement the solution based on research findings",
      "input_from": "shared_context",
      "output_to": "code_changes"
    },
    {
      "agent": "reviewer",
      "task": "Review the code changes for quality and correctness",
      "input_from": ["code_changes", "shared_context"],
      "output_to": "review_report"
    }
  ]
}
```

### State Persistence

Agent state is persisted to the filesystem, enabling:

- **Reproducibility**: Replay agent behavior from a specific state
- **Version control**: Track agent evolution in Git
- **Debugging**: Inspect intermediate state at any point

```typescript
// Save agent state
await researcher.saveState('./agents/researcher/state/memory.json');

// Restore agent state
const restored = await researcher.restoreState('./agents/researcher/state/memory.json');

// Diff agent states
const diff = await Eve.diffStates(
  './agents/researcher/state/memory-v1.json',
  './agents/researcher/state/memory-v2.json'
);
```

## Key Features

### 1. Tool Gating

Each agent's tools are explicitly declared in its directory:

```json
// agents/researcher/tools/web_search.json
{
  "name": "web_search",
  "description": "Search the web for information",
  "parameters": {
    "query": { "type": "string", "required": true },
    "max_results": { "type": "number", "default": 5 }
  },
  "rate_limit": "10/minute",
  "cost_per_call": 0.002
}
```

### 2. Composable Agents

Agents can call other agents as tools:

```typescript
// The coder agent can delegate to the researcher
const coder = await createAgent('./agents/coder', {
  delegateTo: ['researcher']
});

// When coder needs information, it delegates:
const info = await coder.delegate('researcher', {
  task: 'Find the API documentation for X'
});
```

### 3. Observability

Eve logs all agent activity to structured files:

```
agents/researcher/logs/
├── 2026-07-09/
│   ├── run-001.json          # Full run trace
│   ├── tool-calls.jsonl      # Tool call log
│   └── token-usage.json      # Cost tracking
```

### 4. Integration with Vercel AI SDK

Eve builds on Vercel's existing AI SDK:

```typescript
import { streamText } from 'ai';
import { EveAgent } from '@vercel/eve';

const agent = new EveAgent('./agents/researcher');

const stream = agent.stream({
  prompt: 'How does ZGC generational mode work?',
  onChunk: (chunk) => process.stdout.write(chunk.text)
});

const response = await stream.getFinalResponse();
```

## Use Cases

### 1. Development Workflows

Teams can define specialized agents for different development tasks:

```
dev-agents/
├── code-reviewer/    # Automated PR reviews
├── test-generator/   # Generate unit tests
├── docs-writer/      # Write documentation
└── security-auditor/ # Security code scanning
```

### 2. Research Pipelines

Multi-agent research workflows:

```
research-pipeline/
├── topic-analyzer/   # Break down research questions
├── literature-review/ # Survey existing research
├── data-collector/   # Gather data and benchmarks
└── synthesizer/      # Combine findings into reports
```

### 3. Agent Marketplaces

The directory-based model enables sharing agents as packages:

```bash
# Install a pre-built agent
npm install @agents/web-scraper

# Use it in your project
import { WebScraperAgent } from '@agents/web-scraper';
```

## Comparison with Other Frameworks

| Feature | Eve | LangGraph | AutoGen | CrewAI |
|---------|-----|-----------|---------|--------|
| Filesystem-first | ✅ | ❌ | ❌ | ❌ |
| Git-versionable | ✅ | Partial | ❌ | ❌ |
| Declarative config | ✅ | Code-based | Code-based | Code-based |
| Tool gating | ✅ | ✅ | ✅ | ✅ |
| State persistence | ✅ | ✅ | Partial | Partial |
| Multi-agent orchestration | ✅ | ✅ | ✅ | ✅ |
| Vercel AI SDK integration | ✅ | ❌ | ❌ | ❌ |

## References

- [Vercel Eve GitHub Repository](https://github.com/vercel/eve)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)

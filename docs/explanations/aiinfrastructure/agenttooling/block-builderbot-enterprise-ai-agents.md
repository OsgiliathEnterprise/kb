---
title: 'Block BuilderBot: Managing AI Coding Agent Fleets at Enterprise Scale'
diataxis: Explanation
domain: AI-Infrastructure
topic: Agent-Tooling
source: The New Stack
source_url: https://thenewstack.io/how-block-manages-its-fleet-of-ai-coding-agents-from-slack/
date: 2026-06-26
keywords:
- knowledge-base
- Agent-Tooling
- AI-Infrastructure
- explanations
---
# Block BuilderBot: Managing AI Coding Agent Fleets at Enterprise Scale

## Overview

Block (formerly Square) has built **BuilderBot**, an internal AI coding agent system that manages over 200,000 operations per day and merges approximately 1,500 pull requests per week — roughly 15% of all production code changes across the company.

BuilderBot is not a product for sale; it is an internal tool that Block is sharing publicly as a blueprint for other organizations facing the challenge of scaling AI-assisted development across large engineering organizations.

**Key metrics**:
- 200,000+ operations per day
- 1,500 pull requests merged per week
- 15% of all production code changes
- Work that took months now takes days

## The Problem: Scaling AI Coding Across Enterprises

### The Challenge

As AI coding tools mature, organizations face a fundamental question: How do you manage hundreds of AI agents working across thousands of services, multiple codebases, and diverse engineering teams?

Block's specific challenges:
- **Scale**: Multiple product lines (Cash App, Square) with different tech stacks
- **Integration**: AI agents need to understand company-specific conventions, APIs, and service boundaries
- **Governance**: Ensuring AI-generated code meets quality and security standards
- **Coordination**: Preventing AI agents from conflicting with each other or human engineers

```
┌─────────────────────────────────────────────────────────────────────┐
│              Enterprise AI Agent Scaling Challenge                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Individual AI Coding Tools:                                        │
│  • Work well for single developers                                   │
│  • Lack organizational context                                      │
│  • Cannot coordinate across services                                │
│  • Don't understand company conventions                             │
│                                                                     │
│  Enterprise AI Agent Fleet:                                         │
│  • Needs service-level awareness                                    │
│  • Must respect organizational boundaries                           │
│  • Requires governance and auditability                             │
│  • Must integrate with existing workflows                           │
│                                                                     │
│  Gap: The "missing layer" between individual AI tools and           │
│       enterprise engineering reality                                 │
└─────────────────────────────────────────────────────────────────────┘
```

## BuilderBot Architecture

### Core Capabilities

BuilderBot distinguishes itself from generic AI coding assistants through:

1. **Service awareness**: Understands every service, API, and convention across Block
2. **Cross-service capability**: An engineer working on Cash App can make changes in a Square service they've never touched
3. **Data isolation**: Operates solely on source code and system configurations — never on customer data or payment information
4. **Slack integration**: Engineers interact with BuilderBot through Slack, fitting into existing communication patterns

### The MCP Connection

Block's experience building Goose (their earlier AI coding tool) led them to co-develop the **Model Context Protocol (MCP)** with Anthropic. MCP is now a standard for connecting agents to tools, adopted by OpenAI, Google, and others.

```
┌─────────────────────────────────────────────────────────────────────┐
│              BuilderBot Architecture Overview                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐                                                │
│  │   Slack UI      │  Engineer interaction layer                     │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │  BuilderBot     │  AI agent orchestration                         │
│  │  Orchestrator   │  - Task decomposition                           │
│  │                │  - Service routing                                │
│  │                │  - Quality gates                                  │
│  └────────┬────────┘                                                │
│           │                                                         │
│     ┌─────┴──────┐                                                  │
│     │            │                                                   │
│     ▼            ▼                                                   │
│  ┌────────┐  ┌────────┐                                            │
│  │Service │  │Service │  AI agents with service-specific context    │
│  │Agent 1 │  │Agent 2 │                                            │
│  └────────┘  └────────┘                                            │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │  Code Review    │  Automated PR generation and review             │
│  │  & Merge        │  - Quality checks                               │
│  │                 │  - Security scanning                            │
│  │                 │  - Compliance validation                        │
│  └─────────────────┘                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Slack as the interface**: No new tool to learn. Engineers interact with BuilderBot where they already communicate.

2. **Service-level context**: BuilderBot understands the architecture of every service in Block's ecosystem, enabling cross-service changes that generic AI tools cannot make.

3. **Data isolation**: BuilderBot never touches customer data or payment information. It works exclusively with source code and system configurations.

4. **Human oversight**: While BuilderBot handles scaffolding and repetitive work, humans make the calls that shape product direction.

## The Goose Orchestration System

### Architecture Principles

Block's earlier AI coding tool, Goose, established the orchestration patterns that BuilderBot evolved from:

1. **Centralized orchestration**: All agent requests flow through Goose, which handles routing, authentication, and logging
2. **Slack integration**: Developers interact with agents through Slack channels and direct messages
3. **Tool registry**: Goose maintains a catalog of available tools and which agents can access them
4. **Policy enforcement**: Security policies and coding standards are applied uniformly across all agents

### Key Features

- **Unified interface**: One Slack workspace for all agent interactions
- **Agent specialization**: Different agents handle different tasks (code review, debugging, testing, documentation)
- **Human-in-the-loop**: Critical operations require human approval before execution
- **Audit logging**: All agent actions are logged for security and compliance

### Enterprise AI Agent Management Lessons

- **Centralized orchestration** is more scalable than decentralized agent deployment
- **Familiar interfaces** (like Slack) reduce adoption friction
- **Policy enforcement** must be built into the orchestration layer, not individual agents
- **Observability** is critical for maintaining trust in AI agent systems

## Measured Impact

### Productivity Gains

- **Months → Days**: Features that previously took months to ship now ship in days
- **1,500 PRs/week**: BuilderBot merges approximately 15% of all production code changes
- **200,000 operations/day**: The system handles massive scale without degradation

### Quality Outcomes

- **No quality regression**: Despite the volume, code quality standards are maintained
- **Faster iteration**: Engineers can validate ideas faster, leading to more learning cycles
- **Reduced scaffolding overhead**: BuilderBot handles boilerplate, freeing engineers for design work

## Lessons for Enterprise AI Adoption

### 1. Build Organizational Context Into Your AI Tools

Generic AI coding assistants lack the service-level understanding needed for enterprise work. BuilderBot's ability to make cross-service changes is its key differentiator.

**Recommendation**: Invest in building or integrating service catalog awareness into your AI tooling.

### 2. Fit Into Existing Workflows

BuilderBot's Slack integration means engineers don't need to learn a new platform. This is critical for adoption at scale.

**Recommendation**: Integrate AI tools into existing communication and collaboration platforms.

### 3. Separate Code from Data

BuilderBot's strict isolation between source code and customer data is a best practice for AI agent security.

**Recommendation**: Design AI agent systems with clear data boundaries from the start.

### 4. Automate the Boring, Empower the Creative

BuilderBot handles scaffolding and repetitive work while humans make product-shaping decisions.

**Recommendation**: Identify which tasks are truly repetitive vs. which require human judgment.

### 5. Share Your Blueprint, Not Your Tool

Block is sharing the architecture and patterns behind BuilderBot, not the tool itself. This allows other organizations to adapt the approach to their own context.

**Recommendation**: Document and share your AI agent architecture patterns, even if the tools themselves are proprietary.

## Implementation Considerations

### For Organizations Starting Their AI Agent Journey

```
Phase 1: Individual AI Coding Tools
• Deploy AI coding assistants to individual engineers
• Measure adoption and productivity impact
• Identify common patterns and pain points

Phase 2: Service-Aware AI Agents
• Build service catalog integration
• Add organizational context to AI agents
• Implement quality gates and security scanning

Phase 3: Coordinated Agent Fleet
• Enable cross-service AI agent operations
• Implement agent-to-agent coordination
• Add automated PR generation and review

Phase 4: Enterprise-Scale Orchestration
• Scale to thousands of operations per day
• Implement comprehensive monitoring and observability
• Continuously refine service context and quality gates
```

### Risk Mitigation

- **Start small**: Begin with non-customer-facing services
- **Monitor closely**: Track code quality metrics alongside productivity gains
- **Maintain human oversight**: Keep humans in the loop for critical decisions
- **Iterate on governance**: Evolve quality gates as you learn what works

## Key Takeaways

1. **Scale requires orchestration**: Individual AI tools don't scale to enterprise needs without coordination
2. **Context is everything**: Service-level awareness is what separates enterprise AI from generic AI
3. **Workflow integration matters**: Fit AI tools into existing communication patterns
4. **Data isolation is non-negotiable**: AI agents should never access customer data
5. **Automation enables creativity**: Handle boilerplate automatically so humans can focus on design
6. **Share patterns, not tools**: Document your architecture for broader industry benefit

## References

- [How Block manages its fleet of AI coding agents from Slack](https://thenewstack.io/how-block-manages-its-fleet-of-ai-coding-agents-from-slack/)
- [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io/)
- [Block Engineering Blog](https://developers.block.com/blog/)

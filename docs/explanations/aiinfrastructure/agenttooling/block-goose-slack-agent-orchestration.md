---
title: 'How Block Manages AI Coding Agents from Slack: The Goose Orchestration System'
diataxis: Explanation
domain: AI-Infrastructure
topic: Agent-Tooling
source: TheNewStack
source_url: https://thenewstack.io/how-block-manages-its-fleet-of-ai-coding-agents-from-slack/
date: 2026-06-24
keywords:
- knowledge-base
- Agent-Tooling
- AI-Infrastructure
- explanations
---
# How Block Manages AI Coding Agents from Slack: The Goose Orchestration System

## Overview

Block (formerly Square) built its own AI agent orchestration system called "Goose" and manages its entire fleet of AI coding agents through Slack. This approach demonstrates how a large engineering organization can centralize agent management while giving developers a familiar interface for interacting with AI tools.

## The Challenge: Agent Fleet Management

As organizations adopt AI coding assistants at scale, they face several management challenges:

- **Agent proliferation**: Different teams build their own agents with varying capabilities
- **Consistency**: Ensuring all agents follow security and coding standards
- **Observability**: Tracking what agents are doing across the organization
- **Cost control**: Managing LLM API costs across hundreds of agent invocations

## The Goose System

### Architecture

1. **Centralized orchestration**: All agent requests flow through Goose, which handles routing, authentication, and logging
2. **Slack integration**: Developers interact with agents through Slack channels and direct messages
3. **Tool registry**: Goose maintains a catalog of available tools and which agents can access them
4. **Policy enforcement**: Security policies and coding standards are applied uniformly across all agents

### Key Features

- **Unified interface**: One Slack workspace for all agent interactions
- **Agent specialization**: Different agents handle different tasks (code review, debugging, testing, documentation)
- **Human-in-the-loop**: Critical operations require human approval before execution
- **Audit logging**: All agent actions are logged for security and compliance

## Lessons for Enterprise AI Agent Management

- **Centralized orchestration** is more scalable than decentralized agent deployment
- **Familiar interfaces** (like Slack) reduce adoption friction
- **Policy enforcement** must be built into the orchestration layer, not individual agents
- **Observability** is critical for maintaining trust in AI agent systems

## Key Takeaways

- Block's Goose system shows how to manage AI agent fleets at enterprise scale
- Slack as an agent management interface reduces the learning curve for developers
- Centralized orchestration enables consistent security and quality standards
- The pattern of "specialized agents + unified interface" is emerging as best practice

## References

- [How Block manages its fleet of AI coding agents from Slack](https://thenewstack.io/how-block-manages-its-fleet-of-ai-coding-agents-from-slack/)
- [Goose open-source project](https://github.com/block/goose)

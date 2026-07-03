---
title: "Steerability via Constraints for Scalable Oversight of Coding Agents"
diataxis: Explanation
domain: AI Infrastructure
topic: Agent Security
source: "arXiv"
source_url: "https://arxiv.org/abs/2607.02389"
arxiv_id: "2607.02389"
date: 2026-07-02
keywords:
- coding-agents
- agent-oversight
- access-control
- scalable-oversight
- security-review
visibility: public
---
# Steerability via Constraints: A Substrate for Scalable Oversight of Coding Agents

## Overview

Autonomous coding agents are increasingly capable, but human oversight remains the bottleneck for safe deployment. This paper argues that the same infrastructure controls used for decades to manage large human engineering teams — access control, network policies, strict coding conventions enforced by tooling — transfer directly to coding agents and are more cost-effective (in tokens) than recent agentic scaffolding approaches.

## Problem Statement

Unconstrained coding agents introduce three categories of risk:

1. **Security risks**: Agents with unrestricted access can introduce vulnerabilities or backdoors
2. **Scalability erosion**: Without constraints, codebase complexity grows uncontrollably
3. **Review cost explosion**: Human review becomes increasingly expensive as agent autonomy increases

Recent approaches to agent oversight rely on complex agentic scaffolding (multi-agent review chains, specialized reviewer agents), which are token-expensive and add latency.

## Key Contribution

The paper proposes that **infrastructure-level constraints** are a more efficient substrate for agent oversight than agentic scaffolding. The key insight is that constraints reduce the search space that reviewers need to inspect, making oversight more effective without requiring more capable reviewer models.

### Design Principle
The same methods that make large human engineering teams manageable should make autonomous coding agents manageable:
- Access control policies
- Network isolation
- Coding conventions enforced by automated tooling
- Restricted execution environments

## Technical Approach

### Controlled Experiment
A small reviewer model (Gemma 4 e4b) inspects a Python codebase containing 11 deliberately inserted backdoors. The experiment compares two conditions:

1. **Unconstrained baseline**: No infrastructure constraints, reviewer has no tooling
2. **Constrained substrate**: Infrastructure constraints in place plus a ~200-line `docs` CLI tool

### Why Python
Python was chosen deliberately because it provides few safety guarantees by default — if constraints help in Python, the principles should extend even more naturally to languages like Rust that have stronger built-in guarantees.

## Results

### Recall Improvement
- **Unconstrained (no tools)**: 54.5% backdoor detection recall
- **Constrained substrate + tooling**: 90.9% backdoor detection recall

### Independent Contributions
Both the substrate (infrastructure constraints) and the tooling contribute independently to the improvement. This means constraints make the reviewer's job easier even without additional tools, and tools are more effective when the substrate is constrained.

### Token Efficiency
The constrained approach achieves higher recall using a smaller reviewer model (Gemma 4 e4b), making it more token-efficient than approaches that require larger reviewer models.

## Relevance to Our Domain

This research has direct implications for AI agent deployment:

1. **Practical security**: Infrastructure constraints are easier to implement and maintain than complex multi-agent review systems
2. **Cost reduction**: Smaller reviewer models can achieve high recall when the substrate is well-constrained
3. **Defense in depth**: Constraints at the infrastructure layer complement (rather than replace) agent-level safety measures
4. **Scalability**: The approach scales to larger codebases because constraints reduce the effective review surface
5. **Language-agnostic principles**: The substrate approach applies across programming languages and agent frameworks

## References

- Winninger T. *Steerability via constraints: a substrate for scalable oversight of coding agents*. arXiv:2607.02389 [cs.AI], 2026-07-02. DOI: 10.48550/arXiv.2607.02389
- Accepted at: Deep Learning for Code Workshop, ICML 2026, Seoul, South Korea
- Related work: Agent sandboxing, access control systems, and automated code review

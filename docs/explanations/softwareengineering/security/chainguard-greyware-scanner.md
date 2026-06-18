---
title: 'Chainguard Greyware Scanner: Detecting "Honest" Malicious Packages'
diataxis: Explanation
domain: Software-Engineering
topic: Security
source: ''
source_url: https://thenewstack.io/chainguard-greyware-scanner-vibe-coding/
keywords:
- knowledge-base
- Security
- Software-Engineering
- explanations
---
# Chainguard Greyware Scanner: Detecting "Honest" Malicious Packages

## Overview

Chainguard introduced a new source code scanner that detects **"greyware"** — open-source packages that pass every existing security scan and honestly declare what they do, but still contain functionality no enterprise security team would approve (credential theft, API key harvesting, command interception, persistent remote access). This is distinct from traditional malware, which hides what it does.

## The Problem: Greyware vs. Malware

### Traditional Malware

- Hides its malicious behavior
- Detected by signature scanning, behavioral analysis, sandboxing
- Examples: typosquatting, dependency confusion attacks, compromised maintainer accounts

### Greyware (Chainguard's Definition)

> "Greyware packages have functionality that no reasonable developer or enterprise would expect, want, or permit in their applications if it were subject to formal review."

- **Transparent about its functionality** — it does exactly what it advertises
- **Passes every existing security scan** on the market
- **Buries harmful parts in plain sight** — the package name and description look legitimate
- **Harmful behavior is a side effect of its declared purpose**

### Real Examples Found on npm

Packages like `chrome-tools` and `@robinpath/cloud-cli` that openly export modules for harvesting Chrome passwords, API keys, and other credentials. The packages honestly declare what they do — the problem is that "what they do" is harmful.

## Why Greyware Matters Now

### The Vibe Coding Explosion

The "vibe coding" trend — where non-technical users (e.g., finance professionals) build applications via natural language prompts — dramatically expands the greyware attack surface:

- Non-coders cannot evaluate package contents
- AI agents automatically pull in dependencies without review
- Manual code review was already impractical before AI coding tools arrived
- The surface area for greyware exposure has expanded enormously

> "Whether we're doing it at gargantuan scale against a huge portion of the source, or whether that's a dev doing it themselves — for anybody, it's increasingly impractical."

## Chainguard's Scanner Architecture

### Pre-Catalog Analysis

Rather than scanning packages when a developer requests them (creating exposure windows where malicious packages can be cached before detection fires), the scanner analyzes packages **before they are added to the Chainguard Libraries catalog at all**.

### Evaluation Dimensions

1. **Maintainer behavior** — Publishing patterns, account history
2. **Package contents** — Static code analysis for suspicious patterns
3. **Publishing signals** — Timing, frequency, origin analysis
4. **Dynamic execution** — Sandboxed runtime behavior observation

### Scale

- Analyzing more than **100,000 packages per day**
- Already blocked more than **52,000 packages** identified as malware or greyware
- Currently protects npm packages served through Chainguard Libraries for JavaScript
- Coverage expanding to additional ecosystems

## Key Takeaways

1. **Greyware is a new threat category** — It passes traditional security scans because it honestly declares its behavior
2. **The threat is amplified by AI coding tools** — Non-technical users and AI agents cannot evaluate package contents
3. **Pre-catalog scanning is essential** — Post-request scanning creates exposure windows
4. **Supply chain security must evolve** — Beyond typosquatting and dependency confusion to "honest but harmful" packages
5. **Manual review is impractical at scale** — Whether at enterprise level or individual developer level

## Implications for Development Teams

Organizations relying on AI-assisted development (coding agents, vibe coding tools) need:
- Pre-vetted package registries (like Chainguard Libraries)
- Automated dependency scanning that goes beyond signature-based malware detection
- Developer education on greyware risks
- Policies for evaluating open-source dependencies in AI-generated code

## Cross-References

- [Async AI Agent Verification](../AI-Agent-Verification/async-ai-agent-verification.md) — AI agent reliability
- [Deterministic AI Spring Upgrades](../AI-Assisted-Development/deterministic-ai-spring-upgrades.md) — AI-assisted development

## References

- [Original article: Chainguard Greyware Scanner](https://thenewstack.io/chainguard-greyware-scanner-vibe-coding/)
- [Chainguard Libraries](https://packages.cgr.dev/)

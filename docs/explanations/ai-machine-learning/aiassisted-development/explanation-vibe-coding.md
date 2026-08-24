---
title: Vibe Coding
diataxis: Explanation
domain: AI & Machine Learning
topic: AI-Assisted Development
source: Martin Fowler bliki
source_url: https://martinfowler.com/bliki/VibeCoding.html
date: 2026-05-23
keywords:
- knowledge-base
- AI-Assisted Development
- AI & Machine Learning
- explanations
---
# Vibe Coding

## Overview

**Vibe coding** is a development workflow in which users prompt a large language model (LLM) to build applications **without viewing or directly interacting with the generated code**. The user describes what they want, the LLM produces the implementation, and the user evaluates the result purely through its behavior — not its source.

The term was **coined by Andrej Karpathy in February 2025**, capturing a growing trend where the barrier between idea and working software shrinks dramatically. Karpathy's core principle for the approach is succinct:

> *"Forget that the code even exists."*

This represents a fundamental shift in how software is conceived: the developer's relationship moves from **writing and reading code** to **describing intent and observing outcomes**.

## How Vibe Coding Works

In a typical vibe coding session:

1. **User describes** a desired application or feature in natural language
2. **LLM generates** the complete implementation (code, configuration, dependencies)
3. **User tests** the output by running or interacting with it
4. **User iterates** by refining prompts based on observed behavior — not by reading or editing source code

The key distinction is that the user **never opens the code editor**. If something is wrong, the fix comes through a revised prompt, not through manual code changes.

## Vibe Coding vs. Agentic Programming

These two approaches are often conflated but represent fundamentally different workflows:

> **Excalidraw diagram placeholder:** *Side-by-side workflow comparison. Left side (Vibe Coding): User → Natural Language Prompt → LLM → Generated Code (hidden) → Running App → User observes behavior → Refines prompt (loop). Right side (Agentic Programming): Developer → Prompt/Spec → LLM → Generated Code (visible) → Developer reviews, edits, tests, maintains code → Running App → Developer iterates with code-level changes. Key difference highlighted: the code visibility and developer engagement with the source.*

| Aspect | Vibe Coding | Agentic Programming |
|--------|-------------|---------------------|
| **Code visibility** | Hidden — user never views generated code | Visible — developer actively reviews and edits |
| **Iteration method** | Refine prompts based on behavior | Edit source code directly |
| **Target audience** | Non-programmers, rapid prototypers | Developers, engineering teams |
| **Maintenance model** | Re-prompt or start over | Ongoing codebase maintenance |
| **Quality control** | Behavioral testing only | Code review, testing, refactoring |
| **Project lifespan** | Short-lived / throwaway | Long-lived / production-grade |

## Risk Analysis

Vibe coding introduces several categories of risk that users should understand before adopting this workflow:

| Risk Category | Description | Severity | Mitigation |
|--------------|-------------|----------|------------|
| **Security vulnerabilities** | LLMs may generate code with injection flaws, hardcoded secrets, or insecure dependencies without the user knowing | **High** | Avoid for apps handling sensitive data; use sandboxed environments |
| **Poor maintainability** | Generated code often becomes "spaghetti code" — tangled, undocumented, and impossible to modify without starting over | **High** | Limit to throwaway or personal-use projects |
| **Correctness / hallucination** | LLMs can produce code that appears to work but contains subtle logic errors, off-by-one bugs, or fabricated APIs | **Medium-High** | Validate outputs rigorously through testing; never trust blindly |
| **Debugging by trial-and-error** | Without code visibility, debugging relies entirely on changing prompts and re-running — a slow, imprecise process | **Medium** | Accept as inherent limitation; plan for iteration overhead |
| **Dependency drift** | Generated code may pull in outdated, unmaintained, or conflicting packages | **Medium** | Review dependency lists if possible; use containerization |
| **Lock-in to LLM provider** | Projects become tightly coupled to a specific model's output style and capabilities | **Low-Medium** | Document prompts and outputs for reproducibility |

## The Vibe Coding Spectrum

Vibe coding is not a single monolithic practice — it exists on a **spectrum** ranging from unstructured, no-review prompting to highly structured AI-assisted engineering. The appropriate mode depends on developer experience, project stakes, tooling, and personal preferences.

### Three Generations of AI Coding (2021–2026)

| Generation | Era | Characteristics | Examples |
|---|---|---|---|
| **Gen 1: AI-Assisted** | 2021–2023 | Autocomplete, inline suggestions, chat-based Q&A | GitHub Copilot, ChatGPT code mode |
| **Gen 2: AI-Native** | 2024–2025 | Full-file generation, multi-file edits, repo-aware agents | Cursor, Claude Code, Codex CLI |
| **Gen 3: Agentic** | 2026+ | Autonomous multi-step workflows, self-correction, CI/CD integration | Anthropic Routines, OpenClaw, CI-integrated agents |

### Three Modes on the Spectrum

| Mode | Description | Code Review | Best For |
|---|---|---|---|
| **Full Vibe (No Review)** | Describe goals in plain language, accept AI output without reading diffs | None | Throwaway scripts, personal tools, rapid prototyping |
| **Structured AI-Assisted** | AI generates code, developer reviews diffs, runs tests, and refactors | Selective (diff review) | Feature development, bug fixes, refactoring |
| **Agentic Engineering** | AI agents operate in CI/CD pipelines with human oversight, automated testing, and governance | Automated + human review | Production systems, long-lived codebases |

**Adoption context (2026):** Satya Nadella reported AI writes 20–30% of Microsoft's code. Y Combinator's Winter 2025 batch found ~25% of startups shipped codebases where AI generated the majority. As of January 2026, **90% of developers regularly use at least one AI tool at work**, up from 85% mid-2025, and **63% of vibe-coding users have never been developers** (JetBrains 2025 Developer Ecosystem Survey, 24,000+ developers, 194 countries: 85% regularly use AI tools, 62% rely on at least one AI assistant). The tooling market has scaled accordingly — Lovable (Swedish AI app builder) crossed **$100M ARR in eight months** with 2.3M active users, and Cursor reached a **$29.3B valuation** at $1B annualized revenue.

## The Productivity and Security Paradox (2026 research)

Adoption data is only half the story. Controlled studies published in 2026 consistently find a **gap between perceived and real productivity**:

- **METR controlled study** — Experienced open-source developers working on real 1M+ line codebases **predicted they would be 24% faster** with AI tools but measured **19% slower**. Even after seeing the results, they still believed they had been ~20% faster.
- **Stanford RCT** — Developers using AI tools wrote **less secure code** than those without AI, while reporting **higher confidence** in its security. Confidence and quality are decoupling.
- **Veracode (100+ LLMs vs OWASP Top 10 web risks)** — **45% of AI-generated code samples failed security benchmarks** overall, and the Java failure rate exceeded 70%.
- **CodeRabbit (470 open-source PRs)** — AI-written code produced **1.7× more issues** than human-written code, with **cross-site-scripting vulnerabilities 2.74× higher**.
- **Senior vs. junior split (Science, 2026)** — Senior developers (10+ years) report ~81% productivity gains from AI tools; junior developers show **no measurable improvement** because they lack the judgment to evaluate AI output.
- **Gartner forecast** — 40% of new enterprise production software will use vibe-coding techniques by 2028, but un-governed vibe coding is predicted to **increase software defects by 2,500%** over the same period.

**Practical mitigations** drawn from the same sources:

1. **Bucket every project** — prototype, internal tool, or production system — and apply the matching workflow.
2. **Seat a senior engineer as the "human operator"** for anything customer-facing; sign off only when the code is understood well enough to maintain.
3. **Automate verification at the same rate as creation** — hand-written tests cannot keep up with AI-generated code.
4. **Track two metrics separately** — time-to-first-working-version (vibe coding compresses this) and working-version-to-production-ready (it often expands this).

## When to Use Vibe Coding

Vibe coding is **best suited** for:

- **Non-programmers** building personal tools, dashboards, or automation scripts
- **Rapid prototyping** to validate an idea before committing to traditional development
- **Throwaway projects** where the output is consumed once and discarded
- **Exploratory learning** — understanding how a technology works by generating example implementations

## When to Avoid Vibe Coding

Vibe coding should be **avoided** for:

- **Complex systems** requiring careful architecture, error handling, and edge-case management
- **Widely-used applications** where reliability, security, and maintainability matter
- **Projects handling sensitive data** (PII, financial records, health information)
- **Production systems** that need long-term maintenance and team collaboration

## Why This Matters

Vibe coding represents a real shift in how non-technical people can create software. It lowers the barrier to building functional applications, which is genuinely empowering. However, it also creates a false sense of security — users may not realize the code running behind their app has security holes, architectural flaws, or correctness issues.

Understanding the distinction between vibe coding and agentic programming helps teams choose the right approach for their needs. If you need reliability and maintainability, agentic programming (where a developer actively reviews and maintains LLM-generated code) is the better path. If you need speed and simplicity for a personal or throwaway project, vibe coding can be an excellent tool.

## References

- [Martin Fowler bliki: Vibe Coding](https://martinfowler.com/bliki/VibeCoding.html) — Original article by Martin Fowler, published May 21, 2026, defining and analyzing the vibe coding phenomenon.
- [Andrej Karpathy on Vibe Coding (Feb 2025)](https://www.youtube.com/watch?v=wavfD91Rbgo) — Karpathy's original talk coining the term and demonstrating the concept.
- [Martin Fowler bliki: Agentic Programming](https://martinfowler.com/bliki/AgenticProgramming.html) — Related bliki entry covering the agentic programming paradigm for comparison.
- [Martin Fowler bliki: AI-Assisted Programming](https://martinfowler.com/bliki/AIAssistedProgramming.html) — Broader overview of how AI tools are changing software development practices.
- [Forbes: The Vibe Coding Productivity Paradox (2026-06-11)](https://www.forbes.com/sites/jodiecook/2026/06/11/the-vibe-coding-productivity-paradox-no-one-wants-to-talk-about/) — 2026 adoption data (90% of developers, Jan 2026), METR/Stanford/Veracode/CodeRabbit findings, and Gartner 2028 forecasts.

---
title: 'Fragments: May 5 — Lattice Framework, Internal Reprogrammability & AI Liability'
diataxis: How-to Guide
domain: AI & Machine Learning
topic: AI-Assisted Development
source: MartinFowler
source_url: https://martinfowler.com/fragments/2026-05-05.html
date: 2026-05-18
keywords:
- knowledge-base
- AI-Assisted Development
- AI & Machine Learning
- how-to
---
# Fragments: May 5 — Lattice Framework, Internal Reprogrammability & AI Liability

## Summary
Martin Fowler's May 5 Fragments covers four major topics: (1) the **Lattice Framework** for reducing friction in AI-assisted programming, (2) Jessica Kerr's **Double Feedback Loop** for internal reprogrammability, (3) the **Ashley MacIsaac vs. Google** defamation lawsuit over AI-generated falsehoods, and (4) the **"Genie Tarpit"** — why AI struggles with internal code quality.

## Why This Matters
These fragments crystallize emerging best practices for AI-assisted development: moving beyond raw code generation toward disciplined, reviewable workflows. The Lattice Framework and SPDD represent complementary approaches to taming AI coding assistants.

## Key Topics

### 🛠️ Lattice Framework (Rahul Garg)
Open-source framework to operationalize patterns for reducing friction in AI-assisted programming.
- **Problem:** AI assistants jump straight to code, make silent design decisions, forget constraints, and output unreviewed code
- **Architecture:** Composable skills across three tiers: `atoms`, `molecules`, and `refiners`
- **Embedded Disciplines:** Clean Architecture, DDD, design-first methodology, secure coding
- **Living Context:** Uses a `.lattice/` folder to accumulate project standards, decisions, and review insights
- **Deployment:** Available as a Claude Code plugin or standalone for any AI tool

### 🔄 Double Feedback Loop (Jessica Kerr)
Building a tool for conversation logs revealed two concurrent feedback loops:
1. **Development Loop:** AI executes tasks → Developer verifies output
2. **Meta-Level Loop:** Developer feels resistance/frustration → Signals that the tool/process needs improvement
- **Key Insight:** AI enables rapid software change, making it highly rewarding to customize the development environment itself
- **Historical Parallel:** Revives **Internal Reprogrammability** (molding dev tools to fit specific problems/tastes), a core tenet of Smalltalk/Lisp communities

### ⚖️ AI Liability: Ashley MacIsaac vs. Google
Cape Breton musician suing Google after an AI overview falsely claimed he was convicted of crimes, including sexual assault.
- **Real-World Harm:** Canceled concert, reputation damage, genuine safety fears
- **Core Argument:** Google didn't just index content; its AI *published* it. Guardrails failed.
- **Fowler's Take:** Tech companies must accept responsibility for what their controlled tools publish

### 🕳️ The "Genie Tarpit" (Kent Beck)
AI tools struggle to produce code with the internal quality required for long-term maintainability:
> "Genies naturally live down & to the left of muddling. The 'plausible deniability' task orientation of the genie leaves it claiming success even though the code doesn't work at all."

- **View 1 (Laura Tacho):** Good naming/structure helps AI comprehend code — essential for systems beyond small scripts
- **View 2:** Internal quality matters less if AI can regenerate code from scratch (controversial)

### 💰 Big Tech AI Infrastructure Spending
- **Total Spend:** >$100 Billion across major tech firms
- **Revenue Allocation:** Amazon, Alphabet, Microsoft >50%; Meta & Oracle ≥75%
- **Notable Exception:** Apple spends ~10% on AI infrastructure (betting on local hardware)

### 🖥️ Local AI Models Are "Good Enough"
Willem van den Ende argues local/open models now meet daily agentic dev needs:
- Harness quality (agent + skills + extensions) matters as much as the base model
- Open/local setups compound engineering understanding and stability
- **Security Recommendation:** Use sandboxing with **Nono** (Zero Trust Architecture)

## Related Topics
- [[example-structured-prompt-driven-development-spdd|Structured-Prompt-Driven Development (SPDD)]]
- [[tutorial-what-is-code|What Is Code?]]
- [[howto-forward-deployed-engineer-ai|Forward Deployed Engineer]]

## References
- 📰 [Fragments: May 5](https://martinfowler.com/fragments/2026-05-05.html) via MartinFowler (May 5, 2026)

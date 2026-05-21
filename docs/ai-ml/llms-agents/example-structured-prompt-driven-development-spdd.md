---

title: "Structured-Prompt-Driven Development (SPDD)"
description: "Structured-Prompt-Driven Development (SPDD)"
tags: [example,casestudy, "AI & Machine Learning"]
date: 2026-05-18
sidebar_label: "Structured-Prompt-Driven Development (SPDD)"

---



# Structured-Prompt-Driven Development (SPDD)

## Summary
SPDD is an engineering method from Thoughtworks that treats **prompts as first-class delivery artifacts**. Instead of ad-hoc chats with AI coding assistants, prompts are version-controlled, reviewed, reused, and improved over time. This makes AI-generated changes **governable, reviewable, and reusable** — scaling AI assistance from personal efficiency to organization-level capability.

## Why This Matters
AI coding assistants boost individual developer speed but introduce system-level friction: ambiguous requirements scale into code misunderstandings, code reviews struggle with volume, and integration/testing issues rise because "generated" ≠ "aligned". SPDD addresses this by bringing prompts into the same discipline as code.

> **Golden Rule:** "When reality diverges, fix the prompt first — then update the code."

## The REASONS Canvas

A 7-part structure guiding prompts from intent → design → execution → governance:

| Section | Focus | Description |
|:---:|:---|:---|
| **R** | Requirements | Problem statement & Definition of Done (DoD) |
| **E** | Entities | Domain entities & relationships |
| **A** | Approach | Strategy to meet requirements |
| **S** | Structure | System fit, components, dependencies |
| **O** | Operations | Concrete, testable implementation steps |
| **N** | Norms | Cross-cutting engineering standards (naming, observability, etc.) |
| **S** | Safeguards | Non-negotiable boundaries (invariants, security, performance) |

## The SPDD Workflow

### Tooling: `openspdd` CLI Commands

| Command | Type | Purpose |
|:---|:---:|:---|
| `/spdd-story` | Optional | Splits large requirements into INVEST-compliant user stories |
| `/spdd-analysis` | Core | Extracts domain keywords, scans relevant code, produces strategic analysis & risk assessment |
| `/spdd-reasons-canvas` | Core | Generates the full 7-part REASONS blueprint (down to method signatures) |
| `/spdd-generate` | Core | Generates code task-by-task, strictly following Operations/Norms/Safeguards |
| `/spdd-api-test` | Optional | Generates cURL-based API test scripts (normal, boundary, error cases) |
| `/spdd-prompt-update` | Core | Incrementally updates Canvas when requirements change (`requirements → prompt → code`) |
| `/spdd-sync` | Core | Syncs code-side changes (refactoring/fixes) back into Canvas (`code → prompt`) |

### Practical Workflow Example: Billing Engine Enhancement

**Context:** Enhancing a token-billing system to support model-aware pricing & multi-plan billing.

1. **Create Initial Requirements** (`/spdd-story`): AI splits enhancement into user stories; team consolidates & refines acceptance criteria (Given/When/Then format).
2. **Clarify Analysis**: Define core logic, scope boundaries, and Definition of Done with concrete numeric examples.
3. **Generate Analysis Context** (`/spdd-analysis`): AI scans codebase, identifies domain concepts, strategic direction, and risks.
4. **Generate Structured Prompt** (`/spdd-reasons-canvas`): AI produces executable blueprint. Human reviews for abstraction/intent alignment.
5. **Generate Code & Verify** (`/spdd-generate` + `/spdd-api-test`):
   - Code is generated strictly per Canvas
   - API tests validate behavior quickly
   - **Code Review Strategy:**
     - *Logic corrections (behavior change):* Update prompt first (`/spdd-prompt-update`), then regenerate targeted code
     - *Refactoring (style/clean code):* Refactor code first, then sync to prompt (`/spdd-sync`)
6. **Run Regression Tests** and generate unit tests using template-driven prompts

**Delivered Outcomes:** ~99% intent alignment, full engineering transparency, synchronized prompt/code asset.

## Three Core Developer Skills

Value shifts from typing speed to cognitive discipline:

1. **Abstraction First:** Design objects, collaborations, and boundaries *before* generating code
2. **Alignment:** Lock intent, scope, standards, and hard constraints upfront
3. **Iterative Review:** Treat AI output as a controlled engineering loop, not a one-shot draft

## Procedure / How-To: Implementing SPDD in Your Team

1. **Install the openspdd CLI** (check Thoughtworks documentation for installation instructions)
2. **Define your first REASONS Canvas** for a small, well-scoped feature
3. **Run `/spdd-analysis`** on your codebase to establish domain vocabulary
4. **Generate the Canvas** with `/spdd-reasons-canvas` and review with your team
5. **Generate code** with `/spdd-generate`, one task at a time
6. **Validate** with `/spdd-api-test` and manual code review
7. **Version control** all prompts alongside code in your repository
8. **Iterate**: When requirements change, use `/spdd-prompt-update`; when refactoring, use `/spdd-sync`

## Common Pitfalls
- **Skipping the Canvas:** Jumping straight to code generation without a structured prompt leads to misaligned output
- **Treating prompts as disposable:** Not version-controlling prompts means losing the ability to audit why code was generated
- **Ignoring the Golden Rule:** When code doesn't match intent, updating code without fixing the prompt creates divergence
- **Over-scoping:** SPDD works best with well-defined, bounded features — not entire systems

## Related Topics
- [tutorial-what-is-code](What Is Code?)
- [howto-anthropic-routines-claude](Anthropic Routines for Claude Code Automation)

## References
- 📰 [Structured-Prompt-Driven Development (SPDD)](https://martinfowler.com/articles/structured-prompt-driven/) via MartinFowler (April 28, 2026)
- 🔍 [SPDD Discussion on LinkedIn](https://www.linkedin.com/posts/lukas-grigis_structured-prompt-driven-development-spdd-activity-7454896689771020288-Fubk)
- 🔍 [Treating AI Prompts Like Code - mgks.dev](https://mgks.dev/blog/2026-04-29-treating-ai-prompts-like-code-what-i-learned-from-thoughtworks-spdd-method/)

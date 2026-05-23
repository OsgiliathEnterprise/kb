---
title: Maintainability Sensors for Coding Agents
diataxis: Explanation
domain: AI & Machine Learning
topic: LLMs & Agents
source: MartinFowler
source_url: https://martinfowler.com/articles/sensors-for-coding-agents.html
date: 2026-05-22
keywords:
- knowledge-base
- LLMs & Agents
- AI & Machine Learning
- reference
---
# Maintainability Sensors for Coding Agents

## Summary
Practical framework from Thoughtworks for using computational and inferential "sensors" to monitor and improve codebase maintainability ("internal quality") and enable AI coding agents to self-correct. Sensors run at three stages: during coding sessions, after CI integration, and on scheduled intervals.

**Maintainability** = low-risk, easy changes over time.

## Why This Matters
Tangled codebases cause AI agents to look in wrong places, miss duplicates, or load excessive context. Traditional static analysis tools gain new value when agents can use their output to self-correct mistakes — but the tools must be configured with AI-specific rules and guidance.

### Base Tools
- **IDEs/Agents:** Cursor, Claude Code, OpenCode
- **Models:** Claude Sonnet (default), Claude Opus (planning/analysis), Cursor `composer-2` (implementation)

## Sensor Architecture & Timing

| Timing | Sensors |
|--------|---------|
| **During Coding Session** | Type checker, ESLint, Semgrep, `dependency-cruiser`, test suite/coverage, incremental mutation testing, GitLeaks (pre-commit) |
| **After Integration (CI)** | Same computational sensors run on clean infrastructure |
| **Repeatedly (Scheduled)** | Security/data handling reviews, dependency freshness reports, modularity/coupling reviews |

## Static Code Analysis: Basic Linting (ESLint)

### AI-Targeted Rules
Key rules not in default presets: `max-params`, `max-lines`, `max-lines-per-function`, `cyclomatic-complexity`. New ESLint plugins are emerging specifically for AI failure modes.

### Self-Correction Guidance
Custom ESLint formatters inject architectural context and judgment prompts. Example for `no-explicit-any`:
> Make a judgment call about this. If you choose to not introduce a type, suppress it with: `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- (give reason why)`

### Key Observations
- AI exceptions are excellent starting points for human code review
- AI frequently increased cyclomatic complexity thresholds due to missing explicit guidance
- Context-aware rule handling works well (e.g., `no-console` differs by frontend/backend)
- **Trade-offs emerge** (e.g., `max-lines` led to prop-heavy React components)
- Static analysis misses semantic quality

### Managing Warnings
- AI can make judgment calls and suppress warnings with inline reasons
- For thresholds (e.g., max lines, complexity), AI is instructed to **slightly increase thresholds** rather than permanently suppress
- This preserves constraints while avoiding binary compliance choices
- **Cost-Benefit Shift:** AI drastically lowers the cost of writing custom rules/scripts

## Static Code Analysis: Dependency Rules

- **Tool:** `dependency-cruiser` enforces layered architecture (`routes → services → clients + domain`)
- **Self-Correction:** Custom error messages recap architectural concepts; AI absorbed the steep config learning curve
- **Takeaway:** Effective replacement for markdown structure guides, but limited to what's expressible via imports/folder structure

### Configuration Example
```json
{
  "name": "clients-no-services",
  "comment": "API clients must not depend on the orchestration layer above them.",
  "severity": "error",
  "from": { "path": "^server/clients/", "pathNot": "/__tests__/" },
  "to": { "path": "^server/services/" }
}
```

Custom error messages recap the layering concept:
```
ERROR clients-no-services
API clients must not depend on the orchestration layer above them.
[Layers: routes -> services -> clients + domain;
 Services orchestrate: fetch data via clients, compute via domain -- no I/O, no SDKs, no knowledge of data fetching.]
```

### Observations
- AI absorbed the steep learning curve of `dependency-cruiser` syntax
- Agent violated rules initially but self-corrected effectively
- Successfully enforced React hook conventions and caught out-of-structure folder creation
- **Limitation:** Only enforces what's expressible via imports, filenames, and folder paths

## Static Code Analysis: Coupling Data

- **Setup:** Custom AI-built CLI extracts coupling metrics (incoming/outgoing imports/calls per file) using the TS compiler
- **Prompt Strategy:** Ground LLM analysis in deterministic CLI output, not static browsing alone
- **False Positives:** LLM misidentified intentional patterns (DI factory, shared Zod schema) as "god modules"
- **Takeaway:** "Good/bad" coupling is highly context-dependent; better suited for **risk triage during code review**

### For Human Consumption
Visualizations (e.g., dependency graphs) help identify:
- Hotspot files with excessive coupling
- Circular dependencies
- Architectural violations

### For Agent Feedback
Automated coupling metrics feed back into agent prompts, enabling:
- Real-time awareness of architectural impact
- Self-correction before violations become entrenched
- Data-driven refactoring decisions

## Mutation Testing

- **Tool:** `stryker` (incremental mutation testing) — runs only on changed code, not full codebase
- **Observation:** AI handled mutation testing well; treated failing mutants as bugs to fix rather than noise to suppress
- **Takeaway:** Incremental mutation testing is a strong addition to the sensor suite for AI-assisted development

## Security Scanning (Semgrep)

- **Tool:** Semgrep for security and code quality checks
- **Observation:** Semgrep catches issues ESLint misses (e.g., hardcoded secrets, SQL injection patterns)
- **Takeaway:** Layer security scanning on top of linting for comprehensive coverage

## Test Suite & Coverage as Sensors

- **Approach:** Run tests during agent sessions (not just in CI) to provide immediate feedback
- **Observation:** Agents can fix test failures autonomously when given clear error messages
- **Takeaway:** Tests serve dual purpose: validation AND feedback for agent self-correction

## Pre-Commit Hooks (GitLeaks)

- **Tool:** GitLeaks for secret detection in pre-commit hooks
- **Takeaway:** Prevents secrets from ever reaching the repository; agents respect pre-commit failures

## Actionable Takeaways

1. **Configure AI-specific linting rules** — default presets miss common AI failure modes (excessive complexity, function length)
2. **Use custom formatters** that inject architectural context into error messages for better agent self-correction
3. **Layer sensors** — linting + dependency rules + mutation testing + security scanning + tests
4. **Run sensors during coding sessions** — not just in CI — to match agent iteration speed
5. **Ground LLM analysis in deterministic data** — CLI output, not static browsing alone
6. **Treat suppressions as review items** — AI exceptions are excellent starting points for human code review

## Common Pitfalls

- **Feedback overload:** Too many sensors can overwhelm agents; prioritize the most impactful ones
- **False security:** Passing all sensors does not guarantee semantic quality
- **Threshold inflation:** Without explicit guidance, agents will increase thresholds rather than fix code
- **Context-dependent coupling:** Raw coupling data alone is not useful; needs human interpretation

## Related Topics

- [[example-structured-prompt-driven-development-spdd|Structured-Prompt-Driven Development (SPDD)]]
- [[tutorial-what-is-code|What Is Code?]]

## References

- 📰 [Maintainability sensors for coding agents](https://martinfowler.com/articles/sensors-for-coding-agents.html) via MartinFowler (May 19, 2026)
- 📰 [Three more static code analysis sensors](https://martinfowler.com/articles/sensors-for-coding-agents.html#StaticCodeAnalysisDependencyRules) via MartinFowler (May 20, 2026)
- 📰 [Harness engineering for coding agent users](https://martinfowler.com/articles/harness-engineering.html) via MartinFowler (April 2, 2026)
- 🔍 [SWE-CI: Evaluating Agent Capabilities in Maintaining Software](https://arxiv.org/abs/2603.03823) (March 2026)
- 🔍 [Maintainability sensors discussion](https://engineered.at/articles/maintainability-sensors-for-coding-agents) via Engineered.at

---
*Created by Hermes Agent Knowledge Researcher — Daily Deep Research Pipeline (May 22, 2026)*

---
title: Maintainability Sensors for Coding Agents
diataxis: Reference
domain: REFERENCE
topic: ''
source: https://martinfowler.com/articles/sensors-for-coding-agents.html
---
# Maintainability Sensors for Coding Agents

## Overview

A practical framework for **maintainability sensors** that help AI agents and humans monitor internal code quality during AI-assisted development.

**Maintainability** = low-risk, easy changes over time.

### The AI Problem
Tangled codebases cause agents to:
- Look in wrong places
- Miss duplicate code
- Load excessive context windows
- Make architectural violations

## Sensor Architecture & Timing

| Timing | Sensors | Type |
|--------|---------|------|
| **During Coding Session** | Type checker, ESLint, Semgrep (AppSec), `dependency-cruiser`, test suite/coverage, incremental mutation testing, GitLeaks (pre-commit) | Computational |
| **After Integration (CI)** | Same computational sensors run on clean infrastructure | Computational |
| **Repeatedly (Scheduled)** | Security review, data handling review, dependency freshness report, modularity/coupling review | Inferential / Mixed |

### Base Tools
- **IDEs/Agents:** Cursor, Claude Code, OpenCode
- **Models:** Claude Sonnet (default), Claude Opus (planning/analysis), Cursor `composer-2` (implementation)

## Static Code Analysis: ESLint Configuration for AI

### Rules for AI Shortcomings
Default presets lack AI-specific constraints. Key rules to configure:
- Max function arguments
- File & function length
- Cyclomatic complexity

### Guidance for Self-Correction
Custom ESLint formatters override default messages with prompt-like guidance to enable AI self-correction:

```
"We want things to be typed to make it easier to avoid errors, especially for key concepts.
But we also want to avoid cluttering our codebase with unnecessary types.
Make a judgment call about this. If you choose to not introduce a type, suppress it with:
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- (give reason why)"
```

### Managing Warnings
- AI can make judgment calls and suppress warnings with inline reasons
- For thresholds (e.g., max lines, complexity), AI is instructed to **slightly increase thresholds** rather than permanently suppress
- This preserves constraints while avoiding binary compliance choices

### Key Observations
- **Review Starting Point:** AI exceptions/suppressions are excellent focal points for human code review
- **Missing Guidance Impact:** AI frequently increased cyclomatic complexity thresholds because no explicit self-correction guidance existed
- **Context-Aware Rules:** `no-console` handled differently in frontend vs. backend via custom messages
- **Trade-off Risks:** `max-lines` rules triggered useful refactoring but caused prop-drilling in React components
- **Cost-Benefit Shift:** AI drastically lowers the cost of writing custom rules/scripts

## Static Code Analysis: Dependency Rules

Enforces architectural boundaries using `dependency-cruiser`.

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

Custom CLI/web UI built by AI using the TypeScript compiler to extract incoming/outgoing imports & calls per file.

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

## Key Takeaways

1. **Static analysis is your first line of defense** — it catches hygiene factors AI would otherwise miss
2. **Custom error messages matter** — prompt-like guidance enables AI self-correction
3. **Dependency rules replace markdown guides** — enforceable architecture beats documentation
4. **Coupling data enables proactive decisions** — metrics drive refactoring before technical debt accumulates
5. **⚠️ Caveat:** Static analysis cannot catch semantic quality; risk of false security and feedback overload

## References

- [Maintainability sensors for coding agents](https://martinfowler.com/articles/sensors-for-coding-agents.html) (MartinFowler.com, 2026-05-19)
- [Three more static code analysis sensors](https://martinfowler.com/articles/sensors-for-coding-agents.html#StaticCodeAnalysisDependencyRules) (MartinFowler.com, 2026-05-20)
- [Harness engineering for coding agent users](https://martinfowler.com/articles/harness-engineering.html) (MartinFowler.com, 2026-04-02)

---
title: IDE-Native Search for AI Coding Agents - Speed and Cost Analysis
diataxis: Explanation
domain: AI-Infrastructure
topic: Agent-Tooling
source: JetBrains Blog
source_url: https://blog.jetbrains.com/ai/2026/05/what-happens-when-you-give-agents-ide-native-seach-tools/
date: 2026-06-01
keywords:
- knowledge-base
- Agent-Tooling
- AI-Infrastructure
- explanations
---
# IDE-Native Search for AI Coding Agents - Speed and Cost Analysis

## Overview

JetBrains conducted controlled experiments comparing coding agents using shell-based search tools (`grep`, `find`) versus IDE-native search tools (file search, text search, regex, symbol lookup) via a unified MCP tool. The results show significant improvements in latency, cost efficiency, and budget discipline when agents use IDE-native search capabilities.

## The Problem: Shell Tools Are Blind to Project Semantics

When coding agents search codebases, they default to shell tools because those are universally available. However, this approach has fundamental limitations:

| Aspect | Shell Tools (grep/find) | IDE-Native Search |
|---|---|---|
| **Project structure awareness** | None | Full awareness |
| **Symbol boundaries** | Blind | Precise |
| **Language semantics** | Ignored | Indexed |
| **Token efficiency** | Low (noisy output) | High (targeted results) |
| **Follow-up calls** | Frequent | Reduced |

The agent burns tokens sifting through noisy output and making follow-up calls to narrow results — a waste of both time and budget.

## The Solution: Prebundled Search Skill + Unified MCP Tool

JetBrains built a **prebundled skill** that pairs a search prompt with a unified MCP tool featuring four modes:

1. **File Search** — Navigate project structure
2. **Text Search** — Full-text content search
3. **Regex Search** — Pattern-based matching
4. **Symbol Lookup** — Language-aware symbol resolution

A **universal router** dispatches calls to the appropriate backend, leveraging IDE indices, ASTs, and project models that shell tools cannot access.

## Methodology

- **Eval pipeline**: MCP server alongside IDE for agent tool access
- **Paired delta analysis**: Identical coding tasks with and without tooling
- **Metrics tracked**: Quality (all-tests-passed), Latency (median + P95), Cost (token → USD), Budget discipline (% exceeding $0.50 cap)
- **Statistical significance**: p &lt; 0.05 with 95% confidence intervals
- **Cross-model validation**: Tested across Codex 5.2, GPT 5.4, Claude models on Java and Kotlin

## Key Results

### Performance Improvements

| Metric | Baseline | With IDE-Native Search | Improvement |
|---|---|---|---|
| **Median Latency** | 83.11s | 79.03s | **8.33% reduction** |
| **P95 Latency** | 268.71s | 213.17s | **16.44% reduction** |
| **Total Cost** | $44.17 | $41.67 | **5.60% reduction** |
| **Budget Overruns** | 6.67% | 4.44% | **33.28% reduction** |

### Quality Impact

- **No statistically significant change in quality** — all-tests-passed rate remained consistent
- This confirms that speed improvements do not come at the cost of correctness

### Cross-Model Validation

- Pattern held across Codex 5.2, GPT 5.4, and Claude models
- Kotlin codebases showed the largest cost improvement (**13.48% reduction**)
- Java codebases showed consistent latency improvements

## Trace Analysis: What Changed in Agent Behavior

### Service Comments Task (Java)

**Before (no IDE search):** 472 seconds
- 5 file listing calls, 5 jar inspect calls, curl download + decompile, 9 files read, 8 edits

**After (prebundled IDE search):** 127 seconds
- 3 targeted searches, 5 files read, 2 edits

**Result:** 73% faster, fewer tool calls, more targeted file access

### Jackson Key Deserializer Task (Java)

**Before (broad code walk):** 150 seconds
- 11 search calls, broad file reading across deserializer hierarchy

**After (targeted search):** 34 seconds
- 3 targeted searches, 3 relevant files read

**Result:** 77% faster, dramatically reduced context discovery time

## Configuration Search: Finding the Optimal Setup

JetBrains tested four configurations before selecting the final design:

1. **Baseline** — No prebundled tooling
2. **4 Search Tools** — Separate tools for each search type
3. **Unified Search Tool** — Single tool with multiple modes
4. **4 Tools + Router** — Separate tools with routing logic
5. **Unified Tool + Router** — Selected configuration

The selected configuration (Unified Tool + Router + Router) achieved the best latency while preserving cost reduction.

## Key Takeaways

1. **IDE-native search is not optional for production agents** — the performance gap is too large
2. **Symbol-aware search reduces token waste** — agents spend fewer tokens on context discovery
3. **Budget discipline improves significantly** — fewer tasks exceed cost caps when search is efficient
4. **Quality is preserved** — speed gains do not compromise correctness
5. **Cross-model consistency** — benefits hold across different LLM providers

## Architecture Diagram

```
excalidraw-start
[{"type":"rectangle","x":200,"y":100,"size":[200,80],"label":"Coding Agent\n(Any LLM)"}]
[{"type":"rectangle","x":500,"y":100,"size":[200,80],"label":"Prebundled Search\nSkill + SKILL.md"}]
[{"type":"rectangle","x":500,"y":250,"size":[200,80],"label":"Unified MCP Tool\n(Universal Router)"}]
[{"type":"rectangle","x":300,"y":400,"size":[150,60],"label":"File Search\nBackend"}]
[{"type":"rectangle","x":500,"y":400,"size":[150,60],"label":"Text Search\nBackend"}]
[{"type":"rectangle","x":700,"y":400,"size":[150,60],"label":"Regex\nBackend"}]
[{"type":"rectangle","x":900,"y":400,"size":[150,60],"label":"Symbol Lookup\nBackend"}]
[{"type":"rectangle","x":500","y":550,"size":[200,80],"label":"IDE Indexes + ASTs\n+ Project Models"}]
[{"type":"arrow","x1":400,"y1":140,"x2":500,"y2":140","label":"Agent Request"}]
[{"type":"arrow","x1":600,"y1":180,"x2":600,"y2":250","label":"Skill Prompt"}]
[{"type":"arrow","x1":600,"y1":330,"x2":375,"y2":400","label":"Route"}]
[{"type":"arrow","x1":600,"y1":330,"x2":575,"y2":400","label":"Route"}]
[{"type":"arrow","x1":600,"y1":330,"x2":775,"y2":400","label":"Route"}]
[{"type":"arrow","x1":600,"y1":330,"x2":975,"y2":400","label":"Route"}]
[{"type":"arrow","x1":600,"y1":460,"x2":600,"y2":550","label":"Index Query"}]
excalidraw-end
```

## References

- [JetBrains AI Blog: We Gave Agents IDE-Native Search Tools](https://blog.jetbrains.com/ai/2026/05/what-happens-when-you-give-agents-ide-native-seach-tools/)
- [Daily.dev: IDE-native search boosts agent performance](https://app.daily.dev/posts/we-gave-agents-ide-native-search-tools-they-got-faster-and-cheaper--41sxgagpk)
- [JetBrains ACP: Bring Any AI Coding Agent Into Your IDE](https://www.adwaitx.com/jetbrains-acp-ai-agent-ide-integration/)

---
title: Carried-Over and Agent-Native Threats in the Supply Chain of LLM Agent Skills
diataxis: Explanation
domain: cloud-infrastructure
topic: cloud-native-security
source: arXiv
source_url: https://arxiv.org/abs/2611.30932
date: 2026-11-24
keywords:
- knowledge-base
- cloud-native-security
- cloud-infrastructure
- explanations
---
# Carried-Over and Agent-Native Threats in the Supply Chain of LLM Agent Skills

**Authors:** Kaixuan Li, Wenbo Guo, Sen Chen, Yang Liu. (arXiv:2611.30932)


## Overview
Agent *skills* are reusable packages that extend an LLM agent with scripts, third-party dependencies, and natural-language instructions. Because the agent builds a skill's arguments from user requests **and untrusted external content**, a flaw left innocently by a benign author can escalate a prompt injection into code execution. This paper (arXiv:2611.30932, cs.CR/cs.SE) is the **first registry-scale empirical study** of that attack surface: all **48,682 skills in the ClawHub registry**, screened statically, with all **3,428** cases flagged by the four main detectors manually reviewed, and reachability tested in a sandbox and with a live LLM agent under indirect prompt injection.

## Four Threat Vectors, Two Genealogies
**Carried over from classical package ecosystems:**
1. **Dependencies** — vulnerable third-party packages.
2. **First-party code** — flaws in the skill's own scripts.

**Agent-native (no npm/pip analogue):**
3. **Install instructions** — natural-language setup text the agent executes.
4. **Credentials printed to stdout** — secrets leaked into a channel the agent (and injected content) can read.

## Key Findings
- **Dependency risk carries over, but differently**: 49.6% of skills with resolvable dependencies pin a version with a known CVE — and unlike npm packages, which mostly *become* vulnerable after release, **78.3% are born vulnerable**, already exposed at publication.
- **Most CVEs are unreachable**: agent-controlled input reaches the vulnerable function in only **3.0%** of affected skills. Meanwhile **21 of 22 sampled first-party flaws were exploited end to end in the sandbox** — first-party flaws are the real risk.
- **The agent itself is a weird execution channel**: a live agent executes the injected payload in **48.5%** of sampled flagged skills, but almost always in **its own shell before the skill even runs**; the payload reaches a flaw *inside the skill* in only **5.0%** of cases.

## Registry & Runtime Recommendations (from the paper)
1. **Registries should prioritize first-party flaw detection over dependency/CVE alerts** — the dependency signal mostly flags unreachable code, while first-party flaws are reliably exploitable.
2. **Agent runtimes should not pass skill arguments through a shell** — the dominant exploitation path is shell interpolation of agent-built arguments, not the skill's logic itself.
3. Treat natural-language install instructions and stdout as part of the security boundary: they are agent-executable/agent-readable surfaces with no counterpart in classical package managers.

## Relevance to Our Domain
The skill-registry model (ClawHub) is the same architecture our own skills ecosystem uses (~/code/skills, agent skill packages). Directly actionable: audit our skills' argument handling for shell interpolation, treat bundled scripts (not dependency CVEs) as the review priority, and vet install-instruction text as executable content. Pairs with the KB's zero-trust supply-chain and Preflight dependency-verification notes.

## References
- Paper: https://arxiv.org/abs/2611.30932 (cs.CR, cs.SE, submitted 2026-11-23)
- PDF: https://arxiv.org/pdf/2611.30932

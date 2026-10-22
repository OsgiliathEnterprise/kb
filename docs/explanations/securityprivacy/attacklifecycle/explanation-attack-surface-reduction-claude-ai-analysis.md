---
title: Attack Surface Reduction at Scale — AI-Driven Reachability Analysis Across
  25 Projects (Anthropic)
diataxis: Explanation
domain: security-privacy
topic: attack-lifecycle
source: Anthropic Research
source_url: https://www.anthropic.com/research/attack-surface-reduction
date: 2026-10-22
keywords:
- knowledge-base
- attack-lifecycle
- security-privacy
- explanations
---
# Attack Surface Reduction at Scale — AI-Driven Reachability Analysis Across 25 Projects (Anthropic)

Fixing individual vulnerabilities doesn't scale: every patch closes one hole while the underlying *reachability* problem — how much code a stranger can touch with zero credentials — stays. Anthropic's attack surface reduction research inverts the workflow: instead of hunting individual bugs, use an AI agent to inventory **what is reachable, by whom, and under which configuration**, then reduce the reachable set itself. Reducing reachability lowers the severity of *unknown* vulnerabilities too, which patch-chasing never does.

## The three analysis methods

| Method | Question it answers | Key technique |
|---|---|---|
| **Default configuration** | What can an anonymous stranger reach with the software as shipped? | Inventory entry points (HTTP routes, CLI args, deserializers, file parsers) reachable with zero credentials; verify each by dynamic trace, not just static presence |
| **Configuration interaction** | Which *combinations* of settings weaken or disable controls? | Enumerate config pairs/triples; look for interactions where a control enabled in isolation is silently disabled by another setting |
| **Early reachability** | What is reachable before auth, before init completes, or in startup code paths? | Analyze the pre-auth and pre-init windows — surfaces that exist for milliseconds are still exploitable if timing can be influenced |

Projects were split into three categories: **Public** (no auth at all), **Gated** (auth required, but with reachable pre-auth surfaces), and **Private** (internal services). The gating category is where the surprising results lived.

## Results across 25 projects (5M+ LOC, 17k+ configuration items)

- **11 of 11 gated projects** had code unintentionally reachable without authentication.
- **93 pre-auth entry surfaces** and **37 pre-auth state records** (data that pre-auth code can read/write) were catalogued.
- **61 configuration combinations** silently weakened security controls; **162 undocumented configuration combinations** existed in total, of which **94 silently disabled controls** and **68 were internally inconsistent** (two settings that contradict each other, both "valid").
- A **hostname deny-list fail-open pattern** appeared in **4 projects**: when the deny-list check itself fails (parse error, timeout, empty list), the default is *allow* — a deny-list that fails open is an allow-list with extra steps.

The consistent theme: the dangerous surfaces were not exotic. They were ordinary routes, default configs, and error paths that no review ever classified by *who* could reach them.

## The Claude skill: three passes, fresh contexts

The analysis is packaged as a Claude skill running **three sequential passes**, each starting from a fresh context and carrying only a short summary of the previous pass — long single-context analyses degrade, and the passes have different failure modes that fresh contexts prevent:

1. **Entry point inventory + dynamic verification** — list candidate entry points, then *trace each one dynamically* (send a request, run the CLI) to confirm it's actually reachable. Static presence is not reachability; the dynamic check filters out dead code, unregistered routes, and config-gated paths.
2. **Gate design + test-suite regression** — for each confirmed surface, design the access gate (auth check, capability check, config gate) and add a **regression test that fails if the surface becomes reachable without the gate**. This is the durable artifact: the analysis doesn't rot because the test suite encodes it.
3. **Non-default configuration gates, left for humans** — surfaces that are only reachable under non-default configurations get a *suggested* gate and are escalated to a human. The skill deliberately stops where judgment is required: an AI deciding that a weird-but-legitimate config should be locked down can break real users.

Two auxiliary techniques round out the methodology:

- **OSS-Scanner integration** — feed the scanner's dependency and known-vuln output into the agent as context, so the reachability analysis is anchored to known CVE data rather than re-deriving it.
- **Runtime logs vs configuration comparison** — diff what the logs show the software *actually did* against what the configuration claims it should do. A mismatch is either a bug or an undocumented behavior — both are findings.

## Why "reduce reachability" beats "patch vulnerabilities"

1. **Unknown-vuln coverage.** A pre-auth surface you removed is safe against every vulnerability in its handler, known or not. A patch covers exactly one bug.
2. **Configuration space is the real surface.** 162 undocumented combinations means the "secure by default" claim only holds for the default config — and defaults drift (upgrades, migrations, user edits).
3. **Test-encoded results.** Pass 2 converts findings into failing-if-removed regression tests, so the reduction is maintained automatically, not re-audited.
4. **Bounded judgment.** The human escalation point (pass 3) keeps AI in its lane: exhaustive inventory and verification, human decisions on ambiguous gates.

## Applying this to your own codebase

- Start with **method 1 on your default config** — the pre-auth inventory is the highest-value artifact and the cheapest to run.
- Treat **error paths as entry points**: 500 handlers that echo request data, deserializer exceptions that leak class names, and health endpoints that return internal state are all "pre-auth surfaces" in this framework.
- Run the **config-interaction pass before any "hardened default" release** — the 94 silently-disabling combinations pattern is exactly what a hardening PR misses.
- Keep the **regression-test artifact** even if you skip the AI passes: a test that asserts "this route requires auth" is cheap insurance against the next refactor.

## References

- [Attack Surface Reduction (Anthropic Research, original source)](https://www.anthropic.com/research/attack-surface-reduction)
- Related KB notes: [[MCP Step-Up Authorization vs OAuth Incremental Authorization — What Actually Changes (Measured on Cloudflare)]] (scope-level reachability at the API boundary), [[How to Coordinate Multi-Agent AI Swarms Without Cloud Deadlocks — a Distributed Task Board MCP Server (AgentMesh)]] (orchestrating the kind of multi-pass agent workloads this skill uses)

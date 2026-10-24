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

- **OSS-Scanner integration** — the attack-surface-reduction skill is being integrated *into* Anthropic's OSS-Scanner (the opt-in vulnerability-finding service for open source), so the methodology runs alongside the scanner's dependency and known-vuln data.
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

## Full study numbers (verified against the original post)

The post (Chris Rohlf, Anthropic Frontier Red Team, published 2026-10-20) ran across **25 projects**: 10 Public, 11 Gated, 4 Private — over 5M LOC in C, C++, Java, PHP, and Python. Claude inventoried **17,000+ configuration options**, of which **3,842 were security-relevant**, and found **493 issues in total** across the three methods.

### Why the hostname deny-list fails open — the mechanism

The 4-project pattern is subtler than "check fails → allow":

1. An admin writes the access rule against a **hostname or wildcard pattern** instead of an IP address.
2. Whether the server ever learns the client's hostname depends on a **separate option controlling reverse-DNS lookups — which most projects had configured off**.
3. With lookups off, the server only has the client's IP and **compares the hostname pattern against that IP string as plain text**.
4. A hostname pattern can never match an IP string → the deny rule **never fires** → the list fails open.

Some of the affected projects document that hostname rules depend on DNS lookups being enabled; **none document that a deny-list written this way fails open**.

### Gate implementation details from the skill

- Every finding is confirmed by a **dynamic trace** of the program (not static presence alone).
- For default-configuration findings, the skill designs and implements the gate, then runs the **project's own test suite plus a black-box regression suite** and requires **results identical to the baseline** — the gate must not change default behavior.
- Reported real-world impact: fixes from this line of work have shipped in **OpenSSH 10.6** defaults (per secondary coverage of the research).

## References

- [Attack Surface Reduction (Anthropic Research, original source)](https://www.anthropic.com/research/attack-surface-reduction)
- [Anthropic set Claude on 25 open-source projects and it found 493 flaws (The Next Web)](https://thenextweb.com/news/claude-attack-surface-reduction-493-issues-openssh) — full cohort numbers, hostname-deny-list mechanism, OSS-Scanner integration
- [Anthropic finds 94 cases where open-source projects drop security controls (Help Net Security)](https://www.helpnetsecurity.com/2026/10/22/anthropic-attack-surface-reduction-open-source/) — secondary coverage; OpenSSH 10.6 default changes
- Related KB notes: [[MCP Step-Up Authorization vs OAuth Incremental Authorization — What Actually Changes (Measured on Cloudflare)]] (scope-level reachability at the API boundary), [[How to Coordinate Multi-Agent AI Swarms Without Cloud Deadlocks — a Distributed Task Board MCP Server (AgentMesh)]] (orchestrating the kind of multi-pass agent workloads this skill uses)

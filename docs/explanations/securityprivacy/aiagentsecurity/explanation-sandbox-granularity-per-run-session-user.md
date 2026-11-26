---
title: 'Sandbox Granularity: Per-Run vs Per-Session vs Per-User Isolation for AI Agents'
diataxis: Explanation
domain: security-privacy
topic: ai-agent-security
source: DEV.to Tech News (Sandscale blog)
source_url: https://dev.to/sandscale/one-sandbox-per-run-per-session-or-per-user-isolation-cost-and-state-trade-offs-1i8f
date: '2026-11-26'
keywords:
- knowledge-base
- ai-agent-security
- security-privacy
- explanations
---
# Sandbox Granularity: Per-Run vs Per-Session vs Per-User Isolation for AI Agents

When you put an agent's code execution in a sandbox, you also silently decide **how many
pieces of work share each sandbox**. This choice sets your isolation story *more than the
sandbox technology itself does*: a microVM shared by two users is a shared environment,
whatever kernel it runs.

## The three granularities

### Per run
Every task (or every tool call) gets a fresh sandbox from a template; it is stopped when the task ends.

- **Isolation:** strongest. A prompt injection that plants a malicious file dies with the box.
- **State:** none carried over. Repeated setup (clones, dependency installs) is paid every run unless you start from a post-setup **snapshot**.
- **Cost while waiting:** low — the box exists only while work happens.
- **Failure mode:** agents that expect state ("the file I wrote last turn") find it gone. Mitigate by stating plainly in the tool description that each call starts clean.

### Per session
One sandbox per conversation/agent task, kept across turns, stopped (or expired by lifetime) at session end.

- **Isolation:** good between users and sessions, **none between turns of the same session**. A malicious instruction in turn 3 (e.g., from a web page the agent read) can leave something behind that runs in turn 7.
- **State:** files, processes and memory carry over — that is the point (the dataframe built in turn 3 is still there in turn 7).
- **Cost while waiting:** depends on the billing model. On a meter that bills provisioned resources while running, an idle session costs as much as a busy one; control it with pause or aggressive timeouts. On a meter that skips idle gaps, waiting costs less for free.
- **Failure mode:** sessions that never end. Give each session sandbox a lifetime plus an idle sweep.

### Per user
A long-lived environment per user (persistent workspace or sandbox surviving days).

- **Isolation:** between users, yes; within one user's history, none. Every session sees what every earlier session left behind, including attacker-planted artifacts.
- **State:** everything persists (installed tools, history, configuration).
- **Cost while waiting:** highest exposure — the environment exists for days; you need sleep-when-idle behaviour.
- **Failure mode:** environment drift and accumulated secrets — old tokens in shell history, credentials in `.git/config`, caches with private data. Treat a per-user environment like a laptop: hygiene, rotation, and a reset path.

## The rule that matters most

**Never share a sandbox across users.** Cloudflare's sandbox security docs call the sandbox
"the smallest unit of trust": when two users share a sandbox, each user's code can read the
other's work. If your user→sandbox mapping comes from a name or ID in a request, derive it
from the **authenticated identity**, never from anything the client sends.

## Decision table

| Workload | Granularity | Why |
| --- | --- | --- |
| One-shot code execution for an LLM tool call | Per run | No state needed; strongest isolation |
| Grading/running user submissions | Per run | Submissions must not see each other |
| Agent PRs in CI | Per run | Each PR is untrusted on its own |
| Data analysis chat | Per session | Loaded data must survive between turns |
| Coding agent on one task | Per session | Repo and tools persist for the task's turns |
| A developer's cloud machine | Per user | It is a computer, not a sandbox |

## Mixing granularities

Most real systems use two. A coding agent can keep a **per-session sandbox** for its working
copy and send risky commands (running a downloaded script) to a **per-run sandbox with no
credentials and no network**: the per-session box keeps state, the per-run box absorbs risk.

Operational hygiene: **label every sandbox** with the run, session or user it belongs to.
When something goes wrong, the first question is always "what else shared this box?" —
labels are how you answer it.

## Diagram

See `sandbox-granularity-decision.excalidraw` for the workload → granularity decision flow.

## References

- [Original: Per-run vs shared sandboxes (Sandscale blog)](https://sandscale.dev/blog/per-run-vs-shared-sandboxes)
- [Article on DEV.to](https://dev.to/sandscale/one-sandbox-per-run-per-session-or-per-user-isolation-cost-and-state-trade-offs-1i8f)
- [Cloudflare sandbox security concepts](https://developers.cloudflare.com/sandbox/concepts/security/)

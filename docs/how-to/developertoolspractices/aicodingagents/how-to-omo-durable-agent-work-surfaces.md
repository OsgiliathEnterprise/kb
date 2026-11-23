---
title: 'Omo: Giving Continuing AI-Agent Work a Place to Return To'
diataxis: How-to Guide
domain: developer-tools-practices
topic: ai-coding-agents
source: arXiv
source_url: https://arxiv.org/abs/2611.27107
date: 2026-11-23
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- how-to
---
# Omo: Giving Continuing AI-Agent Work a Place to Return To

**Authors:** Kaviru Hapuarachchi, Harrison Edwards — arXiv:2611.27107 (November 2026)

## Overview
Coding agents now keep working while humans are away; the hard part is **coming back**. A session list shows where agents are, but not what they were asked to do, what they changed, or what to tell them next. Omo's answer: give each piece of continuing agent work a **persistent place to return to**. The authors built the idea twice — **Omo Space**, an open-source Minecraft mod where player-built rooms and screens are live terminals on your own machine, and **Omo Theia**, which brings the same rooms and desks into a customizable IDE next to the editor and the Git patch.

## Problem Statement
Autonomous/ambient agent sessions outlive the attention of the person who started them. Returning to in-flight work from a bare session list loses task intent, changes made, and next steps — so people resume blind and often incorrectly.

## How-to: Give Continuing Agent Work a Place to Return To
1. **Keep sessions alive on the host.** Agent sessions must keep running on the host machine after the view is closed — the view is disposable, the work is not.
2. **Materialize each workstream as a place.** Represent each piece of continuing agent work as a persistent place (a room with screens/desks) that the human can re-enter; entering the place shows what that agent is doing now, not just that it exists.
3. **Make live state the interface.** The place's surfaces render the agent's live terminal output, so upon return you see what was asked, what changed, and what the agent is waiting for. The paper validates two surfaces for this: a Minecraft world (Omo Space, open-source) and an IDE (Omo Theia) — same rooms-and-desks model, one step from the editor and the Git patch.
4. **Build the same abstraction twice to test it.** Implement the place abstraction on two radically different substrates (a game world and an IDE) to separate the concept from its presentation.
5. **Design an evaluation for return quality.** The paper describes a study designed to test whether *returning to a place* helps people pick up agent work correctly — measure resumption correctness, not just task completion.

## Mechanism (lessons from building it twice)
The paper reports four lessons from building Omo Space and Omo Theia; the recurring one is that continuity should be a property of the *place* (host-side session + spatial surfaces), not of the client view or a chat transcript.

## Relevance to Our Domain
Directly applicable to operating coding-agent fleets: ambient agents are increasingly the default, and "return correctly" is a top reliability gap. The place abstraction is an alternative to transcript replay and to flat session dashboards for orchestrating long-running agent work.

## See Also
- [[Markdown Is Not a Firewall: four coding agents, one rules file, four boundaries]]
- [[Who Grades the Agent? Privilege Separation for Coding-Agent Benchmarks]] (reference)

## References
- Paper: https://arxiv.org/abs/2611.27107
- Omo Space (open-source Minecraft mod): see paper for repository link
- Semantic Scholar: https://api.semanticscholar.org/graph/v1/paper/arXiv:2611.27107

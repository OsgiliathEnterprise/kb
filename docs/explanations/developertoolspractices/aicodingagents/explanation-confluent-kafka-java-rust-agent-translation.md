---
title: 'Confluent''s Agentic Java-to-Rust Kafka Client Translation: Actor-Critic Agents,
  Discarded Rewrites, and Tests That Pass Anyway'
diataxis: Explanation
domain: developer-tools-practices
topic: ai-coding-agents
source: TheNewStack
source_url: https://thenewstack.io/confluent-kafka-rust-agents/
date: 2026-11-25
keywords:
- knowledge-base
- ai-coding-agents
- developer-tools-practices
- explanations
---
# Confluent's Agentic Java-to-Rust Kafka Client Translation: Actor-Critic Agents, Discarded Rewrites, and Tests That Pass Anyway

Confluent spent ~3 months with AI coding agents translating Apache Kafka's **Java client into Rust** — threw the first implementation away, found performance bugs that passed every translated test, and converged on a three-agent workflow (Project Manager + Actor + Critic) that later applied **191 upstream Kafka commits to the translated codebase in under two working days**. Primary source: Andrew Schofield (Confluent principal engineer, Kafka committer), [developer.confluent.io blog](https://developer.confluent.io/blog/using-agentic-ai-to-create-non-java-clients).

Diagram: `diagram-confluent-agent-translation-workflow.excalidraw` (PM agent → Actor/Critic loop over Git, human gate on plans and architecture).

## Why translate the Java client at all

- Kafka ships **only a Java client**, yet Confluent Cloud serves nearly as many non-Java connections as Java ones.
- Existing non-Java clients sit on **librdkafka** (C, ~as old as Kafka): different threading, memory management, batching, buffering — so Java tuning advice doesn't transfer, and new KIP features lag or never arrive.
- Kafka moves fast: **100+ active contributors, 20+ KIPs per release**. Strategy: derive all non-Java clients *directly from the evolving Java source* via AI translation, with a shared Rust core and language mapping rules that leave "room to grow" for features not yet designed.
- Interface correspondence matters: the new Python `poll()` returns records and raises, mirroring `KafkaConsumer.poll(Duration) -> ConsumerRecords` + exceptions — so Java-side improvements to `ConsumerRecords` can be carried across mechanically.

## The workflow: three agents, one translation

Two engineers at ~75% time each:

- **Project Manager agent** coordinates the **Actor** (writes the translated code) and the **Critic** (reviews it).
- **Actor and Critic communicate through Git**: Actor commits, Critic raises findings, Actor addresses them — typically **~5 review iterations** until the Critic goes silent.
- **Humans approve milestone and phase plans** and decide architecture: e.g. mapping Java threads → Tokio tasks; Rust-expert engineers iterated **six candidate interface designs** so the Rust core handles timeouts without interfering with other language runtimes' signal handling — idiomatic Rust, not Java-in-disguise.

Timeline: working Rust producer (no TLS) in **2 weeks**; TLS + authentication by **week 4**; basic consumer by **week 6**. Started on Claude Opus 4.6, progressed through several model upgrades. After several weeks the team **scrapped the entire first translation** and restarted with more specific instructions — the agents kept escalating to engineers for guidance on Kafka architecture, a sign the prompt/spec layer was under-specified.

## The failure mode that matters: "tests pass anyway"

The generated code passed the translated Kafka test suite — yet performance testing exposed a **sleep operation on every iteration of the networking loop**. Translated tests verify *behavior*, not *performance intent*.

The team's correction: translation instructions must specify **intended behavior**, not just the original source + translated tests. Passing tests alone was insufficient to verify agent-generated code — the same conclusion as independent verification-first arguments elsewhere in this KB.

## Continuous translation results

- Kafka 4.4.0 release: instead of re-translating, they brought the existing Rust codebase up to date — **191 upstream commits in &lt;2 working days**.
- Released: first GA **Rust client** (`cargo add confluent-kafka`, [Apache-2.0 source](https://github.com/confluentinc/kafka-clients/tree/master/rust)) + preview Python client 4.4 (`pip install --pre confluent-kafka`), both translated from Apache Kafka 4.4.0.
- A continuous translation pipeline is planned to start keeping clients in sync from **mid-2027**; multi-client sync at Kafka's pace is still unproven.

## Transferable lessons for agentic code translation

1. **Agents fail upward on architecture** — when agents ask humans many architecture questions, that's a signal to restart with tighter instructions rather than patch (they did, and it worked).
2. **Git is a good agent-to-agent protocol** — commits + review findings give the Actor/Critic loop durable, auditable state and natural iteration semantics.
3. **Human approval gates belong at plan boundaries** (milestones, phases, architecture decisions), not per-commit.
4. **Tests are necessary but weak verification for translation**: they don't catch performance anti-patterns; specify intended behavior in the instructions and add performance/benchmark checks.
5. **Language mapping rules are the real artifact**: the translation is disposable; the Java→Rust/Python correspondence rules are what create sustained feature parity ("Getting code quickly was only the beginning; making it useful across languages was the real engineering work" — Schofield).
6. Situate: this joins a wave of agent-driven Rust rewrites (GitHub Copilot and Anthropic's own migrations, Cloudflare's `tsrs` TypeScript port), but Confluent's differentiator is *maintaining* the translated code across upstream releases, not one-shot rewriting.

## References

- The New Stack coverage: [Confluent spent 3 months rewriting Kafka's Java client in Rust with AI — and had to start over](https://thenewstack.io/confluent-kafka-rust-agents/)
- Primary source (Confluent engineering): [Using Agentic AI to create the next generation of non-Java Kafka clients](https://developer.confluent.io/blog/using-agentic-ai-to-create-non-java-clients)
- Rust client docs: [Confluent Kafka Rust client overview](https://docs.confluent.io/kafka-clients/rust/current/overview.html)
- Related in KB: [Higher-scoring coding models did not get more work done](explanation-higher-scoring-coding-models-did-not-get-more-work-done.md), [AI Slop Pull Requests OSS study](explanation-ai-slop-pull-requests-oss-study.md)

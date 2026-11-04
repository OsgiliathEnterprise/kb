---
title: 'Claude Message Threads: Server-Side Conversation State as a Latency Feature'
diataxis: Explanation
domain: AI-LLM
topic: LLM-Infrastructure
source: DEV.to Tech News
source_url: https://dev.to/paullovelace/claude-api-message-threads-stop-resending-the-whole-conversation-explained-honestly-3moa
date: 2026-11-04
keywords:
- knowledge-base
- LLM-Infrastructure
- AI-LLM
- explanations
---
# Claude Message Threads: Server-Side Conversation State as a Latency Feature

Long-running agents on the Messages API pay a "resend tax": every turn re-uploads the entire conversation — every earlier message, every tool result — before the API validates and tokenizes it again. Anthropic opened a way around that on **2 November 2026** with **Message Threads**, in public beta (`anthropic-beta: message-threads-2026-08-12`). This note explains the model, and — as important — what the feature explicitly is *not*. Claims below were cross-checked against the official Anthropic docs on 2026-11-04. See diagram: `explanation-claude-message-threads-beta.excalidraw`.

## The mental model: create → continue → replay

A message thread keeps the conversation **on Anthropic's servers between turns**, in memory only:

1. **Create** — send the full conversation (with `system` and `tools`) plus `"thread": {"type": "create"}`. The API stores the conversation, including Claude's reply, under the response `id`.
2. **Continue** — send only the messages since the previous response, plus `"thread": {"type": "continue", "previous_message_id": "<id of previous response>"}`. Leave `system` and `tools` out — sending either on a continue request returns 400. The API reconstructs the conversation before calling the model.
3. **Replay** — threads are **best-effort**. If a continue returns 404 (`thread_not_found`, e.g. after the 5-minute expiry or a continuation sent before the previous stream's `message_stop`), your app must resend the full conversation in a new create request. The official SDK thread helper performs this replay once for you.

```python
client = anthropic.Anthropic()
first = client.beta.messages.create(
    model="claude-opus-5-5", max_tokens=1024,
    cache_control={"type": "ephemeral"},
    system="You are a support agent for Acme.",
    messages=[{"role": "user", "content": "Hi!"}],
    thread={"type": "create"}, betas=["message-threads-2026-08-12"])
second = client.beta.messages.create(
    model="claude-opus-5-5", max_tokens=1024,
    cache_control={"type": "ephemeral"},
    messages=[{"role": "user", "content": "Shipping time?"}],
    thread={"type": "continue", "previous_message_id": first.id},
    betas=["message-threads-2026-08-12"])
```

The thread is **append-only** and each response `id` can be continued **once** — always continue from the latest response id; to branch or edit, fork with a new create request.

## What it changes — and what it does not

**Latency, not cost.** Claude still reads the full conversation every turn: token usage, token charges and rate limits are **unchanged**. What shrinks is the *upload* and the re-validation/tokenization of already-seen content — the waiting, not the bill.

Anthropic's rollout numbers (vendor claims from the Claude Code rollout, **not** independently benchmarked): median time-to-first-token ~**35% lower** on 500K–1M token requests; median request size down from ~**800 KB to 1.8 KB** in long conversations. It is already on by default for most Claude Code users — the target workloads are long-running coding agents, computer-use agents (screenshots stay with the thread), and document/image-heavy workflows.

## Request-field semantics: fixed, create-only, free

The docs split fields into three groups — getting this wrong is the main integration pitfall:

| Group | Fields | Rule |
| --- | --- | --- |
| Create-only | `system`, `tools` | Only on the create request; even `"system": null` on a continue returns 400 |
| Fixed | `model`, `tool_choice`, `thinking`, `context_management`, top-level `cache_control`, the set of `anthropic-beta` values, … | Must be identical on every request; a mismatch returns 400 `thread_fingerprint_mismatch` naming the differing fields |
| Free | `max_tokens`, `stop_sequences`, `stream`, `metadata`, `service_tier`, … | May vary per turn |

MCP server URLs/auth tokens and the container `id` are **not** stored — resend `mcp_servers`/`container` whenever used.

## Interaction with prompt caching

Threads do **not** turn prompt caching on for you. To cache each turn, send the same top-level `cache_control: {"type": "ephemeral"}` on every request; each turn then reads the prior conversation from cache and writes the new turn to it. A thread request carries at most **4 `cache_control` breakpoints** (the top-level one counts; create-request `system`/`tools` breakpoints count again on every continue). Breakpoints on earlier messages can never be moved or removed — continue requests can't resend earlier messages.

## Hard limits (from the official docs)

- **5-minute expiry** after the last request; each stored response restarts the clock. Deletion no more than **1 hour** after last use.
- **In-memory only**, encrypted under a server-managed key, never written to durable storage. **No API to list, read, or delete a thread.**
- **Not ZDR-eligible, not HIPAA-eligible**; excluded for orgs with Inference hooks. Using it doesn't affect other features' ZDR eligibility.
- Not compatible with Message Batches, on-demand compaction, most context editing, or the Token Counting API path.
- Turns written by fallback models are not stored — a new full create request is required before threading resumes.
- Files are held **by reference** — keep every file the conversation uses available for the thread's lifetime.
- Streaming: continue from the response `id` (arrives in `message_start`) only after `message_stop`; earlier → 404. A dropped stream: resend the same continue; `thread_already_continued`/`thread_continue_in_flight` → replay via create.
- `pause_turn` responses: resume with a continue carrying `"messages": []`; never inject a new user message into a paused turn.

## Design consequences

- **Your application stays the source of record.** Keep your own full copy of every message and build the replay path from day one; threads are a shortcut, not a store. If the conversation must outlive your process, that's your job.
- Threads fit **active sessions where TTFT matters** (agent loops running for hours). If your bottleneck is the token bill, durable storage, or compliance, this feature changes nothing for you.
- Availability: beta on every model, on the Claude API, Claude Platform on AWS, Claude Models on Google Cloud (Anthropic-managed), and Claude in Microsoft Foundry. Standard token rates apply.

## Related KB notes

- [[explanation-prefixbench-h100-prefix-reuse-ttft]] — server-side prefix reuse for TTFT at the serving layer
- [[howto-tiered-response-caching-for-llm-costs]] — response caching, the cost-side complement (threads do not touch cost)

## References

- Original article (honest-limits framing, vendor numbers flagged): [Claude API Message Threads — Explained Honestly (DEV.to)](https://dev.to/paullovelace/claude-api-message-threads-stop-resending-the-whole-conversation-explained-honestly-3moa)
- Official docs: [Message threads — Claude Platform](https://platform.claude.com/docs/en/build-with-claude/message-threads)
- Official release notes: [November 2, 2026 — message threads beta](https://platform.claude.com/docs/en/release-notes/overview)
- Anthropic article: [Make long-running agents faster with message threads](https://claude.com/resources/articles/message-threads)

---
title: 'Prompt Caching for Multi-Turn Coding Agents: The Append-Only Transcript Discipline'
diataxis: How-to Guide
domain: ai-machine-learning
topic: resource-optimization
source: DZone AI/ML
source_url: https://dzone.com/articles/prompt-caching-coding-agents
date: 2026-11-28
keywords:
- knowledge-base
- resource-optimization
- ai-machine-learning
- how-to
---
# Prompt Caching for Multi-Turn Coding Agents: The Append-Only Transcript Discipline

Coding agents are expensive for a structural reason: **they resend everything**.
Every step of a Claude Code / Cline / Aider / opencode loop re-sends the system
prompt, tool definitions, all files read, every prior tool call and output, and
every earlier assistant reply — then adds one message. By turn 30, almost all of
each request is text the model has already seen. Provider-side **prefix caching**
turns that repetition into a 75–84% discount — but it is easy to defeat by accident.

This how-to is written against the xAI API (whose docs state the mechanism most
plainly), but the discipline applies to any provider that caches prompt prefixes
(Anthropic, OpenAI, gateways).

## How prefix caching works

The cache matches **from the start of the `messages` array**: when a request
arrives, the system checks how many leading messages match a previous request
*exactly*. That matching prefix skips recomputation (lower time-to-first-token)
and is **billed at a reduced rate**. An agent loop is the ideal shape: turn 1
caches nothing, turn 2 caches everything through turn 1, and so on.

## Step 1: Treat the transcript as append-only

Matching is exact and prefix-anchored, so **any change to an earlier message ends
the match at that point**. Three common agent-framework habits silently kill the
cache:

1. **Rewriting the system prompt each turn** (timestamp, cwd, "files changed so
   far" summary). If that dynamic block sits at the top, every request misses from
   message zero. → Put stable content first; append dynamic state as a *new*
   message.
2. **Trimming or summarising old tool output in place.** Shortening a 4,000-line
   log from turn 3 saves tokens on paper but breaks the prefix from turn 3 onward.
   → Compaction is still valid — do it **rarely and on purpose**, never every turn,
   ideally before crossing a long-context threshold.
3. **Reordering tool definitions** (e.g. building them from an unordered map).
   Non-deterministic serialization order changes the prefix. → Deterministic
   serialization, byte-identical schemas across turns.

## Step 2: Pin the conversation to one server

Caches are **per-server** and evictable under memory pressure. Route every turn of
a conversation to the same replica with a routing hint:

- xAI Chat Completions: header `x-grok-conv-id` (a UUID or session ID — *not*
  per-request)
- xAI Responses API: body field `prompt_cache_key`
- Gateways may set it for you (derive a stable key from account + conversation)

Cold-then-warm pattern (swap header name for `api.x.ai` directly):

```bash
# Turn 1: new conversation id -> cached_tokens = 0 (expected miss)
curl https://api.x.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -H "x-grok-conv-id: conv_abc123" \
  -d '{
    "model": "grok-4.6",
    "messages": [
      { "role": "system", "content": "You are a helpful assistant." },
      { "role": "user", "content": "What is prompt caching?" }
    ]
  }'
# Turn 2: APPEND assistant reply + new user message, same x-grok-conv-id
# -> the earlier prefix is served from cache
```

## Step 3: Send the reasoning back (reasoning models)

The server's cached record of a turn **includes the reasoning tokens**. If your
client strips `reasoning_content` before replaying the assistant message, the
"unchanged" history no longer matches what was cached — this is the top cause of an
otherwise-correct prefix missing. Either replay `reasoning_content` verbatim or
chain statefully with `previous_response_id` on `/responses`.

## Step 4: Verify with `cached_tokens`, don't assume

Both APIs report hits in the usage block:

- Chat Completions: `usage.prompt_tokens_details.cached_tokens`
- Responses: `usage.input_tokens_details.cached_tokens`

`0` = miss (fine on turn 1 or after eviction); partial = positive value;
`== prompt_tokens` = full hit. A healthy conversation shows it climbing each turn
(0 → 50 → 120 …). **Log it every agent step and alert when it drops to zero
mid-session** — that almost always means something rewrote history.

## Step 5: Know what it's worth (arithmetic, not benchmarks)

Published rates, grok-4.7 under 200K tokens: **$2.00/M fresh input, $0.50/M cached
input, $6.00/M output** — cached input costs a quarter of fresh. Illustrative step:
100,000-token prompt where all but the last 5,000 tokens repeat the previous turn:

| Scenario | Input cost |
|---|---|
| No cache hit | 100,000 × $2.00/M = **$0.200** |
| Prefix hit | 95,000 × $0.50/M + 5,000 × $2.00/M = **$0.0575** (≈71% less) |

One trap for long agent sessions: past the model's long-context threshold (200K
for grok-4.7), **all tokens** in the request bill at doubled rates ($4.00 / $1.00 /
$12.00). Unbounded transcripts pay twice — once for size, again at the higher tier.
This is the strongest argument for deliberate compaction *before* the threshold.

## Checklist for agent builders

1. System prompt + tool schemas byte-identical across turns (deterministic serialization).
2. Only append; dynamic state goes in new messages, never at the top.
3. Stable conversation ID (`x-grok-conv-id` / `prompt_cache_key`) or a gateway that sets one.
4. Replay `reasoning_content`, or chain with `previous_response_id`.
5. Log `cached_tokens` every step; alert on zero.
6. Compact rarely and deliberately, before the long-context threshold.
7. Design for misses — the app must work without caching (eviction is guaranteed possible).

**Core discipline: the transcript is an append-only log.** Coding agents already
have that shape; the work is not breaking it.

## References

- Original article: [Prompt Caching for Multi-Turn Coding Agents (DZone)](https://dzone.com/articles/prompt-caching-coding-agents)
- xAI docs: [Prompt caching](https://docs.x.ai/developers/advanced-api-usage/prompt-caching), [How It Works](https://docs.x.ai/developers/advanced-api-usage/prompt-caching/how-it-works), [Maximizing Cache Hits](https://docs.x.ai/developers/advanced-api-usage/prompt-caching/maximizing-cache-hits), [Usage & Pricing](https://docs.x.ai/developers/advanced-api-usage/prompt-caching/usage-and-pricing), [Best Practices](https://docs.x.ai/developers/advanced-api-usage/prompt-caching/best-practices)
- Related KB note: [Token Governance: Cost Optimization for Production Agent Fleets](../../../explanations/aimachinelearning/resourceoptimization/explanation-llm-cost-optimization-agent-fleets.md)

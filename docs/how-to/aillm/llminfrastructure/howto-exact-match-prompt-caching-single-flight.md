---
title: 'Exact-Match Prompt Caching in Production: Keys, Tiers, Stampedes'
diataxis: How-to Guide
domain: AI-LLM
topic: LLM-Infrastructure
source: DZone AI/ML
source_url: https://dzone.com/articles/llm-exact-match-prompt-caching
date: 2026-11-11
keywords:
- knowledge-base
- LLM-Infrastructure
- AI-LLM
- how-to
---
# Exact-Match Prompt Caching in Production: Keys, Tiers, Stampedes

LLM apps repeatedly receive the same or near-identical prompts: form submissions, FAQ questions, agent tool calls. Every repeat pays full token cost, full latency, and rate-limit pressure. Production caching has **four stackable layers**; exact match is the cheapest check and belongs first:

| # | Layer | Catches | Skips model call? |
|---|-------|---------|-------------------|
| 1 | **Gateway/app exact match** (hash lookup) | byte-identical / normalized request | yes — zero cost on hit |
| 2 | Semantic cache (embedding + vector similarity) | reworded equivalents | yes |
| 3 | Inference-engine KV cache reuse (vLLM, SGLang) | repeated prompt prefixes inside your own serving stack | no, just cheaper |
| 4 | Provider prompt/prefix caching (Anthropic, OpenAI, Bedrock) | shared prefixes at the API vendor | no, just cheaper |

Check exact match first, then semantic, then let the request reach the model. This note covers layer 1.

## Step 1 — Key design

Hash the full context that *changes the output*; exclude what doesn't:

- Include: system prompt, user message(s), tool definitions, and settings like `temperature` and model id.
- Exclude: request IDs, trace IDs, timestamps.
- **Normalize before hashing**: strip whitespace; sort tool lists and JSON keys. Two silent cache-breakers in agent traffic: tool definitions listed in different order between calls, and JSON keys serialized in different order by different parts of the same codebase.

```python
import hashlib, json, redis
r = redis.Redis(host="localhost", port=6379, db=0)

def make_key(prompt: str, model: str, temperature: float = 0.0) -> str:
    payload = json.dumps({"prompt": prompt, "model": model, "temp": temperature},
                         sort_keys=True)
    return "llm:exact:" + hashlib.sha256(payload.encode()).hexdigest()

def get_exact(prompt, model, temperature=0.0):
    try:
        return r.get(make_key(prompt, model, temperature))
    except redis.RedisError as exc:
        logger.warning("exact cache read failed: %s", exc)   # cache is fail-open
        return None

def set_exact(prompt, response, model, temperature=0.0, ttl=300):
    try:
        r.setex(make_key(prompt, model, temperature), ttl, response)
    except redis.RedisError as exc:
        logger.warning("exact cache write failed: %s", exc)
```

**Fail-open rule**: if the cache goes down, fall through to a full model call — never fail the request.

## Step 2 — Pick where the cache lives

- **In-process LRU** (`cachetools`, local dict): sub-ms, no network. Per-instance view → low hit rate on multi-instance deployments until each instance warms. Fine for small deployments.
- **Shared store** (Redis/Memcached): one view for all instances — a hit on A counts for B. The default beyond one instance; costs a few ms of network.
- **Two-level** (small in-process LRU in front of Redis): hot keys never leave the process; everything else falls through. Worth it when a few keys dominate traffic (FAQ-style workloads).

Staleness controls: fixed TTL (e.g. 60 s for prices/stock levels), LRU eviction at capacity, and **explicit invalidation** on price updates, outages, policy changes.

## Step 3 — Error caching policy

- Never cache a `429` or provider `5xx` as if it were an answer — retry with backoff instead.
- Guardrail/content-filter rejections: judgment call. Briefly caching them (seconds to a minute) stops a hostile client from re-triggering the expensive rejection path; never caching them avoids serving a stale "rejected" after the input was fixed.
- If caching rejections: separate key prefix (`llm:reject:`), separate TTL, and keep them out of hit-rate metrics.

## Step 4 — Kill the thundering herd

Fifty identical requests arriving before the first fills the cache all miss and all call the model — a cache stampede, and exact-match caching can *worsen* spikes without this fix:

1. **Request coalescing (single-flight)**: first request for a key takes a lock / sets an in-flight marker; the rest wait on its result (Redis `SET NX`, or Go `singleflight`).
2. **Cache the in-progress state**, not just finished responses, so late arrivals see "someone is already working on this".
3. **Fair timeout on the wait** with fallback to a normal model call, so one stuck request doesn't block every waiter.

## Step 5 — Warm the cache

Any deploy that clears the cache tanks the hit rate for the first minutes. A warm-up job that reloads the most frequent prompts+responses from recent logs before taking traffic avoids the dip — biggest win on FAQ-style traffic where few questions carry most volume.

## When it shines (and when it doesn't)

Templated queries, form-driven flows, test suites, batch jobs → hit rates can be very high. Open free-form chat → close to zero; that gap is semantic caching's job (embeddings + vector similarity, with a verification step before trusting the similarity score).

## Cross-links

- `howto-tiered-response-caching-for-llm-costs.md` — the two-tier response-cache design this slot(s) into
- `explanation-prefixbench-h100-prefix-reuse-ttft.md` — layer-3/4 behaviour: prefix reuse and TTFT characterisation
- `explanation-tpu-sync-kv-cache-transfer.md` — layer-3 plumbing: fast KV-cache movement between memory tiers

## References

- DZone: *Prompt Caching for LLMs, Part 1: Exact-Match Caching in Production* (3-part series) — [dzone.com/articles/llm-exact-match-prompt-caching](https://dzone.com/articles/llm-exact-match-prompt-caching)
- Redis `SET` options incl. `NX` locking pattern: [redis.io/commands/set](https://redis.io/commands/set/)
- Redis eviction policies (LRU/LFU/TTL): [redis.io/docs/manual/eviction](https://redis.io/docs/manual/eviction/)
- Related on this KB: preventing cache stampedes at scale, DZone — [dzone.com/articles/preventing-cache-stampedes-at-scale](https://dzone.com/articles/preventing-cache-stampedes-at-scale)

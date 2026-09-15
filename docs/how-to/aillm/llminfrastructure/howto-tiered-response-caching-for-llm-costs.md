---
title: Tiered Response Caching to Cut LLM API Costs
diataxis: How-to Guide
domain: AI-LLM
topic: LLM-Infrastructure
source: TheNewStack
source_url: https://thenewstack.io/llm-response-caching-costs/
date: 2026-09-15
keywords:
- knowledge-base
- LLM-Infrastructure
- AI-LLM
- how-to
---
# Tiered Response Caching to Cut LLM API Costs

LLM APIs bill by token and treat duplicate requests as new ones. Batch jobs repeat boilerplate, CI runs invoke the same prompts, tool-calling agents hit the same knowledge-base tools repeatedly — each repetition is a fresh charge. **Response caching** skips the model call entirely when an answer already exists in your own infrastructure.

> Distinction: native *prompt* caching reuses cached prompt computation at reduced rates (output generation still billable). *Response* caching avoids the call altogether. This note covers response caching.

## Step 1 — Build Tier 1: Exact-Match Cache

Normalize the model request body, hash it with SHA-256, look up in an O(1) store like Redis. On hit, return the stored answer without inference. Best for bounded, predictable requests: batch pipelines, CI runs, boilerplate summarization.

## Step 2 — Build Tier 2: Semantic Cache

For near-duplicate queries that aren't identical:

1. Embed the query with an embedding model
2. Store the vector in a vector database alongside the response
3. On new query: embed → search top_k=1 → compare cosine similarity against a threshold

**Threshold guidance (starting points, not defaults):**

| Query type | Suggested threshold | Why |
|-----------|--------------------|-----|
| Code-like queries | ≥ 0.95 | Small wording changes produce entirely different results |
| Conversational queries | 0.85–0.90 | Paraphrases are common and safe to conflate |

Two traps: (1) some vector engines report *distance* that falls toward 0 instead of similarity rising toward 1 — confirm which metric your threshold compares against; (2) a looser threshold risks answering one query while the user asked another ("weather in my town" ≠ "weather in a different town").

## Step 3 — Combine into a Hybrid Cache

Check exact match first; run semantic search only on a miss. When semantic search finds a close-enough match, **promote** it back into the exact-match store under the hash of the new query — so the paraphrase becomes an exact hit next time.

```python
def cached_completion(query, ctx):
    # ctx bundles everything that changes what the correct answer is:
    # context/documents in the prompt, model + settings, source-version
    # of retrieved content, and the caller's access scope.
    key = sha256(normalize(query, ctx))

    # Tier 1: exact-key lookup on Redis (O(1)).
    if (hit := redis.get(key)):
        return hit

    # Tier 2: semantic search, restricted to the same scope as the request.
    emb = embed(query)
    match = vector_db.search(emb, top_k=1, filter=scope_of(ctx))
    if match and same_scope(match, ctx) \
            and match.score >= threshold_for(category(query)):
        # Promote into exact store, preserving original freshness deadline.
        remaining = match.expires_at - now()
        if remaining > 0:
            redis.set(key, match.response, ttl=remaining)
            return match.response

    # Miss on both tiers: call the model, validate before writing back.
    resp = llm(query, ctx)
    if is_valid(resp):  # no errors, no empty payloads, no malformed JSON
        ttl = ttl_for(category(query))
        redis.set(key, resp, ttl=ttl)
        vector_db.insert(emb, resp, ttl=ttl, scope=scope_of(ctx))
    return resp
```

## Step 4 — Key on More Than the Query Text

Two identical questions asked against different documents, or by users with different permissions, **must not** share a cache entry. The key must include:

- Context and documents in the prompt
- Model name and its settings (temperature, etc.)
- Version of any retrieved source content
- Caller's access scope

## Step 5 — Tune TTLs to Acceptable Staleness

TTL is a judgment about how much staleness the use case tolerates:

| Data type | Suggested freshness |
|-----------|--------------------|
| Live market data / sports scores | Seconds–minutes (or don't cache during live events) |
| News summaries | ~1 hour |
| Internal HR policy answers | Weeks (source document rarely changes) |

Two invalidation strategies: per-category TTLs with content-update invalidation, or blunt full-cache purge whenever source content changes. Verified final scores can support long caching with correction-based invalidation; the question is whether the underlying value is still moving.

## Step 6 — Validate Before Writing Back

Never cache raw model output without checking it: reject errors, empty payloads, and malformed JSON so you don't poison the cache. A fresh model response helps spot differences but **is not ground truth** — evaluate cached answers against verified reference answers or expert review.

## Step 7 — Run in Shadow Mode First

Before changing behavior, run the cache in shadow mode: log what you *would* have returned without serving it. Measure your actual hit rate before projecting savings.

### Worked cost example

1,000,000 calls/month at $0.006/call = ~$6,000 uncached. Hybrid cache with 60% combined hit rate avoids 600k model calls; embedding + vector-store overhead ≈ $150 → **~$2,550/month (57.5% reduction)**, plus latency wins on every cached answer.

## Pre-Launch Checklist

- [ ] Cache warmed from a historical set of common queries
- [ ] Hit rate measured in shadow mode before projecting savings
- [ ] Thresholds validated against real queries for your embedding model
- [ ] Scope isolation verified (documents, model settings, source version, permissions)
- [ ] Validation gate on all write-back paths
- [ ] Invalidation wired to content updates

## References

- [Why an old caching trick is your secret to lower LLM costs — The New Stack](https://thenewstack.io/llm-response-caching-costs/)
- [Can prompt caching tame RAG costs without sacrificing accuracy? — The New Stack](https://thenewstack.io/production-rag-pipeline-fixes/)

## Related

- [[explanation-qwen3-embedding-cloud-tpu-vllm]]
- [[howto-cloud-budget-alerts-aws-gcp-azure]]

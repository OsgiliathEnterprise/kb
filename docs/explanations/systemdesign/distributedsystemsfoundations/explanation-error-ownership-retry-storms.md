---
title: Error Ownership and Retry Storms — How Uber Contains Cross-Service Retry Amplification
diataxis: Explanation
domain: system-design
topic: Distributed-Systems-Foundations
source: HackerNews
source_url: https://www.uber.com/us/en/blog/protecting-against-retry-storms/
date: 2026-09-18
keywords:
- knowledge-base
- Distributed-Systems-Foundations
- system-design
- explanations
---
# Error Ownership and Retry Storms — How Uber Contains Cross-Service Retry Amplification

Uber's 2026 engineering post describes a production mechanism for **error ownership**: deciding *which* service in a deep call chain is allowed to retry an error, so that retries stop amplifying into a stack-wide storm. The core insight: you can control how many times a request is retried (retry budgets), but without context you cannot control *where* the retries happen — and it's the location that causes cascading load.

## Why naive retries amplify

In a call chain A→B→C→D→E→F→G where every hop retries once, an error originating at D multiplies: each upstream node re-sends its request, so requests served grow as **R^d × N** (R = retries per hop, d = depth). With one retry per hop and the fault at depth 3, nodes B and C serve 2× and 4× baseline traffic.

Retry budgets soften this: with budget B at every hop the growth becomes **(1+B)^d × N**. A 10% budget caps a 6-deep chain at ~1.33× baseline — but it still retries *everywhere*, including nodes far from the fault, and gives no visibility into cross-service amplification.

## The key idea: symptom vs cause (error ownership)

A service that calls N outbounds and returns an error because one outbound failed is only a **symptom** — the real cause is downstream. But if *no* outbound failed and it still errored, the service itself is the **cause** and therefore the *owner*. Ownership determines who may retry:

- The owner (or its immediate caller) gets at least one retry opportunity on the error's first return.
- Every node that merely propagates an error must mark it as **unclaimed**, telling upstream callers "this isn't mine, don't retry me for this."

### Claim/unclaim decision matrix

| Callee Error | Caller Error | Callee Error Claim | Caller Should Retry | Propagated Claim |
| --- | --- | --- | --- | --- |
| No | Yes | N/A | N/A | Claim (caller owns its own error) |
| Yes | Yes | Missing | Yes | Unclaim |
| Yes | Yes | Claimed | Yes | Unclaim |
| Yes | Yes | Unclaimed | **No** | Unclaim |

The "missing claim" case is the uncooperative-environment fallback: the first node that sees a downstream without error-claim headers unclaims the error itself, limiting the disturbance radius while still allowing retries against the service that actually returned the error.

## How ownership is computed (Service Dependency Analysis)

Uber's **Service Dependency Analysis** solution correlates inbound failures with outbound failures per request context:

1. If an inbound failure coincides with a fail-close outbound failure → attribute blame downstream, unclaim upstream.
2. If no outbound failed → the service owns the error and claims it.
3. Blame is attributed to downstreams first, itself last — which creates a known false-positive class: **coincidental errors** (an internal error happening at the same time as an unrelated fail-open dependency error). Uber's 6-month data showed this is rare (~2% worst case on high-failure edges), and the solution keeps a *memory of failure patterns* so it only unclaims when inbound failures genuinely correlate with fail-close outbound failures.

### At-least-once retry guarantee

Many services have no retries configured for fail-close outbounds; pure ownership would drop their availability. The fix: the **retry middleware** computes whether its own retry criteria are satisfied and passes that signal to the dependency-analysis layer, which then decides at inbound whether to own the downstream's error. Net effect: every call chain gets *at least one* retry somewhere (if any node has retries configured) without adding new retries along the chain.

### Context drops

If intra-service context breaks between C and D, C cannot correlate and will claim the error itself — shifting the retryable point left by one hop. The unclaim header still propagates upward, so a 4-node example with single-retry config halves total requests versus no ownership (and avoids up to 32× amplification in deeper chains).

## Production results

- **Nov 18, 2025 outage** (Core Entity service, >5 levels deep): simple retry budgets would have added 46–135% traffic on the degraded service. Error ownership stopped immediate retries at the direct callers (up to 200k requests each) and an estimated **9.5 million spurious requests** aggregated across ancestors.
- **Max retry storm radius** (deepest call path where a storm could still happen): reduced from up to **25 → 3**, average **20 → 2**.

## How this maps to tooling you already use

The mechanism is the "context-aware" upgrade of patterns available in standard infrastructure:

- **Envoy** ships `retry_budget` (percentage of active requests, default 20%, with a minimum concurrency floor) — the *budget* half of Uber's model.
- **gRPC** has retry throttling (`maxTokens`/`tokenRatio`) and per-method retry policies with exponential backoff + jitter.
- What neither provides out of the box is the *ownership* half: correlating inbound vs outbound failures to decide which hop may retry, propagated via headers (Uber uses an `x-uber-error-claim` style header) so every node in the chain makes a consistent decision without per-service bespoke logic.

## Design takeaways

1. **Retries are load-shifting, not load-reducing** — during sustained degradation they move work to other nodes and amplify it across fan-out edges.
2. **Budgets bound the multiplier; ownership bounds the location.** You need both: a budget without context retries in the wrong place; ownership without a floor drops availability for services that never retry.
3. **Propagate decisions, not error codes.** Translating downstream error codes upstream doesn't scale with fan-in/fan-out and evolving call graphs; a single claim/unclaim header does.
4. **Handle the uncooperative edge explicitly** — missing context or missing instrumentation should degrade to "unclaim at first sight," never to "retry everywhere."

## Diagram

See [error-ownership-retry-storms.excalidraw](error-ownership-retry-storms.svg) for the claim/unclaim propagation across a call chain.

## References

- [How Uber Protects Against Retry Storms (Uber Engineering, 2026-09-17)](https://www.uber.com/us/en/blog/protecting-against-retry-storms/)
- [Envoy: handling transient failures and retry budgets](https://www.envoyproxy.io/docs/envoy/latest/faq/load_balancing/transient_failures)
- [gRPC retry policy and throttling guide](https://grpc.io/docs/guides/retry/)

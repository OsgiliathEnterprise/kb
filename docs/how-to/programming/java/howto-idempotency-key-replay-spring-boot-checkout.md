---
title: How to Make Idempotency Keys Recover Lost Responses in a Spring Boot Checkout
  API
diataxis: How-to Guide
domain: programming
topic: java
source: DEV.to Tech News
source_url: https://dev.to/shitanshu686/i-fixed-an-idempotency-bug-in-my-spring-boot-e-commerce-backend-l4i
date: 2026-10-12
keywords:
- knowledge-base
- java
- programming
- how-to
---
# How to Make Idempotency Keys Recover Lost Responses in a Spring Boot Checkout API

## The bug

A common first implementation of an `Idempotency-Key` header for a checkout endpoint returns **HTTP 409 Conflict** whenever the key is reused. That prevents duplicate orders — but it has a fatal edge case:

1. Customer submits checkout; backend creates the order and **commits the transaction**.
2. A network failure prevents the HTTP response from reaching the customer.
3. Customer retries with the same key.
4. Backend returns 409 — the duplicate is prevented, but the customer **can never recover the result** of the successful checkout. The server knows the order succeeded; the client does not.

The fix principle: **a retry must be able to recover the original result, not merely discover that the key was used.**

## The three-way state distinction

Concurrent requests can arrive with the same key *before* the first request finishes. If both threads check the key before either claims it, both may try to process the checkout. A reliable implementation must distinguish three cases with **atomic state management** (not a plain `if` on key existence):

| Situation | Response |
| --- | --- |
| Completed request, **identical payload** | Replay the stored result (same order ID, `Idempotency-Replayed: true` header) |
| Same key, **different payload** | Reject with **HTTP 422 Unprocessable Content** |
| Request **still in progress** | Block/queue the second execution (in-flight protection) |

## How the fix works

1. **Completed-response replay.** A repeated key with the same payload returns the previously completed result. The original order ID is preserved, so a lost response is recoverable.
2. **SHA-256 payload fingerprinting.** The checkout payload is fingerprinted with SHA-256; a key reused with a *different* payload is rejected with 422, so one key can't silently be reused across two different checkouts.
3. **Explicit replay header.** Replayed responses carry `Idempotency-Replayed: true` so clients can distinguish a replay from a fresh execution.
4. **In-flight protection.** The `PROCESSING` state is claimed atomically so concurrent duplicates can't independently start the same checkout. For a **multi-instance** deployment the key claim must go through shared atomic storage (e.g. a DB row with `INSERT ... ON CONFLICT`, or a lock service) — a local in-memory lock is not enough when requests can land on different instances.

## Acceptance test

The decisive test encodes the original bug:

1. Submit a checkout request.
2. Let the order transaction **commit**.
3. **Drop the HTTP response** (simulate network loss).
4. Retry with the original key and identical payload.
5. Assert the **original order ID** is returned, only one order exists, and stock was decremented exactly once.

Also test: concurrent retries with the same key; same key with a different payload (must be 422).

## Key lesson

Rejecting a duplicate request does not make the checkout reliable. Idempotency must account for **network failures, transaction commits, concurrent execution, and retries** — the original request may have succeeded even when the client never received its response. Tech stack in the source project (ShopEase): Java, Spring Boot, Spring Data JPA, MySQL.

```excalidraw
{"type": "drawing", "version": 2, "source": "https://github.com/excalidraw/excalidraw", "elements": [{"id": "req1", "type": "rectangle", "x": 40, "y": 40, "width": 220, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "checkout request\nIdempotency-Key: k1", "fontSize": 14, "fontFamily": 1}}, {"id": "committed", "type": "rectangle", "x": 340, "y": 40, "width": 240, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "order committed\nresponse lost in transit", "fontSize": 14, "fontFamily": 1}}, {"id": "retry", "type": "rectangle", "x": 40, "y": 180, "width": 220, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "retry, same key\nsame payload", "fontSize": 14, "fontFamily": 1}}, {"id": "replay", "type": "rectangle", "x": 340, "y": 180, "width": 240, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "replay stored result\noriginal order ID\nIdempotency-Replayed: true", "fontSize": 14, "fontFamily": 1}}, {"id": "other", "type": "rectangle", "x": 40, "y": 320, "width": 220, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#ffc9c9", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "same key\ndifferent payload", "fontSize": 14, "fontFamily": 1}}, {"id": "reject", "type": "rectangle", "x": 340, "y": 320, "width": 240, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "#ffc9c9", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "reject HTTP 422\n(SHA-256 fingerprint mismatch)", "fontSize": 14, "fontFamily": 1}}, {"id": "a1", "type": "arrow", "x": 260, "y": 75, "width": 80, "height": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [80, 0]]}, {"id": "a2", "type": "arrow", "x": 150, "y": 110, "width": 1, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [0, 70]]}, {"id": "a3", "type": "arrow", "x": 260, "y": 215, "width": 80, "height": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [80, 0]]}, {"id": "a4", "type": "arrow", "x": 150, "y": 250, "width": 1, "height": 70, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [0, 70]]}, {"id": "a5", "type": "arrow", "x": 260, "y": 355, "width": 80, "height": 1, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [80, 0]]}]}
```

## References

- [I Fixed an Idempotency Bug in My Spring Boot E-Commerce Backend (DEV.to)](https://dev.to/shitanshu686/i-fixed-an-idempotency-bug-in-my-spring-boot-e-commerce-backend-l4i)
- [RFC 9407: The Idempotency-Key Request Header Field](https://www.rfc-editor.org/rfc/rfc9407)
- [How to Design Idempotent APIs (Stripe)](https://stripe.com/docs/api/idempotent_requests)

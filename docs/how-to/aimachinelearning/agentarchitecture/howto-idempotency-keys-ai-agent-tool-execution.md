---
title: 'How to Make AI Agent Tool Execution Idempotent: Keys, Fingerprints, and the
  UNKNOWN State'
diataxis: How-to Guide
domain: ai-machine-learning
topic: agent-architecture
source: DEV.to Tech News
source_url: https://dev.to/arthur_doss/using-idempotency-keys-for-safe-ai-agent-tool-execution-1gne
date: 2026-10-28
keywords:
- knowledge-base
- agent-architecture
- ai-machine-learning
- how-to
---
# How to Make AI Agent Tool Execution Idempotent: Keys, Fingerprints, and the UNKNOWN State

AI agents now execute business operations (refunds, orders, resource provisioning), not just answers. The failure mode that bites: the tool call **times out after the external service already succeeded**, the agent retries, and the business action fires twice. This note distills a production-oriented pattern: a **deterministic tool-execution layer** between the agent and external services, where the **orchestration layer owns the idempotency key** — never the LLM.

## The core distinction

- **Retry policies** decide *when* to try again.
- **Idempotency mechanisms** decide whether *repeating the attempt* can safely produce the intended result.

A failed *request* is not a failed *business operation*. Duplicate tool execution comes from: network timeouts after the provider completed, worker crashes between side effect and result-save, framework auto-retries, workflow resumption, concurrent workers on the same queued request, or the agent simply emitting another tool call because it never saw the previous result.

## Step 1: Generate keys from durable identifiers, not the model

The LLM should **not** decide whether a retry is a new operation. Derive the key from workflow and business-operation IDs:

```python
idempotency_key = f"{workflow_run_id}:{tool_operation_id}"
```

- A **conversation ID alone is insufficient** — one conversation can contain several legitimate refunds.
- **Fresh UUID per retry defeats deduplication** — create the identity once, persist it, reuse it for the operation's whole lifecycle.

## Step 2: Bind the key to the operation with a request fingerprint

Otherwise the same key could be reused for a different amount or destination. Canonicalize then hash:

```python
import hashlib
import json

def request_fingerprint(tenant_id: str, tool_name: str, arguments: dict) -> str:
    payload = {
        "tenant_id": tenant_id,
        "tool_name": tool_name,
        "arguments": arguments,
    }
    canonical = json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
```

Sorted keys + consistent serialization make equivalent payloads produce the same hash. **Normalize** timestamps/decimals before hashing, and include every field that changes the operation's meaning.

## Step 3: Durable operation table + atomic claim

```sql
CREATE TABLE agent_tool_operations (
    tenant_id       TEXT NOT NULL,
    operation_id    TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    request_hash    TEXT NOT NULL,
    status          TEXT NOT NULL
                    CHECK (status IN (
                        'PENDING','IN_PROGRESS','SUCCEEDED','FAILED','UNKNOWN'
                    )),
    result_json     JSONB,
    external_ref    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, idempotency_key),
    UNIQUE (tenant_id, operation_id)
);
```

Composite PK blocks duplicate records per tenant; tenant scoping prevents cross-tenant collisions. Claim atomically:

```sql
INSERT INTO agent_tool_operations
    (tenant_id, operation_id, idempotency_key, request_hash, status)
VALUES
    (:tenant_id, :operation_id, :idempotency_key, :request_hash, 'PENDING')
ON CONFLICT (tenant_id, idempotency_key) DO NOTHING;
```

Then read the record back in the same transaction and branch deterministically:

| Situation | Behavior |
|---|---|
| New key | create the operation |
| Same key + completed op | return the stored result |
| Same key + active op | report in-progress |
| Same key + different fingerprint | **conflict — reject** |
| Same key + UNKNOWN outcome | enter reconciliation |
| Confirmed failure | retry per explicit policy |

## Step 4: The state machine, and why UNKNOWN is the hard one

`PENDING → IN_PROGRESS → SUCCEEDED | FAILED | UNKNOWN`. An operation in **UNKNOWN** must **not** be auto-retried. The hardest failure: the provider processed the refund, then the worker crashed before saving the result. The local DB *cannot tell* the refund happened — recovery must be explicit:

1. Mark the operation **UNKNOWN**.
2. Query the provider using its transaction reference / its own idempotency mechanism.
3. Succeeded → save the confirmed result.
4. Provider says it did not happen → retry **with the same logical identity**.
5. Still ambiguous → **escalate**, never blindly repeat an irreversible action.

Worker leases recover abandoned operations, but lease expiry does **not** prove the old worker stopped — a delayed worker may still be active.

## Architecture shape

```
Agent/LLM → Tool gateway (validate args, permissions, business rules,
          human-approval checks)
          → Idempotency coordinator (resolve key, validate fingerprint,
            block duplicate creation)
          → Durable operation store (state + result references)
          → Execution worker (propagates the same key downstream)
          → Reconciliation service (resolves UNKNOWN outcomes)
```

Strategy choices: **PostgreSQL** for durable records + uniqueness constraints (limit: a DB transaction cannot atomically include a remote API call); **Redis** for fast coordination only (expiration/failover/stale workers make it unsuitable as the sole guard for irreversible actions); **downstream API idempotency** (verify the provider's key-retention window, payload-matching behavior, repeated-request handling) for payments/orders; **transactional outbox** so a DB change and its event commit together (consumers still dedupe their own side effects); **durable workflow engines** for recovery (they do *not* guarantee a tool ran exactly once). When no reliable dedup or reconciliation exists, exactly-once side effects **cannot** be guaranteed — high-impact operations need manual review or compensating actions.

## Security considerations

- Treat **model-generated arguments as untrusted input**: strict schema validation, resource-ownership checks, business constraints, permission checks *before* execution. An idempotency key prevents *duplicates*; it does not make an *unauthorized* action legitimate. Require human approval for sensitive operations.
- **Tenant isolation**: scope records by tenant; possession of a key is not authorization — verify access to the underlying operation.
- **Protect fingerprints and results**: don't log full payloads with secrets; access controls, encryption, retention, redaction. **A changed payload under an existing key must be rejected** — silently minting a new key to bypass a conflict can create a second real-world action.
- **Monitor**: duplicate-request rates, fingerprint conflicts, unknown outcomes, operation age, downstream retries, reconciliation latency, storage growth.

## Diagram

[howto-idempotency-keys-ai-agent-tool-execution.excalidraw](howto-idempotency-keys-ai-agent-tool-execution.svg)

## Further reading

- [InfoWorld: Why an idempotency key isn't an idempotency guarantee](https://www.infoworld.com/article/4191741/why-an-idempotency-key-isnt-an-idempotency-guarantee.html) — a production case study of the exact failure this note's UNKNOWN state exists to catch: provider takes 3 s, client times out at 2 s, retry double-charges. The deeper lesson: "the system had been told that a timeout means failure." A key only helps if the provider honors it; the guarantee lives in the provider, not the header.
- [brandur.org: Implementing Stripe-like Idempotency Keys in Postgres](https://brandur.org/idempotency-keys) — reference implementation of the durable operation table + atomic claim pattern from Step 3, including the race conditions on claim acquisition.
- [DEV.to: Using Idempotency Keys for Safe AI Agent Tool Execution](https://dev.to/arthur_doss/using-idempotency-keys-for-safe-ai-agent-tool-execution-1gne) — the UNKNOWN-state handling from the agent-tool perspective: never auto-retry an UNKNOWN operation; first determine whether the external system actually completed the action.

## References

- [Using Idempotency Keys for Safe AI Agent Tool Execution — DEV.to](https://dev.to/arthur_doss/using-idempotency-keys-for-safe-ai-agent-tool-execution-1gne)
- [PostgreSQL: INSERT ... ON CONFLICT](https://www.postgresql.org/docs/current/dml-insert.html)
- [Stripe: Idempotent requests (downstream key-retention behavior)](https://docs.stripe.com/api/idempotent_requests)

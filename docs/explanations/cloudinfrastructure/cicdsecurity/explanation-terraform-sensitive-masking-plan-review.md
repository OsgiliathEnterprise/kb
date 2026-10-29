---
title: 'How a Terraform Sensitive Value Hid a DATABASE_URL Change: An ECS Task-Definition
  Post-Mortem'
diataxis: Explanation
domain: cloud-infrastructure
topic: ci-cd-security
source: DEV.to Tech News
source_url: https://dev.to/sergey_shinder_ab2d943365/one-secret-in-our-task-definition-hid-the-database-change-sitting-next-to-it-5eod
date: 2026-10-28
keywords:
- knowledge-base
- ci-cd-security
- cloud-infrastructure
- explanations
---
# How a Terraform Sensitive Value Hid a DATABASE_URL Change: An ECS Task-Definition Post-Mortem

A small, dense post-mortem: a tidy-up PR that moved shared settings into Terraform `locals` silently pointed the **order service's `DATABASE_URL`** at a read-only Postgres replica — and Terraform's **sensitivity marking made the change invisible in plan review**. Writes failed for 9 minutes. The lesson: sensitivity marking exists to hide *a* value; it also hides *every value next to it*, and a review can only approve what it is shown.

## What happened

**Setup.** An ECS task definition was built in Terraform: container definitions via `jsonencode`, with one environment variable — an API key — read from a sensitive Terraform variable.

**The PR.** A "tidy-up": move shared settings into `locals`. In doing so, the order service's `DATABASE_URL` was **copied from the reporting worker's block a few lines down** — which points at the read-only replica, not the primary.

**Why it was invisible.** `jsonencode` returns *one string*. One sensitive value inside it means **the whole string is marked sensitive**. The plan therefore showed:

```
container_definitions = (sensitive value)
```

instead of a diffable environment list. Worse, the plan *did* show a diff line — `"forces replacement"` — but that line is what **every** container-image update produces, so reviewers approved the line they always approve. The changed database host sat inside the masked blob.

**The incident.** After apply, **every write failed for ~9 minutes**: `cannot execute INSERT in a read-only transaction`. Reads were fine (the replica serves reads), which is what delayed detection. The fix was a revert + re-apply; that round-trip is where the 9 minutes went.

## Fixes that followed

1. **Keep the secret out of Terraform values entirely.** ECS task definitions have a **`secrets` field**: the container receives the value from **AWS Secrets Manager by ARN** — the Terraform value is just the ARN (not sensitive), so the container definition diff is **fully structured and diffable again**. The secret lives in Secrets Manager with its own versioning, rotation, and IAM-scoped access.
2. **Pipeline check on the plan JSON**: fail the pipeline if a **production** attribute comes back as `(sensitive value)` where it used to be diffable. Sensitivity masking that swallows a whole object is a review-integrity failure, not just a display quirk.
3. **Service-side readiness check**: refuse to be ready unless `SELECT pg_is_in_recovery() = false` — i.e., the configured Postgres is a **primary**. Turns "silent wrong-replica writes" into "fast, loud, immediate failure."

## Generalizable lessons

- **`jsonencode` + one secret = a mask over the whole object.** If you embed secrets in serialized strings (task definitions, manifests, configs), every other field in that string inherits the mask. Prefer native secret references (ECS `secrets`, SSM/Secrets Manager ARNs) so the diff stays structured.
- **A "boring" plan line is a review blind spot.** `forces replacement` on `container_definitions` was approved because it was *always* there. Diff normalization (what changed *inside* a replaced object) or CI checks that expand replaced-but-masked attributes are the structural fix.
- **Pointing at the wrong *class* of endpoint is a design smell that config should police.** "Can this service write?" should be asserted at startup, not discovered at first write.
- **Copy-paste across blocks is where drift is born.** The bug was a copy from one service's `locals` into another's; the structural fix is that shared *non-secret* settings live in one typed place, and anything that must differ (primary vs replica) is explicit per service.

## Diagram



## The limits of `sensitive` (2026-10-29 cross-check)

Two properties worth pinning down, both confirmed against 2026 Terraform guidance:

1. **Sensitivity is contagious.** Any expression that *consumes* a sensitive value produces a sensitive result — `jsonencode()`, string concatenation, interpolation, and even hashing a structure that contains it all inherit the mark. That is exactly why `env_config` above showed `(sensitive value)`: `jsonencode()` swallowed the secret and the mark propagated to the whole string.
2. **`sensitive` is display-level protection only.** It prevents the value from appearing in terminal output and plan display. It does **not** encrypt the value in the state file or the plan file — anyone with access to `terraform.tfstate` (or the plan artifact) can recover the secret. Treat the state file and plan output as containing plaintext secrets, and put them behind the same access controls you would use for a credentials store.

Practical consequence for the fix above: the `"(sensitive value)"` marker in plan JSON is a signal for *review integrity* (did masking hide a real change?), never evidence that the value was protected at rest.

## References

- [One secret in our task definition hid the database change sitting next to it — DEV.to](https://dev.to/sergey_shinder_ab2d943365/one-secret-in-our-task-definition-hid-the-database-change-sitting-next-to-it-5eod)
- [AWS: Secrets for container environment variables (ECS task-definition `secrets`)](https://docs.aws.amazon.com/AmazonECS/latest/userguide/task-definition_secrets.html)
- [Terraform: Sensitive values (plan masking behavior)](https://developer.hashicorp.com/terraform/language/values/variables#sensitive-attributes)
- [Terraform: jsonencode (why the whole string becomes sensitive)](https://developer.hashicorp.com/terraform/language/functions/jsonencode)
- [Taming Sensitive Values and Outputs in Terraform (sensitivity is contagious)](https://devopsaitoolkit.com/blog/taming-sensitive-values-and-outputs-in-terraform/)
- [How to Handle Terraform Sensitive Output Values (display-level, not encryption)](https://oneuptime.com/blog/post/2026-02-23-how-to-handle-terraform-sensitive-output-values/view)

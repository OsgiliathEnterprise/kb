---
title: 'Kapitan Multi-Environment Promotion: Class Layers, Compile Diffs, and a Stage-vs-Prod
  Drift Guard'
diataxis: How-to Guide
domain: cloud-infrastructure
topic: kubernetes
source: DEV.to Tech News
source_url: https://dev.to/kadet-hub/kubernetes-multiple-environments-with-a-diff-for-every-promotion-b3o
date: 2026-11-21
keywords:
- knowledge-base
- kubernetes
- cloud-infrastructure
- how-to
---
# Kapitan Multi-Environment Promotion: Class Layers, Compile Diffs, and a Stage-vs-Prod Drift Guard

Dev, stage, prod should run the *same app* differing in a few known values — hostname, replicas,
storage class — and in nothing else. This note builds that with one **Kapitan inventory** for three
environments on two `kind` clusters, using the `multi-env` example from
[kadet-hub/examples](https://github.com/kadet-hub/examples/tree/main/multi-env) (miniflux 2.3.4 +
PostgreSQL 18.6 via recipe 1.0.0, kubernetes generator 1.14.0; dev+stage on cluster `multienv-a`,
prod alone on `multienv-b`). The two ideas worth stealing even without Kapitan: **every promotion is
validated by a compile diff**, and **a guard script fails CI when stage drifts from prod outside an
allowlist**.

## Step 1 — Three classes per target: common, env, cluster

Each target names three classes; Kapitan merges them in order, so **env overrides `common`, cluster
overrides both**. Write `common` with prod's values so env classes stay tiny:

```yaml
# inventory/targets/prod.yml
classes: [common, env.prod, cluster.b]
parameters:
  kapitan:
    vars:
      target: prod

# inventory/classes/env/stage.yml
parameters:
  hostname: news.stage.example.com
  components:
    miniflux:
      replicas: 2

# inventory/classes/cluster/b.yml
parameters:
  cluster:
    name: multienv-b
    storage_class: local-retain
```

The differences end up declared once:

| Value | dev | stage | prod | Set in |
| --- | --- | --- | --- | --- |
| cluster | multienv-a | multienv-a | multienv-b | cluster class |
| namespace | miniflux-dev | miniflux | miniflux | `common`, dev target |
| replicas | 1 | 2 | 3 | env class |
| hostname | news.dev.example.com | news.stage.example.com | news.example.com | env class |
| storage class | standard | standard | local-retain | cluster class |

Key idioms in `common`:

- **Per-target secrets via refs:** `password: ?{base64:${kapitan.vars.target}/database-password||random:str:32}`
  — the target name in the ref path gives each environment its own random password at first compile.
- **Interpolation instead of duplication:** `BASE_URL: https://${hostname}/` and
  `storageClassName: ${cluster.storage_class}` — components don't know where the facts come from.
- **Target overrides are the exception** (dev needs `namespace: miniflux-dev` because it shares a
  cluster with stage).

`kapitan compile` writes all three environments to `compiled/{dev,stage,prod}`.

## Step 2 — Promote by editing one class per step, verified by `diff -r`

Adding `METRICS_COLLECTOR: 1` (miniflux's Prometheus endpoint) is three commits:

1. Add it to `env/dev.yml` → `diff -r` of `compiled/` before/after shows **only dev's Deployment
   changed** (the two new env lines). A CI `check` script **fails if any other target changed**.
2. Add the same lines to `env/stage.yml` → stage alone changes.
3. Add to `env/prod.yml` → prod alone changes.
4. Now that all three carry it, **move it into `common.yml`** — the diff is **empty**, proving the
   reshuffle changes nothing deployed. This "empty diff = safe refactor" property holds for any
   inventory reshuffle: compile before and after, `diff -r` prints nothing or the change.

In pull requests, the registry's [compile-diff actions](https://github.com/kadet-hub/registry/blob/main/docs/consumers.md#compile-diff-in-pull-requests)
compile base and merge commit and post the per-target difference as a PR comment.

## Step 3 — The guard: stage may not run ahead of prod

Stage only earns its cost if it runs what prod will run. A small Python script compares two compiled
directories object-by-object (matched by kind + name, field-by-field); **every differing field must
be listed in `guard-allowed.txt`**:

```
Deployment/miniflux spec.replicas
Deployment/miniflux spec.template.spec.containers[miniflux].env[BASE_URL].value
StatefulSet/miniflux-db spec.volumeClaimTemplates[miniflux-db].spec.storageClassName
```

List items are addressed by `name`, so reordered env vars don't count as drift; ref tokens compare
equal across targets. CI runs it right after compile, **without `--reveal`** (secrets stay as refs):

```bash
python3 guard compiled/stage compiled/prod guard-allowed.txt
```

Mid-promotion (setting added to stage but not yet prod) it exits 1 with `NOT ALLOWED` lines naming
the exact fields — a half-finished promotion cannot merge. When a team *wants* stage ahead for a
while, they add the field to `guard-allowed.txt` and that line shows up in code review: intentional
drift becomes visible, accidental drift fails the build.

## Step 4 — Deploy verification on two kind clusters

The `check` script deploys all three targets to two `kind` clusters with `kubectl apply` (an Argo CD
`Application` per target, destination from the cluster class, is the GitOps equivalent). Notable
gotcha from the article: the app needs a **readiness probe** (`type: http`, `path: /healthcheck`)
added in `common` beyond what the recipe ships — ready means the HTTP server is up *after* DB
migrations, not just that the container started. Supply-chain hygiene: `check` verifies the recipe
and generator against kadet-hub's **signed index and attestations** and pulls by **digest**,
avoiding `kapitan compile --fetch`.

Run it yourself (needs kind, kubectl, oras, uv, jq, curl, Docker, gh):

```bash
git clone https://github.com/kadet-hub/examples
cd examples/multi-env && ./check
```

## References

- [Original article (dev.to, kadet-hub)](https://dev.to/kadet-hub/kubernetes-multiple-environments-with-a-diff-for-every-promotion-b3o)
- [kadet-hub/examples multi-env](https://github.com/kadet-hub/examples/tree/main/multi-env)
- [Kapitan](https://kapitan.dev/)
- [compile-diff actions for PRs](https://github.com/kadet-hub/registry/blob/main/docs/consumers.md#compile-diff-in-pull-requests)
- [Supply-chain security for Kapitan generators](https://kadet-hub.org/guides/supply-chain-security-for-kapitan-generators/)

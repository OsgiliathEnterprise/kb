---
title: How to Run GitOps with Helm, Kustomize, and Argo CD
diataxis: How-to Guide
domain: cloud-infrastructure
topic: kubernetes
source: DEV.to Tech News
source_url: https://dev.to/manojkagitha/gitops-in-practice-helm-kustomize-and-argo-cd-1oma
date: 2026-11-27
keywords:
- knowledge-base
- kubernetes
- cloud-infrastructure
- how-to
---
# How to Run GitOps with Helm, Kustomize, and Argo CD

**Input:** app code repo + a separate config repo (Helm charts, Kustomize overlays, Argo CD Application manifests), a running cluster with Argo CD.
**Output:** a cluster that continuously matches Git; rollbacks become `git revert`.

## Core principle: pull model, not push

Git is the source of truth for desired state; a controller **inside** the cluster pulls it. Unlike a CI job running `kubectl apply` from outside (push, fire-and-forget), Argo CD reads the repo on a schedule and syncs whenever Git and the live cluster differ. Nothing deploys without a commit — every change is reviewable like code, with full history.

## Step 1 — Package with Helm (when you need templating)

A chart = templates + values files. One chart serves many environments; only values change:

```yaml
# values.yaml
replicaCount: 2
image:
  repository: my-registry/orders-api
  tag: "1.4.2"
resources:
  requests: {cpu: 200m, memory: 256Mi}
```

```bash
helm upgrade --install orders-api ./charts/orders-api \
  --namespace orders \
  --values charts/orders-api/values.yaml \
  --values charts/orders-api/values-prod.yaml
```

Rule of thumb: if a value is used once, hardcode it in the template; if it changes per environment, put it in values.

## Step 2 — Patch with Kustomize (when you already have plain YAML)

Base holds common manifests; each overlay changes only the delta. Built into kubectl (`kubectl kustomize overlays/prod`), plain YAML, easy to review:

```yaml
# overlays/prod/kustomization.yaml
resources:
  - ../../base
images:
  - name: my-registry/orders-api
    newTag: "1.4.2"
patches:
  - target: {kind: Deployment, name: orders-api}
    patch: |-
      - op: replace
        path: /spec/replicas
        value: 3
```

Helm and Kustomize are not rivals — pick whichever keeps the diff small and the review clear. Argo CD supports both.

## Step 3 — Close the loop with Argo CD

One `Application` per app per environment. The three sync settings that make it a true pull loop:

```yaml
# argocd/orders-api-prod.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: orders-api-prod
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/example-org/gitops-config.git
    targetRevision: main
    path: apps/orders-api/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: orders
  syncPolicy:
    automated: {prune: true, selfHeal: true}
```

- `automated`: apply without a human clicking Sync
- `prune`: delete resources removed from Git
- `selfHeal`: revert hand edits made in the cluster (drift)

## Step 4 — Promote the same image, never rebuild

Build once per commit, tag with commit SHA or version, promote dev → staging → prod. Only the tag in the config repo changes between environments. Never use `latest` — it moves under you and breaks traceability.

## Step 5 — Keep secrets out of Git

Two workable patterns, pick one and use it everywhere:

- **Sealed Secrets**: commit an encrypted `SealedSecret`; only the in-cluster controller decrypts.
- **External Secrets**: commit a pointer; the controller fetches the value from Vault/cloud secret manager at runtime:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: orders-api-secrets
spec:
  secretStoreRef: {name: vault-store, kind: SecretStore}
  target: {name: orders-api-secrets}
  data:
    - secretKey: db-password
      remoteRef: {key: orders-api/db-password}
```

Passwords, tokens, keys never go into a commit in plain text. Rotate on a schedule.

## Step 6 — Roll back with git revert

A rollback in GitOps is just a reviewed revert that Argo CD re-syncs:

```bash
git log --oneline -10 -- apps/orders-api/overlays/prod
git revert <bad-commit-sha>
git push origin main
```

Hand edits during incidents are allowed, but must be followed by a Git change; turn on drift alerts.

## Repo layout that scales

```
gitops-config/
  apps/orders-api/base/deployment.yaml
  apps/orders-api/overlays/prod/kustomization.yaml
  argocd/orders-api-prod.yaml
```

Start with one app + one environment; get commit → sync → verify working before adding staging, prod, and more apps.

## Checklist (all ten, or fix the missing one)

1. Git holds desired state; nothing deploys without a commit
2. Argo CD watches the config repo, one Application per app per env
3. Automated sync, prune, self-heal on
4. Helm or Kustomize keeps per-env diffs small
5. Same image tag promoted across environments, no rebuilds
6. Fixed tags / commit SHAs, never `latest`
7. Secrets in a vault or sealed, never plain text in Git
8. Rollback = Git revert, rehearsed once in a safe env
9. Drift alerts + follow-up Git change after hand edits
10. Repo layout findable in a minute

## Related notes

- `howto-argocd-git-to-live-sync-verification.md` — verifying Git-to-live drift for an existing Argo CD setup
- `../../security-privacy/cloud-devsecops/howto-enforce-cloud-change-management-everything-as-code.md`

## References

- [GitOps in Practice: Helm, Kustomize, and Argo CD (DEV.to)](https://dev.to/manojkagitha/gitops-in-practice-helm-kustomize-and-argo-cd-1oma)
- [Argo CD application specification](https://argo-cd.readthedocs.io/en/stable/operator-manual/application_specification/)
- [External Secrets Operator docs](https://external-secrets.io/)

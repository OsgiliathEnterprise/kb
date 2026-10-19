---
title: 'Kubernetes Control-Plane Scale: Three Failure Modes, Four Seams, and the Missing
  Assembly Instructions'
diataxis: Explanation
domain: cloud-infrastructure
topic: kubernetes
source: TheNewStack
source_url: https://thenewstack.io/scaling-kubernetes-control-planes/
date: 2026-10-19
keywords:
- knowledge-base
- kubernetes
- cloud-infrastructure
- explanations
---
# Kubernetes Control-Plane Scale: Three Failure Modes, Four Seams, and the Missing Assembly Instructions

"Scale" is not one number. Asking how big a control plane needs to be usually gets an answer in nodes — which is exactly how clusters end up tuned for a problem they don't have. This note (from Joe Betz / CNCF) reframes control-plane capacity as **three independent axes**, each with a fixable architectural **seam**, and lays out a **recipe ladder** where every rung is stock upstream binaries shipped as CI-tested configuration.

## The premise: three clusters in trouble, three different directions

1. **Training fleet**: sat at a few thousand nodes for months, then a new run landed and it's at fifteen thousand. Kube-apiserver starts eating memory, etcd starts complaining. → *node-bound*
2. **Agent platform**: never passes a few thousand nodes, but its objects are *alive* — sessions created, suspended, resumed, and destroyed thousands of times a minute, every transition a write. → *churn-bound*
3. **Platform cluster**: neither big nor fast — two hundred operators installed, tens of thousands of objects that mostly just sit there, and every apiserver holds a copy of all of them. → *state-bound*

Two of those are AI workloads and one isn't — the least interesting part. They're running out of room in three different directions, and **fixing one does nothing for the others**.

## The three failure modes

### Node-bound

Training and RL fleets: large, homogeneous, and the pressure is every kubelet reporting in. At **100,000 nodes with a 10-second heartbeat**, liveness alone generates **~10,000 writes per second**, and in measurements **lease renewals were roughly 70% of write QPS**. Most of what that control plane does is nodes politely saying "still here," forever.

### Churn-bound

Agent platforms: modest size, very intense day. Systems that pack many agent sessions onto a smaller pool of worker pods express each actor's lifecycle as a custom resource — so the busiest, shortest-lived objects are CRDs, and the **write rate has nothing to do with how many machines you own**.

### State-bound

Platform clusters: many kinds, many objects, most of them asleep. The cost isn't writes — it's **resident bytes multiplied by every apiserver holding them**. This is the axis where the "add an apiserver" reflex actively hurts, because every apiserver you add replicates the entire watch cache. You bought request capacity and paid for it in memory you didn't have.

The three axes are **independent**: you can max any one with the other two on the floor. A recipe that only knows node count will happily tune the wrong thing.

## Seams and recipes

- **Seams** are the places where you can take Kubernetes apart: a contract between two components, usually at a network boundary, and *substitutable* — so you can replace what's behind it without patching upstream. (Think of a tailor's seams: take it in at the waist, let out the shoulders, still the same jacket. Cut somewhere that isn't a seam and you've made a very expensive rag.)
- **Recipes** are scale-tested configurations built around those seams: executable configs that pass their scale test or fail it, with CI telling you the day they stop being true.

Clusters well past 5,000 nodes run in production today on stock upstream components. Nobody got there with a magic fork; they got there by being deliberate about what each store holds. *The scale isn't the hard part. The assembly instructions are missing.*

## The four seams

### Seam 1 — the storage contract (_which store holds which resource types; relieves churn_)

Not all cluster state deserves the same durability guarantees. Events and node leases are ephemeral; leader-election leases are ephemeral and chatty; none need the same durable, Raft-replicated store as your Deployments. A general-purpose consistent store shouldn't absorb traffic when no business is durable.

- [KEP-4743](https://github.com/kubernetes/enhancements/issues/4743) defines the storage-interface boundary, and **`-etcd-servers-overrides`** routes resource types to different backends today.
- **Gap**: `-etcd-servers-overrides` only knows about built-in resources, so a churn-bound platform can't route the very custom resources generating its write storm. Per-CRD storage configuration has no KEP yet — watch for the enhancement; use cases will shape it.

### Seam 2 — the node liveness contract (_how liveness reaches the control plane; relieves node count_)

Two fixes for the heartbeat load, and they compose:

1. **Absorb it**: a node-facing tier in front of the control plane handles renewals and propagates only real state transitions.
2. **Make it cheaper**: route renewals through etcd's **in-memory lease refresh** instead of a full Raft commit. That one lands in etcd itself, so it helps every cluster — down to the three-node one.

### Seam 3 — the shard axis (_the field that controllers, caches, and stores agree to shard on; relieves all three_)

Horizontal scaling means every layer agrees on how objects are divided. Pick the wrong axis and your controller spends its life reaching for objects in someone else's shard.

- [KEP-5866](https://github.com/kubernetes/enhancements/issues/5866) introduces **hash-range filtering for API traffic** — the foundation. It shipped as an **alpha in Kubernetes 1.37**: clients can request a filtered shard of objects from the API server using hash-based partitioning on metadata fields ([Kubernetes API concepts](https://kubernetes.io/docs/reference/using-api/api-concepts/)).
- Coordination, resharding, and sharding the controller manager are **out of scope** — and all three still need work.

### Seam 4 — cache residency (_what an apiserver actually keeps in memory; relieves state_)

The apiserver that replicates the whole watch cache is this seam, and the state-bound cluster's entire problem. One that only ever talks to the scheduler doesn't need every object resident; a **two-shard prototype cuts heap by roughly half per shard**.

- **There's a floor**: with every disableable cache off, an apiserver still carries **~0.9 KB per RBAC object**, because the authorizer's informers hold them regardless.
- **Gap**: residency doesn't exist upstream yet. KEP-5866 filters egress, so the cache still stores everything. Prototype branches and a draft KEP update are up for review.

## The recipe ladder

Every rung is stock upstream binaries + CI-tested configuration, so a release that changes the calculus shows up as a test failure first.

| Recipe | Scale | Composition | Seams | Evidence |
| --- | --- | --- | --- | --- |
| **Classic HA** | up to 5k nodes | 2–3 identical control planes | none | measured |
| **Role-Split** | 5k–20k | separate machine pools for API serving, scheduler, KCM, etcd | 4 | shipped, benefit not yet measured |
| **Node Plane** | 20k–65k | Role-Split plus a node-facing tier that absorbs the leases | 1, 2 | measured (n=1) |
| **Partitioned Store** | ~100k | Node Plane plus resource types split across independent stores | 1 on top of 2 | externally demonstrated |
| **Sharded Slice** | beyond | K shard units, each a controller + apiserver pinned to a hash range | 3, 4 | doesn't exist yet |

The last row is on the ladder *on purpose*: publishing the rung nobody has built is how it stays useful.

**The bigger gap is the index.** You pick a rung by node count — the one axis of three with measurements behind it. Nobody, CNCF included, has published a scale-tested recipe for a churn-bound or state-bound cluster.

## Where you can push (contribution points)

- **Per-CRD storage configuration** (Seam 1): no KEP yet, so use cases will shape it. If your hot objects are custom resources, bring your write rates to **SIG API Machinery** — numbers off a real churn-bound cluster are the most useful thing anyone could contribute.
- **KEP-5866 and the residency extension** (Seams 3–4): prototype branches are up for review; the design is not settled.
- **Recipes nobody has published**: above 20,000 nodes, or serious churn, or a cluster that's simply heavy — if you have a scale-tested config, publish it.

## Practical takeaways

1. **Diagnose the axis before scaling**: node-bound (lease-driven write QPS), churn-bound (CRD write rate), state-bound (resident memory). A recipe keyed only on node count tunes the wrong thing.
2. **"Add apiservers" is the wrong default** for state-bound clusters — you pay watch-cache memory per replica.
3. **Plan by recipe rung, not node count**: Classic HA → Role-Split → Node Plane → Partitioned Store → Sharded Slice, each with known evidence levels.
4. **Everything above is stock upstream** — no vendor lock-in, no custom controllers, no magic fork.

Related: [Kubeflow on EKS](../../../how-to/cloudinfrastructure/kubernetes/howto-install-kubeflow-for-ml-on-eks.md) (m5.xlarge node floor for control-plane components), [Securing Kubernetes for AI Agent Workloads](explanation-securing-kubernetes-ai-agent-workloads.md) (agent platforms are exactly the churn-bound case).

## Diagram

[explanation-k8s-control-plane-scale-failure-modes.excalidraw](explanation-k8s-control-plane-scale-failure-modes.svg) — the three failure modes, the four seams, and how each seam relieves which axis.

## References

- [Scale isn't one number: three ways a Kubernetes control plane runs out of room](https://thenewstack.io/scaling-kubernetes-control-planes/) — Joe Betz (CNCF), TheNewStack, Oct 18, 2026
- [KEP-4743 — storage interface boundary](https://github.com/kubernetes/enhancements/issues/4743)
- [KEP-5866 — hash-range filtering for API traffic](https://github.com/kubernetes/enhancements/issues/5866)
- [Kubernetes 1.37 API concepts — alpha filtered-shard requests](https://kubernetes.io/docs/reference/using-api/api-concepts/)

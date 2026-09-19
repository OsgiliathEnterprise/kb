---
title: Building Kubernetes Operators with OCaml (ocaml-kube)
diataxis: How-to Guide
domain: cloud-infrastructure
topic: Kubernetes-Operators
source: DEV.to Tech News
source_url: https://dev.to/thevilledev/building-kubernetes-operators-with-ocaml-1n1j
date: 2026-09-19
keywords:
- knowledge-base
- Kubernetes-Operators
- cloud-infrastructure
- how-to
---
# Building Kubernetes Operators with OCaml (ocaml-kube)

`ocaml-kube` is a **Kubernetes client and controller library for OCaml**, published on opam as `kube`. It lets you build operators following the familiar [Kubebuilder](https://book.kubebuilder.io/quick-start) workflow — scaffold a project, define an API, generate the CRD, implement reconciliation, run against a cluster — but in native OCaml 5 rather than Go.

## The library and Kubernetes support

- `kube.0.1.3` supports **Kubernetes 1.34, 1.35, 1.36, 1.37** (integration-tested against real API servers). Older clusters may work through the generic client but aren't supported; the range doesn't imply coverage of every alpha feature.
- It's a **native OCaml 5 implementation**, not a binding to Go's `client-go`. The HTTP/1.1 transport uses Unix sockets + the OCaml TLS library. Watches and controller workers run on system threads with cooperative cancellation.
- Built-in resource records and JSON codecs are **generated from checksum-pinned Kubernetes OpenAPI schemas**. Each minor has a separate schema library (`kube.api.v1_34` … `kube.api.v1_37`) sharing the same runtime. The tutorials use `Kube_api_v1_36` for 1.36 resource types — that doesn't restrict operators to a 1.36 cluster.
- Above the client sit **LIST/WATCH caches, a work queue, and retries**. `Kube.Operator` handles process startup, credentials, shutdown, diagnostics, and optional leader election. Application code describes *what should exist*.

## Same pattern, different language

An operator watches Kubernetes resources and repeatedly brings actual state toward the desired state in `spec`. Changing the language doesn't change that contract — the interesting part is how OCaml expresses it:
- **Records** describe the API.
- A **PPX deriver** generates JSON codecs and schemas.
- **Module functors** build clients and controllers for a particular resource type.

```ocaml
module Controller = Kube.Controller.Make (Custom_resource)
module Config_maps =
  Kube.Reconcile.Make (Kube_api_v1_36.Core_v1.ConfigMap)
```

## From scaffold to CRD

With OCaml 5.1+ and opam installed:

```bash
opam install kube.0.1.3

opam exec -- ocaml-kube init \
  --output greeting-operator \
  --group tutorial.ocaml.dev \
  --version v1alpha1 \
  --kind Greeting
```

This covers the project-and-first-API setup normally split between `kubebuilder init` and `kubebuilder create api`. Here `--group` takes the full API group. The generated project includes a model, controller skeleton, CRD, RBAC, sample resource, Deployment, and Dockerfile — the reconciler still needs application logic.

In the completed Greeting tutorial, the desired state is one field:

```ocaml
module C = Kube_crd

module Spec = struct
  type t = {
    message : string;
        [@kube.schema C.Schema.string ~min_length:1 ~max_length:200 ()]
  }
  [@@deriving kube]
end
```

Those attributes become validation in the CRD. `Kube_crd.Resource.Make` combines spec, status, and resource identity into the typed resource module. After editing the model, generate the manifest from inside the project:

```bash
opam exec -- dune exec tools/generate_crd.exe > deploy/crd.yaml
opam exec -- dune build @codegen-check
```

That's the equivalent of `make manifests`. The second command catches a checked-in CRD that no longer matches the OCaml model.

## Three tutorials (each an independent Dune project with walkthrough, tests, deployment files)

- **Greeting** — writes `spec.message` into a ConfigMap. Introduces Server-Side Apply, owner references, and a `Ready` status condition.
- **WebApp** — manages a Deployment and Service; watches both child kinds and reports the Deployment's ready replica count.
- **Project** — cluster-scoped; manages a Namespace and ResourceQuota. A finalizer keeps the Project around until Namespace deletion completes.

The Greeting child write is small:

```ocaml
Config_maps.apply_owned ~cancel:request.cancel client
  ~field_manager:"greeting-operator"
  ~owner_api:Custom_resource.api
  ~owner:greeting.metadata
  (desired_config_map greeting)
```

## Running against a cluster

The smoke test stops the controllers and deletes the sample resources but leaves the cluster available. When finished:

```bash
kind delete cluster --name ocaml-kube-examples
```

These are small examples for learning the API and controller patterns; for complete commands (container builds, in-cluster deployment) start with the repository README.

## Diagram

![[ocaml-kube-architecture.excalidraw]]

## References
- [Building Kubernetes operators with OCaml (DEV.to / thevilledev)](https://dev.to/thevilledev/building-kubernetes-operators-with-ocaml-1n1j)
- [ocaml-kube repository](https://github.com/thevilledev/ocaml-kube)
- [kube-ocaml-examples (three operator tutorials)](https://github.com/thevilledev/kube-ocaml-examples)

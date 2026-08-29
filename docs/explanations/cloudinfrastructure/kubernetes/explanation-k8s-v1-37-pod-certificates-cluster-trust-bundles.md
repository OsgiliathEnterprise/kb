---
title: Kubernetes v1.37 Pod Certificates and Cluster Trust Bundles
diataxis: Explanation
domain: cloud-infrastructure
topic: kubernetes
source: kubernetes io
source_url: https://kubernetes.io/blog/2026/08/28/kubernetes-v1-37-pod-certificates-and-cluster-trust-bundles/
date: 2026-08-29
keywords:
- knowledge-base
- kubernetes
- cloud-infrastructure
- explanations
---
# Kubernetes v1.37 Pod Certificates and Cluster Trust Bundles

Kubernetes 1.37 makes the foundations of a new built-in production-identity technology GA: **Pod Certificates** (and the closely associated **Cluster Trust Bundles**) build X.509 certificate issuance for TLS/mTLS directly into core Kubernetes, alongside service account JWTs. The APIs (`PodCertificateRequest`, `ClusterTrustBundle` under `certificates.k8s.io/v1beta1`) are in place; no signer ships in core yet — you install a third-party one (e.g. [Tinycert](https://github.com/ahmedtd/tinycert)).

## Why: the bearer-token problem with service account JWTs

Service account JWTs are built into kubelet, least-privilege issued (the node restriction admission plugin ensures only the kubelet actually running your pod can request tokens), and widely federated to cloud providers. But they are **bearer tokens**: whoever holds a copy *is* the identity. You must hand copies to every peer you authenticate with — so any of them can impersonate you. Time-, object-, and audience-binding mitigate but never fully fix this.

Pod Certificates switch to **proof-of-possession credentials** built on asymmetric signatures: your credential splits into a private key (generated inside the workload, ideally in an HSM, never leaves) and a certificate signed by a CA. In TLS terms you prove possession without ever transmitting the secret itself. Unlike JWTs (one flavor, standardized claims), X.509 is varied — so Pod Certificates keeps common machinery in kubelet but exposes a **pluggable signer interface**, letting many certificate types coexist in one cluster. Expected built-in signers eventually: server-TLS certs for Kubernetes service DNS names, and SPIFFE client certificates as the JWT replacement.

## Architecture

Three components: your application (requests certs in its pod spec, reads keys/certs/trust bundles from the container filesystem), kubelet (issues `PodCertificateRequest` objects, reads `ClusterTrustBundle` objects on the workload's behalf), and a signer controller (answers requests, publishes trust bundles).

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "pc1",
      "type": "rectangle",
      "x": 60,
      "y": 80,
      "width": 240,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Application pod\nrequests certs in spec,\nreads files from fs",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "pc2",
      "type": "rectangle",
      "x": 380,
      "y": 60,
      "width": 280,
      "height": 140,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Kubelet\ngenerates private key (keyType),\ncreates PodCertificateRequest,\nwrites credential bundle files",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "pc3",
      "type": "rectangle",
      "x": 740,
      "y": 60,
      "width": 280,
      "height": 140,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Signer controller\nissues status.certificateChain,\nsets status.beginRefreshAt,\npublishes ClusterTrustBundles",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "pc4",
      "type": "rectangle",
      "x": 380,
      "y": 260,
      "width": 280,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c9e7c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "ClusterTrustBundle\ntrust anchors unified +\nstably reordered on disk",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "pc5",
        "type": "arrow",
        "x": 300,
        "y": 120,
        "width": 80,
        "height": 40,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            80,
            -40
          ]
        ]
      }
    ],
    [
      {
        "id": "pc6",
        "type": "arrow",
        "x": 660,
        "y": 130,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            80,
            0
          ]
        ]
      }
    ],
    [
      {
        "id": "pc7",
        "type": "arrow",
        "x": 520,
        "y": 260,
        "width": 0,
        "height": 80,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            0,
            -80
          ]
        ]
      }
    ],
    [
      {
        "id": "pc8",
        "type": "arrow",
        "x": 380,
        "y": 310,
        "width": 260,
        "height": 90,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [
          [
            0,
            0
          ],
          [
            -260,
            -90
          ]
        ]
      }
    ]
  ]
}
```

## Issuance flow (chronological)

1. Pod scheduled; kubelet finds `podCertificate` and `clusterTrustBundle` projected volume sources in the spec.
2. Per `podCertificate` source: kubelet generates a private key per the `keyType` field, creates a `PodCertificateRequest` addressed to the named signer; the controller decides whether to issue, fills `status.certificateChain`, and sets `status.beginRefreshAt`; kubelet writes key + chain to the container filesystem.
3. Per `clusterTrustBundle` source: kubelet collects all matching bundles (by name/label selectors), unifies their certificates with a **stable reorder** so apps cannot depend on ordering, and writes them to the configured path.
4. The app reads keys/certs/trust anchors from the filesystem; kubelet keeps updating files as bundles change — the application must pick up changes via inotify or polling.
5. As each `beginRefreshAt` passes, kubelet repeats step 2 (new key + chain written to disk).

## Key takeaways for operators and app developers

- **Automatic rotation is built in — apps must handle it.** Core signers will issue certs with a max lifetime of **24 hours**; other signers may go up to **91 days**.
- **Credential bundle**: kubelet can write private key + chain into a *single file* so the app subscribes to one inotify event instead of racing two files mid-rotation. Separate-file mode is supported but shifts race-condition handling onto you.
- **Security checks live in kube-apiserver, not your signer** — e.g. the node restriction admission plugin enforces node isolation (a compromised node cannot request certs for pods it does not run).
- **Try it**: install [Tinycert](https://github.com/ahmedtd/tinycert) into a Kind cluster. It ships two signers (`tinycert-service` — DNS-SAN server certs for the pod's services; `tinycert-spiffe` — SPIFFE client certs identifying namespace + service account), a Go library (`lib/spiffefsd`) for loading SPIFFE Filesystem Delivery folders, and an mTLS client/server example.
- **Next steps**: review the [Pod Certificates](https://kubernetes.io/docs/reference/access-authn-authz/certificate-signing-requests/#pod-certificate-requests) and [Cluster Trust Bundles](https://kubernetes.io/docs/reference/access-authn-authz/certificate-signing-requests/#cluster-trust-bundles) docs, give feedback on the [SPIFFE Filesystem Delivery draft standard](https://github.com/spiffe/spiffe/pull/376), or build your own signer on Tinycert.

## References

- [Kubernetes v1.37: Pod Certificates and Cluster Trust Bundles (kubernetes.io)](https://kubernetes.io/blog/2026/08/28/kubernetes-v1-37-pod-certificates-and-cluster-trust-bundles/)
- [Tinycert — toy Pod Certificate signer for experimenting](https://github.com/ahmedtd/tinycert)
- [PodCertificateRequest API reference (certificates.k8s.io/v1beta1)](https://kubespec.dev/kubernetes/certificates.k8s.io/v1beta1/PodCertificateRequest)
- [ClusterTrustBundle API reference](https://kubespec.dev/kubernetes/certificates.k8s.io/v1beta1/ClusterTrustBundle)

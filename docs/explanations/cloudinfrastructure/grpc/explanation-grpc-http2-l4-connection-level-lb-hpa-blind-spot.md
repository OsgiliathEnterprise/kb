---
title: Why Scaling Kubernetes Pods Doesn't Fix gRPC Timeouts — Connection-Level vs
  Request-Level Load Balancing
diataxis: Explanation
domain: cloud-infrastructure
topic: grpc
source: DEV.to Tech News
source_url: https://dev.to/vietsory/why-scaling-kubernetes-pods-doesnt-fix-grpc-timeouts-a-hidden-load-balancing-problem-1d7h
date: 2026-11-17
keywords:
- knowledge-base
- grpc
- cloud-infrastructure
- explanations
---
# Why Scaling Kubernetes Pods Doesn't Fix gRPC Timeouts — Connection-Level vs Request-Level Load Balancing

A production-style incident scenario (simulated metrics, real mechanics) that exposes an architectural blind spot: **HPA increases capacity, but it does not redistribute existing connections**. Every component behaves exactly as designed, yet the system still times out.

![[explanation-grpc-http2-l4-connection-level-lb-hpa-blind-spot.excalidraw]]

## The scenario

An e-commerce microservice stack: API Gateway (2 pods) calls Order Service over **gRPC / HTTP/2** through a `ClusterIP` Service on TCP 50051. kube-proxy runs in **iptables mode**. HPA target: 60% CPU, min 3 / max 10 replicas. The Gateway reuses **long-lived gRPC channels** — a handful of TCP connections carry thousands of RPCs via HTTP/2 multiplexing.

When a promo pushes traffic from 1,200 to 5,000 RPC/s:

| Metric | Normal | Incident |
|---|---|---|
| Incoming RPC rate | 1,200 RPS | 5,000 RPS |
| Replicas (Ready) | 3/3 | 10/10 |
| P99 latency | 160 ms | 2,600 ms |
| `DEADLINE_EXCEEDED` rate | ~0% | 4.1% |
| Highest pod CPU | 55% | 96% |

Per-pod distribution at one instant: Pod A 3,400 RPS (68%), Pod B 1,300, Pod C 260 — while the **7 new pods combined received ~40 RPS (0.8%)**.

## Why the new pods stayed idle

The troubleshooting sequence rules out the usual suspects first:

```
kubectl get deployment order-service        # 10/10 READY, no CrashLoopBackOff/OOMKilled
kubectl describe hpa order-service          # scaled 3 -> 10, avg CPU now below target
kubectl get endpointslices -l kubernetes.io/service-name=order-service -o yaml
                                            # all 10 pod IPs present, ready: true
kubectl top pods -l app=order-service       # huge per-pod skew visible
ss -tn | grep ':50051'                       # (inside gateway netns) few long-lived TCP conns
```

PromQL to expose the skew (requires `grpc_server_started_total` with a `pod` label):

```promql
sum by (pod) (rate(grpc_server_started_total{job="order-service"}[2m]))
```

The root cause sits at the seam between two layers:

1. **gRPC/HTTP/2 multiplexing**: thousands of RPCs share a few TCP connections (streams 1..N over one connection).
2. **Kubernetes Service is a Layer-4 balancer**: kube-proxy's iptables rules DNAT **per TCP connection**, and Linux **conntrack** pins every subsequent packet of that connection to the same backend. The Service never parses HTTP/2 frames.

So once Connection 1 was DNAT'ed to Pod A before scaling, all RPCs multiplexed onto it keep flowing to Pod A. New endpoints only get traffic from *new* connections — and long-lived channels rarely create any.

Per-pod load is the sum of the RPC rates of the connections pinned to it:

```
RPS_i = Σ_{c ∈ C_i} λ_c        (C_i = connections mapped to pod i, λ_c = RPC/s on connection c)
RPS_A = 1800 + 1600 = 3400     vs ideal 5000/10 = 500  → Pod A carries 6.8× the ideal share
```

**Equal connections ≠ equal requests ≠ equal workload.**

## Why HPA can't fix it (and may even scale down)

HPA computes `DesiredReplicas = ⌈CurrentReplicas × CurrentUtil / TargetUtil⌉` — e.g. `⌈3 × 200%/60%⌉ = 10`. But it acts on the **average**: with 2 hot pods at 95% and 8 idle pods at 5%, average CPU = 23%, below the 60% target. The metric average masks the skew, so HPA stops scaling out — or proposes scale-down after the stabilization window. HPA is doing its job correctly; it simply has no visibility into connection-to-backend mapping.

Timeouts then come from both sides: server-side queueing on the overloaded pods, plus client-side waiting when a connection hits its HTTP/2 concurrent-stream limit — surfacing as `DEADLINE_EXCEEDED` even though all pods are Ready and the cluster has spare capacity.

## Fixes

### Option 1 — gRPC client-side load balancing (headless Service + `round_robin`)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: order-service-headless
spec:
  clusterIP: None          # DNS returns all pod IPs instead of one ClusterIP
  selector:
    app: order-service
  ports:
    - name: grpc
      port: 50051
      targetPort: 50051
```

```json
{ "loadBalancingConfig": [ { "round_robin": {} } ] }
```

The gRPC client resolves the headless Service via DNS to the pod IP list and rotates backends **per RPC**. In Python this is e.g. `("grpc.lb_policy_name", "round_robin")` on the channel (see [[howto-client-side-load-balancing-name-resolver]] and [[howto-deploy-grpc-server-kubernetes]]). Caveats: the headless Service alone does **not** enable round-robin — the client must set the policy; endpoint refresh, DNS TTLs, TLS identity and reconnect behaviour are implementation-specific; and round-robin still skews if RPC costs differ.

### Option 2 — Layer-7, gRPC-aware proxy (Envoy, service mesh)

An Envoy sidecar/gateway understands HTTP/2 and selects an upstream **per RPC**, so calls arriving on one client connection fan out across pods. Streaming RPCs remain pinned to the backend handling that stream (inherent). Adds a proxy hop and its operational cost, but requires no client changes — the default answer when you cannot control the gRPC clients (see [[explanation-http-json-transcoding-grpc-istio-envoy]]).

### Operational mitigations

Connection max-age / idle settings on gRPC servers (`max_connection_age` + jitter) force periodic re-dial so long-lived connections eventually rebalance; readiness-gated rollout of new replicas; alert on **per-pod** RPC skew, not just cluster averages.

## Key takeaways

- Kubernetes `ClusterIP` Services balance **connections**, not requests; gRPC packs requests into few long-lived connections — the two compose badly.
- Autoscaling adds capacity; only request-level balancing (client-side or L7 proxy) distributes work onto it.
- Watch per-pod RPC rate skew; averages hide the failure mode.

## References

- Original article (VietSory, DEV.to): [Why Scaling Kubernetes Pods Doesn't Fix gRPC Timeouts](https://dev.to/vietsory/why-scaling-kubernetes-pods-doesnt-fix-grpc-timeouts-a-hidden-load-balancing-problem-1d7h)
- gRPC client-side LB mechanics: [Stack Overflow — How does gRPC connection work on Kubernetes ClusterIP](https://stackoverflow.com/questions/71272772/how-does-grpc-connection-work-on-kubernetes-service-clusterip)
- Headless service + round_robin channel options: [gRPC Reliability Patterns](https://zakhassan.com/blog/grpc-reliability-patterns-load-balancing-observability-and-error-handling-at-scale)

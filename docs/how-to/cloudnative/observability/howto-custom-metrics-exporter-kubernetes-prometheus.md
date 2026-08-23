---
title: Building a Custom Metrics Exporter for Kubernetes with Prometheus
diataxis: How-to Guide
domain: Cloud-Native
topic: Observability
source: Kubernetes Blog
source_url: https://kubernetes.io/blog/2026/07/14/custom-metrics-exporter-kubernetes/
date: 2026-07-27
keywords:
- knowledge-base
- Observability
- Cloud-Native
- how-to
---
# Building a Custom Metrics Exporter for Kubernetes with Prometheus

## Overview

Kubernetes ships with built-in awareness of CPU and memory, but most real-world scaling decisions depend on signals outside that narrow window: queue depth, batch job duration, active WebSocket connections. A metrics exporter bridges that gap — a lightweight HTTP server that exposes application state as plain text on a `/metrics` endpoint that Prometheus scrapes at regular intervals, stores as time-series data, and makes available for queries, alerts, and autoscaling rules.

## When to Use a Standalone Exporter vs. Embedded Instrumentation

| Approach | When to Use |
|----------|-------------|
| Standalone exporter | Data source is external to your application, or you don't control the application code |
| Embedded instrumentation | You can embed the Prometheus client library directly in your application |

## Prometheus Metric Types

| Type | Description | Example Use Case |
|---|---|---|
| **Counter** | Monotonically increasing values (only ever increase) | Total requests served, errors encountered |
| **Gauge** | Values that rise and fall (current snapshot) | Queue depth, active connections, cache size |
| **Histogram** | Distribution of observed values | Request latency percentiles (p50, p99) |

**Naming convention**: `<namespace>_<name>_<unit>` in `snake_case`. Example: `worker_jobs_processed_total`, `worker_queue_depth`, `worker_job_duration_seconds`.

## Building the Exporter in Go

### Step 1: Project Setup

```bash
mkdir my-exporter && cd my-exporter
go mod init example.com/my-exporter
go get github.com/prometheus/client_golang/prometheus
go get github.com/prometheus/client_golang/prometheus/promhttp
```

### Step 2: Register Metrics

```go
package main

import (
    "log"
    "net/http"

    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    jobsProcessed = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "worker_jobs_processed_total",
            Help: "Total number of jobs processed, partitioned by status.",
        },
        []string{"status"},
    )

    queueDepth = prometheus.NewGauge(prometheus.GaugeOpts{
        Name: "worker_queue_depth",
        Help: "Current number of jobs waiting in the queue.",
    })

    jobDuration = prometheus.NewHistogram(prometheus.HistogramOpts{
        Name:    "worker_job_duration_seconds",
        Help:    "Time spent processing a single job.",
        Buckets: prometheus.DefBuckets,
    })
)

func init() {
    prometheus.MustRegister(jobsProcessed, queueDepth, jobDuration)
}
```

`prometheus.MustRegister` panics on duplicate registration, making misconfigurations obvious at startup. For library use, prefer `prometheus.Register` with error handling.

### Step 3: Collect Real Values

Use a polling goroutine to keep metrics current:

```go
import (
    "math/rand"
    "time"
)

func collectMetrics() {
    for {
        // Replace with real reads from your application
        depth := float64(rand.Intn(50))
        queueDepth.Set(depth)

        start := time.Now()
        // Simulate job processing
        time.Sleep(time.Duration(rand.Intn(200)) * time.Millisecond)
        jobDuration.Observe(time.Since(start).Seconds())
        jobsProcessed.WithLabelValues("success").Inc()

        time.Sleep(5 * time.Second)
    }
}
```

**Polling interval guidance**: Keep it shorter than Prometheus's scrape interval (default 15s in most cluster deployments) so each scrape sees fresh data.

### Step 4: Expose the Endpoint

```go
func main() {
    go collectMetrics()

    http.Handle("/metrics", promhttp.Handler())
    http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
    })

    log.Println("Listening on :8080")
    if err := http.ListenAndServe(":8080", nil); err != nil {
        log.Fatalf("server error: %v", err)
    }
}
```

Verify locally before containerizing:
```bash
go run .
curl http://localhost:8080/metrics | grep worker_
```

## Containerizing the Exporter

### Multi-Stage Dockerfile

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /exporter .

FROM gcr.io/distroless/static:nonroot
COPY --from=builder /exporter /exporter
EXPOSE 8080
ENTRYPOINT ["/exporter"]
```

`distroless/static:nonroot` contains no shell, no package manager, and runs as non-root by default — satisfying most cluster security policies.

Build and push:
```bash
docker build -t <registry>/my-exporter:v1.0.0 .
docker push <registry>/my-exporter:v1.0.0
```

## Deploying to Kubernetes

### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-exporter
  namespace: monitoring
  labels:
    app.kubernetes.io/name: my-exporter
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: my-exporter
  template:
    metadata:
      labels:
        app.kubernetes.io/name: my-exporter
    spec:
      containers:
      - name: exporter
        image: <registry>/my-exporter:v1.0.0
        ports:
        - name: metrics
          containerPort: 8080
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            cpu: 50m
            memory: 32Mi
          limits:
            cpu: 100m
            memory: 64Mi
```

### Service Manifest

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-exporter
  namespace: monitoring
  labels:
    app.kubernetes.io/name: my-exporter
spec:
  selector:
    app.kubernetes.io/name: my-exporter
  ports:
  - name: metrics
    port: 8080
    targetPort: metrics
```

Apply both:
```bash
kubectl apply -f deployment.yaml -f service.yaml
```

## Configuring Prometheus Scraping

### Option 1: Prometheus Operator (ServiceMonitor)

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-exporter
  namespace: monitoring
  labels:
    release: kube-prometheus-stack
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: my-exporter
  endpoints:
  - port: metrics
    interval: 15s
    path: /metrics
```

### Option 2: Annotation-Based Discovery

Add annotations to the Pod template:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"
```

**ServiceMonitor is preferred** — it is more explicit and debuggable than annotation-based discovery.

## Verifying the Pipeline

```bash
# Port-forward to Prometheus
kubectl port-forward svc/prometheus-operated 9090 -n monitoring

# Check target status
kubectl get pods -n monitoring -l app.kubernetes.io/name=my-exporter
kubectl describe servicemonitor my-exporter -n monitoring

# Query metrics in Prometheus expression browser
rate(worker_jobs_processed_total{status="success"}[2m])
```

Navigate to `http://localhost:9090/targets` — the exporter should show as **UP**. If **DOWN**, the debug commands above (pod list + servicemonitor describe) usually pinpoint the issue.

## Next Steps: Custom Metric Autoscaling

To use custom metrics with HorizontalPodAutoscaler:

1. Deploy the **Prometheus Adapter** to register custom metrics with the Kubernetes Custom Metrics API
2. Reference custom metrics in HPA `metrics` blocks:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  metrics:
  - type: Pods
    pods:
      metric:
        name: worker_queue_depth
      target:
        type: AverageValue
        averageValue: "10"
```

## Architecture Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  Application │────▶│  Metrics     │────▶│  Prometheus  │────▶│  HPA /      │
│  (data source)│     │  Exporter    │     │  (scrapes    │     │  Alerts /   │
│              │     │  :8080       │     │  /metrics)   │     │  Dashboards │
└─────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
                         │                      │
                         ▼                      ▼
                   ┌─────────────┐        ┌──────────────┐
                   │ Kubernetes  │        │  Grafana /    │
                   │ Deployment  │        │  Alertmanager │
                   │ + Service   │        │              │
                   └─────────────┘        └──────────────┘
```

## Key Takeaways

1. **Choose the right metric type**: Counters for totals, gauges for current state, histograms for distributions
2. **Name metrics clearly**: Follow `<namespace>_<name>_<unit>` convention
3. **Use multi-stage builds**: Keep container images small and secure with distroless bases
4. **Separate health checks from metrics**: Use `/healthz` for liveness probes, `/metrics` for Prometheus
5. **ServiceMonitor is preferred**: More explicit and debuggable than annotation-based discovery
6. **Polling interval &lt; scrape interval**: Ensure Prometheus always sees fresh data
7. **Custom metrics enable intelligent autoscaling**: Scale on queue depth, request rates, or business metrics — not just CPU/memory

## References

- [Original Kubernetes Blog Article](https://kubernetes.io/blog/2026/07/14/custom-metrics-exporter-kubernetes/)
- [Prometheus Client Library for Go](https://github.com/prometheus/client_golang)
- [Kubernetes HPA Walkthrough](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/)
- [Autoscaling on Custom Metrics](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/#autoscaling-on-multiple-metrics-and-custom-metrics)
- [Prometheus Exporters and Integrations](https://prometheus.io/docs/instrumenting/exporters/)
- [Prometheus Operator Documentation](https://github.com/prometheus-operator/prometheus-operator)

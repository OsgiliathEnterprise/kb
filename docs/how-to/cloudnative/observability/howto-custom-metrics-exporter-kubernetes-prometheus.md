---
title: Building a Custom Metrics Exporter for Kubernetes with Prometheus
diataxis: How-to Guide
domain: Cloud-Native
topic: Observability
source: Kubernetes.io
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

Kubernetes ships with built-in awareness of CPU and memory, but most real-world scaling decisions depend on signals outside that narrow window: queue depth, batch job duration, active WebSocket connections. A metrics exporter bridges that gap by exposing application state as text on a `/metrics` endpoint that Prometheus scrapes at regular intervals.

## When to Use a Standalone Exporter vs. Embedded Instrumentation

| Approach | When to Use |
|----------|-------------|
| Standalone exporter | Data source is external to your application, or you don't control the application code |
| Embedded instrumentation | You can embed the Prometheus client library directly in your application |

## Step 1: Choosing What to Measure

Prometheus data model has three main types:

- **Counters**: Only ever increase. Use for totals: requests served, jobs processed, errors encountered. Never use for values that can go down.
- **Gauges**: Current snapshot of a value that can rise and fall. Queue depth, active connections, cache size.
- **Histograms**: Distribution of observed values. Request latency, percentile calculations (p99, p50).

**Naming convention**: `<namespace>_<name>_<unit>` in `snake_case`. Example: `worker_jobs_processed_total`, `worker_queue_depth`, `worker_job_duration_seconds`.

## Step 2: Setting Up the Go Project

```bash
mkdir my-exporter && cd my-exporter
go mod init example.com/my-exporter
go get github.com/prometheus/client_golang/prometheus
go get github.com/prometheus/client_golang/prometheus/promhttp
```

## Step 3: Registering Metrics

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

`prometheus.MustRegister` panics on duplicate registration, making misconfigurations obvious at startup. Prefer `prometheus.Register` (with error handling) when embedding in a library.

## Step 4: Collecting Real Values

Use a polling goroutine that periodically reads from your data source:

```go
import (
    "math/rand"
    "time"
)

func collectMetrics() {
    for {
        depth := float64(rand.Intn(50))
        queueDepth.Set(depth)

        start := time.Now()
        time.Sleep(time.Duration(rand.Intn(200)) * time.Millisecond)
        jobDuration.Observe(time.Since(start).Seconds())
        jobsProcessed.WithLabelValues("success").Inc()

        time.Sleep(5 * time.Second)
    }
}
```

**Important**: The polling interval (5 seconds here) should be shorter than Prometheus's scrape interval (default 15 seconds in most cluster deployments).

## Step 5: Exposing the Endpoint

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

## Step 6: Building a Container Image

Multi-stage build for minimal production image:

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

`distroless/static:nonroot` contains no shell, no package manager, and runs as non-root by default.

```bash
docker build -t <registry>/my-exporter:v1.0.0 .
docker push <registry>/my-exporter:v1.0.0
```

## Step 7: Deploying to the Cluster

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

## Step 8: Configuring Prometheus Scraping

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

Add these annotations to the Pod template:
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"
```

## Step 9: Verifying the Scrape

```bash
kubectl port-forward svc/prometheus-operated 9090 -n monitoring
```

Navigate to `http://localhost:9090/targets`. The `my-exporter` target should appear with state **UP**.

If **DOWN**, debug with:
```bash
kubectl get pods -n monitoring -l app.kubernetes.io/name=my-exporter
kubectl describe servicemonitor my-exporter -n monitoring
```

Verify data flow:
```promql
rate(worker_jobs_processed_total{status="success"}[2m])
```

## Architecture Diagram

```
                    Metrics Exporter Architecture
                    =============================

  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │ Application │     │  Exporter   │     │  Prometheus │
  │  (data)     │────▶│  Pod        │────▶│  Server     │
  └─────────────┘     │             │     │             │
                      │ /metrics    │     │  Scrapes    │
                      │ /healthz    │     │  every 15s  │
                      └─────────────┘     └──────┬──────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │  HPA / Alerts   │
                                        │  (autoscaling)  │
                                        └─────────────────┘
```

## What Comes Next

The natural next step is surfacing these metrics to the HorizontalPodAutoscaler using the Prometheus Adapter, which registers custom metrics with the Kubernetes Custom Metrics API. Once registered, any HPA in the cluster can reference `worker_queue_depth` or `worker_jobs_processed_total` directly in its `metrics` block.

## References

- [Kubernetes HPA Walkthrough](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/)
- [Autoscaling on Custom Metrics](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/#autoscaling-on-multiple-metrics-and-custom-metrics)
- [Prometheus Exporters Catalog](https://prometheus.io/docs/instrumenting/exporters/)
- [Prometheus Operator](https://github.com/prometheus-operator/prometheus-operator)
- [Original Article](https://kubernetes.io/blog/2026/07/14/custom-metrics-exporter-kubernetes/)

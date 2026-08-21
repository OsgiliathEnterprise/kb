---
title: 'Java vs Go Microservices in 2026: A Helidon Benchmark Update'
diataxis: Explanation
domain: Software-Engineering
topic: JVM-Performance
source: Inside Java
source_url: https://inside.java/2026/06/15/java-microservices-fast-go-2026-benchmark/
date: 2026-08-21
keywords:
- knowledge-base
- JVM-Performance
- Software-Engineering
- explanations
---
# Java vs Go Microservices in 2026: A Helidon Benchmark Update

## Overview

A 2026 re-run of the classic "can Java microservices be as fast as Go?" question (originally posed in 2020) answers: **for a compact HTTP service on current runtimes, modern Java doesn't merely match Go — past the smallest payload it often scales better**, especially with virtual-thread request handling and a Leyden AOT cache. Companion repo with service code, benchmark scripts, raw results, and chart generation: `markxnelson/go-java-go-2026`.

## Baseline

| Component | Version / detail |
| --- | --- |
| Go | 1.26.3, standard library `net/http`, no framework |
| Java | Oracle JDK 26.0.1 + Helidon SE 4.4.1 (virtual threads for request handling) |
| Hardware | Linux x86_64, Intel Xeon W-11855M (6 cores / 12 threads), 128 GiB RAM |

Two Java runtime shapes were measured: plain Oracle JDK JVM, and Oracle JDK with a **Leyden AOT cache** (`-XX:+UnlockDiagnosticVMOptions -XX:-AOTRecordTraining -XX:-AOTReplayTraining` during measurement).

## The Service

Both services expose the same endpoints (`/health`, `/ready`, `/api/strings/{value}`, `/api/generated/{size}`). The benchmark matrix uses the `generated` endpoint so the URL stays small while the handler generates the requested input size. Each request does a fixed small unit of work: uppercase, lowercase, reverse, CRC32, extra CRC rounds (`WORK_FACTOR=10`), then JSON response with runtime metadata. Deliberately synthetic: no database, TLS, queue, or remote dependencies — the hot path is small enough that runtime and server behavior are visible.

## Benchmark Shape

```
payload sizes:      7, 128, 2048, 8192 bytes
concurrency levels: 1, 6, 12, 24, 48, 96, 192
repeats per cell:   2
warmup per cell:    2 seconds
measurement window: 5 seconds
work factor:        10
```

Services run **sequentially** (Go, then Java), so they never compete for CPU/memory. Explicit runtime settings:

```
Go:
  GOMAXPROCS=12
  GOMEMLIMIT=off

Java JVM variants:
  -XX:ActiveProcessorCount=12
  -XX:MaxRAMPercentage=75
```

## Results

At the smallest payload (7 bytes, concurrency 1): Go ~3,200 req/s, plain JDK ~2,722 req/s, Leyden AOT ~3,561 req/s — the familiar "Go starts fast" shape.

The shape changes as concurrency and payload grow:

| Payload | Concurrency | Go peak | Plain JDK | Leyden AOT |
| --- | --- | --- | --- | --- |
| 7 B | 192 | ~59,173 req/s | ~74,044 req/s | ~99,099 req/s |
| 128 B | 192 | ~40,928 req/s | ~62,433 req/s | ~91,124 req/s |
| 2 KB | peak | ~16,971 req/s | ~39,532 req/s | ~41,604 req/s |
| 8 KB | peak | ~6,815 req/s | ~15,025 req/s | ~15,493 req/s |

Highlights:

- At 7 B / 192 concurrency, Leyden AOT peaked at ~99,099 req/s with p95 ≈ 6.0 ms and p99 ≈ 9.1 ms.
- **Leyden AOT had the highest peak throughput in every payload column**, winning 20 of the 28 payload/concurrency cells (plain JDK won the other 8; Go won no cell in the final matrix, though it stayed close at small low-concurrency cases).
- No measured row had request failures.
- Caveat: Leyden AOT is not a magic switch — it changes startup, warmup, and runtime behavior, and the replay run here disabled Leyden record/replay training during measurement. Startup and memory footprint still need their own measurement pass.

## The Tuning Detail That Changed the Java Result

A subtle but instructive finding: with persistent HTTP/1.1 connections, the Helidon service showed a suspicious **latency floor around 44–48 ms** for larger generated responses, while fresh `curl` requests did not. The smell was packet behavior, not application code. The fix:

```java
WebServer server = WebServer.builder()
        .port(port)
        .connectionOptions(socket -> socket.tcpNoDelay(true))
        .routing(routing -> routing
                .get("/health", (req, res) -> health(res))
                .get("/ready", (req, res) -> ready(res))
                .get("/api/strings/{value}", (req, res) -> strings(req, res, logRequests, workFactor))
                .get("/api/generated/{size}", (req, res) -> generated(req, res, logRequests, workFactor)))
        .build()
        .start();
```

After `tcpNoDelay(true)` (Nagle disabled), the 2 KB persistent-connection case went from "obviously broken benchmark" to "serious server." Both services also set `Content-Length` explicitly for known-size JSON responses. **Lesson: one missed production setting (Nagle + delayed ACK interaction on persistent connections) can turn into a confident but wrong benchmark conclusion — run these tests before writing the article, not after.**

## Benchmark Methodology Checklist (from "What I Would Measure Next")

Throughput is only one axis. For a complete runtime-shape comparison, add:

- startup time, RSS and heap usage, CPU utilization
- GC logs, Java Flight Recorder, async-profiler
- longer runs, more repeats per cell, isolated load-generator host
- container limits, TLS, request logging on/off
- a second framework (Spring Boot) and at least one real dependency (e.g. a database call)
- keep `tcpNoDelay` on the checklist — "neither is glamorous, but neither is being wrong by 40 milliseconds"

## Reproduce

```bash
cd helidon-service
JAVA_HOME=/home/mark/jdk-26.0.1 \
PATH=/home/mark/jdk-26.0.1/bin:/home/mark/apache-maven-3.9.12/bin:$PATH \
mvn -B -DskipTests package

RESULTS_DIR=/home/mark/redstack/go-java-go-2026/results/sequential_generated_$(date +%Y%m%d_%H%M%S) \
GO_PORT=25081 \
JAVA_PORT=25082 \
CONCURRENCY_LEVELS="1 6 12 24 48 96 192" \
PAYLOAD_SIZES="7 128 2048 8192" \
REPEATS=2 \
DURATION=5s \
<runner script from the go-java-go-2026 repo>
```

## What the Results Mean

- This is a measurement, not a language trophy. It means: *this* Java implementation, on this JDK, with Helidon virtual-thread handling and the right socket setting, scaled better than *this* Go implementation in *this* local matrix.
- Go remains excellent for small services: compact implementation, simple toolchain, capable std HTTP server, single-binary deployment.
- Modern Java brings a mature optimizer, rich observability (JFR), excellent GC engineering, and a mainstream virtual-thread model that makes blocking server code far cheaper than it used to be.
- Do **not** turn one local benchmark into a company-wide language policy — that's how benchmark articles become office folklore. Language matters, but runtime, framework, hardware shape, warmup, logging, socket options, packaging, and measurement design often matter more.
- The useful next question is not "which language won?" but "which runtime shape do you want to operate, observe, tune, deploy, and live with in production?"

### Leyden AOT context

Leyden AOT (Project Leyden) implements ahead-of-time code compilation: methods frequently used during a training run are compiled and stored along with the AOT cache, shifting JIT warmup work out of runtime. The JDK-8386108 implementation lands on the `premain`/`premain2` branches and targets JDK 24–26. For benchmark work, disable Leyden record/replay training during measurement (`-XX:-AOTRecordTraining -XX:-AOTReplayTraining`) so the measured numbers reflect steady-state replay behavior.

## Benchmark Shape Diagram (Excalidraw)

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "payload-axis",
      "type": "rectangle",
      "x": 40, "y": 40,
      "width": 200, "height": 60,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Payload sizes\n7 / 128 / 2048 / 8192 B", "fontSize": 15, "fontFamily": 1 }
    },
    {
      "id": "concurrency-axis",
      "type": "rectangle",
      "x": 280, "y": 40,
      "width": 200, "height": 60,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Concurrency\n1/6/12/24/48/96/192\nx2 repeats, 2s warmup, 5s measure", "fontSize": 15, "fontFamily": 1 }
    },
    {
      "id": "matrix",
      "type": "rectangle",
      "x": 40, "y": 150,
      "width": 440, "height": 90,
      "strokeColor": "#bf8401",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "28-cell matrix, services run sequentially\n(Go first, then Java) - no resource contention", "fontSize": 15, "fontFamily": 1 }
    },
    {
      "id": "go-box",
      "type": "rectangle",
      "x": 40, "y": 300,
      "width": 140, "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#aaf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Go 1.26.3\nnet/http stdlib\nGOMAXPROCS=12", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "jdk-box",
      "type": "rectangle",
      "x": 205, "y": 300,
      "width": 140, "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "JDK 26 + Helidon SE 4.4.1\nvirtual threads\nActiveProcessorCount=12", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "leyden-box",
      "type": "rectangle",
      "x": 370, "y": 300,
      "width": 140, "height": 70,
      "strokeColor": "#e52727",
      "backgroundColor": "#f9e0a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "JDK 26 + Leyden AOT\ncache, no record/replay\ntraining during measure", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "result-box",
      "type": "rectangle",
      "x": 550, "y": 300,
      "width": 220, "height": 70,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Peak throughput: 7B 59k/74k/99k req/s\n128B 41k/62k/91k - 2KB 17k/40k/42k - 8KB 7k/15k/15k\n(Go / JDK / Leyden)",
        "fontSize": 13, "fontFamily": 1
      }
    },
    {
      "id": "gotcha-box",
      "type": "rectangle",
      "x": 550, "y": 400,
      "width": 220, "height": 60,
      "strokeColor": "#e52727",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 3,
      "strokeDashArray": "8,4",
      "text": {
        "content": "Gotcha: Nagle on persistent conns\n= 44-48ms latency floor at 2KB\nfix: socket.tcpNoDelay(true)",
        "fontSize": 13, "fontFamily": 1
      }
    },
    {
      "id": "arrow-matrix-go",
      "type": "arrow",
      "x": 110, "y": 240,
      "width": 0, "height": 60,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 60]]
    },
    {
      "id": "arrow-matrix-jdk",
      "type": "arrow",
      "x": 275, "y": 240,
      "width": 0, "height": 60,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 60]]
    },
    {
      "id": "arrow-matrix-leyden",
      "type": "arrow",
      "x": 440, "y": 240,
      "width": 0, "height": 60,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 60]]
    },
    {
      "id": "arrow-leyden-result",
      "type": "arrow",
      "x": 510, "y": 335,
      "width": 40, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [40, 0]]
    },
    {
      "id": "arrow-jdk-leyden",
      "type": "arrow",
      "x": 345, "y": 335,
      "width": 25, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [25, 0]]
    },
    {
      "id": "arrow-go-jdk",
      "type": "arrow",
      "x": 180, "y": 335,
      "width": 25, "height": 0,
      "strokeColor": "#1e1e1e",
      "strokeWidth": 2,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [25, 0]]
    },
    {
      "id": "arrow-result-gotcha",
      "type": "arrow",
      "x": 660, "y": 370,
      "width": 0, "height": 30,
      "strokeColor": "#e52727",
      "strokeWidth": 2,
      "strokeDashArray": "4,4",
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "points": [[0, 0], [0, 30]]
    }
  ]
}
```

## Key Takeaways

1. **The 2020 conclusion inverted at scale**: small-payload low-concurrency still favors Go slightly, but from ~128 B up, virtual-threaded Helidon on JDK 26 out-scaled the Go stdlib server in this local matrix.
2. **Leyden AOT was the best runtime shape in every payload column** (20/28 cells), but treat AOT as a runtime-shape change, not a free speedup — measure startup and footprint separately.
3. **One socket option (`tcpNoDelay`) changed the Java result**: with persistent connections and Nagle enabled, a 44–48 ms latency floor appeared at larger payloads. Verify TCP-level behavior before trusting any throughput number.
4. **Benchmark hygiene**: sequential service runs, explicit warmup, explicit `GOMAXPROCS`/`ActiveProcessorCount`, `Content-Length` set explicitly, and no failures in any cell — the measurement design is part of the result.

## References

- [Can Java Microservices Be As Fast As Go? A 2026 Benchmark Update (Inside Java)](https://inside.java/2026/06/15/java-microservices-fast-go-2026-benchmark/)
- [Original 2020 benchmark (Mark Nelson & Peter Nagy, Helidon)](https://medium.com/helidon/can-java-microservices-be-as-fast-as-go-5ceb9a45d673)
- [Companion repository: go-java-go-2026](https://github.com/markxnelson/go-java-go-2026)
- [Project Leyden (OpenJDK)](https://openjdk.org/projects/leyden/)
- [JDK-8386108: Leyden AOT Code Compilation implementation](https://bugs.openjdk.org/browse/JDK-8386108)

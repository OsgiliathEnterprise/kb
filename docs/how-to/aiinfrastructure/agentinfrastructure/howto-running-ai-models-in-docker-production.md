---
title: 'Running AI Models in Docker: Production Lessons and Anti-Patterns'
diataxis: How-to Guide
domain: AI-Infrastructure
topic: Agent-Infrastructure
source: DZone AI/ML
source_url: https://dzone.com/articles/ai-models-docker
date: 2026-07-30
keywords:
- knowledge-base
- Agent-Infrastructure
- AI-Infrastructure
- how-to
---
# Running AI Models in Docker: Production Lessons and Anti-Patterns

## Overview

AI workloads expose Docker shortcuts that web services hide. This article distills hard-won production lessons from running ML inference containers in Kubernetes, covering image sizing, model weight management, GPU isolation, health checks, and the critical distinction between training and serving container strategies.

## The Problem: AI Containers Are Different

Containers solve a real problem for ML: a model trained with CUDA 11.8, PyTorch 2.1, and a specific glibc version doesn't reliably reproduce across machines or GPU node fleets. Docker freezes that dependency tree.

However, AI workloads were never designed for the container model built around stateless web services. Common failures include:
- **14GB images** that take 80+ seconds to cold-start
- **OOM kills** during moderate traffic spikes (3x normal load)
- **Repeated crash loops** in Kubernetes (restart every 90 seconds)

## Anti-Pattern #1: Baking Model Weights into the Image

A naive Dockerfile copies model weights directly into the image layer:

```dockerfile
FROM nvidia/cuda:12.2.0-devel-ubuntu22.04
WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY model/ /app/model/      # ← PROBLEM: weights in image layer
COPY serve.py /app/
CMD ["python3", "serve.py"]
```

**Why this breaks:**
- Every code change (even README edits) re-hashes the entire build context
- Model weights (multi-gigabyte) are re-pushed to the registry on every deploy
- Image pull times dominate deployment windows

**Fix:** Externalize model weights to object storage, download at container start with checksum caching:

```dockerfile
FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04
COPY --from=builder /deps /usr/local/lib/python3.10/site-packages
COPY serve.py /app/
COPY download_weights.py /app/
WORKDIR /app
CMD ["python3", "download_weights.py && python3 serve.py"]
```

Trade-off: startup script complexity and a dependency on storage availability at boot time.

## Anti-Pattern #2: Using `devel` Runtime Images for Serving

Starting from `nvidia/cuda:12.2.0-devel-ubuntu22.04` for a serving container includes the full CUDA toolkit, compilers, and debug symbols — none of which are needed at inference time.

**Fix:** Use multi-stage builds to separate build from runtime:

```dockerfile
FROM nvidia/cuda:12.2.0-devel-ubuntu22.04 AS builder
WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --target=/deps

FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04
COPY --from=builder /deps /usr/local/lib/python3.10/site-packages
COPY model/ /app/model/
COPY serve.py /app/
WORKDIR /app
CMD ["python3", "serve.py"]
```

This alone reduced one team's image from **14GB to ~6GB**.

## Anti-Pattern #3: HTTP-Only Health Checks

A container can report "up" on its HTTP port while the model failed to load into GPU memory. This gap between process health and model health has caused production incidents.

**Fix:** Run an actual dummy inference in the health check:

```yaml
services:
  inference:
    image: registry.internal/rec-model:latest
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]
              count: 1
    healthcheck:
      test: ["CMD", "python3", "healthcheck.py"]  # runs actual inference
      interval: 15s
      timeout: 5s
      retries: 3
```

## Key Decision: Training vs. Serving Containers Are Different

| Aspect | Training Container | Serving Container |
|--------|-------------------|-------------------|
| Image size | Larger is acceptable | Must be lean |
| Build speed | Slower builds OK | Fast builds critical |
| Model weights | Can be baked in | Externalize to storage |
| GPU isolation | Less critical | Must be strict |
| Health check | Basic process check | Actual model inference |

**Rule of thumb:** Not every container needs to be small. Only the ones in your hot path.

## Layer Caching Discipline

A common mistake: copying the entire repository before running `pip install`. This invalidates every cached layer on any file change.

**Correct ordering:**
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt  # cached unless deps change
COPY . .                                            # invalidates only on code change
CMD ["python3", "serve.py"]
```

## GPU Isolation Caveats

Docker's GPU story via `nvidia-container-toolkit` exposes the host driver directly to the container. There is no real GPU isolation — driver and toolkit mismatches between host and container remain entirely the operator's problem.

One team briefly tried bare metal with conda environments instead of containers, but reverted within a sprint because environment drift occurred immediately with more than two people on the pipeline.

## Excalidraw Diagram: Container Architecture Comparison

```excalidraw
* Excalidraw below
* You can draw in the message, and call draw_excalidraw to update the drawing

{"type":"default","values":{"appScale":1.0,"pageId":"p1","pages":{"p1":{"id":"p1","type":"tumbleweed","name":"Page 1","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":false}},"exportPadding":120,"toView":null,"gridSettings":{"customSize":20,"circular":false,"type":"square","dashed":true},"viewBackgroundColor":"#FFFFFF","theme":"dark","strokeColor":"#e6422c","backgroundColor":"#FFFFFF","fontSize":20,"font":"Cascadia","strokeWidth":2,"roughness":0,"seed":117588423,"view":null,"gridMode":false,"gridModeEnabled":false,"gridStep":5,"gridCounter":3}}
text {"id":"1","x":300.0,"y":40.0,"text":"AI Model Container: Anti-Pattern vs. Production-Ready","fontSize":24,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aV","seed":149553083,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"2","x":100.0,"y":130.0,"text":"Anti-Pattern","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aW","seed":154724707,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"3","x":100.0,"y":170.0,"text":"nvidia/cuda:devel base","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aX","seed":134999955,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"4","x":100.0,"y":195.0,"text":"Model weights baked in image","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aY","seed":150582691,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"5","x":100.0,"y":220.0,"text":"HTTP-only health check","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aZ","seed":163038390,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"6","x":100.0,"y":245.0,"text":"COPY . . before pip install","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bb","seed":277501699,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"7","x":100.0,"y":290.0,"text":"Result: 14GB image, 80s cold start","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bc","seed":163038404,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"8","x":100.0,"y":315.0,"text":"OOM kills under 3x load","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bd","seed":163038405,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"9","x":600.0,"y":130.0,"text":"Production-Ready","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"be","seed":163038406,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"10","x":600.0,"y":170.0,"text":"Multi-stage: devel → runtime","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bf","seed":163038407,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"11","x":600.0,"y":195.0,"text":"Weights from object storage at boot","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bg","seed":163038408,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"12","x":600.0,"y":220.0,"text":"Dummy inference health check","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bh","seed":163038409,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"13","x":600.0,"y":245.0,"text":"pip install before COPY .","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bi","seed":163038410,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"14","x":600.0,"y":290.0,"text":"Result: ~6GB image, fast deploys","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bj","seed":163038411,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"15","x":600.0,"y":315.0,"text":"Stable under traffic spikes","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bk","seed":163038412,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"16","x":350.0,"y":400.0,"text":"Key: Training and serving containers need different optimization strategies","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bl","seed":163038413,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
```

## References

- [Original Article: What Nobody Tells You About Running AI Models in Docker](https://dzone.com/articles/ai-models-docker) — DZone AI/ML, July 2026
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [NVIDIA CUDA Container Runtime](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/)
- [Kubernetes GPU Resource Management](https://kubernetes.io/docs/tasks/manage-gpus/)

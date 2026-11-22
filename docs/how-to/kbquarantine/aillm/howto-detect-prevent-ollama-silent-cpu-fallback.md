---
title: How to Detect and Prevent Silent CPU Fallback (CUDA Spillover) in Ollama
diataxis: How-to Guide
domain: .kb-quarantine
topic: AI-LLM
source: DEV.to Tech News
source_url: https://dev.to/thezerodollardev/silent-cpu-fallback-in-ollama-how-to-detect-and-prevent-cuda-spillover-56lc
date: 2026-11-21
keywords:
- knowledge-base
- AI-LLM
- .kb-quarantine
- how-to
---
# How to Detect and Prevent Silent CPU Fallback (CUDA Spillover) in Ollama

**Symptom:** a 14B/32B model generates at 35–45 tok/s on the first prompt, then collapses to ~1.2 tok/s once a long prompt (3,000+ tokens of function definitions or log traces) is fed in. No error is raised — the CPU fans simply spike. This is *silent CPU fallback*: Ollama's llama.cpp-based runner partitions transformer layers between GPU VRAM and system RAM instead of throwing OOM, and every autoregressive token then stalls at PCIe bus transitions.



## Why it is so slow

| Memory domain | Bus | Peak bandwidth |
|---|---|---|
| GPU VRAM (GDDR6X) | on-die | 760–1,008 GB/s |
| System RAM (DDR4/DDR5) | PCIe Gen4/5 (x16) | 38–64 GB/s (~31.5 GB/s bottleneck) |

VRAM is 15–25× faster. If even 2 of 48 layers live in system RAM, weights and activation tensors are copied back and forth across the PCIe bus on every layer transition of every token.

## Step 1 — Detect

**A. Check the running process allocation:**

```bash
ollama ps
```

```
NAME                 ID           SIZE     PROCESSOR        UNTIL
qwen2.5-coder:14b    b38006e8e6e5 9.0 GB   68%/32% CPU/GPU  4m52s
```

Anything other than `100% GPU` in the PROCESSOR column means fallback is degrading throughput.

**B. Inspect the daemon log for the layer allocation:**

```bash
# Linux (systemd)
journalctl -u ollama --no-pager -n 50 | grep -E "load_tensors|offloaded"
# macOS
cat ~/.ollama/logs/server.log | grep -E "load_tensors|offloaded"
```

```
llm_load_tensors: offloaded 34/48 layers to GPU
llm_load_tensors:   14 layers remaining on CPU
llm_load_tensors: VRAM used: 7842 MB, CPU RAM used: 3120 MB
```

## Step 2 — Know the three hidden triggers

1. **Dynamic KV-cache growth:** the model initially fits with only ~300 MB headroom; an 8,000-token conversation expands the KV-cache by up to ~2.5 GB and the allocator spills. (See [[explanation-vram-budget-kv-cache-sizing-formulas]] for the sizing math.)
2. **Large default `num_ctx`:** modern GGUF defaults of 32k/128k tokens pre-allocate gigabytes of VRAM before the first token.
3. **Competing CUDA context overhead:** display servers (Xorg/Wayland/DWM) and hardware-accelerated browsers consume 600 MB–1.5 GB of VRAM that Ollama may not account for.

## Step 3 — Prevent permanently

**Quantize the KV-cache to 8-bit (halves KV VRAM, requires flash attention):**

```bash
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_KV_CACHE_TYPE=q8_0
# Windows (persistent):
# [System.Environment]::SetEnvironmentVariable('OLLAMA_FLASH_ATTENTION','1','Machine')
# [System.Environment]::SetEnvironmentVariable('OLLAMA_KV_CACHE_TYPE','q8_0','Machine')
```

Documented values for `OLLAMA_KV_CACHE_TYPE` are `f16` (default), `q8_0`, `q4_0` — q8_0 halves KV memory with minimal quality loss; q4_0 halves again with measurably more loss.

**Lock the context window and layer count in a Modelfile:**

```
FROM qwen2.5-coder:14b-instruct-q4_K_M
PARAMETER num_ctx 8192
PARAMETER num_gpu 48
PARAMETER temperature 0.2
PARAMETER top_p 0.95
```

```bash
ollama create qwen14b-locked -f ./Modelfile
ollama run qwen14b-locked
```

Never leave `num_ctx` unbound near the VRAM ceiling — a pinned context gives deterministic headroom.

## Step 4 — Optional watchdog

```bash
#!/usr/bin/env bash
# ollama-watchdog.sh - alert on CPU spillover
while true; do
  PROCESSOR=$(ollama ps | awk 'NR>1 {print $4}')
  if [[ "$PROCESSOR" =~ "CPU" ]]; then
    echo "[ALERT] Silent CPU Fallback Detected: $PROCESSOR"
    notify-send "Ollama Fallback" "Model running on CPU: $PROCESSOR"
  fi
  sleep 5
done
```

## Gotchas

- Ollama prints **no warning** on the console when it offloads layers — you must query `ollama ps` or the daemon log.
- Freeing VRAM isn't enough; the layer split is decided at model load. Restart the model (or `ollama stop <model>`) after changing env vars, since they are read by the server process.
- `num_gpu` must match the model's total layer count for a guaranteed full offload (48 for the 14B example, 80 for Llama 70B).

## References

- Original article: [Silent CPU Fallback in Ollama: How to Detect and Prevent CUDA Spillover](https://dev.to/thezerodollardev/silent-cpu-fallback-in-ollama-how-to-detect-and-prevent-cuda-spillover-56lc)
- Cross-check: [Ollama KV cache quantization: q8_0 vs f16 — SSD Nodes](https://www.ssdnodes.com/learn/ollama-kv-cache-quantization)
- Cross-check: [OLLAMA_KV_CACHE_TYPE: Halve Ollama's KV Cache Memory — ModelPiper](https://modelpiper.com/blog/ollama-kv-cache-quantization)
- Related: [[explanation-vram-budget-kv-cache-sizing-formulas]], [[howto-check-model-sizes-gpu-memory]], [[howto-estimate-hardware-fit-for-local-llm]]

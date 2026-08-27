---
title: 'Perplexity Portable Computer: Local Agentic AI on RTX GPUs and DGX Spark'
diataxis: Explanation
domain: developer-tools-practices
topic: local-ai-agents
source: TheNewStack
source_url: https://thenewstack.io/perplexity-portable-computer-nvidia/
date: 2026-08-26
keywords:
- knowledge-base
- local-ai-agents
- developer-tools-practices
- explanations
---
# Perplexity Portable Computer: Local Agentic AI on RTX GPUs and DGX Spark

Perplexity (with Nvidia) shipped **Portable Computer**, bringing its agentic
"Computer" assistant to the desktop. Running it requires one of two setups:

- **Nvidia DGX Spark** desktop running DGX OS — **$4,800**.
- Traditional PC with **Ubuntu (ARM or x64)** and an **RTX card with at least
  24 GB VRAM** (even an older RTX 3090 runs it; currently well over $1,500).

The hardware floor is high partly because of the ongoing global memory supply
shortage ("RAMmageddon"), which is unlikely to improve prices soon.

## The local harness

Porting Computer from cloud to local was not a simple model swap. The local
agent must read and edit files, run shell commands, and process PDFs locally
while still connecting to external services — all inside a **local OS-level
sandbox**. Per Nate Kupp (VP of Computer Enterprise and Infrastructure at
Perplexity), the team had to "revisit almost everything throughout the stack":
many cloud capabilities were reused, but the **harness and model
configuration** were changed for local hardware, with the harness accounting
for most of the engineering work.

Key architectural choice:

- The local model (smaller than Perplexity's cloud models) plans tasks, calls
  tools, manages files, and executes multi-step tasks.
- The **orchestrator maintaining the agent loop is deterministic code, not a
  model**. The local model proposes an action; the orchestrator assembles
  context, **enforces policy**, and runs approved tool calls inside the
  sandbox.
- The sandbox restricts **processes, filesystem paths, and network access**.
  If the sandbox is unavailable, the harness **disables itself before any tool
  call** rather than running tools outside the sandbox — fail-closed by
  design.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "b1",
      "type": "rectangle",
      "x": 40,
      "y": 160,
      "width": 220,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Local model\nproposes actions\n(RTX >= 24GB VRAM / DGX Spark)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b2",
      "type": "rectangle",
      "x": 340,
      "y": 160,
      "width": 240,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Deterministic orchestrator\n(assembles context, enforces policy,\nruns approved tool calls)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b3",
      "type": "rectangle",
      "x": 660,
      "y": 160,
      "width": 240,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "OS-level sandbox\nprocess + FS path + network limits\nfail-closed if sandbox missing", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "a1",
        "type": "arrow",
        "x": 260,
        "y": 205,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [80, 0] ]
      }
    ],
    [
      {
        "id": "a2",
        "type": "arrow",
        "x": 580,
        "y": 205,
        "width": 80,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [80, 0] ]
      }
    ]
  ],
  "appState": { "viewBackgroundColor": "#ffffff" }
}
```

## Models and cloud escalation

- **Local models**: Qwen 3.8 27B or **PPLX 27B** (a post-trained Qwen
  variant); **NVIDIA Nemotron 3.5 Lightning** (30B open model) is coming
  soon to the model picker. The whole local stack — orchestrator, planner,
  tool router, scheduler, durable task queue, and local search index — runs
  on-device.
- **Cost model**: on-device work **does not consume credits**, which is what
  makes high-volume local tasks practical.
- **Escalation to cloud**: the local orchestrator can escalate a task to the
  cloud for current web information, browser use, connected apps, or one of
  15+ frontier models for advanced reasoning — but the user must authorize
  any content leaving the device.
- **Dictation** runs locally with the **NVIDIA Nemotron 3.5 ASR model**, so
  audio never touches the cloud.
- **Availability**: Pro and Max subscribers, on DGX Spark (Grace Blackwell
  GB10 — 20-core Arm CPU + GPU, 128 GB unified memory); Linux first,
  Windows soon. RTX support is "coming soon" per the launch post.

## Takeaways

- **Deterministic orchestrator + sandboxed tools** is a clean pattern for
  local agents: the model proposes, deterministic code disposes.
- **Fail-closed sandboxing** (disable the harness rather than run tools
  unsandboxed) is the right default for a local agent that touches files,
  shell, and network.
- The 24 GB VRAM floor shows local *agentic* workloads (files, shell, PDFs,
  multi-step planning) sit above what a small chat model needs.

## References

- [The New Stack: Perplexity's Computer agent can now run locally — if you can afford it](https://thenewstack.io/perplexity-portable-computer-nvidia/)
- [Perplexity blog: Introducing Portable Computer (official launch)](https://www.perplexity.ai/hub/blog/introducing-portable-computer-for-local-first-ai)
- [NVIDIA DGX Spark product page (hardware platform)](https://www.nvidia.com/en-us/products/workstations/dgx-spark/)

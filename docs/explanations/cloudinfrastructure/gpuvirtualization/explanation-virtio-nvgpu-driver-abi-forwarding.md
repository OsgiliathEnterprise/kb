---
title: virtio-nvgpu — Near-Native NVIDIA GPU Access in KVM Guests via Driver-ABI Forwarding
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-virtualization
source: HackerNews
source_url: https://github.com/nestrilabs/virtio-nvgpu
date: 2026-09-24
keywords:
- knowledge-base
- gpu-virtualization
- cloud-infrastructure
- explanations
---
# virtio-nvgpu — Near-Native NVIDIA GPU Access in KVM Guests via Driver-ABI Forwarding

**[Experimental]** A virtio device that gives a Linux KVM guest near-native access to an NVIDIA GPU by forwarding the **NVIDIA kernel driver's ioctls at the driver ABI level**, bypassing graphics-API translation entirely. The guest runs NVIDIA's *own* unmodified user-mode drivers (same Vulkan, same NVENC) talking to the same physical card. Target use case: **headless streaming** — a compositor inside the VM renders, composites and encodes frames on the GPU, then sends compressed video out; the host keeps the card.

## Why existing approaches fall short for this workload

| Approach | Problem |
|---|---|
| **virtio-gpu + Venus** (API-level translation) | Serializes *every* Vulkan/GL call and replays it host-side. Games issue 1,000–5,000 draw calls/frame; at 60 fps the frame budget is 16.6 ms and serialization alone eats 6–18% of it before any GPU work. Host CPU burns on serialize/transport/replay. Guest-side NVENC not viable: GPU buffers are host-owned, so there's no `CUdeviceptr` in the guest without a full CPU readback+copy. |
| **DRM native context** (Intel/AMD) | The right model — guest runs the real driver, builds command buffers locally, only submissions cross the boundary. But it **does not exist for NVIDIA**. |
| **VFIO passthrough** | Native performance and full driver stack in-guest, but dedicates the *whole* GPU to one VM — often unacceptable multi-tenant. |

virtio-nvgpu's key difference: translation happens at the **kernel-driver level** (ioctls to `/dev/nvidia*`), not the graphics-API level. The guest's NVIDIA user-mode libraries build GPU command buffers **locally in the guest**; individual draw calls are never serialized.

## Measured results (RTX 3060, driver 595.99.02)

Guest vs bare-metal host under an identical headless Vulkan load:

| Host frame time | Guest delta |
|---|---|
| 39 ms | −0.4% (within noise) |
| 9.9 ms | −0.7% |
| 2.0 ms | +1.7% |
| 0.5 ms | +7.1% (a wake costs ~0.02 ms; frame is half of one) |
| 0.05 ms | +40.8% |

**Above ~2 ms/frame — every frame a game draws — the guest is within 2% of bare metal.** CPU cost: unpaced at ~100 fps for 12 s, host used 0.40 s vs **guest 0.37 s** — nothing is forwarded in a render loop because NVIDIA's user-mode driver submits through memory it has mapped, and that memory *is* the host's. Over 813,691 frames the backend served only 13,792 messages (~1 crossing per 59 frames, nearly all device setup).

**Multi-tenant:** four guests on one RTX 3060 → 25.84 / 26.49 / 25.57 / 25.79 fps (103.7 total vs 102.9 for a single guest), p50 frame times equal to four decimal places, all four encoding H.264 at exactly 60 Hz with no NVENC session limit reached. Four is what was *run*, not a discovered limit.

## Architecture: what crosses the boundary and what doesn't

```
Guest VM (headless)
─────────────────────
  Game / application
    │ Vulkan or OpenGL
    ▼
  Wayland compositor (guest-side)
    │ composites all windows; CUDA zero-copy import of composed frame
    ▼
  NVENC hardware encoder (guest-side)
    │ H.264/H.265 bitstream (~100 KB/frame)
    ▼
  Stream to remote client

Guest kernel driver (GPL): registers /dev/nvidiactl, /dev/nvidia0..N,
/dev/nvidia-uvm. On ioctl() → serialize request onto control virtqueue.
On mmap() → map shared-memory region with correct caching attributes.
Copies raw bytes; makes NO ABI decisions.

Device crate (Apache-2.0, no VMM in deps): receives requests, maps guest
handles to host device FDs, performs ABI-aware translation of ioctl
parameters (rewriting embedded pointers/FDs), issues them against the
host's devices. Buffer/window bookkeeping lives here.

Events: a second virtqueue runs the other way — host watches each opened
descriptor and signals when it becomes readable; this is how a guest
waiting on the GPU gets woken (without it, the guest polls a descriptor
the kernel reports as permanently ready and spins).
```

Only compressed bitstream leaves for streaming; buffer handles, fences, CUDA device pointers and NVENC sessions are real driver-level resources inside the guest.

## Repository layout — three license zones by design

| Directory | License | What it is |
|---|---|---|
| `driver/` | **GPL-2.0** | Guest kernel module; registers `/dev/nvidia*`, forwards ioctl+mmap over virtqueue. Deliberately not ABI-aware (must touch kernel symbols → GPL). |
| `device/` | **Apache-2.0** | The virtio device as a Rust crate with **no VMM in its dependency list**; every VMM concern is a trait (descriptor chains as Read/Write, event queue, guest/host memory mapping). Optional capabilities degrade rather than fail to build. Layout follows `chromeos/virtio-media`. |
| `isolate/` | Apache-2.0 | **A design note, not code yet** — the sandboxed per-guest helper that will hold real device FDs and issue unprivileged `ioctl(2)`. Today the backend holds them itself in the VMM's process; adopting isolate means inheriting a *process model*, not just a library dep. |
| `gen/` | — | Generated ABI tables, checked in **and** reproducible. |
| `protocol/` | BSD-3-Clause OR GPL-2.0+ | Wire format + ABI definitions shared by both halves; dual-licensed so the GPL driver and Apache crate include the same headers. |

## What works / what's not done (as of disclosure)

**Known to work:** guest enumerates the card (`nvidia-smi` reports real power/memory, `deviceUUID` is the host's); Vulkan renders (`vulkaninfo` exits 0, offscreen draws pixel-correct); a Wayland client presents through an in-guest compositor; NVENC via Vulkan Video on the client's own device; imported buffers are host memory mapped through a shared window.

**Not done:** more than four guests or heavier-than-vkcube-720p loads (eight untried); two cards / two driver versions (RTX A2000 on 615.71.09 renders but is unbenchmarked); CUDA beyond enumeration; the isolate, per-version driver shares and multi-tenant envelope are unbuilt. Shipped ABI profiles: 535.129.03, 580.178.04, 595.71.05 (matched by range; older refused).

## Diagram: API-level vs driver-ABI forwarding

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "nvg-title",
      "type": "text",
      "x": 40,
      "y": 20,
      "width": 780,
      "height": 25,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 61234,
      "versionNonce": 72731,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "virtio-nvgpu: driver-ABI forwarding vs API-level translation (Venus)",
      "fontSize": 16,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 25
    },
    {
      "id": "nvg-venus-box",
      "type": "rectangle",
      "x": 40,
      "y": 70,
      "width": 360,
      "height": 150,
      "angle": 0,
      "strokeColor": "#e03131",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 62345,
      "versionNonce": 73842,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000
    },
    {
      "id": "nvg-venus-t",
      "type": "text",
      "x": 52,
      "y": 84,
      "width": 336,
      "height": 120,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 63456,
      "versionNonce": 74953,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "Venus (API-level)\nserialize EVERY draw call\n~2,000 boundary crossings/frame\ncmd buffers built on HOST\nhost owns GPU buffers\nNVENC in guest: not viable",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 120
    },
    {
      "id": "nvg-nvg-box",
      "type": "rectangle",
      "x": 460,
      "y": 70,
      "width": 380,
      "height": 150,
      "angle": 0,
      "strokeColor": "#2f9e44",
      "backgroundColor": "#b2f2bb",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 64567,
      "versionNonce": 75064,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000
    },
    {
      "id": "nvg-nvg-t",
      "type": "text",
      "x": 472,
      "y": 84,
      "width": 356,
      "height": 120,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 65678,
      "versionNonce": 76175,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "virtio-nvgpu (driver-ABI)\nforward /dev/nvidia* ioctls\n~5-20 boundary crossings/frame\ncmd buffers built in GUEST\nguest owns GPU buffers\nNVENC works (real CUDA interop)",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 120
    },
    {
      "id": "nvg-guest",
      "type": "rectangle",
      "x": 460,
      "y": 250,
      "width": 380,
      "height": 70,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 66789,
      "versionNonce": 77286,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000
    },
    {
      "id": "nvg-guest-t",
      "type": "text",
      "x": 472,
      "y": 262,
      "width": 356,
      "height": 48,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 67890,
      "versionNonce": 78397,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "Guest: app -> NVIDIA user-mode drivers\nGPL driver/ serializes ioctl to virtqueue",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 48
    },
    {
      "id": "nvg-host",
      "type": "rectangle",
      "x": 460,
      "y": 350,
      "width": 380,
      "height": 70,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffec99",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 3 },
      "seed": 68901,
      "versionNonce": 79408,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000
    },
    {
      "id": "nvg-host-t",
      "type": "text",
      "x": 472,
      "y": 362,
      "width": 356,
      "height": 48,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 69012,
      "versionNonce": 80519,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "Host: device/ crate (Apache) maps guest\nhandles -> host FDs, ABI-aware ioctl rewrite",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 48
    },
    {
      "id": "nvg-a1",
      "type": "arrow",
      "x": 650,
      "y": 320,
      "width": 0,
      "height": 30,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": { "type": 2 },
      "seed": 70123,
      "versionNonce": 81630,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "points": [[0, 0], [0, 30]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow",
      "elbowed": false
    },
    {
      "id": "nvg-note",
      "type": "text",
      "x": 40,
      "y": 250,
      "width": 380,
      "height": 168,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 71234,
      "versionNonce": 82741,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1758000000000,
      "text": "Measured (RTX 3060 / driver 595.99.02):\n- guest within 2% of bare metal above ~2ms/frame\n- CPU: guest 0.37s vs host 0.40s (100fps, 12s)\n- 813,691 frames -> only 13,792 backend messages\n- 4 guests share one card evenly (~25.8 fps each),\n  all encoding H.264 at 60Hz simultaneously",
      "fontSize": 14,
      "fontFamily": 2,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 168
    }
  ]
}
```

## References

- [nestrilabs/virtio-nvgpu — GitHub repository](https://github.com/nestrilabs/virtio-nvgpu)
- [BENCHMARKS.md — measurement method and what the numbers do not support](https://github.com/nestrilabs/virtio-nvgpu/blob/dev/BENCHMARKS.md)
- [ARCHITECTURE.md — how it works in prose](https://github.com/nestrilabs/virtio-nvgpu/blob/dev/ARCHITECTURE.md)
- [chromeos/virtio-media — layout template (GPL driver beside VMM-agnostic Rust device crate)](https://chromium.googlesource.com/chromiumos/platform/virtio-media/)

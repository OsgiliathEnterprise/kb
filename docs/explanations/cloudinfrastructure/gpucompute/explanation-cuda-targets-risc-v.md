---
title: 'Hot Chips 2026: CUDA Targets RISC-V'
diataxis: Explanation
domain: cloud-infrastructure
topic: gpu-compute
source: HackerNews
source_url: https://chipsandcheese.com/p/hot-chips-2026-cuda-targets-risc
date: 2026-08-25
keywords:
- knowledge-base
- gpu-compute
- cloud-infrastructure
- explanations
---
# Hot Chips 2026: CUDA Targets RISC-V

CUDA supports x86-64 and aarch64 today. At Hot Chips 2026, Nvidia presented
extending CUDA to **RISC-V** — opening the door for RISC-V CPUs to feed GPU
compute. The talk is a requirements list: Nvidia wants a server-grade CPU and
platform, not a lowest-common-denominator target.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "f1",
      "type": "rectangle",
      "x": 60,
      "y": 180,
      "width": 240,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "CUDA runtime\n(NVIDIA)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "f2",
      "type": "rectangle",
      "x": 420,
      "y": 180,
      "width": 260,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "RISC-V target\n(RVA23 profile)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "f3",
        "type": "arrow",
        "x": 300,
        "y": 230,
        "width": 120,
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
            120,
            0
          ]
        ]
      },
      {
        "id": "f3_lbl",
        "type": "text",
        "x": 310,
        "y": 206,
        "width": 100,
        "height": 20,
        "text": "port / target",
        "fontSize": 13,
        "fontFamily": 1,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent"
      }
    ],
    {
      "id": "f4",
      "type": "rectangle",
      "x": 420,
      "y": 360,
      "width": 300,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c9e7c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "PCIe coherency\nrequirements",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "f5",
        "type": "arrow",
        "x": 550,
        "y": 280,
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
            80
          ]
        ]
      }
    ]
  ]
}
```

## Baseline: RVA23 + server specs

Nvidia requires an **RVA23** CPU plus adherence to the RISC-V **server SoC** and
**server platform** specifications. Those cover RAS (reliability, availability,
serviceability), a specialized security processor, and other baselines — which
fulfils most of the server-grade expectation.

## Requirements beyond the profile

- **Vector extensions with predication.** Without a guaranteed extension, CUDA
  cannot use performance-enhancing paths and would ship inefficient code.
  Predication lets it avoid branches.
- **ACPI.** Needed for hardware discovery plus power/perf/thermal management.
  RISC-V lacked ACPI when the port started; the UEFI forum added RISC-V ACPI in
  2025, and the RISC-V BRS (Boot and Runtime Services) spec — ratified last
  year — includes ACPI.
- **PCIe coherency.** The memory-ordering hazard: the CPU writes data that sits
  in a cache; a CUDA DMA read then pulls stale data from DRAM (and the reverse
  on write-back). Without coherency the CUDA stack must explicitly invalidate
  caches — hard to do cleanly. RISC-V's server SoC spec *recommends* coherency;
  Nvidia wants a **guarantee**.
- **Peer-to-peer PCIe.** Without it, buffers copied between two devices bounce
  through CPU memory, costing performance and adding synchronization.

Nvidia did not publish the full list (it fits "two pages"), but the shape is
clear: a RISC-V host must be a real server platform — coherent, ACPI-aware,
vector-capable, with P2P — before CUDA will run on it.

## Ecosystem context (verified 2026-08-28)

The timing of this port lines up with the RISC-V ecosystem's push into data
centers: at the **RISC-V Summit Europe 2026** (Bologna), RISC-V International
CEO Andrea Gallo declared "RISC-V is now", citing the official ratification of
the **RISC-V Server Platform Specification 1.0** — based on the RVA23 profile —
which brings industry-standard boot and runtime services (**UEFI, ACPI 6.6**) to
RISC-V servers so system software runs consistently across server hardware. The
same summit reported RISC-V adoption expanding beyond embedded into data
centers, edge AI, and space applications, with Meta, Google, Nvidia, Qualcomm,
and Alibaba all adding RISC-V technology to their portfolios. In other words:
the ACPI/BRS gap that blocked the CUDA port is exactly what the ratified server
platform spec now closes — which is why a server-grade RISC-V host for CUDA is
now a realistic procurement target rather than a research project.

## References

- [Hot Chips 2026: CUDA Targets RISC-V (Chips and Cheese)](https://chipsandcheese.com/p/hot-chips-2026-cuda-targets-risc)
- [RISC-V server SoC specification](https://docs.riscv.org/reference/server-soc/_attachments/riscv-server-soc.pdf)
- [RISC-V server platform spec v1.0](https://github.com/riscv-non-isa/riscv-server-platform/releases/tag/v1.0)
- [RISC-V Europe Summit 2026: Beyond Embedded Electronics (EE Times)](https://www.eetimes.com/risc-v-europe-summit-2026-beyond-embedded-electronics/)

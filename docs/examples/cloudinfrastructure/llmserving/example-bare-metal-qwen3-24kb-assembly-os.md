---
title: 'Bare Metal Qwen3: A 24 KB Pure-Assembly OS that Runs LLM Inference with No
  Kernel, No libc'
diataxis: Example
domain: cloud-infrastructure
topic: llm-serving
source: HackerNews (GitHub llm.asm)
source_url: https://github.com/alesha-pro/llm.asm/tree/main/02-baremetal-os
date: '2026-11-26'
keywords:
- knowledge-base
- llm-serving
- cloud-infrastructure
- examples
---
# Bare Metal Qwen3: A 24 KB Pure-Assembly OS Running LLM Inference

`llm.asm/02-baremetal-os` is a standalone bootable **x86-64 operating system that runs
Qwen/Qwen3-0.6B directly on hardware or KVM — no Linux, no Windows, no C, no Rust, no libc**.
It is a masterclass in how little software is actually needed between the metal and an LLM
inference loop.

## The numbers (all measured, from the README)

- **24,252-byte** stripped static Multiboot 1 kernel (`FAST_Q8=1`): `.text` 17,143 B, `.rodata` 2,772 B, `.bss` 2.1 MiB NOBITS, zero dynamic dependencies (23,612 B with legacy Q8_0xFP32).
- **74–94 ms cold boot** to an interactive `asm-llm>` multi-turn chat with **persistent KV-cache across turns**, all SMP cores online, model bound **zero-copy from physical RAM on 2 MiB huge pages** (`.asmbin` v2: 614 MiB FP16 scales; v1: 649 MiB FP32).
- **100% token-exact parity with the Phase 1 (userspace) implementation** across 1..32 vCPUs.
- **134.9 tok/s decode** on QEMU KVM (AMD EPYC 7642, 16 vCPUs; 23.7 tok/s at 1 vCPU, 118.1 at 8, peak 136.6) and **55.4 tok/s live on a 0 GB-disk Proxmox VE VM** (Intel Xeon E5-2670 v3, 12 cores, 2 GiB RAM).

SMP scaling table (KVM, `FAST_Q8=1`, 34 prompt + 64 generated tokens, greedy):

| vCPUs | Decode tok/s | Prefill tok/s |
| --- | --- | --- |
| 1 | 23.5 | 31.7 |
| 4 | 78.2 | 104.7 |
| 8 | 119.0 | 157.5 |
| 16 | 134.9 (peak 136.6) | 160.5 |
| 32 | 132.4 | 167.1 |

Decode saturates around 8–16 vCPUs — memory-bandwidth-bound behaviour, typical for a 0.6B
Q8 model.

## Why it beats the Linux path

`boot.asm` **identity-maps guest RAM with 2 MiB huge pages**, so the kernel avoids 4 KiB
page-table walks across the 614 MiB model. The result outperforms both the Linux `mmap()`
Phase 1 build **and llama.cpp CPU Q8_0 at every thread count** — an argument that for
bandwidth-bound inference, the OS paging layer is real overhead.

## Build and run

```shell
# Prereqs: x86-64 CPU with AVX2 + FMA + F16C
sudo apt install nasm binutils qemu-system-x86
# Optional, for a hybrid BIOS+UEFI ISO (make os-iso):
sudo apt install grub-pc-bin grub-efi-amd64-bin grub-common mtools xorriso
```

Source layout: `boot.asm` (Multiboot entry, page tables), `kernel.asm`, `smp.asm`
(AP bring-up), `drivers.asm`, `runtime.asm` (inference core), `linker.ld`,
`os_constants.inc`. Needs an exported `models/qwen3-0.6b-q8_0.asmbin`
(`--scale-dtype fp16` v2 recommended).

## What to learn from it

1. **Huge pages matter for inference** — the same model runs faster purely because 2 MiB mappings remove TLB/page-walk pressure over the weight tensor.
2. **A KV-cache multi-turn chat loop needs almost no OS**: a serial console, SMP spinlock-free workers, and physical memory access.
3. **Q8 weight + FP32/FP16 scale formats (`.asmbin`)** make a from-scratch GGUF-like loader tractable in assembly.
4. Token-exact parity vs the userspace reference is a good regression-testing discipline for inference rewrites.

## References

- [llm.asm/02-baremetal-os on GitHub](https://github.com/alesha-pro/llm.asm/tree/main/02-baremetal-os)
- [Phase 1: Qwen3 inference userspace baseline](https://github.com/alesha-pro/llm.asm/blob/main/01-qwen3-inference/README.md)

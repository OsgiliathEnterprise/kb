---
title: How to Run Gemma 3 1B Locally in Node (Transformers.js + ONNX, with the onnxruntime
  Pin)
diataxis: How-to Guide
domain: AI-LLM
topic: LLM-Infrastructure
source: DEV.to Tech News
source_url: https://dev.to/khizzcr7/seance-a-terminal-that-channels-dead-programming-languages-525k
date: 2026-10-27
keywords:
- knowledge-base
- LLM-Infrastructure
- AI-LLM
- how-to
---
# How to Run Gemma 3 1B Locally in Node (Transformers.js + ONNX, with the onnxruntime Pin)

A working recipe (extracted from the "Seance" challenge project, deliberately small: ~10 source files) for fully local small-LLM inference in a Node app: no API key, no account, no cloud — offline after a one-time ~840 MB model download.

## Setup
```bash
npm install        # @huggingface/transformers + onnxruntime
npm run seance     # interactive spirit picker
npm run demo       # fixed demo, writes out/transcript.md
```
- **Model**: `onnx-community/gemma-3-1b-it-ONNX` (Gemma 3 1B instruction-tuned, ONNX export), loaded at **dtype q4** (~840 MB) — runs on an ordinary laptop CPU.
- **Runtime**: Node.js ≥ 22; the model caches to `./.cache` on first run.
- **Decoding**: greedy (`do_sample: false`) + 220-token cap → short, reproducible answers.

## The gotcha (verified fix)
Transformers.js 3.8.1 ships **onnxruntime 1.21.0** by default, which **refused to load the Gemma q4 model** — the load failed on the `GatherBlockQuantized` operator. Root cause (cross-referenced below): Gemma's 4-bit ONNX export keeps its embedding table block-quantized, so the graph's first node is that ONNX contrib operator, and not every runtime build ships a CPU kernel for it. Fix: pin the runtime in `package.json` (e.g. an `overrides` entry):

```json
{ "overrides": { "onnxruntime-node": "1.30.0" } }
```

After the pin, the demo ran end-to-end in ~90 s.

## What was / wasn't verified
Verified locally: `npm install` succeeds, `npm run demo` produces a real Gemma transcript, the static viewer renders it, and the interactive picker lists all six personas. **Not** verified: running the model in a browser — the demo viewer is a transcript page and makes no such claim.

## Further reading

- [Transformers.js v3 release notes](https://huggingface.co/blog/transformersjs-v3) — the version line this note pins against: v3 added WebGPU (up to 100x faster than WASM), new quantization dtypes, and moved the npm package to `@huggingface/transformers` with Node (ESM + CJS), Deno, and Bun support. If you upgrade the pin, the import path and backend behavior change with it — re-verify the onnxruntime compatibility after any bump.
- [PyImageSearch: Running Gemma in the browser with Transformers.js + WebGPU](https://pyimagesearch.com/2026/07/27/running-gemma-4-in-the-browser-with-transformers-js-and-webgpu/) — the browser-side variant of this setup; same ONNX Runtime mechanism, WebGPU backend, no Node required.

## References
- [Seance: a terminal that channels dead programming languages (DEV.to)](https://dev.to/khizzcr7/seance-a-terminal-that-channels-dead-programming-languages-525k) — project write-up
- [seance repo (GitHub)](https://github.com/khizzcr7/seance)
- [Fixing GatherBlockQuantized: 4-bit Gemma without WebGPU (DEV.to)](https://dev.to/munimv2/fixing-gatherblockquantized-4-bit-gemma-in-the-browser-without-webgpu-transformersjs-4x-2976) — root cause of the runtime pin

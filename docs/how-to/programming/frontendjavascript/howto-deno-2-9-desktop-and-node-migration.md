---
title: 'Deno 2.9: Native Desktop Apps and Easier Node.js Migration'
diataxis: How-to Guide
domain: programming
topic: frontend-javascript
source: Developpez
source_url: https://javascript.developpez.com/actu/384649/Le-moteur-d-execution-pour-JavaScript-TypeScript-et-WebAssembly-Deno-2-9-est-disponible-integrant-un-generateur-d-applications-de-bureau-natives-et-facilite-la-migration-des-projets-Node-js/
date: 2026-09-09
keywords:
- knowledge-base
- frontend-javascript
- programming
- how-to
---
# Deno 2.9: Native Desktop Apps and Easier Node.js Migration

Deno 2.9 (released June 2026) is a major update to the JavaScript/TypeScript/WebAssembly runtime built on V8 and Rust. Two of its changes matter most for working JavaScript developers: a new **`deno desktop`** tool that turns existing web projects into native desktop apps, and a migration path to Deno that now fits in a couple of commands.

## Feature highlights

- **`deno desktop`** — compiles your existing web repository (Next.js, Astro, Remix, SvelteKit, or a plain script) into a **single self-contained native binary per platform**. The UI runs in a web view; application logic runs on Deno itself. No Electron or Tauri, no IPC layers — and full Node/npm compatibility from the start.
- **Lockfile-aware installs** — `deno install` now reads **npm, pnpm, Yarn, and Bun lockfiles** directly, so migrating a Node project does not require converting dependency metadata.
- **Node.js 26 compatibility target** aligned with the latest Node release.
- **CSS module imports via import attributes**, per the web standard for CSS module scripts (e.g. `import "./style.css" type(text/css)`).
- **Web Crypto API extended** with modern and **post-quantum algorithms** based on the NIST proposals.
- **Performance vs 2.8** (Deno.serve benchmarks, concurrency 100, dedicated Linux x86_64 machine): hello-world cold start halved from **34 ms to ~17 ms**. Sources of the gain: lazy loading of Node globals from the snapshot, limiting early Node bootstrap to Node workers, a V8 code cache for deferred ESM modules, minified snapshots, and on macOS a chain of pre-main fixes.
- **Tooling polish**: `deno compile`, `deno bundle`, `deno fmt`, `deno task` improved; supply-chain security hardening, refined test/coverage tools, and more granular **OpenTelemetry tracing** parameters.

## How to migrate an existing Node.js project

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "d1",
      "type": "rectangle",
      "x": 40,
      "y": 80,
      "width": 220,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Node.js project\npackage.json + lockfile\n(npm/pnpm/Yarn/Bun)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "d2",
      "type": "rectangle",
      "x": 340,
      "y": 80,
      "width": 240,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "deno install\nreads existing lockfile,\nfetches deps as-is", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "d3",
      "type": "rectangle",
      "x": 660,
      "y": 80,
      "width": 240,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c9e7c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "deno task dev\n(app already on Deno)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "d4",
      "type": "rectangle",
      "x": 340,
      "y": 260,
      "width": 560,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Optional: deno desktop\ncompile web repo (Next.js / Astro / SvelteKit) into one\nnative self-contained binary per platform", "fontSize": 14, "fontFamily": 1 }
    },
    [
      { "id": "d5", "type": "arrow", "x": 260, "y": 130, "width": 80, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [80, 0]] }
    ],
    [
      { "id": "d6", "type": "arrow", "x": 580, "y": 130, "width": 80, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [80, 0]] }
    ]
  ]
}
```

1. **Install dependencies** — in the existing project root, run:
   ```bash
   deno install
   ```
   Deno 2.9 reads `package.json`, the existing lockfile, and workspace structure. No dependency rewrite.
2. **Run the app** —
   ```bash
   deno task dev
   ```
   In most projects that is the entire migration: nothing to port, nothing to rewrite.
3. **Verify the edge cases** — 2.9 specifically fixes the last remaining gaps: **pnpm workspaces** and tools that **invoke Node via the shell** now work without intervention.
4. **Optional desktop packaging** — point `deno desktop` at the web repository; it compiles code + Deno runtime + web rendering engine into one redistributable binary per platform.

## Notes and caveats

- The runtime is MIT-licensed, single-executable (runtime + package manager in one binary), and event-driven like Node (non-blocking I/O with blocking variants).
- Performance gains are measured on a dedicated Linux x86_64 machine; expect relative, not absolute, improvements elsewhere.
- The CSS import-attributes feature and Web Crypto extensions track evolving web standards — check current spec status before building critical features on them.

## References

- [Deno 2.9 est disponible — Developpez (javascript section)](https://javascript.developpez.com/actu/384649/Le-moteur-d-execution-pour-JavaScript-TypeScript-et-WebAssembly-Deno-2-9-est-disponible-integrant-un-generateur-d-applications-de-bureau-natives-et-facilite-la-migration-des-projets-Node-js/)
- [Deno Desktop: convert web apps into native binaries (Developpez)](https://javascript.developpez.com/actu/384396/Deno-Desktop-convertit-les-applications-web-en-binaires-natifs-en-ciblant-votre-referentiel-web-existant-tel-que-Next-js-Astro-ou-SvelteKit-pour-le-compiler-en-un-executable-natif-leger-et-autonome/)

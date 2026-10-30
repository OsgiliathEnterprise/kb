---
title: How to Turn Manufacturer CAD Files into Browser-Loadable glTF (Decimate, Reorient,
  PBR Slots, Draco+KTX2)
diataxis: How-to Guide
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/gronskideveloper/cad-to-gltf-the-manufacturer-file-pipeline-nobody-warns-you-about-3ch9
date: 2026-10-30
keywords:
- knowledge-base
- frontend-javascript
- programming
- how-to
---
# How to Turn Manufacturer CAD Files into Browser-Loadable glTF

The demo looks easy: load a glTF, orbit around it, swap a material. Then a real manufacturer sends their actual product file, and you learn the hard part was never the Three.js — it was getting their CAD into something a browser can load in under three seconds.

## What actually arrives

Manufacturers model in SolidWorks, Inventor, Rhino, or hand you a STEP file. Exported to glTF, a single product variant lands at **40–120 MB** and is usually:

- **Z-up** — the CAD convention. Three.js is Y-up, so the model is lying on its back.
- **Scaled in millimeters or inches** — either microscopic or the size of a building.
- **Stripped of materials**, or carrying CAD materials that mean nothing to a PBR renderer.
- **Thousands of separate parts** — every bolt its own mesh = thousands of draw calls.

None of that is the manufacturer doing anything wrong: CAD and realtime web rendering want opposite things.

## The four-stage pipeline

Run every incoming model through these stages before it goes near the configurator:

```excalidraw
{"type": "drawing", "version": 2, "source": "https://github.com/excalidraw/excalidraw", "elements": [{"id": "t1", "type": "text", "x": 40, "y": 20, "width": 600, "height": 24, "text": {"content": "CAD -> glTF asset pipeline (per product variant)", "fontSize": 15, "fontFamily": 1}, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}, {"id": "r1", "type": "rectangle", "x": 40, "y": 60, "width": 150, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#ffec99", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "1. Decimate + merge\n(Blender)\n4000 parts -> a few meshes", "fontSize": 12, "fontFamily": 1}}, {"id": "r2", "type": "rectangle", "x": 220, "y": 60, "width": 150, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "2. Orient + scale\nZ-up -> Y-up\n1 unit = 1 meter, bake it", "fontSize": 12, "fontFamily": 1}}, {"id": "r3", "type": "rectangle", "x": 400, "y": 60, "width": 150, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#b2f2bb", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "3. PBR by slot\n(frame, glass, hardware)\nnot per part", "fontSize": 12, "fontFamily": 1}}, {"id": "r4", "type": "rectangle", "x": 580, "y": 60, "width": 150, "height": 80, "strokeColor": "#1e1e1e", "backgroundColor": "#ffc9c9", "fillStyle": "solid", "strokeWidth": 2, "text": {"content": "4. Compress\nDraco geometry\nKTX2 textures", "fontSize": 12, "fontFamily": 1}}, {"id": "a1", "type": "arrow", "x": 190, "y": 100, "width": 30, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [30, 0]]}, {"id": "a2", "type": "arrow", "x": 370, "y": 100, "width": 30, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [30, 0]]}, {"id": "a3", "type": "arrow", "x": 550, "y": 100, "width": 30, "height": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 2, "points": [[0, 0], [30, 0]]}, {"id": "n1", "type": "text", "x": 40, "y": 170, "width": 700, "height": 40, "text": {"content": "90 MB in -> 2-5 MB out, no visible loss on a product shot.\ngltf-transform optimize in.glb out.glb --compress draco --texture-compress ktx2", "fontSize": 12, "fontFamily": 1}, "strokeColor": "#1e1e1e", "backgroundColor": "transparent"}]}
```

1. **Decimate and merge in Blender.** Collapse the part tree, remove internal geometry the customer never sees, weld bolts and screws into the parent. A 4000-part assembly becomes a handful of meshes.
2. **Fix orientation and scale on import.** Rotate Z-up to Y-up, set **1 unit = 1 meter**. Do it once, bake it, never think about it again in the app.
3. **Reassign PBR materials by slot, not per part.** Group surfaces into material slots (frame, glass, hardware) so a color picker touches *one* material instead of two hundred.
4. **Compress.** `gltf-transform` or `gltf-pipeline`, with **Draco** for geometry and **KTX2** for textures (so the GPU stores them compressed, not just the file):

```bash
gltf-transform optimize in.glb out.glb --compress draco --texture-compress ktx2
```

**90 MB in, 2–5 MB out**, with no visible loss on a product shot.

**Trade-offs worth knowing before you ship.** Draco compression is **lossy** — re-compressing an already-compressed model loses precision, so compress last in the art workflow and keep an uncompressed original. Decompression happens on the client *before* upload to the GPU: it adds parse latency and does not improve frame rate — if you need fewer vertices, simplify the geometry, not just compress it. For small geometries (under ~1 MB) the WASM decoder's own size can outweigh the savings. Encoder options: `edgebreaker` (default) compresses best but reorders vertices; use `sequential` to preserve index order. Details: [KHR_draco_mesh_compression documentation](https://gltf-transform.dev/modules/extensions/classes/KHRDracoMeshCompression).

## The part the quote forgets

This pipeline is **per product line, and it is ongoing**: new product → new file → run it again; new variant → new export; manufacturer updates a model → someone reprocesses it.

When scoping a configurator, treat the asset pipeline as **its own line item** — sometimes a small Blender script or a Laravel queue job so reprocessing is one command, not a day of clicking. The author's studio runs several of these in production, one per manufacturer, each fed by the same pipeline.

## Practical implications

| Symptom | Stage that fixes it |
| --- | --- |
| Model lying on its back | Stage 2 (Z-up → Y-up, bake on import) |
| Microscopic / building-sized model | Stage 2 (1 unit = 1 meter) |
| Thousands of draw calls | Stage 1 (decimate + merge, weld fasteners) |
| Color picker edits 200 materials | Stage 3 (material slots) |
| 40–120 MB glb, slow first load | Stage 4 (Draco + KTX2 → 2–5 MB) |
| Every new variant takes a day | Automate: script/queue job so reprocessing is one command |

## Related notes

- [How to Optimize SVG Icons for Web Performance](howto-svg-icon-optimization.md) — the 2D counterpart: an asset pipeline that strips weight before the browser sees it.
- [Browser-Only PDF Processing with CSP Enforcement](../../../examples/programming/frontendjavascript/example-browser-only-pdf-processing-with-csp-enforcement.md) — heavy binary assets (PDFs vs 3D scenes) processed client-side without a server round-trip.

## References

- [CAD to glTF — the manufacturer file pipeline nobody warns you about (DEV.to)](https://dev.to/gronskideveloper/cad-to-gltf-the-manufacturer-file-pipeline-nobody-warns-you-about-3ch9)
- [gltf-transform (Khronos)](https://gltf-transform.dev/)
- [KHR_draco_mesh_compression — glTF Transform docs](https://gltf-transform.dev/modules/extensions/classes/KHRDracoMeshCompression) — lossy-compression caveats, encoder options, and the WASM-decoder-size caveat.
- [trimesh (Python)](https://trimesh.org/) — server-side CAD/mesh loading and simplification for batch pipelines (reads some native CAD formats via plugins).
- [Three.js](https://threejs.org/)

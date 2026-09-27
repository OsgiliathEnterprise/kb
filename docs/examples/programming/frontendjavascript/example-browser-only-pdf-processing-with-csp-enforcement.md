---
title: Browser-Only PDF Processing Enforced by Content-Security-Policy
diataxis: Example
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/gaurang_learn/pdf-toolkit-where-your-files-cant-leave-the-browser-and-the-csp-enforces-it-jgn
date: 2026-09-27
keywords:
- knowledge-base
- frontend-javascript
- programming
- examples
---
# Browser-Only PDF Processing Enforced by Content-Security-Policy

A working pattern for file-processing tools where "we don't upload your files" is not a promise but an enforced invariant. The example project (Dokwise) runs 16 PDF/image tools entirely in the browser — no backend, no account, offline after first load — and uses a strict CSP so that *any* attempt to send data out (from app code or from a dependency buried in `node_modules`) is blocked by the browser itself.

## Architecture: static site + Web Workers

There is no server to upload to — it's a static site with no API and no file-processing backend, so files cannot accidentally reach a nonexistent endpoint. Processing runs on browser-capable libraries:

| Job | Library |
|-----|---------|
| Create / merge / split / edit PDFs | `pdf-lib` |
| Render, rasterize, extract text | `pdfjs-dist` |
| Image resize / compress / convert | Canvas + `OffscreenCanvas` |
| OCR | `tesseract.js` (WASM) |
| AES-256 PDF encryption | `@pdfsmaller/pdf-encrypt` on top of native `crypto.subtle` |

Each tool is a plain config object with a `process()` function; the shell UI (drop zone, options, progress bar, download) is shared. Heavy work runs in Web Workers that receive `ArrayBuffer`s and **transfer** results back rather than copying them:

```typescript
self.onmessage = async (event: MessageEvent<MergeRequest>) => {
  const { type, files } = event.data;
  if (type !== 'merge') return;

  const bytes = await mergePdfs(
    files.map((f) => ({ name: f.name, bytes: new Uint8Array(f.buffer) })),
  );
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  self.postMessage({ type: 'success', buffer }, { transfer: [buffer] });
};
```

The `transfer` list makes the buffer a zero-cost move (the source becomes detached) instead of a structured-clone copy — important for multi-megabyte PDF payloads.

**Progress is a hard rule, not a nicety:** any operation that can take more than a second must post `{ type: 'progress', percent }`. Compressing a 200-page PDF on a phone shouldn't mean staring at a spinner wondering whether the tab froze — and since the work happens in a worker, the UI thread stays responsive regardless.

## The CSP turns the promise into an enforced rule

The production build injects:

```
default-src 'self';
script-src 'self' https://www.googletagmanager.com;
connect-src 'self' https://www.googletagmanager.com
            https://*.google-analytics.com https://*.analytics.google.com;
img-src 'self' data: blob:;
worker-src 'self' blob:;
object-src 'none';
frame-src 'none';
```

Every `fetch`, XHR, or WebSocket to a host not on the list **gets blocked by the browser** — regardless of whether the call comes from your code or from a transitive dependency. If a library quietly tries to phone home with user data, it fails loudly in the console instead of shipping silently. That is the difference between "trust us" and "the browser physically cannot send it anywhere except these hosts."

## Reusable takeaways

1. **Make privacy claims architectural, not contractual.** A static site + strict CSP means exfiltration requires a CSP change (a visible code review event), not just discipline.
2. **`connect-src` is the egress firewall for web apps.** Audit it as carefully as you'd audit an outbound network policy: every listed host is a data-exit point.
3. **Workers + `transfer`** keep large binary work off the main thread without copying memory; pair with mandatory progress messages for long operations.
4. **WASM libraries (`tesseract.js`) make heavy processing (OCR) feasible client-side**, at the cost of initial download size — acceptable when the alternative is uploading documents to a third party.

## References

- [PDF Toolkit Where Your Files Can't Leave the Browser (and the CSP Enforces It) (DEV.to)](https://dev.to/gaurang_learn/pdf-toolkit-where-your-files-cant-leave-the-browser-and-the-csp-enforces-it-jgn)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

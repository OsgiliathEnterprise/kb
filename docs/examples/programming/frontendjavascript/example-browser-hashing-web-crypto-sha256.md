---
title: 'Browser Hashing with Web Crypto: SHA-256 via crypto.subtle.digest'
diataxis: Example
domain: programming
topic: frontend-javascript
source: DEV.to Tech News
source_url: https://dev.to/gotoolsonline/sha-256-in-the-browser-with-web-crypto-and-why-md5-isnt-there-4ljk
date: 2026-11-27
keywords:
- knowledge-base
- frontend-javascript
- programming
- examples
---
# Browser Hashing with Web Crypto: SHA-256 via crypto.subtle.digest

No library needed to hash a string in the browser — `crypto.subtle.digest` has been available in every modern browser for years.

## Working snippet

```js
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

await sha256("hello");
// "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
```

The expected digest is verifiable: `echo -n hello | sha256sum` produces the same value.

## Gotchas that bite in practice

1. **It's async.** `digest()` returns a `Promise<ArrayBuffer>`, not a string — you convert to hex yourself (the `Uint8Array` + `padStart` trick above).
2. **Encoding must match the other side.** `TextEncoder` emits UTF-8. If your server hashes UTF-16 or Latin-1, digests won't match for the *same visible text*. Trailing newlines and spaces count too — a classic "why don't my checksums match" cause.
3. **Secure contexts only.** `crypto.subtle` is `undefined` on plain `http://` pages (HTTPS and `localhost` are exempt). Feature-detect before calling.
4. **Supported algorithms are exactly:** `"SHA-1"`, `"SHA-256"`, `"SHA-384"`, `"SHA-512"` — matching the [MDN SubtleCrypto.digest() contract](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest). **No MD5, deliberately**: it is broken for anything security-related. For a legacy checksum you need a small third-party library; for HMAC, use `crypto.subtle.sign()` with an HMAC key instead of hand-rolling `H(secret || msg)`.
5. **Never store passwords with a fast digest.** SHA-256 is the wrong tool — use a slow, salted algorithm server-side: bcrypt, scrypt, Argon2, or PBKDF2 via `crypto.subtle.deriveBits`.

## Right uses for a plain digest

- Cache keys and content IDs
- Comparing two blobs of text
- Checking test output against a known value

## Related

- Browser-side PDF processing with CSP (same folder): [example-browser-only-pdf-processing-with-csp-enforcement.md](example-browser-only-pdf-processing-with-csp-enforcement.md)
- Node.js implements the same [Web Crypto API](https://nodejs.org/api/webcrypto.html) — the snippet runs unmodified on recent Node versions.

## References

- [DEV.to: SHA-256 in the browser with Web Crypto (and why MD5 isn't there)](https://dev.to/gotoolsonline/sha-256-in-the-browser-with-web-crypto-and-why-md5-isnt-there-4ljk) — original snippet source
- [MDN: SubtleCrypto.digest()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest) — verified 2026-11-27: supported algorithm list and SHA-1 warning match this note; MDN also points HMAC use cases to `SubtleCrypto.sign()`

---
title: 'Decoding vs Verifying a JWT in Python: Stdlib Recipe and PyJWT'
diataxis: Example
domain: identity-security
topic: authentication
source: DEV.to Tech News
source_url: https://dev.to/dan_lumatic/how-to-decode-a-jwt-in-python-and-what-decoding-does-not-prove-1bnj
date: 2026-11-23
keywords:
- knowledge-base
- authentication
- identity-security
- examples
---
# Decoding vs Verifying a JWT in Python: Stdlib Recipe and PyJWT

A JWT is `header.payload.signature` — three base64url segments joined by dots (RFC 7519). **Decoding** is just split + base64url-decode + `json.loads`: no crypto, and it happily decodes a forged token that claims `role: admin`. The boundary where "reading a token" becomes "trusting a token" is the point of this note.

## Stdlib decode: the padding line everyone omits

base64url swaps `-`/`_` for `+`//`/` and JWTs drop trailing `=` padding; Python's `urlsafe_b64decode` **insists on padding** — the cause of most `Incorrect padding` errors.

```python
import base64, binascii, json

def b64url_json(part):
    part += "=" * (-len(part) % 4)   # the line most snippets omit
    try:
        return json.loads(base64.urlsafe_b64decode(part))
    except ValueError as exc:  # bad base64, UTF-8 and JSON all land here
        raise ValueError(f"bad JWT segment: {exc}") from exc

def decode_jwt(token):
    token = token.strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError(f"expected 3 dot-separated parts, got {len(parts)}")
    header, payload, signature = parts
    return b64url_json(header), b64url_json(payload), signature
```

The signature segment is raw bytes, not JSON — return it as a string, never parse it.

## PyJWT: one-call reader without a key

```python
import jwt  # pip install pyjwt

token = "eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyXzg2MTIiLCJyb2xlIjoiYWRtaW4ifQ."
decoded = jwt.decode_complete(token, options={"verify_signature": False})
# decoded["header"], decoded["payload"], decoded["signature"]
```

`decode_complete(..., verify_signature=False)` is the scripted version of jwt.io: no key, no `algorithms=` needed because PyJWT only demands those when verifying. Use it for debugging and logging — **never in front of an access-control decision**.

## The forged-token demonstration

A hand-built token `{"alg":"none"}` + `{"sub":"user_8612","role":"admin"}` + empty signature decodes cleanly:

```text
header:  {'alg': 'none', 'typ': 'JWT'}
payload: {'sub': 'user_8612', 'role': 'admin'}
signature segment: ''
payload says admin: True
```

No warning of any kind. The only tells are `alg: none` and the empty signature segment, visible only if you print the header. **Reading `role` from decoded JSON hands the authorization decision to whoever built the token.** Verification takes the key, an explicit `algorithms=` allowlist, plus `audience=` and `issuer=`; an HS256 allowlist refuses the `none` token with `InvalidAlgorithmError`.

**Audit grep:** search your codebase for `verify_signature`, `verify=False`, `get_unverified_`, and `b64decode` near `.split(".")`. Every hit should be logging/debugging/key lookup — if one sits in front of an `if` that grants access, you have the hole above.

Timestamp note: `exp` is epoch seconds in UTC — compare with `time.time()`.

## References

- [How to decode a JWT in Python (DEV.to)](https://dev.to/dan_lumatic/how-to-decode-a-jwt-in-python-and-what-decoding-does-not-prove-1bnj)
- [RFC 7519 — JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519)
- Related in KB: JWT structure, claims, JWS/JWE, Harden JWT against replay/tampering

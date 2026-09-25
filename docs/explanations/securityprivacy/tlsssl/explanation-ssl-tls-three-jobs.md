---
title: TLS Does Three Jobs — and a New Certificate Is Usually Not the Outage
diataxis: Explanation
domain: security-privacy
topic: tls-ssl
source: DEV.to Tech News
source_url: https://dev.to/sunshoutkernel/stop-saying-ssl-tls-only-does-three-jobs-and-your-ssl-cert-is-usually-not-the-outage-26dh
date: 2026-08-25
keywords:
- knowledge-base
- tls-ssl
- security-privacy
- explanations
---
# TLS Does Three Jobs — and a New Certificate Is Usually Not the Outage

Runbooks still say "renew the SSL certificate" when the browser warning is
**obsolete protocol**. The certificate can be brand new and the tunnel still
negotiate TLS 1.0. "SSL cert" is a vendor phrase: the file is an X.509
certificate; the handshake that uses it is **TLS** (1.2 or 1.3). SSL 3.0 is
withdrawn (POODLE and friends).

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "c0",
      "type": "rectangle",
      "x": 360,
      "y": 220,
      "width": 240,
      "height": 110,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "TLS\n(secure channel)",
        "fontSize": 20,
        "fontFamily": 1
      }
    },
    {
      "id": "c1",
      "type": "rectangle",
      "x": 60,
      "y": 60,
      "width": 260,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Encryption\n(confidentiality)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "c2",
      "type": "rectangle",
      "x": 360,
      "y": 40,
      "width": 240,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Authentication\n(who you talk to)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    {
      "id": "c3",
      "type": "rectangle",
      "x": 660,
      "y": 60,
      "width": 260,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c9e7c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": {
        "content": "Integrity\n(tamper-evidence)",
        "fontSize": 14,
        "fontFamily": 1
      }
    },
    [
      {
        "id": "c4",
        "type": "arrow",
        "x": 420,
        "y": 220,
        "width": 230,
        "height": 60,
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
            -230,
            -60
          ]
        ]
      }
    ],
    [
      {
        "id": "c5",
        "type": "arrow",
        "x": 480,
        "y": 220,
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
            -80
          ]
        ]
      }
    ],
    [
      {
        "id": "c6",
        "type": "arrow",
        "x": 540,
        "y": 220,
        "width": 250,
        "height": 60,
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
            250,
            -60
          ]
        ]
      }
    ]
  ]
}
```

## The tunnel's three jobs

1. **Confidentiality** — encryption so a tap yields no plaintext.
2. **Integrity** — a MAC (today AEAD) so a MITM cannot flip bits unnoticed.
3. **Authentication** — the certificate binds this hostname to a key a CA
   vouches for.

`https` means the bits on the wire are for that name, encrypted, and unmodified.
XSS and a malicious origin are a *different* layer.

## The outage that is not the certificate

- **Symptom:** new Let's Encrypt leaf, browsers still report obsolete TLS or
  refuse the handshake.
- **Cause:** nginx/Apache/OpenSSL still allow TLS 1.0/1.1, or the server has no
  1.2+. Renewing the certificate does nothing.

Check, do not guess:

```bash
# must FAIL
openssl s_client -connect example.com:443 -tls1
# must WORK
openssl s_client -connect example.com:443 -tls1_2
```

nginx:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
```

Keep 1.2 next to 1.3 if you still have old Android/Java; new services can prefer
1.3. One gotcha worth knowing: **nginx 1.18.0+ implicitly enables TLS 1.3**
even when `ssl_protocols` lists only `TLSv1.2` — if you see 1.3 in the
handshake that you did not configure, that is why, not a rogue client.

## Cipher line

- Key exchange: **ECDHE** (forward secrecy). Static RSA key exchange is how
  yesterday's traffic gets decrypted after a key leak.
- Bulk: **AES-GCM** or **ChaCha20-Poly1305**. CBC+HMAC keeps producing
  Lucky-Thirteen-class bugs.
- Drop: 3DES, RC4, MD5, SHA-1 as a PRF.
- Run OpenSSL 3.x LTS (1.0.2/1.1.1 are past EOL). `chmod 400` or `600` the
  private key, owned by the daemon user. Turn compression off
  (`SSL_OP_NO_COMPRESSION`) — CRIME/BREACH.

### Concrete suite list (Mozilla intermediate profile)

The widely-used "intermediate" configuration (TLS 1.2 + 1.3, works with nearly
every client from the last five years):

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256: \
ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384: \
ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
ssl_prefer_server_ciphers off;
```

Notes on this list:

- **TLS 1.3 suites are fixed** (`TLS_AES_128_GCM_SHA256`, `TLS_AES_256_GCM_SHA384`,
  `TLS_CHACHA20_POLY1305_SHA256`) and cannot be disabled individually — the
  `ssl_ciphers` line only controls the TLS 1.2 fallback.
- **Allow-list, don't block-list**: every exclusion above corresponds to a named
  attack (RC4 statistically breakable, 3DES → SWEET32, CBC padding oracles,
  static RSA = no forward secrecy). A new weak suite in a future OpenSSL version
  is never automatically permitted.
- **`ssl_prefer_server_ciphers off`** lets the client pick between AES-GCM and
  ChaCha20-Poly1305 based on which its hardware accelerates — with an all-AEAD
  list there is no "bad option" to protect against, so forcing server order buys
  nothing. Set it `on` only if you deliberately need a fixed preference.
- **Modern profile** (TLS 1.3 only) is for internal/controlled environments where
  every client supports 1.3; public services should use intermediate.

## Let's Encrypt vs OpenSSL

Let's Encrypt *issues* the certificate; OpenSSL (or BoringSSL, or the language
runtime) *runs the handshake*. Buying a cert does not harden `ssl_protocols`.

## References

- [Stop saying SSL: TLS only does three jobs (dev.to)](https://dev.to/sunshoutkernel/stop-saying-ssl-tls-only-does-three-jobs-and-your-ssl-cert-is-usually-not-the-outage-26dh)
- [nginx 1.18.0 implicitly enables TLS 1.3 (nginx mailing list)](https://mailman.nginx.org/pipermail/nginx/2020-November/060180.html)
- [OpenSSL docs: openssl-ciphers (cipher list display and selection)](https://docs.openssl.org/master/man1/openssl-ciphers/)
- [Mozilla Server Side TLS — intermediate/modern profiles](https://wiki.mozilla.org/Security/Server_Side_TLS)

## Related
- [[explanation-openai-hugging-face-agent-incident]]
- [[howto-s3-exfiltration-incident-response]]

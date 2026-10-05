---
title: Xray-core's pinnedPeerCertSha256 Certificate Verification Bypass — How Pinning
  a CA Can Enable MITM
diataxis: Explanation
domain: security-privacy
topic: tls-ssl
source: HackerNews
source_url: https://github.com/net4people/bbs/issues/672
date: 2026-10-05
keywords:
- knowledge-base
- tls-ssl
- security-privacy
- explanations
---
# Xray-core's pinnedPeerCertSha256 Certificate Verification Bypass — How Pinning a CA Can Enable MITM

This note explains the mechanism behind **GHSA-5wf9-h793-w73c** (CWE-297: Improper Validation of Certificate with Host Mismatch) in Xray-core, plus the disclosure timeline that made it notable. The core lesson: a certificate-pinning option that *replaces* standard verification can silently drop hostname validation, turning "pinning" into a man-in-the-middle (MITM) enabler rather than a defense.

## Background: two pinning options and their intent

Xray-core maintainers have long argued against the `allowInsecure` option ("skip certificate verification"), calling it equivalent to having no security at all — leaving users exposed to MITM. To let users use **self-signed certificates securely**, they offered a second layer:

- **`pinnedPeerCertificateChainSha256`** (added 2021-10-21): in addition to regular certificate verification, perform custom *certificate-chain* pinning. For self-signed certs, enabling both `allowInsecure` and this option skips the standard check but still enforces the pinned chain — a double layer.

On **2026-01-09**, Xray-core removed `pinnedPeerCertificateChainSha256` and replaced it with **`pinnedPeerCertSha256`** (pins a single certificate, not the whole chain). The stated goal was to stop users from skipping verification. But this new option contained a verification-bypass vulnerability — and because the old option was gone, users were forced onto the vulnerable one.

## The mechanism: why pinning a CA can skip hostname validation

The advisory's root cause is in `transport/internet/tls/config.go`. When you pin via `pinnedPeerCertSha256`, Xray sets `InsecureSkipVerify = true` (because Go's `crypto/tls` requires *either* `ServerName` or `InsecureSkipVerify`). The custom verification then runs:

```go
if verifyResult == foundCA {
    opts := x509.VerifyOptions{
        Roots:         CAs,               // pinned CA as the only root
        CurrentTime:   time.Now(),
        Intermediates: x509.NewCertPool(),
        DNSName:       r.Config.ServerName,  // <-- may be empty
    }
    for _, cert := range certs[1:] {
        opts.Intermediates.AddCert(cert)
    }
    if _, err := certs[0].Verify(opts); err == nil {
        return nil
    }
    return errors.New("peer cert is invalid (against pinned CA and serverName)")
}
```

The failure: **if `r.Config.ServerName` is empty, `DNSName` is empty**, so `certs[0].Verify(opts)` does *not* verify against `dNSName` or `iPAddress`. If a user pins a well-known, non-self-signed CA, an attacker can issue a leaf certificate through that same Root CA (using their own domain/IP) and hijack the connection — the pinned-CA check passes because the attacker's cert *is* signed by the trusted root.

`ServerName` is usually populated from the outbound address via `GetTLSConfig(tls.WithDestination(dest))`, but two gaps leave it empty:
1. When the destination is an **IP address** (not a domain), `ServerName` stays empty.
2. In the gRPC path (`transport/internet/grpc/dial.go`), `GetTLSConfig()` is called *without* `tls.WithDestination(dest)`, so even for a domain, `ServerName` can be left empty unless explicitly set.

The result: pinning a CA + an empty `ServerName` = the leaf's hostname is never checked → MITM succeeds. The advisory demonstrates it with two certs (`server1.crt` for 127.0.0.1, `server2.crt` for 127.0.0.2) issued by the same CA: expected behavior is a failed connection, actual behavior is a successful one.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "x1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "pinnedPeerCertSha256 set\n=> InsecureSkipVerify=true\nServerName may be empty (IP dest)", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "x2",
      "type": "rectangle",
      "x": 300,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "foundCA branch:\nVerify(DNSName=ServerName)\nempty DNSName => no host check", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "x3",
      "type": "rectangle",
      "x": 560,
      "y": 60,
      "width": 200,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9e0a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "attacker leaf signed by\npinned Root CA passes\n=> MITM succeeds (CWE-297)", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "xa1",
        "type": "arrow",
        "x": 240,
        "y": 105,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [60, 0]]
      }
    ],
    [
      {
        "id": "xa2",
        "type": "arrow",
        "x": 500,
        "y": 105,
        "width": 60,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [[0, 0], [60, 0]]
      }
    ]
  ]
}
```

## The disclosure timeline (why it's a process story too)

- **2021-10-21** — `pinnedPeerCertificateChainSha256` added (secure double-layer).
- **2026-01-09** — replaced by `pinnedPeerCertSha256`; old option removed, forcing migration.
- **2026-01-13** — first release containing the bypass vulnerability (v26.1.13).
- **2026-01-16** — logic changed so `pinnedPeerCertSha256` *always* skips regular verification, leaving only the custom pinning layer; if that layer is vulnerable, there's effectively no certificate verification at all.
- **2026-02-06** — reporter privately reports the bypass (an attacker could insert a leaf cert anywhere in the chain and have it verify). Xray-core silently fixes it the same day with a commit message claiming to "simplify the code," ships v26.2.6 without mentioning the vulnerability, and posts a public statement about designing security at the core — while users remained exposed.
- **2026-07-03** — reporter finds the fix is *incomplete* (verification can still be bypassed under certain circumstances) and files it via GitHub Security Advisory to prevent re-concealment. By then, users had been unwittingly exposed for nearly half a year.

The fix that finally closed it: **commit 64fada3** ("TLS client: Pinning CA must have `serverName` (or higher-priority `verifyPeerCertByName` or outbound's `address`) for `pinnedPeerCertSha256`") — i.e., require a non-empty hostname to validate against when pinning a CA.

## Key takeaways

- **Pinning is not a substitute for standard verification.** A pin that sets `InsecureSkipVerify=true` and then relies on an empty `DNSName` drops the hostname check entirely.
- **CA pinning + IP destinations are the dangerous combination** — no domain means nothing to validate against.
- **Defense in depth matters:** keep regular certificate verification *in addition* to any custom pinning, rather than replacing it.
- **Disclosure hygiene is a security property.** A silently shipped fix with an obfuscated commit message leaves users exposed; responsible disclosure + clear advisories let operators upgrade and mitigate.

## References

- [GHSA-5wf9-h793-w73c — Pinning a CA certificate via pinnedPeerCertSha256 can lead to MITM (Hy2, gRPC)](https://github.com/XTLS/Xray-core/security/advisories/GHSA-5wf9-h793-w73c)
- [Reporter's full timeline write-up — net4people/bbs issue #672](https://github.com/net4people/bbs/issues/672)
- [Fix commit 64fada3 — require serverName for pinned CA pinning (#6472)](https://github.com/XTLS/Xray-core/commit/64fada32b5b9e6ae064a038fa0e4e2b766499bd5)
- [CWE-297 — Improper Validation of Certificate with Host Mismatch](https://cwe.mitre.org/data/definitions/297.html)

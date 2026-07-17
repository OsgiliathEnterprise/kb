---
title: Post-Quantum Hybrid Key Exchange in JDK 27 (JEP 527)
diataxis: Explanation
domain: DevSecOps
topic: Cryptography
source: Inside Java
source_url: https://inside.java/2026/05/17/quality-heads-up/
date: 2026-07-17
keywords:
- knowledge-base
- Cryptography
- DevSecOps
- explanations
---
# Post-Quantum Hybrid Key Exchange in JDK 27 (JEP 527)

## Overview

**JEP 527** introduces hybrid post-quantum key exchange to TLS 1.3 in JDK 27. This protects Java applications against "harvest-now, decrypt-later" attacks by combining traditional elliptic-curve key algorithms with quantum-resistant ML-KEM (Module-Lattice-based Key Encapsulation Mechanism).

Java applications using standard `javax.net.ssl` APIs benefit **by default, without code changes**, as long as they do not override the TLS named groups.

## The Threat: Harvest-Now, Decrypt-Later

Attackers can record encrypted TLS traffic today and decrypt it later when quantum computers are powerful enough to break current elliptic-curve cryptography (ECC). This is called a **harvest-now, decrypt-later** attack.

| Aspect | Traditional TLS | Post-Quantum Hybrid TLS |
|--------|----------------|------------------------|
| Key exchange | ECDHE (X25519, secp256r1, secp384r1) | ECDHE + ML-KEM (hybrid) |
| Quantum resistance | ❌ Vulnerable to future quantum attacks | ✅ Resistant to quantum attacks |
| Backward compatibility | Full | Full (hybrid preserves classical security) |
| Performance impact | Baseline | Slight overhead from ML-KEM computation |

## How Hybrid Key Exchange Works

A hybrid key exchange combines two independent key exchange mechanisms:

```
Client                          Server
  |                                |
  |--- KeyShare (X25519) --------->|
  |--- KeyShare (ML-KEM-768) ----->|
  |                                |
  |<-- KeyShare (X25519) ---------|
  |<-- KeyShare (ML-KEM-768) -----|
  |                                |
  |  Derive shared secret from BOTH |
  |                                |
  |--- Encrypted handshake ------->|
```

If either component is broken, the other still protects the session. This provides defense-in-depth against both classical and quantum adversaries.

## Three Hybrid Key Exchange Options in JDK 27

JDK 27 adds three hybrid schemes through the SunJSSE provider:

| Named Group | Classical Component | Quantum-Resistant Component | Security Level |
|-------------|-------------------|---------------------------|---------------|
| `X25519MLKEM768` | ECDHE with X25519 | ML-KEM-768 | NIST Level 1 (~128-bit) |
| `SecP256r1MLKEM768` | ECDHE with secp256r1 | ML-KEM-768 | NIST Level 1 (~128-bit) |
| `SecP384r1MLKEM1024` | ECDHE with secp384r1 | ML-KEM-1024 | NIST Level 3 (~192-bit) |

**Default behavior**: JDK 27 enables `X25519MLKEM768` alongside existing classical key exchange algorithms. TLS clients offer both a hybrid `X25519MLKEM768` key share and a traditional `x25519` key share.

## Configuration

### Default (No Code Changes)

Applications using standard TLS APIs automatically get post-quantum protection:

```java
// This now uses hybrid key exchange by default in JDK 27
SSLContext context = SSLContext.getDefault();
SSLSocket socket = (SSLSocket) context.getSocketFactory()
    .createSocket("example.com", 443);
```

### Custom Named Groups

Override the defaults via system property:

```bash
java -Djdk.tls.namedGroups=X25519MLKEM768,SecP384r1MLKEM1024,x25519 MyApp
```

### Programmatic Configuration

```java
SSLSocket tlsSocket = (SSLSocket) SSLContext.getDefault()
        .getSocketFactory()
        .createSocket();

SSLParameters params = tlsSocket.getSSLParameters();

params.setNamedGroups(new String[] {
        "SecP384r1MLKEM1024",
        "X25519MLKEM768",
        "secp384r1",
        "x25519"
});

tlsSocket.setSSLParameters(params);
```

### System Property Configuration

```properties
# Enable only hybrid groups (no fallback to classical-only)
jdk.tls.namedGroups=X25519MLKEM768,SecP256r1MLKEM768,SecP384r1MLKEM1024

# Mixed approach (hybrid preferred, classical fallback)
jdk.tls.namedGroups=X25519MLKEM768,secp384r1,x25519
```

## ML-KEM Background

ML-KEM (formerly known as Kyber) is a lattice-based key encapsulation mechanism standardized by NIST as part of its post-quantum cryptography standardization project:

- **Based on**: Module Learning With Errors (MLWE) problem
- **Security levels**: ML-KEM-512 (Level 1), ML-KEM-768 (Level 3), ML-KEM-1024 (Level 5)
- **Key sizes**: Larger than ECC but manageable (e.g., ML-KEM-768 public key ≈ 1184 bytes)
- **Performance**: Moderate CPU overhead, acceptable for TLS handshakes

## Migration Strategy

| Phase | Action | Risk Level |
|-------|--------|-----------|
| **Phase 1** | Enable JDK 27 with defaults (hybrid + classical) | Low (backward compatible) |
| **Phase 2** | Monitor handshake success rates and latency | Low |
| **Phase 3** | Test with `jdk.tls.namedGroups` restricting to hybrid-only | Medium (some servers may not support) |
| **Phase 4** | Deploy hybrid-only configuration | Depends on server compatibility |

## Compatibility Considerations

- **Server support**: The remote TLS server must support the hybrid named groups. If not, the handshake falls back to classical ECDHE
- **TLS 1.3 only**: Post-quantum key exchange is only available in TLS 1.3 (not TLS 1.2)
- **Performance impact**: Slight increase in handshake latency due to ML-KEM computation (typically &lt;50ms additional overhead)

## Excalidraw Diagram

```excalidraw
* Excalidraw below
* You can draw in the message, and call draw_excalidraw to update the drawing
* When you send messages, include the drawing in the response to me so that I can see your drawings
* I can edit settings with Excalidraw+ settings, or draw text by starting lines with '> '

{"type":"default","values":{"appScale":1.0,"pageId":"p1","pages":{"p1":{"id":"p1","type":"tumbleweed","name":"Page 1","width":2200,"height":2200,"gridSize":20,"backgroundImageSrc":null,"backgroundImageSelectedZoomLevel":0,"isEmpty":false}},"exportPadding":120,"toView":null,"gridSettings":{"customSize":20,"circular":false,"type":"square","dashed":true},"viewBackgroundColor":"#FFFFFF","theme":"dark","strokeColor":"#e6422c","backgroundColor":"#FFFFFF","fontSize":20,"font":"Cascadia","strokeWidth":2,"roughness":0,"seed":117588423,"view":null,"gridMode":false,"gridModeEnabled":false,"gridStep":5,"gridCounter":3}}
text {"id":"1","x":500.0,"y":80.0,"text":"JDK 27 Hybrid TLS 1.3 Handshake","fontSize":24,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aV","seed":149553083,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"2","x":150.0,"y":180.0,"text":"Client","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aW","seed":154724707,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"3","x":700.0,"y":180.0,"text":"Server","fontSize":20,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aX","seed":134999955,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"4","x":150.0,"y":240.0,"text":"ClientHello","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aY","seed":150582691,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"5","x":150.0,"y":270.0,"text:"- KeyShare(X25519)","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"aZ","seed":163038390,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"6","x":150.0,"y":295.0,"text:"- KeyShare(ML-KEM-768)","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"ba","seed":163038403,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"7","x":300.0,"y":260.0,"points":"[0,0],[1,0]","startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bb","seed":277501699,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"8","x":700.0,"y":240.0,"text":"ServerHello","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bc","seed":163038404,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"9","x":700.0,"y":270.0,"text:"- KeyShare(X25519)","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bd","seed":163038405,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"10","x":700.0,"y":295.0,"text:"- KeyShare(ML-KEM-768)","fontSize":14,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"be","seed":163038406,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
arrow {"id":"11","x":700.0,"y":330.0,"points":"[0,0],[-1,0]","startArrowhead":null,"endArrowhead":"arrow","strokeColor":"#b3b3b3","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bf","seed":163038407,"groupIds":[],"roundness":{"type":2},"status":"active","strokeSharpness":"sharp","optionsId":"default"}
text {"id":"12","x":400.0,"y":400.0,"text":"Shared Secret = ECC_secret XOR ML-KEM_secret","fontSize":18,"fontFamily":1,"type":"text","strokeColor":"#457b9d","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bg","seed":163038408,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"13","x":400.0,"y":450.0,"text":"Encrypted handshake proceeds with TLS 1.3","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#2c2d34","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bh","seed":163038409,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"14","x":400.0,"y":520.0,"text":"Defense-in-depth: If ECC is broken by quantum","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bi","seed":163038410,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
text {"id":"15","x":400.0,"y":550.0,"text":"computing, ML-KEM still protects the session","fontSize":16,"fontFamily":1,"type":"text","strokeColor":"#e6422c","backgroundColor":"transparent","fillStyle":"fill","strokeWidth":2,"strokeStyle":"solid","roughness":0,"index":"bj","seed":163038411,"groupIds":[],"roundness":{"type":0},"status":"active","autoSize":false,"strokeSharpness":"sharp","optionsId":"default"}
```

## References

- [JEP 527: Post-Quantum Hybrid Key Exchange for TLS 1.3](https://openjdk.org/jeps/527)
- [Original Article: Quality Outreach Heads-up - JDK 27: Post-Quantum Hybrid Key Exchange for TLS 1.3](https://inside.java/2026/05/17/quality-heads-up/)
- [NIST ML-KEM Standard](https://csrc.nist.gov/pubs/fips/203/final)
- [JDK 27 Early-Access Builds](https://jdk.java.net/27/)
- [OpenJDK Security Mailing List](https://mail.openjdk.org/mailman/listinfo/security-dev)

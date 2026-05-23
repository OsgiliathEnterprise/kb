---
title: 'JDK 27 Post-Quantum TLS: Hybrid Key Exchange with ML-KEM'
diataxis: Explanation
domain: Programming
topic: Java & Spring
source: ''
source_url: https://inside.java/2026/05/17/quality-heads-up/
keywords:
- knowledge-base
- Java & Spring
- Programming
- reference
---
# JDK 27 Post-Quantum TLS: Hybrid Key Exchange with ML-KEM

## Overview

[JEP 527](https://openjdk.org/jeps/527) has been integrated in JDK 27 early-access builds, bringing **hybrid post-quantum key exchange** to TLS 1.3. This improves Java's TLS implementation by combining traditional elliptic-curve key algorithms with quantum-resistant ML-KEM, helping protect against future **harvest-now, decrypt-later** threats.

## What Is Harvest-Now, Decrypt-Later?

Attackers collect encrypted traffic today, storing it until quantum computers are powerful enough to break current encryption. Post-quantum cryptography protects against this by using algorithms resistant to quantum attacks.

## Hybrid Key Exchange Schemes

JDK 27 adds three hybrid key exchange options through the SunJSSE provider:

| Scheme | Classical Algorithm | Post-Quantum Algorithm |
|--------|-------------------|----------------------|
| `X25519MLKEM768` | ECDHE with X25519 | ML-KEM-768 |
| `SecP256r1MLKEM768` | ECDHE with secp256r1 | ML-KEM-768 |
| `SecP384r1MLKEM1024` | ECDHE with secp384r1 | ML-KEM-1024 |

### Default Behavior
By default, JDK 27 enables `X25519MLKEM768` alongside existing classical key exchange algorithms. TLS clients offer both a hybrid `X25519MLKEM768` key share and a traditional `x25519` key share.

## Configuration

### Via System Property
```bash
java -Djdk.tls.namedGroups=X25519MLKEM768,secp384r1,x25519 MyApp
```

### Programmatically
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

### No Code Changes Required
Java applications using standard `javax.net.ssl` APIs benefit by default, as long as they do not override the TLS named groups.

## Migration Considerations

### Backward Compatibility
- Hybrid schemes work alongside classical algorithms
- If the peer doesn't support post-quantum, the connection falls back to classical ECDHE
- No breaking changes for existing TLS clients/servers

### Testing Recommendations
1. Download [JDK 27 early-access builds](https://jdk.java.net/27/)
2. Test TLS connections with and without named group overrides
3. Verify fallback behavior with non-PQC peers
4. Share feedback via [security-dev OpenJDK mailing list](https://mail.openjdk.org/mailman/listinfo/security-dev)

### Security Implications
- **Defense in depth:** Even if one algorithm is broken, the other remains secure
- **Quantum readiness:** Protects against future quantum computing threats
- **Performance impact:** Minimal overhead from hybrid key exchange

## Implementation Details

### ML-KEM Background
ML-KEM (Module-Lattice-based Key Encapsulation Mechanism) is the NIST-standardized post-quantum algorithm (FIPS 203). It is based on lattice cryptography, which is believed to be resistant to both classical and quantum attacks.

### Key Sizes
| ML-KEM Level | Security Level | Key Size |
|-------------|---------------|----------|
| ML-KEM-512 | ~128-bit | Smallest |
| ML-KEM-768 | ~192-bit | Default (JDK 27) |
| ML-KEM-1024 | ~256-bit | Highest |

## References

- [JEP 527: Post-Quantum Hybrid Key Exchange for TLS 1.3](https://openjdk.org/jeps/527) (OpenJDK)
- [Quality Outreach Heads-up - JDK 27: Post-Quantum Hybrid Key Exchange](https://inside.java/2026/05/17/quality-heads-up/) (Inside Java, 2026-05-17)
- [Java 27: Post-Quantum Cryptography](https://deepwiki.com/wesleyegberto/java-new-features/12.2-java-27:-post-quantum-cryptography) (DeepWiki)
- [NIST FIPS 203: ML-KEM](https://csrc.nist.gov/pubs/fips/203/final) (NIST)
- [Post-Quantum TLS with Apache Camel example](https://github.com/oscerd/camel-pqc-tls) (GitHub)

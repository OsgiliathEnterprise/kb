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
- explanations
---
# JDK 27 Post-Quantum TLS: Hybrid Key Exchange with ML-KEM

## Overview

[JEP 527](https://openjdk.org/jeps/527) has been integrated in JDK 27 early-access builds, bringing **hybrid post-quantum key exchange** to TLS 1.3. This improves Java's TLS implementation by combining traditional elliptic-curve key algorithms with quantum-resistant ML-KEM, helping protect against future **harvest-now, decrypt-later** threats.

## What Is Harvest-Now, Decrypt-Later?

Attackers collect encrypted traffic today, storing it until quantum computers are powerful enough to break current encryption. Post-quantum cryptography protects against this by using algorithms resistant to quantum attacks.

### The Urgency

- **State actor threat:** Some analysts predict state actors may have quantum decryption capabilities as early as 2028
- **NIST deadlines:** RSA, ECDSA, EdDSA, DH, and ECDH will be **deprecated by 2030** and **completely disallowed by 2035**
- **Enterprise migration timeline:** Large enterprises require 12–15 years for complete PQC migration — teams starting in 2025 face a 3–5 year window where significant infrastructure remains vulnerable
- **Data sensitivity:** Financial records, healthcare data, and government communications need confidentiality for a decade or more — traffic exchanged today could be sitting in an attacker's archive

## The Java PQC Roadmap

Java's post-quantum story spans multiple JDK releases:

| JDK Version | JEP | Feature | Status |
|-------------|-----|---------|--------|
| **JDK 21** (Sep 2023) | JEP 452 | KEM (Key Encapsulation Mechanism) API — the foundation | GA |
| **JDK 24** (Mar 2024) | JEP 496 | ML-KEM algorithm implementation (FIPS 203) | GA |
| **JDK 24** (Mar 2024) | JEP 497 | ML-DSA digital signatures | GA |
| **JDK 27** (Sep 2026) | JEP 527 | Hybrid TLS 1.3 key exchange | Targeted |

**Important:** JDK 24 provides the cryptographic primitives (ML-KEM, ML-DSA) but does NOT integrate them into TLS by default. JEP 527 in JDK 27 fills that gap — enabling post-quantum protection for actual network traffic.

### What "Hybrid" Actually Means

Rather than switching from traditional algorithms to quantum-resistant ones all at once (which introduces compatibility risks), the hybrid approach uses **both**. A hybrid key exchange scheme combines a quantum-resistant algorithm with a traditional algorithm, and is secure as long as **one** of the algorithms remains unbroken:

- If ML-KEM has an undiscovered weakness → traditional ECDHE still protects you
- If ECDHE eventually falls to quantum attacks → ML-KEM covers you

Neither is a single point of failure.

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

## Enterprise Migration Guidance

### What Teams Should Do Now

1. **Inventory TLS endpoints:** Map all services using TLS 1.3 and identify those handling long-lived sensitive data (financial, healthcare, government)
2. **Test with early-access builds:** Use JDK 27 EA builds to validate hybrid key exchange in your environments before GA
3. **Plan the upgrade path:** JDK 27 GA is scheduled for September 2026 — factor this into your release planning
4. **Verify peer support:** Confirm that downstream clients and upstream servers support hybrid key exchange (or will gracefully fall back)
5. **Monitor NIST timeline:** Track NIST deprecation deadlines — RSA/ECDSA deprecated by 2030, disallowed by 2035

### For High-Security Environments

Teams handling particularly sensitive data should consider:
- Enforcing hybrid schemes exclusively via `SSLParameters::setNamedGroups`
- Using `SecP384r1MLKEM1024` (highest security level) instead of the default `X25519MLKEM768`
- Combining with certificate pinning and mutual TLS for defense in depth

### The Bigger Picture

JDK 27 with JEP 527 is the most impactful PQC milestone for the majority of Java enterprise teams. Unlike JEP 496 (which provides primitives that require manual integration), JEP 527 works transparently — upgrading the JDK itself is a meaningful security improvement with zero code changes.

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

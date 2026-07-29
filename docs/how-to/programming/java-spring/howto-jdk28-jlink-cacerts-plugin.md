---
title: 'JDK 28: Selective CA Certificates with jlink cacerts Plugin'
diataxis: How-to Guide
domain: Programming
topic: Java & Spring
source: inside.java
source_url: https://inside.java/2026/07/28/quality-heads-up/
date: 2026-07-29
keywords:
- knowledge-base
- Java & Spring
- Programming
- how-to
---
# JDK 28: Selective CA Certificates with jlink cacerts Plugin

## The Problem: Bloated Trust Stores in Custom Runtimes

When creating custom Java runtime images with `jlink`, the default `cacerts` keystore includes **all** CA certificates shipped with the JDK — often hundreds of certificates from certificate authorities your application will never use. This adds unnecessary size and attack surface to minimal runtime images.

## The Solution: `--cacerts` Plugin

JDK 28 introduces a new `jlink` plugin that lets you specify exactly which CA certificates to include in your custom runtime image's `cacerts` keystore.

### Basic Syntax

```bash
jlink --add-modules java.base \
  --cacerts "letsencryptisrgx1 [jdk]" \
  --output my-runtime
```

The `--cacerts` option takes **one or more keystore aliases**, separated by commas. Each alias can optionally include a source qualifier like `[jdk]` to reference certificates from the JDK's default trust store.

### Including Multiple Certificates

```bash
jlink --add-modules java.base,jdk.crypto.ec \
  --cacerts "letsencryptisrgx1 [jdk],digicertglobalrootca [jdk]" \
  --output my-runtime
```

This creates a runtime image that trusts **only** Let's Encrypt ISRG Root X1 and DigiCert Global Root CA — dramatically reducing the trust store footprint.

### Finding Available Aliases

To discover which CA certificate aliases are available in your JDK's default keystore:

```bash
keytool -list -keystore $JAVA_HOME/lib/security/cacerts \
  -storepass changeit | grep -i "trustedcertentry"
```

### Use Cases

| Scenario | Benefit |
|----------|---------|
| **Container images** | Smaller image size, faster startup |
| **Air-gapped environments** | Only include certificates your internal CAs chain to |
| **Compliance** | Explicitly declare trusted CAs for audit purposes |
| **Minimal runtimes** | Align with the principle of least privilege for trust stores |

### How It Works

The `jlink` plugin filters the default `cacerts` keystore at image-creation time, copying only the specified aliases into the new runtime image's keystore. The resulting `cacerts` file is a valid Java keystore that the JVM loads at startup.

## References

- [JDK-8377102: jlink plugin for selective cacerts](https://bugs.openjdk.org/browse/JDK-8377102)
- [Inside.java Quality Outreach Heads-up - JDK 28](https://inside.java/2026/07/28/quality-heads-up/)

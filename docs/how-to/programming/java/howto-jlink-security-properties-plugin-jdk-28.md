---
title: Baking Security Properties into a Custom Runtime with the JDK 28 jlink Plugin
diataxis: How-to Guide
domain: programming
topic: java
source: inside java
source_url: https://inside.java/2026/11/25/quality-heads-up/
date: 2026-11-25
keywords:
- knowledge-base
- java
- programming
- how-to
---
# Baking Security Properties into a Custom Runtime with the JDK 28 jlink Plugin

As of **JDK 28**, `jlink` gains a `security-properties` plugin so a custom runtime image can ship with the `java.security` settings your application actually needs — instead of relying on a global `JAVA_HOME/conf/security/java.security` or a `java.security.properties` override at launch time. Announced as an OpenJDK Quality Outreach heads-up on 2026-11-25; tracked as **JDK-8381580**.

## The basic recipe

Create a properties file, e.g. `network-security.properties`:

```properties
networkaddress.cache.ttl=60
```

Pass it at image-creation time:

```bash
"$JAVA_HOME/bin/jlink" \
  --module-path "$JAVA_HOME/jmods" \
  --add-modules java.base \
  --security-properties=network-security.properties \
  --output custom-runtime
```

The generated `custom-runtime/conf/security/java.security` now contains:

```properties
networkaddress.cache.ttl=60
```

The plugin **updates matching properties** in the image's `java.security` and **appends new ones** — so you can both tighten an existing default and introduce a property the stock file never mentioned.

## Resolution rules to know before you rely on it

| Situation | Behaviour |
|---|---|
| Comments in the supplied file | Ignored by the plugin |
| Same property repeated in the supplied file | **Last value wins** |
| Supplied file contains an `include` statement | Placed at the **end** of the generated configuration; `jlink` copies the statement **without requiring the named file to exist on the build machine** — supply it later on the target system |
| Original `java.security` contains duplicate properties or `include` statements | **Error** — the build fails |

The `include` behaviour is the interesting one for CI: it lets a build pipeline produce a runtime whose final security configuration is completed on the target host, so environment-specific policy never has to be baked into a shared image. The trade-off is that the image's effective security configuration is no longer fully determined by the build artifact — plan for a verification step that reads `conf/security/java.security` out of the produced image (or the running container) and diffs it against the intended set.

## When to prefer this over the alternatives

- **Vs `-Djava.security.properties=file` at launch:** image-level config is tamper-evident with image signing and does not depend on every launcher getting the flag right. Launch flags are silently dropped by the first wrapper script, entrypoint, or IDE run config.
- **Vs patching the base image's `java.security` with `sed`:** the plugin uses the documented merge semantics above (update-or-append) rather than textual edits that break on JDK upgrades.
- **Vs a global policy file:** custom runtimes are per-application, so a hardening change cannot regress a neighbour JVM on the same host.

This fits the same operational shape as the container-runtime work already in this topic: build a minimal runtime with `jlink --add-modules` (see the jdeps/JShell toolchain notes in `programming/java/Java-Modules`), then pin its security defaults in the same build step.

## Validation checklist

1. `grep` the generated `custom-runtime/conf/security/java.security` for every property you intended to set — confirm the value, not just the key's presence.
2. Confirm no property was silently dropped because of a typo'd key (appends go to the end of the file; a mismatched key is a new, dead property).
3. If you used `include`, assert the target-system file exists before rollout, otherwise that portion of policy is simply absent.
4. Test on an early-access JDK 28 build — this is a Quality Outreach item, so behaviour may still move before GA.

## References

- [JDK 28: New jlink Security Properties Plugin — Quality Outreach Heads-up (Inside Java, 2026-11-25)](https://inside.java/2026/11/25/quality-heads-up/)
- [JDK-8381580 — JIRA issue for the security-properties plugin](https://bugs.openjdk.org/browse/JDK-8381580)
- [OpenJDK Quality Outreach program](https://wiki.openjdk.org/display/quality/Quality+Outreach)

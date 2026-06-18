---
title: 'The Death of the React Native Bridge: Moving from JSON to JSI in 2026'
diataxis: Explanation
domain: Software-Engineering
topic: Mobile-Architecture
source: ''
source_url: https://dev.to/subraatakumar/the-death-of-the-react-native-bridge-moving-from-json-to-jsi-in-2026-2614
keywords:
- knowledge-base
- Mobile-Architecture
- Software-Engineering
- explanations
---
# The Death of the React Native Bridge: Moving from JSON to JSI in 2026

## Overview

React Native has completed its transition away from the legacy JSON-based native bridge to the JavaScript Interface (JSI). As of React Native 0.85 (April 2026), the old bridge code has been entirely removed from the framework. This tutorial covers the architectural shift, migration implications, and what developers need to know about the new JSI-powered architecture.

## The Legacy Bridge: How It Worked

The React Native Bridge was a message broker between the JavaScript thread and native threads (iOS/Android):

1. **Serialization**: JavaScript converts actions/data into JSON strings
2. **Asynchronous Transport**: JSON payload sent across the bridge asynchronously
3. **Deserialization**: Native side decodes JSON and executes platform actions

### When Custom Native Bridges Were Required

- Accessing unsupported hardware (advanced camera, biometrics, custom Bluetooth)
- Integrating third-party native SDKs (payment gateways, analytics, ad networks)
- Reusing existing native code during migration
- High-performance heavy lifting (image processing, audio, complex DB ops)
- Custom UI renders not achievable with standard cross-platform components

### The Fundamental Problem

The bridge was **asynchronous** and relied on **JSON serialization**, causing:
- UI thread contention and laggy updates
- Performance bottlenecks in rapid interactions
- Memory overhead from serializing/deserializing data
- Inability to handle synchronous native calls

## The Transition Timeline

| Version | Release | Status |
|---|---|---|
| **0.68** | March 2022 | JSI introduced — experimental opt-in for New Architecture |
| **0.73** | Late 2023 | Bridgeless Mode introduced as experimental opt-in |
| **0.76** | October 2024 | **Default shift** — JSI/New Architecture on by default; old bridge moved to interop layer |
| **0.82** | October 2025 | **Old architecture disabled** — `newArchEnabled=false` flag removed |
| **0.85** | April 2026 | **Complete removal** — legacy bridge code deleted entirely |

## What Is JSI?

The JavaScript Interface (JSI) allows JavaScript to hold **direct C++ memory references** to native methods, enabling:

- **Synchronous execution** — no more async serialization delays
- **Zero-copy communication** — direct memory access between JS and native
- **Reduced overhead** — eliminates JSON serialization/deserialization
- **Improved performance** — faster UI updates, lower memory usage

## The Four Pillars of the New Architecture

### 1. JSI (JavaScript Interface)
The core foundation — direct C++ memory references for synchronous JS-to-native calls.

### 2. TurboModules
Replacement for legacy native modules. TurboModules use JSI to call C++ functions directly, providing instant synchronous execution without JSON serialization.

### 3. Fabric (Renderer)
New rendering system that replaces the old UI manager. Fabric enables synchronous UI updates and better integration with native platform rendering.

### 4. Codegen
Automatic code generation for type-safe native module interfaces, reducing boilerplate and ensuring type consistency.

## Migration: What Is Gone vs. What Replaces It

### ❌ What No Longer Works

- `RCTBridgeModule` (iOS) — removed
- `ReactContextBaseJavaModule` (Android) — removed
- Any code relying on serialized JSON data passing — broken
- Interop layer for legacy bridge modules — fully deleted

### ✅ What You Must Use Instead

- **Turbo Native Modules** — for custom native code
- **Fabric Components** — for custom UI components
- **Codegen** — for type-safe native interfaces

## Practical Impact by Audience

### For App Developers
If your project targets React Native 0.85+, any internal native code written using the old bridge format **must be rewritten** as TurboModules.

### For Third-Party Library Maintainers
Any community npm package that has not updated to support the New Architecture **will break or crash** builds on RN 0.85+.

### For Teams in Migration
The bridge is available as a compatibility layer in versions 0.76–0.81, but this is a **temporary** solution. Plan your migration early.

## Why Learning the Legacy Bridge Still Matters

Understanding the old JSON bridge teaches fundamental concepts about:
- How cross-platform frameworks handle inter-process communication (IPC)
- The trade-offs between synchronous and asynchronous communication
- Why serialization bottlenecks matter in mobile performance
- The architectural evolution of React Native

## RN 0.85 Impact Summary

As confirmed by field engineering analysis (923, May 2026), RN 0.85 removed:
- All fallback bridge code
- The interoperability layer for legacy bridge modules
- Any compatibility shim

**Key finding**: Every app and library targeting RN 0.85+ must run on the New Architecture — there is no alternative path. Teams that delayed migration past RN 0.81 (when the bridge compatibility layer was last available) face mandatory rewrites of all custom native modules.

## Architecture Comparison Diagram

```
excalidraw-start
[{"type":"text","x":100,"y":50,"size":[400,30],"label":"OLD ARCHITECTURE (Bridge — Removed in RN 0.85)"}]
[{"type":"rectangle","x":100,"y":100,"size":[150,60],"label":"JavaScript\nThread"}]
[{"type":"rectangle","x":350,"y":100,"size":[150,60],"label":"JSON Bridge\n(Async Serialization)"}]
[{"type":"rectangle","x":600,"y":100,"size":[150,60],"label":"Native Thread\n(iOS/Android)"}]
[{"type":"arrow","x1":250,"y1":130,"x2":350,"y2":130","label":"JSON payload"}]
[{"type":"arrow","x1":500,"y1":130,"x2":600,"y2":130","label":"Decoded call"}]
[{"type":"text","x":100,"y":250,"size":[400,30],"label":"NEW ARCHITECTURE (JSI — Default since RN 0.76)"}]
[{"type":"rectangle","x":100,"y":300,"size":[150,60],"label":"JavaScript\nThread"}]
[{"type":"rectangle","x":350,"y":300,"size":[150,60],"label":"JSI\n(Direct C++ refs)"}]
[{"type":"rectangle","x":600,"y":300,"size":[150,60],"label":"Native Thread\n(iOS/Android)"}]
[{"type":"arrow","x1":250,"y1":330,"x2":350,"y2":330","label":"Sync call"}]
[{"type":"arrow","x1":500,"y1":330,"x2":600,"y2":330","label":"Direct exec"}]
excalidraw-end
```

## Key Migration Checklist

- [ ] Audit all custom native modules for bridge dependencies
- [ ] Update third-party libraries to New Architecture-compatible versions
- [ ] Rewrite `RCTBridgeModule` implementations as TurboModules
- [ ] Rewrite `ReactContextBaseJavaModule` implementations as TurboModules
- [ ] Test Fabric component compatibility for custom UI
- [ ] Enable Codegen for type-safe native interfaces
- [ ] Verify Hermes engine compatibility (default JS engine)

## References

- [DEV.to: The Death of the React Native Bridge](https://dev.to/subraatakumar/the-death-of-the-react-native-bridge-moving-from-json-to-jsi-in-2026-2614)
- [React Native New Architecture Migration Guide (2026)](https://www.agilesoftlabs.com/blog/2026/03/react-native-new-architecture-migration)
- [React Native JSI Deep Dive — Bridge vs JSI](https://heartit.tech/react-native-jsi-deep-dive-part-2-the-bridge-is-dead-long-live-jsi/)
- [React Native 0.76 Release Notes](https://github.com/facebook/react-native/releases)
- [923: React Native 0.85 — What the Bridge Removal Means](https://www.ninetwothree.co/blog/react-native-0-85-bridge-removal)
- [React Native 0.85 Release Blog](https://reactnative.dev/blog/2026/04/07/react-native-0.85)

---
title: Better Tools for Immutable Data in Java
diataxis: Explanation
domain: programming
topic: java
source: Inside Java
source_url: https://inside.java/2026/06/21/better-tools-immutable-data/
date: 2026-09-12
keywords:
- knowledge-base
- java
- programming
- explanations
---
# Better Tools for Immutable Data in Java

Summary of Dan Smith's (Oracle, Java Platform Group) JavaOne 2026 talk reviewing the stack of new and upcoming language and JVM features that make immutable data more convenient, more reliable, and cheaper at runtime. The features come from **Project Valhalla** (value classes/objects, value records) and **Project Amber** (record patterns, deconstructors, flexible constructor bodies, the lazy constants API, and diagnostics around `static final` field initialization).

## The problem with mutable data

Every reference in a mutable object is a lie you might later break: two threads can read different values at different times, and an object handed to a library can be mutated behind its back. The canonical Java pattern — `final` fields set once in the constructor — is correct but verbose and, more importantly, invisible to the VM: the compiler/JIT cannot assume a reference is never reassigned or that the object it points at never changes, so it misses optimization opportunities (escape analysis, devirtualization, hoisting loads).

Immutable data gets you:
- **Correctness**: no synchronization needed for shared state.
- **Performance**: the JIT can inline, hoist, and devirtualize against stable shapes.
- **Interoperability**: safe to pass into other people's code.

The historical gap: Java only had `final`-field convention until records (JDK 14/16), and records are *shallowly* immutable — the components are final, but the component values can still be mutable objects.

## Feature stack

### Records and record patterns

Records give canonical immutable classes: `record Color(int r, int g, int b)`. Record patterns let you destructure:

```java
record Point(int x, int y) {}

var dist2 = switch (p) {
    case Point(int x, int y) -> x * x + y * y;
};
```

**Derived record creation** (new) extends this: an expression that takes a record, deconstructs it, modifies selected components, and reconstructs — a `with`-style copy. All the language needs is a constructor whose signature matches the component list, which is exactly what records provide (and, via deconstructors, what value classes will provide).

### Value classes and objects (JEP 401, Valhalla)

Value classes remove object indirection: value data can be inlined at the use site (like a primitive) while still being a real type with methods. **Value records** combine both — a record whose components are value objects. Value classes are *shallowly immutable* at the same level as records.

Two hard constraints that differentiate value classes:
1. **Early field initialization only** — fields must be fully initialized in the constructor body and never changed afterward. Unsafe reflective mutation and legacy deserialization are **not allowed** (a hard break, unlike other classes).
2. Fields of a value class must be initialized early and not changed — the JVM relies on this for its inlining optimizations.

### Early field initialization with flexible constructor bodies

Currently, field initializers run before the constructor body; this feature lets you move field initialization into the constructor body (and adds **abstract records** to the mix — records with abstract methods, usable as pattern-switch base types).

### Lazy constants API

A preview API (JEP 334 line of work) that finalizes in the near future, expected to land around **JDK 28** alongside JEP 401 and JEP 539 (Strict Field Initialization in the JVM). It expresses "compute this final field once, later, thread-safely":

```java
// Sketch of the idea: a final field with a lambda supplier,
// read through a get() method; the lambda runs at most once,
// and the VM knows the value is stable after first access.
static final Lazy<String> EXPENSIVE = Lazy.of(() -> computeOnce());
// ...
String value = EXPENSIVE.get(); // computed on first read, then cached
```

Why use it instead of hand-rolling `if (field == null) field = ...`:
- **Concurrency is handled for you** — the supplier is guaranteed to run exactly once under correct memory visibility.
- **The VM knows about it** — the "once set, never changes" invariant is visible to the JIT, enabling optimizations your hand-rolled version cannot get.

### Initialization diagnostics for `static final` fields

New diagnostics make it easier to catch initialization-order bugs in `static final` fields (the classic "static field reads a field that hasn't been initialized yet" failure), which is the main footgun of eager static initialization.

### Unsafe reflective mutation: deprecation path

The classic hack — `Field.setAccessible(true)` followed by `field.set(...)` on a final field — is how deserializers and some libraries bypass constructors. The new behavior:
- Mutating a final field this way will **throw `IllegalAccessError`** once the feature completes.
- Rollout is gradual: **warnings first**, then errors, with a command-line flag to re-enable the legacy behavior — no hard break for most code.
- **Value classes are the exception**: no legacy path at all; fields must be initialized early and never mutated.

### Deserialization and the marshalling API

Java's native serialization is inconvenient for immutable classes: it creates the object *without invoking any constructor*, caches it, runs arbitrary code against the uninitialized instance, and only then pokes the fields. Records already fixed this with a clean protocol — deserialize components, invoke the constructor, only then publish the fully-constructed instance into the cache. The plan is to extend that protocol to all classes, so class authors can be certain every live instance went through a constructor (and thus passed validation).

The **marshalling API** (coming, intended to replace `java.io.Serializable`) will use the same constructor-based construction protocol.

### Final arrays (on the horizon)

Arrays are mutable even when everything around them is not. The planned feature: a `final` modifier on array *creation expressions* — the type stays a regular array type, but the runtime representation carries a flag that makes any write attempt fail (an additional check on top of the usual array store check). Combined with "everything mutable at first, then immutable," this needs a declarative way to describe contents: copy-from-another-array, fill, or lambda-derived strategies.

## Best practices summary

1. **Prefer value record classes**; if you can't use either, declare **deconstructors** as the fallback.
2. **Prefer value classes** where indirection hurts.
3. Use **abstract records** as pattern-switch query bases.
4. **Finalize fields during construction** (early initialization).
5. Use **lazy constants** instead of hand-rolled lazy `static final` fields.
6. **Prefer final arrays** with declarative array creation wherever possible.

Caveat from the talk: everything in the "future features" section is still in flux; these are the intended shapes, not committed APIs.

## Roadmap anchors

| Item | Status (mid-2026) |
| --- | --- |
| Records, record patterns | Standard since JDK 14/16 |
| Lazy constants API | Preview now; finalization expected |
| JEP 401 Value Objects (Preview) | Integrated, targeted at **JDK 28** |
| JEP 539 Strict Field Initialization in the JVM (Preview) | Integrated, targeted at **JDK 28** |
| Marshalling API | Coming; replaces `Serializable` protocol for immutable classes |
| Final arrays | Planned; `final` on array creation expressions |

## Diagram
```excalidraw
{
  "type": "excalidraw",
  "version": 2,
  "source": "hermes-agent",
  "elements": [
    {
      "type": "text",
      "id": "title",
      "x": 320,
      "y": 40,
      "width": 560,
      "height": 28,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 1,
      "version": 1,
      "versionNonce": 1,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Java Immutable Data: Feature Stack (JavaOne 2026)",
      "fontSize": 24,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 22,
      "containerId": null,
      "originalText": "Java Immutable Data: Feature Stack (JavaOne 2026)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "box-records",
      "x": 60,
      "y": 100,
      "width": 420,
      "height": 80,
      "angle": 0,
      "strokeColor": "#2b7a2b",
      "backgroundColor": "#a5d8a5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 2,
      "version": 1,
      "versionNonce": 2,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "text-records",
      "x": 75,
      "y": 115,
      "width": 390,
      "height": 50,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 3,
      "version": 1,
      "versionNonce": 3,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Records + record patterns (JDK 14/16)
- canonical immutable classes
- destructure via case Point(int x, int y)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 12,
      "containerId": null,
      "originalText": "Records + record patterns (JDK 14/16)
- canonical immutable classes
- destructure via case Point(int x, int y)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "box-valhalla",
      "x": 60,
      "y": 200,
      "width": 420,
      "height": 80,
      "angle": 0,
      "strokeColor": "#8a4baf",
      "backgroundColor": "#d0a9e0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 4,
      "version": 1,
      "versionNonce": 4,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "text-valhalla",
      "x": 75,
      "y": 215,
      "width": 390,
      "height": 50,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 5,
      "version": 1,
      "versionNonce": 5,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Value classes / value objects (JEP 401, Valhalla)
- inlined data, no reference indirection
- early field initialization ONLY, no reflective mutation",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 12,
      "containerId": null,
      "originalText": "Value classes / value objects (JEP 401, Valhalla)
- inlined data, no reference indirection
- early field initialization ONLY, no reflective mutation",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "box-amber",
      "x": 60,
      "y": 300,
      "width": 420,
      "height": 80,
      "angle": 0,
      "strokeColor": "#c77800",
      "backgroundColor": "#ffd8a8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 6,
      "version": 1,
      "versionNonce": 6,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "text-amber",
      "x": 75,
      "y": 315,
      "width": 390,
      "height": 50,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 7,
      "version": 1,
      "versionNonce": 7,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Amber: derived record creation, deconstructors,
flexible constructor bodies, lazy constants API,
static final init diagnostics",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 12,
      "containerId": null,
      "originalText": "Amber: derived record creation, deconstructors,
flexible constructor bodies, lazy constants API,
static final init diagnostics",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "box-jvm",
      "x": 60,
      "y": 400,
      "width": 420,
      "height": 80,
      "angle": 0,
      "strokeColor": "#1e6091",
      "backgroundColor": "#96d1ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 8,
      "version": 1,
      "versionNonce": 8,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "text-jvm",
      "x": 75,
      "y": 415,
      "width": 390,
      "height": 50,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 9,
      "version": 1,
      "versionNonce": 9,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "JVM-level (JDK 28 target):
JEP 401 Value Objects (Preview)
JEP 539 Strict Field Initialization (Preview)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 12,
      "containerId": null,
      "originalText": "JVM-level (JDK 28 target):
JEP 401 Value Objects (Preview)
JEP 539 Strict Field Initialization (Preview)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "box-safety",
      "x": 560,
      "y": 100,
      "width": 440,
      "height": 80,
      "angle": 0,
      "strokeColor": "#b3400e",
      "backgroundColor": "#ffc9a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 10,
      "version": 1,
      "versionNonce": 10,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "text-safety",
      "x": 575,
      "y": 115,
      "width": 410,
      "height": 50,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 11,
      "version": 1,
      "versionNonce": 11,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Safety hardening:
- reflective final-field mutation -> IllegalAccessError
- gradual: warnings first, then errors (legacy flag)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 12,
      "containerId": null,
      "originalText": "Safety hardening:
- reflective final-field mutation -> IllegalAccessError
- gradual: warnings first, then errors (legacy flag)",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "box-serialization",
      "x": 560,
      "y": 200,
      "width": 440,
      "height": 80,
      "angle": 0,
      "strokeColor": "#b3400e",
      "backgroundColor": "#ffc9a3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 12,
      "version": 1,
      "versionNonce": 12,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "text-serialization",
      "x": 575,
      "y": 215,
      "width": 410,
      "height": 50,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 13,
      "version": 1,
      "versionNonce": 13,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Serialization overhaul:
- constructor-based protocol (deserialize fields ->
  invoke constructor -> publish), marshalling API replaces
  java.io.Serializable",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 12,
      "containerId": null,
      "originalText": "Serialization overhaul:
- constructor-based protocol (deserialize fields ->
  invoke constructor -> publish), marshalling API replaces
  java.io.Serializable",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "box-arrays",
      "x": 560,
      "y": 300,
      "width": 440,
      "height": 80,
      "angle": 0,
      "strokeColor": "#1e6091",
      "backgroundColor": "#96d1ff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 3},
      "seed": 14,
      "version": 1,
      "versionNonce": 14,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "text-arrays",
      "x": 575,
      "y": 315,
      "width": 410,
      "height": 50,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 15,
      "version": 1,
      "versionNonce": 15,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Final arrays (planned):
- final on array creation expressions
- declarative contents (copy / fill / lambda-derived)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 12,
      "containerId": null,
      "originalText": "Final arrays (planned):
- final on array creation expressions
- declarative contents (copy / fill / lambda-derived)",
      "lineHeight": 1.25
    },
    {
      "type": "text",
      "id": "text-best-practices",
      "x": 60,
      "y": 510,
      "width": 940,
      "height": 60,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": 16,
      "version": 1,
      "versionNonce": 16,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Best practices: prefer value record classes -> deconstructors as fallback -> abstract records for pattern switches
-> finalize fields during construction -> lazy constants over hand-rolled lazy statics -> final arrays with declarative creation",
      "fontSize": 16,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 14,
      "containerId": null,
      "originalText": "Best practices: prefer value record classes -> deconstructors as fallback -> abstract records for pattern switches
-> finalize fields during construction -> lazy constants over hand-rolled lazy statics -> final arrays with declarative creation",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "arrow-1",
      "x": 270,
      "y": 180,
      "width": 0,
      "height": 20,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 17,
      "version": 1,
      "versionNonce": 17,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [[0, 0], [0, 20]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "arrow",
      "id": "arrow-2",
      "x": 270,
      "y": 280,
      "width": 0,
      "height": 20,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 18,
      "version": 1,
      "versionNonce": 18,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [[0, 0], [0, 20]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "arrow",
      "id": "arrow-3",
      "x": 270,
      "y": 380,
      "width": 0,
      "height": 20,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {"type": 2},
      "seed": 19,
      "version": 1,
      "versionNonce": 19,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [[0, 0], [0, 20]],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    }
  ],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  }
}
```
&lt;!-- Java Immutable Data feature stack -->
## References

- [Better Tools for Immutable Data — Inside Java (talk announcement)](https://inside.java/2026/06/21/better-tools-immutable-data/)
- [Dan Smith: Better Tools for Immutable Data — JavaOne 2026 video](https://www.youtube.com/watch?v=BdLND9D81lI)
- [JavaOne 2026 session page](https://dev.java/community/javaone-2026/sessions/)
- [Project Valhalla documentation](https://github.com/openjdk/valhalla-docs)
- [JEP 401: Value Objects (Preview)](https://openjdk.org/jeps/401)
- [JEP 539: Strict Field Initialization in the JVM (Preview)](https://openjdk.org/jeps/539)

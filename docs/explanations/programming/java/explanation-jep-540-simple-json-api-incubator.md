---
title: JEP 540 — Simple JSON API (Incubator) Targeted to JDK 28
diataxis: Explanation
domain: programming
topic: java
source: inside java
source_url: https://inside.java/2026/10/02/jep549-target-jdk28/
date: 2026-10-03
keywords:
- knowledge-base
- java
- programming
- explanations
---
# JEP 540 — Simple JSON API (Incubator) Targeted to JDK 28

JDK 28 will ship a standard, built-in API for parsing and generating JSON documents: **JEP 540, "Simple JSON API"**, delivered as the incubating `jdk.incubator.json` module. The [Inside Java announcement](https://inside.java/2026/10/02/jep549-target-jdk28/) (Oct 2) points to the full JEP at openjdk.org; the JEP itself is now **Integrated** (status updated Sept 2026), with the implementation PR [openjdk/jdk#32282](https://github.com/openjdk/jdk/pull/32282) (JDK-8344154 / JDK-8381976, ~+5,400 lines across 34 files) merged into the JDK.

## Why: JSON without an external library

The JEP supersedes [JEP 198](https://openjdk.org/jeps/198), *Light-Weight JSON API*, written in 2014 — circumstances changed, so it takes a different approach. The motivation is parity with other languages: extracting data from a REST response or reading a config file should be as simple in Java as in Python or Go, without installing Jackson/Gson/Jakarta JSON-P.

Goals (deliberately narrow):

- Standard means to process [RFC 8259](https://www.rfc-editor.org/info/rfc8259/) compliant JSON with low ceremony.
- Small API: only the types and operations required for strict RFC 8259 conformance — **no data binding, no streaming, no syntax extensions (JSON5 etc.), no multiple parsing configurations**.
- Code that navigates a known structure should read as a *de facto schema*.
- Fail fast with clear errors to support exploratory work on unfamiliar documents.

Non-goal: it is not meant to supplant established external libraries — Jackson and friends remain the right tools for binding, streaming, and extended syntaxes. A secondary motivation is enabling JSON inside the JDK itself (e.g. structured configuration files instead of `Properties` workarounds like sequentially numbered keys).

## The API shape

The API is organized around a **sealed** `JsonValue` interface with exactly six sub-interfaces mirroring JSON's six value kinds:

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "j1",
      "type": "rectangle",
      "x": 340,
      "y": 40,
      "width": 260,
      "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "JsonValue (sealed)\nJson.parse(String) → tree\nstrict RFC 8259 only", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "j2",
      "type": "rectangle",
      "x": 40,
      "y": 200,
      "width": 150,
      "height": 60,
      "strokeColor": "#2980b9",
      "backgroundColor": "#d5f5e3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "JsonString\n→ String", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "j3",
      "type": "rectangle",
      "x": 205,
      "y": 200,
      "width": 150,
      "height": 60,
      "strokeColor": "#2980b9",
      "backgroundColor": "#d5f5e3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "JsonNumber\n→ int/long/double...", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "j4",
      "type": "rectangle",
      "x": 370,
      "y": 200,
      "width": 150,
      "height": 60,
      "strokeColor": "#2980b9",
      "backgroundColor": "#d5f5e3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "JsonBoolean\n→ boolean", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "j5",
      "type": "rectangle",
      "x": 535,
      "y": 200,
      "width": 150,
      "height": 60,
      "strokeColor": "#2980b9",
      "backgroundColor": "#d5f5e3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "JsonNull\nsingleton", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "j6",
      "type": "rectangle",
      "x": 700,
      "y": 200,
      "width": 150,
      "height": 60,
      "strokeColor": "#8e44ad",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "JsonObject\nmembers by name", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "j7",
      "type": "rectangle",
      "x": 865,
      "y": 200,
      "width": 150,
      "height": 60,
      "strokeColor": "#8e44ad",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "JsonArray\nelements by index", "fontSize": 13, "fontFamily": 1 }
    },
    {
      "id": "j8",
      "type": "arrow",
      "x": 470,
      "y": 110,
      "width": 0,
      "height": 90,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "points": [[0, 0], [0, 90]]
    }
  ]
}
```

Because `JsonValue` is sealed, exhaustive `switch` expressions over it need no `default` clause. Parsing is strict: the document must conform to RFC 8259 — no trailing commas, no comments, and **no duplicate object member names** (a policy choice for maximum interoperability). Parse failures throw unchecked `JsonParseException`.

## Usage

Parse + navigate in a few lines (the JEP's National Weather Service example):

```java
JsonValue json = Json.parse(body);
json.get("properties").get("periods").asList().stream()
    .mapToInt(j -> j.get("temperature").asInt())
    .average()
    .ifPresent(IO::println);
```

Generation is symmetric — `JsonObject.of(...)`, `JsonArray.of(...)`, `JsonString.of(...)` compose into a printable document:

```java
IO.println(JsonObject.of(Map.of("providers",
    JsonArray.of(List.of(JsonString.of("SUN"),
                         JsonString.of("SunRsaSign"),
                         JsonString.of("SunEC"))))));
// {"providers":["SUN","SunRsaSign","SunEC"]}
```

## Enabling the incubator module

The API ships **disabled by default** — it must be enabled at both compile time and run time:

```bash
$ java --add-modules jdk.incubator.json Weather.java
WARNING: Using incubator modules: jdk.incubator.json
53.357142857142854

$ javac --add-modules jdk.incubator.json Weather.java
$ java  --add-modules jdk.incubator.json Weather
```

`jshell --add-modules jdk.incubator.json` works for interactive exploration. As an incubating API, `jdk.incubator.json` may change incompatibly or be removed in a future release — the incubation period is meant to gather feedback on the navigation model, exception semantics, numeric conversions, and construction ergonomics before it advances further.

## Design constraints worth knowing

- **Tree-based, in-memory only**: input must fit as a `String`/`char[]`, and so must the parsed result — no file/network streaming sources by design (minimalist philosophy).
- **Canonical forms only**: rigorous testing against the [JSON Parsing Test Suite](https://github.com/nst/JSONTestSuite) ensures only canonical RFC 8259 JSON parses/generates, avoiding inconsistencies with other libraries.
- **Risk acknowledged**: applications already using external JSON libraries may end up mixing both — judged acceptable given the low-ceremony benefit for simple tasks.

## References

- [JEP targeted to JDK 28: 540: Simple JSON API (Incubator) — Inside Java](https://inside.java/2026/10/02/jep549-target-jdk28/)
- [JEP 540 full text — OpenJDK](https://openjdk.org/jeps/540)
- [Implementation PR openjdk/jdk#32282 (JDK-8381976)](https://github.com/openjdk/jdk/pull/32282)
- [InfoQ — JEP 540 Proposed to Target JDK 28 with a Simple JSON API](https://www.infoq.com/news/2026/08/java-native-json-api/)

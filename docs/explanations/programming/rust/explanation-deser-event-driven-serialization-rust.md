---
title: 'Deser: Rethinking Rust Serialization with an Event-Driven Sink Architecture'
diataxis: Explanation
domain: programming
topic: rust
source: HackerNews
source_url: https://lucumr.pocoo.org/2026/9/29/deser/
date: 2026-09-30
keywords:
- knowledge-base
- rust
- programming
- explanations
---
# Deser: Rethinking Rust Serialization with an Event-Driven Sink Architecture

Armin Ronacher (Sentry) revived his 2022 experiment **Deser** — a serialization
library that keeps Serde's derive-based user experience but replaces its
architecture with an event-driven design inspired by dtolnay's miniserde and
years of processing untrusted JSON at Sentry Relay. It is explicitly *not*
aimed at replacing Serde (the orphan rule entrenches Serde too deeply); it is a
drop-in alternative whose tradeoffs may suit specific workloads, plus a design
reference for the space.

## The three Serde design decisions that cause pain

Serde's limitations fall out of three choices, all protected by its stability
guarantees:

1. **One set of traits for all formats** — self-describing (JSON/YAML/TOML) and
   non-self-describing (bincode/protobuf/postcard) share the same API, so some
   features only work with some formats, discovered at runtime.
2. **A fixed data model that loses information when buffering** — internally
   tagged enums, untagged enums, and `flatten` must buffer values; the buffer
   can't hold everything the format knew (error locations are lost), and
   extensions rely on in-band signalling with magic keys.
3. **Recursion on the call stack** — every nesting level consumes stack space;
   formats guard with recursion limits, but code paths without one (writing,
   dynamic values) can take down the process on deeply nested data.

### Concrete corner cases

```rust
// 1. A number that is a map: internally tagged enum + arbitrary_precision
#[derive(Deserialize)]
#[serde(tag = "type")]
enum Shape { Circle { radius: f64 } }

serde_json::from_str::<Shape>(r#"{"type": "Circle", "radius": 1.5}"#)
// error: invalid type: map, expected f64
// serde_json signals arbitrary-precision numbers as a map with a magic key;
// the tag buffer doesn't know about it. Feature unification means any crate
// in the graph can turn this on.

// 2. Flattening breaks integer keys
#[derive(Deserialize)]
struct Report { name: String, #[serde(flatten)] stats: Stats }
// {"name": "x", "scores": {"42": 23}} fails with u32 keys once flatten
// buffers the value — "42" is just a string in the buffer.

// 3. Adapters do not compose
#[serde(deserialize_with = "from_hex")] accent: Option<u32>
// E0308: a function can't be passed as a type parameter, so from_hex cannot
// apply inside Option/Vec/map — you hand-write from_opt_hex per wrapper.
```

## The Deser architecture: format drives, types receive

In Serde the **type** drives deserialization (a `Deserialize` impl asks the
format for values; nested handling recurses). Deser inverts this: the **format
tells the type what comes next and pushes events into a sink**. When a sink
hits a nested value it doesn't recurse — it hands back a new sink to a driver,
which keeps all state on the heap (in an arena). On serialization, emitters
return their nested values instead of recursing.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "s1",
      "type": "rectangle",
      "x": 40,
      "y": 60,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Serde: type drives\nvisitor callbacks recurse", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "s2",
      "type": "rectangle",
      "x": 300,
      "y": 60,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#f9d3d3",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "stack grows per\nnesting level", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "d1",
      "type": "rectangle",
      "x": 40,
      "y": 260,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#c4e0f2",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Deser: format emits\nevents into sinks", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "d2",
      "type": "rectangle",
      "x": 300,
      "y": 260,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "nested value ->\nnew sink to driver", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "d3",
      "type": "rectangle",
      "x": 560,
      "y": 260,
      "width": 200,
      "height": 80,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#d9ccff",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "driver keeps state\non heap (arena)", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "a1",
        "type": "arrow",
        "x": 240,
        "y": 300,
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
        "id": "a2",
        "type": "arrow",
        "x": 500,
        "y": 300,
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

### Consequences of the design

- **No stack overflows** — arbitrary nesting is safe; limits are set with a
  layer, independent of stack space.
- **Suspendable and `Send`** — state lives in the driver, so deserialization
  can be fed input as it arrives (streaming JSON/CBOR/MessagePack) and moved
  between threads while waiting on IO (tokio-friendly).
- **Extensible data model without magic keys** — core is atoms/maps/sequences;
  extension values (`DateTime`, `Uuid`, ...) carry fallbacks for formats that
  don't understand them, replacing in-band signalling.
- **Lossless buffering** — buffered events keep everything the format knew:
  protocol-specific extensions and error locations survive.
- **Layers as middleware** — sit between format and types to track paths,
  enforce limits, rename keys, or redact values without touching code paths.

### What it gives up

- **Non-self-describing formats are intentionally unsupported** (protobuf,
  bincode) — the design can't express "reader must know the type upfront".
- **Runtime cost of dynamic dispatch + heap sinks**: JSON reads range from 33%
  faster to 60% slower than `serde_json` depending on data (~10% slower on
  average); writes are a wash (3x faster to 70% slower). YAML/TOML are
  noticeably faster than the Serde-based crates. Compile times slightly better
  than Serde; binary bloat worse.
- **Internal `unsafe`** — mostly to keep chains of borrowed sinks on the heap.

## Coverage and ecosystem

Formats: JSON, JSONC, JSON5, HJSON (all generated from one shared parser
template), CBOR, MessagePack, YAML 1.1/1.2, TOML, XML (which Serde declined to
support), all three Apple plist flavors, CSV/TSV, urlencoded, environment
variables. Add-ons: `deser-path` (path tracking), `deser-location`,
`deser-validate` (validate-as-you-parse), `deser-serde` (bridge),
`deser-value` (dynamic values), `deser-transcode` (format-to-format),
`deser-tokio`.

## Key takeaways

- Serde's corner cases are design consequences, not bugs — and its stability
  guarantees make them unfixable in place.
- Inverting control (events into sinks vs. visitor recursion) buys stack
  safety, suspendability, lossless buffering, and a clean middleware story at
  the price of allocation-heavy dynamic dispatch.
- The orphan rule means Serde is entrenched; Deser's realistic role is targeted
  adoption (untrusted/streaming input, XML/plist needs) and design inspiration.

## References

- [Deser: Rethinking Rust Serialization — Armin Ronacher](https://lucumr.pocoo.org/2026/9/29/deser/)
- [mitsuhiko/deser on GitHub](https://github.com/mitsuhiko/deser)
- [SERDE.md — collected Serde design challenges](https://github.com/mitsuhiko/deser/blob/main/SERDE.md)
- [deser::de API docs (sinks, slots, layers)](https://docs.rs/deser/latest/deser/de/index.html)

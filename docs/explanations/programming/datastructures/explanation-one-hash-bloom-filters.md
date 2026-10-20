---
title: 'One-Hash Bloom Filters: Single Hash, k Coprime Partitions, Cache-Aligned Blocks
  (gloom)'
diataxis: Explanation
domain: programming
topic: data-structures
source: Jim Calabro's Blog (Bluesky)
source_url: https://calabro.io/ohbf
date: 2026-10-20
keywords:
- knowledge-base
- data-structures
- programming
- explanations
---
# One-Hash Bloom Filters: Single Hash, k Coprime Partitions, Cache-Aligned Blocks (gloom)

A [bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) answers *"is key X in this set?"* with either
*"definitely not"* or *"probably"* — you pick a false positive rate, add keys, check later. Small memory for large
sets, computationally cheap: a database may keep an in-memory bloom filter and check it before hitting slow disk.

In the **Bluesky** backend, bloom filters save **millions of queries per second** against the Scylla database for
blocks, mutes, labels, and more — *"does user X block user Y?"* is often answered without touching the database. The
production positive rate sits around **1%**, meaning 99% of lookups skip the database entirely.

## From k hashes to two to one

- **Traditional**: an array of bits + k independent hash functions; add a key by setting the k bits at the k
  locations, check by requiring all k bits set.
- **Double hashing** (Kirsch & Mitzenmacher, 2008): derive the i-th location as `(hash_1 + i*hash_2) % n` —
  effectively the same false positive rate as k independent hashes.
- **One hashing** (Lu et al.): split the bit array into **k partitions of fixed, pairwise-coprime sizes** (no two
  sizes share a common factor other than one); hash the key **once** to `hash`; the bit position in partition p is
  `hash % size_p`. One hash yields k bit positions to check, used exactly like any other bloom filter.

## Production history at Bluesky

1. `bits-and-blooms/bloom` (Daniel Lemire) — double-hash Go implementation: runs 128-bit murmur3 twice to get four
   64-bit values, combined to produce all k locations. Used for a long time.
   - Problem: **not internally thread-safe** — all access wrapped in a `sync` mutex. The Bluesky backend loads all
     blocks/mutes/list items on process start while a real-time atproto firehose consumer inserts concurrently, so
     the race is real. pprof showed **mutex contention was the bottleneck of process launch: a single deploy took 90
     minutes to roll out**.
   - Fix: Jasmine forked it into **`atomic-bloom`** (`jazware/atomic-bloom`), using `sync/atomic` CPU instructions
     for the same logic without mutexes → **deploys dropped from 90 minutes to about 15**.
2. **`jcalabro/gloom`** — the one-hash implementation (OHBF) in Go. Live in the Bluesky backend for 9+ months and
   used in **jetstream** (Bluesky's high-performance sync service).

### Amdahl's Law caveat

For Bluesky specifically, going from two hashes to one did **not** help: contention was the original bottleneck, not
the number of hash functions — by Amdahl's law there was no noticeable speedup. The one-hash design is worth
*knowing* and using where hash cost dominates.

## API

```go
import "github.com/jcalabro/gloom"

// Thread-safe atomic bloom filter:
//   - expected capacity of 1 million items
//   - approximate false positive rate of 1%
f := gloom.NewAtomic(1_000_000, 0.01)

// f.TestString(str) -> bool   // "probably in the set"
// f.AddString(str)            // add key
```

## Under the hood

```go
hash  := xxh3.Hash128(key) // 128-bit hash
block := hash.Hi % numBlocks // high 64 bits pick the block
h     := hash.Lo            // low 64 bits are the hash checked per partition
```

Three performance techniques on top of the single hash:

1. **64-byte blocks matching the CPU cache line size.** Go's allocator doesn't guarantee those allocations are cache
   aligned, so gloom slightly over-allocates and uses `unsafe` to align them. Together with the block layout this
   guarantees that in the **worst case a lookup takes only one cache miss**.
2. **Fast block selection** (Lemire's [modulo-reduction alternative](https://lemire.me/blog/2016/06/27/a-fast-alternative-to-the-modulo-reduction/)):
   pick the block with a **single `MUL` instruction** instead of an expensive division.
3. **`ShardedAtomicFilter`**: spreads writes across many backing filter shards, reducing the chance that multiple
   cores fight over the same data — important on a large fleet of top-of-line bare-metal servers.

## Related

- Roaring bitmaps (Lemire) are the other data structure that "makes the world go around" for high-throughput
  membership work.
- See also the production context: in-memory negative caches in front of a distributed database.

## References

- [One Hash Bloom Filters (Jim Calabro, Bluesky)](https://calabro.io/ohbf)
- [jcalabro/gloom (Go OHBF implementation)](https://github.com/jcalabro/gloom)
- [jazware/atomic-bloom (lock-free double-hash bloom)](https://github.com/jazware/atomic-bloom)
- [Kirsch & Mitzenmacher, "On the Equivalence of Bloom Filters" (2008)](https://www.eecs.harvard.edu/~michaelm/postscripts/rsa2008.pdf)
- [Lu et al., One Hashing (bloom filter paper)](https://yangtonghome.github.io/uploads/One_Hashing.pdf)
- [Lemire, fast alternative to modulo reduction](https://lemire.me/blog/2016/06/27/a-fast-alternative-to-the-modulo-reduction/)
- [bits-and-blooms/bloom](https://github.com/bits-and-blooms/bloom)

## Diagram
```excalidraw
{
  "type": "excalidraw",
  "version": 2,
  "source": "kb-pipeline",
  "elements": [
    {
      "type": "text",
      "id": "t-1",
      "x": 80,
      "y": 30,
      "width": 600,
      "height": 30,
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
      "seed": "s-2",
      "version": 1,
      "versionNonce": "v-3",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "One-Hash Bloom Filter (gloom): 1 Hash -> k Positions",
      "fontSize": 24,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 19,
      "containerId": null,
      "originalText": "One-Hash Bloom Filter (gloom): 1 Hash -> k Positions",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "oh-k",
      "x": 60,
      "y": 140,
      "width": 160,
      "height": 60,
      "angle": 0,
      "strokeColor": "#2b5a8c",
      "backgroundColor": "#cfe0f0",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-4",
      "version": 1,
      "versionNonce": "v-5",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "oh-kt",
      "x": 90,
      "y": 160,
      "width": 40,
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
      "roundness": null,
      "seed": "s-6",
      "version": 1,
      "versionNonce": "v-7",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "key",
      "fontSize": 16,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 12,
      "containerId": null,
      "originalText": "key",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "oh-h",
      "x": 320,
      "y": 140,
      "width": 300,
      "height": 60,
      "angle": 0,
      "strokeColor": "#8c5a2b",
      "backgroundColor": "#f0e0cf",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-8",
      "version": 1,
      "versionNonce": "v-9",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "oh-ht",
      "x": 335,
      "y": 158,
      "width": 460,
      "height": 52,
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
      "seed": "s-10",
      "version": 1,
      "versionNonce": "v-11",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "single xxh3.Hash128\nHi -> block (MUL, no div)\nLo -> h",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "single xxh3.Hash128\nHi -> block (MUL, no div)\nLo -> h",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "oh-a1",
      "x": 220,
      "y": 170,
      "width": 100,
      "height": 1,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-12",
      "version": 1,
      "versionNonce": "v-13",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          100,
          0
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "text",
      "id": "oh-a1t",
      "x": 230,
      "y": 145,
      "width": 72,
      "height": 16,
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
      "seed": "s-14",
      "version": 1,
      "versionNonce": "v-15",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "hash once",
      "fontSize": 13,
      "fontFamily": 1,
      "textAlign": "left",
      "verticalAlign": "top",
      "baseline": 10,
      "containerId": null,
      "originalText": "hash once",
      "lineHeight": 1.25
    },
    {
      "type": "rectangle",
      "id": "oh-p0",
      "x": 70,
      "y": 290,
      "width": 110,
      "height": 50,
      "angle": 0,
      "strokeColor": "#2b7a2b",
      "backgroundColor": "#d8f0d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-16",
      "version": 1,
      "versionNonce": "v-17",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "oh-pt0",
      "x": 85,
      "y": 305,
      "width": 60,
      "height": 17,
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
      "seed": "s-18",
      "version": 1,
      "versionNonce": "v-19",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "P0 (s0)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "P0 (s0)",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "oh-ap0",
      "x": 470,
      "y": 200,
      "width": 345,
      "height": 90,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-20",
      "version": 1,
      "versionNonce": "v-21",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          -345,
          90
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "rectangle",
      "id": "oh-p1",
      "x": 200,
      "y": 290,
      "width": 110,
      "height": 50,
      "angle": 0,
      "strokeColor": "#2b7a2b",
      "backgroundColor": "#d8f0d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-22",
      "version": 1,
      "versionNonce": "v-23",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "oh-pt1",
      "x": 215,
      "y": 305,
      "width": 60,
      "height": 17,
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
      "seed": "s-24",
      "version": 1,
      "versionNonce": "v-25",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "P1 (s1)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "P1 (s1)",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "oh-ap1",
      "x": 470,
      "y": 200,
      "width": 215,
      "height": 90,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-26",
      "version": 1,
      "versionNonce": "v-27",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          -215,
          90
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "rectangle",
      "id": "oh-p2",
      "x": 330,
      "y": 290,
      "width": 110,
      "height": 50,
      "angle": 0,
      "strokeColor": "#2b7a2b",
      "backgroundColor": "#d8f0d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-28",
      "version": 1,
      "versionNonce": "v-29",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "oh-pt2",
      "x": 345,
      "y": 305,
      "width": 60,
      "height": 17,
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
      "seed": "s-30",
      "version": 1,
      "versionNonce": "v-31",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "P2 (s2)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "P2 (s2)",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "oh-ap2",
      "x": 470,
      "y": 200,
      "width": 85,
      "height": 90,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-32",
      "version": 1,
      "versionNonce": "v-33",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          -85,
          90
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "rectangle",
      "id": "oh-p3",
      "x": 460,
      "y": 290,
      "width": 110,
      "height": 50,
      "angle": 0,
      "strokeColor": "#2b7a2b",
      "backgroundColor": "#d8f0d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-34",
      "version": 1,
      "versionNonce": "v-35",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "oh-pt3",
      "x": 475,
      "y": 305,
      "width": 60,
      "height": 17,
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
      "seed": "s-36",
      "version": 1,
      "versionNonce": "v-37",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "P3 (s3)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "P3 (s3)",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "oh-ap3",
      "x": 470,
      "y": 200,
      "width": 45,
      "height": 90,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-38",
      "version": 1,
      "versionNonce": "v-39",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          45,
          90
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "rectangle",
      "id": "oh-p4",
      "x": 590,
      "y": 290,
      "width": 110,
      "height": 50,
      "angle": 0,
      "strokeColor": "#2b7a2b",
      "backgroundColor": "#d8f0d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-40",
      "version": 1,
      "versionNonce": "v-41",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "oh-pt4",
      "x": 605,
      "y": 305,
      "width": 40,
      "height": 17,
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
      "seed": "s-42",
      "version": 1,
      "versionNonce": "v-43",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "...",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "...",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "oh-ap4",
      "x": 470,
      "y": 200,
      "width": 175,
      "height": 90,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-44",
      "version": 1,
      "versionNonce": "v-45",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          175,
          90
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "rectangle",
      "id": "oh-p5",
      "x": 720,
      "y": 290,
      "width": 110,
      "height": 50,
      "angle": 0,
      "strokeColor": "#2b7a2b",
      "backgroundColor": "#d8f0d8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "seed": "s-46",
      "version": 1,
      "versionNonce": "v-47",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1
    },
    {
      "type": "text",
      "id": "oh-pt5",
      "x": 735,
      "y": 305,
      "width": 95,
      "height": 17,
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
      "seed": "s-48",
      "version": 1,
      "versionNonce": "v-49",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "Pk-1 (sk-1)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "Pk-1 (sk-1)",
      "lineHeight": 1.25
    },
    {
      "type": "arrow",
      "id": "oh-ap5",
      "x": 470,
      "y": 200,
      "width": 305,
      "height": 90,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 2
      },
      "seed": "s-50",
      "version": 1,
      "versionNonce": "v-51",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "points": [
        [
          0,
          0
        ],
        [
          305,
          90
        ]
      ],
      "lastCommittedPoint": null,
      "startBinding": null,
      "endBinding": null,
      "startArrowhead": null,
      "endArrowhead": "arrow"
    },
    {
      "type": "text",
      "id": "oh-mod",
      "x": 300,
      "y": 240,
      "width": 546,
      "height": 17,
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
      "seed": "s-52",
      "version": 1,
      "versionNonce": "v-53",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "position in partition p:  h % size_p   (sizes pairwise coprime)",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "position in partition p:  h % size_p   (sizes pairwise coprime)",
      "lineHeight": 1.25
    },
    {
      "type": "text",
      "id": "oh-n1",
      "x": 280,
      "y": 390,
      "width": 1241,
      "height": 35,
      "angle": 0,
      "strokeColor": "#555555",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "seed": "s-54",
      "version": 1,
      "versionNonce": "v-55",
      "isDeleted": false,
      "boundElements": [],
      "updated": 1,
      "text": "64-byte cache-line blocks (over-allocate + unsafe align) -> worst case 1 cache miss\nShardedAtomicFilter spreads concurrent writes across shards",
      "fontSize": 14,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "top",
      "baseline": 11,
      "containerId": null,
      "originalText": "64-byte cache-line blocks (over-allocate + unsafe align) -> worst case 1 cache miss\nShardedAtomicFilter spreads concurrent writes across shards",
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  }
}
```

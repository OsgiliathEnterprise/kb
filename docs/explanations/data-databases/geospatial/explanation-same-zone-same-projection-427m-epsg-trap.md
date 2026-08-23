---
title: 'Same Zone, Same Projection, 427 Metres Apart: EPSG Code Traps in PostGIS'
diataxis: Explanation
domain: Data & Databases
topic: Geospatial
source: DEV.to Tech News
source_url: https://dev.to/srdjan_poppovic/same-zone-same-projection-427-metres-apart-1k9a
date: 2026-08-23
keywords:
- knowledge-base
- Geospatial
- Data & Databases
- explanations
---
# Same Zone, Same Projection, 427 Metres Apart: EPSG Code Traps in PostGIS

## Overview

A field report on a bug found while writing about a LiDAR-survey ingestion system: the upload form's source-SRID dropdown offered **two codes with the same label** — `EPSG:31277` and `EPSG:8686`, both labelled "Gauss-Kruger zone 7". Reading the definitions from the database revealed the second one was **not a second definition of the same zone at all**: `8686` is **MGI 1901 / Slovenia Grid**, a different country's national grid, six degrees west. Pushing a Belgrade coordinate through it lands in Rajasthan, India — about 5,400 km off.

The second, more dangerous finding: the *correct* modern code `EPSG:3909` and the deprecated `EPSG:31277` describe zone 7 with **identical projection parameters**, differing only in how the datum reaches WGS 84 — an explicit three-parameter shift vs PROJ's built-in Hermannskogel datum. Same input through both: **426.73 metres apart**. That one *looks fine*: the data lands in the right country, city, and neighbourhood; nothing errors; you only notice when zooming in far enough to see the road inventory on the wrong side of the road.

## What the database says

You don't have to guess about an EPSG code — if you're running PostGIS, the definition is in `spatial_ref_sys`:

```sql
SELECT srid, proj4text FROM spatial_ref_sys WHERE srid IN (31277, 8686);
```

```
31277 | +proj=tmerc +lat_0=0 +lon_0=21 +k=0.9999 +x_0=7500000
       +datum=hermannskogel +units=m +no_defs
 8686 | +proj=tmerc +lat_0=0 +lon_0=15 +k=0.9999 +x_0=500000
       +ellps=bessel +towgs84=476.08,125.947,417.81,... +units=m +no_defs
```

Look at `lon_0`: **21 vs 15**. Look at `x_0`: **7,500,000 vs 500,000**. These are not two definitions of the same zone.

```sql
SELECT ST_AsText(ST_Transform(ST_SetSRID(ST_MakePoint(7457000, 4958000), 31277), 4326));
-- POINT(20.456 44.765)   Belgrade. Correct.

SELECT ST_AsText(ST_Transform(ST_SetSRID(ST_MakePoint(7457000, 4958000), 8686), 4326));
-- POINT(76.635 25.100)   Rajasthan, India. About 5,400 km off.
```

## Why the mistake was easy to make

The modern EPSG codes for this family are the `MGI 1901 / Balkans zone N` series:

```sql
SELECT srid, srtext FROM spatial_ref_sys WHERE srtext LIKE '%MGI 1901%Balkans%';
```

```
3907  MGI 1901 / Balkans zone 5   lon_0=15
3908  MGI 1901 / Balkans zone 6   lon_0=18
3909  MGI 1901 / Balkans zone 7   lon_0=21
3910  MGI 1901 / Balkans zone 8   lon_0=24

8677  MGI 1901 / Balkans zone 5   lon_0=15
8678  MGI 1901 / Balkans zone 6   lon_0=18
8679  MGI 1901 / Balkans zone 8   lon_0=24
```

Read the second block again: **8677 is zone 5, 8678 is zone 6, and 8679 is zone 8. The `867x` series skips zone 7** — it already had `3909` and the later batch didn't re-issue it. Anyone scanning that numeric range for "the modern zone 7 code" finds a gap where pattern-matching expects a hit, surrounded by real, plausible, same-datum-family codes. `8686` is one of those nearby numbers: real, same datum family, same region, **wrong country**. The correct code for Gauss-Krüger zone 7 in this region is **EPSG:3909**.

## The trap that actually matters

`31277` and `3909` both describe Gauss-Krüger zone 7. Every projection parameter is identical — same central meridian, scale factor, false easting, ellipsoid:

```
3909   +proj=tmerc +lat_0=0 +lon_0=21 +k=0.9999 +x_0=7500000 +ellps=bessel
       +towgs84=682,-203,480,0,0,0,0
31277  +proj=tmerc +lat_0=0 +lon_0=21 +k=0.9999 +x_0=7500000
       +datum=hermannskogel
```

The only difference is how the datum reaches WGS 84: an explicit three-parameter shift in one, PROJ's built-in Hermannskogel datum in the other — a parameter you have to scroll sideways to notice.

```
3909   POINT(20.451342 44.765252)
31277  POINT(20.456732 44.765230)
-- distance between them: 426.73 metres
```

**Why 427 m is worse than 5,400 km:** five thousand kilometres announces itself (the layer isn't on the map; found in thirty seconds). Four hundred metres puts data in the right country, right city, right neighbourhood — zoom out and both versions are the same pixel. It only becomes visible when someone zooms in far enough to notice the road inventory is on the wrong side of the road, in a dataset whose entire value proposition is sub-metre accuracy.

## Why there are two in the first place

`31277` is **deprecated** in the EPSG registry (older realization; datum via Hermannskogel). `3909` is current, with an explicit WGS 84 shift. But *deprecated ≠ unused*: decades of surveying in the region were done, stored, and delivered in the older definition, and files still arrive that way. Offering only the modern code silently applies the wrong datum shift to legacy data — the same 427 m error in the other direction. **Both belong in the dropdown; what doesn't belong is giving them the same label.**

## The fix

```python
SOURCE_SRID_CHOICES = [
    (32634, 'UTM zone 34N — WGS 84 (EPSG:32634)'),
    (3909,  'Gauss-Krüger zone 7 — MGI 1901 (EPSG:3909)'),
    (31277, 'Gauss-Krüger zone 7 — MGI/Hermannskogel, legacy (EPSG:31277)'),
]
```

`8686` is gone; `3909` replaces it; the two remaining zone-7 entries name their datum, because **the datum is the entire difference between them**.

## Lessons (the actionable part)

1. **Read `spatial_ref_sys` instead of trusting the label.** `SELECT proj4text` takes five seconds and tells you the central meridian, false easting, and datum. Every mistake in this post was visible in that one column.
2. **Compare `lon_0` and `x_0` first.** They produce the catastrophic, *obvious* errors, so they're the cheapest to check. If those match and you still have two codes, the difference is in the **datum** — the expensive, quiet kind.
3. **Add a plausibility check on transformed coordinates.** One bounding-box test (does the result land inside the country this data belongs to?) would have caught the 5,400 km mistake at upload time. It would *not* have caught the 427 m one — which is the point: cheap checks catch loud failures, and you must know they don't catch quiet ones.
4. **Never label two coordinate systems identically.** If the user has to choose between them, the label has to contain the thing that differs. "Gauss-Krüger zone 7" twice is not a choice; it's a coin flip with a 427 m stake.

Gap-filled numbering, deprecated-but-still-in-use codes, and neighbouring countries sharing a datum family are the residue of a century of national surveying encoded into a flat integer namespace. The registry is doing its job; **the label was doing yours, badly.**

## Diagram: the three-code trap

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "c31277",
      "type": "rectangle",
      "x": 40, "y": 40,
      "width": 200, "height": 90,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "EPSG:31277 (deprecated)\nz7, Hermannskogel datum\nlegacy surveying data", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "c3909",
      "type": "rectangle",
      "x": 40, "y": 190,
      "width": 200, "height": 90,
      "strokeColor": "#30665c",
      "backgroundColor": "#c4e0c5",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "EPSG:3909 (current)\nz7, explicit towgs84\nmodern data", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "gap",
      "type": "rectangle",
      "x": 320, "y": 40,
      "width": 200, "height": 90,
      "strokeColor": "#999",
      "backgroundColor": "#eee",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "text": { "content": "867x series SKIPS z7\n(3909 owns zone 7)\npattern-match trap", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "c8686",
      "type": "rectangle",
      "x": 320, "y": 190,
      "width": 200, "height": 90,
      "strokeColor": "#c0345c",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "EPSG:8686 = SLOVENIA GRID\nlon_0=15, x_0=500000\nwrong country, ~5400 km", "fontSize": 12, "fontFamily": 1 }
    },
    {
      "id": "dist",
      "type": "text",
      "x": 240, "y": 300,
      "text": { "content": "31277 vs 3909: same projection,\ndatum differs -> 426.73 m apart\n(quiet error, looks fine)", "fontSize": 12, "fontFamily": 1 }
    }
  ]
}
```

## References

- [Same Zone, Same Projection, 427 Metres Apart (dev.to, original)](https://dev.to/srdjan_poppovic/same-zone-same-projection-427-metres-apart-1k9a)
- [EPSG Geodetic Parameter Dataset (registry)](https://www.epsg.org/)
- [PROJ: coordinate operations and datum shifts](https://proj.org/)
- [PostGIS: spatial_ref_sys catalog](https://postgis.net/docs/using_postgis_dbmanager.html)

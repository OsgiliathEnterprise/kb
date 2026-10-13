---
title: 'Making Big Downloads Resumable in Firefox: The network.http.response.timeout
  Fix'
diataxis: How-to Guide
domain: developer-tools-practices
topic: browser-internals
source: HackerNews
source_url: https://lunarwatcher.codeberg.page/til/firefox/resumable-big-downloads.html
date: 2026-10-13
keywords:
- knowledge-base
- browser-internals
- developer-tools-practices
- how-to
---
# Making Big Downloads Resumable in Firefox: The network.http.response.timeout Fix

## Goal

Get Firefox to actually resume interrupted large downloads (and make them a bit more stable in general), when the server supports resumable transfers.

## Background

Firefox 28 and newer — i.e. every modern version since ~2014 (see the [original 2014 note](https://morgb.blogspot.com/2014/05/firefox-29-and-http-response-timeout.html) on `network.http.response.timeout`) — ships with `network.http.response.timeout` set to **300 seconds**. This interferes with resuming big downloads and with their general stability: when a long transfer exceeds the timeout, the browser's handling of the failure appears to interfere with its ability to resume what it already downloaded.

```excalidraw
{
  "type": "drawing",
  "version": 2,
  "source": "https://github.com/excalidraw/excalidraw",
  "elements": [
    {
      "id": "b1",
      "type": "rectangle",
      "x": 40,
      "y": 160,
      "width": 250,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Default: network.http.response.timeout = 300 s\nlong transfer exceeds timeout\nhidden retries get interrupted\n.part NOT resumed on error", "fontSize": 14, "fontFamily": 1 }
    },
    {
      "id": "b2",
      "type": "rectangle",
      "x": 360,
      "y": 160,
      "width": 250,
      "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#b8e6b8",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "text": { "content": "Fix: set timeout to 0 (or very large)\nin about:config\ndownloads resumable + more stable\n(server must support resumption)", "fontSize": 14, "fontFamily": 1 }
    },
    [
      {
        "id": "a1",
        "type": "arrow",
        "x": 290,
        "y": 210,
        "width": 70,
        "height": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "points": [ [0, 0], [70, 0] ]
      }
    ]
  ],
  "appState": { "viewBackgroundColor": "#ffffff" }
}
```

## Steps

1. Open `about:config` in Firefox and accept the warning.
2. Find `network.http.response.timeout` (type is `int`).
3. Set it to **`0`** (disabled) or a very large value.
4. Verify on a large file from a server that supports Range requests: interrupt the download, then resume — the existing `.part` file should be used instead of starting over.

## Prerequisites and Caveats

- **The server must support resumable downloads** (HTTP Range requests). No Firefox setting helps if the server can't resume.
- **The exact mechanism is not fully understood.** Experimentally, Firefox appears to rely on connection timeouts rather than the `.part` files it downloads when resuming: without the timeout change, Firefox will happily **ignore an existing `.part`** file and start over. The author could not locate the responsible code in Firefox's source.
- **Firefox also appears to do hidden retries** before declaring a download failed, and exceeding `network.http.response.timeout` interferes with that retry process — disabling the timeout appears to let the retries (and thus resumption) work.
- **Resumable downloads in Firefox are unstable in general** — a known problem in some form [since at least 2005](https://forums.mozillazine.org/viewtopic.php?t=238764). There is even a [manual `.part` shuffle workaround](https://superuser.com/a/1103144) to force Firefox to resume; this howto's setting-based fix avoids that.

## Non-Firefox Fallback

When the server supports resumption, `wget` is a stable alternative:

```shell
wget -c -O "$filename" "$url"
```

`wget -c` (continue) is fairly stable overall and is the recommended escape hatch for unreliable browser-based resumption.

## Verification

After the change, the observable behavior is: interrupt a long download (network drop or manual cancel), then resume — the transfer continues from the `.part` offset instead of restarting at byte 0. If it still restarts, check that the server actually returns `206 Partial Content` for Range requests (e.g. with `curl -r 0-100 -I <url>`).

## References

- [Making big downloads resumable in firefox — Olivia (lunarwatcher.codeberg.page), CC-by-SA 4.0 text / MIT code](https://lunarwatcher.codeberg.page/til/firefox/resumable-big-downloads.html)
- [Firefox 29 and the HTTP response timeout — original 2014 note (morgb.blogspot.com)](https://morgb.blogspot.com/2014/05/firefox-29-and-http-response-timeout.html)
- [Long-running discussion of Firefox download instability (mozillazine forums, 2005)](https://forums.mozillazine.org/viewtopic.php?t=238764)
- [Manual .part shuffle workaround (Super User answer)](https://superuser.com/a/1103144)

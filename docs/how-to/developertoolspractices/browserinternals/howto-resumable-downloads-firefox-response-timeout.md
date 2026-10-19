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

Firefox 28 and newer — i.e. every modern version since ~2014 (see the [original 2014 note](https://morgb.blogspot.com/2014/05/firefox-29-and-http-response-timeout.html) on `network.http.response.timeout`) — ships with `network.http.response.timeout` set to **300 seconds**. That default is still current on `firefox-main`: `modules/libpref/init/all.js` sets `pref("network.http.response.timeout", 300);` ([searchfox, line 1131](https://searchfox.org/firefox-main/source/modules/libpref/init/all.js#1131)). This interferes with resuming big downloads and with their general stability: when a long transfer exceeds the timeout, the browser's handling of the failure appears to interfere with its ability to resume what it already downloaded.

**Upstream history.** The pref's behavior with long-lived connections was upstream bug [1024015](https://bugzilla.mozilla.org/show_bug.cgi?id=1024015) ("network.http.response.timeout breaks applications with long lived http connections", 2014, RESOLVED FIXED in Firefox 31–33): the fix made the response timeout apply only when TCP keepalives are *disabled* for HTTP — so on modern Firefox the effective timeout semantics also depend on keepalive state. A related bug, [1060202](https://bugzilla.mozilla.org/show_bug.cgi?id=1060202) ("HTTP Response timeout not working as configured in Firefox", RESOLVED WORKSFORME), documents that the pref did not always behave as its name suggests — another reason to verify the observable behavior rather than trust the setting alone.

**Sibling timeout prefs.** `network.http.response.timeout` is one of several network timeout knobs in `about:config`; knowing the others prevents misdiagnosis when long transfers time out:

| Pref | Default | Scope |
| --- | --- | --- |
| `network.http.response.timeout` | 300 s | No data received within this window → response fails (the pref this howto targets) |
| `network.http.connection-timeout` | 90 s | TCP connect timeout |
| `network.http.keep-alive.timeout` | 115 s | Idle keep-alive connection lifetime |
| `network.http.connection-retry-timeout` | 250 s | How long a request may wait for a free connection |
| `network.http.pipelining.read-timeout` | 30 s | Pipelined request read timeout |

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

## Manual .part Backup and Add-on Alternatives

- **Backup the `.part` before restarting Firefox.** The official [Mozilla Support procedure for resuming an interrupted download](https://support.mozilla.org/en-US/questions/1220917) is: back up the `.part` file before starting Firefox, then let Firefox see the existing partial file. Firefox keeps two files during a download — the final filename (empty until completion) and the `.part` working file — so the `.part` is what actually carries the already-downloaded bytes ([Super User](https://superuser.com/questions/1103143/how-can-i-resume-an-interrupted-firefox-download)).
- **Add-on alternatives.** If the setting-based fix isn't enough, two add-ons automate resumption: [Restart Interrupted Downloads](https://addons.mozilla.org/en-US/firefox/addon/restart-interrupted-downloads/) (automatically resumes interrupted downloads) and [Download Auto Resumer](https://download-auto-resumer.en.softonic.com/firefox/extension) (retries downloads that failed with `NETWORK_FAILED`). These complement rather than replace the `network.http.response.timeout` change — the add-on restarts the transfer, the pref change stops Firefox from tearing down the transfer in the first place.

## Verification

After the change, the observable behavior is: interrupt a long download (network drop or manual cancel), then resume — the transfer continues from the `.part` offset instead of restarting at byte 0. If it still restarts, check that the server actually returns `206 Partial Content` for Range requests (e.g. with `curl -r 0-100 -I <url>`).

## References

- [Making big downloads resumable in firefox — Olivia (lunarwatcher.codeberg.page), CC-by-SA 4.0 text / MIT code](https://lunarwatcher.codeberg.page/til/firefox/resumable-big-downloads.html)
- [Firefox 29 and the HTTP response timeout — original 2014 note (morgb.blogspot.com)](https://morgb.blogspot.com/2014/05/firefox-29-and-http-response-timeout.html)
- [Long-running discussion of Firefox download instability (mozillazine forums, 2005)](https://forums.mozillazine.org/viewtopic.php?t=238764)
- [Manual .part shuffle workaround (Super User answer)](https://superuser.com/a/1103144)
- [Searchfox — `network.http.response.timeout` default (300) in firefox-main `modules/libpref/init/all.js`](https://searchfox.org/firefox-main/source/modules/libpref/init/all.js#1131) — confirms the 300 s default is still shipped as of 2026
- [Bug 1024015 — network.http.response.timeout breaks long-lived HTTP connections (RESOLVED FIXED, Firefox 31–33)](https://bugzilla.mozilla.org/show_bug.cgi?id=1024015) — upstream history; response timeout applies when TCP keepalives are disabled for HTTP
- [Bug 1060202 — HTTP Response timeout not working as configured (RESOLVED WORKSFORME)](https://bugzilla.mozilla.org/show_bug.cgi?id=1060202)
- [How to resume interrupted download? (.part file is available) — Mozilla Support](https://support.mozilla.org/en-US/questions/1220917) — official `.part` backup procedure
- [How can I resume an interrupted Firefox download? — Super User](https://superuser.com/questions/1103143/how-can-i-resume-an-interrupted-firefox-download) — the two-file (`.part` vs final name) mechanics
- [Restart Interrupted Downloads — Firefox add-on](https://addons.mozilla.org/en-US/firefox/addon/restart-interrupted-downloads/) — automatic resumption alternative

## Further Reading (added 2026-10-19 by KB Zookeeper audit)

- [Making big downloads resumable in Firefox](https://www.headlinne.com/articles/making-big-downloads-resumable-in-firefox-hacker-news) — Setting network.http.response.timeout to 0 (or something very big) in about:config seems to make big downloads both resumable and at least a little more stable.
- [Making Big Downloads Resumable In Firefox - QAtrial](https://qatrial.com/developer-open-source/making-big-downloads-resumable-in-firefox/) — “Setting network.http.response.timeout to 0 (or something very big) in about:config seems to make big downloads both resumable and at least a little more…
- [Making big downloads resumable in Firefox | Remix Hacker News](https://news.mcan.sh/item/50061791) — userbinator 7 hours ago Resumable downloads in firefox generally appear to be fairly unstable though. My network.http.response.timeout is the default of 300.

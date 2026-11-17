---
title: How to Record a YouTube Live Stream with yt-dlp (Flags That Actually Matter)
diataxis: How-to Guide
domain: programming
topic: web-scraping
source: DEV.to Tech News
source_url: https://dev.to/yyildiz/recording-a-youtube-live-stream-with-yt-dlp-the-flags-that-actually-matter-cca
date: 2026-11-17
keywords:
- knowledge-base
- web-scraping
- programming
- how-to
---
# How to Record a YouTube Live Stream with yt-dlp (Flags That Actually Matter)

A live stream is not a finished file — it's an ongoing HLS feed, so a few flags decide whether you get the whole broadcast, just the tail, or a corrupt file. This note distils the flags that matter and the failure modes that don't show up with VOD downloads.

## 1. Record from now (basic capture)

```bash
yt-dlp "https://www.youtube.com/watch?v=VIDEO_ID"
```

Pointed at a live stream, the plain command records from the current moment until the broadcast ends (or Ctrl-C). The live URL is the same `/watch?v=` URL as any normal video — no special flag needed.

## 2. Catch the stream from the start

```bash
yt-dlp --live-from-start "https://www.youtube.com/watch?v=VIDEO_ID"
```

By default yt-dlp joins where the DVR window currently is — everything broadcast before you ran the command is gone. `--live-from-start` rewinds to the beginning by walking every fragment: slower and a lot more data on long streams, but the only way to get the opening.

## 3. Wait for a stream that hasn't started

```bash
yt-dlp --wait-for-video 30-600 --live-from-start "URL"
```

A plain command errors out if the stream isn't live yet. `--wait-for-video MIN-MAX` re-checks at randomised intervals between MIN and MAX seconds and starts the instant the stream goes live — leave it running ahead of a scheduled premiere.

## 4. Survive an interrupted capture

```bash
yt-dlp --live-from-start --hls-use-mpegts -N 4 "URL"
```

- `--hls-use-mpegts` writes into an **MPEG-TS container**, which stays playable even if the process dies mid-stream — you keep the partial recording instead of a corrupt MP4.
- `-N 4` downloads 4 fragments concurrently to keep up with high-bitrate streams.
- After a clean finish, convert for portability: `--remux-video mp4` (stream copy, no re-encode).

## Failure modes (why live is harder than VOD)

| Problem | What happens | Mitigation |
|---|---|---|
| **No retry in live** | A failed fragment can't be re-requested — there's no going back in time; a network drop = permanent gap | `--hls-use-mpegts` so the gap still leaves a playable file |
| **PO token required** | Some live formats vanish or the capture stops early without a PO token | Keep yt-dlp current; missing formats is the tell |
| **Player changes** | Live extraction breaks faster than normal downloads | Run `yt-dlp -U` *before* a scheduled capture, not during |
| **Datacenter IPs** | YouTube throttles/blocks server IPs harder than residential; on live, a mid-stream block is a permanent gap | Capture from a clean residential IP when possible |

## References

- [Original guide — Recording a YouTube live stream with yt-dlp (DEV.to)](https://dev.to/yyildiz/recording-a-youtube-live-stream-with-yt-dlp-the-flags-that-actually-matter-cca)
- [Extended guides at ytdlp.org](https://ytdlp.org/guides/yt-dlp-download-youtube-live)
- [yt-dlp project on GitHub](https://github.com/yt-dlp/yt-dlp)
